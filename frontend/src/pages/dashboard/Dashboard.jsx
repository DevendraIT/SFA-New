import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  isFranchiseAdminUser,
  isSuperAdminUser,
  isCompanyAdminUser,
  isHeadOfSalesUser,
  isSalesManagerUser,
  isSalesExecutiveUser,
  isInventoryManagerUser,
  isWarehouseManagerUser,
} from "../../utils/roleUtils";

import SuperAdminDashboard from "./SuperAdminDashboard";
import CompanyAdminDashboard from "./CompanyAdminDashboard";
import HeadOfSalesDashboard from "./HeadOfSalesDashboard";
import ManagerDashboard from "./ManagerDashboard";
import SalesDashboard from "./SalesDashboard";

import InventoryDashboard from "../inventory/InventoryDashboard";
import WarehouseManagerDashboard from "./WarehouseManagerDashboard";

export default function Dashboard() {
  const { user } = useAuth();

  if (isFranchiseAdminUser(user)) {
    return <Navigate to="/franchise/dashboard" replace />;
  }

  if (isInventoryManagerUser(user)) {
    return <InventoryDashboard />;
  }

  if (isWarehouseManagerUser(user)) {
    return <WarehouseManagerDashboard />;
  }

  if (isSuperAdminUser(user)) {
    return <SuperAdminDashboard />;
  }

  if (isCompanyAdminUser(user)) {
    return <CompanyAdminDashboard />;
  }

  if (isHeadOfSalesUser(user)) {
    return <HeadOfSalesDashboard />;
  }

  if (isSalesManagerUser(user)) {
    return <ManagerDashboard />;
  }

  if (isSalesExecutiveUser(user)) {
    return <SalesDashboard />;
  }

  return <SalesDashboard />;
}


