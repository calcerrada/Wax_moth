import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { useFolderPicker } from './useFolderPicker'

describe('useFolderPicker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('canUsePicker es true cuando showDirectoryPicker existe y false cuando no', () => {
    vi.stubGlobal('showDirectoryPicker', vi.fn())
    const { result, rerender } = renderHook(() => useFolderPicker(vi.fn()))

    expect(result.current.canUsePicker).toBe(true)

    vi.stubGlobal('showDirectoryPicker', undefined)
    rerender()

    expect(result.current.canUsePicker).toBe(false)
  })

  test('openFolderPicker llama onFolderSelected con nombre de carpeta en flujo exitoso', async () => {
    const onFolderSelected = vi.fn()

    vi.stubGlobal(
      'showDirectoryPicker',
      vi.fn().mockResolvedValue({ name: 'Music' })
    )

    const { result } = renderHook(() => useFolderPicker(onFolderSelected))

    await act(async () => {
      await result.current.openFolderPicker()
    })

    expect(onFolderSelected).toHaveBeenCalledTimes(1)
    expect(onFolderSelected).toHaveBeenCalledWith('Music')
  })

  test('openFolderPicker no llama onFolderSelected cuando usuario cancela', async () => {
    const onFolderSelected = vi.fn()

    vi.stubGlobal(
      'showDirectoryPicker',
      vi.fn().mockRejectedValue({ name: 'AbortError' })
    )

    const { result } = renderHook(() => useFolderPicker(onFolderSelected))

    await act(async () => {
      await result.current.openFolderPicker()
    })

    expect(onFolderSelected).not.toHaveBeenCalled()
  })

  test('isDragOver cambia en onDragOver y onDragLeave', () => {
    const { result } = renderHook(() => useFolderPicker(vi.fn()))

    act(() => {
      result.current.dragHandlers.onDragOver({ preventDefault: vi.fn() })
    })
    expect(result.current.isDragOver).toBe(true)

    act(() => {
      result.current.dragHandlers.onDragLeave({ preventDefault: vi.fn() })
    })
    expect(result.current.isDragOver).toBe(false)
  })

  test('onDrop llama onFolderSelected con nombre de carpeta', () => {
    const onFolderSelected = vi.fn()
    const { result } = renderHook(() => useFolderPicker(onFolderSelected))

    const dropEvent = {
      preventDefault: vi.fn(),
      dataTransfer: {
        items: [
          {
            webkitGetAsEntry: () => ({
              isDirectory: true,
              name: 'Music',
              fullPath: '/Music',
            }),
          },
        ],
      },
    }

    act(() => {
      result.current.dragHandlers.onDrop(dropEvent)
    })

    expect(onFolderSelected).toHaveBeenCalledTimes(1)
    expect(onFolderSelected).toHaveBeenCalledWith('Music')
    expect(result.current.isDragOver).toBe(false)
  })
})
