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

    containerEl.createEl('h2', { text: 'Palette' })

    for (
      let colorIndex = 0;
      colorIndex < this.plugin.settings.palette.length;
      colorIndex++
    ) {
      const color = this.plugin.settings.palette[colorIndex]
      new Setting(containerEl)
        .setName('Color #' + (colorIndex + 1))
        .setDesc(color.id)
        .addText((text) =>
          text
            .setValue(color.name)
            .setPlaceholder('Color name')
            .onChange(async (value) => {
              color.name = value
              await this.plugin.saveSettings()
            })
        )
        .addColorPicker((colorValue) =>
          colorValue.setValue(color.value).onChange(async (value) => {
            color.value = value
            await this.plugin.saveSettings()
            await this.plugin.generateColorStyles()
            await this.plugin.applyColorStyles()
          })
        )
        .addButton((removeButton) => {
          removeButton.setButtonText('Remove').onClick(async () => {
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
        })
    }

    new Setting(containerEl).addButton((addButton) => {
      addButton.setButtonText('Add color').onClick(async () => {
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
    })
  }
}
