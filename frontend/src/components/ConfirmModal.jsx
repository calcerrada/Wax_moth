import { useMemo } from 'react'
import { Trans, useTranslation } from 'react-i18next'

export default function ConfirmModal({ count, onConfirm, onCancel, engineDJLibrary = null, selectedPaths = [] }) {
  const { t } = useTranslation()

  const inUseFiles = useMemo(() => {
    if (!engineDJLibrary || !Array.isArray(selectedPaths)) return []

    return selectedPaths
      .filter(path => Object.prototype.hasOwnProperty.call(engineDJLibrary, path))
      .map(path => {
        const filename = path.split(/[/\\]/).filter(Boolean).pop() || path
        const collections = engineDJLibrary[path] ?? []
        return { path, filename, collections }
      })
  }, [engineDJLibrary, selectedPaths])

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-icon">⚠</div>
        <h3 className="modal-title">{t('confirm.title')}</h3>
        <p className="modal-body">
          <Trans i18nKey="confirm.body" count={count} components={[<strong key="strong" />]} />
        </p>
        {inUseFiles.length > 0 && (
          <div className="modal-warning">
            <p className="modal-warning-title">⚠ {t('engineDJ.modalWarningTitle')}</p>
            <ul className="modal-warning-list">
              {inUseFiles.map(file => (
                <li key={file.path} className="modal-warning-item">
                  • {file.filename} <span className="modal-warning-collections">→ {file.collections.join(', ')}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="modal-actions">
          <button className="btn-ghost" onClick={onCancel}>{t('confirm.cancel')}</button>
          <button className="btn-danger" onClick={onConfirm}>
            {t('confirm.delete', { count })}
          </button>
        </div>
      </div>
    </div>
  )
}
