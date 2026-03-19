import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import App from './App'

const changeLanguage = vi.fn()

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: key => key,
    i18n: {
      resolvedLanguage: 'en',
      changeLanguage,
    },
  }),
  Trans: ({ i18nKey }) => i18nKey,
}))

const useResultsUIMock = vi.fn()
const useAudioScanMock = vi.fn()
const useFileFiltersMock = vi.fn()
const useDuplicateSelectionMock = vi.fn()
const useDeleteFilesMock = vi.fn()

vi.mock('./hooks/useResultsUI', () => ({ useResultsUI: () => useResultsUIMock() }))
vi.mock('./hooks/useAudioScan', () => ({ useAudioScan: () => useAudioScanMock() }))
vi.mock('./hooks/useFileFilters', () => ({ useFileFilters: results => useFileFiltersMock(results) }))
vi.mock('./hooks/useDuplicateSelection', () => ({ useDuplicateSelection: results => useDuplicateSelectionMock(results) }))
vi.mock('./hooks/useDeleteFiles', () => ({
  useDeleteFiles: args => useDeleteFilesMock(args),
}))

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    useResultsUIMock.mockReturnValue({
      activeTab: 'files',
      setActiveTab: vi.fn(),
      showConfirm: false,
      openDeleteConfirm: vi.fn(),
      closeDeleteConfirm: vi.fn(),
      resetUIState: vi.fn(),
    })

    useAudioScanMock.mockReturnValue({
      folder: '/music',
      setFolder: vi.fn(),
      detectDups: true,
      setDetectDups: vi.fn(),
      scanStatus: 'idle',
      progress: { current: 0, total: 0 },
      results: null,
      setResults: vi.fn(),
      error: null,
      setError: vi.fn(),
      handleScan: vi.fn(),
      handleReset: vi.fn().mockResolvedValue(),
    })

    useFileFiltersMock.mockReturnValue({
      filterExt: 'all',
      setFilterExt: vi.fn(),
      search: '',
      setSearch: vi.fn(),
      filteredFiles: [],
      extensions: [],
      resetFilters: vi.fn(),
    })

    useDuplicateSelectionMock.mockReturnValue({
      selected: new Set(),
      selectedCount: 0,
      toggleSelected: vi.fn(),
      autoSelectGroup: vi.fn(),
      autoSelectAll: vi.fn(),
      clearSelection: vi.fn(),
    })

    useDeleteFilesMock.mockReturnValue({
      deleteStatus: null,
      deleteResult: null,
      handleDeleteConfirm: vi.fn(),
      resetDeleteState: vi.fn(),
    })
  })

  test('renderiza vista idle y cambia idioma desde el header', async () => {
    const user = userEvent.setup()

    render(<App />)

    expect(screen.getByText('scan.title')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'ES' }))
    expect(changeLanguage).toHaveBeenCalledWith('es')
  })

  test('en done muestra resultados y ejecuta reset compuesto', async () => {
    const user = userEvent.setup()
    const clearSelection = vi.fn()
    const resetDeleteState = vi.fn()
    const resetFilters = vi.fn()
    const resetUIState = vi.fn()
    const handleResetBase = vi.fn().mockResolvedValue()

    useResultsUIMock.mockReturnValue({
      activeTab: 'files',
      setActiveTab: vi.fn(),
      showConfirm: false,
      openDeleteConfirm: vi.fn(),
      closeDeleteConfirm: vi.fn(),
      resetUIState,
    })

    useAudioScanMock.mockReturnValue({
      folder: '/music',
      setFolder: vi.fn(),
      detectDups: true,
      setDetectDups: vi.fn(),
      scanStatus: 'done',
      progress: { current: 0, total: 0 },
      results: { files: [], duplicate_groups: [], total_files: 0 },
      setResults: vi.fn(),
      error: null,
      setError: vi.fn(),
      handleScan: vi.fn(),
      handleReset: handleResetBase,
    })

    useFileFiltersMock.mockReturnValue({
      filterExt: 'all',
      setFilterExt: vi.fn(),
      search: '',
      setSearch: vi.fn(),
      filteredFiles: [],
      extensions: ['.mp3'],
      resetFilters,
    })

    useDuplicateSelectionMock.mockReturnValue({
      selected: new Set(),
      selectedCount: 0,
      toggleSelected: vi.fn(),
      autoSelectGroup: vi.fn(),
      autoSelectAll: vi.fn(),
      clearSelection,
    })

    useDeleteFilesMock.mockReturnValue({
      deleteStatus: 'done',
      deleteResult: { deleted: ['/music/a.mp3'], failed: ['/music/b.mp3'] },
      handleDeleteConfirm: vi.fn(),
      resetDeleteState,
    })

    render(<App />)

    expect(document.querySelector('.delete-feedback')).toHaveTextContent('app.deleteFeedback')
    expect(screen.getByText('app.tabs.files')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'app.newScan' }))

    expect(handleResetBase).toHaveBeenCalledTimes(1)
    expect(resetFilters).toHaveBeenCalledTimes(1)
    expect(clearSelection).toHaveBeenCalledTimes(1)
    expect(resetDeleteState).toHaveBeenCalledTimes(1)
    expect(resetUIState).toHaveBeenCalledTimes(1)
  })

  test('si hay modal abierto confirma borrado y cierra modal', async () => {
    const user = userEvent.setup()
    const closeDeleteConfirm = vi.fn()
    const handleDeleteConfirm = vi.fn().mockResolvedValue()

    useResultsUIMock.mockReturnValue({
      activeTab: 'files',
      setActiveTab: vi.fn(),
      showConfirm: true,
      openDeleteConfirm: vi.fn(),
      closeDeleteConfirm,
      resetUIState: vi.fn(),
    })

    useAudioScanMock.mockReturnValue({
      folder: '/music',
      setFolder: vi.fn(),
      detectDups: true,
      setDetectDups: vi.fn(),
      scanStatus: 'idle',
      progress: { current: 0, total: 0 },
      results: null,
      setResults: vi.fn(),
      error: null,
      setError: vi.fn(),
      handleScan: vi.fn(),
      handleReset: vi.fn().mockResolvedValue(),
    })

    useDuplicateSelectionMock.mockReturnValue({
      selected: new Set(['/music/a.mp3']),
      selectedCount: 1,
      toggleSelected: vi.fn(),
      autoSelectGroup: vi.fn(),
      autoSelectAll: vi.fn(),
      clearSelection: vi.fn(),
    })

    useDeleteFilesMock.mockReturnValue({
      deleteStatus: null,
      deleteResult: null,
      handleDeleteConfirm,
      resetDeleteState: vi.fn(),
    })

    render(<App />)

    await user.click(screen.getByRole('button', { name: 'confirm.delete' }))

    expect(closeDeleteConfirm).toHaveBeenCalledTimes(1)
    expect(handleDeleteConfirm).toHaveBeenCalledTimes(1)
  })
})
