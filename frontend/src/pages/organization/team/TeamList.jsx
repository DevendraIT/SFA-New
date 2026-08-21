import { useState, useMemo } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Eye,
  X,
  Building,
  GitBranch,
  Users,
  LayoutGrid,
  UsersRound,
  MapPin,
  ShoppingCart,
  CheckCircle,
  Award,
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

import TeamForm from "./TeamForm";
import toast from "react-hot-toast";
import teamService from "../../../services/team.service";
import useTeams from "../../../hooks/useTeams";
import useHeadOfSalesDashboard from "../../../hooks/useHeadOfSalesDashboard";
import { useAuth } from "../../../context/AuthContext";

import DashboardHeader from "../../../components/dashboard/DashboardHeader";
import StatsGrid from "../../../components/dashboard/StatsGrid";
import StatCard from "../../../components/dashboard/StatCard";
import SectionCard from "../../../components/dashboard/SectionCard";
import ChartCard from "../../../components/dashboard/ChartCard";

export default function TeamList() {
  const { user } = useAuth();
  const isHeadOfSales = useMemo(() => {
    if (!user) return false;
    const roleNames = Array.isArray(user.roles)
      ? user.roles.map((r) => (typeof r === "string" ? r : r.role?.name || r.name))
      : [user.role?.name || ""];
    return roleNames.some((r) => r && r.toLowerCase().includes("head of sales"));
  }, [user]);

  const canManageTeam = useMemo(() => {
    if (!user) return true;
    const roleNames = Array.isArray(user.roles)
      ? user.roles.map((r) => (typeof r === "string" ? r : r.role?.name || r.name))
      : [user.role?.name || ""];
    return !roleNames.some((r) => r && r.toLowerCase().includes("super admin"));
  }, [user]);

  const { teams, loading, search, setSearch, reload } = useTeams({
    debounce: true,
  });

  const { dashboard } = useHeadOfSalesDashboard({ enabled: isHeadOfSales });

  const [showModal, setShowModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [viewTeam, setViewTeam] = useState(null);

  const handleDelete = async (team) => {
    if (!canManageTeam) return;
    const confirmed = window.confirm(`Delete "${team.name}" ?`);
    if (!confirmed) return;

    try {
      await teamService.deleteTeam(team.id);
      toast.success("Team deleted");
      reload();
    } catch (err) {
      console.log(err);
      toast.error("Unable to delete team");
    }
  };

  const todayVisits = dashboard?.todayVisits ?? 0;
  const totalCustomers = dashboard?.totalCustomers ?? 0;
  const approvedOrders = dashboard?.approvedOrders ?? 0;

  const totalMembersCount = useMemo(() => {
    return teams?.reduce((sum, t) => sum + (t._count?.users || t.memberCount || 0), 0) || 0;
  }, [teams]);

  const totalLeadsCount = useMemo(() => {
    return teams?.filter((t) => t.leader || t.leadName).length || 0;
  }, [teams]);

  const teamChartData = useMemo(() => {
    if (!teams || teams.length === 0) return [];
    return teams.map((t) => ({
      name: t.name,
      members: t._count?.users || t.memberCount || 0,
    }));
  }, [teams]);

  // Head of Sales Analytics View
  if (isHeadOfSales) {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-8">
        <DashboardHeader
          title="Team Analytics & Performance"
          subtitle="Sales team performance, team lead assignments & member allocations"
          onRefresh={reload}
        />

        <StatsGrid>
          <StatCard title="Total Sales Teams" value={teams?.length || 0} icon={UsersRound} color="bg-indigo-600" />
          <StatCard title="Active Team Leads" value={totalLeadsCount} icon={Award} color="bg-emerald-600" />
          <StatCard title="Total Team Members" value={totalMembersCount} icon={Users} color="bg-blue-600" />
          <StatCard title="Today's Field Visits" value={todayVisits} icon={MapPin} color="bg-purple-600" />
          <StatCard title="Assigned Customers" value={totalCustomers} icon={CheckCircle} color="bg-cyan-500" />
          <StatCard title="Approved Sales Orders" value={approvedOrders} icon={ShoppingCart} color="bg-green-600" />
        </StatsGrid>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <ChartCard title="Team Member Capacity & Strength" subtitle="Member allocations per team" className="xl:col-span-2">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={teamChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="members" fill="#8B5CF6" radius={[6, 6, 0, 0]} name="Members" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <SectionCard title="Team Leaders Overview" subtitle="Assigned team leads & member counts" icon={Award} iconColor="text-indigo-600">
            {teams.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center">No teams registered.</p>
            ) : (
              <div className="space-y-3">
                {teams.map((t) => (
                  <div key={t.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/70">
                    <div className="flex items-center justify-between">
                      <h5 className="font-semibold text-slate-900 text-sm">{t.name}</h5>
                      <span className="px-2.5 py-0.5 rounded-lg bg-purple-50 text-purple-700 text-xs font-semibold">
                        {t._count?.users || t.memberCount || 0} Members
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      Leader: <span className="font-semibold text-slate-800">{t.leader ? `${t.leader.firstName ?? ''} ${t.leader.lastName ?? ''}`.trim() : t.leadName || "Unassigned"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        <SectionCard title="Team Directory & Hierarchy" subtitle="Live team records & branch assignments" icon={UsersRound} iconColor="text-purple-600">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((team) => (
              <div key={team.id} className="p-4 rounded-2xl border border-slate-200 bg-white hover:shadow-md transition space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
                      <UsersRound size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-base">{team.name}</h4>
                      <p className="text-xs text-slate-500">{team.branch?.name || "-"} ({team.department?.name || "-"})</p>
                    </div>
                  </div>
                  <button onClick={() => setViewTeam(team)} className="p-2 rounded-lg border hover:bg-slate-50 text-slate-600" title="View Full Record">
                    <Eye size={16} />
                  </button>
                </div>
                <div className="pt-2 border-t text-xs flex justify-between items-center">
                  <span className="text-slate-500">Team Lead: <strong className="text-slate-800">{team.leader ? `${team.leader.firstName ?? ''} ${team.leader.lastName ?? ''}`.trim() : team.leadName || "Unassigned"}</strong></span>
                  <span className="font-bold text-purple-700">{team._count?.users ?? team.memberCount ?? 0} Members</span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* View Modal */}
        {viewTeam && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setViewTeam(null)}>
            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <button type="button" onClick={() => setViewTeam(null)} className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
                <X size={22} />
              </button>
              <h2 className="text-2xl font-bold text-slate-800 mb-4">{viewTeam.name}</h2>
              <div className="space-y-3 text-sm text-slate-700">
                <p><strong>Branch:</strong> {viewTeam.branch?.name || "-"}</p>
                <p><strong>Department:</strong> {viewTeam.department?.name || "-"}</p>
                <p><strong>Organization:</strong> {viewTeam.branch?.organization?.name || "-"}</p>
                <p><strong>Team Leader:</strong> {viewTeam.leader ? `${viewTeam.leader.firstName ?? ''} ${viewTeam.leader.lastName ?? ''}`.trim() : viewTeam.leadName || "Unassigned"}</p>
                <p><strong>Members Count:</strong> {viewTeam._count?.users ?? viewTeam.memberCount ?? 0}</p>
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
            Team Management
          </h1>
          <p className="text-slate-500 mt-1">
            Manage teams inside your organization.
          </p>
        </div>

        {!search && canManageTeam && (
          <button
            onClick={() => {
              setSelectedTeam(null);
              setShowModal(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-white hover:bg-indigo-700 transition"
          >
            <Plus size={18} />
            Create Team
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={18} className="absolute left-4 top-3.5 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by team, code, branch, department, territory, members..."
          className="w-full rounded-xl border border-slate-300 py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border bg-white">
        <table className="w-full">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-6 py-4 text-left">Team</th>
              <th className="px-6 py-4 text-left">Branch</th>
              <th className="px-6 py-4 text-left">Department</th>
              <th className="px-6 py-4 text-left">Organization</th>
              <th className="px-6 py-4 text-center">Users</th>
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="py-16 text-center text-slate-500">
                  Loading teams...
                </td>
              </tr>
            ) : teams.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="flex flex-col items-center justify-center py-16">
                    <UsersRound size={60} className="text-slate-300" />
                    <h3 className="mt-5 text-xl font-semibold text-slate-700">
                      No Teams Found
                    </h3>
                    <p className="mt-2 text-slate-500">
                      {search ? `No teams matching "${search}".` : "Create your first team to get started."}
                    </p>
                    {!search && canManageTeam && (
                      <button
                        onClick={() => setShowModal(true)}
                        className="mt-6 rounded-xl bg-indigo-600 px-6 py-3 text-white hover:bg-indigo-700"
                      >
                        Create Team
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              teams.map((team) => (
                <tr key={team.id} className="border-t hover:bg-slate-50 transition">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-indigo-50 p-2">
                        <UsersRound size={18} className="text-indigo-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-800">{team.name}</h4>
                        <p className="text-sm text-slate-500">
                          Created {team.createdAt ? new Date(team.createdAt).toLocaleDateString() : "-"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <GitBranch size={15} className="text-slate-400" />
                      <span className="text-slate-700">{team.branch?.name || "-"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 text-slate-600">
                      <LayoutGrid size={15} />
                      <span>{team.department?.name || "-"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <Building size={15} className="text-slate-400" />
                      <span className="text-slate-700">{team.branch?.organization?.name || "-"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Users size={15} className="text-slate-400" />
                      <span>{team._count?.users ?? 0}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => setViewTeam(team)} className="rounded-lg border p-2 hover:bg-slate-100" title="View">
                        <Eye size={17} />
                      </button>
                      {canManageTeam && (
                        <>
                          <button onClick={() => { setSelectedTeam(team); setShowModal(true); }} className="rounded-lg border p-2 hover:bg-slate-100" title="Edit">
                            <Pencil size={17} />
                          </button>
                          <button onClick={() => handleDelete(team)} className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50" title="Delete">
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
          Total Teams : <span className="ml-2 font-semibold text-slate-800">{teams?.length || 0}</span>
        </p>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl">
            <button type="button" onClick={() => { setShowModal(false); setSelectedTeam(null); }} className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
              <X size={22} />
            </button>
            <h2 className="mb-6 text-2xl font-bold">{selectedTeam ? "Edit Team" : "Create Team"}</h2>
            <TeamForm team={selectedTeam} onClose={() => { setShowModal(false); setSelectedTeam(null); }} onSuccess={reload} />
          </div>
        </div>
      )}

      {/* Rich Enterprise Team View Details Modal */}
      {viewTeam && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setViewTeam(null)}
        >
          <div
            className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl bg-white shadow-2xl transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Hero Banner Header */}
            <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-6 md:p-8 relative">
              <button
                type="button"
                onClick={() => setViewTeam(null)}
                className="absolute right-5 top-5 rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white transition"
              >
                <X size={20} />
              </button>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-indigo-300">
                    <UsersRound size={32} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">Team Details</span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Active Team
                      </span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-white mt-1">{viewTeam.name}</h2>
                    <p className="text-sm text-indigo-200 mt-0.5">{viewTeam.description || "Field Execution & Sales Unit"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-indigo-200 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
                    Branch: {viewTeam.branch?.name || "Mohit Branch"}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-slate-50 border-b border-slate-100">
              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
                <span className="block text-xs font-semibold text-slate-500 uppercase">Assigned Branch</span>
                <span className="block text-base font-bold text-slate-800 mt-1 truncate">{viewTeam.branch?.name || "-"}</span>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
                <span className="block text-xs font-semibold text-slate-500 uppercase">Department</span>
                <span className="block text-base font-bold text-slate-800 mt-1 truncate">{viewTeam.department?.name || "-"}</span>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
                <span className="block text-xs font-semibold text-slate-500 uppercase">Territory</span>
                <span className="block text-base font-bold text-indigo-600 mt-1 truncate">{viewTeam.territory?.name || "-"}</span>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
                <span className="block text-xs font-semibold text-slate-500 uppercase">Team Strength</span>
                <span className="block text-base font-bold text-emerald-600 mt-1">{viewTeam._count?.users ?? viewTeam.users?.length ?? 0} Members</span>
              </div>
            </div>

            {/* Scrollable Main Content */}
            <div className="p-6 md:p-8 space-y-6 max-h-[55vh] overflow-y-auto">
              {/* General Info */}
              <div>
                <h3 className="text-base font-semibold text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
                  <UsersRound className="w-4 h-4 text-indigo-600" />
                  General Team Attributes
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-sm">
                  <div>
                    <span className="block text-xs font-semibold text-slate-400 uppercase">Team ID</span>
                    <span className="font-mono text-xs text-slate-700 bg-slate-100 px-2 py-1 rounded inline-block mt-1">{viewTeam.id}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-slate-400 uppercase">Parent Organization</span>
                    <span className="font-semibold text-slate-800 mt-1 block">{viewTeam.branch?.organization?.name || "IT Software"}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-slate-400 uppercase">Description</span>
                    <span className="font-semibold text-slate-800 mt-1 block">{viewTeam.description || "N/A"}</span>
                  </div>
                </div>
              </div>

              {/* Team Members List */}
              {viewTeam.users?.length > 0 && (
                <div>
                  <h3 className="text-base font-semibold text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-600" />
                    Team Roster ({viewTeam.users.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {viewTeam.users.map((u) => (
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
                          {u.roles?.[0]?.role?.name || "Executive"}
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
                onClick={() => setViewTeam(null)}
                className="px-6 py-2.5 rounded-xl bg-slate-800 text-white font-medium text-sm hover:bg-slate-900 transition"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
