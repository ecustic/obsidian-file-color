import { FileColorPlugin } from 'plugin/FileColorPlugin'
import { App, PluginSettingTab } from 'obsidian'
import { createRoot, Root } from 'react-dom/client'
import React from 'react'
import { PluginContext } from 'hooks/usePlugin'
import { SettingsPanel } from 'modules/SettingsPanel'
import { StyleSheetManager, StylisPlugin } from 'styled-components'
/*import specificity from 'stylis-plugin-extra-class-names-specifity'

const plugin: (repeatTimes: number) => StylisPlugin = (repeatTimes = 1) => (context, content, selectors) => {
  if (context === 2) {
    for (let i = 0; i < selectors.length; i++) {
      const selector = selectors[i];
      if (/^\.[\w\d-_]+$/i.test(selector) && repeatTimes > 1) {
        selectors[i] = selector.repeat(repeatTimes);
      }
    }
  }
};*/

const stylisPluginExtraClassNamesSpecifity =
  (...rest: any) =>
  (element: any) => {
    const specificity = rest.map((value: any) => value || 1);

    // we only want type "rule" and no keyframes definitions
    if (element.type !== "rule" || element.root?.type === "@keyframes") {
      return;
    }

    if (element.parent === null && specificity && specificity > 1) {
      element.props = element.props.map((prop: any) => (/^\.[\w\d-_]+$/i.test(prop) 
        ? prop.repeat(specificity) 
        : prop));
    }
  };


const specificPlugin = stylisPluginExtraClassNamesSpecifity(3)

Object.defineProperty(specificPlugin, 'name', { value: 'class-name-specificity' });

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
        <StyleSheetManager stylisPlugins={[
          specificPlugin
        ]}>
          <PluginContext.Provider value={this.plugin}>
            <SettingsPanel />
          </PluginContext.Provider>
        </StyleSheetManager>
      </React.StrictMode>
    )
  }
}