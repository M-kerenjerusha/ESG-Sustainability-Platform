import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import api, { getErrorMessage } from "../services/api";

const TYPES = ["Plastic", "Paper", "FoodWaste", "EWaste", "Metal", "General"];
const emptyForm = { facility: "", department: "", wasteType: "Plastic", quantity: "", unit: "kg", recycledQuantity: "0", reusedQuantity: "0", disposedQuantity: "0", date: "" };

const Waste = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const canEdit = ["admin", "esg_manager"].includes(user?.role);

  const [records, setRecords] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

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
      const [recRes, deptRes, facRes] = await Promise.all([
        api.get("/waste"), api.get("/org/departments"), api.get("/org/facilities"),
      ]);
      setRecords(recRes.data.data);
      setDepartments(deptRes.data.data);
      setFacilities(facRes.data.data);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (r) => {
    setEditing(r);
    setForm({
      facility: r.facility?._id || r.facility, department: r.department?._id || r.department,
      wasteType: r.wasteType, quantity: r.quantity, unit: r.unit,
      recycledQuantity: r.recycledQuantity, reusedQuantity: r.reusedQuantity, disposedQuantity: r.disposedQuantity,
      date: r.date?.slice(0, 10),
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/waste/${editing._id}`, form);
        showToast("Waste record updated successfully");
      } else {
        await api.post("/waste", form);
        showToast("Waste record added successfully");
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
      await api.delete(`/waste/${deleteTarget._id}`);
      showToast("Waste record deleted");
      setDeleteTarget(null);
      loadData();
    } catch (e) {
      showToast(getErrorMessage(e), "error");
    } finally {
      setDeleting(false);
    }
  };

  const filtered = records.filter((r) =>
    r.wasteType.toLowerCase().includes(search.toLowerCase()) ||
    (r.facility?.name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout title="Waste Management">
      <div className="flex-between mb-16">
        <input className="form-input" style={{ maxWidth: 280 }} placeholder="Search type or facility..." value={search} onChange={(e) => setSearch(e.target.value)} />
        {canEdit && <button className="btn btn-primary" onClick={openCreate}>+ Add Waste Record</button>}
      </div>

      {error && <div className="error-banner">{error}</div>}
      {loading ? (
        <div className="loading-state">Loading waste records...</div>
      ) : filtered.length === 0 ? (
        <div className="card empty-state">No waste records found.</div>
      ) : (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th><th>Type</th><th>Facility</th><th>Department</th>
                <th>Quantity (kg)</th><th>Recycled</th><th>Reused</th><th>Disposed</th>
                {canEdit && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r._id}>
                  <td>{new Date(r.date).toLocaleDateString()}</td>
                  <td>{r.wasteType}</td>
                  <td>{r.facility?.name}</td>
                  <td>{r.department?.name}</td>
                  <td>{r.quantity}</td>
                  <td>{r.recycledQuantity}</td>
                  <td>{r.reusedQuantity}</td>
                  <td>{r.disposedQuantity}</td>
                  {canEdit && (
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(r)}>Edit</button>{" "}
                      <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(r)}>Delete</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <Modal title={editing ? "Edit Waste Record" : "Add Waste Record"} onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Facility</label>
                <select className="form-select" required value={form.facility} onChange={(e) => setForm({ ...form, facility: e.target.value })}>
                  <option value="">Select facility</option>
                  {facilities.map((f) => <option key={f._id} value={f._id}>{f.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <select className="form-select" required value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
                  <option value="">Select department</option>
                  {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Waste Type</label>
                <select className="form-select" value={form.wasteType} onChange={(e) => setForm({ ...form, wasteType: e.target.value })}>
                  {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input type="date" className="form-input" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Total Quantity (kg)</label>
              <input type="number" min="0" step="0.01" className="form-input" required value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Recycled Quantity (kg)</label>
                <input type="number" min="0" step="0.01" className="form-input" value={form.recycledQuantity} onChange={(e) => setForm({ ...form, recycledQuantity: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Reused Quantity (kg)</label>
                <input type="number" min="0" step="0.01" className="form-input" value={form.reusedQuantity} onChange={(e) => setForm({ ...form, reusedQuantity: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Disposed Quantity (kg)</label>
              <input type="number" min="0" step="0.01" className="form-input" value={form.disposedQuantity} onChange={(e) => setForm({ ...form, disposedQuantity: e.target.value })} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving..." : "Save Record"}</button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          message="This will permanently delete this waste record. This action cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </DashboardLayout>
  );
};

export default Waste;
