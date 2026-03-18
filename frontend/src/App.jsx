import { useState, useRef, useCallback } from 'react'
import './App.css'

const API = 'http://localhost:8000'

// ─── Utilidades ───────────────────────────────────────────────────────────────

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDuration(secs) {
  if (!secs) return '—'
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

const EXT_COLOR = {
  '.mp3': '#f59e0b',
  '.flac': '#10b981',
  '.wav': '#3b82f6',
  '.aiff': '#8b5cf6',
  '.aif': '#8b5cf6',
  '.ogg': '#ef4444',
}

// ─── Subcomponentes ───────────────────────────────────────────────────────────

function Badge({ ext }) {
  return (
    <span
      className="badge"
      style={{ '--badge-color': EXT_COLOR[ext] || '#6b7280' }}
    >
      {ext.replace('.', '').toUpperCase()}
    </span>
  )
}

function ProgressBar({ progress, total }) {
  const pct = total > 0 ? Math.round((progress / total) * 100) : 0
  return (
    <div className="progress-wrap">
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="progress-label">
        {progress} / {total} archivos — {pct}%
      </span>
    </div>
  )
}

function FileRow({ file }) {
  return (
    <tr className="file-row">
      <td className="td-badge"><Badge ext={file.extension} /></td>
      <td className="td-name" title={file.path}>
        <span className="filename">{file.filename}</span>
        <span className="filepath">{file.path}</span>
      </td>
      <td className="td-meta">{file.title || <em>—</em>}</td>
      <td className="td-meta">{file.artist || <em>—</em>}</td>
      <td className="td-num">{formatDuration(file.duration_seconds)}</td>
      <td className="td-num">{formatSize(file.size_bytes)}</td>
      <td className="td-num">{file.bitrate ? `${Math.round(file.bitrate / 1000)} kbps` : '—'}</td>
    </tr>
  )
}

function DuplicateGroup({ group, index }) {
  return (
    <div className="dup-group">
      <div className="dup-header">
        <span className="dup-label">Grupo {index + 1}</span>
        <span className="dup-count">{group.files.length} copias</span>
      </div>
      <div className="dup-files">
        {group.files.map((f) => (
          <div key={f.path} className="dup-file">
            <Badge ext={f.extension} />
            <div className="dup-file-info">
              <span className="filename">{f.filename}</span>
              <span className="filepath">{f.path}</span>
            </div>
            <span className="dup-size">{formatSize(f.size_bytes)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── App principal ────────────────────────────────────────────────────────────

export default function App() {
  const [folder, setFolder] = useState('')
  const [detectDups, setDetectDups] = useState(true)
  const [scanStatus, setScanStatus] = useState('idle') // idle | scanning | done | error
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('files') // files | duplicates
  const [filterExt, setFilterExt] = useState('all')
  const [search, setSearch] = useState('')
  const pollRef = useRef(null)

  // Sondeamos /scan/status cada 500ms hasta que termine
  const startPolling = useCallback(() => {
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API}/scan/status`)
        const data = await res.json()
        setProgress({ current: data.progress, total: data.total })

        if (data.status === 'done') {
          clearInterval(pollRef.current)
          // Obtener resultados completos
          const resR = await fetch(`${API}/scan/results`)
          const resultData = await resR.json()
          setResults(resultData)
          setScanStatus('done')
        } else if (data.status === 'error') {
          clearInterval(pollRef.current)
          setError(data.error)
          setScanStatus('error')
        }
      } catch {
        clearInterval(pollRef.current)
        setError('No se pudo conectar con el servidor.')
        setScanStatus('error')
      }
    }, 500)
  }, [])

  const handleScan = async () => {
    if (!folder.trim()) return
    setError(null)
    setResults(null)
    setScanStatus('scanning')
    setProgress({ current: 0, total: 0 })

    try {
      // Reset previo
      await fetch(`${API}/scan/reset`, { method: 'DELETE' })

      const res = await fetch(`${API}/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder: folder.trim(), detect_duplicates: detectDups }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Error al iniciar el escaneo.')
      }

      startPolling()
    } catch (e) {
      setError(e.message)
      setScanStatus('error')
    }
  }

  const handleReset = async () => {
    clearInterval(pollRef.current)
    await fetch(`${API}/scan/reset`, { method: 'DELETE' }).catch(() => {})
    setResults(null)
    setError(null)
    setScanStatus('idle')
    setProgress({ current: 0, total: 0 })
    setSearch('')
    setFilterExt('all')
  }

  // Filtrado de archivos
  const filteredFiles = results?.files?.filter((f) => {
    const matchExt = filterExt === 'all' || f.extension === filterExt
    const q = search.toLowerCase()
    const matchSearch =
      !q ||
      f.filename.toLowerCase().includes(q) ||
      (f.artist || '').toLowerCase().includes(q) ||
      (f.title || '').toLowerCase().includes(q)
    return matchExt && matchSearch
  }) ?? []

  const extensions = results
    ? [...new Set(results.files.map((f) => f.extension))].sort()
    : []

  const dupCount = results?.duplicate_groups?.length ?? 0

  return (
    <div className="app">
      {/* ── Header ── */}
      <header className="app-header">
        <div className="header-brand">
          <span className="header-icon">◈</span>
          <span className="header-title">Audio Manager</span>
        </div>
        {scanStatus === 'done' && (
          <button className="btn-ghost" onClick={handleReset}>
            ← Nuevo escaneo
          </button>
        )}
      </header>

      {/* ── Panel de escaneo ── */}
      {scanStatus === 'idle' && (
        <main className="scan-panel">
          <div className="scan-card">
            <h1 className="scan-title">Escanear carpeta de audio</h1>
            <p className="scan-sub">
              Analiza archivos MP3, FLAC, WAV, AIFF y OGG. Detecta duplicados por huella acústica.
            </p>

            <div className="input-group">
              <label className="input-label">Ruta de la carpeta</label>
              <input
                className="input-path"
                type="text"
                placeholder="C:\Users\...\Music"
                value={folder}
                onChange={(e) => setFolder(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleScan()}
              />
            </div>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={detectDups}
                onChange={(e) => setDetectDups(e.target.checked)}
              />
              <span>Detectar duplicados por huella acústica (fpcalc)</span>
            </label>

            <button
              className="btn-primary"
              onClick={handleScan}
              disabled={!folder.trim()}
            >
              Iniciar escaneo
            </button>
          </div>
        </main>
      )}

      {/* ── Progreso ── */}
      {scanStatus === 'scanning' && (
        <main className="scan-panel">
          <div className="scan-card">
            <div className="scanning-indicator">
              <span className="scanning-dot" />
              <span>Escaneando...</span>
            </div>
            <ProgressBar progress={progress.current} total={progress.total} />
            <p className="scanning-path">{folder}</p>
          </div>
        </main>
      )}

      {/* ── Error ── */}
      {scanStatus === 'error' && (
        <main className="scan-panel">
          <div className="scan-card error-card">
            <span className="error-icon">✕</span>
            <p className="error-msg">{error}</p>
            <button className="btn-primary" onClick={handleReset}>
              Reintentar
            </button>
          </div>
        </main>
      )}

      {/* ── Resultados ── */}
      {scanStatus === 'done' && results && (
        <main className="results-panel">
          {/* Estadísticas */}
          <div className="stats-bar">
            <div className="stat">
              <span className="stat-num">{results.total_files}</span>
              <span className="stat-lbl">archivos</span>
            </div>
            <div className="stat-sep" />
            <div className="stat">
              <span className="stat-num">{dupCount}</span>
              <span className="stat-lbl">grupos duplicados</span>
            </div>
            <div className="stat-sep" />
            <div className="stat">
              <span className="stat-num">{extensions.length}</span>
              <span className="stat-lbl">formatos</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'files' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('files')}
            >
              Archivos
            </button>
            <button
              className={`tab ${activeTab === 'duplicates' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('duplicates')}
            >
              Duplicados
              {dupCount > 0 && <span className="tab-badge">{dupCount}</span>}
            </button>
          </div>

          {/* Tab: Archivos */}
          {activeTab === 'files' && (
            <div className="files-panel">
              {/* Filtros */}
              <div className="filters">
                <input
                  className="filter-search"
                  type="text"
                  placeholder="Buscar por nombre, artista, título..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <div className="filter-exts">
                  <button
                    className={`filter-btn ${filterExt === 'all' ? 'filter-active' : ''}`}
                    onClick={() => setFilterExt('all')}
                  >
                    Todos
                  </button>
                  {extensions.map((ext) => (
                    <button
                      key={ext}
                      className={`filter-btn ${filterExt === ext ? 'filter-active' : ''}`}
                      onClick={() => setFilterExt(ext)}
                      style={{ '--badge-color': EXT_COLOR[ext] || '#6b7280' }}
                    >
                      {ext.replace('.', '').toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tabla */}
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
                        <td colSpan={7} className="td-empty">
                          No hay archivos que coincidan.
                        </td>
                      </tr>
                    ) : (
                      filteredFiles.map((f) => (
                        <FileRow key={f.path} file={f} />
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab: Duplicados */}
          {activeTab === 'duplicates' && (
            <div className="duplicates-panel">
              {dupCount === 0 ? (
                <div className="no-dups">
                  <span className="no-dups-icon">✓</span>
                  <p>No se encontraron duplicados.</p>
                  {!detectDups && (
                    <p className="no-dups-hint">
                      La detección por huella acústica estaba desactivada.
                    </p>
                  )}
                </div>
              ) : (
                <div className="dup-list">
                  {results.duplicate_groups.map((g, i) => (
                    <DuplicateGroup key={g.fingerprint} group={g} index={i} />
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      )}
    </div>
  )
}
