import { useTranslation } from 'react-i18next'

export default function ExternalServicesScreen() {
  const { t } = useTranslation()

  return (
    <main className="scan-panel">
      <section className="scan-card">
        <h1 className="scan-title">{t('externalServices.title')}</h1>
        <p className="scan-sub" style={{ marginTop: '0' }}>
          {t('externalServices.placeholder')}
        </p>
      </section>
    </main>
  )
}
