import { useTranslation } from 'react-i18next'

export default function ProgressBar({ progress, total }) {
  const { t } = useTranslation()
  const pct = total > 0 ? Math.round((progress / total) * 100) : 0

  return (
    <div className="progress-wrap">
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="progress-label">
        {t('progress.files', { progress, total, pct })}
      </span>
    </div>
  )
}
