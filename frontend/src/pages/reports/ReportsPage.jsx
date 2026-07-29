import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import dayjs from "dayjs";
import { BarChart3, TrendingUp, Target, Users, Calendar, Download, RefreshCw, Loader2, FileText, CheckCircle2 } from "lucide-react";
import fieldForceApi from "../../api/fieldForce.api";
import PageHeader from "../../components/dashboard/PageHeader";
import SectionCard from "../../components/dashboard/SectionCard";
import EmptyDashboard from "../../components/dashboard/EmptyDashboard";

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [visits, setVisits] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [dars, setDars] = useState([]);
  const [dateFilter, setDateFilter] = useState("THIS_MONTH");

  const loadReportsData = async () => {
    try {
      setLoading(true);
      const [tasksRes, visitsRes, attendanceRes, darsRes] = await Promise.all([
        fieldForceApi.listTasks({ take: 100 }).catch(() => ({ data: [] })),
        fieldForceApi.listVisits({ take: 100 }).catch(() => ({ data: [] })),
        fieldForceApi.listAttendance({ take: 100 }).catch(() => ({ data: [] })),
        fieldForceApi.listDars({ take: 100 }).catch(() => ({ data: [] })),
      ]);

      const tData = tasksRes.data?.data || tasksRes.data;
      const vData = visitsRes.data?.data || visitsRes.data;
      const aData = attendanceRes.data?.data || attendanceRes.data;
      const dData = darsRes.data?.data || darsRes.data;

      setTasks(Array.isArray(tData?.tasks) ? tData.tasks : Array.isArray(tData) ? tData : []);
      setVisits(Array.isArray(vData?.visits) ? vData.visits : Array.isArray(vData) ? vData : []);
      setAttendance(Array.isArray(aData?.attendance) ? aData.attendance : Array.isArray(aData) ? aData : []);
      setDars(Array.isArray(dData?.dars) ? dData.dars : Array.isArray(dData) ? dData : []);
    } catch (e) {
      console.warn("Failed to load reports data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportsData();
  }, []);

  const completedTasks = tasks.filter((t) => t.status === "COMPLETED" || t.status === "CHECKED_OUT").length;
  const completedVisits = visits.filter((v) => v.status === "COMPLETED").length;
  const presentAttendance = attendance.filter((a) => a.status === "PRESENT" || a.checkInAt).length;
  const taskCompletionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
  const visitCoverageRate = visits.length > 0 ? Math.round((completedVisits / visits.length) * 100) : 0;

  const handleExportCSV = () => {
    const csvRows = [
      ["Metric", "Total Count", "Completed/Present", "Efficiency Rate"],
      ["Assigned Missions", tasks.length, completedTasks, `${taskCompletionRate}%`],
      ["Customer Visits", visits.length, completedVisits, `${visitCoverageRate}%`],
      ["Attendance Records", attendance.length, presentAttendance, `${attendance.length > 0 ? Math.round((presentAttendance / attendance.length) * 100) : 0}%`],
      ["Daily Activity Reports (DAR)", dars.length, dars.filter((d) => d.status === "SUBMITTED" || d.status === "APPROVED").length, "N/A"],
    ];

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `SFA_Field_Report_${dayjs().format("YYYY-MM-DD")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 size={40} className="animate-spin text-blue-600" />
        <p className="text-sm text-slate-500 font-medium">Generating dynamic field analytics...</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <PageHeader title="Field & Sales Reports" subtitle="Live database analytics and field activity performance reports">
        <div className="flex items-center gap-3">
          <button
            onClick={loadReportsData}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-medium hover:bg-slate-50 transition"
          >
            <RefreshCw size={16} /> Refresh
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
          >
            <Download size={16} /> Export CSV Report
          </button>
        </div>
      </PageHeader>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-blue-50 border border-blue-200 p-5">
          <p className="text-xs font-semibold text-blue-700 uppercase">Missions Efficiency</p>
          <p className="text-2xl font-extrabold text-blue-900 mt-1">{taskCompletionRate}%</p>
          <p className="text-xs text-blue-600 mt-1">{completedTasks} of {tasks.length} tasks</p>
        </div>
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-5">
          <p className="text-xs font-semibold text-emerald-700 uppercase">Visit Coverage</p>
          <p className="text-2xl font-extrabold text-emerald-900 mt-1">{visitCoverageRate}%</p>
          <p className="text-xs text-emerald-600 mt-1">{completedVisits} of {visits.length} visits</p>
        </div>
        <div className="rounded-2xl bg-purple-50 border border-purple-200 p-5">
          <p className="text-xs font-semibold text-purple-700 uppercase">Attendance Rate</p>
          <p className="text-2xl font-extrabold text-purple-900 mt-1">
            {attendance.length > 0 ? Math.round((presentAttendance / attendance.length) * 100) : 100}%
          </p>
          <p className="text-xs text-purple-600 mt-1">{presentAttendance} active days</p>
        </div>
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-5">
          <p className="text-xs font-semibold text-amber-700 uppercase">DAR Reports</p>
          <p className="text-2xl font-extrabold text-amber-900 mt-1">{dars.length}</p>
          <p className="text-xs text-amber-600 mt-1">Submitted & logged</p>
        </div>
      </div>

      {/* Reports Breakdown Table */}
      <SectionCard title="Field Operations Breakdown" icon={BarChart3} iconColor="text-blue-600">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Report Module</th>
                <th className="py-3 px-4">Total Records</th>
                <th className="py-3 px-4">Completed / Active</th>
                <th className="py-3 px-4">Success Rate</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50/80 transition">
                <td className="py-3.5 px-4 font-bold text-slate-900">Task Missions Execution</td>
                <td className="py-3.5 px-4 text-slate-700">{tasks.length}</td>
                <td className="py-3.5 px-4 text-emerald-600 font-semibold">{completedTasks}</td>
                <td className="py-3.5 px-4 font-extrabold text-blue-600">{taskCompletionRate}%</td>
                <td className="py-3.5 px-4">
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                    DYNAMIC
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-slate-50/80 transition">
                <td className="py-3.5 px-4 font-bold text-slate-900">Customer Visits Coverage</td>
                <td className="py-3.5 px-4 text-slate-700">{visits.length}</td>
                <td className="py-3.5 px-4 text-emerald-600 font-semibold">{completedVisits}</td>
                <td className="py-3.5 px-4 font-extrabold text-blue-600">{visitCoverageRate}%</td>
                <td className="py-3.5 px-4">
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                    DYNAMIC
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-slate-50/80 transition">
                <td className="py-3.5 px-4 font-bold text-slate-900">Daily Attendance Tracking</td>
                <td className="py-3.5 px-4 text-slate-700">{attendance.length}</td>
                <td className="py-3.5 px-4 text-emerald-600 font-semibold">{presentAttendance}</td>
                <td className="py-3.5 px-4 font-extrabold text-blue-600">
                  {attendance.length > 0 ? Math.round((presentAttendance / attendance.length) * 100) : 100}%
                </td>
                <td className="py-3.5 px-4">
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                    DYNAMIC
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-slate-50/80 transition">
                <td className="py-3.5 px-4 font-bold text-slate-900">Daily Activity Reports (DAR)</td>
                <td className="py-3.5 px-4 text-slate-700">{dars.length}</td>
                <td className="py-3.5 px-4 text-emerald-600 font-semibold">
                  {dars.filter((d) => d.status === "SUBMITTED" || d.status === "APPROVED").length}
                </td>
                <td className="py-3.5 px-4 font-extrabold text-blue-600">100%</td>
                <td className="py-3.5 px-4">
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                    DYNAMIC
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </SectionCard>
    </motion.div>
  );
}
