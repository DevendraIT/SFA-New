import { motion } from "framer-motion";
import { RefreshCcw, Download } from "lucide-react";

export default function DashboardHeader({
  title,
  subtitle,
  welcomeText,
  onRefresh,
  showExport = false,
  onExport,
  actions,
}) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
      <div>
        {welcomeText && (
          <p className="text-sm text-slate-500 font-medium">{welcomeText}</p>
        )}
        <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mt-1.5 tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-slate-500 mt-1.5 text-base">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        {actions}

        {onRefresh && (
          <button
            onClick={onRefresh}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all text-sm font-medium text-slate-700"
          >
            <RefreshCcw size={16} />
            Refresh
          </button>
        )}

        {showExport && onExport && (
          <button
            onClick={onExport}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white shadow-sm hover:bg-blue-700 transition-all text-sm font-medium"
          >
            <Download size={16} />
            Export
          </button>
        )}
      </div>
    </div>
  );
}

