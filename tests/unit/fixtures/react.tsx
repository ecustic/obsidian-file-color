import React, { ReactElement } from 'react'
import { render } from '@testing-library/react'
import { Modal } from 'obsidian'
import { FileContext } from 'hooks/useFile'
import { ModalContext } from 'hooks/useModal'
import { PluginContext } from 'hooks/usePlugin'
import { createMockFile } from '../mocks/obsidian'
import { createPluginHarness } from './plugin'

type RenderOptions = {
  plugin?: ReturnType<typeof createPluginHarness>['plugin']
  path?: string
  modal?: Modal
}

export const renderWithPluginContexts = (
  ui: ReactElement,
  options: RenderOptions = {}
) => {
  const harness = options.plugin ? undefined : createPluginHarness()
  const plugin = options.plugin ?? harness!.plugin
  const file = createMockFile(options.path ?? 'Folder/Note.md')
  const modal = options.modal ?? new Modal(plugin.app)

  return {
    plugin,
    file,
    modal,
    ...render(
      <PluginContext.Provider value={plugin}>
          <FileContext.Provider value={file as never}>
          <ModalContext.Provider value={modal}>{ui}</ModalContext.Provider>
        </FileContext.Provider>
      </PluginContext.Provider>
    ),
  }
}
