import { useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import {
  ClipboardCheck, Clock3, Target, CheckCircle2, Activity, BarChart3,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import useFieldForce from "../../hooks/useFieldForce";

import DashboardHeader from "../../components/dashboard/DashboardHeader";
import StatsGrid from "../../components/dashboard/StatsGrid";
import StatCard from "../../components/dashboard/StatCard";
import SectionCard from "../../components/dashboard/SectionCard";
import ActivityTimeline from "../../components/dashboard/ActivityTimeline";
import PerformanceCard from "../../components/dashboard/PerformanceCard";
import TaskCard from "../../components/team/TaskCard";
import EmptyDashboard from "../../components/dashboard/EmptyDashboard";
import ErrorState from "../../components/dashboard/ErrorState";
import { DashboardGridSkeleton } from "../../components/dashboard/LoadingSkeleton";

export default function FieldForceDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const {
    visits,
    tasks,
    loading,
    error,
    refresh,
    visitSummary,
    taskSummary,
    darSummary,
  } = useFieldForce(user?.id);

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
    { label: "Task Target", value: visitSummary.total > 0 ? Math.round((visitSummary.completed / visitSummary.total) * 100) : 0 },
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

      {/* Real Task Database Statistics Grid */}
      <StatsGrid>
        <StatCard title="Assigned Tasks" value={tasks.length} icon={ClipboardCheck} color="bg-blue-500" />
        <StatCard title="Pending Tasks" value={pendingTasks.length} icon={Clock3} color="bg-amber-500" />
        <StatCard title="In Progress Tasks" value={inProgressTasks.length} icon={Activity} color="bg-indigo-500" />
        <StatCard title="Completed Tasks" value={completedTasks.length} icon={CheckCircle2} color="bg-emerald-500" />
        <StatCard title="Today's Tasks" value={todayTasksList.length} icon={Target} color="bg-purple-500" />
      </StatsGrid>

      {/* Today's Tasks & Summary */}
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
          <SectionCard title="Today's Summary" icon={BarChart3} iconColor="text-emerald-600">
            <div className="space-y-3">
              {[
                { label: "Tasks Planned", value: visitSummary.planned },
                { label: "Tasks Completed", value: visitSummary.completed },
                { label: "Tasks In Progress", value: inProgressTasks.length },
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
    </motion.div>
  );
}
