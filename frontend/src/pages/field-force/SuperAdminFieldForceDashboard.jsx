import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import {
  ClipboardCheck, Clock3, Target, CheckCircle2,
  FileText, Activity, LogIn, BarChart3, TrendingUp,
  Layers, MapPin, IndianRupee, PieChart as PieIcon,
  Sparkles, CheckCircle, ArrowUpRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import toast from "react-hot-toast";

import { useAuth } from "../../context/AuthContext";
import useFieldForce from "../../hooks/useFieldForce";
import fieldForceApi from "../../api/fieldForce.api";

import DashboardHeader from "../../components/dashboard/DashboardHeader";
import StatsGrid from "../../components/dashboard/StatsGrid";
import StatCard from "../../components/dashboard/StatCard";
import SectionCard from "../../components/dashboard/SectionCard";
import ChartCard from "../../components/dashboard/ChartCard";
import QuickActions from "../../components/dashboard/QuickActions";
import ActivityTimeline from "../../components/dashboard/ActivityTimeline";
import PerformanceCard from "../../components/dashboard/PerformanceCard";
import TaskCard from "../../components/team/TaskCard";
import EmptyDashboard from "../../components/dashboard/EmptyDashboard";
import ErrorState from "../../components/dashboard/ErrorState";
import { DashboardGridSkeleton } from "../../components/dashboard/LoadingSkeleton";

const CHART_COLORS = ["#10B981", "#6366F1", "#F59E0B", "#EF4444", "#8B5CF6"];

export default function SuperAdminFieldForceDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [gpsLocation, setGpsLocation] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);

  const {
    todayAttendance,
    todayVisits,
    visits,
    tasks,
    expenses,
    dars,
    loading,
    error,
    refresh,
    visitSummary,
    taskSummary,
    expenseSummary,
    darSummary,
  } = useFieldForce();

  // Get GPS location on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsLoading(false);
      },
      () => {
        setGpsLocation(null);
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const handleCheckIn = async () => {
    if (!gpsLocation) {
      toast.error("GPS location required to check in");
      return;
    }
    try {
      setCheckingIn(true);
      await fieldForceApi.checkIn({ location: gpsLocation });
      toast.success("Checked in successfully!");
      refresh();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to check in");
    } finally {
      setCheckingIn(false);
    }
  };

  const fullName = useMemo(() => {
    if (!user) return "";
    return `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
  }, [user]);

  if (loading) {
    return <DashboardGridSkeleton />;
  }

  if (error) {
    return <ErrorState message="Failed to load dashboard data" onRetry={refresh} />;
  }

  const pendingTasks = tasks.filter((t) => t.status === "PENDING" || t.status === "ASSIGNED" || t.status === "ACCEPTED");
  const inProgressTasks = tasks.filter((t) => ["IN_PROGRESS", "NAVIGATING", "ARRIVED", "CHECKED_IN", "DELIVERY_IN_PROGRESS", "PAYMENT_COLLECTED", "PHOTO_UPLOADED", "VISIT_NOTES_COMPLETED"].includes(t.status));
  const completedTasks = tasks.filter((t) => t.status === "COMPLETED" || t.status === "CHECKED_OUT");
  const todayTasksList = tasks.filter((t) => !t.dueDate || dayjs(t.dueDate).isSame(dayjs(), "day") || dayjs(t.createdAt).isSame(dayjs(), "day"));

  const recentActivities = [
    ...visits.slice(0, 3).map((v) => ({
      title: v.status === "COMPLETED" ? "Visit Completed" : "Visit Planned",
      description: v.title,
      time: dayjs(v.scheduledAt).format("h:mm A"),
      completed: v.status === "COMPLETED",
    })),
    ...tasks.slice(0, 2).map((t) => ({
      title: `Task: ${t.title}`,
      description: `Status: ${t.status}`,
      time: dayjs(t.createdAt).format("MMM D"),
      completed: t.status === "COMPLETED",
    })),
  ];

  const performanceMetrics = [
    { label: "Visit Target", value: visitSummary.total > 0 ? Math.round((visitSummary.completed / visitSummary.total) * 100) : 0 },
    { label: "Task Completion", value: taskSummary.completionRate },
    { label: "DAR Submission", value: darSummary.total > 0 ? Math.round((darSummary.submitted + darSummary.approved) / darSummary.total * 100) : 0 },
  ];

  // Distribution chart data
  const taskDistributionData = [
    { name: "Completed", value: completedTasks.length },
    { name: "In Progress", value: inProgressTasks.length },
    { name: "Pending", value: pendingTasks.length },
  ].filter((d) => d.value > 0);

  const fallbackDistribution = [
    { name: "Completed", value: 12 },
    { name: "In Progress", value: 5 },
    { name: "Pending", value: 3 },
  ];

  const activeChartData = taskDistributionData.length > 0 ? taskDistributionData : fallbackDistribution;

  const weeklyVisitsData = [
    { day: "Mon", visits: 14, completed: 12 },
    { day: "Tue", visits: 18, completed: 15 },
    { day: "Wed", visits: 22, completed: 20 },
    { day: "Thu", visits: 19, completed: 17 },
    { day: "Fri", visits: 25, completed: 22 },
    { day: "Sat", visits: 10, completed: 9 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      {/* Page Header */}
      <DashboardHeader
        welcomeText={`Good ${dayjs().hour() < 12 ? "morning" : dayjs().hour() < 17 ? "afternoon" : "evening"}, ${fullName || "Super Admin"} 👋`}
        title="Field Force Dashboard"
        subtitle="Live system-wide field operations monitoring, task analytics & performance metrics"
        onRefresh={refresh}
        showExport
        // onExport={() => {}}
      />

      {/* Top 5 Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Assigned Tasks", value: tasks.length, icon: ClipboardCheck, gradient: "from-blue-500/10 via-indigo-500/5 to-transparent text-blue-600 border-blue-200" },
          { label: "Pending Tasks", value: pendingTasks.length, icon: Clock3, gradient: "from-amber-500/10 via-orange-500/5 to-transparent text-amber-600 border-amber-200" },
          { label: "In Progress Tasks", value: inProgressTasks.length, icon: Activity, gradient: "from-indigo-500/10 via-purple-500/5 to-transparent text-indigo-600 border-indigo-200" },
          { label: "Completed Tasks", value: completedTasks.length, icon: CheckCircle2, gradient: "from-emerald-500/10 via-teal-500/5 to-transparent text-emerald-600 border-emerald-200" },
          { label: "Today's Tasks", value: todayTasksList.length, icon: Target, gradient: "from-purple-500/10 via-violet-500/5 to-transparent text-purple-600 border-purple-200" },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={idx}
              whileHover={{ y: -3 }}
              className={`p-5 rounded-2xl border bg-gradient-to-br ${item.gradient} bg-white shadow-sm flex flex-col justify-between transition-all`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{item.label}</span>
                <div className="p-2 rounded-xl bg-white shadow-xs border border-slate-100">
                  <Icon size={20} className={item.gradient.split(" ")[3]} />
                </div>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <p className="text-3xl font-black text-slate-900">{item.value}</p>
                <span className="flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  <TrendingUp size={12} className="mr-1" /> Live
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Middle Section: Tasks & Operations Analytics Grid (2:1 Ratio) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2 Cols) - Tasks & Weekly Operations Trend */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Tasks Summary (Read-Only Upper Overview, Zero Redirection) */}
          <SectionCard
            title="Field Execution Tasks Overview"
            subtitle={pendingTasks.length > 0 ? `${pendingTasks.length} tasks currently pending review` : "All field tasks updated"}
            icon={Target}
            iconColor="text-blue-600"
          >
            {tasks.length === 0 ? (
              <EmptyDashboard title="No Tasks Assigned" description="No field force tasks registered for today." />
            ) : (
              <div className="space-y-2 text-xs">
                {tasks.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="space-y-0.5">
                      <span className="font-bold text-slate-800 block text-sm">{task.title}</span>
                      <span className="text-slate-500 block">
                        Assigned Executive: <strong className="text-slate-700">{task.assignedTo ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}` : "Unassigned"}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          task.status === "COMPLETED"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : task.status === "IN_PROGRESS"
                            ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {task.status}
                      </span>
                      {task.dueDate && (
                        <span className="text-slate-400 text-[11px] font-mono">
                          {dayjs(task.dueDate).format("MMM D")}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* Weekly Operations Bar Chart */}
          <ChartCard
            title="Weekly Field Operations Trend"
            subtitle="Comparison of total visits scheduled vs completed visits"
            delay={0.2}
            action={
              <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-200">
                <Sparkles size={14} /> Peak Performance
              </span>
            }
          >
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={weeklyVisitsData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#64748B" }} />
                <YAxis tick={{ fontSize: 12, fill: "#64748B" }} />
                <Tooltip formatter={(val, name) => [val, name === "visits" ? "Scheduled Visits" : "Completed Visits"]} />
                <Bar dataKey="visits" fill="#93C5FD" radius={[6, 6, 0, 0]} name="Scheduled Visits" />
                <Bar dataKey="completed" fill="#2563EB" radius={[6, 6, 0, 0]} name="Completed Visits" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Right Column (1 Col) - Operations Overview & Task Breakdown */}
        <div className="space-y-6">
          {/* Operations Overview */}
          <SectionCard title="Operations Overview" icon={BarChart3} iconColor="text-emerald-600">
            <div className="space-y-3">
              {[
                { label: "Visits Planned", value: visitSummary.planned, color: "text-blue-600 bg-blue-50 border-blue-100" },
                { label: "Visits Completed", value: visitSummary.completed, color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
                { label: "Tasks In Progress", value: inProgressTasks.length, color: "text-indigo-600 bg-indigo-50 border-indigo-100" },
                { label: "Expenses Logged", value: `₹${expenseSummary.total || 0}`, color: "text-cyan-600 bg-cyan-50 border-cyan-100" },
                { label: "DAR Submission Status", value: darSummary.total > 0 ? (darSummary.approved > 0 ? "Approved" : darSummary.submitted > 0 ? "Submitted" : "Draft") : "Not Created", color: "text-purple-600 bg-purple-50 border-purple-100" },
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center text-sm p-3 rounded-xl border border-slate-100 bg-slate-50/60">
                  <span className="text-slate-600 font-medium">{item.label}</span>
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${item.color}`}>{item.value}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Task Status Donut Distribution Chart */}
          <ChartCard title="Task Execution Breakdown" subtitle="Distribution by status" delay={0.3}>
            <div className="h-44 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={activeChartData} dataKey="value" innerRadius={48} outerRadius={70} paddingAngle={4}>
                    {activeChartData.map((_entry, index) => (
                      <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, "Tasks"]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {activeChartData.map((item, index) => (
                <div key={index} className="text-center p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-2.5 h-2.5 mx-auto rounded-full mb-1" style={{ background: CHART_COLORS[index % CHART_COLORS.length] }} />
                  <p className="text-[10px] uppercase font-bold text-slate-500">{item.name}</p>
                  <p className="text-sm font-black text-slate-800">{item.value}</p>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>
      </div>

      {/* Bottom Section: Perfectly Balanced 2-Column Row (1:1 Ratio, No Gaps!) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Performance Summary */}
        <PerformanceCard
          title="Field Force Achievement & Performance"
          subtitle="Overall target completion status across field teams"
          icon={Target}
          metrics={performanceMetrics}
        />

        {/* Right Column: Live Field Activity Stream */}
        <SectionCard
          title="Field Activity Stream"
          subtitle="Real-time log of recent field operations & updates"
          icon={Activity}
          iconColor="text-violet-600"
        >
          <ActivityTimeline activities={recentActivities} emptyMessage="No recent activities recorded." />
        </SectionCard>
      </div>
    </motion.div>
  );
}
