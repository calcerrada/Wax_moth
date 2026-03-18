import { useState } from 'react'

export function useResultsUI() {
  const [activeTab, setActiveTab] = useState('files')
  const [showConfirm, setShowConfirm] = useState(false)

  const openDeleteConfirm = () => setShowConfirm(true)
  const closeDeleteConfirm = () => setShowConfirm(false)

  const resetUIState = () => {
    setActiveTab('files')
    setShowConfirm(false)
  }

  return {
    activeTab,
    setActiveTab,
    showConfirm,
    openDeleteConfirm,
    closeDeleteConfirm,
    resetUIState,
  }
}
