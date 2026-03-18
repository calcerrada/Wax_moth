import Badge from './Badge'
import { formatDuration, formatSize } from '../utils/formatters'

export default function FileRow({ file }) {
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
      <td className="td-num">
        {file.bitrate ? `${Math.round(file.bitrate / 1000)} kbps` : '—'}
      </td>
    </tr>
  )
}
