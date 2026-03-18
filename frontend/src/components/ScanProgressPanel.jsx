import ProgressBar from './ProgressBar'

export default function ScanProgressPanel({ folder, progress }) {
  return (
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
  )
}
