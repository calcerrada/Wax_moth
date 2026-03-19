import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { API } from '../constants/appConstants'
import { useAudioScan } from './useAudioScan'

describe('useAudioScan', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  test('no inicia escaneo si la carpeta esta vacia', async () => {
    const { result } = renderHook(() => useAudioScan())

    await act(async () => {
      await result.current.handleScan()
    })

    expect(globalThis.fetch).not.toHaveBeenCalled()
    expect(result.current.scanStatus).toBe('idle')
  })

  test('inicia escaneo, hace polling y finaliza en done con resultados', async () => {
    vi.useFakeTimers()

    const onScanStart = vi.fn()

    globalThis.fetch
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue({}) })
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue({}) })
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ status: 'done', progress: 1, total: 3 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ files: [{ path: '/music/a.mp3' }], duplicate_groups: [] }),
      })

    const { result } = renderHook(() => useAudioScan({ onScanStart }))

    act(() => {
      result.current.setFolder('   /music/library   ')
    })

    await act(async () => {
      await result.current.handleScan()
    })

    expect(onScanStart).toHaveBeenCalledTimes(1)
    expect(result.current.scanStatus).toBe('scanning')
    expect(globalThis.fetch).toHaveBeenNthCalledWith(1, `${API}/scan/reset`, { method: 'DELETE' })

    const [, postRequest] = globalThis.fetch.mock.calls[1]
    expect(globalThis.fetch.mock.calls[1][0]).toBe(`${API}/scan`)
    expect(postRequest.method).toBe('POST')
    expect(JSON.parse(postRequest.body)).toEqual({
      folder: '/music/library',
      detect_duplicates: true,
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500)
    })

    await act(async () => {
      await Promise.resolve()
    })

    expect(result.current.scanStatus).toBe('done')

    expect(result.current.progress).toEqual({ current: 1, total: 3 })
    expect(result.current.results).toEqual({ files: [{ path: '/music/a.mp3' }], duplicate_groups: [] })

  })

  test('pasa a error cuando el backend responde error al iniciar escaneo', async () => {
    globalThis.fetch
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue({}) })
      .mockResolvedValueOnce({
        ok: false,
        json: vi.fn().mockResolvedValue({ detail: 'No se pudo iniciar' }),
      })

    const { result } = renderHook(() => useAudioScan())

    act(() => {
      result.current.setFolder('/music')
    })

    await act(async () => {
      await result.current.handleScan()
    })

    expect(result.current.scanStatus).toBe('error')
    expect(result.current.error).toBe('No se pudo iniciar')
  })

  test('pasa a error en polling cuando hay fallo de red', async () => {
    vi.useFakeTimers()

    globalThis.fetch
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue({}) })
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue({}) })
      .mockRejectedValueOnce(new Error('network fail'))

    const { result } = renderHook(() => useAudioScan())

    act(() => {
      result.current.setFolder('/music')
    })

    await act(async () => {
      await result.current.handleScan()
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500)
    })

    await act(async () => {
      await Promise.resolve()
    })

    expect(result.current.scanStatus).toBe('error')
    expect(result.current.error).toBe('errors.connection')
  })

  test('handleReset limpia estado y llama onResetState aunque falle reset remoto', async () => {
    const onResetState = vi.fn()

    globalThis.fetch.mockRejectedValueOnce(new Error('reset failed'))

    const { result } = renderHook(() => useAudioScan({ onResetState }))

    act(() => {
      result.current.setResults({ files: [{ path: '/music/a.mp3' }] })
      result.current.setError('error previo')
    })

    await act(async () => {
      await result.current.handleReset()
    })

    expect(result.current.results).toBe(null)
    expect(result.current.error).toBe(null)
    expect(result.current.scanStatus).toBe('idle')
    expect(result.current.progress).toEqual({ current: 0, total: 0 })
    expect(onResetState).toHaveBeenCalledTimes(1)
  })
})
