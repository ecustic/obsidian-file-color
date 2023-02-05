import React from 'react'
import { useFile } from 'hooks/useFile'
import { useModal } from 'hooks/useModal'
import { usePlugin } from 'hooks/usePlugin'
import { Color } from './Color'
import { ColorCell } from './ColorCell'
import { ColorGrid } from './ColorGrid'
import { ColorName } from './ColorName'

export const SetColorModalContent = () => {
  const plugin = usePlugin()
  const { path } = useFile()
  const modal = useModal()
  const selectedColor = plugin.settings.fileColors.find(
    (file) => file.path === path
  )?.color

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
    <ColorGrid>
      <ColorCell onClick={() => handleSelectColor(undefined)}>
        <Color selected={!selectedColor} />
        <ColorName>None</ColorName>
      </ColorCell>
      {plugin.settings.palette.map((color) => (
        <ColorCell key={color.id} onClick={() => handleSelectColor(color.id)}>
          <Color
            selected={selectedColor === color.id}
            className={`file-color-color-${color.id}`}
          />
          <ColorName>{color.name}</ColorName>
        </ColorCell>
      ))}
    </ColorGrid>
  )
}
