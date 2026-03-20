import './App.css'
import { useTranslation } from 'react-i18next'
import ConfirmModal from './components/ConfirmModal'
import ScanIdlePanel from './components/ScanIdlePanel'
import ScanProgressPanel from './components/ScanProgressPanel'
import ScanErrorPanel from './components/ScanErrorPanel'
import StatsBar from './components/StatsBar'
import FilesTab from './components/FilesTab'
import DuplicatesTab from './components/DuplicatesTab'
import { useAudioScan } from './hooks/useAudioScan'
import { useDuplicateSelection } from './hooks/useDuplicateSelection'
import { useFileFilters } from './hooks/useFileFilters'
import { useDeleteFiles } from './hooks/useDeleteFiles'
import { useResultsUI } from './hooks/useResultsUI'
import { useEngineDJ } from './hooks/useEngineDJ'

export default function App() {
  const { t } = useTranslation()

  const {
    activeTab,
    setActiveTab,
    showConfirm,
    openDeleteConfirm,
    closeDeleteConfirm,
    resetUIState,
  } = useResultsUI()

  const {
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
    handleScan: handleScanBase,
    handleReset: handleResetBase,
  } = useAudioScan()

  const {
    filterExt,
    setFilterExt,
    search,
    setSearch,
    filteredFiles,
    extensions,
    resetFilters,
  } = useFileFilters(results)

  const engineDJ = useEngineDJ()

  const {
    selected,
    selectedCount,
    toggleSelected,
    autoSelectGroup,
    autoSelectAll,
    clearSelection,
  } = useDuplicateSelection(results, engineDJ.libraryData?.tracks ?? null)

  const {
    deleteStatus,
    deleteResult,
    handleDeleteConfirm,
    resetDeleteState,
  } = useDeleteFiles({
    selected,
    clearSelection,
    setResults,
    setError,
  })

  const handleScan = async () => {
    clearSelection()
    resetDeleteState()

    if (engineDJ.isEnabled && engineDJ.status === 'found') {
      await engineDJ.getLibraryData()
    }

    await handleScanBase()
  }

  const handleReset = async () => {
    await handleResetBase()
    resetFilters()
    clearSelection()
    resetDeleteState()
    resetUIState()
  }

  const confirmDelete = async () => {
    closeDeleteConfirm()
    await handleDeleteConfirm()
  }

  const dupCount      = results?.duplicate_groups?.length ?? 0

  return (
    <div className="app">
      {showConfirm && (
        <ConfirmModal
          count={selectedCount}
          onConfirm={confirmDelete}
          onCancel={closeDeleteConfirm}
          engineDJLibrary={engineDJ.libraryData?.tracks ?? null}
          selectedPaths={[...selected]}
        />
      )}


      {scanStatus === 'idle' && (
        <ScanIdlePanel
          folder={folder}
          detectDups={detectDups}
          onFolderChange={setFolder}
          onDetectDupsChange={setDetectDups}
          onScan={handleScan}
          engineDJ={engineDJ}
        />
      )}

      {scanStatus === 'scanning' && (
        <ScanProgressPanel folder={folder} progress={progress} />
      )}

      {scanStatus === 'error' && (
        <ScanErrorPanel error={error} onRetry={handleReset} />
      )}

      {scanStatus === 'done' && results && (
        <main className="results-panel">
          <StatsBar
            totalFiles={results.total_files}
            dupCount={dupCount}
            extensionCount={extensions.length}
          />

          {deleteStatus === 'done' && deleteResult && (
            <div className="delete-feedback">
              <span className="delete-feedback-ok">✓</span>
              <span>
                {t('app.deleteFeedback', { count: deleteResult.deleted.length })}
                {deleteResult.failed.length > 0 && (
                  <> {t('app.deleteFailed', { count: deleteResult.failed.length })}</>
                )}
              </span>
            </div>
          )}

          <div className="tabs">
            <button
              className={`tab ${activeTab === 'files' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('files')}
            >
              {t('app.tabs.files')}
            </button>
            <button
              className={`tab ${activeTab === 'duplicates' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('duplicates')}
            >
              {t('app.tabs.duplicates')}
              {dupCount > 0 && <span className="tab-badge">{dupCount}</span>}
            </button>
          </div>

          {activeTab === 'files' && (
            <FilesTab
              search={search}
              onSearchChange={setSearch}
              filterExt={filterExt}
              onFilterExtChange={setFilterExt}
              extensions={extensions}
              filteredFiles={filteredFiles}
            />
          )}

          {activeTab === 'duplicates' && (
            <DuplicatesTab
              dupCount={dupCount}
              detectDups={detectDups}
              selectedCount={selectedCount}
              deleteStatus={deleteStatus}
              results={results}
              engineDJLibrary={engineDJ.libraryData?.tracks ?? null}
              onAutoSelectAll={autoSelectAll}
              onClearSelection={clearSelection}
              onOpenDeleteConfirm={openDeleteConfirm}
              onToggle={toggleSelected}
              onAutoSelectGroup={autoSelectGroup}
              selected={selected}
            />
          )}
        </main>
      )}
    </div>
  )
}
