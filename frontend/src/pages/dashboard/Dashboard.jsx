import { useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { USER_ROLES } from "../../config/constants";

import SuperAdminDashboard from "./SuperAdminDashboard";
import CompanyAdminDashboard from "./CompanyAdminDashboard";
import HeadOfSalesDashboard from "./HeadOfSalesDashboard";
import ManagerDashboard from "./ManagerDashboard";
import SalesDashboard from "./SalesDashboard";

export default function Dashboard() {
  const { user } = useAuth();

  const isSuperAdmin = useMemo(() => {
    if (!user) return false;
    const roleNames = Array.isArray(user.roles)
      ? user.roles.map((r) => (typeof r === "string" ? r : r.role?.name || r.name))
      : [user.role?.name || ""];
    return roleNames.some((r) => r && r.toLowerCase().includes("super admin"));
  }, [user]);

  const isCompanyAdmin = useMemo(() => {
    if (!user) return false;
    const roleNames = Array.isArray(user.roles)
      ? user.roles.map((r) => (typeof r === "string" ? r : r.role?.name || r.name))
      : [user.role?.name || ""];
    return roleNames.some(
      (r) =>
        r &&
        (r.toLowerCase().includes("company admin") ||
          (r.toLowerCase().includes("admin") && !r.toLowerCase().includes("super admin")))
    );
  }, [user]);

  if (isSuperAdmin) {
    return <SuperAdminDashboard />;
  }

  if (isCompanyAdmin) {
    return <CompanyAdminDashboard />;
  }

  const role = Array.isArray(user?.roles) && user?.roles.length > 0
    ? user.roles[0]?.role?.name
    : user?.role?.name || null;

  switch (role) {
    case USER_ROLES.HEAD_OF_SALES:
      return <HeadOfSalesDashboard />;

    case USER_ROLES.SALES_MANAGER:
      return <ManagerDashboard />;

    case USER_ROLES.SALES_PERSON:
      return <SalesDashboard />;

    default:
      if (role?.toLowerCase().includes("head")) {
        return <HeadOfSalesDashboard />;
      }
      if (role?.toLowerCase().includes("manager")) {
        return <ManagerDashboard />;
      }
      return <SalesDashboard />;
  }
}


