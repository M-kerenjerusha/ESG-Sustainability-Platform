import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import api, { getErrorMessage } from "../services/api";

const CATEGORIES = ["Environmental", "Social", "Governance"];
const emptyForm = { name: "", category: "Environmental", value: "", target: "", unit: "", date: "", department: "" };

const Metrics = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const canEdit = ["admin", "esg_manager"].includes(user?.role);

  const [metrics, setMetrics] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState("");
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
      const [mRes, dRes] = await Promise.all([
        api.get("/metrics", { params: categoryFilter ? { category: categoryFilter } : {} }),
        api.get("/org/departments"),
      ]);
      setMetrics(mRes.data.data);
      setDepartments(dRes.data.data);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [categoryFilter]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (m) => {
    setEditing(m);
    setForm({ name: m.name, category: m.category, value: m.value, target: m.target, unit: m.unit, date: m.date?.slice(0, 10), department: m.department?._id || "" });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/metrics/${editing._id}`, form);
        showToast("Metric updated successfully");
      } else {
        await api.post("/metrics", form);
        showToast("Metric created successfully");
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
      await api.delete(`/metrics/${deleteTarget._id}`);
      showToast("Metric deleted");
      setDeleteTarget(null);
      loadData();
    } catch (e) {
      showToast(getErrorMessage(e), "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DashboardLayout title="ESG Metrics">
      <div className="flex-between mb-16">
        <select className="form-select" style={{ maxWidth: 220 }} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        {canEdit && <button className="btn btn-primary" onClick={openCreate}>+ Add ESG Metric</button>}
      </div>

      {error && <div className="error-banner">{error}</div>}
      {loading ? (
        <div className="loading-state">Loading metrics...</div>
      ) : metrics.length === 0 ? (
        <div className="card empty-state">No ESG metrics found.</div>
      ) : (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr><th>Name</th><th>Category</th><th>Value</th><th>Target</th><th>Unit</th><th>Department</th><th>Date</th>{canEdit && <th>Actions</th>}</tr>
            </thead>
            <tbody>
              {metrics.map((m) => (
                <tr key={m._id}>
                  <td>{m.name}</td>
                  <td><span className="badge badge-blue">{m.category}</span></td>
                  <td>{m.value}</td>
                  <td>{m.target}</td>
                  <td>{m.unit}</td>
                  <td>{m.department?.name || "-"}</td>
                  <td>{new Date(m.date).toLocaleDateString()}</td>
                  {canEdit && (
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(m)}>Edit</button>{" "}
                      <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(m)}>Delete</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <Modal title={editing ? "Edit ESG Metric" : "Add ESG Metric"} onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Metric Name</label>
              <input className="form-input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Employee Training Hours" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <select className="form-select" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
                  <option value="">None</option>
                  {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Value</label>
                <input type="number" step="0.01" className="form-input" required value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Target</label>
                <input type="number" step="0.01" className="form-input" required value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Unit</label>
                <input className="form-input" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="%, hrs, count..." />
              </div>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input type="date" className="form-input" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving..." : "Save Metric"}</button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog message="This will permanently delete this ESG metric." onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleting} />
      )}
    </DashboardLayout>
  );
};

export default Metrics;
