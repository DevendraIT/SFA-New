import { useEffect } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  isInventoryManagerUser,
  isWarehouseManagerUser,
  isSalesExecutiveUser,
  isCompanyAdminUser,
  isSuperAdminUser,
  isHeadOfSalesUser,
  isSalesManagerUser,
} from "../utils/roleUtils";
import toast from "react-hot-toast";

// Guard for Global Inventory Manager Workspace (/inventory/*)
export function InventoryManagerRoute({ children }) {
  const { user, loading } = useAuth();
  const isAllowed = isInventoryManagerUser(user) || isSuperAdminUser(user) || isCompanyAdminUser(user);

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
  const isAllowed = isWarehouseManagerUser(user) || isInventoryManagerUser(user) || isSuperAdminUser(user) || isCompanyAdminUser(user);

  useEffect(() => {
    if (!loading && !isAllowed) {
      toast.error("Access Restricted: Warehouse Manager workspace");
    }
  }, [loading, isAllowed]);

  if (loading) return null;
  if (!isAllowed) return <Navigate to="/dashboard" replace />;

  return children;
}

// Guard for Shared Stock & Stock Movements Routes
export function StockAccessRoute({ children }) {
  const { user, loading } = useAuth();
  const isAllowed = isInventoryManagerUser(user) || isWarehouseManagerUser(user) || isSuperAdminUser(user) || isCompanyAdminUser(user);

  useEffect(() => {
    if (!loading && !isAllowed) {
      toast.error("Access Restricted: Inventory Workspace");
    }
  }, [loading, isAllowed]);

  if (loading) return null;
  if (!isAllowed) return <Navigate to="/dashboard" replace />;

  return children;
}

// Guard for Sales Orders (/orders)
export function SalesOrdersRoute({ children }) {
  const { user, loading } = useAuth();
  const isAllowed =
    isSuperAdminUser(user) ||
    isHeadOfSalesUser(user) ||
    isSalesManagerUser(user);

  useEffect(() => {
    if (!loading && !isAllowed) {
      toast.error("Access Restricted: Sales Orders is not available for your role");
    }
  }, [loading, isAllowed]);

  if (loading) return null;
  if (!isAllowed) return <Navigate to="/dashboard" replace />;

  return children;
}

// Guard for Organization Structure (/organization/*)
export function OrganizationRoute({ children }) {
  const { user, loading } = useAuth();
  const isAllowed =
    isCompanyAdminUser(user) ||
    isSuperAdminUser(user) ||
    isSalesManagerUser(user);

  useEffect(() => {
    if (!loading && !isAllowed) {
      toast.error("Access Restricted: Organization pages are not available for your role");
    }
  }, [loading, isAllowed]);

  if (loading) return null;
  if (!isAllowed) return <Navigate to="/dashboard" replace />;

  return children;
}

// Guard for Team Management (/team/*)
export function TeamManagementRoute({ children }) {
  const { user, loading } = useAuth();
  const isAllowed =
    isSalesManagerUser(user) ||
    isHeadOfSalesUser(user);

  useEffect(() => {
    if (!loading && !isAllowed) {
      toast.error("Access Restricted: Team Management is not available for your role");
    }
  }, [loading, isAllowed]);

  if (loading) return null;
  if (!isAllowed) return <Navigate to="/dashboard" replace />;

  return children;
}

// Guard for Field Force Automation (/field-force/*)
export function FieldForceRoute({ children }) {
  const { user, loading } = useAuth();
  const isAllowed = isSalesExecutiveUser(user) || isSuperAdminUser(user);

  useEffect(() => {
    if (!loading && !isAllowed) {
      toast.error("Access Restricted: Field Force workspace");
    }
  }, [loading, isAllowed]);

  if (loading) return null;
  if (!isAllowed) return <Navigate to="/dashboard" replace />;

  return children;
}

// Guard for Reports & Analytics (/reports/*)
export function ReportsRoute({ children }) {
  const { user, loading } = useAuth();
  const isAllowed =
    isHeadOfSalesUser(user) ||
    isSalesManagerUser(user) ||
    isCompanyAdminUser(user) ||
    isSuperAdminUser(user);

  useEffect(() => {
    if (!loading && !isAllowed) {
      toast.error("Access Restricted: Reports & Analytics");
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
