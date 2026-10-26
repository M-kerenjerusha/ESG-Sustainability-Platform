import { useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import api, { getErrorMessage } from "../services/api";

const Profile = () => {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const [name, setName] = useState(user?.name || "");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { name };
      if (password) payload.password = password;
      const { data } = await api.put("/auth/me", payload);
      if (updateUser) updateUser({ name: data.data.name });
      showToast("Profile updated successfully");
      setPassword("");
    } catch (e) {
      showToast(getErrorMessage(e), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout title="My Profile">
      <div className="card" style={{ maxWidth: 480 }}>
        <div className="section-title">Account Details</div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" value={user?.email} disabled />
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            <input className="form-input" value={user?.role?.replace("_", " ")} disabled />
          </div>
          <div className="form-group">
            <label className="form-label">New Password (leave blank to keep current)</label>
            <input type="password" className="form-input" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
