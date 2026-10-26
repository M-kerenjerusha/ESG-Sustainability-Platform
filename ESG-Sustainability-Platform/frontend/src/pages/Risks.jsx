import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import api, { getErrorMessage } from "../services/api";

const Risks = () => {
  const [risks, setRisks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRisks = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/dashboard/risks");
      setRisks(data.data);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRisks(); }, []);

  return (
    <DashboardLayout title="ESG Risks & Recommendations">
      <div className="card panel" style={{ marginBottom: 20 }}>
        <div className="section-title">How this works</div>
        <p className="text-muted" style={{ margin: 0 }}>
          This engine compares the current period's emissions, energy usage, waste recycling rate, and target progress
          against previous periods and thresholds, using simple rule-based logic (no external AI). When a rule is
          triggered, it generates a risk with practical recommendations.
        </p>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {loading ? (
        <div className="loading-state">Analyzing ESG data...</div>
      ) : risks.length === 0 ? (
        <div className="card empty-state">✅ No significant ESG risks detected for the current period. Great job!</div>
      ) : (
        <div>
          {risks.map((r, i) => (
            <div key={i} className={`risk-card ${r.level}`}>
              <div className="flex-between">
                <div className="risk-title">{r.title}</div>
                <span className={`badge ${r.level === "critical" ? "badge-red" : "badge-amber"}`}>{r.level}</span>
              </div>
              <div className="text-muted" style={{ marginTop: 2 }}>Category: {r.category}</div>
              <p style={{ margin: "8px 0 0", fontSize: 14 }}>{r.description}</p>
              <strong style={{ fontSize: 13 }}>Recommendations:</strong>
              <ul>
                {r.recommendations.map((rec, j) => <li key={j}>{rec}</li>)}
              </ul>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default Risks;
