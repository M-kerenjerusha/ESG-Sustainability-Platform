import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import ProgressBar from "../components/ProgressBar";
import StatusBadge from "../components/StatusBadge";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import api, { getErrorMessage } from "../services/api";

const CATEGORIES = ["Environmental", "Social", "Governance"];
const emptyForm = { name: "", category: "Environmental", currentValue: "", targetValue: "", unit: "", deadline: "", department: "", direction: "increase" };

const Targets = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const canEdit = ["admin", "esg_manager"].includes(user?.role);

  const [targets, setTargets] = useState([]);
  const [departments, setDepartments] = useState([]);
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
      const [tRes, dRes] = await Promise.all([api.get("/targets"), api.get("/org/departments")]);
      setTargets(tRes.data.data);
      setDepartments(dRes.data.data);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (t) => {
    setEditing(t);
    setForm({
      name: t.name, category: t.category, currentValue: t.currentValue, targetValue: t.targetValue,
      unit: t.unit, deadline: t.deadline?.slice(0, 10), department: t.department?._id || "", direction: t.direction,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/targets/${editing._id}`, form);
        showToast("Target updated successfully");
      } else {
        await api.post("/targets", form);
        showToast("Target created successfully");
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
      await api.delete(`/targets/${deleteTarget._id}`);
      showToast("Target deleted");
      setDeleteTarget(null);
      loadData();
    } catch (e) {
      showToast(getErrorMessage(e), "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DashboardLayout title="Sustainability Targets">
      <div className="flex-between mb-16">
        <div className="text-muted">Track progress toward your organization's sustainability goals.</div>
        {canEdit && <button className="btn btn-primary" onClick={openCreate}>+ Create Target</button>}
      </div>

      {error && <div className="error-banner">{error}</div>}
      {loading ? (
        <div className="loading-state">Loading targets...</div>
      ) : targets.length === 0 ? (
        <div className="card empty-state">No sustainability targets created yet.</div>
      ) : (
        <div className="grid grid-2">
          {targets.map((t) => (
            <div className="card" key={t._id}>
              <div className="flex-between" style={{ marginBottom: 10 }}>
                <strong>{t.name}</strong>
                <StatusBadge status={t.status} />
              </div>
              <div className="text-muted" style={{ marginBottom: 10 }}>
                {t.category} • Deadline: {new Date(t.deadline).toLocaleDateString()} • {t.department?.name || "All departments"}
              </div>
              <ProgressBar value={t.progress} status={t.status} />
              <div className="flex-between" style={{ marginTop: 8, fontSize: 13 }}>
                <span>Current: {t.currentValue} {t.unit}</span>
                <span>Target: {t.targetValue} {t.unit}</span>
                <span>{t.progress}%</span>
              </div>
              {canEdit && (
                <div style={{ marginTop: 14 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => openEdit(t)}>Edit</button>{" "}
                  <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(t)}>Delete</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <Modal title={editing ? "Edit Target" : "Create Sustainability Target"} onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Target Name</label>
              <input className="form-input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Reduce carbon emissions to 60 tCO2e" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Direction</label>
                <select className="form-select" value={form.direction} onChange={(e) => setForm({ ...form, direction: e.target.value })}>
                  <option value="increase">Increase is better (e.g. renewable %)</option>
                  <option value="decrease">Decrease is better (e.g. emissions)</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Current Value</label>
                <input type="number" step="0.01" className="form-input" required value={form.currentValue} onChange={(e) => setForm({ ...form, currentValue: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Target Value</label>
                <input type="number" step="0.01" className="form-input" required value={form.targetValue} onChange={(e) => setForm({ ...form, targetValue: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Unit</label>
                <input className="form-input" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="tCO2e, %, KL..." />
              </div>
              <div className="form-group">
                <label className="form-label">Deadline</label>
                <input type="date" className="form-input" required value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Department</label>
              <select className="form-select" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
                <option value="">All departments</option>
                {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving..." : "Save Target"}</button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog message="This will permanently delete this target." onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleting} />
      )}
    </DashboardLayout>
  );
};

export default Targets;
