export default function ConfirmModal({ count, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-icon">⚠</div>
        <h3 className="modal-title">Confirmar borrado permanente</h3>
        <p className="modal-body">
          Vas a eliminar <strong>{count} archivo{count !== 1 ? 's' : ''}</strong> del
          disco de forma permanente. Esta acción no se puede deshacer.
        </p>
        <div className="modal-actions">
          <button className="btn-ghost" onClick={onCancel}>Cancelar</button>
          <button className="btn-danger" onClick={onConfirm}>
            Borrar {count} archivo{count !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  )
}
