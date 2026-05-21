import { Navigate, Outlet } from "react-router-dom";
import useAuthStore from "../../store/useAuthStore";

const GuestGuard = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  if (isAuthenticated) {
    if (user?.role === "teacher") {
      return <Navigate to="/teacher/dashboard" replace />;
    }
    return <Navigate to="/student/dashboard" replace />;
  }

  return <Outlet />;
};

export default GuestGuard;
