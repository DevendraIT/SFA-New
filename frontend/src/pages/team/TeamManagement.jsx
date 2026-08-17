import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Users, Plus, RefreshCw, Loader2, Frown, UserPlus } from "lucide-react";
import useTeamMembers from "../../hooks/useTeamMembers";
import useTeams from "../../hooks/useTeams";
import ExecutiveCard from "../../components/team/ExecutiveCard";
import ExecutiveTable from "../../components/team/ExecutiveTable";
import TeamCard from "../../components/team/TeamCard";
import ErrorState from "../../components/dashboard/ErrorState";
import AssignTaskModal from "../../components/team/AssignTaskModal";
import { useAuth } from "../../context/AuthContext";

export default function TeamManagement() {
  const { user } = useAuth();
  const { members, loading, error, refresh } = useTeamMembers();
  const { teams: orgTeams, loading: teamsLoading } = useTeams();
  const [viewMode, setViewMode] = useState("card");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAssignModal, setShowAssignModal] = useState(false);

  const filteredMembers = members.filter((m) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const name = `${m.firstName || ""} ${m.lastName || ""}`.toLowerCase();
    const email = (m.email || "").toLowerCase();
    return name.includes(q) || email.includes(q);
  });

  if (error) {
    return (
      <div className="p-6">
        <ErrorState message="Failed to load team members" onRetry={refresh} />
      </div>
    );
  }

  const fullName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500 font-medium">Welcome back 👋</p>
          <h1 className="text-3xl font-bold text-slate-900 mt-1">Team Management</h1>
          <p className="text-slate-500 mt-1">Manage your team members, tasks, and performance</p>
        </div>
        <div className="flex gap-3">
          <button onClick={refresh} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-medium hover:bg-slate-50 transition">
            <RefreshCw size={16} />
            Refresh
          </button>
          <button onClick={() => setShowAssignModal(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition">
            <UserPlus size={16} />
            Assign Task
          </button>
        </div>
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total Members</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{members.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <p className="text-sm text-slate-500">Teams</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{orgTeams.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <p className="text-sm text-slate-500">Active Now</p>
          <p className="text-3xl font-bold text-emerald-600 mt-2">{members.filter((m) => m.isActive).length || 0}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <p className="text-sm text-slate-500">Your Role</p>
          <p className="text-lg font-bold text-blue-600 mt-2 truncate">{user?.roles?.[0]?.role?.name || "Manager"}</p>
        </div>
      </div>

      {/* Team Cards */}
      {orgTeams.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-4">Your Teams</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {orgTeams.slice(0, 6).map((team) => (
              <TeamCard key={team.id} team={team} loading={teamsLoading} />
            ))}
          </div>
        </div>
      )}

      {/* Search & View Toggle */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search team members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <div className="flex gap-2 bg-slate-100 rounded-xl p-1">
          <button onClick={() => setViewMode("card")} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${viewMode === "card" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            Cards
          </button>
          <button onClick={() => setViewMode("list")} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${viewMode === "list" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            List
          </button>
        </div>
      </div>

      {/* Members */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <ExecutiveCard key={i} loading={true} />
          ))}
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
          <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
            <Users size={28} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mt-4">No Team Members Found</h3>
          <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">
            {searchQuery ? "No members match your search. Try different keywords." : "You don't have any team members assigned yet. Members will appear here once assigned."}
          </p>
        </div>
      ) : viewMode === "card" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredMembers.map((member) => (
            <ExecutiveCard key={member.id} executive={member} taskSummary={member.taskSummary} visitSummary={member.visitSummary} />
          ))}
        </div>
      ) : (
        <ExecutiveTable executives={filteredMembers} />
      )}

      <AssignTaskModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        executives={filteredMembers}
        onSuccess={refresh}
      />
    </motion.div>
  );
}
