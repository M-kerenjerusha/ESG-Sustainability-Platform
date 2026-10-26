import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

const DashboardLayout = ({ title, children }) => (
  <div className="app-shell">
    <Sidebar />
    <div className="main-area">
      <Navbar title={title} />
      <div className="content">{children}</div>
    </div>
  </div>
);

export default DashboardLayout;
