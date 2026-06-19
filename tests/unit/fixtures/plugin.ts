import { vi } from 'vitest'
import { FileColorPlugin } from 'plugin/FileColorPlugin'
import type { FileColorPluginSettings } from 'settings'
import { defaultSettings } from 'settings'
import { createMockPluginApp } from '../mocks/obsidian'

export const createSettings = (
  settings: Partial<FileColorPluginSettings> = {}
): FileColorPluginSettings => ({
  ...defaultSettings,
  palette: settings.palette ?? [],
  fileColors: settings.fileColors ?? [],
  cascadeColors: settings.cascadeColors ?? false,
  colorBackground: settings.colorBackground ?? false,
})

export const createPluginHarness = (
  settings: Partial<FileColorPluginSettings> = {},
  savedData?: Partial<FileColorPluginSettings>
) => {
  const app = createMockPluginApp()
  const plugin = new FileColorPlugin(app as never, {} as never)
  plugin.settings = createSettings(settings)
  plugin.loadData = vi.fn(async () => savedData)
  plugin.saveData = vi.fn(async () => undefined)
  plugin.registerEvent = vi.fn()
  plugin.addSettingTab = vi.fn()

  return { app, plugin }
}
