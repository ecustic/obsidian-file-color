import { FileColorPlugin } from 'FileColorPlugin'
import { Modal } from 'obsidian'

export class SetColorModal extends Modal {
  plugin: FileColorPlugin
  filePath: string
  selectedColor: string | undefined

  constructor(plugin: FileColorPlugin, filePath: string) {
    super(plugin.app)
    this.plugin = plugin
    this.filePath = filePath
    this.selectedColor = plugin.settings.fileColors.find(
      (file) => file.path === filePath
    )?.color
  }

  async onSave() {
    const fileIndex = this.plugin.settings.fileColors.findIndex(
      (file) => file.path === this.filePath
    )
    const file =
      fileIndex > -1 ? this.plugin.settings.fileColors[fileIndex] : undefined

    if (!this.selectedColor) {
      if (file) {
        this.plugin.settings.fileColors.splice(fileIndex, 1)
        await this.plugin.saveSettings()
        await this.plugin.applyColorStyles()
        this.close()
      }
      return
    }

    if (file) {
      file.color = this.selectedColor
      await this.plugin.saveSettings()
      await this.plugin.applyColorStyles()
      this.close()
      return
    }

    this.plugin.settings.fileColors.push({
      path: this.filePath,
      color: this.selectedColor,
    })

    await this.plugin.saveSettings()
    await this.plugin.applyColorStyles()
    this.close()
  }

  createColorElement(
    parent: HTMLElement,
    color: string | undefined,
    colorName: string
  ) {
    const colorEl = parent.createEl('div')
    const colorCircleEl = colorEl.createEl('div')
    const colorNameEl = colorEl.createEl('small')

    colorCircleEl.addClass(
      'file-color-modal-color-circle',
      `file-color-color-${color || 'none'}`
    )

    colorNameEl.addClass('file-color-modal-color-name')
    colorNameEl.innerText = colorName

    colorEl.addClass('file-color-modal-color')

    if (this.selectedColor === color) {
      colorEl.addClass('selected')
    }

    const handleSelectColor = () => {
      parent.querySelector('.selected')?.removeClass('selected')
      this.selectedColor = color
      this.onSave()
    }

    this.plugin.registerDomEvent(colorEl, 'click', handleSelectColor.bind(this))
  }

  onOpen() {
    this.titleEl.innerText = 'Set color'
    this.modalEl.addClass('file-color-modal')

    const colorPicker = this.contentEl.createDiv({
      cls: 'file-color-modal-colors',
    })

    this.createColorElement(colorPicker, undefined, 'None')

    for (const color of this.plugin.settings.palette) {
      this.createColorElement(colorPicker, color.id, color.name)
    }
  }

  onClose() {
    const { contentEl } = this
    contentEl.empty()
  }
}
