import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import FolderPickerZone from './FolderPickerZone'

export default function ScanIdlePanel({
  folder,
  detectDups,
  onFolderChange,
  onDetectDupsChange,
  onScan,
  engineDJ,
}) {
  const { t } = useTranslation()
  const [showManualPath, setShowManualPath] = useState(false)

  const engine = useMemo(() => ({
    isEnabled: engineDJ?.isEnabled ?? false,
    status: engineDJ?.status ?? 'idle',
    dbPath: engineDJ?.dbPath ?? null,
    errorMessage: engineDJ?.errorMessage ?? null,
    manualPath: engineDJ?.manualPath ?? '',
    setManualPath: engineDJ?.setManualPath ?? (() => {}),
    savePath: engineDJ?.savePath ?? (() => {}),
    clearPath: engineDJ?.clearPath ?? (() => {}),
    toggleEnabled: engineDJ?.toggleEnabled ?? (() => {}),
  }), [engineDJ])

  const showManualSection = engine.status === 'not_found' || engine.status === 'error' || showManualPath

  return (
    <main className="scan-panel">
      <div className="scan-card">
        <h1 className="scan-title">{t('scan.title')}</h1>
        <p className="scan-sub">
          {t('scan.subtitle')}
        </p>
        <div className="input-group">
          <label className="input-label">{t('scan.folderPath')}</label>
          <input
            className="input-path"
            type="text"
            placeholder={t('scan.folderPlaceholder')}
            value={folder}
            onChange={e => onFolderChange(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onScan()}
          />
        </div>
        <FolderPickerZone onFolderSelected={onFolderChange} disabled={!folder && false} />
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={detectDups}
            onChange={e => onDetectDupsChange(e.target.checked)}
          />
          <span>{t('scan.detectDuplicates')}</span>
        </label>

        <details className="engine-dj-panel" open>
          <summary className="engine-dj-summary">
            <span className="engine-dj-title">🎛 {t('engineDJ.title')}</span>
            <label className="engine-dj-toggle" onClick={e => e.stopPropagation()}>
              <input
                type="checkbox"
                checked={engine.isEnabled}
                onChange={() => {
                  setShowManualPath(false)
                  engine.toggleEnabled()
                }}
              />
              <span>{t('engineDJ.toggle')}</span>
            </label>
          </summary>

          <div className="engine-dj-body">
            {!engine.isEnabled && (
              <p className="engine-dj-status-line">{t('engineDJ.disabled')}</p>
            )}

            {engine.isEnabled && engine.status === 'checking' && (
              <p className="engine-dj-status-line">● {t('engineDJ.checking')}</p>
            )}

            {engine.isEnabled && engine.status === 'found' && (
              <div className="engine-dj-found-wrap">
                <p className="engine-dj-status-line">
                  ● {t('engineDJ.found')}: <span className="engine-dj-path">{engine.dbPath}</span>
                </p>
                <div className="engine-dj-actions">
                  <button
                    className="btn-ghost-sm"
                    type="button"
                    onClick={() => setShowManualPath(prev => !prev)}
                  >
                    {t('engineDJ.changePath')}
                  </button>
                  <button
                    className="btn-ghost-sm"
                    type="button"
                    onClick={() => {
                      setShowManualPath(true)
                      engine.clearPath()
                    }}
                  >
                    {t('engineDJ.clearPath')}
                  </button>
                </div>
              </div>
            )}

            {engine.isEnabled && showManualSection && (
              <div className="engine-dj-manual-wrap">
                {(engine.status === 'not_found' || engine.status === 'error') && (
                  <p className="engine-dj-status-line engine-dj-status-error">✕ {t('engineDJ.notFound')}</p>
                )}
                <div className="engine-dj-manual-row">
                  <input
                    className="input-path"
                    type="text"
                    placeholder={t('engineDJ.manualPathPlaceholder')}
                    value={engine.manualPath}
                    onChange={e => engine.setManualPath(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && engine.savePath(engine.manualPath)}
                  />
                  <button
                    className="btn-primary engine-dj-save-btn"
                    type="button"
                    onClick={() => engine.savePath(engine.manualPath)}
                    disabled={!engine.manualPath.trim()}
                  >
                    {t('engineDJ.save')}
                  </button>
                </div>
                {engine.errorMessage && (
                  <p className="engine-dj-error-text">
                    {t('engineDJ.errorPrefix')}: {engine.errorMessage}
                  </p>
                )}
              </div>
            )}
          </div>
        </details>

        <button className="btn-primary" onClick={onScan} disabled={!folder.trim()}>
          {t('scan.start')}
        </button>
      </div>
    </main>
  )
}
