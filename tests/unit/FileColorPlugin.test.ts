import { describe, expect, it, vi } from 'vitest'
import { createPluginHarness } from './fixtures/plugin'
import { createMockFileExplorer } from './mocks/obsidian'

describe('FileColorPlugin', () => {
  it('merges saved settings with defaults', async () => {
    const { plugin } = createPluginHarness({}, { cascadeColors: true })

    await plugin.loadSettings()

    expect(plugin.settings).toEqual({
      cascadeColors: true,
      colorBackground: false,
      palette: [],
      fileColors: [],
    })
  })

  it('persists settings immediately when requested', async () => {
    const { plugin } = createPluginHarness({ cascadeColors: true })

    await plugin.saveSettings(true)

    expect(plugin.saveData).toHaveBeenCalledWith(plugin.settings)
  })

  it('creates and reuses the palette style element', () => {
    const { plugin } = createPluginHarness({
      palette: [
        { id: 'red', name: 'Red', value: '#ff0000' },
        { id: 'blue', name: 'Blue', value: '#0000ff' },
      ],
    })

    plugin.generateColorStyles()
    const styleEl = document.getElementById('fileColorPluginStyles')
    plugin.generateColorStyles()

    expect(document.querySelectorAll('#fileColorPluginStyles')).toHaveLength(1)
    expect(document.getElementById('fileColorPluginStyles')).toBe(styleEl)
    expect(styleEl).toHaveTextContent(
      '.file-color-color-red { --file-color-color: #ff0000; }'
    )
    expect(styleEl).toHaveTextContent(
      '.file-color-color-blue { --file-color-color: #0000ff; }'
    )
  })

  it('replaces previous file color classes before applying current text classes', () => {
    const { app, plugin } = createPluginHarness({
      fileColors: [{ path: 'Folder/Note.md', color: 'red' }],
    })
    const fileExplorer = createMockFileExplorer(['Folder/Note.md'])
    app.workspace.fileExplorers.push(fileExplorer)
    fileExplorer.view.fileItems['Folder/Note.md'].el.className =
      'nav-file file-color-file file-color-color-old file-color-type-background keep-me'

    plugin.applyColorStyles()

    expect(fileExplorer.view.fileItems['Folder/Note.md'].el.className).toBe(
      'nav-file keep-me file-color-file file-color-color-red file-color-type-text'
    )
  })

  it('applies background and cascade classes when enabled', () => {
    const { app, plugin } = createPluginHarness({
      cascadeColors: true,
      colorBackground: true,
      fileColors: [{ path: 'Folder', color: 'green' }],
    })
    const fileExplorer = createMockFileExplorer(['Folder'])
    app.workspace.fileExplorers.push(fileExplorer)

    plugin.applyColorStyles()

    expect(fileExplorer.view.fileItems.Folder.el).toHaveClass(
      'file-color-file',
      'file-color-color-green',
      'file-color-type-background',
      'file-color-cascade'
    )
  })

  it('updates matching file color paths on rename and saves', async () => {
    const settings = {
      fileColors: [
        { path: 'Old.md', color: 'red' },
        { path: 'Other.md', color: 'blue' },
      ],
    }
    const { app, plugin } = createPluginHarness(settings, settings)

    await plugin.onload()
    await app.vault.emit('rename', { path: 'New.md' }, 'Old.md')

    expect(plugin.settings.fileColors).toEqual([
      { path: 'New.md', color: 'red' },
      { path: 'Other.md', color: 'blue' },
    ])
    expect(plugin.saveData).toHaveBeenCalledWith(plugin.settings)
  })

  it('reloads settings and reapplies styles when data.json changes externally', async () => {
    const { app, plugin } = createPluginHarness(
      {
        palette: [{ id: 'red', name: 'Red', value: '#ff0000' }],
        fileColors: [{ path: 'Folder', color: 'red' }],
      },
      {
        palette: [{ id: 'blue', name: 'Blue', value: '#0000ff' }],
        fileColors: [{ path: 'Folder', color: 'blue' }],
      }
    )
    const fileExplorer = createMockFileExplorer(['Folder'])
    app.workspace.fileExplorers.push(fileExplorer)
    plugin.generateColorStyles()
    plugin.applyColorStyles()

    await plugin.onExternalSettingsChange()

    const styleEl = document.getElementById('fileColorPluginStyles')
    expect(plugin.settings.palette).toEqual([{ id: 'blue', name: 'Blue', value: '#0000ff' }])
    expect(plugin.settings.fileColors).toEqual([{ path: 'Folder', color: 'blue' }])
    expect(styleEl).toHaveTextContent('.file-color-color-blue { --file-color-color: #0000ff; }')
    expect(styleEl).not.toHaveTextContent('red')
    expect(fileExplorer.view.fileItems.Folder.el).toHaveClass('file-color-color-blue')
    expect(fileExplorer.view.fileItems.Folder.el).not.toHaveClass('file-color-color-red')
    expect(plugin.saveData).not.toHaveBeenCalled()
  })

  it('does not save when a file without a color is renamed', async () => {
    const settings = { fileColors: [{ path: 'Other.md', color: 'blue' }] }
    const { app, plugin } = createPluginHarness(settings, settings)

    await plugin.onload()
    await app.vault.emit('rename', { path: 'New.md' }, 'Old.md')

    expect(plugin.settings.fileColors).toEqual([{ path: 'Other.md', color: 'blue' }])
    expect(plugin.saveData).not.toHaveBeenCalled()
  })

  it('does not save when a file without a color is deleted', async () => {
    const settings = { fileColors: [{ path: 'Other.md', color: 'blue' }] }
    const { app, plugin } = createPluginHarness(settings, settings)

    await plugin.onload()
    await app.vault.emit('delete', { path: 'Gone.md' })

    expect(plugin.settings.fileColors).toEqual([{ path: 'Other.md', color: 'blue' }])
    expect(plugin.saveData).not.toHaveBeenCalled()
  })

  it('saves when data.json is unchanged since it was last read', async () => {
    const { app, plugin } = createPluginHarness({}, { cascadeColors: true })
    app.vault.adapter.stat.mockResolvedValue({ mtime: 100 })

    await plugin.loadSettings()
    plugin.settings.colorBackground = true
    await plugin.saveSettings(true)

    expect(plugin.saveData).toHaveBeenCalledWith(plugin.settings)
    expect(plugin.settings.colorBackground).toBe(true)
  })

  it('reloads instead of saving when data.json changed on disk since it was last read', async () => {
    const { app, plugin } = createPluginHarness({}, { cascadeColors: true })
    app.vault.adapter.stat.mockResolvedValueOnce({ mtime: 100 })
    await plugin.loadSettings()
    plugin.loadData = vi.fn(async () => ({
      palette: [{ id: 'blue', name: 'Blue', value: '#0000ff' }],
    }))
    app.vault.adapter.stat.mockResolvedValue({ mtime: 200 })

    plugin.settings.colorBackground = true
    await plugin.saveSettings(true)

    expect(plugin.saveData).not.toHaveBeenCalled()
    expect(plugin.settings.colorBackground).toBe(false)
    expect(plugin.settings.palette).toEqual([{ id: 'blue', name: 'Blue', value: '#0000ff' }])
  })

  it('removes deleted files and descendants from settings', async () => {
    const settings = {
      fileColors: [
        { path: 'Folder', color: 'red' },
        { path: 'Folder/Child.md', color: 'blue' },
        { path: 'Other.md', color: 'green' },
      ],
    }
    const { app, plugin } = createPluginHarness(settings, settings)

    await plugin.onload()
    await app.vault.emit('delete', { path: 'Folder' })

    expect(plugin.settings.fileColors).toEqual([{ path: 'Other.md', color: 'green' }])
    expect(plugin.saveData).toHaveBeenCalledWith(plugin.settings)
  })
})
