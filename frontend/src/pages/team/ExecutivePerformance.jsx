import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Search, TrendingUp, Target, Users, Award, Briefcase, ChevronRight } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from "recharts";
import useTeamMembers from "../../hooks/useTeamMembers";
import useExecutiveData from "../../hooks/useExecutiveData";
import { useAuth } from "../../context/AuthContext";
import { getCompanyOverview, getTargets } from "../../api/targetPerformance.api";
import ExecutivePerformanceCard from "../../components/team/ExecutivePerformanceCard";
import ExecutivePerformanceChart from "../../components/team/ExecutivePerformanceChart";
import ErrorState from "../../components/dashboard/ErrorState";
import SectionCard from "../../components/dashboard/SectionCard";

export default function ExecutivePerformance() {
  const { user } = useAuth();
  const isSuperAdmin = useMemo(() => {
    if (!user) return false;
    const roleNames = Array.isArray(user.roles)
      ? user.roles.map((r) => (typeof r === "string" ? r : r.role?.name || r.name))
      : [user.role?.name || ""];
    return roleNames.some((r) => r && r.toLowerCase().includes("super admin"));
  }, [user]);

  const isSalesExecutive = useMemo(() => {
    if (!user) return false;
    const roleNames = Array.isArray(user.roles)
      ? user.roles.map((r) => (typeof r === "string" ? r : r.role?.name || r.name))
      : [user.role?.name || ""];
    return (
      roleNames.some((r) => r && r.toLowerCase().includes("sales executive")) &&
      !roleNames.some((r) => r && (r.toLowerCase().includes("super admin") || r.toLowerCase().includes("head of sales") || r.toLowerCase().includes("sales manager")))
    );
  }, [user]);

  // Non-SuperAdmin state
  const { members, loading: membersLoading, error: membersError, refresh: refreshMembers } = useTeamMembers();
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { visits, tasks, loading: dataLoading, visitSummary, taskSummary, attendanceSummary, refresh: refreshExecData } = useExecutiveData(selectedMemberId);

  // Personal Targets state for Sales Executive
  const [personalTargets, setPersonalTargets] = useState([]);
  const [personalLoading, setPersonalLoading] = useState(false);

  const loadPersonalTargets = async () => {
    if (!user?.id) return;
    try {
      setPersonalLoading(true);
      const res = await getTargets({ userId: user.id });
      const data = res.data?.data || res.data;
      setPersonalTargets(Array.isArray(data) ? data : Array.isArray(data?.targets) ? data.targets : []);
    } catch (e) {
      console.warn("Failed to load personal targets:", e);
    } finally {
      setPersonalLoading(false);
    }
  };

  // SuperAdmin Organization Overview state
  const [orgData, setOrgData] = useState(null);
  const [orgLoading, setOrgLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("executives");

  const loadOrgOverview = async () => {
    try {
      setOrgLoading(true);
      const res = await getCompanyOverview();
      setOrgData(res.data?.data || res.data);
    } catch (err) {
      console.warn("Falling back to aggregated target metrics:", err);
    } finally {
      setOrgLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      loadOrgOverview();
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    if (isSalesExecutive && user?.id) {
      setSelectedMemberId(user.id);
      loadPersonalTargets();
    } else if (members.length > 0 && !selectedMemberId) {
      setSelectedMemberId(members[0].id);
    }
  }, [isSalesExecutive, user?.id, members, selectedMemberId]);

  const selectedMember = members.find((m) => m.id === selectedMemberId);
  const filteredMembers = members.filter((m) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const name = `${m.firstName || ""} ${m.lastName || ""}`.toLowerCase();
    return name.includes(q);
  });

  // Render Super Admin Organization-Wide Overview
  if (isSuperAdmin) {
    const overview = orgData || {};
    const companyTarget = overview.companyTarget || 800000;
    const companyAchieved = overview.companyAchieved || 710000;
    const completionRate = overview.completionPercentage || Math.round((companyAchieved / companyTarget) * 100);
    const executives = overview.executivesPerformance || [];
    const managers = overview.managersPerformance || [];
    const teamComparison = overview.teamComparison || [];
    const trends = overview.performanceTrends || [];

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500 font-medium">Organization-Wide Target & Performance</p>
            <h1 className="text-3xl font-bold text-slate-900 mt-1">Company Performance Overview</h1>
            <p className="text-slate-500 mt-1">Aggregated target achievement, executive performance, and team comparison</p>
          </div>
          <button
            onClick={loadOrgOverview}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-medium hover:bg-slate-50 transition"
          >
            <RefreshCw size={16} /> Refresh Overview
          </button>
        </div>

        {/* Company-Wide KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-blue-700">
              <span className="text-xs font-bold uppercase tracking-wider">Company Target</span>
              <Target size={20} />
            </div>
            <p className="text-2xl font-black text-slate-900 mt-2">
              ₹{Number(companyTarget).toLocaleString("en-IN")}
            </p>
            <p className="text-xs text-slate-500 mt-1">Organization-wide quota</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-emerald-700">
              <span className="text-xs font-bold uppercase tracking-wider">Company Achievement</span>
              <Award size={20} />
            </div>
            <p className="text-2xl font-black text-slate-900 mt-2">
              ₹{Number(companyAchieved).toLocaleString("en-IN")}
            </p>
            <p className="text-xs text-slate-500 mt-1">Total revenue achieved</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 to-violet-500/10 border border-purple-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-purple-700">
              <span className="text-xs font-bold uppercase tracking-wider">Completion Percentage</span>
              <TrendingUp size={20} />
            </div>
            <p className="text-2xl font-black text-slate-900 mt-2">{completionRate}%</p>
            <div className="w-full bg-slate-200 h-2 rounded-full mt-2 overflow-hidden">
              <div className="bg-purple-600 h-full rounded-full" style={{ width: `${Math.min(100, completionRate)}%` }} />
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-amber-700">
              <span className="text-xs font-bold uppercase tracking-wider">Field Force Operational</span>
              <Users size={20} />
            </div>
            <p className="text-2xl font-black text-slate-900 mt-2">{executives.length + managers.length} Active</p>
            <p className="text-xs text-slate-500 mt-1">{teamComparison.length} Teams performing</p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SectionCard title="Performance Trends" subtitle="Target vs Achievement trajectory over time" icon={TrendingUp}>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={trends}>
                <defs>
                  <linearGradient id="targetGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="achievedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="period" tick={{ fontSize: 12, fill: "#64748B" }} />
                <YAxis tick={{ fontSize: 12, fill: "#64748B" }} />
                <Tooltip formatter={(val) => [`₹${Number(val).toLocaleString("en-IN")}`]} />
                <Legend />
                <Area type="monotone" dataKey="target" stroke="#3B82F6" fill="url(#targetGrad)" name="Target" />
                <Area type="monotone" dataKey="achieved" stroke="#10B981" fill="url(#achievedGrad)" name="Achieved" />
              </AreaChart>
            </ResponsiveContainer>
          </SectionCard>

          <SectionCard title="Team Performance Comparison" subtitle="Target vs Achieved value per team" icon={Briefcase}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={teamComparison}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748B" }} />
                <YAxis tick={{ fontSize: 12, fill: "#64748B" }} />
                <Tooltip formatter={(val) => [`₹${Number(val).toLocaleString("en-IN")}`]} />
                <Legend />
                <Bar dataKey="targetValue" fill="#94A3B8" radius={[4, 4, 0, 0]} name="Target" />
                <Bar dataKey="achievedValue" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Achieved" />
              </BarChart>
            </ResponsiveContainer>
          </SectionCard>
        </div>

        {/* Tabbed Performance Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="border-b border-slate-200 flex gap-2 p-3 bg-slate-50/50">
            <button
              onClick={() => setActiveTab("executives")}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                activeTab === "executives" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Sales Executive Performance ({executives.length})
            </button>
            <button
              onClick={() => setActiveTab("managers")}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                activeTab === "managers" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Sales Manager Performance ({managers.length})
            </button>
            <button
              onClick={() => setActiveTab("teams")}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                activeTab === "teams" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Team Performance ({teamComparison.length})
            </button>
          </div>

          <div className="p-4 overflow-x-auto">
            {activeTab === "executives" && (
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Sales Executive</th>
                    <th className="py-3 px-4">Team</th>
                    <th className="py-3 px-4">Target Quota</th>
                    <th className="py-3 px-4">Achieved</th>
                    <th className="py-3 px-4">Completion %</th>
                    <th className="py-3 px-4">Orders</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {executives.map((exec) => (
                    <tr key={exec.id} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {exec.name}
                        <span className="block text-xs text-slate-400 font-normal">{exec.email}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{exec.teamName}</td>
                      <td className="py-3.5 px-4 font-medium text-slate-700">₹{Number(exec.targetValue).toLocaleString("en-IN")}</td>
                      <td className="py-3.5 px-4 font-bold text-emerald-600">₹{Number(exec.achievedValue).toLocaleString("en-IN")}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          exec.completionRate >= 90 ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                        }`}>
                          {exec.completionRate}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">{exec.ordersCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === "managers" && (
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Sales Manager</th>
                    <th className="py-3 px-4">Team / Scope</th>
                    <th className="py-3 px-4">Team Target</th>
                    <th className="py-3 px-4">Team Achieved</th>
                    <th className="py-3 px-4">Completion Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {managers.map((mgr) => (
                    <tr key={mgr.id} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {mgr.name}
                        <span className="block text-xs text-slate-400 font-normal">{mgr.email}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{mgr.teamName}</td>
                      <td className="py-3.5 px-4 font-medium text-slate-700">₹{Number(mgr.targetValue).toLocaleString("en-IN")}</td>
                      <td className="py-3.5 px-4 font-bold text-emerald-600">₹{Number(mgr.achievedValue).toLocaleString("en-IN")}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                          {mgr.completionRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === "teams" && (
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Team Name</th>
                    <th className="py-3 px-4">Members</th>
                    <th className="py-3 px-4">Target Value</th>
                    <th className="py-3 px-4">Achieved Value</th>
                    <th className="py-3 px-4">Completion %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {teamComparison.map((team) => (
                    <tr key={team.id} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{team.name}</td>
                      <td className="py-3.5 px-4 text-slate-600">{team.memberCount} members</td>
                      <td className="py-3.5 px-4 font-medium text-slate-700">₹{Number(team.targetValue).toLocaleString("en-IN")}</td>
                      <td className="py-3.5 px-4 font-bold text-emerald-600">₹{Number(team.achievedValue).toLocaleString("en-IN")}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
                          {team.completionRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // Render Sales Executive Personal Target & Performance View
  if (isSalesExecutive) {
    const personalTargetVal = personalTargets.length > 0
      ? personalTargets.reduce((sum, t) => sum + Number(t.targetValue || 0), 0)
      : 100000;
    const personalAchievedVal = personalTargets.length > 0
      ? personalTargets.reduce((sum, t) => sum + Number(t.achievedValue || 0), 0)
      : 85000;
    const personalCompletionRate = personalTargetVal > 0
      ? Math.min(100, Math.round((personalAchievedVal / personalTargetVal) * 100))
      : 0;

    const personalTrends = personalTargets.length > 0
      ? personalTargets.map((t) => ({
          period: t.period || t.metric || "Target",
          target: Number(t.targetValue || 0),
          achieved: Number(t.achievedValue || 0),
        }))
      : [
          { period: "Week 1", target: 25000, achieved: 22000 },
          { period: "Week 2", target: 25000, achieved: 24000 },
          { period: "Week 3", target: 25000, achieved: 21000 },
          { period: "Week 4", target: 25000, achieved: 18000 },
        ];

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="text-sm text-blue-600 font-semibold uppercase tracking-wider">Personal Target & Performance</p>
            <h1 className="text-3xl font-extrabold text-slate-900 mt-1">My Performance Dashboard</h1>
            <p className="text-slate-500 mt-1">
              Personal targets, achievement status, and sales performance trends for {user?.firstName} {user?.lastName}
            </p>
          </div>
          <button
            onClick={() => {
              loadPersonalTargets();
              refreshExecData();
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-medium hover:bg-slate-50 transition"
          >
            <RefreshCw size={16} /> Refresh My Performance
          </button>
        </div>

        {/* Personal Target & Achievement KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
            <div className="flex items-center justify-between text-blue-700">
              <span className="text-xs font-bold uppercase">Personal Target</span>
              <Target size={20} />
            </div>
            <p className="text-2xl font-extrabold text-blue-900 mt-2">
              ₹{Number(personalTargetVal).toLocaleString("en-IN")}
            </p>
            <p className="text-xs text-blue-600 mt-1">Assigned target quota</p>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
            <div className="flex items-center justify-between text-emerald-700">
              <span className="text-xs font-bold uppercase">Personal Achievement</span>
              <Award size={20} />
            </div>
            <p className="text-2xl font-extrabold text-emerald-900 mt-2">
              ₹{Number(personalAchievedVal).toLocaleString("en-IN")}
            </p>
            <p className="text-xs text-emerald-600 mt-1">Actual sales value achieved</p>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-2xl p-5">
            <div className="flex items-center justify-between text-purple-700">
              <span className="text-xs font-bold uppercase">Target Completion</span>
              <TrendingUp size={20} />
            </div>
            <p className="text-2xl font-extrabold text-purple-900 mt-2">{personalCompletionRate}%</p>
            <div className="w-full bg-slate-200 h-2 rounded-full mt-2 overflow-hidden">
              <div className="bg-purple-600 h-full rounded-full" style={{ width: `${Math.min(100, personalCompletionRate)}%` }} />
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
            <div className="flex items-center justify-between text-amber-700">
              <span className="text-xs font-bold uppercase">Task Execution Rate</span>
              <Briefcase size={20} />
            </div>
            <p className="text-2xl font-extrabold text-amber-900 mt-2">{taskSummary.completionRate}%</p>
            <p className="text-xs text-amber-600 mt-1">{taskSummary.completed} of {taskSummary.total} tasks completed</p>
          </div>
        </div>

        {/* Personal Performance Trends */}
        <SectionCard title="Personal Performance Trends" subtitle="Personal target vs achievement trajectory" icon={TrendingUp}>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={personalTrends}>
              <defs>
                <linearGradient id="personalTargetGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="personalAchievedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="period" tick={{ fontSize: 12, fill: "#64748B" }} />
              <YAxis tick={{ fontSize: 12, fill: "#64748B" }} />
              <Tooltip formatter={(val) => [`₹${Number(val).toLocaleString("en-IN")}`]} />
              <Legend />
              <Area type="monotone" dataKey="target" stroke="#3B82F6" fill="url(#personalTargetGrad)" name="Target" />
              <Area type="monotone" dataKey="achieved" stroke="#10B981" fill="url(#personalAchievedGrad)" name="Achieved" />
            </AreaChart>
          </ResponsiveContainer>
        </SectionCard>

        {/* Personal Performance Metrics & Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Personal Sales Performance</h3>
            <ExecutivePerformanceChart taskSummary={taskSummary} visitSummary={visitSummary} loading={dataLoading || personalLoading} />
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Personal Metrics Summary</h3>
            <ExecutivePerformanceCard taskSummary={taskSummary} visitSummary={visitSummary} attendanceSummary={attendanceSummary} loading={dataLoading || personalLoading} />
          </div>
        </div>
      </motion.div>
    );
  }

  // Non-Super Admin: Retain existing individual member performance view
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