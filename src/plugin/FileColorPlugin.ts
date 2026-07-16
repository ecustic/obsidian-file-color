import { debounce, FileView, MenuItem, Plugin, TFile } from 'obsidian'
import { SetColorModal } from 'plugin/SetColorModal'
import { FileColorSettingTab } from 'plugin/FileColorSettingTab'
import type { VerticalTabsAPI } from 'obsidian-vertical-tabs-api'

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

    window.withVT?.((api: VerticalTabsAPI) => {
      api.getAllLeafIds().forEach((tabId) => {
        const file = this.getOpenFileOfLeaf(tabId);
        if (!file) return;
        const colorId = this.settings.fileColors.find(
          (fileColor) => fileColor.path === file.path
        )?.color;
        if (!colorId) return;
        const color = this.settings.palette.find(
          (color) => color.id === colorId
        )?.value;
        if (!color) return;
        api.setTabColor(tabId, color);
      })
    })
  }

  private getOpenFileOfLeaf(leafId: string): TFile | null {
    const leaf = this.app.workspace.getLeafById(leafId);
    if (!leaf) return null;
    if (leaf.view instanceof FileView) return leaf.view.file;
    const path = leaf.getViewState().state?.file as string | undefined;
    if (path) {
      const file = this.app.vault.getAbstractFileByPath(path);
      if (file instanceof TFile) return file;
    }
    return null;
  }
}
