export default function ScanIdlePanel({ folder, detectDups, onFolderChange, onDetectDupsChange, onScan }) {
  return (
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
            placeholder="C:\\Users\\...\\Music"
            value={folder}
            onChange={e => onFolderChange(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onScan()}
          />
        </div>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={detectDups}
            onChange={e => onDetectDupsChange(e.target.checked)}
          />
          <span>Detectar duplicados por huella acústica (fpcalc)</span>
        </label>
        <button className="btn-primary" onClick={onScan} disabled={!folder.trim()}>
          Iniciar escaneo
        </button>
      </div>
    </main>
  )
}
