import DuplicateGroup from './DuplicateGroup'

export default function DuplicatesTab({
  dupCount,
  detectDups,
  selectedCount,
  deleteStatus,
  results,
  onAutoSelectAll,
  onClearSelection,
  onOpenDeleteConfirm,
  onToggle,
  onAutoSelectGroup,
  selected,
}) {
  return (
    <div className="duplicates-panel">
      {dupCount === 0 ? (
        <div className="no-dups">
          <span className="no-dups-icon">✓</span>
          <p>No se encontraron duplicados.</p>
          {!detectDups && (
            <p className="no-dups-hint">La detección por huella acústica estaba desactivada.</p>
          )}
        </div>
      ) : (
        <>
          <div className="dup-actions-bar">
            <div className="dup-actions-left">
              <button className="btn-auto-select-all" onClick={onAutoSelectAll}>
                Auto-seleccionar todos los peores
              </button>
              {selectedCount > 0 && (
                <button className="btn-ghost-sm" onClick={onClearSelection}>
                  Limpiar selección ({selectedCount})
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
                  ? 'Borrando...'
                  : `Borrar ${selectedCount} archivo${selectedCount !== 1 ? 's' : ''}`
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
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
