import { act, renderHook } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import { API } from '../constants/appConstants'
import { useDeleteFiles } from './useDeleteFiles'

describe('useDeleteFiles', () => {
  test('borra archivos, actualiza resultados y limpia seleccion en flujo exitoso', async () => {
    const selected = new Set(['/music/delete-1.mp3', '/music/delete-2.mp3'])
    const clearSelection = vi.fn()
    const setError = vi.fn()
    const setResults = vi.fn()

    globalThis.fetch.mockResolvedValueOnce({
      json: vi.fn().mockResolvedValue({
        deleted: ['/music/delete-1.mp3', '/music/delete-2.mp3'],
        failed: [],
      }),
    })

    const { result } = renderHook(() =>
      useDeleteFiles({ selected, clearSelection, setResults, setError })
    )

    await act(async () => {
      await result.current.handleDeleteConfirm()
    })

    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
    expect(globalThis.fetch).toHaveBeenCalledWith(`${API}/files`, expect.any(Object))

    const [, request] = globalThis.fetch.mock.calls[0]
    expect(request.method).toBe('DELETE')
    expect(request.headers).toEqual({ 'Content-Type': 'application/json' })
    expect(JSON.parse(request.body)).toEqual({
      paths: ['/music/delete-1.mp3', '/music/delete-2.mp3'],
    })

    expect(result.current.deleteStatus).toBe('done')
    expect(result.current.deleteResult).toEqual({
      deleted: ['/music/delete-1.mp3', '/music/delete-2.mp3'],
      failed: [],
    })

    expect(setResults).toHaveBeenCalledTimes(1)
    const updateFn = setResults.mock.calls[0][0]

    const prev = {
      files: [
        { path: '/music/keep.flac' },
        { path: '/music/delete-1.mp3' },
        { path: '/music/delete-2.mp3' },
      ],
      duplicate_groups: [
        {
          files: [{ path: '/music/keep.flac' }, { path: '/music/delete-1.mp3' }],
        },
        {
          files: [
            { path: '/music/other-best.wav' },
            { path: '/music/delete-2.mp3' },
            { path: '/music/other-copy.aiff' },
          ],
        },
      ],
      total_files: 3,
    }

    const next = updateFn(prev)

    expect(next.files).toEqual([{ path: '/music/keep.flac' }])
    expect(next.duplicate_groups).toEqual([
      {
        files: [{ path: '/music/other-best.wav' }, { path: '/music/other-copy.aiff' }],
      },
    ])
    expect(next.total_files).toBe(1)

    expect(clearSelection).toHaveBeenCalledTimes(1)
    expect(setError).not.toHaveBeenCalled()
  })

  test('marca estado error y propaga mensaje cuando falla la peticion', async () => {
    const setError = vi.fn()
    const selected = new Set(['/music/delete-me.mp3'])

    globalThis.fetch.mockRejectedValueOnce(new Error('network down'))

    const { result } = renderHook(() =>
      useDeleteFiles({
        selected,
        clearSelection: vi.fn(),
        setResults: vi.fn(),
        setError,
      })
    )

    await act(async () => {
      await result.current.handleDeleteConfirm()
    })

    expect(result.current.deleteStatus).toBe('error')
    expect(setError).toHaveBeenCalledWith('network down')
  })

  test('resetDeleteState limpia resultado y estado de borrado', async () => {
    const { result } = renderHook(() =>
      useDeleteFiles({
        selected: new Set(['/music/delete-me.mp3']),
        clearSelection: vi.fn(),
        setResults: vi.fn(),
        setError: vi.fn(),
      })
    )

    globalThis.fetch.mockResolvedValueOnce({
      json: vi.fn().mockResolvedValue({ deleted: ['/music/delete-me.mp3'], failed: [] }),
    })

    await act(async () => {
      await result.current.handleDeleteConfirm()
    })
    expect(result.current.deleteStatus).toBe('done')

    act(() => {
      result.current.resetDeleteState()
    })

    expect(result.current.deleteStatus).toBe(null)
    expect(result.current.deleteResult).toBe(null)
  })
})
