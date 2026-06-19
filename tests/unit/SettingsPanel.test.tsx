import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PluginContext } from 'hooks/usePlugin'
import { SettingsPanel } from 'modules/SettingsPanel'
import { createPluginHarness } from './fixtures/plugin'

vi.mock('nanoid', () => ({ nanoid: () => 'new-color' }))

const renderSettingsPanel = (plugin: ReturnType<typeof createPluginHarness>['plugin']) =>
  render(
    <PluginContext.Provider value={plugin}>
      <SettingsPanel />
    </PluginContext.Provider>
  )

describe('SettingsPanel', () => {
  it('renders the empty palette state', () => {
    const { plugin } = createPluginHarness()

    renderSettingsPanel(plugin)

    expect(screen.getByText('No colors in the palette')).toBeInTheDocument()
  })

  it('adds a color row and shows unsaved state', async () => {
    const user = userEvent.setup()
    const { plugin } = createPluginHarness()

    renderSettingsPanel(plugin)
    await user.click(screen.getByRole('button', { name: /add color/i }))

    expect(screen.getByPlaceholderText('Color name')).toBeInTheDocument()
    expect(screen.getByText('You have unsaved palette changes.')).toBeInTheDocument()
  })

  it('saves palette changes and prunes file colors without a palette entry', async () => {
    const user = userEvent.setup()
    const { plugin } = createPluginHarness({
      palette: [{ id: 'red', name: 'Red', value: '#ff0000' }],
      fileColors: [
        { path: 'Red.md', color: 'red' },
        { path: 'Missing.md', color: 'missing' },
      ],
    })

    renderSettingsPanel(plugin)
    await user.clear(screen.getByPlaceholderText('Color name'))
    await user.type(screen.getByPlaceholderText('Color name'), 'Ruby')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(plugin.settings.palette).toEqual([
      { id: 'red', name: 'Ruby', value: '#ff0000' },
    ])
    expect(plugin.settings.fileColors).toEqual([{ path: 'Red.md', color: 'red' }])
    expect(plugin.saveData).toHaveBeenCalledWith(plugin.settings)
    expect(document.querySelector('#fileColorPluginStyles')).toHaveTextContent(
      '.file-color-color-red { --file-color-color: #ff0000; }'
    )
    expect(screen.queryByText('You have unsaved palette changes.')).not.toBeInTheDocument()
  })

  it('toggles cascade colors and applies settings', async () => {
    const user = userEvent.setup()
    const { plugin } = createPluginHarness()
    renderSettingsPanel(plugin)

    const item = screen.getByText('Cascade Colors').closest('.setting-item') as HTMLElement
    await user.click(within(item).getByRole('checkbox'))

    expect(plugin.settings.cascadeColors).toBe(true)
    expect(plugin.saveData).toHaveBeenCalledWith(plugin.settings)
  })

  it('toggles background color mode and applies settings', async () => {
    const user = userEvent.setup()
    const { plugin } = createPluginHarness()
    renderSettingsPanel(plugin)

    const item = screen.getByText('Color Background').closest('.setting-item') as HTMLElement
    await user.click(within(item).getByRole('checkbox'))

    expect(plugin.settings.colorBackground).toBe(true)
    expect(plugin.saveData).toHaveBeenCalledWith(plugin.settings)
  })
})
