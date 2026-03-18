import Badge from './Badge'
import { formatSize } from '../utils/formatters'

export default function DuplicateGroup({ group, index, selected, onToggle, onAutoSelect }) {
  const selectedCount = group.files.filter(f => selected.has(f.path)).length

  return (
    <div className="dup-group">
      <div className="dup-header">
        <div className="dup-header-left">
          <span className="dup-label">Grupo {index + 1}</span>
          <span className="dup-count">{group.files.length} copias</span>
        </div>
        <button
          className="btn-auto-select"
          onClick={() => onAutoSelect(group)}
          title="Marcar automáticamente los de menor calidad para borrar"
        >
          Auto-seleccionar peores
        </button>
      </div>

      <div className="dup-files">
        {group.files.map((f, i) => {
          const isBest = i === 0
          const isSelected = selected.has(f.path)
          const kbps = f.bitrate ? Math.round(f.bitrate / 1000) : null

          return (
            <div
              key={f.path}
              className={`dup-file ${isSelected ? 'dup-file-selected' : ''} ${isBest ? 'dup-file-best' : ''}`}
              onClick={() => onToggle(f.path)}
            >
              <input
                type="checkbox"
                className="dup-checkbox"
                checked={isSelected}
                onChange={() => onToggle(f.path)}
                onClick={e => e.stopPropagation()}
              />

              <div className="dup-badges">
                <Badge ext={f.extension} />
                {kbps && (
                  <span className="bitrate-badge">{kbps} kbps</span>
                )}
              </div>

              <div className="dup-file-info">
                <span className="filename">{f.filename}</span>
                <span className="filepath">{f.path}</span>
              </div>

              <span className="dup-size">{formatSize(f.size_bytes)}</span>

              {isBest
                ? <span className="quality-tag quality-best">Mejor calidad</span>
                : <span className="quality-tag quality-lower">Menor calidad</span>
              }
            </div>
          )
        })}
      </div>

      {selectedCount > 0 && (
        <div className="dup-footer">
          {selectedCount} archivo{selectedCount !== 1 ? 's' : ''} marcado{selectedCount !== 1 ? 's' : ''} para borrar en este grupo
        </div>
      )}
    </div>
  )
}
