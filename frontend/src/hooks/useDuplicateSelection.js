import { useMemo, useState } from 'react'

export function useDuplicateSelection(results) {
  const [selected, setSelected] = useState(new Set())

  const toggleSelected = (path) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(path) ? next.delete(path) : next.add(path)
      return next
    })
  }

  const autoSelectGroup = (group) => {
    setSelected(prev => {
      const next = new Set(prev)
      group.files.slice(1).forEach(f => next.add(f.path))
      return next
    })
  }

  const autoSelectAll = () => {
    if (!results) return
    setSelected(prev => {
      const next = new Set(prev)
      results.duplicate_groups.forEach(g => {
        g.files.slice(1).forEach(f => next.add(f.path))
      })
      return next
    })
  }

  const clearSelection = () => setSelected(new Set())

  const selectedCount = useMemo(() => selected.size, [selected])

  return {
    selected,
    setSelected,
    selectedCount,
    toggleSelected,
    autoSelectGroup,
    autoSelectAll,
    clearSelection,
  }
}
