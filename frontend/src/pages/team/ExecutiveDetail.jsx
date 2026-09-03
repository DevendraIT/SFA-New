import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, Phone, Building2, MapPin, User, RefreshCw, Loader2 } from "lucide-react";
import userApi from "../../api/user.api";
import useExecutiveData from "../../hooks/useExecutiveData";
import useManagerTasks from "../../hooks/useManagerTasks";
import TaskStatusBadge from "../../components/team/TaskStatusBadge";
import TaskCard from "../../components/team/TaskCard";
import TaskTable from "../../components/team/TaskTable";
import ExecutivePerformanceCard from "../../components/team/ExecutivePerformanceCard";
import ExecutivePerformanceChart from "../../components/team/ExecutivePerformanceChart";
import ErrorState from "../../components/dashboard/ErrorState";
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";

const TABS = ["Overview", "Tasks", "Visits", "Attendance", "Performance"];

export default function ExecutiveDetail() {
  const { id } = useParams();
  const [member, setMember] = useState(null);
  const [memberLoading, setMemberLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Overview");
  const { visits, attendance, tasks, loading, error, refresh, visitSummary, taskSummary, attendanceSummary } = useExecutiveData(id);
  const { tasks: assignedTasks, loading: tasksLoading } = useManagerTasks({ assignedToId: id });

  useEffect(() => {
    if (!id) return;
    const loadMember = async () => {
      try {
        setMemberLoading(true);
        const res = await userApi.getUser(id);
        setMember(res.data?.data || res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setMemberLoading(false);
      }
    };
    loadMember();
  }, [id]);

  if (memberLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-blue-600" />
      </div>
    );
  }

  if (!member) {
    return <div className="p-6"><ErrorState message="Executive not found" /></div>;
  }

  const fullName = `${member.firstName || ""} ${member.lastName || ""}`.trim();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
          <div className="h-20 w-20 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
            {fullName.charAt(0)}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900">{fullName}</h1>
            <div className="flex flex-wrap gap-4 mt-2">
              {member.email && (
                <span className="flex items-center gap-1.5 text-sm text-slate-500">
                  <Mail size={14} /> {member.email}
                </span>
              )}
              {member.phoneNumber && (
                <span className="flex items-center gap-1.5 text-sm text-slate-500">
                  <Phone size={14} /> {member.phoneNumber}
                </span>
              )}
              {member.branch && (
                <span className="flex items-center gap-1.5 text-sm text-slate-500">
                  <Building2 size={14} /> {member.branch.name}
                </span>
              )}
              {member.territory && (
                <span className="flex items-center gap-1.5 text-sm text-slate-500">
                  <MapPin size={14} /> {member.territory.name}
                </span>
              )}
            </div>
          </div>
          <button onClick={refresh} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 text-sm font-medium hover:bg-slate-50 transition">
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition ${activeTab === tab ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "Overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ExecutivePerformanceCard taskSummary={taskSummary} visitSummary={visitSummary} attendanceSummary={attendanceSummary} />
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-semibold text-slate-800 mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex justify-between"><span className="text-sm text-slate-500">Total Visits</span><span className="font-bold">{visitSummary.total}</span></div>
              <div className="flex justify-between"><span className="text-sm text-slate-500">Total Tasks</span><span className="font-bold">{taskSummary.total}</span></div>
              <div className="flex justify-between"><span className="text-sm text-slate-500">Attendance Days</span><span className="font-bold">{attendanceSummary.total}</span></div>
              <div className="flex justify-between"><span className="text-sm text-slate-500">Present</span><span className="font-bold text-emerald-600">{attendanceSummary.present}</span></div>
              <div className="flex justify-between"><span className="text-sm text-slate-500">Completion Rate</span><span className="font-bold text-blue-600">{taskSummary.completionRate}%</span></div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "Tasks" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Assigned Tasks ({tasks.length})</h2>
          </div>
          {tasks.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <p className="text-slate-500 text-sm">No tasks assigned yet</p>
            </div>
          ) : (
            <TaskTable tasks={tasks} loading={false} />
          )}
        </div>
      )}

      {activeTab === "Visits" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Visit History ({visits.length})</h2>
          </div>
          {visits.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <p className="text-slate-500 text-sm">No visits recorded</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="text-left px-5 py-4 text-xs font-semibold text-slate-500 uppercase">Date</th>
                    <th className="text-left px-5 py-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
                    <th className="text-left px-5 py-4 text-xs font-semibold text-slate-500 uppercase">Customer</th>
                    <th className="text-left px-5 py-4 text-xs font-semibold text-slate-500 uppercase">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {visits.map((visit, i) => (
                    <tr key={visit.id || i} className="border-b hover:bg-slate-50">
                      <td className="px-5 py-4 text-sm">{new Date(visit.scheduledAt || visit.createdAt).toLocaleDateString()}</td>
                      <td className="px-5 py-4"><TaskStatusBadge status={visit.status} /></td>
                      <td className="px-5 py-4 text-sm font-medium">{visit.customer?.name || visit.customerName || "-"}</td>
                      <td className="px-5 py-4 text-sm text-slate-500">{visit.visitType || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "Attendance" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Attendance Record ({attendance.length})</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
            <div className="bg-emerald-50 rounded-xl p-5 text-center">
              <p className="text-3xl font-bold text-emerald-600">{attendanceSummary.present}</p>
              <p className="text-sm text-slate-600 mt-1">Present</p>
            </div>
            <div className="bg-red-50 rounded-xl p-5 text-center">
              <p className="text-3xl font-bold text-red-500">{attendanceSummary.absent}</p>
              <p className="text-sm text-slate-600 mt-1">Absent</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-5 text-center">
              <p className="text-3xl font-bold text-amber-600">{attendanceSummary.leave}</p>
              <p className="text-sm text-slate-600 mt-1">Leave</p>
            </div>
          </div>
          {attendance.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <p className="text-slate-500 text-sm">No attendance records found</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="text-left px-5 py-4 text-xs font-semibold text-slate-500 uppercase">Date</th>
                    <th className="text-left px-5 py-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
                    <th className="text-left px-5 py-4 text-xs font-semibold text-slate-500 uppercase">Check In</th>
                    <th className="text-left px-5 py-4 text-xs font-semibold text-slate-500 uppercase">Check Out</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map((a, i) => (
                    <tr key={a.id || i} className="border-b hover:bg-slate-50">
                      <td className="px-5 py-4 text-sm">{new Date(a.date || a.createdAt).toLocaleDateString()}</td>
                      <td className="px-5 py-4"><TaskStatusBadge status={a.status} /></td>
                      <td className="px-5 py-4 text-sm text-slate-500">{a.checkIn ? new Date(a.checkIn).toLocaleTimeString() : "-"}</td>
                      <td className="px-5 py-4 text-sm text-slate-500">{a.checkOut ? new Date(a.checkOut).toLocaleTimeString() : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "Performance" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Task & Visit Performance</h3>
            <ExecutivePerformanceChart taskSummary={taskSummary} visitSummary={visitSummary} />
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Performance Summary</h3>
            <ExecutivePerformanceCard taskSummary={taskSummary} visitSummary={visitSummary} attendanceSummary={attendanceSummary} />
          </div>
        </div>
      )}
    </motion.div>
  );
}
