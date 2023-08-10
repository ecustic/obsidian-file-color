export type FileColorPluginSettings = {
  inheritColors: boolean
  colorBackground: boolean
  palette: Array<{
    id: string
    name: string
    value: string
  }>
  fileColors: Array<{
    path: string
    color: string
  }>
}

export const defaultSettings: FileColorPluginSettings = {
  inheritColors: false,
  colorBackground: false,
  palette: [],
  fileColors: [],
}
