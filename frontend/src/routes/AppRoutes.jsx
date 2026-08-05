import { Navigate, Route, Routes } from "react-router-dom";

import Login from "../pages/auth/Login";
import ForgotPassword from "../pages/auth/ForgotPassword";
import ResetPassword from "../pages/auth/ResetPassword";

import Dashboard from "../pages/dashboard/Dashboard";

import DashboardLayout from "../layouts/DashboardLayout";

import ProtectedRoute from "./ProtectedRoute";


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

import TargetPerformanceAnalytics from "../pages/reports/TargetPerformanceAnalytics";
import { useAuth } from "../context/AuthContext";
import { useMemo } from "react";

function PerformanceWrapper() {
  const { user } = useAuth();
  const isHeadOfSales = useMemo(() => {
    if (!user) return false;
    const roleNames = Array.isArray(user.roles)
      ? user.roles.map((r) => (typeof r === "string" ? r : r.role?.name || r.name))
      : [user.role?.name || ""];
    return roleNames.some((r) => r && r.toLowerCase().includes("head of sales"));
  }, [user]);

  if (isHeadOfSales) {
    return <TargetPerformanceAnalytics />;
  }
  return <ExecutivePerformance />;
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



        <Route
          path="/organization/organization"
          element={<OrganizationProfile />}
        />

        <Route
          path="/organization/branch"
          element={<BranchList />}
        />

        <Route
          path="/organization/department"
          element={<DepartmentList />}
        />

        <Route
          path="/organization/territory"
          element={<TerritoryList />}
        />

        <Route
          path="/organization/teams"
          element={<TeamList />}
        />

        <Route
          path="/organization/users"
          element={<UserList />}
        />

        <Route
          path="/team/manage"
          element={<TeamManagement />}
        />

        <Route
          path="/team/members/:id"
          element={<ExecutiveDetail />}
        />

        <Route
          path="/team/assigned-tasks"
          element={<AssignedTasks />}
        />

        <Route
          path="/team/tasks/:id"
          element={<TaskDetail />}
        />

        <Route
          path="/team/performance"
          element={<PerformanceWrapper />}
        />

        {/* ===== SALES ORDERS ===== */}
        <Route path="/orders" element={<OrdersPage />} />

        {/* ===== PERFORMANCE & REPORTS & SETTINGS ===== */}
        <Route path="/performance" element={<PerformanceWrapper />} />
        <Route path="/reports/target-performance" element={<PerformanceWrapper />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/settings" element={<SettingsPage />} />

        {/* ===== FIELD FORCE AUTOMATION ROUTES ===== */}
        <Route path="/field-force" element={<FieldForceDashboardWrapper />} />
        <Route path="/field-force/dashboard" element={<FieldForceDashboardWrapper />} />
        <Route path="/field-force/attendance" element={<AttendancePage />} />
        <Route path="/field-force/tasks" element={<TasksPage />} />
        <Route path="/field-force/tasks/:id/execute" element={<TaskExecutionPage />} />
        <Route path="/field-force/visits" element={<VisitsPage />} />
        <Route path="/field-force/visits/:id" element={<VisitDetailPage />} />
        <Route path="/field-force/activities" element={<ActivitiesPage />} />
        <Route path="/field-force/dar" element={<DARPage />} />
        <Route path="/field-force/profile" element={<ProfilePage />} />
        <Route path="/field-force/beat-plans" element={<BeatPlanningPage />} />
        <Route path="/field-force/route" element={<RouteOptimizationPage />} />
        <Route path="/field-force/photo-upload" element={<PhotoUploadPage />} />
        <Route path="/field-force/meeting-notes" element={<MeetingNotesPage />} />
        <Route path="/field-force/expenses" element={<ExpensesPage />} />
        <Route path="/field-force/calendar" element={<CalendarPage />} />
      </Route>

    </Routes>
  );
}
