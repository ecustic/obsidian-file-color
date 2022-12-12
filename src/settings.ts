export type FileColorPluginSettings = {
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
  palette: [],
  fileColors: [],
}
