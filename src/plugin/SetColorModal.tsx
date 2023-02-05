import { FileColorPlugin } from 'plugin/FileColorPlugin'
import { Modal, TAbstractFile } from 'obsidian'
import * as React from 'react'
import { createRoot, Root } from "react-dom/client";
import { PluginContext } from 'hooks/usePlugin';
import { FileContext } from 'hooks/useFile';
import { SetColorModalContent } from 'modules/SetColorModalContent';
import { ModalContext } from 'hooks/useModal';

export class SetColorModal extends Modal {
  plugin: FileColorPlugin
  file: TAbstractFile
  root?: Root;

  constructor(plugin: FileColorPlugin, file: TAbstractFile) {
    super(plugin.app)
    this.plugin = plugin
    this.file = file
  }

  onOpen(): void {
    this.titleEl.innerText = 'Set color'
    this.root = createRoot(this.contentEl);
    this.root.render(
      <React.StrictMode>
        <PluginContext.Provider value={this.plugin}>
          <FileContext.Provider value={this.file}>
            <ModalContext.Provider value={this}>
              <SetColorModalContent />
            </ModalContext.Provider>
          </FileContext.Provider>
        </PluginContext.Provider>
      </React.StrictMode>
    );
  }

  onClose(): void {
    this.root?.unmount();
  }
}