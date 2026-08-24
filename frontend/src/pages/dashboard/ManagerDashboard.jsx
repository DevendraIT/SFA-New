import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Target,
  MapPin,
  ShoppingCart,
  ClipboardCheck,
  Clock3,
  TrendingUp,
  UserCheck,
  IndianRupee,
  Activity,
  AlertTriangle,
  Plus,
  FileText,
  Calendar,
  Settings,
  Building2,
  Building,
  GitBranch,
  LayoutGrid,
} from "lucide-react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import dayjs from "dayjs";

import useManagerDashboard from "../../hooks/useManagerDashboard";
import { useAuth } from "../../context/AuthContext";

import DashboardHeader from "../../components/dashboard/DashboardHeader";
import StatsGrid from "../../components/dashboard/StatsGrid";
import StatCard from "../../components/dashboard/StatCard";
import SectionCard from "../../components/dashboard/SectionCard";
import ChartCard from "../../components/dashboard/ChartCard";
import PerformanceCard from "../../components/dashboard/PerformanceCard";
import AttendanceCard from "../../components/dashboard/AttendanceCard";
import ActivityTimeline from "../../components/dashboard/ActivityTimeline";
import QuickActions from "../../components/dashboard/QuickActions";
import RecentOrders from "../../components/dashboard/RecentOrders";
import RecentTasks from "../../components/dashboard/RecentTasks";
import EmptyDashboard from "../../components/dashboard/EmptyDashboard";
import ErrorState from "../../components/dashboard/ErrorState";
import { DashboardGridSkeleton } from "../../components/dashboard/LoadingSkeleton";

const quickActions = [
  {
    label: "Assigned Tasks",
    icon: Plus,
    iconColor: "text-blue-600",
    path: "/team/assigned-tasks",
  },
  {
    label: "View Team",
    icon: Users,
    iconColor: "text-emerald-600",
    path: "/organization/teams",
  },
  {
    label: "Sales Orders",
    icon: ShoppingCart,
    iconColor: "text-orange-500",
    path: "/orders",
  },
  {
    label: "Settings",
    icon: Settings,
    iconColor: "text-violet-600",
    path: "/settings",
  },
];

export default function ManagerDashboard() {
  const { user } = useAuth();
  const { dashboard, loading, error, refresh } = useManagerDashboard();

  const fullName = useMemo(() => {
    if (!user) return "";
    return `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
  }, [user]);

  if (loading) {
    return <DashboardGridSkeleton />;
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load dashboard"
        message="Unable to fetch manager dashboard data. Please try again."
        onRetry={refresh}
      />
    );
  }

  const hasData = dashboard && Object.keys(dashboard).length > 0;

  if (!hasData) {
    return (
      <EmptyDashboard
        title="No Dashboard Data"
        description="Manager dashboard data will appear once team activities are recorded."
        onAction={refresh}
      />
    );
  }

  const totalSalesExecutives = dashboard?.totalSalesExecutives ?? 0;
  const totalTeams = dashboard?.totalTeams ?? 0;
  const totalCustomers = dashboard?.totalCustomers ?? 0;
  const totalSalesOrders = dashboard?.totalSalesOrders ?? 0;

  const todayTasks = dashboard?.todayTasks ?? dashboard?.teamTasks?.todaysTasks ?? 0;
  const pendingTasks = dashboard?.pendingTasks ?? dashboard?.teamTasks?.pending ?? 0;
  const completedTasks = dashboard?.completedTasks ?? dashboard?.teamTasks?.completed ?? 0;
  const inProgressTasks = dashboard?.inProgressTasks ?? dashboard?.teamTasks?.inProgress ?? 0;
  const totalTasks = dashboard?.totalTasks ?? dashboard?.teamTasks?.assigned ?? 0;
  const revenue = dashboard?.revenue ?? 0;
  const todaysRevenue = dashboard?.todaysRevenue ?? revenue;

  const approvedOrders = dashboard?.approvedOrders ?? 0;
  const pendingOrders = dashboard?.pendingOrders ?? 0;
  const attendance = dashboard?.attendance || { present: 0, absent: 0, leave: 0, rate: 0 };

  const teamTargets = dashboard?.teamTargets || [];
  const orderFulfillmentRate = totalSalesOrders > 0 ? Math.round((approvedOrders / totalSalesOrders) * 100) : 100;
  const taskCompletionRate = totalTasks > 0
    ? Math.round((completedTasks / totalTasks) * 100)
    : 100;

  const performanceMetrics = teamTargets.length > 0
    ? teamTargets.slice(0, 3).map((t) => ({
        label: t.metric || "Target",
        value: t.targetValue > 0 ? Math.round((t.achievedValue / t.targetValue) * 100) : 0,
      }))
    : [
        { label: "Order Fulfillment Rate", value: orderFulfillmentRate },
        { label: "Team Task Completion", value: taskCompletionRate },
        { label: "Task Execution Rate", value: taskCompletionRate },
      ];

  const chartData = [
    { name: "Sales Orders", visits: totalSalesOrders },
    { name: "Completed Tasks", visits: completedTasks },
    { name: "In Progress", visits: inProgressTasks },
    { name: "Pending Tasks", visits: pendingTasks },
  ];

  const recentTasksList = (dashboard?.recentTasks && dashboard.recentTasks.length > 0)
    ? dashboard.recentTasks.map((t) => ({
        id: t.id,
        title: t.title || "Task",
        description: t.description || "Assigned task",
        status: t.status || "PENDING",
      }))
    : teamTargets.slice(0, 5).map((t) => ({
        id: t.id,
        title: t.metric || "Target",
        description: `${t.achievedValue || 0} / ${t.targetValue || 0} achieved`,
        status: t.achievedValue >= t.targetValue ? "COMPLETED" : "IN_PROGRESS",
      }));

  const recentActivitiesList = dashboard?.recentActivities || [
    { title: "Team Dashboard Viewed", description: "Manager accessed team overview", time: dayjs().format("h:mm A"), completed: true },
    { title: "Tasks Updated", description: `${completedTasks} tasks completed`, time: "Today" },
    { title: "Orders Processed", description: `${approvedOrders} orders approved`, time: dayjs().subtract(2, "hours").format("h:mm A") },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      {/* Header */}
      <DashboardHeader
        welcomeText={`Welcome back, ${fullName || "Manager"} 👋`}
        title="Sales Manager Dashboard"
        subtitle="Team performance and operations overview"
        onRefresh={refresh}
      />

      {/* Assigned Scope / Organization Information Card */}
      {dashboard?.organizationInfo && (
        <SectionCard
          title="Organization Scope"
          subtitle="Your assigned Organization hierarchy details (Read-Only)"
          icon={Building2}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-indigo-100 p-2.5 text-indigo-600">
                  <Building size={20} />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Organization</p>
                  <h4 className="font-semibold text-slate-800 text-base">
                    {dashboard.organizationInfo.organization?.name || "Not Assigned"}
                  </h4>
                  {dashboard.organizationInfo.organization?.code && (
                    <span className="text-xs text-slate-500">Code: {dashboard.organizationInfo.organization.code}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 p-2.5 text-blue-600">
                  <GitBranch size={20} />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Branch</p>
                  <h4 className="font-semibold text-slate-800 text-base">
                    {dashboard.organizationInfo.branch?.name || "Not Assigned"}
                  </h4>
                  {dashboard.organizationInfo.branch?.code && (
                    <span className="text-xs text-slate-500">Code: {dashboard.organizationInfo.branch.code}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-purple-100 p-2.5 text-purple-600">
                  <LayoutGrid size={20} />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Department</p>
                  <h4 className="font-semibold text-slate-800 text-base">
                    {dashboard.organizationInfo.department?.name || "Not Assigned"}
                  </h4>
                  {dashboard.organizationInfo.department?.code && (
                    <span className="text-xs text-slate-500">Code: {dashboard.organizationInfo.department.code}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </SectionCard>
      )}

      {/* Stats Grid */}

      <StatsGrid>
        <StatCard
          title="Sales Executives"
          value={totalSalesExecutives}
          icon={Users}
          color="bg-indigo-600"
        />
        <StatCard
          title="Total Teams"
          value={totalTeams}
          icon={UserCheck}
          color="bg-purple-600"
        />
        <StatCard
          title="Total Customers"
          value={totalCustomers}
          icon={Users}
          color="bg-sky-600"
        />
        <StatCard
          title="Sales Orders"
          value={totalSalesOrders}
          icon={ShoppingCart}
          color="bg-cyan-500"
        />
        <StatCard
          title="Today's Tasks"
          value={todayTasks}
          icon={MapPin}
          color="bg-blue-500"
        />
        <StatCard
          title="Pending Tasks"
          value={pendingTasks}
          icon={Clock3}
          color="bg-amber-500"
        />
        <StatCard
          title="Completed Tasks"
          value={completedTasks}
          icon={ClipboardCheck}
          color="bg-emerald-500"
        />
        <StatCard
          title="Total Revenue"
          value={revenue}
          icon={IndianRupee}
          color="bg-green-600"
          format="currency"
        />
      </StatsGrid>

      {/* Charts & Performance */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Team Visit Chart */}
        <ChartCard
          title="Team Task Status"
          subtitle="Today's task distribution"
          className="xl:col-span-2"
          delay={0.2}
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="visits" fill="#2563EB" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Team Performance */}
        <PerformanceCard
          title="Team Performance"
          subtitle="Key metrics overview"
          icon={TrendingUp}
          metrics={performanceMetrics}
        />
      </div>



      {/* Tasks & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard
          title="Team Tasks"
          subtitle="Assigned targets and objectives"
          icon={Target}
          action={
            <span className="text-xs text-slate-500">{recentTasksList.length} tasks</span>
          }
        >
          <RecentTasks tasks={recentTasksList} emptyMessage="No tasks assigned to the team yet." />
        </SectionCard>

        <SectionCard title="Quick Actions" subtitle="Common management tasks">
          <QuickActions actions={quickActions} />
        </SectionCard>
      </div>

      {/* Recent Activity */}
      <SectionCard
        title="Recent Activity"
        subtitle="Latest team activities"
        icon={Activity}
      >
        <ActivityTimeline activities={recentActivitiesList} />
      </SectionCard>
    </motion.div>

  );
}

