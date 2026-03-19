import { Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function AppShell() {
  const { t, i18n } = useTranslation()
  const location = useLocation()

  const handleLanguageChange = lng => i18n.changeLanguage(lng)
  const showHeader = location.pathname !== '/'

  return (
    <div className="app">
      {showHeader && (
        <header className="app-header">
          <div className="header-brand">
            <span className="header-icon">◈</span>
            <span className="header-title">{t('app.title')}</span>
          </div>
          <div className="header-actions">
            <div className="lang-switch" role="group" aria-label={t('app.language')}>
              <button
                className={`lang-btn ${i18n.resolvedLanguage === 'en' ? 'lang-btn-active' : ''}`}
                onClick={() => handleLanguageChange('en')}
              >
                EN
              </button>
              <button
                className={`lang-btn ${i18n.resolvedLanguage === 'es' ? 'lang-btn-active' : ''}`}
                onClick={() => handleLanguageChange('es')}
              >
                ES
              </button>
            </div>
          </div>
        </header>
      )}

      <Outlet />
    </div>
  )
}
