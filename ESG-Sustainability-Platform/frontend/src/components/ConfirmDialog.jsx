import Modal from "./Modal";

const ConfirmDialog = ({ title = "Are you sure?", message, onConfirm, onCancel, loading }) => (
  <Modal title={title} onClose={onCancel} width="380px">
    <p style={{ fontSize: 14, color: "#37413c" }}>{message}</p>
    <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18 }}>
      <button className="btn btn-secondary" onClick={onCancel} disabled={loading}>Cancel</button>
      <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
        {loading ? "Deleting..." : "Delete"}
      </button>
    </div>
  </Modal>
);

export default ConfirmDialog;
