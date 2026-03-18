export default function StatsBar({ totalFiles, dupCount, extensionCount }) {
  return (
    <div className="stats-bar">
      <div className="stat">
        <span className="stat-num">{totalFiles}</span>
        <span className="stat-lbl">archivos</span>
      </div>
      <div className="stat-sep" />
      <div className="stat">
        <span className="stat-num">{dupCount}</span>
        <span className="stat-lbl">grupos duplicados</span>
      </div>
      <div className="stat-sep" />
      <div className="stat">
        <span className="stat-num">{extensionCount}</span>
        <span className="stat-lbl">formatos</span>
      </div>
    </div>
  )
}
