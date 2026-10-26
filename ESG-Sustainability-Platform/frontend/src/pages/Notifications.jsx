import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import StatusBadge from "../components/StatusBadge";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import api, { getErrorMessage } from "../services/api";

const Notifications = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const canGenerate = ["admin", "esg_manager"].includes(user?.role);

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState(false);

  const loadNotifications = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/notifications");
      setNotifications(data.data);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadNotifications(); }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await api.post("/notifications/generate");
      showToast("Notifications refreshed");
      loadNotifications();
    } catch (e) {
      showToast(getErrorMessage(e), "error");
    } finally {
      setGenerating(false);
    }
  };

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    } catch (e) {
      showToast(getErrorMessage(e), "error");
    }
  };

  return (
    <DashboardLayout title="Notifications">
      <div className="flex-between mb-16">
        <div className="text-muted">Alerts for targets, metrics, and ESG risks that need your attention.</div>
        {canGenerate && (
          <button className="btn btn-primary" onClick={handleGenerate} disabled={generating}>
            {generating ? "Scanning data..." : "Refresh Notifications"}
          </button>
        )}
      </div>

      {error && <div className="error-banner">{error}</div>}
      {loading ? (
        <div className="loading-state">Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <div className="card empty-state">No notifications right now. {canGenerate && "Click \"Refresh Notifications\" to scan for new alerts."}</div>
      ) : (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr><th>Message</th><th>Type</th><th>Severity</th><th>Date</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {notifications.map((n) => (
                <tr key={n._id} style={{ opacity: n.isRead ? 0.6 : 1 }}>
                  <td>{n.message}</td>
                  <td>{n.type}</td>
                  <td><StatusBadge status={n.severity} /></td>
                  <td>{new Date(n.createdAt).toLocaleDateString()}</td>
                  <td>{n.isRead ? "Read" : "Unread"}</td>
                  <td>{!n.isRead && <button className="btn btn-secondary btn-sm" onClick={() => markRead(n._id)}>Mark as Read</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Notifications;
