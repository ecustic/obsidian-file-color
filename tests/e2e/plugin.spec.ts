import { test, expect } from './helpers'
import type { ElectronApplication, Page } from '@playwright/test'
import { attachElectronFailureArtifacts, closeAndCleanup, explorerItem, getFileMenuTitles, getPluginData, launchVault, openColorMenu, openSettings, saveSettings } from './setup/helpers'

const palette = [{ id: 'red', name: 'Red', value: '#ff0000' }]

test('plugin starts in the fixture vault and contributes Set color to file and folder menus', async ({ page, vaultPath }) => {
  expect(await page.evaluate(() => Boolean((window as any).app.plugins.plugins['obsidian-file-color']))).toBe(true)
  for (const path of ['Root Note.md', 'Folder A']) {
    expect(await getFileMenuTitles(page, path)).toContain('Set color')
  }
  await openColorMenu(page, vaultPath, 'Root Note.md')
  await expect(page.getByText('None', { exact: true })).toBeVisible()
  await expect(page.getByText('Set color', { exact: true }).last()).toBeVisible()
})

test('color selection and None apply and remove file explorer classes', async ({ page, vaultPath }) => {
  await saveSettings(page, { palette })
  await openColorMenu(page, vaultPath, 'Root Note.md')
  await page.getByText('Red', { exact: true }).click()
  await expect(explorerItem(page, vaultPath, 'Root Note.md')).toHaveClass(/file-color-file/)
  await expect(explorerItem(page, vaultPath, 'Root Note.md')).toHaveClass(/file-color-color-red/)
  await openColorMenu(page, vaultPath, 'Root Note.md')
  await page.getByText('None', { exact: true }).click()
  await expect(explorerItem(page, vaultPath, 'Root Note.md')).not.toHaveClass(/file-color-file/)
  await expect.poll(async () => (await getPluginData(page))?.fileColors).toEqual([])
})

test('settings can add and save a palette color that appears in the modal', async ({ page, vaultPath }) => {
  await openSettings(page)
  await page.getByRole('button', { name: /add color/i }).click()
  const colorName = page.getByPlaceholder('Color name').last()
  await colorName.fill('Ocean')
  await page.getByRole('button', { name: 'Save' }).click()
  await expect.poll(async () => (await getPluginData(page))?.palette).toContainEqual(expect.objectContaining({ name: 'Ocean' }))
  await page.keyboard.press('Escape')
  await openColorMenu(page, vaultPath, 'Root Note.md')
  await expect(page.getByText('Ocean', { exact: true })).toBeVisible()
})

test('background and cascade options change file and folder classes', async ({ page, vaultPath }) => {
  await saveSettings(page, { palette, fileColors: [{ path: 'Root Note.md', color: 'red' }, { path: 'Folder A', color: 'red' }] })
  await openSettings(page)
  await page.locator('.setting-item.mod-toggle').filter({ hasText: 'Color Background' }).locator('.checkbox-container').click()
  await expect(explorerItem(page, vaultPath, 'Root Note.md')).toHaveClass(/file-color-type-background/)
  await page.locator('.setting-item.mod-toggle').filter({ hasText: 'Cascade Colors' }).locator('.checkbox-container').click()
  await expect(explorerItem(page, vaultPath, 'Folder A')).toHaveClass(/file-color-cascade/)
})

test('rename and delete events update persisted color paths', async ({ page }) => {
  await saveSettings(page, { palette, fileColors: [{ path: 'Root Note.md', color: 'red' }] })
  await page.evaluate(async () => {
    const app = (window as any).app
    await app.vault.rename(app.vault.getAbstractFileByPath('Root Note.md'), 'Renamed Note.md')
  })
  await expect.poll(async () => (await getPluginData(page))?.fileColors).toEqual([{ path: 'Renamed Note.md', color: 'red' }])
  await page.evaluate(async () => {
    const app = (window as any).app
    await app.vault.delete(app.vault.getAbstractFileByPath('Renamed Note.md'))
  })
  await expect.poll(async () => (await getPluginData(page))?.fileColors).toEqual([])
})

test('color and settings persist after relaunch in the same isolated vault', async ({ vaultPath }, testInfo) => {
  let activeApp: ElectronApplication | undefined
  let activePage: Page | undefined
  let failed = false
  try {
    activeApp = (await launchVault(vaultPath)).app
    activePage = activeApp.windows()[activeApp.windows().length - 1]
    await activeApp.context().tracing.start({ screenshots: true, snapshots: true, sources: true })
    activePage.on('console', (message) => {
      if (message.type() === 'error') console.error(`Obsidian console error: ${message.text()}`)
    })
    const page = activePage
    await saveSettings(page, { palette, colorBackground: true, fileColors: [{ path: 'Root Note.md', color: 'red' }] })
    await expect.poll(async () => (await getPluginData(page))?.fileColors).toEqual([{ path: 'Root Note.md', color: 'red' }])
    await activeApp.context().tracing.stop().catch(() => undefined)
    await activeApp.close()
    activeApp = undefined
    activePage = undefined
    activeApp = (await launchVault(vaultPath)).app
    activePage = activeApp.windows()[activeApp.windows().length - 1]
    await activeApp.context().tracing.start({ screenshots: true, snapshots: true, sources: true })
    const relaunched = activePage
    await expect.poll(async () => (await getPluginData(relaunched))?.colorBackground).toBe(true)
    await expect.poll(async () => (await getPluginData(relaunched))?.fileColors).toEqual([{ path: 'Root Note.md', color: 'red' }])
    await expect(explorerItem(relaunched, vaultPath, 'Root Note.md')).toHaveClass(/file-color-type-background/)
  } catch (error) {
    failed = true
    if (activeApp && activePage) await attachElectronFailureArtifacts(activeApp, activePage, testInfo, [])
    await testInfo.attach('persistence-test-error', {
      body: error instanceof Error ? error.stack || error.message : String(error),
      contentType: 'text/plain',
    }).catch(() => undefined)
    throw error
  } finally {
    await closeAndCleanup(activeApp, vaultPath, failed)
  }
})
