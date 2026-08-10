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
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
      <div>
        <div className="flex items-center gap-3 flex-wrap">
          {welcomeText && (
            <p className="text-sm text-slate-500 font-medium">{welcomeText}</p>
          )}
          {scopeBadge && (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-xs ${scopeBadge.bgClass}`}>
              <scopeBadge.icon size={13} />
              {scopeBadge.label}: {scopeBadge.value}
            </span>
          )}
        </div>
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

