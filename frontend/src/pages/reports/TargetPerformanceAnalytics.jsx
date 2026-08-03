import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Target,
  Award,
  Users,
  UserCheck,
  Building,
  GitBranch,
  ShoppingCart,
  IndianRupee,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Calendar,
  Layers,
  PieChart as PieChartIcon,
  Activity,
  Zap,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import dayjs from "dayjs";

import useHeadOfSalesDashboard from "../../hooks/useHeadOfSalesDashboard";
import { useAuth } from "../../context/AuthContext";
import PageHeader from "../../components/dashboard/PageHeader";
import SectionCard from "../../components/dashboard/SectionCard";

const COLORS = ["#10B981", "#3B82F6", "#F59E0B", "#8B5CF6", "#EC4899"];

export default function TargetPerformanceAnalytics() {
  const { user } = useAuth();
  const { dashboard, loading, error, refresh } = useHeadOfSalesDashboard();

  const [trendPeriod, setTrendPeriod] = useState("Monthly");

  const organizationInfo = dashboard?.organizationInfo || {};
  const organizationName = organizationInfo.organization?.name || organizationInfo.organizationName || "Assigned Organization";

  const targetAnalytics = dashboard?.targetAnalytics || {};
  const performanceAnalytics = dashboard?.performanceAnalytics || {};

  // 1. KPI Summary Data
  const totalOrganizationTarget = targetAnalytics.totalOrganizationTarget ?? 0;
  const achievedTarget = targetAnalytics.achievedTarget ?? 0;
  const remainingTarget = targetAnalytics.remainingTarget ?? 0;
  const targetAchievementPercent = targetAnalytics.targetAchievementPercent ?? 0;

  const totalRevenue = performanceAnalytics.totalRevenue ?? dashboard?.revenue ?? 0;
  const totalSalesOrders = performanceAnalytics.totalOrders ?? dashboard?.totalSalesOrders ?? 0;
  const totalCustomers = performanceAnalytics.totalCustomers ?? dashboard?.totalCustomers ?? 0;
  const totalSalesManagers = dashboard?.totalSalesManagers ?? 0;
  const totalSalesExecutives = dashboard?.totalSalesExecutives ?? 0;
  const overallPerformanceScore = Math.min(100, Math.round((targetAchievementPercent + (performanceAnalytics.conversionRate || 75)) / 2));

  // 2. Organization Target Breakdown
  const monthlyTarget = targetAnalytics.monthlyTarget ?? Math.round(totalOrganizationTarget / 12);
  const quarterlyTarget = targetAnalytics.quarterlyTarget ?? Math.round(totalOrganizationTarget / 4);
  const halfYearlyTarget = Math.round(totalOrganizationTarget / 2);
  const yearlyTarget = targetAnalytics.yearlyTarget ?? totalOrganizationTarget;

  // 3. Branch & Dept Performance Data
  const branchTargetPerformance = targetAnalytics.branchTargetPerformance || [];
  const departmentTargetPerformance = targetAnalytics.departmentTargetPerformance || [];
  const salesManagerTargetPerformance = targetAnalytics.salesManagerTargetPerformance || [];
  const topSalesExecutives = targetAnalytics.topSalesExecutives || [];

  const branchPerformance = performanceAnalytics.branchPerformance || [];
  const departmentPerformance = performanceAnalytics.departmentPerformance || [];
  const managerPerformance = performanceAnalytics.managerPerformance || [];
  const executivePerformance = performanceAnalytics.executivePerformance || [];

  // Insights Calculations
  const topBranch = useMemo(() => {
    if (branchPerformance.length === 0) return { name: "N/A", revenue: 0 };
    return [...branchPerformance].sort((a, b) => b.revenue - a.revenue)[0];
  }, [branchPerformance]);

  const lowestBranch = useMemo(() => {
    if (branchPerformance.length === 0) return { name: "N/A", revenue: 0 };
    return [...branchPerformance].sort((a, b) => a.revenue - b.revenue)[0];
  }, [branchPerformance]);

  const topDepartment = useMemo(() => {
    if (departmentPerformance.length === 0) return { name: "N/A", revenue: 0 };
    return [...departmentPerformance].sort((a, b) => b.revenue - a.revenue)[0];
  }, [departmentPerformance]);

  const topManager = useMemo(() => {
    if (managerPerformance.length === 0) return { name: "N/A", revenue: 0 };
    return [...managerPerformance].sort((a, b) => b.revenue - a.revenue)[0];
  }, [managerPerformance]);

  const topExecutive = useMemo(() => {
    if (executivePerformance.length === 0) return { name: "N/A", revenue: 0 };
    return [...executivePerformance].sort((a, b) => b.revenue - a.revenue)[0];
  }, [executivePerformance]);

  // Live Chart Data Preparation
  const revenueTrendData = useMemo(() => {
    if (performanceAnalytics.monthlyRevenueTrend && performanceAnalytics.monthlyRevenueTrend.length > 0) {
      return performanceAnalytics.monthlyRevenueTrend;
    }
    return [
      { period: dayjs().format("MMM"), revenue: totalRevenue, target: monthlyTarget }
    ];
  }, [performanceAnalytics.monthlyRevenueTrend, totalRevenue, monthlyTarget]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 size={40} className="animate-spin text-blue-600" />
        <p className="text-sm text-slate-500 font-medium">Fetching Head of Sales organization analytics & target performance...</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-8 pb-12">
      {/* Header */}
      <PageHeader
        title="Target & Performance Analytics"
        subtitle={`Live sales analytics & target achievement control for ${organizationName}`}
      >
        <button
          onClick={refresh}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-medium hover:bg-slate-50 transition"
        >
          <RefreshCw size={16} /> Refresh Analytics
        </button>
      </PageHeader>

      {/* 1. KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block">Total Organization Target</span>
          <span className="text-xl font-bold text-slate-900 mt-1 block">₹{Number(totalOrganizationTarget).toLocaleString("en-IN")}</span>
        </div>
        <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 shadow-sm">
          <span className="text-xs font-semibold text-emerald-700 block">Achieved Target</span>
          <span className="text-xl font-bold text-emerald-800 mt-1 block">₹{Number(achievedTarget).toLocaleString("en-IN")}</span>
        </div>
        <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 shadow-sm">
          <span className="text-xs font-semibold text-amber-700 block">Remaining Target</span>
          <span className="text-xl font-bold text-amber-800 mt-1 block">₹{Number(remainingTarget).toLocaleString("en-IN")}</span>
        </div>
        <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200 shadow-sm">
          <span className="text-xs font-semibold text-blue-700 block">Achievement Rate</span>
          <span className="text-xl font-bold text-blue-800 mt-1 block">{targetAchievementPercent}%</span>
        </div>
        <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-200 shadow-sm">
          <span className="text-xs font-semibold text-purple-700 block">Performance Score</span>
          <span className="text-xl font-bold text-purple-800 mt-1 block">{overallPerformanceScore} / 100</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block">Total Revenue</span>
          <span className="text-xl font-bold text-slate-900 mt-1 block">₹{Number(totalRevenue).toLocaleString("en-IN")}</span>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block">Total Sales Orders</span>
          <span className="text-xl font-bold text-slate-900 mt-1 block">{totalSalesOrders}</span>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block">Total Customers</span>
          <span className="text-xl font-bold text-slate-900 mt-1 block">{totalCustomers}</span>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block">Active Sales Managers</span>
          <span className="text-xl font-bold text-slate-900 mt-1 block">{totalSalesManagers}</span>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block">Active Sales Executives</span>
          <span className="text-xl font-bold text-slate-900 mt-1 block">{totalSalesExecutives}</span>
        </div>
      </div>

      {/* 13. Key Business Insights */}
      <SectionCard title="Key Business Insights" subtitle="Automated intelligence for organization sales & performance status" icon={Zap} iconColor="text-amber-500">
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50">
            <span className="text-xs text-slate-400 font-medium block">Best Performing Branch</span>
            <span className="text-base font-bold text-slate-900 block mt-0.5">{topBranch.branch || topBranch.name || "Main Branch"}</span>
            <span className="text-xs text-emerald-600 font-semibold block mt-1">₹{Number(topBranch.revenue || 0).toLocaleString("en-IN")} revenue</span>
          </div>
          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50">
            <span className="text-xs text-slate-400 font-medium block">Best Performing Department</span>
            <span className="text-base font-bold text-slate-900 block mt-0.5">{topDepartment.department || topDepartment.name || "Sales Dept"}</span>
            <span className="text-xs text-blue-600 font-semibold block mt-1">₹{Number(topDepartment.revenue || 0).toLocaleString("en-IN")} revenue</span>
          </div>
          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50">
            <span className="text-xs text-slate-400 font-medium block">Best Sales Manager</span>
            <span className="text-base font-bold text-slate-900 block mt-0.5">{topManager.manager || "Sales Manager"}</span>
            <span className="text-xs text-indigo-600 font-semibold block mt-1">₹{Number(topManager.revenue || 0).toLocaleString("en-IN")} generated</span>
          </div>
          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50">
            <span className="text-xs text-slate-400 font-medium block">Best Sales Executive</span>
            <span className="text-base font-bold text-slate-900 block mt-0.5">{topExecutive.executive || "Sales Executive"}</span>
            <span className="text-xs text-purple-600 font-semibold block mt-1">₹{Number(topExecutive.revenue || 0).toLocaleString("en-IN")} generated</span>
          </div>
          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50">
            <span className="text-xs text-slate-400 font-medium block">Lowest Performing Branch</span>
            <span className="text-base font-bold text-slate-900 block mt-0.5">{lowestBranch.branch || lowestBranch.name || "N/A"}</span>
            <span className="text-xs text-amber-600 font-semibold block mt-1">Requires Support</span>
          </div>
          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50">
            <span className="text-xs text-slate-400 font-medium block">Target Achievement Status</span>
            <span className="text-base font-bold text-slate-900 block mt-0.5">{targetAchievementPercent >= 80 ? "On Track" : "Needs Acceleration"}</span>
            <span className="text-xs text-emerald-600 font-semibold block mt-1">{targetAchievementPercent}% organization goal reached</span>
          </div>
        </div>
      </SectionCard>

      {/* 2. Organization Target Overview */}
      <SectionCard title="Organization Target Overview" subtitle="Target breakdown & progress across periods" icon={Target} iconColor="text-indigo-600">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { period: "Monthly Target", assigned: monthlyTarget, achieved: Math.round(achievedTarget / 12) },
            { period: "Quarterly Target", assigned: quarterlyTarget, achieved: Math.round(achievedTarget / 4) },
            { period: "Half-Yearly Target", assigned: halfYearlyTarget, achieved: Math.round(achievedTarget / 2) },
            { period: "Yearly Target", assigned: yearlyTarget, achieved: achievedTarget },
          ].map((item, idx) => {
            const rem = Math.max(0, item.assigned - item.achieved);
            const pct = item.assigned > 0 ? Math.round((item.achieved / item.assigned) * 100) : 0;
            return (
              <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                <span className="text-xs font-semibold text-slate-500 block">{item.period}</span>
                <div className="flex justify-between items-baseline">
                  <span className="text-lg font-bold text-slate-900">₹{Number(item.assigned).toLocaleString("en-IN")}</span>
                  <span className="text-xs font-bold text-indigo-600">{pct}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${Math.min(100, pct)}%` }}></div>
                </div>
                <div className="flex justify-between text-xs text-slate-500 pt-1">
                  <span>Achieved: ₹{Number(item.achieved).toLocaleString("en-IN")}</span>
                  <span>Rem: ₹{Number(rem).toLocaleString("en-IN")}</span>
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* 3. Branch Performance Analytics */}
      <SectionCard title="Branch Performance Analytics" subtitle="Branch-wise revenue, target achievement & rankings" icon={Building} iconColor="text-blue-600">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b">
              <tr>
                <th className="p-3">Rank</th>
                <th className="p-3">Branch Name</th>
                <th className="p-3">Revenue</th>
                <th className="p-3">Orders</th>
                <th className="p-3">Customers</th>
                <th className="p-3">Assigned Target</th>
                <th className="p-3">Achieved Target</th>
                <th className="p-3">Remaining Target</th>
                <th className="p-3">Achievement %</th>
                <th className="p-3">Growth %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {branchPerformance.length === 0 ? (
                <tr><td colSpan="10" className="p-4 text-center text-slate-400">No branch data available</td></tr>
              ) : (
                branchPerformance.map((row, idx) => {
                  const targetRow = branchTargetPerformance.find(b => b.branch === row.branch) || {};
                  const assigned = targetRow.assignedTarget || row.revenue * 1.2;
                  const achieved = targetRow.achieved || row.revenue;
                  const rem = Math.max(0, assigned - achieved);
                  const pct = assigned > 0 ? Math.round((achieved / assigned) * 100) : 0;
                  return (
                    <tr key={idx} className="hover:bg-slate-50/80">
                      <td className="p-3 font-bold text-slate-500">#{idx + 1}</td>
                      <td className="p-3 font-bold text-slate-900">{row.branch}</td>
                      <td className="p-3 font-bold text-emerald-600">₹{Number(row.revenue).toLocaleString("en-IN")}</td>
                      <td className="p-3">{row.orders}</td>
                      <td className="p-3">{row.customers}</td>
                      <td className="p-3">₹{Number(assigned).toLocaleString("en-IN")}</td>
                      <td className="p-3 text-emerald-600">₹{Number(achieved).toLocaleString("en-IN")}</td>
                      <td className="p-3 text-amber-600">₹{Number(rem).toLocaleString("en-IN")}</td>
                      <td className="p-3 font-bold text-indigo-600">{pct}%</td>
                      <td className="p-3 text-emerald-600 font-semibold">+{row.growthPercent || 12}%</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* 4. Department Performance Analytics */}
      <SectionCard title="Department Performance Analytics" subtitle="Department revenue & target breakdown" icon={GitBranch} iconColor="text-purple-600">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b">
              <tr>
                <th className="p-3">Department Name</th>
                <th className="p-3">Revenue</th>
                <th className="p-3">Orders</th>
                <th className="p-3">Customers</th>
                <th className="p-3">Assigned Target</th>
                <th className="p-3">Achieved Target</th>
                <th className="p-3">Remaining Target</th>
                <th className="p-3">Achievement %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {departmentPerformance.length === 0 ? (
                <tr><td colSpan="8" className="p-4 text-center text-slate-400">No department data available</td></tr>
              ) : (
                departmentPerformance.map((row, idx) => {
                  const targetRow = departmentTargetPerformance.find(d => d.department === row.department) || {};
                  const assigned = targetRow.assignedTarget || row.revenue * 1.1;
                  const achieved = targetRow.achieved || row.revenue;
                  const rem = Math.max(0, assigned - achieved);
                  const pct = assigned > 0 ? Math.round((achieved / assigned) * 100) : 0;
                  return (
                    <tr key={idx} className="hover:bg-slate-50/80">
                      <td className="p-3 font-bold text-slate-900">{row.department}</td>
                      <td className="p-3 font-bold text-slate-900">₹{Number(row.revenue).toLocaleString("en-IN")}</td>
                      <td className="p-3">{row.orders}</td>
                      <td className="p-3">{row.customers}</td>
                      <td className="p-3">₹{Number(assigned).toLocaleString("en-IN")}</td>
                      <td className="p-3 text-emerald-600 font-medium">₹{Number(achieved).toLocaleString("en-IN")}</td>
                      <td className="p-3 text-amber-600">₹{Number(rem).toLocaleString("en-IN")}</td>
                      <td className="p-3 font-bold text-purple-600">{pct}%</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* 5. Sales Manager Performance & 6. Sales Executive Performance Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Sales Manager Performance" icon={UserCheck} iconColor="text-emerald-600">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b">
                <tr>
                  <th className="p-2.5">Manager</th>
                  <th className="p-2.5">Team Size</th>
                  <th className="p-2.5">Revenue</th>
                  <th className="p-2.5">Orders</th>
                  <th className="p-2.5">Achievement %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {managerPerformance.length === 0 ? (
                  <tr><td colSpan="5" className="p-3 text-center text-slate-400">No manager records</td></tr>
                ) : managerPerformance.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80">
                    <td className="p-2.5 font-bold text-slate-900">{row.manager}</td>
                    <td className="p-2.5">{row.teamSize}</td>
                    <td className="p-2.5 font-bold text-emerald-600">₹{Number(row.revenue).toLocaleString("en-IN")}</td>
                    <td className="p-2.5">{row.orders}</td>
                    <td className="p-2.5 font-bold text-indigo-600">{row.targetPercent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard title="Top Sales Executive Performance" icon={Users} iconColor="text-sky-600">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b">
                <tr>
                  <th className="p-2.5">Executive</th>
                  <th className="p-2.5">Revenue</th>
                  <th className="p-2.5">Orders</th>
                  <th className="p-2.5">Visits</th>
                  <th className="p-2.5">Conversion %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {executivePerformance.length === 0 ? (
                  <tr><td colSpan="5" className="p-3 text-center text-slate-400">No executive records</td></tr>
                ) : executivePerformance.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80">
                    <td className="p-2.5 font-bold text-slate-900">{row.executive}</td>
                    <td className="p-2.5 font-bold text-slate-900">₹{Number(row.revenue).toLocaleString("en-IN")}</td>
                    <td className="p-2.5">{row.orders}</td>
                    <td className="p-2.5">{row.visits}</td>
                    <td className="p-2.5 font-bold text-sky-600">{row.conversionPercent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>

      {/* 7. Revenue & Sales Analytics Visual Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <SectionCard title="Revenue Trend vs Target" subtitle="Monthly organization revenue achievement" icon={TrendingUp} iconColor="text-emerald-600">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueTrendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" name="Achieved Revenue" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="target" name="Monthly Target" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Branch Revenue Comparison" subtitle="Revenue contribution by branch" icon={PieChartIcon} iconColor="text-blue-600">
          <div className="h-64 w-full flex items-center justify-center">
            {branchPerformance.length === 0 ? (
              <p className="text-sm text-slate-400">No branch revenue data</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={branchPerformance} dataKey="revenue" nameKey="branch" cx="50%" cy="50%" outerRadius={80} label>
                    {branchPerformance.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </SectionCard>
      </div>

      {/* 12. Leaderboards Section */}
      <SectionCard title="Organization Leaderboards" subtitle="Top performing branches, departments, managers & executives" icon={Award} iconColor="text-amber-500">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 space-y-2">
            <span className="text-xs font-bold text-slate-500 uppercase block">Top Branch</span>
            <p className="text-base font-extrabold text-slate-900">{topBranch.branch || topBranch.name || "Main Branch"}</p>
            <p className="text-xs font-bold text-emerald-600">₹{Number(topBranch.revenue || 0).toLocaleString("en-IN")}</p>
          </div>
          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 space-y-2">
            <span className="text-xs font-bold text-slate-500 uppercase block">Top Department</span>
            <p className="text-base font-extrabold text-slate-900">{topDepartment.department || topDepartment.name || "Sales Dept"}</p>
            <p className="text-xs font-bold text-blue-600">₹{Number(topDepartment.revenue || 0).toLocaleString("en-IN")}</p>
          </div>
          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 space-y-2">
            <span className="text-xs font-bold text-slate-500 uppercase block">Top Sales Manager</span>
            <p className="text-base font-extrabold text-slate-900">{topManager.manager || "Sales Manager"}</p>
            <p className="text-xs font-bold text-indigo-600">₹{Number(topManager.revenue || 0).toLocaleString("en-IN")}</p>
          </div>
          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 space-y-2">
            <span className="text-xs font-bold text-slate-500 uppercase block">Top Sales Executive</span>
            <p className="text-base font-extrabold text-slate-900">{topExecutive.executive || "Sales Executive"}</p>
            <p className="text-xs font-bold text-purple-600">₹{Number(topExecutive.revenue || 0).toLocaleString("en-IN")}</p>
          </div>
        </div>
      </SectionCard>
    </motion.div>
  );
}
