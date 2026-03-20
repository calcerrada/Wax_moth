import { useTranslation } from 'react-i18next'
import { useFolderPicker } from '../hooks/useFolderPicker'

export default function FolderPickerZone({ onFolderSelected, disabled }) {
  const { t } = useTranslation()
  const { canUsePicker, openFolderPicker, dragHandlers, isDragOver, pickerReturnsNameOnly } = useFolderPicker(onFolderSelected)

  const handleBrowseClick = async () => {
    if (disabled) return
    await openFolderPicker()
  }

  return (
    <>
      <div
        className={`folder-picker-zone ${isDragOver ? 'folder-picker-zone-active' : ''} ${disabled ? 'folder-picker-zone-disabled' : ''}`.trim()}
        role="region"
        aria-label={t('scan.dropZone')}
        aria-disabled={disabled}
        onDragOver={disabled ? undefined : dragHandlers.onDragOver}
        onDragLeave={disabled ? undefined : dragHandlers.onDragLeave}
        onDrop={disabled ? undefined : dragHandlers.onDrop}
      >
        {isDragOver ? (
          <p className="folder-picker-text">{t('scan.dropZoneActive')}</p>
        ) : (
          <p className="folder-picker-text">
            <span>{t('scan.dropZone')} </span>
            {canUsePicker ? (
              <button
                type="button"
                className="folder-picker-link"
                onClick={handleBrowseClick}
                disabled={disabled}
              >
                {t('scan.browseFolder')}
              </button>
            ) : (
              <span>{t('scan.browseNotSupported')}</span>
            )}
          </p>
        )}
      </div>
      {pickerReturnsNameOnly && (
        <p className="folder-picker-hint" role="status" aria-live="polite">
          {t('scan.folderPathHint')}
        </p>
      )}
    </>
  )
}
