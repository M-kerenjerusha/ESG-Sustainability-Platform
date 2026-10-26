import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import api, { getErrorMessage } from "../services/api";

const emptyForm = { facility: "", department: "", date: "", electricityConsumption: "", renewableEnergy: "", fuelConsumption: "", waterConsumption: "", unit: "kWh" };

const Energy = () => {
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
        api.get("/energy"),
        api.get("/org/departments"),
        api.get("/org/facilities"),
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
      date: r.date?.slice(0, 10), electricityConsumption: r.electricityConsumption, renewableEnergy: r.renewableEnergy,
      fuelConsumption: r.fuelConsumption, waterConsumption: r.waterConsumption, unit: r.unit,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/energy/${editing._id}`, form);
        showToast("Energy record updated successfully");
      } else {
        await api.post("/energy", form);
        showToast("Energy record added successfully");
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
      await api.delete(`/energy/${deleteTarget._id}`);
      showToast("Energy record deleted");
      setDeleteTarget(null);
      loadData();
    } catch (e) {
      showToast(getErrorMessage(e), "error");
    } finally {
      setDeleting(false);
    }
  };

  const filtered = records.filter((r) =>
    (r.facility?.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (r.department?.name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout title="Energy Management">
      <div className="flex-between mb-16">
        <input className="form-input" style={{ maxWidth: 280 }} placeholder="Search facility or department..." value={search} onChange={(e) => setSearch(e.target.value)} />
        {canEdit && <button className="btn btn-primary" onClick={openCreate}>+ Add Energy Record</button>}
      </div>

      {error && <div className="error-banner">{error}</div>}
      {loading ? (
        <div className="loading-state">Loading energy records...</div>
      ) : filtered.length === 0 ? (
        <div className="card empty-state">No energy records found. {canEdit && "Click \"Add Energy Record\" to create one."}</div>
      ) : (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th><th>Facility</th><th>Department</th><th>Electricity (kWh)</th>
                <th>Renewable (kWh)</th><th>Renewable %</th><th>Fuel (L)</th><th>Water (KL)</th>
                {canEdit && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r._id}>
                  <td>{new Date(r.date).toLocaleDateString()}</td>
                  <td>{r.facility?.name}</td>
                  <td>{r.department?.name}</td>
                  <td>{r.electricityConsumption}</td>
                  <td>{r.renewableEnergy}</td>
                  <td>{r.renewablePercentage}%</td>
                  <td>{r.fuelConsumption}</td>
                  <td>{r.waterConsumption}</td>
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
        <Modal title={editing ? "Edit Energy Record" : "Add Energy Record"} onClose={() => setShowForm(false)}>
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
            <div className="form-group">
              <label className="form-label">Date</label>
              <input type="date" className="form-input" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Electricity Consumption (kWh)</label>
                <input type="number" min="0" step="0.01" className="form-input" required value={form.electricityConsumption} onChange={(e) => setForm({ ...form, electricityConsumption: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Renewable Energy (kWh)</label>
                <input type="number" min="0" step="0.01" className="form-input" required value={form.renewableEnergy} onChange={(e) => setForm({ ...form, renewableEnergy: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Fuel Consumption (litres)</label>
                <input type="number" min="0" step="0.01" className="form-input" required value={form.fuelConsumption} onChange={(e) => setForm({ ...form, fuelConsumption: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Water Consumption (KL)</label>
                <input type="number" min="0" step="0.01" className="form-input" required value={form.waterConsumption} onChange={(e) => setForm({ ...form, waterConsumption: e.target.value })} />
              </div>
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
          message="This will permanently delete this energy record. This action cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </DashboardLayout>
  );
};

export default Energy;
