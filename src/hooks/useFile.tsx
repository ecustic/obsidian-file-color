import { createContext, useContext } from 'react'
import { TAbstractFile } from 'obsidian'

export const FileContext = createContext<TAbstractFile | undefined>(
  undefined
)

export const useFile = () => {
  const context = useContext(FileContext)

  if (!context) {
    throw new Error('Missing FileContext provider.')
  }

  return context;
}
