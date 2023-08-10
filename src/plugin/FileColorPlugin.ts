import { debounce, MenuItem, Plugin } from 'obsidian'
import { SetColorModal } from 'plugin/SetColorModal'
import { FileColorSettingTab } from 'plugin/FileColorSettingTab'

import type { FileColorPluginSettings } from 'settings'
import { defaultSettings } from 'settings'

export class FileColorPlugin extends Plugin {
  settings: FileColorPluginSettings = defaultSettings
  saveSettingsInternalDebounced = debounce(this.saveSettingsInternal, 3000, true);

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
        this.settings.fileColors
          .filter((fileColor) => fileColor.path === oldPath)
          .forEach((fileColor) => {
            fileColor.path = newFile.path
          })
        this.saveSettings()
        this.applyColorStyles()
      })
    )

    this.registerEvent(
      this.app.vault.on('delete', async (file) => {
        this.settings.fileColors = this.settings.fileColors.filter(
          (fileColor) => !fileColor.path.startsWith(file.path)
        )
        this.saveSettings()
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
  }

  async saveSettings(immediate?: boolean) {
    if (immediate) {
      return this.saveSettingsInternal();
    }
    return this.saveSettingsInternalDebounced();
  }

  private saveSettingsInternal() {
    return this.saveData(this.settings)
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
    // If inheriting colors, the "el" element will include a folder and all its sub-items.
    // Otherwise, selfEl will color only itself, whether folder or note
    let elementType = this.settings.inheritColors ? 'el' : 'selfEl',
      cssType = this.settings.colorBackground ? 'background' : 'text'

    const fileExplorers = this.app.workspace.getLeavesOfType('file-explorer')
    fileExplorers.forEach((fileExplorer) => {
      Object.entries(fileExplorer.view.fileItems).forEach(
        ([path, fileItem]) => {
          const itemClasses = fileItem[elementType].classList.value
            .split(' ')
            .filter((cls) => !cls.startsWith('file-color'))

          let file = this.settings.fileColors.find(
            (file) => file.path === path
          )

          if (file) {
            itemClasses.push('file-color-file')
            itemClasses.push('file-color-color-' + file.color)
            itemClasses.push('file-color-type-' + cssType)
          }

          fileItem[elementType].classList.value = itemClasses.join(' ')
        }
      )
    })
  }

  /**
   * Clears color style classes from all elements we can possibly color.
   */
  clearStyles() {
    const fileExplorers = this.app.workspace.getLeavesOfType('file-explorer')
    fileExplorers.forEach((fileExplorer) => {
      Object.entries(fileExplorer.view.fileItems).forEach(
        ([path, fileItem]) => {
          ['el', 'selfEl'].forEach(elementType => {
            const itemClasses = fileItem[elementType].classList.value
                .split(' ')
                .filter((cls) => !cls.startsWith('file-color'))

              fileItem[elementType].classList.value = itemClasses.join(' ')
            })
       })
    })
  }
}
