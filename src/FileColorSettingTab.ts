import { nanoid } from 'nanoid'
import { FileColorPlugin } from 'FileColorPlugin'
import { App, PluginSettingTab, Setting } from 'obsidian'

export class FileColorSettingTab extends PluginSettingTab {
  plugin: FileColorPlugin

  constructor(app: App, plugin: FileColorPlugin) {
    super(app, plugin)
    this.plugin = plugin
  }

  display(): void {
    const { containerEl } = this

    containerEl.empty()
    containerEl.addClass('file-color-settings-panel')

    containerEl.createEl('h2', { text: 'Palette' })

    if (this.plugin.settings.palette.length < 1) {
      containerEl.createEl('span').setText('No colors in the palette')
    }

    for (
      let colorIndex = 0;
      colorIndex < this.plugin.settings.palette.length;
      colorIndex++
    ) {
      const color = this.plugin.settings.palette[colorIndex]
      const setting = new Setting(containerEl)
        .addColorPicker((colorValue) =>
          colorValue.setValue(color.value).onChange(async (value) => {
            color.value = value
            await this.plugin.saveSettings()
            await this.plugin.generateColorStyles()
            await this.plugin.applyColorStyles()
          })
        )
        .addText((text) =>
          text
            .setValue(color.name)
            .setPlaceholder('Color name')
            .onChange(async (value) => {
              color.name = value
              await this.plugin.saveSettings()
            })
        )
        .addButton((removeButton) => {
          removeButton.onClick(async () => {
            this.plugin.settings.palette.splice(colorIndex, 1)
            this.plugin.settings.fileColors =
              this.plugin.settings.fileColors.filter(
                (fileColor) => fileColor.color !== color.id
              )

            this.display()
            await this.plugin.saveSettings()
            await this.plugin.generateColorStyles()
            await this.plugin.applyColorStyles()
          })
          removeButton.setIcon('trash-2')
        })

      setting.controlEl.parentElement?.addClass('file-color-color-setting')
    }

    new Setting(containerEl).addButton((addButton) => {
      addButton.onClick(async () => {
        this.plugin.settings.palette.push({
          id: nanoid(),
          name: '',
          value: '#ffffff',
        })
        this.display()
        await this.plugin.saveSettings()
        await this.plugin.generateColorStyles()
        await this.plugin.applyColorStyles()
      })
      addButton.setIcon('plus-circle')
    })
  }
}
