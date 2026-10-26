import { useEffect, useState } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import DashboardLayout from "../layouts/DashboardLayout";
import StatCard from "../components/StatCard";
import api, { getErrorMessage } from "../services/api";

const COLORS = ["#2e9c60", "#1c72a8", "#e0a72e", "#d64545", "#8a6413", "#37413c"];

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [departments, setDepartments] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [filters, setFilters] = useState({ department: "", facility: "", from: "", to: "" });

  const loadFilters = async () => {
    try {
      const [deptRes, facRes] = await Promise.all([api.get("/org/departments"), api.get("/org/facilities")]);
      setDepartments(deptRes.data.data);
      setFacilities(facRes.data.data);
    } catch (e) {
      // non-critical
    }
  };

  const loadDashboard = async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
      const { data } = await api.get("/dashboard/summary", { params });
      setData(data.data);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadFilters(); }, []);
  useEffect(() => { loadDashboard(); }, [filters]);

  return (
    <DashboardLayout title="ESG Dashboard">
      <div className="filters-bar">
        <div className="form-group">
          <label className="form-label">Department</label>
          <select className="form-select" value={filters.department} onChange={(e) => setFilters({ ...filters, department: e.target.value })}>
            <option value="">All Departments</option>
            {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Facility</label>
          <select className="form-select" value={filters.facility} onChange={(e) => setFilters({ ...filters, facility: e.target.value })}>
            <option value="">All Facilities</option>
            {facilities.map((f) => <option key={f._id} value={f._id}>{f.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">From</label>
          <input type="date" className="form-input" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">To</label>
          <input type="date" className="form-input" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
        </div>
        <button className="btn btn-secondary" onClick={() => setFilters({ department: "", facility: "", from: "", to: "" })}>Clear Filters</button>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {loading && <div className="loading-state">Loading dashboard data...</div>}

      {!loading && data && (
        <>
          <div className="grid grid-4 panel">
            <StatCard label="Total Energy Consumption" value={`${data.totals.totalEnergy.toLocaleString()} kWh`} />
            <StatCard label="Total Carbon Emissions" value={`${data.totals.totalEmissions.toLocaleString()} kg CO2e`} />
            <StatCard label="Total Waste Generated" value={`${data.totals.totalWaste.toLocaleString()} kg`} />
            <StatCard label="Recycling Rate" value={`${data.totals.recyclingPercentage}%`} />
          </div>

          <div className="grid grid-4 panel">
            <StatCard label="Renewable Energy %" value={`${data.totals.renewablePercentage}%`} />
            <StatCard label="Environmental Score" value={data.esgScore.environmentalScore} />
            <StatCard label="Social Score" value={data.esgScore.socialScore} />
            <StatCard label="Governance Score" value={data.esgScore.governanceScore} />
          </div>

          <div className="card panel" style={{ marginBottom: 20 }}>
            <div className="flex-between">
              <div>
                <div className="stat-label">Overall ESG Score</div>
                <div className="stat-value" style={{ fontSize: 36 }}>{data.esgScore.overallScore} / 100</div>
              </div>
              <div className="text-muted" style={{ maxWidth: 420, textAlign: "right" }}>
                {data.esgScore.methodology.description}
              </div>
            </div>
          </div>

          <div className="grid grid-2 panel">
            <div className="card">
              <div className="section-title">Energy Consumption Over Time</div>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={data.charts.energyOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#2e9c60" strokeWidth={2} name="Energy (kWh)" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <div className="section-title">Carbon Emissions Over Time</div>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={data.charts.emissionsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#d64545" strokeWidth={2} name="CO2e (kg)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-2 panel">
            <div className="card">
              <div className="section-title">Waste Generation Over Time</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.charts.wasteOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#1c72a8" name="Waste (kg)" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <div className="section-title">Waste Type Distribution</div>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={data.charts.wasteByType} dataKey="value" nameKey="type" cx="50%" cy="50%" outerRadius={90} label>
                    {data.charts.wasteByType.map((entry, index) => (
                      <Cell key={entry.type} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-2 panel">
            <div className="card">
              <div className="section-title">Renewable vs Non-Renewable Energy</div>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={data.charts.renewableVsNonRenewable} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                    <Cell fill="#2e9c60" />
                    <Cell fill="#dfe4e2" />
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <div className="section-title">Environmental / Social / Governance Comparison</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.charts.esgCategoryComparison}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" fontSize={12} />
                  <YAxis fontSize={12} domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="score" fill="#237a4b" name="Score" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card panel">
            <div className="section-title">Target vs Actual Performance</div>
            {data.targetOverview.length === 0 ? (
              <div className="empty-state">No sustainability targets created yet.</div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Target</th><th>Category</th><th>Current</th><th>Target</th><th>Progress</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {data.targetOverview.map((t) => (
                      <tr key={t.name}>
                        <td>{t.name}</td>
                        <td>{t.category}</td>
                        <td>{t.currentValue}</td>
                        <td>{t.targetValue}</td>
                        <td style={{ width: 140 }}>
                          <div className="progress-track"><div className="progress-fill" style={{ width: `${t.progress}%` }} /></div>
                        </td>
                        <td>{t.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </DashboardLayout>
  );
};

export default Dashboard;
