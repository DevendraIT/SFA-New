import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  Activity,
  RefreshCw,
  CheckCircle2,
  Clock,
  MapPin,
  Camera,
  PenTool,
  IndianRupee,
  Truck,
  Navigation,
  CheckSquare,
  AlertCircle,
  FileText
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import fieldForceApi from "../../api/fieldForce.api";
import PageHeader from "../../components/dashboard/PageHeader";
import EmptyDashboard from "../../components/dashboard/EmptyDashboard";
import ErrorState from "../../components/dashboard/ErrorState";
import { TableSkeleton } from "../../components/dashboard/LoadingSkeleton";

dayjs.extend(relativeTime);

const formatStatusName = (status) => {
  switch (status) {
    case "COMPLETED":
      return "Completed Task";
    case "CHECKED_IN":
      return "Checked In at Location";
    case "CHECKED_OUT":
      return "Checked Out from Location";
    case "PHOTO_UPLOADED":
      return "Uploaded Proof Photo";
    case "SIGNATURE_CAPTURED":
      return "Captured Customer Signature";
    case "PAYMENT_COLLECTED":
      return "Collected Payment";
    case "DELIVERY_IN_PROGRESS":
      return "Started Delivery";
    case "IN_PROGRESS":
      return "Started Task Execution";
    case "NAVIGATING":
      return "Navigating to Location";
    case "ACCEPTED":
      return "Accepted Task";
    case "ASSIGNED":
      return "Task Assigned";
    case "PENDING":
      return "Task Created";
    default:
      return status ? status.replace(/_/g, " ") : "Task Action";
  }
};

const getActivityVisuals = (status) => {
  switch (status) {
    case "COMPLETED":
      return { icon: CheckCircle2, bg: "bg-emerald-50 border-emerald-200", iconColor: "text-emerald-600", badgeBg: "bg-emerald-100 text-emerald-800" };
    case "CHECKED_IN":
      return { icon: MapPin, bg: "bg-indigo-50 border-indigo-200", iconColor: "text-indigo-600", badgeBg: "bg-indigo-100 text-indigo-800" };
    case "CHECKED_OUT":
      return { icon: Clock, bg: "bg-amber-50 border-amber-200", iconColor: "text-amber-600", badgeBg: "bg-amber-100 text-amber-800" };
    case "PHOTO_UPLOADED":
      return { icon: Camera, bg: "bg-purple-50 border-purple-200", iconColor: "text-purple-600", badgeBg: "bg-purple-100 text-purple-800" };
    case "SIGNATURE_CAPTURED":
      return { icon: PenTool, bg: "bg-teal-50 border-teal-200", iconColor: "text-teal-600", badgeBg: "bg-teal-100 text-teal-800" };
    case "PAYMENT_COLLECTED":
      return { icon: IndianRupee, bg: "bg-green-50 border-green-200", iconColor: "text-green-600", badgeBg: "bg-green-100 text-green-800" };
    case "DELIVERY_IN_PROGRESS":
      return { icon: Truck, bg: "bg-blue-50 border-blue-200", iconColor: "text-blue-600", badgeBg: "bg-blue-100 text-blue-800" };
    case "IN_PROGRESS":
    case "NAVIGATING":
      return { icon: Navigation, bg: "bg-sky-50 border-sky-200", iconColor: "text-sky-600", badgeBg: "bg-sky-100 text-sky-800" };
    case "ACCEPTED":
    case "ASSIGNED":
    case "PENDING":
      return { icon: CheckSquare, bg: "bg-slate-50 border-slate-200", iconColor: "text-slate-600", badgeBg: "bg-slate-100 text-slate-700" };
    default:
      return { icon: Activity, bg: "bg-blue-50 border-blue-200", iconColor: "text-blue-600", badgeBg: "bg-blue-100 text-blue-800" };
  }
};

export default function ActivitiesPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const taskParams = { take: 100 };
      const visitParams = { take: 100 };
      if (user?.id) {
        taskParams.assignedToId = user.id;
        visitParams.userId = user.id;
      }

      const [tasksRes, visitsRes] = await Promise.allSettled([
        fieldForceApi.listTasks(taskParams),
        fieldForceApi.listVisits(visitParams),
      ]);

      if (tasksRes.status === "fulfilled") {
        const resp = tasksRes.value.data;
        const taskList = resp?.data?.tasks || resp?.tasks || resp?.data || [];
        // Strictly filter to ensure only tasks assigned to this logged-in executive
        const filteredTasks = Array.isArray(taskList)
          ? taskList.filter((t) => !user?.id || t.assignedToId === user.id || t.assignedTo?.id === user.id)
          : [];
        setTasks(filteredTasks);
      } else {
        setTasks([]);
      }

      if (visitsRes.status === "fulfilled") {
        const resp = visitsRes.value.data;
        const visitList = resp?.data?.visits || resp?.visits || resp?.data || [];
        // Strictly filter visits to this logged-in executive
        const filteredVisits = Array.isArray(visitList)
          ? visitList.filter((v) => !user?.id || v.userId === user.id || v.user?.id === user.id)
          : [];
        setVisits(filteredVisits);
      } else {
        setVisits([]);
      }
    } catch (err) {
      setError(err?.response?.data || err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Generate granular, chronological activity stream of what this executive has done
  const activities = useMemo(() => {
    const list = [];

    // 1. Map Task Execution Steps and Task Events
    tasks.forEach((t) => {
      const hasHistory = Array.isArray(t.executionHistory) && t.executionHistory.length > 0;
      let hasCompletedInHistory = false;

      if (hasHistory) {
        t.executionHistory.forEach((h, idx) => {
          if (h.status === "COMPLETED") hasCompletedInHistory = true;

          list.push({
            id: `task-${t.id}-step-${idx}-${h.status}`,
            action: formatStatusName(h.status),
            title: t.title,
            notes: h.notes || (h.status === "PAYMENT_COLLECTED" && t.paymentAmount ? `Collected Amount: ₹${Number(t.paymentAmount).toLocaleString("en-IN")}` : null),
            timestamp: h.timestamp || t.updatedAt || t.createdAt,
            status: h.status,
            completed: h.status === "COMPLETED",
          });
        });
      }

      // If task is completed and not recorded in history steps, add completion event
      if (t.status === "COMPLETED" && !hasCompletedInHistory) {
        list.push({
          id: `task-${t.id}-completed`,
          action: "Completed Task",
          title: t.title,
          notes: t.completionNotes || null,
          timestamp: t.completedAt || t.updatedAt || t.createdAt,
          status: "COMPLETED",
          completed: true,
        });
      }

      // If task had no execution history steps, show its current task status activity
      if (!hasHistory && t.status !== "COMPLETED") {
        list.push({
          id: `task-${t.id}-current`,
          action: formatStatusName(t.status),
          title: t.title,
          notes: t.description || null,
          timestamp: t.updatedAt || t.createdAt,
          status: t.status,
          completed: false,
        });
      }
    });

    // 2. Map Visits
    visits.forEach((v) => {
      list.push({
        id: `visit-${v.id}`,
        action: v.status === "COMPLETED" ? "Visit Completed" : v.status === "IN_PROGRESS" ? "Visit In Progress" : "Visit Scheduled",
        title: v.title,
        notes: v.notes || (v.customer?.name ? `Customer: ${v.customer.name}` : null),
        timestamp: v.completedAt || v.scheduledAt || v.createdAt,
        status: v.status,
        completed: v.status === "COMPLETED",
      });
    });

    // Sort descending: latest activities first
    return list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [tasks, visits]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-slate-200 rounded animate-pulse" />
        <TableSkeleton rows={6} cols={2} />
      </div>
    );
  }

  if (error) {
    return <ErrorState message="Failed to load activities" onRetry={loadData} />;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="space-y-6 pb-12">
      <PageHeader
        title="Activities"
        subtitle="Real-time activity stream of all your tasks, executions, and field actions"
      >
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </PageHeader>

      {/* Activities Only - No summary cards or extraneous widgets */}
      {activities.length === 0 ? (
        <EmptyDashboard
          title="No Activities Recorded Yet"
          description="You don't have any field activities recorded yet. When you receive and execute tasks, your activity stream will appear here."
          onAction={loadData}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                <Activity size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Your Activity Stream</h3>
                <p className="text-xs text-slate-500">Live timeline of actions performed by you</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
              {activities.length} {activities.length === 1 ? "Activity" : "Activities"}
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {activities.map((item, index) => {
              const visuals = getActivityVisuals(item.status);
              const VisualIcon = visuals.icon;
              const formattedTime = dayjs(item.timestamp).format("MMM D, YYYY • h:mm A");
              const timeAgo = dayjs(item.timestamp).fromNow();

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(index * 0.03, 0.3) }}
                  className="px-6 py-4 flex items-start justify-between gap-4 hover:bg-slate-50/70 transition"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div
                      className={`h-10 w-10 rounded-xl border flex items-center justify-center flex-shrink-0 mt-0.5 ${visuals.bg}`}
                    >
                      <VisualIcon size={18} className={visuals.iconColor} />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-900 text-sm">{item.action}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-sm font-medium text-slate-700 truncate">{item.title}</span>
                      </div>

                      {item.notes && (
                        <p className="text-xs text-slate-500 mt-1 bg-slate-50 px-2.5 py-1 rounded-md inline-block border border-slate-100">
                          {item.notes}
                        </p>
                      )}

                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                        <span>{formattedTime}</span>
                        <span>•</span>
                        <span>{timeAgo}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex-shrink-0 flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase ${visuals.badgeBg}`}
                    >
                      {item.status?.replace(/_/g, " ")}
                    </span>
                    {item.completed && (
                      <CheckCircle2 size={16} className="text-emerald-500" />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}
