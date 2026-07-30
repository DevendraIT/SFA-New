import { useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { USER_ROLES } from "../../config/constants";
import FieldForceDashboard from "./FieldForceDashboard";
import SuperAdminFieldForceDashboard from "./SuperAdminFieldForceDashboard";

export default function FieldForceDashboardWrapper() {
  const { user } = useAuth();

  const isSuperAdmin = useMemo(() => {
    if (!user) return false;
    let roleNames = [];
    if (Array.isArray(user.roles) && user.roles.length > 0) {
      roleNames = user.roles.map((r) => (typeof r === "string" ? r : r.role?.name || r.name || ""));
    } else if (user.role) {
      roleNames = [typeof user.role === "string" ? user.role : user.role.name || ""];
    }

    return roleNames.some(
      (r) =>
        r &&
        (r === "SUPER_ADMIN" ||
          r === "Super Admin" ||
          r === USER_ROLES.SUPER_ADMIN ||
          r === USER_ROLES.ADMIN ||
          r.toLowerCase().includes("super") ||
          (r.toLowerCase().includes("admin") && !r.toLowerCase().includes("company")))
    );
  }, [user]);

  if (isSuperAdmin) {
    return <SuperAdminFieldForceDashboard />;
  }

  return <FieldForceDashboard />;
}
