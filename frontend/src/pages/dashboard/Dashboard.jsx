import { useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { USER_ROLES } from "../../config/constants";

import SuperAdminDashboard from "./SuperAdminDashboard";
import HeadOfSalesDashboard from "./HeadOfSalesDashboard";
import ManagerDashboard from "./ManagerDashboard";
import SalesDashboard from "./SalesDashboard";

export default function Dashboard() {
  const { user } = useAuth();

  const role = useMemo(() => {
    if (!user) return null;

    if (Array.isArray(user.roles) && user.roles.length > 0) {
      return user.roles[0]?.role?.name;
    }

    return user.role?.name || null;
  }, [user]);

  // Route to the appropriate dashboard based on role
  switch (role) {
    case USER_ROLES.SUPER_ADMIN:
    case USER_ROLES.ADMIN:
      return <SuperAdminDashboard />;

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
      if (role?.toLowerCase().includes("admin")) {
        return <SuperAdminDashboard />;
      }
      if (role?.toLowerCase().includes("manager")) {
        return <ManagerDashboard />;
      }
      return <SalesDashboard />;
  }
}


