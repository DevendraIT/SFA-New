import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  MapPin,
  ClipboardCheck,
  Clock3,
  ShoppingCart,
  IndianRupee,
  TrendingUp,
  Target,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  UserCheck,
  Activity,
  Building2,
} from "lucide-react";
import dayjs from "dayjs";

import useDashboard from "../../hooks/useDashboard";
import { useAuth } from "../../context/AuthContext";


import DashboardHeader from "../../components/dashboard/DashboardHeader";
import StatsGrid from "../../components/dashboard/StatsGrid";
import StatCard from "../../components/dashboard/StatCard";
import SectionCard from "../../components/dashboard/SectionCard";
import PerformanceCard from "../../components/dashboard/PerformanceCard";
import ActivityTimeline from "../../components/dashboard/ActivityTimeline";
import QuickActions from "../../components/dashboard/QuickActions";
import RecentTasks from "../../components/dashboard/RecentTasks";
import RecentOrders from "../../components/dashboard/RecentOrders";
import EmptyDashboard from "../../components/dashboard/EmptyDashboard";
import ErrorState from "../../components/dashboard/ErrorState";
import { DashboardGridSkeleton } from "../../components/dashboard/LoadingSkeleton";

const quickActions = [
  {
    label: "Check-In",
    icon: MapPin,
    iconColor: "text-blue-600",
  },
  {
    label: "New Visit",
    icon: ClipboardCheck,
    iconColor: "text-emerald-600",
  },
  {
    label: "New Order",
    icon: ShoppingCart,
    iconColor: "text-cyan-600",
  },
  {
    label: "Submit DAR",
    icon: FileText,
    iconColor: "text-violet-600",
  },
];

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
  const myVisits = dashboard?.myVisits || {};
  const myTargets = dashboard?.myTargets || [];
  const myOrders = dashboard?.myOrders || {};

  const todayVisits = dashboard?.todayVisits ?? 0;
  const completedVisits = dashboard?.completedVisits ?? (myVisits?.COMPLETED || 0);
  const pendingVisits = dashboard?.pendingVisits ?? (myVisits?.PENDING || 0);
  const totalAssignedCustomers = dashboard?.totalAssignedCustomers ?? 0;
  const totalSalesOrders = dashboard?.totalSalesOrders ?? 0;

  const approvedOrders = dashboard?.approvedOrders ?? (myOrders?.APPROVED?.count || 0);
  const pendingOrders = dashboard?.pendingOrders ?? (myOrders?.PENDING?.count || 0);
  const attendanceStatus = dashboard?.attendanceStatus || "Not Checked In";
  const checkInTime = dashboard?.checkInTime ? dayjs(dashboard.checkInTime).format("h:mm A") : null;
  const checkOutTime = dashboard?.checkOutTime ? dayjs(dashboard.checkOutTime).format("h:mm A") : null;

  const recentOrdersList = Array.isArray(dashboard?.recentOrders)
    ? dashboard.recentOrders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        totalAmount: o.totalAmount,
        customerName: o.customer?.name || "Customer",
      }))
    : [];

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

  // Build target performance metrics
  const performanceMetrics = myTargets.slice(0, 3).map((t) => ({
    label: t.metric || "Target",
    value: t.targetValue > 0 ? Math.round((t.achievedValue / t.targetValue) * 100) : 0,
    suffix: "%",
  }));

  if (performanceMetrics.length < 3) {
    const defaults = [
      { label: "Visit Target", value: todayVisits > 0 ? Math.round((completedVisits / todayVisits) * 100) : 0 },
      { label: "Sales Target", value: totalSalesOrders > 0 ? 100 : 0 },
      { label: "Customer Target", value: totalAssignedCustomers > 0 ? 100 : 0 },
    ];
    for (let i = performanceMetrics.length; i < 3; i++) {
      performanceMetrics.push(defaults[i]);
    }
  }

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
        title="Sales Dashboard"
        subtitle="Your daily sales activities at a glance"
        onRefresh={refresh}
      />

      {/* Organization Information Card */}
      <SectionCard
        title="Organization Information"
        subtitle="Your assigned company, branch, department, and reporting manager details"
        icon={Building2}
        iconColor="text-indigo-600"
      >

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Company</span>
            <span className="text-sm font-bold text-slate-800">{organizationInfo.companyName || user?.company?.name || user?.branch?.company?.name || "Assigned Company"}</span>
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
          title="Today's Visits"
          value={todayVisits}
          icon={MapPin}
          color="bg-blue-500"
        />
        <StatCard
          title="Completed Visits"
          value={completedVisits}
          icon={CheckCircle2}
          color="bg-emerald-500"
        />
        <StatCard
          title="My Orders"
          value={totalSalesOrders}
          icon={ShoppingCart}
          color="bg-cyan-500"
        />
        <StatCard
          title="Assigned Customers"
          value={totalAssignedCustomers}
          icon={UserCheck}
          color="bg-amber-500"
        />
      </StatsGrid>

      {/* Targets & Performance */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Today's Schedule/Status */}
          <SectionCard
            title="Today's Status"
            icon={Calendar}
            iconColor="text-blue-600"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50">
                <div className="flex items-center gap-3">
                  <UserCheck size={20} className="text-emerald-600" />
                  <span className="font-medium text-sm text-slate-700">Attendance</span>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                  {attendanceStatus}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50">
                <div className="flex items-center gap-3">
                  <MapPin size={20} className="text-blue-600" />
                  <span className="font-medium text-sm text-slate-700">Check-In Time</span>
                </div>
                <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                  {checkInTime || "Not Checked In"}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-violet-50">
                <div className="flex items-center gap-3">
                  <FileText size={20} className="text-violet-600" />
                  <span className="font-medium text-sm text-slate-700">Check-Out Time</span>
                </div>
                <span className="px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-semibold">
                  {checkOutTime || "Not Checked Out"}
                </span>
              </div>
            </div>
          </SectionCard>

          {/* Quick Summary */}
          <SectionCard
            title="Quick Summary"
            icon={TrendingUp}
            iconColor="text-emerald-600"
          >
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Assigned Customers</span>
                <span className="font-bold text-slate-900">{totalAssignedCustomers}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Today's Visits</span>
                <span className="font-bold text-slate-900">{todayVisits}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Pending Visits</span>
                <span className="font-bold text-amber-600">{pendingVisits}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Completed Visits</span>
                <span className="font-bold text-emerald-600">{completedVisits}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Total Sales Orders</span>
                <span className="font-bold text-slate-900">{totalSalesOrders}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Approved Orders</span>
                <span className="font-bold text-emerald-600">{approvedOrders}</span>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* Performance Card */}
        <PerformanceCard
          title="My Performance"
          subtitle="Target achievement status"
          icon={Target}
          metrics={performanceMetrics}
        />
      </div>

      {/* Orders & Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard
          title="My Orders"
          subtitle="Recent order activity"
          icon={ShoppingCart}
        >
          <RecentOrders
            orders={recentOrdersList}
            emptyMessage="No orders yet. Create your first order!"
          />
        </SectionCard>

        <SectionCard
          title="My Targets"
          subtitle="Assigned targets for this period"
          icon={Target}
          action={
            <span className="text-xs text-slate-500">{myTargets.length} targets</span>
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
                : []
            }
            emptyMessage="No targets assigned yet."
          />
        </SectionCard>
      </div>

      {/* Quick Actions & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Quick Actions" subtitle="Common daily tasks">
          <QuickActions actions={quickActions} />
        </SectionCard>

        <SectionCard
          title="Recent Activity"
          subtitle="Your latest activities"
          icon={Activity}
        >
          <ActivityTimeline
            activities={recentActivitiesList}
          />
        </SectionCard>
      </div>
    </motion.div>
  );
}


