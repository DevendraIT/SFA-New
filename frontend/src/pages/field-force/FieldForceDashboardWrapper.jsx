import { useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { USER_ROLES } from "../../config/constants";
import FieldForceDashboard from "./FieldForceDashboard";
import SuperAdminFieldForceDashboard from "./SuperAdminFieldForceDashboard";

export default function FieldForceDashboardWrapper() {
  const { user } = useAuth();

  const isSuperAdmin = useMemo(() => {
    if (!user) return false;
    let role = null;
    if (Array.isArray(user.roles) && user.roles.length > 0) {
      role = user.roles[0]?.role?.name;
    } else {
      role = user.role?.name;
    }

    if (!role) return false;

    return (
      role === "SUPER_ADMIN" ||
      role === "Super Admin" ||
      role === USER_ROLES.SUPER_ADMIN ||
      role === USER_ROLES.ADMIN ||
      role?.toLowerCase().includes("super") ||
      (role?.toLowerCase().includes("admin") && !role?.toLowerCase().includes("organization"))
    );
  }, [user]);

  if (isSuperAdmin) {
    return <SuperAdminFieldForceDashboard />;
  }

  return <FieldForceDashboard />;
}
