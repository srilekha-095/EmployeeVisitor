export default function DeleteModal({ name, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">Delete this visitor record?</h3>
        <p className="modal-desc">
          The record for <strong>{name}</strong> will be permanently removed. This
          action cannot be undone.
        </p>
        <div className="modal-actions">
          <button className="btn-confirm-delete" onClick={onConfirm}>
            Delete
          </button>
          <button className="btn-modal-cancel" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
