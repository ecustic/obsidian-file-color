import fs from 'fs'
import path from 'path'
import { _electron as electron, type ElectronApplication, type Page, type TestInfo } from '@playwright/test'
import manifest from '../../../manifest.json'

const root = path.resolve(__dirname, '../../..')
const sourceVault = path.join(__dirname, 'test-vault')
const vaultRoot = path.join(root, 'tests/e2e/test-vaults')
const pluginId = manifest.id

export function assertObsidianSetup() {
  const unpackedEntry = path.join(root, '.obsidian-unpacked/main.js')
  if (!fs.existsSync(unpackedEntry)) {
    throw new Error('Obsidian is not unpacked. Run npm run e2e:setup after setting OBSIDIAN_PATH.')
  }
  const electronVersionPath = path.join(root, '.obsidian-unpacked/electron-version')
  if (!fs.existsSync(electronVersionPath)) {
    throw new Error('Could not determine the Obsidian Electron version. Set up from a macOS Obsidian.app bundle.')
  }
  const appElectronVersion = fs.readFileSync(electronVersionPath, 'utf8').trim()
  const runtimePackage = JSON.parse(fs.readFileSync(require.resolve('electron/package.json'), 'utf8'))
  if (runtimePackage.version !== appElectronVersion) {
    throw new Error(`Electron runtime mismatch: Obsidian uses ${appElectronVersion}, but npm electron is ${runtimePackage.version}. Use the matching Electron dependency.`)
  }
  for (const file of ['main.js', 'manifest.json', 'styles.css']) {
    if (!fs.existsSync(path.join(root, file))) throw new Error(`Missing built plugin file: ${file}`)
  }
}

export function createVault(label = 'test') {
  fs.mkdirSync(vaultRoot, { recursive: true })
  const vaultPath = fs.mkdtempSync(path.join(vaultRoot, `${label}-`))
  fs.cpSync(sourceVault, vaultPath, { recursive: true })
  const pluginPath = path.join(vaultPath, '.obsidian/plugins', pluginId)
  fs.mkdirSync(pluginPath, { recursive: true })
  for (const file of ['main.js', 'manifest.json', 'styles.css']) {
    const source = path.join(root, file)
    const destination = path.join(pluginPath, file)
    try {
      fs.symlinkSync(source, destination)
    } catch {
      fs.copyFileSync(source, destination)
    }
  }
  return vaultPath
}

export async function launchVault(vaultPath: string) {
  assertObsidianSetup()
  const userDataDir = path.join(vaultPath, '.user-data')
  fs.mkdirSync(userDataDir, { recursive: true })
  const mainScript = path.join(root, '.obsidian-unpacked/main.js')
  // Chromium switches must precede Electron's app entrypoint. Arguments after
  // main.js are delivered to the app and do not configure the user-data path.
  const args = [
    `--user-data-dir=${userDataDir}`,
    '--disable-gpu',
    '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE localhost, EXCLUDE 127.0.0.1',
    ...(process.platform === 'linux' ? ['--no-sandbox'] : []),
    mainScript,
  ]
  const app = await electron.launch({
    args,
    env: {
      ...process.env,
      ELECTRON_DISABLE_SECURITY_WARNINGS: 'true',
      ELECTRON_ENABLE_LOGGING: '1',
    },
    timeout: 45_000,
  })
  try {
    const launcher = await app.firstWindow()
    await launcher.waitForLoadState('domcontentloaded').catch(() => undefined)
    await app.evaluate(({ dialog }, selectedVault) => {
      dialog.showOpenDialogSync = () => [selectedVault]
      dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [selectedVault] })
    }, vaultPath)
    const openButton = launcher.getByRole('button', { name: /^open$/i })
    if (await openButton.count()) {
      await openButton.click()
      await app.waitForEvent('window', { timeout: 60_000 })
    }
    const page = app.windows()[app.windows().length - 1]
    await page.waitForLoadState('domcontentloaded').catch(() => undefined)
    const trust = page.getByText('Trust author and enable plugins', { exact: true })
    if (await trust.waitFor({ state: 'visible', timeout: 5_000 }).then(() => true, () => false)) await trust.click()
    const enable = page.getByRole('button', { name: /enable community plugins/i })
    if (await enable.waitFor({ state: 'visible', timeout: 1_000 }).then(() => true, () => false)) await enable.click()
    await page.evaluate(async (id) => {
      const app = (window as any).app
      if (!app.plugins.plugins[id]) await app.plugins.enablePluginAndSave(id)
    }, pluginId)
    await page.waitForFunction((id) => Boolean((window as any).app?.plugins?.plugins?.[id]), pluginId, { timeout: 15_000 })
    // Trusting a fixture vault can leave Obsidian on Community Plugins settings.
    // Close that startup pane so file-explorer interactions are not obscured.
    const closeSettings = page.locator('.modal-container .modal-close-button').last()
    if (await closeSettings.count()) await closeSettings.click({ force: true })
    await page.keyboard.press('Escape')
    await page.locator('.modal-container').waitFor({ state: 'hidden', timeout: 2_000 }).catch(() => undefined)
    await page.waitForTimeout(2_000)
    return { app, page }
  } catch (error) {
    await app.close().catch(() => undefined)
    throw error
  }
}

export async function closeApp(app: ElectronApplication) {
  await app.close().catch(() => undefined)
}

export async function closeAndCleanup(app: ElectronApplication | undefined, vaultPath: string, retain = false) {
  if (app) await closeApp(app)
  if (!retain && process.env.E2E_CLEANUP !== '0') {
    fs.rmSync(vaultPath, { recursive: true, force: true })
  } else {
    console.log(`Preserved E2E vault: ${vaultPath}`)
  }
}

export async function attachElectronFailureArtifacts(
  app: ElectronApplication,
  page: Page,
  testInfo: TestInfo,
  consoleErrors: string[]
) {
  const tracePath = testInfo.outputPath('electron-trace.zip')
  const screenshotPath = testInfo.outputPath('electron-window.png')
  await app.context().tracing.stop({ path: tracePath }).catch(() => undefined)
  await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => undefined)
  await testInfo.attach('electron-trace', { path: tracePath, contentType: 'application/zip' }).catch(() => undefined)
  await testInfo.attach('electron-window', { path: screenshotPath, contentType: 'image/png' }).catch(() => undefined)
  await testInfo.attach('electron-console-errors', {
    body: consoleErrors.join('\n') || 'No browser console errors were recorded.',
    contentType: 'text/plain',
  })
}

export function explorerItem(page: Page, vaultPath: string, relativePath: string) {
  void vaultPath
  // Obsidian 1.8 places data-path on the title element; the plugin decorates
  // its containing .tree-item (fileItem.el) instead.
  return page.locator(`[data-path="${relativePath.replace(/"/g, '\\"')}"]`).first().locator('xpath=..')
}

export async function openColorMenu(page: Page, vaultPath: string, relativePath: string) {
  void vaultPath
  await page.evaluate(({ filePath }) => {
    const app = (window as any).app
    const file = app.vault.getAbstractFileByPath(filePath)
    let click: (() => void) | undefined
    const menu = {
      addItem(callback: (item: any) => void) {
        callback({
          setTitle(title: string) { (window as any).__fileColorMenuTitle = title; return this },
          setIcon() { return this },
          onClick(handler: () => void) { click = handler; return this },
        })
      },
    }
    app.workspace.trigger('file-menu', menu, file)
    if ((window as any).__fileColorMenuTitle !== 'Set color' || !click) {
      throw new Error(`Plugin did not add Set color to the file menu for ${filePath}`)
    }
    click()
  }, { filePath: relativePath })
  await page.getByText('None', { exact: true }).waitFor()
}

export async function getFileMenuTitles(page: Page, relativePath: string) {
  return page.evaluate((filePath) => {
    const app = (window as any).app
    const file = app.vault.getAbstractFileByPath(filePath)
    const titles: string[] = []
    const menu = {
      addItem(callback: (item: any) => void) {
        callback({ setTitle(title: string) { titles.push(title); return this }, setIcon() { return this }, onClick() { return this } })
      },
    }
    app.workspace.trigger('file-menu', menu, file)
    return titles
  }, relativePath)
}

export async function getPluginData(page: Page) {
  return page.evaluate(async (id) => {
    const plugin = (window as any).app.plugins.plugins[id]
    return plugin ? plugin.settings : null
  }, pluginId)
}

export async function saveSettings(page: Page, patch: Record<string, unknown>) {
  await page.evaluate(async ({ id, patch: changes }) => {
    const plugin = (window as any).app.plugins.plugins[id]
    Object.assign(plugin.settings, changes)
    await plugin.saveSettings(true)
    plugin.generateColorStyles()
    plugin.applyColorStyles()
  }, { id: pluginId, patch })
  await page.waitForTimeout(250)
}

export async function openSettings(page: Page) {
  await page.evaluate(async (id) => {
    const app = (window as any).app
    await app.setting.open()
    app.setting.openTabById(id)
  }, pluginId)
  await page.getByText('Palette', { exact: true }).waitFor()
}
