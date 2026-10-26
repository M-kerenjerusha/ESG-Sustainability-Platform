import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import { useToast } from "../context/ToastContext";
import api, { getErrorMessage } from "../services/api";

const emptyForm = { name: "", location: "", type: "Office" };

const Facilities = () => {
  const { showToast } = useToast();
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/org/facilities");
      setFacilities(data.data);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (f) => { setEditing(f); setForm({ name: f.name, location: f.location || "", type: f.type }); setShowForm(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/org/facilities/${editing._id}`, form);
        showToast("Facility updated successfully");
      } else {
        await api.post("/org/facilities", form);
        showToast("Facility created successfully");
      }
      setShowForm(false);
      loadData();
    } catch (e) {
      showToast(getErrorMessage(e), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/org/facilities/${deleteTarget._id}`);
      showToast("Facility deleted");
      setDeleteTarget(null);
      loadData();
    } catch (e) {
      showToast(getErrorMessage(e), "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DashboardLayout title="Facility Management">
      <div className="flex-between mb-16">
        <div className="text-muted">Manage physical facilities and sites.</div>
        <button className="btn btn-primary" onClick={openCreate}>+ Add Facility</button>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {loading ? (
        <div className="loading-state">Loading facilities...</div>
      ) : facilities.length === 0 ? (
        <div className="card empty-state">No facilities yet.</div>
      ) : (
        <div className="card table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Location</th><th>Type</th><th>Actions</th></tr></thead>
            <tbody>
              {facilities.map((f) => (
                <tr key={f._id}>
                  <td>{f.name}</td>
                  <td>{f.location || "-"}</td>
                  <td>{f.type}</td>
                  <td>
                    <button className="btn btn-secondary btn-sm" onClick={() => openEdit(f)}>Edit</button>{" "}
                    <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(f)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <Modal title={editing ? "Edit Facility" : "Add Facility"} onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Facility Name</label>
              <input className="form-input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Location</label>
              <input className="form-input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Type</label>
              <select className="form-select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="Office">Office</option>
                <option value="Plant">Plant</option>
                <option value="Warehouse">Warehouse</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving..." : "Save Facility"}</button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog message={`This will permanently delete "${deleteTarget.name}".`} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleting} />
      )}
    </DashboardLayout>
  );
};

export default Facilities;
