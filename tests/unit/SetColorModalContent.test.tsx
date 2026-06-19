import React from 'react'
import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SetColorModalContent } from 'modules/SetColorModalContent'
import { createPluginHarness } from './fixtures/plugin'
import { renderWithPluginContexts } from './fixtures/react'

describe('SetColorModalContent', () => {
  it('renders None and palette entries', () => {
    const { plugin } = createPluginHarness({
      palette: [
        { id: 'red', name: 'Red', value: '#ff0000' },
        { id: 'blue', name: 'Blue', value: '#0000ff' },
      ],
    })

    renderWithPluginContexts(<SetColorModalContent />, { plugin })

    expect(screen.getByText('None')).toBeInTheDocument()
    expect(screen.getByText('Red')).toBeInTheDocument()
    expect(screen.getByText('Blue')).toBeInTheDocument()
  })

  it('creates a file color entry when selecting a palette color', async () => {
    const user = userEvent.setup()
    const { plugin } = createPluginHarness({
      palette: [{ id: 'red', name: 'Red', value: '#ff0000' }],
    })
    const { modal } = renderWithPluginContexts(<SetColorModalContent />, {
      plugin,
      path: 'Note.md',
    })

    await user.click(screen.getByText('Red'))

    expect(plugin.settings.fileColors).toEqual([{ path: 'Note.md', color: 'red' }])
    expect(plugin.saveData).toHaveBeenCalledWith(plugin.settings)
    expect(modal.close).toHaveBeenCalled()
  })

  it('updates an existing file color entry when selecting another color', async () => {
    const user = userEvent.setup()
    const { plugin } = createPluginHarness({
      palette: [
        { id: 'red', name: 'Red', value: '#ff0000' },
        { id: 'blue', name: 'Blue', value: '#0000ff' },
      ],
      fileColors: [{ path: 'Note.md', color: 'red' }],
    })
    renderWithPluginContexts(<SetColorModalContent />, { plugin, path: 'Note.md' })

    await user.click(screen.getByText('Blue'))

    expect(plugin.settings.fileColors).toEqual([{ path: 'Note.md', color: 'blue' }])
    expect(plugin.saveData).toHaveBeenCalledWith(plugin.settings)
  })

  it('removes an existing file color entry when selecting None', async () => {
    const user = userEvent.setup()
    const { plugin } = createPluginHarness({
      palette: [{ id: 'red', name: 'Red', value: '#ff0000' }],
      fileColors: [{ path: 'Note.md', color: 'red' }],
    })
    renderWithPluginContexts(<SetColorModalContent />, { plugin, path: 'Note.md' })

    await user.click(screen.getByText('None'))

    expect(plugin.settings.fileColors).toEqual([])
    expect(plugin.saveData).toHaveBeenCalledWith(plugin.settings)
  })
})
