import React from 'react'
import { FileColorPlugin } from 'plugin/FileColorPlugin'
import { App, PluginSettingTab } from 'obsidian'
import { createRoot, Root } from 'react-dom/client'
import { PluginContext } from 'hooks/usePlugin'
import { SettingsPanel } from 'modules/SettingsPanel'

export class FileColorSettingTab extends PluginSettingTab {
  plugin: FileColorPlugin
  root: Root

  constructor(app: App, plugin: FileColorPlugin) {
    super(app, plugin)
    this.plugin = plugin
    this.root = createRoot(this.containerEl)
  }

  display(): void {
    this.root.render(
      <React.StrictMode>
        <PluginContext.Provider value={this.plugin}>
          <SettingsPanel />
        </PluginContext.Provider>
      </React.StrictMode>
    )
  }
}