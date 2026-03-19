import { act, renderHook } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { useDuplicateSelection } from './useDuplicateSelection'

describe('useDuplicateSelection', () => {
  test('inicia sin elementos seleccionados', () => {
    const { result } = renderHook(() => useDuplicateSelection(null))

    expect(result.current.selectedCount).toBe(0)
    expect([...result.current.selected]).toEqual([])
  })

  test('toggleSelected agrega y quita una ruta', () => {
    const { result } = renderHook(() => useDuplicateSelection(null))

    act(() => {
      result.current.toggleSelected('/music/a.mp3')
    })
    expect(result.current.selectedCount).toBe(1)
    expect(result.current.selected.has('/music/a.mp3')).toBe(true)

    act(() => {
      result.current.toggleSelected('/music/a.mp3')
    })
    expect(result.current.selectedCount).toBe(0)
    expect(result.current.selected.has('/music/a.mp3')).toBe(false)
  })

  test('autoSelectGroup selecciona todos excepto el primer archivo del grupo', () => {
    const group = {
      files: [
        { path: '/music/best.flac' },
        { path: '/music/worse-1.mp3' },
        { path: '/music/worse-2.mp3' },
      ],
    }

    const { result } = renderHook(() => useDuplicateSelection(null))

    act(() => {
      result.current.autoSelectGroup(group)
    })

    expect(result.current.selected.has('/music/best.flac')).toBe(false)
    expect(result.current.selected.has('/music/worse-1.mp3')).toBe(true)
    expect(result.current.selected.has('/music/worse-2.mp3')).toBe(true)
    expect(result.current.selectedCount).toBe(2)
  })

  test('autoSelectAll selecciona en todos los grupos todos excepto el primero', () => {
    const results = {
      duplicate_groups: [
        {
          files: [
            { path: '/music/g1-best.flac' },
            { path: '/music/g1-worse.mp3' },
          ],
        },
        {
          files: [
            { path: '/music/g2-best.wav' },
            { path: '/music/g2-worse.aiff' },
            { path: '/music/g2-worse-2.ogg' },
          ],
        },
      ],
    }

    const { result } = renderHook(() => useDuplicateSelection(results))

    act(() => {
      result.current.autoSelectAll()
    })

    expect(result.current.selected.has('/music/g1-best.flac')).toBe(false)
    expect(result.current.selected.has('/music/g1-worse.mp3')).toBe(true)
    expect(result.current.selected.has('/music/g2-best.wav')).toBe(false)
    expect(result.current.selected.has('/music/g2-worse.aiff')).toBe(true)
    expect(result.current.selected.has('/music/g2-worse-2.ogg')).toBe(true)
    expect(result.current.selectedCount).toBe(3)
  })

  test('clearSelection limpia la seleccion actual', () => {
    const { result } = renderHook(() => useDuplicateSelection(null))

    act(() => {
      result.current.toggleSelected('/music/c.mp3')
      result.current.toggleSelected('/music/d.mp3')
    })
    expect(result.current.selectedCount).toBe(2)

    act(() => {
      result.current.clearSelection()
    })
    expect(result.current.selectedCount).toBe(0)
    expect([...result.current.selected]).toEqual([])
  })
})
