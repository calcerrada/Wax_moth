import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { API } from '../constants/appConstants'

export function useAudioScan({ onScanStart, onResetState } = {}) {
  const { t } = useTranslation()
  const [folder, setFolder] = useState('')
  const [detectDups, setDetectDups] = useState(true)
  const [scanStatus, setScanStatus] = useState('idle')
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)

  const pollRef = useRef(null)

  useEffect(() => {
    return () => clearInterval(pollRef.current)
  }, [])

  const startPolling = useCallback(() => {
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API}/scan/status`)
        const data = await res.json()
        setProgress({ current: data.progress, total: data.total })

        if (data.status === 'done') {
          clearInterval(pollRef.current)
          const resR = await fetch(`${API}/scan/results`)
          const resultData = await resR.json()
          setResults(resultData)
          setScanStatus('done')
        } else if (data.status === 'error') {
          clearInterval(pollRef.current)
          setError(data.error)
          setScanStatus('error')
        }
      } catch {
        clearInterval(pollRef.current)
        setError(t('errors.connection'))
        setScanStatus('error')
      }
    }, 500)
  }, [t])

  const handleScan = useCallback(async () => {
    if (!folder.trim()) return

    onScanStart?.()
    setError(null)
    setResults(null)
    setScanStatus('scanning')
    setProgress({ current: 0, total: 0 })

    try {
      await fetch(`${API}/scan/reset`, { method: 'DELETE' })
      const res = await fetch(`${API}/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folder: folder.trim(),
          detect_duplicates: detectDups,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || t('errors.startScan'))
      }
      startPolling()
    } catch (e) {
      setError(e.message)
      setScanStatus('error')
    }
  }, [folder, detectDups, startPolling, onScanStart, t])

  const handleReset = useCallback(async () => {
    clearInterval(pollRef.current)
    await fetch(`${API}/scan/reset`, { method: 'DELETE' }).catch(() => {})

    setResults(null)
    setError(null)
    setScanStatus('idle')
    setProgress({ current: 0, total: 0 })
    onResetState?.()
  }, [onResetState])

  return {
    folder,
    setFolder,
    detectDups,
    setDetectDups,
    scanStatus,
    progress,
    results,
    setResults,
    error,
    setError,
    handleScan,
    handleReset,
  }
}
