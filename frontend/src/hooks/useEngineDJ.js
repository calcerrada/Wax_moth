import { useCallback, useEffect, useState } from 'react'
import { API } from '../constants/appConstants'

export function useEngineDJ() {
  const [status, setStatus] = useState('idle')
  const [dbPath, setDbPath] = useState(null)
  const [errorMessage, setErrorMessage] = useState(null)
  const [manualPath, setManualPath] = useState('')
  const [isEnabled, setIsEnabled] = useState(true)
  const [libraryData, setLibraryData] = useState(null)

  const checkStatus = useCallback(async (force = false) => {
    if (!isEnabled && !force) return

    setStatus('checking')
    setErrorMessage(null)

    try {
      const res = await fetch(`${API}/engine-dj/status`)
      const data = await res.json()

      if (!res.ok) {
        const message = data?.detail || data?.error || 'Failed to check Engine DJ status.'
        setStatus('error')
        setErrorMessage(message)
        return
      }

      if (data?.found) {
        setStatus('found')
        setDbPath(typeof data.path === 'string' ? data.path : null)
        setErrorMessage(data?.error || null)
        return
      }

      setStatus(data?.error ? 'error' : 'not_found')
      setDbPath(typeof data?.path === 'string' ? data.path : null)
      setErrorMessage(data?.error || null)
    } catch {
      setStatus('error')
      setErrorMessage('Could not connect to Engine DJ service.')
    }
  }, [isEnabled])

  const savePath = useCallback(async path => {
    if (!isEnabled) return

    const nextPath = (path || '').trim()
    if (!nextPath) {
      setErrorMessage('Path is required.')
      return
    }

    setErrorMessage(null)

    try {
      const res = await fetch(`${API}/engine-dj/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ db_path: nextPath }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErrorMessage(data?.detail || 'Failed to save Engine DJ path.')
        setStatus('error')
        return
      }

      await checkStatus(true)
    } catch {
      setStatus('error')
      setErrorMessage('Could not connect to Engine DJ service.')
    }
  }, [checkStatus, isEnabled])

  const clearPath = useCallback(async (force = false) => {
    if (!isEnabled && !force) return

    setErrorMessage(null)

    try {
      const res = await fetch(`${API}/engine-dj/config`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setStatus('error')
        setErrorMessage(data?.detail || 'Failed to clear Engine DJ path.')
        return
      }

      setLibraryData(null)
      await checkStatus(force)
    } catch {
      setStatus('error')
      setErrorMessage('Could not connect to Engine DJ service.')
    }
  }, [checkStatus, isEnabled])

  const toggleEnabled = useCallback(() => {
    setIsEnabled(prevEnabled => {
      const nextEnabled = !prevEnabled

      if (!nextEnabled) {
        setStatus('idle')
        setDbPath(null)
        setErrorMessage(null)
        setLibraryData(null)
        void clearPath(true)
      } else {
        void checkStatus(true)
      }

      return nextEnabled
    })
  }, [checkStatus, clearPath])

  const getLibraryData = useCallback(async () => {
    if (!isEnabled) return null

    setErrorMessage(null)

    try {
      const res = await fetch(`${API}/engine-dj/library`)
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setErrorMessage(data?.detail || 'Failed to fetch Engine DJ library.')
        return null
      }

      setLibraryData(data)
      return data
    } catch {
      setErrorMessage('Could not connect to Engine DJ service.')
      return null
    }
  }, [isEnabled])

  useEffect(() => {
    if (!isEnabled) return

    const timerId = setTimeout(() => {
      void checkStatus(true)
    }, 0)

    return () => clearTimeout(timerId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    status,
    dbPath,
    errorMessage,
    manualPath,
    isEnabled,
    libraryData,
    checkStatus,
    savePath,
    clearPath,
    setManualPath,
    toggleEnabled,
    getLibraryData,
  }
}
