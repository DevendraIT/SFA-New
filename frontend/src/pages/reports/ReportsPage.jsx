import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import dayjs from "dayjs";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Building,
  ShoppingCart,
  Award,
  Users,
  Calendar,
  Download,
  RefreshCw,
  Loader2,
  Building2,
  CheckCircle2,
  AlertCircle,
  Clock,
  UserCheck,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import reportApi from "../../api/report.api";
import PageHeader from "../../components/dashboard/PageHeader";
import SectionCard from "../../components/dashboard/SectionCard";
import ErrorState from "../../components/dashboard/ErrorState";

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4"];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("REVENUE");
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await reportApi.getBusinessAnalytics();
      const data = res.data?.data || res.data;
      setAnalytics(data);
    } catch (err) {
      console.error("Failed to load business reports:", err);
      setError(err?.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const handleExportCSV = () => {
    if (!analytics) return;
    const rev = analytics.revenueReports || {};
    const sales = analytics.salesReports || {};
    const comp = analytics.companyReports || {};

    const csvRows = [
      ["Metric Category", "Metric Name", "Value"],
      ["Revenue", "Daily Revenue", `₹${rev.dailyRevenue || 0}`],
      ["Revenue", "Weekly Revenue", `₹${rev.weeklyRevenue || 0}`],
      ["Revenue", "Monthly Revenue", `₹${rev.monthlyRevenue || 0}`],
      ["Revenue", "Yearly Revenue", `₹${rev.yearlyRevenue || 0}`],
      ["Sales", "Orders Created", sales.ordersCreated || 0],
      ["Sales", "Orders Completed", sales.ordersCompleted || 0],
      ["Sales", "Orders Pending", sales.ordersPending || 0],
      ["Sales", "Cancelled Orders", sales.cancelledOrders || 0],
      ["Companies", "Active Companies", comp.activeCompanies || 0],
      ["Companies", "New Companies", comp.newCompanies || 0],
    ];

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Business_Analytics_Report_${dayjs().format("YYYY-MM-DD")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <Loader2 size={40} className="animate-spin text-blue-600" />
        <p className="text-sm font-semibold text-slate-600">Generating real-time business reports...</p>
      </div>
    );
  }

  if (error) {
    return <ErrorState message="Failed to load business analytics" onRetry={loadAnalytics} />;
  }

  const { revenueReports = {}, companyReports = {}, salesReports = {}, performanceReports = {}, customerReports = {} } = analytics || {};

  const orderStatusDistribution = [
    { name: "Completed", value: salesReports.ordersCompleted || 0 },
    { name: "Pending", value: salesReports.ordersPending || 0 },
    { name: "Cancelled", value: salesReports.cancelledOrders || 0 },
  ].filter((d) => d.value > 0);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <PageHeader title="Business Reports & Analytics" subtitle="Comprehensive enterprise metrics powered by live database records">
        <div className="flex items-center gap-3">
          <button
            onClick={loadAnalytics}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 bg-white text-sm font-medium hover:bg-slate-50 transition"
          >
            <RefreshCw size={16} /> Refresh
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
          >
            <Download size={16} /> Export CSV
          </button>
        </div>
      </PageHeader>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {[
          { id: "REVENUE", label: "Revenue Reports", icon: DollarSign },
          { id: "COMPANY", label: "Company Reports", icon: Building2 },
          { id: "SALES", label: "Sales Reports", icon: ShoppingCart },
          { id: "PERFORMANCE", label: "Performance Reports", icon: Award },
          { id: "CUSTOMER", label: "Customer Reports", icon: Users },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition cursor-pointer ${
                isActive
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 1. REVENUE REPORTS */}
      {activeTab === "REVENUE" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200">
              <p className="text-xs font-semibold text-emerald-700 uppercase">Daily Revenue</p>
              <p className="text-2xl font-black text-emerald-950 mt-1">₹{Number(revenueReports.dailyRevenue || 0).toLocaleString("en-IN")}</p>
            </div>
            <div className="p-5 rounded-2xl bg-blue-50 border border-blue-200">
              <p className="text-xs font-semibold text-blue-700 uppercase">Weekly Revenue</p>
              <p className="text-2xl font-black text-blue-950 mt-1">₹{Number(revenueReports.weeklyRevenue || 0).toLocaleString("en-IN")}</p>
            </div>
            <div className="p-5 rounded-2xl bg-indigo-50 border border-indigo-200">
              <p className="text-xs font-semibold text-indigo-700 uppercase">Monthly Revenue</p>
              <p className="text-2xl font-black text-indigo-950 mt-1">₹{Number(revenueReports.monthlyRevenue || 0).toLocaleString("en-IN")}</p>
            </div>
            <div className="p-5 rounded-2xl bg-purple-50 border border-purple-200">
              <p className="text-xs font-semibold text-purple-700 uppercase">Yearly Revenue</p>
              <p className="text-2xl font-black text-purple-950 mt-1">₹{Number(revenueReports.yearlyRevenue || 0).toLocaleString("en-IN")}</p>
            </div>
          </div>

          <SectionCard title="Revenue Trajectory" subtitle="Monthly aggregated revenue from approved & completed orders" icon={TrendingUp} iconColor="text-emerald-600">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueReports.monthlyTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(val) => [`₹${Number(val).toLocaleString("en-IN")}`, "Revenue"]} />
                  <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={3} dot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>
        </div>
      )}

      {/* 2. COMPANY REPORTS */}
      {activeTab === "COMPANY" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-purple-50 border border-purple-200">
              <p className="text-xs font-semibold text-purple-700 uppercase">Active Companies</p>
              <p className="text-2xl font-black text-purple-950 mt-1">{companyReports.activeCompanies || 0}</p>
            </div>
            <div className="p-5 rounded-2xl bg-blue-50 border border-blue-200">
              <p className="text-xs font-semibold text-blue-700 uppercase">New Companies (30 Days)</p>
              <p className="text-2xl font-black text-blue-950 mt-1">{companyReports.newCompanies || 0}</p>
            </div>
            <div className="p-5 rounded-2xl bg-cyan-50 border border-cyan-200">
              <p className="text-xs font-semibold text-cyan-700 uppercase">Total Companies</p>
              <p className="text-2xl font-black text-cyan-950 mt-1">{companyReports.totalCompanies || 0}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SectionCard title="Company-Wise Sales" subtitle="Total revenue generated per company" icon={Building2} iconColor="text-blue-600">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={companyReports.companyWiseSales || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(val) => [`₹${Number(val).toLocaleString("en-IN")}`, "Sales"]} />
                    <Bar dataKey="sales" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>

            <SectionCard title="Top Performing Companies" subtitle="Leading sales volume contributors" icon={Award} iconColor="text-amber-500">
              <div className="space-y-3">
                {(companyReports.topPerformingCompanies || []).map((comp, idx) => (
                  <div key={comp.id || idx} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="h-7 w-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <div>
                        <p className="font-bold text-sm text-slate-900">{comp.name}</p>
                        <p className="text-xs text-slate-500">{comp.orderCount} orders recorded</p>
                      </div>
                    </div>
                    <span className="font-extrabold text-sm text-emerald-600">₹{Number(comp.sales || 0).toLocaleString("en-IN")}</span>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        </div>
      )}

      {/* 3. SALES REPORTS */}
      {activeTab === "SALES" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-blue-50 border border-blue-200">
              <p className="text-xs font-semibold text-blue-700 uppercase">Orders Created</p>
              <p className="text-2xl font-black text-blue-950 mt-1">{salesReports.ordersCreated || 0}</p>
            </div>
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200">
              <p className="text-xs font-semibold text-emerald-700 uppercase">Orders Completed</p>
              <p className="text-2xl font-black text-emerald-950 mt-1">{salesReports.ordersCompleted || 0}</p>
            </div>
            <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200">
              <p className="text-xs font-semibold text-amber-700 uppercase">Orders Pending</p>
              <p className="text-2xl font-black text-amber-950 mt-1">{salesReports.ordersPending || 0}</p>
            </div>
            <div className="p-5 rounded-2xl bg-red-50 border border-red-200">
              <p className="text-xs font-semibold text-red-700 uppercase">Cancelled Orders</p>
              <p className="text-2xl font-black text-red-950 mt-1">{salesReports.cancelledOrders || 0}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <SectionCard title="Sales Volume & Revenue Trend" subtitle="Monthly order trajectory" className="lg:col-span-2" icon={ShoppingCart} iconColor="text-blue-600">
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesReports.salesTrend || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(val, name) => [name === "revenue" ? `₹${Number(val).toLocaleString("en-IN")}` : val, name]} />
                    <Bar dataKey="revenue" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>

            <SectionCard title="Order Status Breakdown" subtitle="Distribution of order states" icon={BarChart3} iconColor="text-indigo-600">
              {orderStatusDistribution.length > 0 ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={orderStatusDistribution} dataKey="value" innerRadius={55} outerRadius={85} paddingAngle={4}>
                        {orderStatusDistribution.map((_, idx) => (
                          <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-500 text-sm">No orders to visualize.</div>
              )}
            </SectionCard>
          </div>
        </div>
      )}

      {/* 4. PERFORMANCE REPORTS */}
      {activeTab === "PERFORMANCE" && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-indigo-50 border border-indigo-200 flex justify-between items-center">
            <div>
              <p className="text-xs font-semibold text-indigo-700 uppercase">Target Achievement Summary</p>
              <p className="text-2xl font-black text-indigo-950 mt-1">
                {performanceReports.targetAchievementSummary?.achievementRate || 0}% Target Achieved
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Total Target: ₹{Number(performanceReports.targetAchievementSummary?.totalTarget || 0).toLocaleString("en-IN")}</p>
              <p className="text-xs font-bold text-emerald-600">Achieved: ₹{Number(performanceReports.targetAchievementSummary?.totalAchieved || 0).toLocaleString("en-IN")}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SectionCard title="Top Sales Managers" subtitle="Leading sales managers by revenue" icon={Award} iconColor="text-amber-500">
              <div className="space-y-3">
                {(performanceReports.topSalesManagers || []).map((m, idx) => (
                  <div key={m.id || idx} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div>
                      <p className="font-bold text-sm text-slate-900">{m.name}</p>
                      <p className="text-xs text-slate-500">{m.role} • {m.orderCount || 0} orders</p>
                    </div>
                    <span className="font-extrabold text-sm text-emerald-600">₹{Number(m.sales || 0).toLocaleString("en-IN")}</span>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Top Sales Executives" subtitle="Leading field sales executives" icon={Award} iconColor="text-emerald-600">
              <div className="space-y-3">
                {(performanceReports.topSalesExecutives || []).map((e, idx) => (
                  <div key={e.id || idx} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div>
                      <p className="font-bold text-sm text-slate-900">{e.name}</p>
                      <p className="text-xs text-slate-500">{e.role} • {e.orderCount || 0} orders</p>
                    </div>
                    <span className="font-extrabold text-sm text-emerald-600">₹{Number(e.sales || 0).toLocaleString("en-IN")}</span>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        </div>
      )}

      {/* 5. CUSTOMER REPORTS */}
      {activeTab === "CUSTOMER" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-blue-50 border border-blue-200">
              <p className="text-xs font-semibold text-blue-700 uppercase">New Customers (30 Days)</p>
              <p className="text-2xl font-black text-blue-950 mt-1">{customerReports.newCustomers || 0}</p>
            </div>
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200">
              <p className="text-xs font-semibold text-emerald-700 uppercase">Active Customers</p>
              <p className="text-2xl font-black text-emerald-950 mt-1">{customerReports.activeCustomers || 0}</p>
            </div>
            <div className="p-5 rounded-2xl bg-purple-50 border border-purple-200">
              <p className="text-xs font-semibold text-purple-700 uppercase">Total System Customers</p>
              <p className="text-2xl font-black text-purple-950 mt-1">{customerReports.totalCustomers || 0}</p>
            </div>
          </div>

          <SectionCard title="Customer Growth Trajectory" subtitle="New customer onboarding trend" icon={Users} iconColor="text-blue-600">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={customerReports.customerGrowth || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>
        </div>
      )}
    </motion.div>
  );
}
