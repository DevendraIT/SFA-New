import { useMemo } from "react";
import { motion } from "framer-motion";
import { RefreshCcw, Download, ShieldCheck, Briefcase, GitBranch, Building2, Building } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function DashboardHeader({
  title,
  subtitle,
  welcomeText,
  onRefresh,
  showExport = false,
  onExport,
  actions,
  designation: propDesignation,
}) {
  const { user } = useAuth();

  const scopeBadge = useMemo(() => {
    if (!user) return null;
    const roleNames = Array.isArray(user.roles)
      ? user.roles.map((r) => (typeof r === "string" ? r : r.role?.name || r.name))
      : [user.role?.name || ""];

    const isSalesManager = roleNames.some((r) => r && r.toLowerCase().includes("sales manager"));
    const isSalesExecutive = roleNames.some((r) => r && r.toLowerCase().includes("sales executive"));
    const isHeadOfSales = roleNames.some((r) => r && r.toLowerCase().includes("head of sales"));
    const isCompanyAdmin = roleNames.some((r) => r && (r.toLowerCase() === "admin" || r.toLowerCase().includes("company admin")));
    const isSuperAdmin = roleNames.some((r) => r && r.toLowerCase().includes("super admin"));

    if (isSalesManager || isSalesExecutive) {
      const branchName = user.branch?.name || user.branchName || "Assigned Branch";
      return {
        label: "Branch",
        value: branchName,
        icon: GitBranch,
        bgClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
      };
    }

    if (isHeadOfSales || isCompanyAdmin || isSuperAdmin) {
      const orgName = user.organization?.name || user.organizationName || (isSuperAdmin ? "Super Admin Workspace" : "Company Organization");
      return {
        label: "Company / Organization",
        value: orgName,
        icon: Building2,
        bgClass: "bg-purple-50 text-purple-700 border-purple-200",
      };
    }

    // Fallback if branch or org exists
    if (user.branch?.name) {
      return { label: "Branch", value: user.branch.name, icon: GitBranch, bgClass: "bg-indigo-50 text-indigo-700 border-indigo-200" };
    }
    if (user.organization?.name) {
      return { label: "Organization", value: user.organization.name, icon: Building2, bgClass: "bg-purple-50 text-purple-700 border-purple-200" };
    }

    return null;
  }, [user]);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
      <div className="min-w-0">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {welcomeText && (
            <p className="text-xs sm:text-sm text-slate-500 font-medium">{welcomeText}</p>
          )}
          {scopeBadge && (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold border shadow-xs ${scopeBadge.bgClass}`}>
              <scopeBadge.icon size={13} className="shrink-0" />
              <span className="truncate">{scopeBadge.label}: {scopeBadge.value}</span>
            </span>
          )}
        </div>
        <h1 className="text-xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mt-1 sm:mt-1.5 tracking-tight truncate">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs sm:text-base text-slate-500 mt-0.5 sm:mt-1.5 truncate">{subtitle}</p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
        {actions}

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border border-slate-200 bg-white shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all text-xs sm:text-sm font-medium text-slate-700"
          >
            <RefreshCcw size={15} />
            <span>Refresh</span>
          </button>
        )}

        {showExport && onExport && (
          <button
            type="button"
            onClick={onExport}
            className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-blue-600 text-white shadow-sm hover:bg-blue-700 transition-all text-xs sm:text-sm font-medium"
          >
            <Download size={15} />
            <span>Export</span>
          </button>
        )}
      </div>
    </div>
  );
}

