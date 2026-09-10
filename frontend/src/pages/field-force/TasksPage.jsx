import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { RefreshCw, Loader2, Target, Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";

import { useAuth } from "../../context/AuthContext";
import fieldForceApi from "../../api/fieldForce.api";
import PageHeader from "../../components/dashboard/PageHeader";
import SectionCard from "../../components/dashboard/SectionCard";
import TaskCard from "../../components/team/TaskCard";
import StatusBadge from "../../components/field-force/StatusBadge";
import EmptyDashboard from "../../components/dashboard/EmptyDashboard";
import ErrorState from "../../components/dashboard/ErrorState";
import { TableSkeleton } from "../../components/dashboard/LoadingSkeleton";

const TASK_FILTERS = ["ALL", "PENDING", "IN_PROGRESS", "COMPLETED"];

export default function TasksPage() {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState("ALL");

  const {
    data: tasks = [],
    isLoading: loading,
    error,
    refetch: loadData,
  } = useQuery({
    queryKey: ["tasks", user?.id],
    queryFn: async () => {
      const params = { take: 100 };
      if (user?.id) params.assignedToId = user.id;
      const res = await fieldForceApi.listTasks(params);
      const resp = res.data;
      const data = resp?.data?.tasks || resp?.message?.tasks || resp?.tasks || [];
      return Array.isArray(data) ? data : [];
    },
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const filteredTasks = activeFilter === "ALL"
    ? tasks
    : tasks.filter((t) => t.status === activeFilter);

  const overdueTasks = tasks.filter(
    (t) => t.dueDate && t.status !== "COMPLETED" && new Date(t.dueDate) < new Date()
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-slate-200 rounded animate-pulse" />
        <TableSkeleton rows={6} cols={3} />
      </div>
    );
  }

  if (error) {
    return <ErrorState message="Failed to load tasks" onRetry={loadData} />;
  }

  const summary = {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === "PENDING").length,
    inProgress: tasks.filter((t) => t.status === "IN_PROGRESS").length,
    completed: tasks.filter((t) => t.status === "COMPLETED").length,
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <PageHeader title="My Tasks" subtitle="Manage your assigned tasks">
        <button onClick={loadData} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium hover:bg-slate-50 transition">
          <RefreshCw size={16} /> Refresh
        </button>
      </PageHeader>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl bg-slate-50 p-4 text-center">
          <p className="text-2xl font-bold text-slate-800">{summary.total}</p>
          <p className="text-xs text-slate-500 mt-1">Total</p>
        </div>
        <div className="rounded-xl bg-amber-50 p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{summary.pending}</p>
          <p className="text-xs text-slate-500 mt-1">Pending</p>
        </div>
        <div className="rounded-xl bg-blue-50 p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{summary.inProgress}</p>
          <p className="text-xs text-slate-500 mt-1">In Progress</p>
        </div>
        <div className="rounded-xl bg-emerald-50 p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">{summary.completed}</p>
          <p className="text-xs text-slate-500 mt-1">Completed</p>
        </div>
      </div>

      {/* Overdue Alert */}
      {overdueTasks.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
            <Loader2 size={20} className="text-red-600" />
          </div>
          <div>
            <p className="font-semibold text-red-800 text-sm">{overdueTasks.length} Overdue Task(s)</p>
            <p className="text-xs text-red-600">These tasks are past their due date</p>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {TASK_FILTERS.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition ${
              activeFilter === filter
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {filter === "ALL" ? "All" : filter.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {/* Task List */}
      <SectionCard title="Tasks" subtitle={`${filteredTasks.length} task(s)`} icon={Target} iconColor="text-blue-600">
        {filteredTasks.length === 0 ? (
          <EmptyDashboard title="No Tasks" description="No tasks found matching the filter" onAction={loadData} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTasks.map((task, i) => (
              <TaskCard key={task.id} task={task} index={i} />
            ))}
          </div>
        )}
      </SectionCard>
    </motion.div>
  );
}

