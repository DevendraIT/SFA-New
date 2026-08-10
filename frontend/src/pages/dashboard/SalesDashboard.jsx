import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  MapPin,
  ClipboardCheck,
  CheckCircle2,
  Activity,
  Building2,
  CalendarClock,
  PlayCircle,
} from "lucide-react";
import dayjs from "dayjs";

import useDashboard from "../../hooks/useDashboard";
import { useAuth } from "../../context/AuthContext";

import DashboardHeader from "../../components/dashboard/DashboardHeader";
import StatsGrid from "../../components/dashboard/StatsGrid";
import StatCard from "../../components/dashboard/StatCard";
import SectionCard from "../../components/dashboard/SectionCard";
import ActivityTimeline from "../../components/dashboard/ActivityTimeline";
import RecentTasks from "../../components/dashboard/RecentTasks";
import EmptyDashboard from "../../components/dashboard/EmptyDashboard";
import { DashboardGridSkeleton } from "../../components/dashboard/LoadingSkeleton";

export default function SalesDashboard() {
const { user } = useAuth();
  const { dashboard, loading, refresh } = useDashboard();

  const fullName = useMemo(() => {
    if (!user) return "";
    return `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
  }, [user]);

  if (loading) {
    return <DashboardGridSkeleton />;
  }

  const hasData = dashboard && Object.keys(dashboard).length > 0;

  if (!hasData) {
    return (
      <EmptyDashboard
        title="No Dashboard Data"
        description="Your personal dashboard data will appear here once activities are recorded."
        onAction={refresh}
      />
    );
  }

  // Extract user-specific data from dashboard hook
  const myTasks = dashboard?.myTasks || {};
  const myTargets = dashboard?.myTargets || [];

  const todayTasks = dashboard?.todayTasks ?? (myTasks?.todaysTasks || 0);
  const completedTasks = dashboard?.completedTasks ?? (myTasks?.completed || 0);
  const pendingTasks = dashboard?.pendingTasks ?? (myTasks?.pending || 0);
  const currentTasks = dashboard?.inProgressTasks ?? (myTasks?.inProgress || 0);

  const recentActivitiesList = Array.isArray(dashboard?.recentActivities)
    ? dashboard.recentActivities
    : [
        {
          title: "Dashboard Viewed",
          description: "You accessed your sales dashboard",
          time: dayjs().format("h:mm A"),
          completed: true,
        },
      ];

  const organizationInfo = dashboard?.organizationInfo || {};

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      {/* Header */}
      <DashboardHeader
        welcomeText={`Good ${dayjs().hour() < 12 ? "morning" : dayjs().hour() < 17 ? "afternoon" : "evening"}, ${fullName || "Sales Executive"} 👋`}
        title="Sales Executive Dashboard"
        subtitle="Your daily sales activities at a glance"
        onRefresh={refresh}
      />

      {/* Organization Information Card */}
      <SectionCard
        title="Organization Information"
        subtitle="Your assigned organization, branch, department, and reporting manager details"
        icon={Building2}
        iconColor="text-indigo-600"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Organization</span>
            <span className="text-sm font-bold text-slate-800">{organizationInfo.organizationName || organizationInfo.companyName || user?.organization?.name || user?.branch?.organization?.name || "Assigned Organization"}</span>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Branch</span>
            <span className="text-sm font-bold text-slate-800">{organizationInfo.branchName || user?.branch?.name || "Assigned Branch"}</span>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Department</span>
            <span className="text-sm font-bold text-slate-800">{organizationInfo.departmentName || user?.department?.name || "Assigned Department"}</span>
          </div>

          <div className="p-3 rounded-xl border border-indigo-100 bg-indigo-50/50">
            <span className="text-xs font-semibold text-indigo-500 uppercase tracking-wider block mb-1">Reporting Manager</span>
            <span className="text-sm font-bold text-indigo-900">
              {organizationInfo.managerName || (user?.manager ? `${user.manager.firstName || ''} ${user.manager.lastName || ''}`.trim() : "Not Assigned")}
            </span>
          </div>
        </div>
      </SectionCard>

      {/* Stats Grid - Today's overview */}
      <StatsGrid>
        <StatCard
          title="Assigned Customers"
          value={dashboard?.totalAssignedCustomers ?? 0}
          icon={Building2}
          color="bg-purple-600"
        />
        <StatCard
          title="Sales Orders"
          value={dashboard?.totalSalesOrders ?? 0}
          icon={ClipboardCheck}
          color="bg-indigo-600"
        />
        <StatCard
          title="Today's Tasks"
          value={todayTasks}
          icon={MapPin}
          color="bg-blue-500"
        />
        <StatCard
          title="Completed Tasks"
          value={completedTasks}
          icon={CheckCircle2}
          color="bg-emerald-500"
        />
        <StatCard
          title="Pending Tasks"
          value={pendingTasks}
          icon={CalendarClock}
          color="bg-amber-500"
        />
        <StatCard
          title="Current Tasks"
          value={currentTasks}
          icon={PlayCircle}
          color="bg-cyan-500"
        />
      </StatsGrid>

      {/* My Targets & Tasks */}
      <SectionCard
        title="My Targets & Tasks"
        subtitle="Assigned targets and operational objectives for this period"
        icon={ClipboardCheck}
        action={
          <span className="text-xs text-slate-500">
            {myTargets.length > 0 ? `${myTargets.length} targets` : `${dashboard?.recentTasks?.length || 0} tasks`}
          </span>
        }
      >
        <RecentTasks
          tasks={
            myTargets.length > 0
              ? myTargets.map((t) => ({
                  id: t.id || Math.random().toString(),
                  title: t.metric || "Target",
                  description: `${t.achievedValue || 0} / ${t.targetValue || 0} achieved`,
                  status: t.achievedValue >= t.targetValue ? "COMPLETED" : "IN_PROGRESS",
                  dueDate: t.dueDate,
                }))
              : Array.isArray(dashboard?.recentTasks) && dashboard.recentTasks.length > 0
              ? dashboard.recentTasks.map((t) => ({
                  id: t.id,
                  title: t.title || "Assigned Task",
                  description: t.description || "Field task assignment",
                  status: t.status || "PENDING",
                }))
              : []
          }
          emptyMessage="No targets or tasks assigned yet."
        />
      </SectionCard>

      {/* Recent Activity */}
      <SectionCard
        title="Recent Activity"
        subtitle="Your latest activities"
        icon={Activity}
      >
        <ActivityTimeline
          activities={recentActivitiesList}
        />
      </SectionCard>
    </motion.div>
  );
}
