import { EXT_COLOR } from '../constants/appConstants'
import { useTranslation } from 'react-i18next'
import FileRow from './FileRow'

export default function FilesTab({
  search,
  onSearchChange,
  filterExt,
  onFilterExtChange,
  extensions,
  filteredFiles,
}) {
  const { t } = useTranslation()

  return (
    <div className="files-panel">
      <div className="filters">
        <input
          className="filter-search"
          type="text"
          placeholder={t('filters.searchPlaceholder')}
          value={search}
          onChange={e => onSearchChange(e.target.value)}
        />
        <div className="filter-exts">
          <button
            className={`filter-btn ${filterExt === 'all' ? 'filter-active' : ''}`}
            onClick={() => onFilterExtChange('all')}
          >
            {t('filters.all')}
          </button>
          {extensions.map(ext => (
            <button
              key={ext}
              className={`filter-btn ${filterExt === ext ? 'filter-active' : ''}`}
              onClick={() => onFilterExtChange(ext)}
              style={{ '--badge-color': EXT_COLOR[ext] || '#6b7280' }}
            >
              {ext.replace('.', '').toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="table-wrap">
        <table className="files-table">
          <thead>
            <tr>
              <th></th>
              <th>{t('files.headers.file')}</th>
              <th>{t('files.headers.title')}</th>
              <th>{t('files.headers.artist')}</th>
              <th>{t('files.headers.duration')}</th>
              <th>{t('files.headers.size')}</th>
              <th>{t('files.headers.bitrate')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredFiles.length === 0 ? (
              <tr>
                <td colSpan={7} className="td-empty">{t('files.none')}</td>
              </tr>
            ) : (
              filteredFiles.map(f => <FileRow key={f.path} file={f} />)
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
