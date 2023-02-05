import { createContext, useContext } from 'react'
import { FileColorPlugin } from 'plugin/FileColorPlugin'

export const PluginContext = createContext<FileColorPlugin | undefined>(
  undefined
)

export const usePlugin = () => {
  const context = useContext(PluginContext)

  if (!context) {
    throw new Error('Missing PluginContext provider.')
  }

  return context;
}
