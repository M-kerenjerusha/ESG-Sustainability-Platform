const Modal = ({ title, onClose, children, width }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal-box" style={width ? { maxWidth: width } : undefined} onClick={(e) => e.stopPropagation()}>
      <div className="modal-header">
        <h3 style={{ margin: 0, fontSize: 17 }}>{title}</h3>
        <button className="modal-close" onClick={onClose}>&times;</button>
      </div>
      {children}
    </div>
  </div>
);

export default Modal;
