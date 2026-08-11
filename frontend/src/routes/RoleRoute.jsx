import { useEffect } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  isInventoryManagerUser,
  isWarehouseManagerUser,
  isSalesExecutiveUser,
  isCompanyAdminUser,
  isSuperAdminUser,
} from "../utils/roleUtils";
import toast from "react-hot-toast";

// Guard for Global Inventory Manager Workspace (/inventory/*)
export function InventoryManagerRoute({ children }) {
  const { user, loading } = useAuth();
  const isAllowed =
    isInventoryManagerUser(user) ||
    isWarehouseManagerUser(user) ||
    isCompanyAdminUser(user) ||
    isSuperAdminUser(user);

  useEffect(() => {
    if (!loading && !isAllowed) {
      toast.error("Access Restricted: Inventory Manager workspace");
    }
  }, [loading, isAllowed]);

  if (loading) return null;
  if (!isAllowed) return <Navigate to="/dashboard" replace />;

  return children;
}

// Guard for Warehouse Manager Workspace (/inventory/warehouse/*)
export function WarehouseManagerRoute({ children }) {
  const { user, loading } = useAuth();
  const isAllowed =
    isWarehouseManagerUser(user) ||
    isInventoryManagerUser(user) ||
    isCompanyAdminUser(user) ||
    isSuperAdminUser(user);

  useEffect(() => {
    if (!loading && !isAllowed) {
      toast.error("Access Restricted: Warehouse Manager workspace");
    }
  }, [loading, isAllowed]);

  if (loading) return null;
  if (!isAllowed) return <Navigate to="/dashboard" replace />;

  return children;
}

// Guard for Sales Executive Task Execution (/field-force/tasks/:id/execute)
export function TaskExecutionRoute({ children }) {
  const { user, loading } = useAuth();
  const { id } = useParams();
  const isAllowed = isSalesExecutiveUser(user);

  useEffect(() => {
    if (!loading && !isAllowed) {
      toast.error("Redirected to Administrative Task Details");
    }
  }, [loading, isAllowed]);

  if (loading) return null;
  if (!isAllowed) {
    return <Navigate to={id ? `/team/tasks/${id}` : "/dashboard"} replace />;
  }

  return children;
}
