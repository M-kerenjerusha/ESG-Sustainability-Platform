const STATUS_STYLES = {
  "On Track": "badge-blue",
  "At Risk": "badge-amber",
  Achieved: "badge-green",
  Overdue: "badge-red",
  active: "badge-green",
  inactive: "badge-gray",
  admin: "badge-green",
  esg_manager: "badge-blue",
  employee: "badge-gray",
  critical: "badge-red",
  warning: "badge-amber",
  info: "badge-blue",
};

const StatusBadge = ({ status }) => (
  <span className={`badge ${STATUS_STYLES[status] || "badge-gray"}`}>{status}</span>
);

export default StatusBadge;
