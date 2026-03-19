import ProgressBar from './ProgressBar'
import { useTranslation } from 'react-i18next'

export default function ScanProgressPanel({ folder, progress }) {
  const { t } = useTranslation()

  return (
    <main className="scan-panel">
      <div className="scan-card">
        <div className="scanning-indicator">
          <span className="scanning-dot" />
          <span>{t('scan.scanning')}</span>
        </div>
        <ProgressBar progress={progress.current} total={progress.total} />
        <p className="scanning-path">{folder}</p>
      </div>
    </main>
  )
}
