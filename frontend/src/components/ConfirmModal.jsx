import { Trans, useTranslation } from 'react-i18next'

export default function ConfirmModal({ count, onConfirm, onCancel }) {
  const { t } = useTranslation()

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-icon">⚠</div>
        <h3 className="modal-title">{t('confirm.title')}</h3>
        <p className="modal-body">
          <Trans i18nKey="confirm.body" count={count} components={[<strong key="strong" />]} />
        </p>
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
