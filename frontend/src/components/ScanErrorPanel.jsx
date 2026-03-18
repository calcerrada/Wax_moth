export default function ScanErrorPanel({ error, onRetry }) {
  return (
    <main className="scan-panel">
      <div className="scan-card error-card">
        <span className="error-icon">✕</span>
        <p className="error-msg">{error}</p>
        <button className="btn-primary" onClick={onRetry}>Reintentar</button>
      </div>
    </main>
  )
}
