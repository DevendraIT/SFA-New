import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Search, TrendingUp } from "lucide-react";
import useTeamMembers from "../../hooks/useTeamMembers";
import useExecutiveData from "../../hooks/useExecutiveData";
import ExecutivePerformanceCard from "../../components/team/ExecutivePerformanceCard";
import ExecutivePerformanceChart from "../../components/team/ExecutivePerformanceChart";
import ErrorState from "../../components/dashboard/ErrorState";

export default function ExecutivePerformance() {
  const { members, loading: membersLoading, error: membersError, refresh: refreshMembers } = useTeamMembers();
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { visits, tasks, loading: dataLoading, visitSummary, taskSummary, attendanceSummary } = useExecutiveData(selectedMemberId);

  const selectedMember = members.find((m) => m.id === selectedMemberId);

  const filteredMembers = members.filter((m) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const name = `${m.firstName || ""} ${m.lastName || ""}`.toLowerCase();
    return name.includes(q);
  });

  useEffect(() => {
    if (members.length > 0 && !selectedMemberId) {
      setSelectedMemberId(members[0].id);
    }
  }, [members, selectedMemberId]);

  if (membersError) {
    return (
      <div className="p-6">
        <ErrorState message="Failed to load team members" onRetry={refreshMembers} />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500 font-medium">Performance Overview</p>
          <h1 className="text-3xl font-bold text-slate-900 mt-1">Executive Performance</h1>
          <p className="text-slate-500 mt-1">Track task completion, visits, and attendance for each team member</p>
        </div>
        <button onClick={refreshMembers} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-medium hover:bg-slate-50 transition">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Member Selection Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-semibold text-slate-800 mb-4">Team Members</h3>

            <div className="relative mb-4">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 bg-slate-50 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>

            {membersLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : filteredMembers.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No members found</p>
            ) : (
              <div className="space-y-2">
                {filteredMembers.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => setSelectedMemberId(member.id)}
                    className={`w-full text-left flex items-center gap-3 px-3 py-3 rounded-xl transition ${
                      selectedMemberId === member.id ? "bg-blue-50 text-blue-700 border border-blue-200" : "hover:bg-slate-50 border border-transparent"
                    }`}
                  >
                    <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                      {`${member.firstName?.[0] || ""}${member.lastName?.[0] || ""}` || "U"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {member.firstName} {member.lastName}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{member.email || ""}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          </div> 

        {/* Performance Content */}
        <div className="lg:col-span-3 space-y-6">
          {!selectedMemberId ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
              <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
                <TrendingUp size={28} className="text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mt-4">Select a Team Member</h3>
              <p className="text-sm text-slate-500 mt-2">Choose an executive from the list to view their performance metrics.</p>
            </div>
          ) : (
            <>
              {/* Selected Member Header */}
              {selectedMember && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
                      {`${selectedMember.firstName?.[0] || ""}${selectedMember.lastName?.[0] || ""}`}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">
                        {selectedMember.firstName} {selectedMember.lastName}
                      </h2>
                      <p className="text-sm text-slate-500">{selectedMember.email}</p>
                      {selectedMember.branch && (
                        <p className="text-xs text-slate-400 mt-1">{selectedMember.branch.name}</p>
                      )}
                    </div>
                    </div>
                </div>
              )} 

              {/* Performance KPIs */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-6">Charts & Distribution</h3>
                  <ExecutivePerformanceChart taskSummary={taskSummary} visitSummary={visitSummary} loading={dataLoading} />
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-6">Metrics Summary</h3>
                  <ExecutivePerformanceCard taskSummary={taskSummary} visitSummary={visitSummary} attendanceSummary={attendanceSummary} loading={dataLoading} />
               </div>
              </div>

            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}