import DuplicateGroup from './DuplicateGroup'
import { useTranslation } from 'react-i18next'

export default function DuplicatesTab({
  dupCount,
  detectDups,
  selectedCount,
  deleteStatus,
  results,
  engineDJLibrary = null,
  onAutoSelectAll,
  onClearSelection,
  onOpenDeleteConfirm,
  onToggle,
  onAutoSelectGroup,
  selected,
}) {
  const { t } = useTranslation()

  return (
    <div className="duplicates-panel">
      {dupCount === 0 ? (
        <div className="no-dups">
          <span className="no-dups-icon">✓</span>
          <p>{t('duplicates.noneFound')}</p>
          {!detectDups && (
            <p className="no-dups-hint">{t('duplicates.detectionDisabledHint')}</p>
          )}
        </div>
      ) : (
        <>
          <div className="dup-actions-bar">
            <div className="dup-actions-left">
              <button className="btn-auto-select-all" onClick={onAutoSelectAll}>
                {t('duplicates.autoSelectAllWorst')}
              </button>
              {selectedCount > 0 && (
                <button className="btn-ghost-sm" onClick={onClearSelection}>
                  {t('duplicates.clearSelection', { count: selectedCount })}
                </button>
              )}
            </div>
            {selectedCount > 0 && (
              <button
                className="btn-danger"
                onClick={onOpenDeleteConfirm}
                disabled={deleteStatus === 'deleting'}
              >
                {deleteStatus === 'deleting'
                  ? t('duplicates.deleting')
                  : t('duplicates.deleteSelected', { count: selectedCount })
                }
              </button>
            )}
          </div>

          <div className="dup-list">
            {results.duplicate_groups.map((g, i) => (
              <DuplicateGroup
                key={g.fingerprint}
                group={g}
                index={i}
                selected={selected}
                onToggle={onToggle}
                onAutoSelect={onAutoSelectGroup}
                engineDJLibrary={engineDJLibrary}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
