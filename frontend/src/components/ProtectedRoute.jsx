import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { getDashboardPath } from "../utils/rolePaths";

const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 text-slate-700">
        Checking your session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    const fallbackPath = getDashboardPath(user.role);
    return <Navigate to={fallbackPath} replace />;
  }

  return children;
};

export default ProtectedRoute;
