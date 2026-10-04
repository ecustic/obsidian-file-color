import { test as base, expect, type ElectronApplication, type Page } from '@playwright/test'
import fs from 'fs'
import { attachElectronFailureArtifacts, closeAndCleanup, createVault, launchVault } from './setup/helpers'

type Fixtures = { vaultPath: string; app: ElectronApplication; page: Page }

export const test = base.extend<Fixtures>({
  vaultPath: async ({}, use, testInfo) => {
    const vaultPath = createVault(testInfo.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase())
    await use(vaultPath)
    if (testInfo.status !== testInfo.expectedStatus && fs.existsSync(vaultPath)) {
      console.error(`E2E failure retained at vault: ${vaultPath}`)
    }
  },
  app: async ({ vaultPath }, use, testInfo) => {
    const consoleErrors: string[] = []
    let app: ElectronApplication | undefined
    let tracing = false
    const captureConsole = (page: Page) => {
      page.on('console', (message) => {
        if (message.type() === 'error') consoleErrors.push(message.text())
      })
    }
    try {
      const launched = await launchVault(vaultPath)
      app = launched.app
      for (const page of app.windows()) captureConsole(page)
      app.on('window', captureConsole)
      await app.context().tracing.start({ screenshots: true, snapshots: true, sources: true })
      tracing = true
      await use(app)
    } catch (error) {
      if (testInfo.status === 'passed') {
        await testInfo.attach('electron-launch-error', {
          body: error instanceof Error ? error.stack || error.message : String(error),
          contentType: 'text/plain',
        }).catch(() => undefined)
      }
      throw error
    } finally {
      const failed = testInfo.status !== testInfo.expectedStatus
      if (app && failed) {
        const page = app.windows()[app.windows().length - 1]
        if (tracing) await attachElectronFailureArtifacts(app, page, testInfo, consoleErrors)
      } else if (app && tracing) {
        await app.context().tracing.stop().catch(() => undefined)
      }
      await closeAndCleanup(app, vaultPath, failed)
    }
  },
  page: async ({ app }, use) => {
    await use(app.windows()[app.windows().length - 1])
  },
})

export { expect }
