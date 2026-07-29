import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Filter, Target, TrendingUp, AlertTriangle, CheckCircle2, User, ChevronDown } from "lucide-react";

const statusBadges = {
  EXCELLENT: "bg-emerald-100 text-emerald-800 border-emerald-300",
  ON_TRACK: "bg-blue-100 text-blue-800 border-blue-300",
  NEEDS_ATTENTION: "bg-amber-100 text-amber-800 border-amber-300",
  AT_RISK: "bg-red-100 text-red-800 border-red-300",
};

export default function OrgPerformanceTable({
  data = [],
  title = "Organization Target & Performance Overview",
  subtitle = "Aggregated target achievement metrics across all organizational hierarchy roles",
}) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  const rolesList = useMemo(() => {
    const set = new Set();
    data.forEach((item) => {
      if (item.role) set.add(item.role);
    });
    return Array.from(set);
  }, [data]);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchesSearch =
        !search ||
        item.employeeName?.toLowerCase().includes(search.toLowerCase()) ||
        item.role?.toLowerCase().includes(search.toLowerCase()) ||
        item.email?.toLowerCase().includes(search.toLowerCase());

      const matchesRole = roleFilter === "ALL" || item.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [data, search, roleFilter]);

  const totals = useMemo(() => {
    const totalTarget = filteredData.reduce((sum, d) => sum + Number(d.assignedTarget || 0), 0);
    const totalAchieved = filteredData.reduce((sum, d) => sum + Number(d.achievedSales || 0), 0);
    const avgPercentage = totalTarget > 0 ? Math.round((totalAchieved / totalTarget) * 100) : 0;
    const pendingTarget = Math.max(0, totalTarget - totalAchieved);

    return { totalTarget, totalAchieved, avgPercentage, pendingTarget };
  }, [filteredData]);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200">
          <p className="text-xs font-semibold uppercase text-indigo-700">Total Assigned Target</p>
          <p className="text-2xl font-black text-indigo-950 mt-1">₹{totals.totalTarget.toLocaleString("en-IN")}</p>
        </div>
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
          <p className="text-xs font-semibold uppercase text-emerald-700">Total Achieved Sales</p>
          <p className="text-2xl font-black text-emerald-950 mt-1">₹{totals.totalAchieved.toLocaleString("en-IN")}</p>
        </div>
        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
          <p className="text-xs font-semibold uppercase text-blue-700">Avg Achievement %</p>
          <p className="text-2xl font-black text-blue-950 mt-1">{totals.avgPercentage}%</p>
        </div>
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
          <p className="text-xs font-semibold uppercase text-amber-700">Pending Target</p>
          <p className="text-2xl font-black text-amber-950 mt-1">₹{totals.pendingTarget.toLocaleString("en-IN")}</p>
        </div>
      </div>

      {/* Header & Filter Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search employee..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition w-44 sm:w-56"
              />
            </div>

            {/* Role Filter */}
            <div className="relative">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="appearance-none bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 py-2 pl-3 pr-8 rounded-xl outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="ALL">All Roles ({rolesList.length})</option>
                {rolesList.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Data Table */}
        {filteredData.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">No target & performance records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Employee Name</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4 text-right">Assigned Target</th>
                  <th className="py-3 px-4 text-right">Achieved Sales</th>
                  <th className="py-3 px-4 text-center">Achievement %</th>
                  <th className="py-3 px-4 text-right">Pending Target</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredData.map((row) => (
                  <tr key={row.id || row.email} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                          {row.employeeName?.[0] || "U"}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{row.employeeName}</p>
                          {row.email && <p className="text-[11px] text-slate-400 font-normal">{row.email}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 font-semibold text-slate-700 border border-slate-200">
                        {row.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-800">
                      ₹{Number(row.assignedTarget || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-600">
                      ₹{Number(row.achievedSales || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              row.achievementPercentage >= 100
                                ? "bg-emerald-500"
                                : row.achievementPercentage >= 75
                                ? "bg-blue-500"
                                : row.achievementPercentage >= 50
                                ? "bg-amber-500"
                                : "bg-red-500"
                            }`}
                            style={{ width: `${Math.min(100, row.achievementPercentage)}%` }}
                          />
                        </div>
                        <span className="font-extrabold text-slate-900">{row.achievementPercentage}%</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-600">
                      ₹{Number(row.pendingTarget || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full font-bold border text-[10px] uppercase ${
                          statusBadges[row.performanceStatus] || "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {row.performanceStatus?.replace("_", " ") || "ACTIVE"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
