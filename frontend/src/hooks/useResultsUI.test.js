import { act, renderHook } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { useResultsUI } from './useResultsUI'

describe('useResultsUI', () => {
  test('inicia en pestaña files y confirmacion cerrada', () => {
    const { result } = renderHook(() => useResultsUI())

    expect(result.current.activeTab).toBe('files')
    expect(result.current.showConfirm).toBe(false)
  })

  test('openDeleteConfirm y closeDeleteConfirm cambian el estado de confirmacion', () => {
    const { result } = renderHook(() => useResultsUI())

    act(() => {
      result.current.openDeleteConfirm()
    })
    expect(result.current.showConfirm).toBe(true)

    act(() => {
      result.current.closeDeleteConfirm()
    })
    expect(result.current.showConfirm).toBe(false)
  })

  test('resetUIState restaura estado inicial', () => {
    const { result } = renderHook(() => useResultsUI())

    act(() => {
      result.current.setActiveTab('duplicates')
      result.current.openDeleteConfirm()
    })
    expect(result.current.activeTab).toBe('duplicates')
    expect(result.current.showConfirm).toBe(true)

    act(() => {
      result.current.resetUIState()
    })
    expect(result.current.activeTab).toBe('files')
    expect(result.current.showConfirm).toBe(false)
  })
})
