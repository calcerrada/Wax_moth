import { act, renderHook } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { useFileFilters } from './useFileFilters'

const results = {
  files: [
    {
      path: '/music/track-1.mp3',
      filename: 'Track One',
      artist: 'Daft Punk',
      title: 'Around The World',
      extension: 'mp3',
    },
    {
      path: '/music/track-2.flac',
      filename: 'Nocturne',
      artist: 'Chopin',
      title: 'Op.9 No.2',
      extension: 'flac',
    },
    {
      path: '/music/live.wav',
      filename: 'Live Session',
      artist: null,
      title: null,
      extension: 'wav',
    },
  ],
}

describe('useFileFilters', () => {
  test('inicia con todos los archivos y extensiones unicas ordenadas', () => {
    const { result } = renderHook(() => useFileFilters(results))

    expect(result.current.filterExt).toBe('all')
    expect(result.current.search).toBe('')
    expect(result.current.filteredFiles).toHaveLength(3)
    expect(result.current.extensions).toEqual(['flac', 'mp3', 'wav'])
  })

  test('filtra por extension seleccionada', () => {
    const { result } = renderHook(() => useFileFilters(results))

    act(() => {
      result.current.setFilterExt('mp3')
    })

    expect(result.current.filteredFiles).toHaveLength(1)
    expect(result.current.filteredFiles[0].path).toBe('/music/track-1.mp3')
  })

  test('filtra por busqueda en filename, artist o title sin distinguir mayusculas', () => {
    const { result } = renderHook(() => useFileFilters(results))

    act(() => {
      result.current.setSearch('daft')
    })
    expect(result.current.filteredFiles).toHaveLength(1)
    expect(result.current.filteredFiles[0].path).toBe('/music/track-1.mp3')

    act(() => {
      result.current.setSearch('OP.9')
    })
    expect(result.current.filteredFiles).toHaveLength(1)
    expect(result.current.filteredFiles[0].path).toBe('/music/track-2.flac')

    act(() => {
      result.current.setSearch('live')
    })
    expect(result.current.filteredFiles).toHaveLength(1)
    expect(result.current.filteredFiles[0].path).toBe('/music/live.wav')
  })

  test('resetFilters restaura busqueda y extension por defecto', () => {
    const { result } = renderHook(() => useFileFilters(results))

    act(() => {
      result.current.setFilterExt('wav')
      result.current.setSearch('live')
    })
    expect(result.current.filterExt).toBe('wav')
    expect(result.current.search).toBe('live')

    act(() => {
      result.current.resetFilters()
    })

    expect(result.current.filterExt).toBe('all')
    expect(result.current.search).toBe('')
    expect(result.current.filteredFiles).toHaveLength(3)
  })
})
