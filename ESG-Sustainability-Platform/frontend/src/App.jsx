import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Energy from "./pages/Energy";
import Emissions from "./pages/Emissions";
import Waste from "./pages/Waste";
import Metrics from "./pages/Metrics";
import Targets from "./pages/Targets";
import Risks from "./pages/Risks";
import Reports from "./pages/Reports";
import Notifications from "./pages/Notifications";
import Users from "./pages/Users";
import Departments from "./pages/Departments";
import Facilities from "./pages/Facilities";
import Profile from "./pages/Profile";

const RootRedirect = () => {
  const { user } = useAuth();
  return <Navigate to={user ? "/dashboard" : "/login"} replace />;
};

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/energy" element={<ProtectedRoute><Energy /></ProtectedRoute>} />
            <Route path="/emissions" element={<ProtectedRoute><Emissions /></ProtectedRoute>} />
            <Route path="/waste" element={<ProtectedRoute><Waste /></ProtectedRoute>} />
            <Route path="/metrics" element={<ProtectedRoute><Metrics /></ProtectedRoute>} />
            <Route path="/targets" element={<ProtectedRoute><Targets /></ProtectedRoute>} />
            <Route path="/risks" element={<ProtectedRoute><Risks /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute allowedRoles={["admin", "esg_manager"]}><Reports /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute allowedRoles={["admin"]}><Users /></ProtectedRoute>} />
            <Route path="/departments" element={<ProtectedRoute allowedRoles={["admin"]}><Departments /></ProtectedRoute>} />
            <Route path="/facilities" element={<ProtectedRoute allowedRoles={["admin"]}><Facilities /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
