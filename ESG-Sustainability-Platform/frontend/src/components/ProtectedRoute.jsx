import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// WHAT: This component guards pages so only logged-in users (and allowed roles) can see them.
// If allowedRoles is not given, any logged-in user can view the page.
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

export default ProtectedRoute;
