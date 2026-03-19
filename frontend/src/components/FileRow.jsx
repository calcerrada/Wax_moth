import Badge from './Badge'
import { useTranslation } from 'react-i18next'
import { formatDuration, formatSize } from '../utils/formatters'

export default function FileRow({ file }) {
  const { t } = useTranslation()

  return (
    <tr className="file-row">
      <td className="td-badge"><Badge ext={file.extension} /></td>
      <td className="td-name" title={file.path}>
        <span className="filename">{file.filename}</span>
        <span className="filepath">{file.path}</span>
      </td>
      <td className="td-meta">{file.title || <em>{t('files.empty')}</em>}</td>
      <td className="td-meta">{file.artist || <em>{t('files.empty')}</em>}</td>
      <td className="td-num">{formatDuration(file.duration_seconds)}</td>
      <td className="td-num">{formatSize(file.size_bytes)}</td>
      <td className="td-num">
        {file.bitrate ? `${Math.round(file.bitrate / 1000)} kbps` : t('files.empty')}
      </td>
    </tr>
  )
}
