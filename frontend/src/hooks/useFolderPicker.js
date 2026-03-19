import { useState } from 'react'

function isLikelyRealFolderPath(path) {
  if (!path || typeof path !== 'string') return false

  const normalized = path.trim()
  if (!normalized) return false

  if (/^[a-zA-Z]:\\/.test(normalized)) return true
  if (normalized.startsWith('/')) {
    const segments = normalized.split('/').filter(Boolean)
    return segments.length > 1
  }

  return false
}

function getDroppedFolderPath(event) {
  const items = event?.dataTransfer?.items
  if (!items?.length) return ''

  for (const item of items) {
    const entry = item?.webkitGetAsEntry?.()
    if (!entry?.isDirectory) continue

    const fullPath = typeof entry.fullPath === 'string' ? entry.fullPath : ''
    if (isLikelyRealFolderPath(fullPath)) return fullPath

    return entry.name || ''
  }

  return ''
}

export function useFolderPicker(onFolderSelected) {
  const [isDragOver, setIsDragOver] = useState(false)

  const canUsePicker = typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function'

  const openFolderPicker = async () => {
    if (!canUsePicker) return

    try {
      const directoryHandle = await window.showDirectoryPicker()
      const folderPath = directoryHandle?.name || ''
      if (folderPath) onFolderSelected?.(folderPath)
    } catch (error) {
      if (error?.name === 'AbortError') return
    }
  }

  const onDragOver = event => {
    event.preventDefault()
    setIsDragOver(true)
  }

  const onDragLeave = event => {
    event.preventDefault()
    setIsDragOver(false)
  }

  const onDrop = event => {
    event.preventDefault()
    setIsDragOver(false)

    try {
      const folderPath = getDroppedFolderPath(event)
      if (folderPath) onFolderSelected?.(folderPath)
    } catch {
      // Ignore drop parsing errors to avoid breaking consumer components.
    }
  }

  return {
    canUsePicker,
    openFolderPicker,
    dragHandlers: {
      onDragOver,
      onDragLeave,
      onDrop,
    },
    isDragOver,
  }
}
