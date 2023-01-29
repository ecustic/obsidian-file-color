import { createContext, useContext } from 'react'
import { Modal } from 'obsidian'

export const ModalContext = createContext<Modal | undefined>(
  undefined
)

export const useModal = () => {
  const context = useContext(ModalContext)

  if (!context) {
    throw new Error('Missing ModalContext provider.')
  }

  return context;
}
