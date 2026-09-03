import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import dayjs from "dayjs";
import { ClipboardCheck, RefreshCw, Plus, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

import { useAuth } from "../../context/AuthContext";
import fieldForceApi from "../../api/fieldForce.api";
import PageHeader from "../../components/dashboard/PageHeader";
import SectionCard from "../../components/dashboard/SectionCard";
import VisitCard from "../../components/field-force/VisitCard";
import StatusBadge from "../../components/field-force/StatusBadge";
import EmptyDashboard from "../../components/dashboard/EmptyDashboard";
import ErrorState from "../../components/dashboard/ErrorState";
import { TableSkeleton } from "../../components/dashboard/LoadingSkeleton";

const VISIT_FILTERS = ["ALL", "PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

export default function VisitsPage() {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [startLoading, setStartLoading] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    type: "MEETING",
    scheduledAt: dayjs().add(1, "hour").format("YYYY-MM-DDTHH:mm"),
    notes: "",
  });

  const {
    data: visits = [],
    isLoading: loading,
    error,
    refetch: loadData,
  } = useQuery({
    queryKey: ["visits"],
    queryFn: async () => {
      const res = await fieldForceApi.listVisits({ take: 100 });
      const data = res.data?.data || res.data;
      return data?.visits || data || [];
    },
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setCreating(true);
      await fieldForceApi.planVisit({
        ...formData,
        scheduledAt: new Date(formData.scheduledAt).toISOString(),
      });
      toast.success("Visit planned successfully!");
      setShowCreateForm(false);
      setFormData({ title: "", type: "MEETING", scheduledAt: dayjs().add(1, "hour").format("YYYY-MM-DDTHH:mm"), notes: "" });
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create visit");
    } finally {
      setCreating(false);
    }
  };

  const handleStartVisit = async (visitId) => {
    try {
      setStartLoading(visitId);
      await fieldForceApi.startVisit(visitId);
      toast.success("Visit started!");
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to start visit");
    } finally {
      setStartLoading(null);
    }
  };

  const handleCompleteVisit = async (visitId) => {
    try {
      setStartLoading(visitId);
      await fieldForceApi.completeVisit(visitId, { notes: "Visit completed" });
      toast.success("Visit completed!");
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to complete visit");
    } finally {
      setStartLoading(null);
    }
  };

  const filteredVisits = activeFilter === "ALL"
    ? visits
    : visits.filter((v) => v.status === activeFilter);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-slate-200 rounded animate-pulse" />
        <TableSkeleton rows={5} cols={3} />
      </div>
    );
  }

  if (error) {
    return <ErrorState message="Failed to load visits" onRetry={loadData} />;
  }

  const summary = {
    total: visits.length,
    completed: visits.filter((v) => v.status === "COMPLETED").length,
    planned: visits.filter((v) => v.status === "PLANNED").length,
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <PageHeader title="Customer Visits" subtitle="Plan and manage your field visits">
        <div className="flex gap-3">
          <button onClick={() => setShowCreateForm(!showCreateForm)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition">
            <Plus size={16} /> {showCreateForm ? "Cancel" : "Plan Visit"}
          </button>
          <button onClick={loadData} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium hover:bg-slate-50 transition">
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </PageHeader>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl bg-slate-50 p-4 text-center">
          <p className="text-2xl font-bold text-slate-800">{summary.total}</p>
          <p className="text-xs text-slate-500 mt-1">Total Visits</p>
        </div>
        <div className="rounded-xl bg-emerald-50 p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">{summary.completed}</p>
          <p className="text-xs text-slate-500 mt-1">Completed</p>
        </div>
        <div className="rounded-xl bg-blue-50 p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{summary.planned}</p>
          <p className="text-xs text-slate-500 mt-1">Planned</p>
        </div>
      </div>

      {/* Create Visit Form */}
      {showCreateForm && (
        <SectionCard title="Plan New Visit" icon={ClipboardCheck} iconColor="text-blue-600">
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
              <input
                type="text" required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="e.g., Follow-up with ABC Corp"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="COLD_CALL">Cold Call</option>
                  <option value="FOLLOW_UP">Follow Up</option>
                  <option value="MEETING">Meeting</option>
                  <option value="DEMO">Demo</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Scheduled At *</label>
                <input
                  type="datetime-local" required
                  value={formData.scheduledAt}
                  onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 text-sm"
                rows={3}
                placeholder="Optional notes for the visit"
              />
            </div>
            <button
              type="submit"
              disabled={creating}
              className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 transition disabled:opacity-50"
            >
              {creating ? "Creating..." : "Create Visit"}
            </button>
          </form>
        </SectionCard>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {VISIT_FILTERS.map((filter) => (
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

      {/* Visits List */}
      <SectionCard title="Visits" subtitle={`${filteredVisits.length} visit(s)`} icon={ClipboardCheck} iconColor="text-blue-600">
        {filteredVisits.length === 0 ? (
          <EmptyDashboard title="No Visits" description="No visits found" onAction={loadData} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVisits.map((visit, i) => (
              <div key={visit.id} className="relative">
                <VisitCard visit={visit} index={i} />
                {(visit.status === "PLANNED" || visit.status === "IN_PROGRESS") && (
                  <div className="mt-2 flex gap-2">
                    {visit.status === "PLANNED" && (
                      <button
                        onClick={() => handleStartVisit(visit.id)}
                        disabled={startLoading === visit.id}
                        className="flex-1 px-3 py-2 rounded-xl bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition disabled:opacity-50"
                      >
                        {startLoading === visit.id ? "Starting..." : "Start Visit"}
                      </button>
                    )}
                    {visit.status === "IN_PROGRESS" && (
                      <button
                        onClick={() => handleCompleteVisit(visit.id)}
                        disabled={startLoading === visit.id}
                        className="flex-1 px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 transition disabled:opacity-50"
                      >
                        {startLoading === visit.id ? "Completing..." : "Complete Visit"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </motion.div>
  );
}

