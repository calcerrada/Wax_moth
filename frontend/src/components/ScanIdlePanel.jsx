import { useTranslation } from 'react-i18next'
import FolderPickerZone from './FolderPickerZone'

export default function ScanIdlePanel({ folder, detectDups, onFolderChange, onDetectDupsChange, onScan }) {
  const { t } = useTranslation()

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
        <button className="btn-primary" onClick={onScan} disabled={!folder.trim()}>
          {t('scan.start')}
        </button>
      </div>
    </main>
  )
}
