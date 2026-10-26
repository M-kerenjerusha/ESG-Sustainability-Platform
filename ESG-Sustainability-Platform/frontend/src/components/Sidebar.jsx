import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const LINKS = [
  { to: "/dashboard", label: "Dashboard", roles: ["admin", "esg_manager", "employee"] },
  { to: "/energy", label: "Energy Management", roles: ["admin", "esg_manager", "employee"] },
  { to: "/emissions", label: "Carbon Emissions", roles: ["admin", "esg_manager", "employee"] },
  { to: "/waste", label: "Waste Management", roles: ["admin", "esg_manager", "employee"] },
  { to: "/metrics", label: "ESG Metrics", roles: ["admin", "esg_manager", "employee"] },
  { to: "/targets", label: "Sustainability Targets", roles: ["admin", "esg_manager", "employee"] },
  { to: "/risks", label: "Risks & Recommendations", roles: ["admin", "esg_manager", "employee"] },
  { to: "/reports", label: "Sustainability Reports", roles: ["admin", "esg_manager"] },
  { to: "/notifications", label: "Notifications", roles: ["admin", "esg_manager", "employee"] },
  { to: "/users", label: "User Management", roles: ["admin"] },
  { to: "/departments", label: "Departments", roles: ["admin"] },
  { to: "/facilities", label: "Facilities", roles: ["admin"] },
  { to: "/profile", label: "Profile", roles: ["admin", "esg_manager", "employee"] },
];

const Sidebar = () => {
  const { user } = useAuth();
  const visible = LINKS.filter((l) => l.roles.includes(user?.role));

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">🌱 ESG Platform</div>
      <nav className="sidebar-nav">
        {visible.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) => "sidebar-link" + (isActive ? " active" : "")}
          >
            {l.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
