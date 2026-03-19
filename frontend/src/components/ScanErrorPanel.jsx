import { useTranslation } from 'react-i18next'

export default function ScanErrorPanel({ error, onRetry }) {
  const { t } = useTranslation()

  return (
    <main className="scan-panel">
      <div className="scan-card error-card">
        <span className="error-icon">✕</span>
        <p className="error-msg">{error}</p>
        <button className="btn-primary" onClick={onRetry}>{t('scan.retry')}</button>
      </div>
    </main>
  )
}
