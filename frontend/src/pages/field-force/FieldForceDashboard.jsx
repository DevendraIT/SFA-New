import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import {
  MapPin, ClipboardCheck, Clock3, ShoppingCart, IndianRupee,
  TrendingUp, Target, Calendar, CheckCircle2, AlertCircle,
  FileText, UserCheck, Activity, LogIn, LogOut, Map,
  StickyNote, Camera, BarChart3, Navigation,
} from "lucide-react";
import toast from "react-hot-toast";

import { useAuth } from "../../context/AuthContext";
import useFieldForce from "../../hooks/useFieldForce";
import fieldForceApi from "../../api/fieldForce.api";

import DashboardHeader from "../../components/dashboard/DashboardHeader";
import StatsGrid from "../../components/dashboard/StatsGrid";
import StatCard from "../../components/dashboard/StatCard";
import SectionCard from "../../components/dashboard/SectionCard";
import QuickActions from "../../components/dashboard/QuickActions";
import ActivityTimeline from "../../components/dashboard/ActivityTimeline";
import PerformanceCard from "../../components/dashboard/PerformanceCard";
import AttendanceCard from "../../components/dashboard/AttendanceCard";
import StatusBadge from "../../components/field-force/StatusBadge";
import CheckInCard from "../../components/field-force/CheckInCard";
import TaskCard from "../../components/team/TaskCard";
import EmptyDashboard from "../../components/dashboard/EmptyDashboard";
import ErrorState from "../../components/dashboard/ErrorState";
import { DashboardGridSkeleton } from "../../components/dashboard/LoadingSkeleton";

export default function FieldForceDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [gpsLocation, setGpsLocation] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

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
  } = useFieldForce(user?.id);

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

  const handleCheckOut = async () => {
    if (!gpsLocation) {
      toast.error("GPS location required to check out");
      return;
    }
    try {
      setCheckingOut(true);
      await fieldForceApi.checkOut({ location: gpsLocation });
      toast.success("Checked out successfully!");
      refresh();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to check out");
    } finally {
      setCheckingOut(false);
    }
  };

  const fullName = useMemo(() => {
    if (!user) return "";
    return `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
  }, [user]);

  const quickActions = [
    {
      label: "Check-In",
      icon: LogIn,
      iconColor: "text-emerald-600",
      onClick: handleCheckIn,
      disabled: !gpsLocation || !!todayAttendance?.checkInAt,
    },
    {
      label: "Plan Visit",
      icon: ClipboardCheck,
      iconColor: "text-blue-600",
      onClick: () => navigate("/field-force/visits"),
    },
    {
      label: "Execute Task",
      icon: Target,
      iconColor: "text-cyan-600",
      onClick: () => navigate("/field-force/tasks"),
    },
    {
      label: "Submit DAR",
      icon: FileText,
      iconColor: "text-violet-600",
      onClick: () => navigate("/field-force/dar"),
    },
  ];

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

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <DashboardHeader
        welcomeText={`Good ${dayjs().hour() < 12 ? "morning" : dayjs().hour() < 17 ? "afternoon" : "evening"}, ${fullName || "Sales Executive"} 👋`}
        title="Field Force Dashboard"
        subtitle="Your complete field operations & task execution status"
        onRefresh={refresh}
      />

      {/* Attendance & Check-In Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CheckInCard
            todayAttendance={todayAttendance}
            onCheckIn={handleCheckIn}
            onCheckOut={handleCheckOut}
            checkingIn={checkingIn}
            checkingOut={checkingOut}
            location={gpsLocation}
          />
        </div>
        <AttendanceCard
          present={visitSummary.completed}
          absent={visitSummary.cancelled}
          leave={0}
          rate={visitSummary.total > 0 ? Math.round((visitSummary.completed / visitSummary.total) * 100) : 0}
          title="Today's Activity"
          subtitle="Visit completion summary"
        />
      </div>

      {/* Real Task Database Statistics Grid */}
      <StatsGrid>
        <StatCard title="Assigned Tasks" value={tasks.length} icon={ClipboardCheck} color="bg-blue-500" />
        <StatCard title="Pending Tasks" value={pendingTasks.length} icon={Clock3} color="bg-amber-500" />
        <StatCard title="In Progress Tasks" value={inProgressTasks.length} icon={Activity} color="bg-indigo-500" />
        <StatCard title="Completed Tasks" value={completedTasks.length} icon={CheckCircle2} color="bg-emerald-500" />
        <StatCard title="Today's Tasks" value={todayTasksList.length} icon={Target} color="bg-purple-500" />
      </StatsGrid>

      {/* Today's Tasks & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SectionCard
            title="Today's Tasks"
            subtitle={pendingTasks.length > 0 ? `${pendingTasks.length} pending` : "All clear!"}
            icon={Target}
            action={
              <button onClick={() => navigate("/field-force/tasks")} className="text-blue-600 text-sm font-semibold hover:underline">
                View All
              </button>
            }
          >
            {tasks.length === 0 ? (
              <EmptyDashboard title="No Tasks" description="No tasks assigned for today" />
            ) : (
              <div className="space-y-3">
                {tasks.slice(0, 5).map((task, i) => (
                  <TaskCard key={task.id} task={task} index={i} />
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard title="Quick Actions" subtitle="Common daily tasks">
            <QuickActions actions={quickActions} />
          </SectionCard>

          <SectionCard title="Today's Summary" icon={BarChart3} iconColor="text-emerald-600">
            <div className="space-y-3">
              {[
                { label: "Visits Planned", value: visitSummary.planned },
                { label: "Visits Completed", value: visitSummary.completed },
                { label: "Tasks In Progress", value: inProgressTasks.length },
                { label: "Expenses Logged", value: expenseSummary.total },
                { label: "DAR Status", value: darSummary.total > 0 ? (darSummary.approved > 0 ? "Approved" : darSummary.submitted > 0 ? "Submitted" : "Draft") : "Not Created" },
              ].map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-slate-500">{item.label}</span>
                  <span className="font-semibold text-slate-800">{item.value}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>

      {/* Performance & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <PerformanceCard
          title="Performance Summary"
          subtitle="Current period achievement"
          icon={Target}
          metrics={performanceMetrics}
        />
        <div className="lg:col-span-2">
          <SectionCard
            title="Recent Activity"
            subtitle="Your latest actions"
            icon={Activity}
            action={
              <button onClick={() => navigate("/field-force/activities")} className="text-blue-600 text-sm font-semibold hover:underline">
                View All
              </button>
            }
          >
            <ActivityTimeline activities={recentActivities} emptyMessage="No recent activities" />
          </SectionCard>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Beat Plan", icon: Map, path: "/field-force/beat-plans", color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Route", icon: Navigation, path: "/field-force/route", color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Visits", icon: ClipboardCheck, path: "/field-force/visits", color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Expenses", icon: IndianRupee, path: "/field-force/expenses", color: "text-cyan-600", bg: "bg-cyan-50" },
          { label: "Calendar", icon: Calendar, path: "/field-force/calendar", color: "text-purple-600", bg: "bg-purple-50" },
          { label: "DAR", icon: FileText, path: "/field-force/dar", color: "text-violet-600", bg: "bg-violet-50" },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.button
              key={i}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(item.path)}
              className={`rounded-2xl border border-slate-200 p-4 hover:shadow-md transition-all ${item.bg}`}
            >
              <Icon size={24} className={item.color} />
              <p className="mt-2 text-xs font-semibold text-slate-700">{item.label}</p>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
