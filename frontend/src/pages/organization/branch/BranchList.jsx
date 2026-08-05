import { useState, useMemo } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Building2,
  GitBranch,
  Eye,
  X,
  Building,
  Users,
  LayoutGrid,
  Award,
  IndianRupee,
  ShoppingCart,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { motion } from "framer-motion";

import BranchForm from "./BranchForm";
import toast from "react-hot-toast";
import branchService from "../../../services/branch.service";
import useBranches from "../../../hooks/useBranches";
import useHeadOfSalesDashboard from "../../../hooks/useHeadOfSalesDashboard";
import { useAuth } from "../../../context/AuthContext";

import DashboardHeader from "../../../components/dashboard/DashboardHeader";
import StatsGrid from "../../../components/dashboard/StatsGrid";
import StatCard from "../../../components/dashboard/StatCard";
import SectionCard from "../../../components/dashboard/SectionCard";
import ChartCard from "../../../components/dashboard/ChartCard";

export default function BranchList() {
  const { user } = useAuth();
  const isHeadOfSales = useMemo(() => {
    if (!user) return false;
    const roleNames = Array.isArray(user.roles)
      ? user.roles.map((r) => (typeof r === "string" ? r : r.role?.name || r.name))
      : [user.role?.name || ""];
    return roleNames.some((r) => r && r.toLowerCase().includes("head of sales"));
  }, [user]);

  const canManageBranch = useMemo(() => {
    if (!user) return true;
    const roleNames = Array.isArray(user.roles)
      ? user.roles.map((r) => (typeof r === "string" ? r : r.role?.name || r.name))
      : [user.role?.name || ""];
    // Super Admin oversees high-level analytics & dashboards; creation/editing of branches is for Company Admin
    return !roleNames.some((r) => r && r.toLowerCase().includes("super admin"));
  }, [user]);

  const { branches, loading, search, setSearch, reload } = useBranches({
    debounce: true,
  });

  const { dashboard } = useHeadOfSalesDashboard();

  const [showModal, setShowModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [viewBranch, setViewBranch] = useState(null);

  const handleDelete = async (branch) => {
    if (!canManageBranch) return;
    const confirmed = window.confirm(`Delete "${branch.name}" ?`);
    if (!confirmed) return;

    try {
      await branchService.deleteBranch(branch.id);
      toast.success("Branch deleted");
      reload();
    } catch (err) {
      console.log(err);
      toast.error("Unable to delete branch");
    }
  };

  const revenue = dashboard?.revenue ?? 0;
  const totalSalesOrders = dashboard?.totalSalesOrders ?? 0;

  const totalDepartmentsCount = useMemo(() => {
    return branches?.reduce((sum, b) => sum + (b._count?.departments || 0), 0) || 0;
  }, [branches]);

  const totalTeamsCount = useMemo(() => {
    return branches?.reduce((sum, b) => sum + (b._count?.teams || 0), 0) || 0;
  }, [branches]);

  const totalUsersCount = useMemo(() => {
    return branches?.reduce((sum, b) => sum + (b._count?.users || 0), 0) || 0;
  }, [branches]);

  const activeBranchesCount = useMemo(() => {
    return branches?.filter((b) => b.isActive !== false).length || 0;
  }, [branches]);

  const branchChartData = useMemo(() => {
    if (!branches || branches.length === 0) return [];
    return branches.map((b) => ({
      name: b.name,
      teams: b._count?.teams || 0,
      users: b._count?.users || 0,
    }));
  }, [branches]);

  // Head of Sales Analytics View
  if (isHeadOfSales) {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-8">
        <DashboardHeader
          title="Branch Analytics & Performance"
          subtitle="Branch-wise capacity, team strength & revenue metrics"
          onRefresh={reload}
        />

        <StatsGrid>
          <StatCard title="Total Branches" value={branches?.length || 0} icon={GitBranch} color="bg-indigo-600" />
          <StatCard title="Active Branches" value={activeBranchesCount} icon={GitBranch} color="bg-emerald-600" />

          <StatCard title="Total Teams" value={totalTeamsCount} icon={Users} color="bg-purple-600" />
          <StatCard title="Branch Employees" value={totalUsersCount} icon={Users} color="bg-cyan-500" />
          <StatCard title="Branch Revenue" value={revenue} icon={IndianRupee} color="bg-green-600" format="currency" />
        </StatsGrid>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <ChartCard title="Branch Capacity & Resource Distribution" subtitle="Departments, teams & employees per branch" className="xl:col-span-2">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={branchChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="teams" fill="#8B5CF6" radius={[6, 6, 0, 0]} name="Teams" />
                  <Bar dataKey="users" fill="#10B981" radius={[6, 6, 0, 0]} name="Users" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <SectionCard title="Branch Ranking & Overview" subtitle="Operational capacity per branch" icon={Award} iconColor="text-cyan-600">
            {branches.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center">No branches registered.</p>
            ) : (
              <div className="space-y-3">
                {branches.map((b) => (
                  <div key={b.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/70">
                    <div className="flex items-center justify-between">
                      <h5 className="font-semibold text-slate-900 text-sm">{b.name}</h5>
                      <span className="text-xs font-semibold text-indigo-600">{b.department?.name || "Department"}</span>
                    </div>
                    <div className="flex justify-between items-center mt-2 text-xs text-slate-500">
                      <span>Code: {b.code || "-"}</span>
                      <span className="font-semibold text-slate-800">{b._count?.users || 0} Staff | {b._count?.teams || 0} Teams</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        <SectionCard title="Branch Operational Insights" subtitle="Live branch directory & resource metrics" icon={GitBranch} iconColor="text-blue-600">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {branches.map((branch) => (
              <div key={branch.id} className="p-4 rounded-2xl border border-slate-200 bg-white hover:shadow-md transition space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                      <GitBranch size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-base">{branch.name}</h4>
                      <p className="text-xs text-slate-500">{branch.department?.name || "-"} / {branch.territory?.name || "-"}</p>
                    </div>
                  </div>
                  <button onClick={() => setViewBranch(branch)} className="p-2 rounded-lg border hover:bg-slate-50 text-slate-600" title="View Full Record">
                    <Eye size={16} />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-2 border-t text-xs">
                  <div>
                    <span className="text-slate-400 block">Territory</span>
                    <span className="font-bold text-slate-800 text-sm truncate max-w-[80px]" title={branch.territory?.name || "-"}>{branch.territory?.name || "-"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Teams</span>
                    <span className="font-bold text-slate-800 text-sm">{branch._count?.teams ?? 0}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Users</span>
                    <span className="font-bold text-slate-800 text-sm">{branch._count?.users ?? 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Rich Enterprise Branch View Details Modal */}
        {viewBranch && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setViewBranch(null)}
          >
            <div
              className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl bg-white shadow-2xl transition-all"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Hero Banner Header */}
              <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-6 md:p-8 relative">
                <button
                  type="button"
                  onClick={() => setViewBranch(null)}
                  className="absolute right-5 top-5 rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white transition"
                >
                  <X size={20} />
                </button>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-indigo-300">
                      <GitBranch size={32} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">Branch Details</span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Active Branch
                        </span>
                      </div>
                      <h2 className="text-2xl md:text-3xl font-bold text-white mt-1">{viewBranch.name}</h2>
                      <p className="text-sm text-indigo-200 mt-0.5">Code: {viewBranch.code || "N/A"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-indigo-200 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
                      Org: {viewBranch.organization?.name || "IT Software"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-slate-50 border-b border-slate-100">
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
                  <span className="block text-xs font-semibold text-slate-500 uppercase">Department</span>
                  <span className="block text-base font-bold text-slate-800 mt-1 truncate">{viewBranch.department?.name || "-"}</span>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
                  <span className="block text-xs font-semibold text-slate-500 uppercase">Territory</span>
                  <span className="block text-base font-bold text-slate-800 mt-1 truncate">{viewBranch.territory?.name || "-"}</span>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
                  <span className="block text-xs font-semibold text-slate-500 uppercase">Active Teams</span>
                  <span className="block text-base font-bold text-indigo-600 mt-1">{viewBranch._count?.teams ?? viewBranch.teams?.length ?? 0} Teams</span>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
                  <span className="block text-xs font-semibold text-slate-500 uppercase">Total Staff</span>
                  <span className="block text-base font-bold text-emerald-600 mt-1">{viewBranch._count?.users ?? viewBranch.users?.length ?? 0} Employees</span>
                </div>
              </div>

              {/* Scrollable Main Content */}
              <div className="p-6 md:p-8 space-y-6 max-h-[55vh] overflow-y-auto">
                {/* General Info */}
                <div>
                  <h3 className="text-base font-semibold text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    General Branch Attributes
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-sm">
                    <div>
                      <span className="block text-xs font-semibold text-slate-400 uppercase">Branch ID</span>
                      <span className="font-mono text-xs text-slate-700 bg-slate-100 px-2 py-1 rounded inline-block mt-1">{viewBranch.id}</span>
                    </div>
                    <div>
                      <span className="block text-xs font-semibold text-slate-400 uppercase">Branch Code</span>
                      <span className="font-semibold text-slate-800 mt-1 block">{viewBranch.code || "-"}</span>
                    </div>
                    <div>
                      <span className="block text-xs font-semibold text-slate-400 uppercase">Parent Organization</span>
                      <span className="font-semibold text-slate-800 mt-1 block">{viewBranch.organization?.name || "-"}</span>
                    </div>
                  </div>
                </div>

                {/* Location & Contact Info */}
                <div>
                  <h3 className="text-base font-semibold text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-indigo-600" />
                    Contact & Address Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 text-sm">
                    <div>
                      <span className="block text-xs font-semibold text-slate-400 uppercase">Email</span>
                      <span className="font-medium text-slate-800 mt-1 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        {viewBranch.email || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="block text-xs font-semibold text-slate-400 uppercase">Phone</span>
                      <span className="font-medium text-slate-800 mt-1 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {viewBranch.phone || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="block text-xs font-semibold text-slate-400 uppercase">City / State</span>
                      <span className="font-medium text-slate-800 mt-1 block">
                        {[viewBranch.city, viewBranch.state].filter(Boolean).join(", ") || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="block text-xs font-semibold text-slate-400 uppercase">Postal Code</span>
                      <span className="font-medium text-slate-800 mt-1 block">{viewBranch.postalCode || "N/A"}</span>
                    </div>
                    <div className="md:col-span-2 lg:col-span-4">
                      <span className="block text-xs font-semibold text-slate-400 uppercase">Street Address</span>
                      <span className="font-medium text-slate-800 mt-1 block">{viewBranch.address || "N/A"}</span>
                    </div>
                  </div>
                </div>

                {/* Assigned Teams */}
                {viewBranch.teams?.length > 0 && (
                  <div>
                    <h3 className="text-base font-semibold text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
                      <Users className="w-4 h-4 text-indigo-600" />
                      Assigned Teams ({viewBranch.teams.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {viewBranch.teams.map((t) => (
                        <div key={t.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
                          <div>
                            <span className="font-semibold text-slate-800 text-sm">{t.name}</span>
                            {t.description && <p className="text-xs text-slate-500 mt-0.5">{t.description}</p>}
                          </div>
                          <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                            {t._count?.users ?? 0} Members
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Assigned Staff */}
                {viewBranch.users?.length > 0 && (
                  <div>
                    <h3 className="text-base font-semibold text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
                      <Users className="w-4 h-4 text-indigo-600" />
                      Branch Staff Members ({viewBranch.users.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {viewBranch.users.map((u) => (
                        <div key={u.id} className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between shadow-xs">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                              {u.firstName?.[0]}{u.lastName?.[0]}
                            </div>
                            <div>
                              <span className="font-semibold text-slate-800 text-sm">{u.firstName} {u.lastName}</span>
                              <span className="block text-xs text-slate-500">{u.email}</span>
                            </div>
                          </div>
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {u.roles?.[0]?.role?.name || "Staff"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex justify-end">
                <button
                  type="button"
                  onClick={() => setViewBranch(null)}
                  className="px-6 py-2.5 rounded-xl bg-slate-800 text-white font-medium text-sm hover:bg-slate-900 transition"
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    );
  }

  // Regular Management View for other roles
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            Branch Management
          </h1>
          <p className="text-slate-500 mt-1">
            Manage branches inside your organization.
          </p>
        </div>

        {canManageBranch && (
          <button
            onClick={() => {
              setSelectedBranch(null);
              setShowModal(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-white hover:bg-indigo-700 transition"
          >
            <Plus size={18} />
            Create Branch
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={18} className="absolute left-4 top-3.5 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by branch name..."
          className="w-full rounded-xl border border-slate-300 py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border bg-white">
        <table className="w-full">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-6 py-4 text-left">Branch</th>
              <th className="px-6 py-4 text-left">Code</th>
              <th className="px-6 py-4 text-left">Department</th>
              <th className="px-6 py-4 text-left">Territory</th>
              <th className="px-6 py-4 text-center">Teams</th>
              <th className="px-6 py-4 text-center">Users</th>
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="py-16 text-center text-slate-500">
                  Loading branches...
                </td>
              </tr>
            ) : branches.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="flex flex-col items-center justify-center py-16">
                    <GitBranch size={60} className="text-slate-300" />
                    <h3 className="mt-5 text-xl font-semibold text-slate-700">
                      No Branches Found
                    </h3>
                    <p className="mt-2 text-slate-500">
                      Create your first branch to get started.
                    </p>
                    {canManageBranch && (
                      <button
                        onClick={() => setShowModal(true)}
                        className="mt-6 rounded-xl bg-indigo-600 px-6 py-3 text-white hover:bg-indigo-700"
                      >
                        Create Branch
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              branches.map((branch) => (
                <tr key={branch.id} className="border-t hover:bg-slate-50 transition">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-indigo-50 p-2">
                        <GitBranch size={18} className="text-indigo-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-800">{branch.name}</h4>
                        <p className="text-sm text-slate-500">
                          Created {branch.createdAt ? new Date(branch.createdAt).toLocaleDateString() : "-"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-slate-600">{branch.code || "-"}</td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <LayoutGrid size={15} className="text-slate-400" />
                      <span className="text-slate-700">{branch.department?.name || "-"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-slate-700">{branch.territory?.name || "-"}</span>
                  </td>
                  <td className="px-6 py-5 text-center">{branch._count?.teams ?? 0}</td>
                  <td className="px-6 py-5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Users size={15} className="text-slate-400" />
                      <span>{branch._count?.users ?? 0}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => setViewBranch(branch)} className="rounded-lg border p-2 hover:bg-slate-100" title="View">
                        <Eye size={17} />
                      </button>
                      {canManageBranch && (
                        <>
                          <button onClick={() => { setSelectedBranch(branch); setShowModal(true); }} className="rounded-lg border p-2 hover:bg-slate-100" title="Edit">
                            <Pencil size={17} />
                          </button>
                          <button onClick={() => handleDelete(branch)} className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50" title="Delete">
                            <Trash2 size={17} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Total Branches : <span className="ml-2 font-semibold text-slate-800">{branches?.length || 0}</span>
        </p>
      </div>

      {/* Statistics */}
      <div className="grid gap-5 md:grid-cols-3">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h4 className="text-sm text-slate-500">Total Branches</h4>
          <h2 className="mt-2 text-3xl font-bold">{branches?.length || 0}</h2>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h4 className="text-sm text-slate-500">Total Users</h4>
          <h2 className="mt-2 text-3xl font-bold">{totalUsersCount}</h2>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl">
            <button type="button" onClick={() => { setShowModal(false); setSelectedBranch(null); }} className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
              <X size={22} />
            </button>
            <h2 className="mb-6 text-2xl font-bold">{selectedBranch ? "Edit Branch" : "Create Branch"}</h2>
            <BranchForm branch={selectedBranch} onClose={() => { setShowModal(false); setSelectedBranch(null); }} onSuccess={reload} />
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewBranch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setViewBranch(null)}>
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setViewBranch(null)} className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
              <X size={22} />
            </button>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">{viewBranch.name}</h2>
            <div className="space-y-3 text-sm text-slate-700">
              <p><strong>Code:</strong> {viewBranch.code || "-"}</p>
              <p><strong>Organization:</strong> {viewBranch.organization?.name || "-"}</p>
              <p><strong>Email:</strong> {viewBranch.email || "-"}</p>
              <p><strong>Phone:</strong> {viewBranch.phone || "-"}</p>
              <p><strong>Department:</strong> {viewBranch.department?.name || "-"}</p>
              <p><strong>Territory:</strong> {viewBranch.territory?.name || "-"}</p>
              <p><strong>Teams:</strong> {viewBranch._count?.teams ?? 0}</p>
              <p><strong>Users:</strong> {viewBranch._count?.users ?? 0}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
