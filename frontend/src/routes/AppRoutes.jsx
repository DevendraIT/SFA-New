import { Navigate, Route, Routes } from "react-router-dom";

import Login from "../pages/auth/Login";
import ForgotPassword from "../pages/auth/ForgotPassword";
import ResetPassword from "../pages/auth/ResetPassword";

import Dashboard from "../pages/dashboard/Dashboard";
import InventoryDashboard from "../pages/inventory/InventoryDashboard";
import WarehouseManagerDashboard from "../pages/dashboard/WarehouseManagerDashboard";
import Products from "../pages/inventory/Products";
import Warehouses from "../pages/inventory/Warehouses";
import Stock from "../pages/inventory/Stock";
import ProductIssues from "../pages/inventory/ProductIssues";
import StockMovements from "../pages/inventory/StockMovements";
import MyWarehouse from "../pages/inventory/MyWarehouse";

import DashboardLayout from "../layouts/DashboardLayout";

import ProtectedRoute from "./ProtectedRoute";
import {
  InventoryManagerRoute,
  WarehouseManagerRoute,
  StockAccessRoute,
  TaskExecutionRoute,
  SalesOrdersRoute,
  OrganizationRoute,
  TeamManagementRoute,
  FieldForceRoute,
  ReportsRoute,
} from "./RoleRoute";

import BranchList from "../pages/organization/branch/BranchList";
import OrganizationProfile from "../pages/organization/OrganizationProfile";
import DepartmentList from "../pages/organization/department/DepartmentList";
import TerritoryList from "../pages/organization/territory/TerritoryList";
import TeamList from "../pages/organization/team/TeamList";
import UserList from "../pages/organization/user/UserList";

import TeamManagement from "../pages/team/TeamManagement";
import ExecutiveDetail from "../pages/team/ExecutiveDetail";
import AssignedTasks from "../pages/team/AssignedTasks";
import ExecutivePerformance from "../pages/team/ExecutivePerformance";
import TaskDetail from "../pages/team/TaskDetail";

// Field Force Pages
import FieldForceDashboardWrapper from "../pages/field-force/FieldForceDashboardWrapper";
import AttendancePage from "../pages/field-force/AttendancePage";
import TasksPage from "../pages/field-force/TasksPage";
import VisitsPage from "../pages/field-force/VisitsPage";
import ActivitiesPage from "../pages/field-force/ActivitiesPage";
import DARPage from "../pages/field-force/DARPage";
import ProfilePage from "../pages/field-force/ProfilePage";
import TaskExecutionPage from "../pages/field-force/TaskExecutionPage";
import OrdersPage from "../pages/sales-order/OrdersPage";
import VisitDetailPage from "../pages/field-force/VisitDetailPage";
import BeatPlanningPage from "../pages/field-force/BeatPlanningPage";
import RouteOptimizationPage from "../pages/field-force/RouteOptimizationPage";
import PhotoUploadPage from "../pages/field-force/PhotoUploadPage";
import MeetingNotesPage from "../pages/field-force/MeetingNotesPage";
import ExpensesPage from "../pages/field-force/ExpensesPage";
import CalendarPage from "../pages/field-force/CalendarPage";
import ReportsPage from "../pages/reports/ReportsPage";
import NotificationsPage from "../pages/notifications/NotificationsPage";
import SettingsPage from "../pages/settings/SettingsPage";
import NotFoundPage from "../pages/error/NotFoundPage";

import TargetPerformanceAnalytics from "../pages/reports/TargetPerformanceAnalytics";
import { useAuth } from "../context/AuthContext";
import { useMemo } from "react";

function PerformanceWrapper() {
  return <TargetPerformanceAnalytics />;
}

export default function AppRoutes() {
  return (
    <Routes>

      <Route
        path="/"
        element={<Navigate to="/login" replace />}
      />

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/forgot-password"
        element={<ForgotPassword />}
      />

      <Route
        path="/reset-password"
        element={<ResetPassword />}
      />

      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />

        {/* ===== GLOBAL INVENTORY MANAGER ROUTES ===== */}
        <Route path="/inventory/dashboard" element={<InventoryManagerRoute><InventoryDashboard /></InventoryManagerRoute>} />
        <Route path="/inventory/products" element={<InventoryManagerRoute><Products /></InventoryManagerRoute>} />
        <Route path="/inventory/warehouses" element={<InventoryManagerRoute><Warehouses /></InventoryManagerRoute>} />
        <Route path="/inventory/stock" element={<StockAccessRoute><Stock /></StockAccessRoute>} />
        <Route path="/inventory/product-issues" element={<StockAccessRoute><ProductIssues /></StockAccessRoute>} />
        <Route path="/inventory/stock-movements" element={<StockAccessRoute><StockMovements /></StockAccessRoute>} />

        {/* ===== WAREHOUSE MANAGER WORKSPACE ROUTES ===== */}
        <Route path="/inventory/warehouse" element={<WarehouseManagerRoute><MyWarehouse /></WarehouseManagerRoute>} />
        <Route path="/inventory/my-warehouse" element={<WarehouseManagerRoute><MyWarehouse /></WarehouseManagerRoute>} />
        <Route path="/inventory/warehouse/dashboard" element={<WarehouseManagerRoute><WarehouseManagerDashboard /></WarehouseManagerRoute>} />
        <Route path="/inventory/warehouse/stock" element={<StockAccessRoute><Stock /></StockAccessRoute>} />
        <Route path="/inventory/warehouse/product-issues" element={<StockAccessRoute><ProductIssues /></StockAccessRoute>} />
        <Route path="/inventory/warehouse/returns" element={<StockAccessRoute><ProductIssues /></StockAccessRoute>} />
        <Route path="/inventory/warehouse/stock-movements" element={<StockAccessRoute><StockMovements /></StockAccessRoute>} />

        {/* ===== ORGANIZATION STRUCTURE ROUTES ===== */}
        <Route path="/organization/organization" element={<OrganizationRoute><OrganizationProfile /></OrganizationRoute>} />
        <Route path="/organization/branch" element={<OrganizationRoute><BranchList /></OrganizationRoute>} />
        <Route path="/organization/department" element={<OrganizationRoute><DepartmentList /></OrganizationRoute>} />
        <Route path="/organization/territory" element={<OrganizationRoute><TerritoryList /></OrganizationRoute>} />
        <Route path="/organization/teams" element={<OrganizationRoute><TeamList /></OrganizationRoute>} />
        <Route path="/organization/users" element={<OrganizationRoute><UserList /></OrganizationRoute>} />

        {/* ===== TEAM MANAGEMENT ROUTES ===== */}
        <Route path="/team/manage" element={<TeamManagementRoute><TeamManagement /></TeamManagementRoute>} />
        <Route path="/team/members/:id" element={<TeamManagementRoute><ExecutiveDetail /></TeamManagementRoute>} />
        <Route path="/team/assigned-tasks" element={<TeamManagementRoute><AssignedTasks /></TeamManagementRoute>} />
        <Route path="/team/tasks/:id" element={<TeamManagementRoute><TaskDetail /></TeamManagementRoute>} />
        <Route path="/team/performance" element={<ReportsRoute><PerformanceWrapper /></ReportsRoute>} />

        {/* ===== SALES ORDERS ===== */}
        <Route path="/orders" element={<SalesOrdersRoute><OrdersPage /></SalesOrdersRoute>} />

        {/* ===== PERFORMANCE & REPORTS & SETTINGS ===== */}
        <Route path="/performance" element={<ReportsRoute><PerformanceWrapper /></ReportsRoute>} />
        <Route path="/reports/target-performance" element={<ReportsRoute><PerformanceWrapper /></ReportsRoute>} />
        <Route path="/reports" element={<ReportsRoute><ReportsPage /></ReportsRoute>} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/settings" element={<SettingsPage />} />

        <Route path="/field-force" element={<FieldForceRoute><FieldForceDashboardWrapper /></FieldForceRoute>} />
        <Route path="/field-force/dashboard" element={<FieldForceRoute><FieldForceDashboardWrapper /></FieldForceRoute>} />
        <Route path="/field-force/tasks" element={<FieldForceRoute><TasksPage /></FieldForceRoute>} />
        <Route path="/field-force/tasks/:id/execute" element={<TaskExecutionRoute><TaskExecutionPage /></TaskExecutionRoute>} />
        <Route path="/field-force/visits" element={<FieldForceRoute><VisitsPage /></FieldForceRoute>} />
        <Route path="/field-force/visits/:id" element={<FieldForceRoute><VisitDetailPage /></FieldForceRoute>} />
        <Route path="/field-force/activities" element={<FieldForceRoute><ActivitiesPage /></FieldForceRoute>} />
        <Route path="/field-force/dar" element={<FieldForceRoute><DARPage /></FieldForceRoute>} />
        <Route path="/field-force/profile" element={<FieldForceRoute><ProfilePage /></FieldForceRoute>} />
        <Route path="/field-force/beat-plans" element={<FieldForceRoute><BeatPlanningPage /></FieldForceRoute>} />
        <Route path="/field-force/route" element={<FieldForceRoute><RouteOptimizationPage /></FieldForceRoute>} />
        <Route path="/field-force/photo-upload" element={<FieldForceRoute><PhotoUploadPage /></FieldForceRoute>} />
        <Route path="/field-force/meeting-notes" element={<FieldForceRoute><MeetingNotesPage /></FieldForceRoute>} />
        <Route path="/field-force/expenses" element={<FieldForceRoute><ExpensesPage /></FieldForceRoute>} />
        <Route path="/field-force/calendar" element={<FieldForceRoute><CalendarPage /></FieldForceRoute>} />

      </Route>

      {/* Standalone 404 Page Not Found Route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
