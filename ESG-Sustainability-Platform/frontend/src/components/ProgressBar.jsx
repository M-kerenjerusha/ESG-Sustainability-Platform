const COLORS = {
  "On Track": "#1c72a8",
  "At Risk": "#e0a72e",
  Achieved: "#2e9c60",
  Overdue: "#d64545",
};

const ProgressBar = ({ value, status }) => (
  <div className="progress-track">
    <div
      className="progress-fill"
      style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: COLORS[status] || "#2e9c60" }}
    />
  </div>
);

export default ProgressBar;
