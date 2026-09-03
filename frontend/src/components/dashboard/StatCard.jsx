import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function StatCard({
  title,
  value,
  icon: Icon,
  color = "bg-blue-500",
  trend,
  trendLabel = "this month",
  format,
  loading = false,
}) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="flex justify-between">
            <div className="space-y-3">
              <div className="h-3 w-20 bg-slate-200 rounded" />
              <div className="h-8 w-24 bg-slate-200 rounded" />
            </div>
            <div className="h-14 w-14 bg-slate-200 rounded-xl" />
          </div>
          <div className="h-4 w-32 bg-slate-200 rounded" />
        </div>
      </div>
    );
  }

  const displayValue =
    format === "currency"
      ? `₹${Number(value).toLocaleString("en-IN")}`
      : format === "percentage"
      ? `${value}%`
      : value ?? 0;

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm hover:shadow-md transition-all duration-300"
    >
      <div className="flex justify-between items-start">
        <div className="space-y-1.5 sm:space-y-3 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-slate-500 truncate">{title}</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight truncate">
            {displayValue}
          </h2>

          {trend !== undefined && (
            <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
              {trend >= 0 ? (
                <ArrowUpRight size={16} className="text-emerald-500 shrink-0" />
              ) : (
                <ArrowDownRight size={16} className="text-red-500 shrink-0" />
              )}
              <span
                className={`text-xs sm:text-sm font-semibold ${
                  trend >= 0 ? "text-emerald-600" : "text-red-500"
                }`}
              >
                {trend >= 0 ? "+" : ""}
                {trend}%
              </span>
              <span className="text-[10px] sm:text-xs text-slate-400 truncate">{trendLabel}</span>
            </div>
          )}
        </div>

        <div
          className={`h-11 w-11 sm:h-14 sm:w-14 rounded-xl ${color} flex items-center justify-center text-white shadow-sm shrink-0 ml-3`}
        >
          {Icon && <Icon size={24} className="sm:w-7 sm:h-7" />}
        </div>
      </div>
    </motion.div>
  );
}

