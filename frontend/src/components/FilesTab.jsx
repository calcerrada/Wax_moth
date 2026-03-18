import { EXT_COLOR } from '../constants/appConstants'
import FileRow from './FileRow'

export default function FilesTab({
  search,
  onSearchChange,
  filterExt,
  onFilterExtChange,
  extensions,
  filteredFiles,
}) {
  return (
    <div className="files-panel">
      <div className="filters">
        <input
          className="filter-search"
          type="text"
          placeholder="Buscar por nombre, artista, título..."
          value={search}
          onChange={e => onSearchChange(e.target.value)}
        />
        <div className="filter-exts">
          <button
            className={`filter-btn ${filterExt === 'all' ? 'filter-active' : ''}`}
            onClick={() => onFilterExtChange('all')}
          >
            Todos
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
              <th>Archivo</th>
              <th>Título</th>
              <th>Artista</th>
              <th>Duración</th>
              <th>Tamaño</th>
              <th>Bitrate</th>
            </tr>
          </thead>
          <tbody>
            {filteredFiles.length === 0 ? (
              <tr>
                <td colSpan={7} className="td-empty">No hay archivos que coincidan.</td>
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
