import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Array<"donor" | "hospital" | "bloodbank" | "admin">;
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // Also check sessionStorage as a fallback during auth state transitions
  const hasSession = typeof window !== 'undefined' && sessionStorage.getItem("crimsoncare_session_id");

  // Show loading state while checking authentication or if we have a session but user isn't loaded yet
  if (isLoading || (hasSession && !user)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on user's actual role
    const dashboardPath = getDashboardPath(user.role);
    return <Navigate to={dashboardPath} replace />;
  }

  return <>{children}</>;
};

const getDashboardPath = (role: string) => {
  switch (role) {
    case "hospital":
      return "/dashboard/hospital";
    case "bloodbank":
      return "/dashboard/bloodbank";
    case "admin":
      return "/dashboard/admin";
    default:
      return "/dashboard/donor";
  }
};

export default ProtectedRoute;
