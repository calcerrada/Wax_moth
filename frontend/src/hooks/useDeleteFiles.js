import { useState } from 'react'
import { API } from '../constants/appConstants'

export function useDeleteFiles({ selected, clearSelection, setResults, setError }) {
  const [deleteStatus, setDeleteStatus] = useState(null)
  const [deleteResult, setDeleteResult] = useState(null)

  const resetDeleteState = () => {
    setDeleteResult(null)
    setDeleteStatus(null)
  }

  const handleDeleteConfirm = async () => {
    setDeleteStatus('deleting')

    try {
      const res = await fetch(`${API}/files`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths: [...selected] }),
      })
      const data = await res.json()
      setDeleteResult(data)
      setDeleteStatus('done')

      setResults(prev => {
        if (!prev) return prev
        const deletedSet = new Set(data.deleted)
        const files = prev.files.filter(f => !deletedSet.has(f.path))
        const duplicate_groups = prev.duplicate_groups
          .map(g => ({ ...g, files: g.files.filter(f => !deletedSet.has(f.path)) }))
          .filter(g => g.files.length > 1)

        return { ...prev, files, duplicate_groups, total_files: files.length }
      })
      clearSelection()
    } catch (e) {
      setDeleteStatus('error')
      setError(e.message)
    }
  }

  return {
    deleteStatus,
    deleteResult,
    handleDeleteConfirm,
    resetDeleteState,
  }
}
