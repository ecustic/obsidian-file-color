export type FileColorPluginSettings = {
  inheritColors: boolean
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
  palette: [],
  fileColors: [],
}
