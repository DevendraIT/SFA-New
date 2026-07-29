import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Users,
  UserCheck,
  Building2,
  Building,
  GitBranch,
  LayoutGrid,
  ShoppingCart,
  MapPin,
  Clock3,
  ClipboardCheck,
  IndianRupee,
  TrendingUp,
  Activity,
  AlertTriangle,
  Plus,
  FileText,
  Calendar,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import dayjs from "dayjs";

import useHeadOfSalesDashboard from "../../hooks/useHeadOfSalesDashboard";
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
import EmptyDashboard from "../../components/dashboard/EmptyDashboard";
import ErrorState from "../../components/dashboard/ErrorState";
import { DashboardGridSkeleton } from "../../components/dashboard/LoadingSkeleton";

const COLORS = ["#10B981", "#3B82F6", "#F59E0B", "#EF4444"];

const quickActions = [
  {
    label: "Add Sales Manager",
    icon: Plus,
    iconColor: "text-blue-600",
    path: "/organization/users",
  },
  {
    label: "Manage Teams",
    icon: Users,
    iconColor: "text-emerald-600",
    path: "/organization/teams",
  },
  {
    label: "Sales Reports",
    icon: FileText,
    iconColor: "text-orange-500",
    path: "/reports",
  },
  {
    label: "Schedule",
    icon: Calendar,
    iconColor: "text-violet-600",
  },
];

export default function HeadOfSalesDashboard() {
  const { user } = useAuth();
  const { dashboard, loading, error, refresh } = useHeadOfSalesDashboard();

  const fullName = useMemo(() => {
    if (!user) return "";
    return `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
  }, [user]);

  if (loading) return <DashboardGridSkeleton />;
  if (error) return <ErrorState title="Failed to load dashboard" message="Unable to fetch Head of Sales dashboard data." onRetry={refresh} />;

  const hasData = dashboard && Object.keys(dashboard).length > 0;
  if (!hasData) return <EmptyDashboard title="No Dashboard Data" description="Head of Sales dashboard data will appear once activities are recorded." onAction={refresh} />;

  const totalSalesManagers = dashboard?.totalSalesManagers ?? 0;
  const totalSalesExecutives = dashboard?.totalSalesExecutives ?? 0;
  const totalTeams = dashboard?.totalTeams ?? 0;
  const totalCustomers = dashboard?.totalCustomers ?? 0;
  const totalSalesOrders = dashboard?.totalSalesOrders ?? 0;
  const todayVisits = dashboard?.todayVisits ?? 0;
  const pendingVisits = dashboard?.pendingVisits ?? 0;
  const completedVisits = dashboard?.completedVisits ?? 0;
  const revenue = dashboard?.revenue ?? 0;
  const approvedOrders = dashboard?.approvedOrders ?? 0;
  const pendingOrders = dashboard?.pendingOrders ?? 0;

  const attendance = dashboard?.attendance || { present: 0, absent: 0, leave: 0, rate: 0 };
  const organizationInfo = dashboard?.organizationInfo || {};

  const companyName = organizationInfo.company?.name || organizationInfo.companyName || "Not Assigned";
  const branchName = organizationInfo.branch?.name || organizationInfo.branchName || "Not Assigned";
  const departmentName = organizationInfo.department?.name || organizationInfo.departmentName || "Not Assigned";

  const totalVisitsCount = todayVisits + pendingVisits + completedVisits;
  const performanceMetrics = [
    { label: "Visit Completion Rate", value: totalVisitsCount > 0 ? Math.round((completedVisits / totalVisitsCount) * 100) : 0, suffix: "%" },
    { label: "Manager Target Achievement", value: totalSalesOrders > 0 ? 100 : 85, suffix: "%" },
    { label: "Executive Attendance Rate", value: attendance.rate || 0, suffix: "%" },
  ];

  const orderData = [
    { name: "Approved Orders", value: approvedOrders || 1, color: "#10B981" },
    { name: "Pending Review", value: pendingOrders || 0, color: "#F59E0B" },
  ];

  const chartData = [
    { name: "Completed", visits: completedVisits },
    { name: "In Progress", visits: todayVisits },
    { name: "Pending", visits: pendingVisits },
  ];

  const recentActivitiesList = dashboard?.recentActivities || [
    { title: "Head of Sales Overview", description: `Scope: ${companyName} - ${branchName}`, time: dayjs().format("h:mm A"), completed: true },
    { title: "Visits Updated", description: `${completedVisits} visits completed in assigned branch`, time: "Today" },
    { title: "Orders Processed", description: `${approvedOrders} orders approved`, time: dayjs().subtract(2, "hours").format("h:mm A") },
  ];

  const salesManagers = dashboard?.salesManagers || [];
  const salesExecutives = dashboard?.salesExecutives || [];
  const teams = dashboard?.teams || [];
  const customers = dashboard?.customers || [];
  const recentVisits = dashboard?.recentVisits || [];
  const recentOrders = dashboard?.recentOrders || [];

  const companyAdminName = organizationInfo.companyAdminName || "Company Admin";
  const headOfSalesName = organizationInfo.headOfSalesName || fullName || "Head of Sales";

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-8">
      {/* Header */}
      <DashboardHeader
        welcomeText={`Welcome back, ${headOfSalesName} 👋`}
        title="Head of Sales Executive Control Center"
        subtitle="Assigned Company, Branch & Department Sales Performance Control"
        onRefresh={refresh}
      />

      {/* KPI Stats Grid */}

      <StatsGrid>
        <StatCard title="Total Sales Managers" value={totalSalesManagers} icon={UserCheck} color="bg-indigo-600" />
        <StatCard title="Managers Present Today" value={presentSalesManagers} icon={UserCheck} color="bg-emerald-600" />
        <StatCard title="Sales Executives" value={totalSalesExecutives} icon={Users} color="bg-blue-600" />
        <StatCard title="Total Teams" value={totalTeams} icon={Users} color="bg-purple-600" />
        <StatCard title="Total Customers" value={totalCustomers} icon={UserCheck} color="bg-sky-600" />
        <StatCard title="Total Sales Orders" value={totalSalesOrders} icon={ShoppingCart} color="bg-cyan-500" />
        <StatCard title="Today's Visits" value={todayVisits} icon={MapPin} color="bg-blue-500" />
        <StatCard title="Pending Visits" value={pendingVisits} icon={Clock3} color="bg-amber-500" />
        <StatCard title="Completed Visits" value={completedVisits} icon={ClipboardCheck} color="bg-emerald-500" />
        <StatCard title="Department Revenue" value={revenue} icon={IndianRupee} color="bg-green-600" format="currency" />
      </StatsGrid>

      {/* Sales Managers & Sales Executives Summary Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Sales Managers Summary" subtitle="Assigned sales managers & team counts" icon={UserCheck} iconColor="text-indigo-600">
          {salesManagers.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">No sales managers assigned yet.</p>
          ) : (
            <div className="space-y-3">
              {salesManagers.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/70">
                  <div>
                    <h5 className="font-semibold text-slate-900 text-sm">{m.name}</h5>
                    <p className="text-xs text-slate-500">{m.email}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-indigo-600 block">{m.executiveCount} Executives</span>
                    <span className="text-xs text-slate-500">{m.teamCount} Teams</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Sales Executives Summary" subtitle="Assigned sales executives & manager hierarchy" icon={Users} iconColor="text-blue-600">
          {salesExecutives.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">No sales executives assigned yet.</p>
          ) : (
            <div className="space-y-3">
              {salesExecutives.map((e) => (
                <div key={e.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/70">
                  <div>
                    <h5 className="font-semibold text-slate-900 text-sm">{e.name}</h5>
                    <p className="text-xs text-slate-500">{e.email}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
                    Manager: {e.managerName}
                  </span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* Teams & Customers Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Teams Overview" subtitle="Sales teams, team leaders & member counts" icon={Users} iconColor="text-purple-600">
          {teams.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">No teams created yet.</p>
          ) : (
            <div className="space-y-3">
              {teams.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/70">
                  <div>
                    <h5 className="font-semibold text-slate-900 text-sm">{t.name}</h5>
                    <p className="text-xs text-slate-500">Leader: {t.leadName}</p>
                  </div>
                  <span className="px-3 py-1 rounded-lg bg-purple-50 text-purple-700 text-xs font-semibold">
                    {t.memberCount} Members
                  </span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Recent Customers Overview" subtitle="Assigned customers & owner hierarchy" icon={UserCheck} iconColor="text-sky-600">
          {customers.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">No customers found.</p>
          ) : (
            <div className="space-y-3">
              {customers.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/70">
                  <div>
                    <h5 className="font-semibold text-slate-900 text-sm">{c.name}</h5>
                    <p className="text-xs text-slate-500">Executive: {c.executiveName} | Manager: {c.managerName}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${c.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-700"}`}>
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* Visual Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <ChartCard title="Branch Visit Performance" subtitle="Today's visit status distribution" className="xl:col-span-2">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="visits" fill="#2563EB" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <PerformanceCard title="Sales Team Performance" subtitle="Key metrics & target achievement" icon={TrendingUp} metrics={performanceMetrics} />
      </div>

      {/* Recent Visits & Recent Sales Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Recent Customer Visits" subtitle="Latest field visit logs & assignments" icon={MapPin} iconColor="text-blue-600">
          {recentVisits.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">No recent visits recorded.</p>
          ) : (
            <div className="space-y-3">
              {recentVisits.map((v) => (
                <div key={v.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/70">
                  <div>
                    <h5 className="font-semibold text-slate-900 text-sm">{v.title}</h5>
                    <p className="text-xs text-slate-500">Customer: {v.customerName} | Executive: {v.executiveName}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${v.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                    {v.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Recent Sales Orders" subtitle="Latest sales orders & values" icon={ShoppingCart} iconColor="text-emerald-600">
          {recentOrders.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">No recent orders recorded.</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((o) => (
                <div key={o.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/70">
                  <div>
                    <h5 className="font-semibold text-slate-900 text-sm">Order {o.orderNumber}</h5>
                    <p className="text-xs text-slate-500">Customer: {o.customer?.name || "Customer"}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900 text-sm block">₹{Number(o.totalAmount || 0).toLocaleString("en-IN")}</span>
                    <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${o.status === "APPROVED" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>
                      {o.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* Attendance & Approvals Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AttendanceCard present={attendance.present || 0} absent={attendance.absent || 0} leave={attendance.leave || 0} rate={attendance.rate || 0} title="Sales Force Attendance" subtitle="Today's attendance across teams" />

        <SectionCard title="System Approvals Queue" subtitle="Sales items requiring action" icon={AlertTriangle} iconColor="text-orange-500">
          <div className="space-y-3">
            {[
              { label: `${pendingOrders} Sales Orders Pending Review`, count: pendingOrders },
              { label: `${pendingVisits} Customer Visits Pending Review`, count: pendingVisits },
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/70">
                <span className="font-semibold text-slate-700 text-sm">{item.label}</span>
                <span className="px-3 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold">{item.count} items</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Quick Actions & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Quick Management Actions" subtitle="Sales management shortcuts">
          <QuickActions actions={quickActions} />
        </SectionCard>

        <SectionCard title="Recent Sales Activity" subtitle="Latest team operations" icon={Activity}>
          <ActivityTimeline activities={recentActivitiesList} />
        </SectionCard>
      </div>
    </motion.div>
  );
}

