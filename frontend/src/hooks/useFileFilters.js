import { useMemo, useState } from 'react'

export function useFileFilters(results) {
  const [filterExt, setFilterExt] = useState('all')
  const [search, setSearch] = useState('')

  const filteredFiles = useMemo(() => {
    return results?.files?.filter(f => {
      const matchExt = filterExt === 'all' || f.extension === filterExt
      const q = search.toLowerCase()
      const matchSearch = !q ||
        f.filename.toLowerCase().includes(q) ||
        (f.artist || '').toLowerCase().includes(q) ||
        (f.title || '').toLowerCase().includes(q)
      return matchExt && matchSearch
    }) ?? []
  }, [results, filterExt, search])

  const extensions = useMemo(() => {
    return results
      ? [...new Set(results.files.map(f => f.extension))].sort()
      : []
  }, [results])

  const resetFilters = () => {
    setSearch('')
    setFilterExt('all')
  }

  return {
    filterExt,
    setFilterExt,
    search,
    setSearch,
    filteredFiles,
    extensions,
    resetFilters,
  }
}
