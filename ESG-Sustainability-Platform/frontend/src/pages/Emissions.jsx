import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import api, { getErrorMessage } from "../services/api";

const SOURCES = ["Electricity", "Petrol", "Diesel", "NaturalGas", "Transportation", "Other"];
const emptyForm = { facility: "", department: "", source: "Electricity", quantity: "", unit: "litres", emissionFactor: "", date: "" };

const Emissions = () => {
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
        api.get("/emissions"), api.get("/org/departments"), api.get("/org/facilities"),
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
      source: r.source, quantity: r.quantity, unit: r.unit, emissionFactor: r.emissionFactor,
      date: r.date?.slice(0, 10),
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/emissions/${editing._id}`, form);
        showToast("Emission record updated successfully");
      } else {
        await api.post("/emissions", form);
        showToast("Emission record added successfully");
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
      await api.delete(`/emissions/${deleteTarget._id}`);
      showToast("Emission record deleted");
      setDeleteTarget(null);
      loadData();
    } catch (e) {
      showToast(getErrorMessage(e), "error");
    } finally {
      setDeleting(false);
    }
  };

  const filtered = records.filter((r) =>
    r.source.toLowerCase().includes(search.toLowerCase()) ||
    (r.facility?.name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout title="Carbon Emission Management">
      <div className="flex-between mb-16">
        <input className="form-input" style={{ maxWidth: 280 }} placeholder="Search source or facility..." value={search} onChange={(e) => setSearch(e.target.value)} />
        {canEdit && <button className="btn btn-primary" onClick={openCreate}>+ Add Emission Record</button>}
      </div>

      {error && <div className="error-banner">{error}</div>}
      {loading ? (
        <div className="loading-state">Loading emission records...</div>
      ) : filtered.length === 0 ? (
        <div className="card empty-state">No emission records found.</div>
      ) : (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th><th>Source</th><th>Facility</th><th>Department</th>
                <th>Quantity</th><th>Emission Factor</th><th>CO2e (kg)</th>
                {canEdit && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r._id}>
                  <td>{new Date(r.date).toLocaleDateString()}</td>
                  <td>{r.source}</td>
                  <td>{r.facility?.name}</td>
                  <td>{r.department?.name}</td>
                  <td>{r.quantity} {r.unit}</td>
                  <td>{r.emissionFactor}</td>
                  <td><strong>{r.co2e}</strong></td>
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
        <Modal title={editing ? "Edit Emission Record" : "Add Emission Record"} onClose={() => setShowForm(false)}>
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
                <label className="form-label">Emission Source</label>
                <select className="form-select" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
                  {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input type="date" className="form-input" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Quantity</label>
                <input type="number" min="0" step="0.01" className="form-input" required value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Unit</label>
                <input className="form-input" required value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="litres / m3 / km" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Emission Factor (kg CO2e per unit) — leave blank to auto-fill</label>
              <input type="number" min="0" step="0.001" className="form-input" value={form.emissionFactor} onChange={(e) => setForm({ ...form, emissionFactor: e.target.value })} placeholder="Auto-calculated from source if left blank" />
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
          message="This will permanently delete this emission record. This action cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </DashboardLayout>
  );
};

export default Emissions;
