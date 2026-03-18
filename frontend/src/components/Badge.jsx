import { EXT_COLOR } from '../constants/appConstants'

export default function Badge({ ext }) {
  return (
    <span className="badge" style={{ '--badge-color': EXT_COLOR[ext] || '#6b7280' }}>
      {ext.replace('.', '').toUpperCase()}
    </span>
  )
}
