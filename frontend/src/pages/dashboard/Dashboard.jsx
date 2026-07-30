import { useMemo } from "react";
import { useAuth } from "../../context/AuthContext";

import SuperAdminDashboard from "./SuperAdminDashboard";
import HeadOfSalesDashboard from "./HeadOfSalesDashboard";
import ManagerDashboard from "./ManagerDashboard";
import SalesDashboard from "./SalesDashboard";

export default function Dashboard() {
  const { user } = useAuth();

  const role = useMemo(() => {
    if (!user) return null;

    if (Array.isArray(user.roles) && user.roles.length > 0) {
      for (const r of user.roles) {
        const name = typeof r === "string" ? r : r?.role?.name || r?.name;
        if (name) return name;
      }
    }

    if (typeof user.role === "string") return user.role;
    return user.role?.name || null;
  }, [user]);

  const roleLower = (role || "").toLowerCase();

  // Route to the appropriate dashboard based on role
  if (
    roleLower.includes("super") ||
    roleLower === "admin" ||
    roleLower === "administrator" ||
    (roleLower.includes("admin") && !roleLower.includes("company"))
  ) {
    return <SuperAdminDashboard />;
  }

  if (roleLower.includes("head")) {
    return <HeadOfSalesDashboard />;
  }

  if (roleLower.includes("manager")) {
    return <ManagerDashboard />;
  }

  return <SalesDashboard />;
}



