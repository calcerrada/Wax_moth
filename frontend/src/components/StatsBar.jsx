import { useTranslation } from 'react-i18next'

export default function StatsBar({ totalFiles, dupCount, extensionCount }) {
  const { t } = useTranslation()

  return (
    <div className="stats-bar">
      <div className="stat">
        <span className="stat-num">{totalFiles}</span>
        <span className="stat-lbl">{t('stats.files')}</span>
      </div>
      <div className="stat-sep" />
      <div className="stat">
        <span className="stat-num">{dupCount}</span>
        <span className="stat-lbl">{t('stats.duplicateGroups')}</span>
      </div>
      <div className="stat-sep" />
      <div className="stat">
        <span className="stat-num">{extensionCount}</span>
        <span className="stat-lbl">{t('stats.formats')}</span>
      </div>
    </div>
  )
}
