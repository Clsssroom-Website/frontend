import { Navigate, Outlet } from "react-router-dom";
import useAuthStore from "../../store/useAuthStore";

interface RoleGuardProps {
  allowedRoles: string[];
}

const RoleGuard = ({ allowedRoles }: RoleGuardProps) => {
  const user = useAuthStore((state) => state.user);

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
};

export default RoleGuard;
