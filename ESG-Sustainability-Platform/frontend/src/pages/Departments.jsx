import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import { useToast } from "../context/ToastContext";
import api, { getErrorMessage } from "../services/api";

const emptyForm = { name: "", description: "", facility: "" };

const Departments = () => {
  const { showToast } = useToast();
  const [departments, setDepartments] = useState([]);
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
      const [dRes, fRes] = await Promise.all([api.get("/org/departments"), api.get("/org/facilities")]);
      setDepartments(dRes.data.data);
      setFacilities(fRes.data.data);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (d) => {
    setEditing(d);
    setForm({ name: d.name, description: d.description || "", facility: d.facility?._id || "" });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/org/departments/${editing._id}`, form);
        showToast("Department updated successfully");
      } else {
        await api.post("/org/departments", form);
        showToast("Department created successfully");
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
      await api.delete(`/org/departments/${deleteTarget._id}`);
      showToast("Department deleted");
      setDeleteTarget(null);
      loadData();
    } catch (e) {
      showToast(getErrorMessage(e), "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DashboardLayout title="Department Management">
      <div className="flex-between mb-16">
        <div className="text-muted">Manage the departments within your organization.</div>
        <button className="btn btn-primary" onClick={openCreate}>+ Add Department</button>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {loading ? (
        <div className="loading-state">Loading departments...</div>
      ) : departments.length === 0 ? (
        <div className="card empty-state">No departments yet.</div>
      ) : (
        <div className="card table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Description</th><th>Facility</th><th>Actions</th></tr></thead>
            <tbody>
              {departments.map((d) => (
                <tr key={d._id}>
                  <td>{d.name}</td>
                  <td>{d.description || "-"}</td>
                  <td>{d.facility?.name || "-"}</td>
                  <td>
                    <button className="btn btn-secondary btn-sm" onClick={() => openEdit(d)}>Edit</button>{" "}
                    <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(d)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <Modal title={editing ? "Edit Department" : "Add Department"} onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Department Name</label>
              <input className="form-input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <input className="form-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Facility</label>
              <select className="form-select" value={form.facility} onChange={(e) => setForm({ ...form, facility: e.target.value })}>
                <option value="">None</option>
                {facilities.map((f) => <option key={f._id} value={f._id}>{f.name}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving..." : "Save Department"}</button>
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

export default Departments;
