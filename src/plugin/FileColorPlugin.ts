import { debounce, MenuItem, Notice, Plugin } from 'obsidian'
import { SetColorModal } from 'plugin/SetColorModal'
import { FileColorSettingTab } from 'plugin/FileColorSettingTab'

import type { FileColorPluginSettings } from 'settings'
import { defaultSettings } from 'settings'

export class FileColorPlugin extends Plugin {
  settings: FileColorPluginSettings = defaultSettings
  saveSettingsInternalDebounced = debounce(this.saveSettingsInternal, 3000, true);
  // Modification time of data.json when the plugin last read or wrote it.
  // null means the file did not exist or has not been checked yet.
  private settingsFileMtime: number | null = null

  async onload() {
    await this.loadSettings()

    this.registerEvent(
      this.app.workspace.on('file-menu', (menu, file) => {
        const addFileColorMenuItem = (item: MenuItem) => {
          item.setTitle('Set color')
          item.setIcon('palette')
          item.onClick(() => {
            new SetColorModal(this, file).open()
          })
        }

        menu.addItem(addFileColorMenuItem)
      })
    )

    this.app.workspace.onLayoutReady(async () => {
      this.generateColorStyles()
      this.applyColorStyles()
    })

    this.registerEvent(
      this.app.workspace.on('layout-change', () => this.applyColorStyles())
    )

    this.registerEvent(
      this.app.vault.on('rename', async (newFile, oldPath) => {
        const renamed = this.settings.fileColors.filter(
          (fileColor) => fileColor.path === oldPath
        )
        // Only write when a colored file moved. Writing on every rename
        // lets a device with stale settings overwrite the synced file.
        if (renamed.length > 0) {
          renamed.forEach((fileColor) => {
            fileColor.path = newFile.path
          })
          await this.saveSettings()
        }
        this.applyColorStyles()
      })
    )

    this.registerEvent(
      this.app.vault.on('delete', async (file) => {
        const remaining = this.settings.fileColors.filter(
          (fileColor) => !fileColor.path.startsWith(file.path)
        )
        if (remaining.length === this.settings.fileColors.length) {
          return
        }
        this.settings.fileColors = remaining
        await this.saveSettings()
      })
    )

    this.addSettingTab(new FileColorSettingTab(this.app, this))
  }

  onunload() {
    document.getElementById('fileColorPluginStyles')?.remove();
    document.getElementById('fileColorPluginGooberStyles')?.remove();
  }

  async loadSettings() {
    this.settings = Object.assign({}, defaultSettings, await this.loadData())
    this.settingsFileMtime = await this.getSettingsFileMtime()
  }

  // Obsidian calls this when data.json changes on disk outside the app,
  // for example when Obsidian Sync delivers settings from another device.
  // Without it the plugin keeps its stale in-memory settings and writes
  // them back over the synced file on the next save.
  async onExternalSettingsChange() {
    await this.loadSettings()
    this.generateColorStyles()
    this.applyColorStyles()
  }

  async saveSettings(immediate?: boolean) {
    if (immediate) {
      return this.saveSettingsInternal();
    }
    return this.saveSettingsInternalDebounced();
  }

  private async saveSettingsInternal() {
    // Refuse to overwrite a file that changed since the plugin last read it.
    // This covers Obsidian versions without onExternalSettingsChange and the
    // window between a sync write and the hook being called.
    if (await this.settingsFileChangedOnDisk()) {
      await this.onExternalSettingsChange()
      new Notice(
        'File Color: settings changed on disk and were reloaded. Your last change was not saved.'
      )
      return
    }
    await this.saveData(this.settings)
    this.settingsFileMtime = await this.getSettingsFileMtime()
  }

  private async getSettingsFileMtime(): Promise<number | null> {
    const stat = await this.app.vault.adapter.stat(
      `${this.manifest.dir}/data.json`
    )
    return stat?.mtime ?? null
  }

  private async settingsFileChangedOnDisk(): Promise<boolean> {
    const mtime = await this.getSettingsFileMtime()
    return (
      mtime !== null &&
      this.settingsFileMtime !== null &&
      mtime !== this.settingsFileMtime
    )
  }

  generateColorStyles() {
    let colorStyleEl = document.getElementById('fileColorPluginStyles')

    if (!colorStyleEl) {
      colorStyleEl = this.app.workspace.containerEl.createEl('style')
      colorStyleEl.id = 'fileColorPluginStyles'
    }

    colorStyleEl.innerHTML = this.settings.palette
      .map(
        (color) =>
          `.file-color-color-${color.id} { --file-color-color: ${color.value}; }`
      )
      .join('\n')
  }
  applyColorStyles = debounce(this.applyColorStylesInternal, 50, true);

  private applyColorStylesInternal() {
    const cssType = this.settings.colorBackground ? 'background' : 'text'

    const fileExplorers = this.app.workspace.getLeavesOfType('file-explorer')
    fileExplorers.forEach((fileExplorer) => {
      Object.entries(fileExplorer.view.fileItems).forEach(
        ([path, fileItem]) => {
          const itemClasses = fileItem.el.classList.value
            .split(' ')
            .filter((cls) => !cls.startsWith('file-color'))

            const file = this.settings.fileColors.find(
            (file) => file.path === path
          )

          if (file) {
            itemClasses.push('file-color-file')
            itemClasses.push('file-color-color-' + file.color)
            itemClasses.push('file-color-type-' + cssType)
            if (this.settings.cascadeColors) {
              itemClasses.push('file-color-cascade')
            }
          }

          fileItem.el.classList.value = itemClasses.join(' ')
        }
      )
    })
  }

}
