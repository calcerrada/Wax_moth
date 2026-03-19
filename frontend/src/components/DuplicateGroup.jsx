import Badge from './Badge'
import { useTranslation } from 'react-i18next'
import { formatSize } from '../utils/formatters'

export default function DuplicateGroup({ group, index, selected, onToggle, onAutoSelect }) {
  const { t } = useTranslation()
  const selectedCount = group.files.filter(f => selected.has(f.path)).length

  return (
    <div className="dup-group">
      <div className="dup-header">
        <div className="dup-header-left">
          <span className="dup-label">{t('duplicates.groupLabel', { index: index + 1 })}</span>
          <span className="dup-count">{t('duplicates.copies', { count: group.files.length })}</span>
        </div>
        <button
          className="btn-auto-select"
          onClick={() => onAutoSelect(group)}
          title={t('duplicates.autoSelectWorstTitle')}
        >
          {t('duplicates.autoSelectWorst')}
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
                ? <span className="quality-tag quality-best">{t('duplicates.quality.best')}</span>
                : <span className="quality-tag quality-lower">{t('duplicates.quality.lower')}</span>
              }
            </div>
          )
        })}
      </div>

      {selectedCount > 0 && (
        <div className="dup-footer">
          {t('duplicates.markedInGroup', { count: selectedCount })}
        </div>
      )}
    </div>
  )
}
