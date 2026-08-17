import { motion } from "framer-motion";
import { Mail, Building2, BadgeCheck, CheckCircle2, Clock, Target } from "lucide-react";

export default function ExecutiveCard({ executive, taskSummary, visitSummary, loading = false }) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm animate-pulse">
        <div className="flex gap-4">
          <div className="h-14 w-14 rounded-full bg-slate-200" />
          <div className="flex-1 space-y-3">
            <div className="h-5 w-40 bg-slate-200 rounded" />
            <div className="h-3 w-28 bg-slate-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!executive) return null;

  const fullName = `${executive.firstName || ""} ${executive.lastName || ""}`.trim();
  const completionRate = taskSummary?.completionRate || 0;

  return (
    <motion.div whileHover={{ y: -3 }} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden">
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            {fullName.charAt(0) || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900 truncate">{fullName}</h3>
              <BadgeCheck size={18} className="text-blue-500 flex-shrink-0" />
            </div>
            {executive.email && (
              <div className="flex items-center gap-1.5 mt-1 text-sm text-slate-500">
                <Mail size={14} />
                <span className="truncate">{executive.email}</span>
              </div>
            )}
            {executive.branch && (
              <div className="flex items-center gap-1.5 mt-1 text-sm text-slate-500">
                <Building2 size={14} />
                <span>{executive.branch.name}</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-slate-100">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-emerald-600">
              <CheckCircle2 size={14} />
              <span className="text-lg font-bold">{taskSummary?.completed || 0}</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Tasks Done</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-blue-600">
              <Target size={14} />
              <span className="text-lg font-bold">{visitSummary?.completed || 0}</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Visits</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-amber-600">
              <Clock size={14} />
              <span className="text-lg font-bold">{taskSummary?.pending || 0}</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Pending</p>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-slate-500">Task Completion</span>
            <span className="font-semibold text-slate-700">{completionRate}%</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${completionRate}%` }}
              transition={{ duration: 0.8 }}
              className={`h-2 rounded-full ${completionRate >= 80 ? "bg-emerald-500" : completionRate >= 50 ? "bg-blue-500" : "bg-amber-500"}`}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
