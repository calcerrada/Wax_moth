import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

export default function WelcomeScreen() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className="app">
      <main className="scan-panel">
        <section className="scan-card" style={{ alignItems: 'center', textAlign: 'center' }}>
          <img
            src="/logo.png"
            alt={t('welcome.logoAlt')}
            style={{ width: '100%', maxWidth: '140px', height: 'auto' }}
          />

          <h1 className="header-title" style={{ fontSize: '32px' }}>
            {t('welcome.appName')}
          </h1>

          <p className="scan-sub" style={{ marginTop: '0' }}>
            {t('welcome.subtitle')}
          </p>

          <button
            className="btn-primary"
            type="button"
            style={{ alignSelf: 'center' }}
            onClick={() => navigate('/scan')}
          >
            {t('welcome.getStarted')}
          </button>
        </section>
      </main>
    </div>
  )
}
