export default function ProgressBar({ progress, total }) {
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
