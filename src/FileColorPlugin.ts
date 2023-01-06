import { MenuItem, Plugin } from 'obsidian'
import { SetColorModal } from 'SetColorModal'
import { FileColorSettingTab } from 'FileColorSettingTab'

import type { FileColorPluginSettings } from 'settings'
import { defaultSettings } from 'settings'

export class FileColorPlugin extends Plugin {
  settings: FileColorPluginSettings

  async onload() {
    await this.loadSettings()

    this.registerEvent(
      this.app.workspace.on('file-menu', (menu, file) => {
        const addFileColorMenuItem = (item: MenuItem) => {
          item.setTitle('Set color')
          item.setIcon('palette')
          item.onClick(() => {
            new SetColorModal(this, file.path).open()
          })
        }

        menu.addItem(addFileColorMenuItem)
      })
    )

    this.app.workspace.onLayoutReady(async () => {
      await this.generateColorStyles()
      await this.applyColorStyles()
    })

    this.registerEvent(
      this.app.workspace.on('layout-change', () => this.applyColorStyles())
    )

    this.registerEvent(
      this.app.vault.on('rename', async (newFile, oldPath) => {
        this.settings.fileColors
          .filter((fileColor) => fileColor.path.startsWith(oldPath))
          .forEach((fileColor) => {
            fileColor.path = fileColor.path.replace(oldPath, newFile.path)
          })
        await this.saveSettings()
        await this.applyColorStyles()
      })
    )

    this.registerEvent(
      this.app.vault.on('delete', async (file) => {
        this.settings.fileColors = this.settings.fileColors.filter(
          (fileColor) => !fileColor.path.startsWith(file.path)
        )
        await this.saveSettings()
        await this.applyColorStyles()
      })
    )

    this.addSettingTab(new FileColorSettingTab(this.app, this))
  }

  onunload() {
    const colorStyleEl = this.app.workspace.containerEl.querySelector(
      '#fileColorPluginStyles'
    )

    if (colorStyleEl) {
      colorStyleEl.remove();
    }
  }

  async loadSettings() {
    this.settings = Object.assign({}, defaultSettings, await this.loadData())
  }

  async saveSettings() {
    await this.saveData(this.settings)
  }

  async generateColorStyles() {
    let colorStyleEl = this.app.workspace.containerEl.querySelector(
      '#fileColorPluginStyles'
    )

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

  async applyColorStyles() {
    const fileExplorers = this.app.workspace.getLeavesOfType('file-explorer')
    fileExplorers.forEach((fileExplorer) => {
      Object.entries(fileExplorer.view.fileItems).forEach(
        ([path, fileItem]) => {
          const itemClasses = fileItem.titleEl.classList.value
            .split(' ')
            .filter((cls) => !cls.startsWith('file-color'))
          const file = this.settings.fileColors.find(
            (file) => file.path === path
          )

          if (file) {
            itemClasses.push('file-color-file')
            itemClasses.push('file-color-color-' + file.color)
          }

          fileItem.titleEl.classList.value = itemClasses.join(' ')
        }
      )
    })
  }
}
