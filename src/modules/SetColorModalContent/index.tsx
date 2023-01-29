import { useFile } from 'hooks/useFile'
import { useModal } from 'hooks/useModal'
import { usePlugin } from 'hooks/usePlugin'
import React from 'react'

export const SetColorModalContent = () => {
  const plugin = usePlugin()
  const { path } = useFile()
  const modal = useModal();
  const selectedColor = plugin.settings.fileColors.find((file) => file.path === path)?.color

  const handleSelectColor = (color: string | undefined) => {
    const fileIndex = plugin.settings.fileColors.findIndex(
      (file) => file.path === path
    )

    const file =
      fileIndex > -1 ? plugin.settings.fileColors[fileIndex] : undefined

    if (!color && file) {
      plugin.settings.fileColors.splice(fileIndex, 1)
    }

    if (color && file) {
      file.color = color
    }

    if (color && !file) {
      plugin.settings.fileColors.push({
        path,
        color,
      })
    }

    plugin.saveSettings()
    plugin.applyColorStyles()
    modal.close()
  }

  return (
    <div className="file-color-modal-colors">
      <div
        onClick={() => handleSelectColor(undefined)}
        className={`file-color-modal-color${!selectedColor ? ' selected' : ''}`}
      >
        <div
          className={`file-color-modal-color-circle file-color-color-none`}
        ></div>
        <small className="file-color-modal-color-name">None</small>
      </div>
      {plugin.settings.palette.map((color) => (
        <div
          key={color.id}
          onClick={() => handleSelectColor(color.id)}
          className={`file-color-modal-color${selectedColor === color.id ? ' selected' : ''}`}
        >
          <div
            className={`file-color-modal-color-circle file-color-color-${color.id}`}
          ></div>
          <small className="file-color-modal-color-name">{color.name}</small>
        </div>
      ))}
    </div>
  )
}
