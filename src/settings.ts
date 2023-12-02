export type FileColorPluginSettings = {
  cascadeColors: boolean
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
  cascadeColors: false,
  colorBackground: false,
  palette: [],
  fileColors: [],
}
