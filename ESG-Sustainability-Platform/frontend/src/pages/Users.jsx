import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import StatusBadge from "../components/StatusBadge";
import { useToast } from "../context/ToastContext";
import api, { getErrorMessage } from "../services/api";

const emptyForm = { name: "", email: "", password: "", role: "employee", department: "", isActive: true };

const Users = () => {
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
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
      const [uRes, dRes] = await Promise.all([api.get("/users"), api.get("/org/departments")]);
      setUsers(uRes.data.data);
      setDepartments(dRes.data.data);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (u) => {
    setEditing(u);
    setForm({ name: u.name, email: u.email, password: "", role: u.role, department: u.department?._id || "", isActive: u.isActive });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        await api.put(`/users/${editing._id}`, payload);
        showToast("User updated successfully");
      } else {
        await api.post("/users", form);
        showToast("User created successfully");
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
      await api.delete(`/users/${deleteTarget._id}`);
      showToast("User deleted");
      setDeleteTarget(null);
      loadData();
    } catch (e) {
      showToast(getErrorMessage(e), "error");
    } finally {
      setDeleting(false);
    }
  };

  const toggleActive = async (u) => {
    try {
      await api.put(`/users/${u._id}`, { isActive: !u.isActive });
      showToast(`User ${u.isActive ? "deactivated" : "activated"}`);
      loadData();
    } catch (e) {
      showToast(getErrorMessage(e), "error");
    }
  };

  return (
    <DashboardLayout title="User Management">
      <div className="flex-between mb-16">
        <div className="text-muted">Manage user accounts, roles, and departments.</div>
        <button className="btn btn-primary" onClick={openCreate}>+ Add User</button>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {loading ? (
        <div className="loading-state">Loading users...</div>
      ) : (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr><th>Name</th><th>Email</th><th>Role</th><th>Department</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td><StatusBadge status={u.role} /></td>
                  <td>{u.department?.name || "-"}</td>
                  <td><StatusBadge status={u.isActive ? "active" : "inactive"} /></td>
                  <td>
                    <button className="btn btn-secondary btn-sm" onClick={() => openEdit(u)}>Edit</button>{" "}
                    <button className="btn btn-secondary btn-sm" onClick={() => toggleActive(u)}>{u.isActive ? "Deactivate" : "Activate"}</button>{" "}
                    <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(u)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <Modal title={editing ? "Edit User" : "Add User"} onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="form-input" required disabled={!!editing} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">{editing ? "New Password (leave blank to keep current)" : "Password"}</label>
              <input type="password" className="form-input" required={!editing} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  <option value="employee">Employee</option>
                  <option value="esg_manager">ESG Manager</option>
                  <option value="admin">Admin</option>
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
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving..." : "Save User"}</button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog message={`This will permanently delete ${deleteTarget.name}'s account.`} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleting} />
      )}
    </DashboardLayout>
  );
};

export default Users;
