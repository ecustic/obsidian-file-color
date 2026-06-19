import { vi } from 'vitest'

type EventHandler = (...args: Array<unknown>) => unknown

export type MockEvents = Record<string, Array<EventHandler>>

const registerHandler = (events: MockEvents, name: string, handler: EventHandler) => {
  events[name] = events[name] ?? []
  events[name].push(handler)
  return { name, handler }
}

export const debounce = <T extends (...args: Array<unknown>) => unknown>(fn: T) => {
  return function debounced(this: unknown, ...args: Parameters<T>) {
    return fn.apply(this, args)
  }
}

export class Plugin {
  app: App

  constructor(app?: App) {
    this.app = app ?? createMockPluginApp()
  }

  loadData = async () => undefined
  saveData = async (_data: unknown) => undefined
  registerEvent = (_eventRef: unknown) => undefined
  addSettingTab = (_tab: PluginSettingTab) => undefined
}

export class PluginSettingTab {
  app: App
  containerEl: HTMLElement

  constructor(app: App, _plugin: Plugin) {
    this.app = app
    this.containerEl = document.createElement('div')
  }
}

export class Modal {
  app: App
  titleEl: HTMLElement
  contentEl: HTMLElement
  close = vi.fn()

  constructor(app: App) {
    this.app = app
    this.titleEl = document.createElement('div')
    this.contentEl = document.createElement('div')
  }

  open() {}
}

export class MenuItem {
  title = ''
  icon = ''
  clickHandler?: () => void

  setTitle(title: string) {
    this.title = title
    return this
  }

  setIcon(icon: string) {
    this.icon = icon
    return this
  }

  onClick(handler: () => void) {
    this.clickHandler = handler
    return this
  }
}

export type TAbstractFile = {
  path: string
}

export type App = ReturnType<typeof createMockPluginApp>

export const createMockFile = (path: string): TAbstractFile => ({ path })

export const createMockFileExplorer = (paths: Array<string>) => ({
  view: {
    fileItems: Object.fromEntries(
      paths.map((path) => [path, { el: document.createElement('div') }])
    ),
  },
})

export const createMockPluginApp = () => {
  const workspaceEvents: MockEvents = {}
  const vaultEvents: MockEvents = {}
  const containerEl = document.body
  containerEl.createEl = ((tagName: string) => {
    const el = document.createElement(tagName)
    containerEl.appendChild(el)
    return el
  }) as typeof containerEl.createEl
  const fileExplorers: Array<ReturnType<typeof createMockFileExplorer>> = []

  return {
    workspaceEvents,
    vaultEvents,
    workspace: {
      containerEl,
      fileExplorers,
      on: (name: string, handler: EventHandler) =>
        registerHandler(workspaceEvents, name, handler),
      onLayoutReady: (handler: EventHandler) => handler(),
      getLeavesOfType: (type: string) => (type === 'file-explorer' ? fileExplorers : []),
      emit: async (name: string, ...args: Array<unknown>) =>
        Promise.all((workspaceEvents[name] ?? []).map((handler) => handler(...args))),
    },
    vault: {
      on: (name: string, handler: EventHandler) => registerHandler(vaultEvents, name, handler),
      emit: async (name: string, ...args: Array<unknown>) =>
        Promise.all((vaultEvents[name] ?? []).map((handler) => handler(...args))),
    },
  }
}
