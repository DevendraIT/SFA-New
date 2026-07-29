import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import dayjs from "dayjs";
import { LogIn, LogOut, Clock, MapPin, CalendarDays, RefreshCw, Loader2, BarChart3 } from "lucide-react";
import toast from "react-hot-toast";

import { useAuth } from "../../context/AuthContext";
import fieldForceApi from "../../api/fieldForce.api";
import PageHeader from "../../components/dashboard/PageHeader";
import StatsGrid from "../../components/dashboard/StatsGrid";
import StatCard from "../../components/dashboard/StatCard";
import SectionCard from "../../components/dashboard/SectionCard";
import StatusBadge from "../../components/field-force/StatusBadge";
import GpsStatusCard from "../../components/field-force/GpsStatusCard";
import EmptyDashboard from "../../components/dashboard/EmptyDashboard";
import ErrorState from "../../components/dashboard/ErrorState";
import { TableSkeleton } from "../../components/dashboard/LoadingSkeleton";

export default function AttendancePage() {
  const { user } = useAuth();

  const isSuperAdmin = Boolean(
    user?.roles?.some((r) =>
      typeof r === "string" ? r.toLowerCase().includes("super admin") : r.role?.name?.toLowerCase().includes("super admin")
    )
  );

  const [todayAttendance, setTodayAttendance] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [gpsLocation, setGpsLocation] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(true);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setGpsLoading(false);
        },
        () => { setGpsLoading(false); },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setGpsLoading(false);
    }
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const startOfMonth = dayjs().startOf("month").format("YYYY-MM-DD");
      const endOfMonth = dayjs().endOf("month").format("YYYY-MM-DD");

      const [todayRes, historyRes, summaryRes] = await Promise.allSettled([
        fieldForceApi.getTodayAttendance(),
        fieldForceApi.listAttendance({ startDate: startOfMonth, endDate: endOfMonth, take: 100 }),
        fieldForceApi.getAttendanceSummary({ startDate: startOfMonth, endDate: endOfMonth }),
      ]);

      if (todayRes.status === "fulfilled") {
        setTodayAttendance(todayRes.value.data?.data || todayRes.value.data);
      }
      if (historyRes.status === "fulfilled") {
        const data = historyRes.value.data?.data || historyRes.value.data;
        setAttendanceHistory(data?.attendance || data || []);
      }
      if (summaryRes.status === "fulfilled") {
        const data = summaryRes.value.data?.data || summaryRes.value.data;
        setAttendanceSummary(data);
      }
    } catch (err) {
      setError(err?.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleCheckIn = async () => {
    if (!gpsLocation) { toast.error("GPS required"); return; }
    try {
      setCheckingIn(true);
      await fieldForceApi.checkIn({ location: gpsLocation });
      toast.success("Checked in!");
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Check-in failed");
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    if (!gpsLocation) { toast.error("GPS required"); return; }
    try {
      setCheckingOut(true);
      await fieldForceApi.checkOut({ location: gpsLocation });
      toast.success("Checked out!");
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Check-out failed");
    } finally {
      setCheckingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-slate-200 rounded animate-pulse" />
        <TableSkeleton rows={5} cols={4} />
      </div>
    );
  }

  if (isSuperAdmin) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
          <LogIn size={28} />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Attendance Operations Not Applicable</h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Super Admin role manages platform administration and organization-wide analytics. Attendance check-in and check-out operations are reserved for field force employees.
        </p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <PageHeader title="Attendance" subtitle="GPS-based check-in/out and history">
        <button onClick={loadData} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium hover:bg-slate-50 transition">
          <RefreshCw size={16} /> Refresh
        </button>
      </PageHeader>

      {/* GPS & Check-In/Out */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SectionCard title="Today's Attendance" icon={CalendarDays} iconColor="text-blue-600">
            <div className="space-y-6">
              {/* Status Timeline */}
              <div className="space-y-4">
                <div className={`flex items-center gap-4 p-4 rounded-xl ${isCheckedIn ? "bg-emerald-50" : "bg-slate-50"}`}>
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${isCheckedIn ? "bg-emerald-600" : "bg-slate-300"}`}>
                    <LogIn size={24} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800">Check-In</p>
                    <p className="text-sm text-slate-500">
                      {todayAttendance?.checkInAt ? dayjs(todayAttendance.checkInAt).format("h:mm:ss A") : "Not checked in"}
                    </p>
                    {todayAttendance?.checkInLoc && (
                      <p className="text-xs text-slate-400 mt-1">
                        <MapPin size={12} className="inline" />{" "}
                        {todayAttendance.checkInLoc.address || `${todayAttendance.checkInLoc.lat?.toFixed(4)}, ${todayAttendance.checkInLoc.lng?.toFixed(4)}`}
                      </p>
                    )}
                  </div>
                  {isCheckedIn && <StatusBadge status="PRESENT" type="attendance" size="lg" />}
                </div>

                <div className={`flex items-center gap-4 p-4 rounded-xl ${isCheckedOut ? "bg-slate-100" : "bg-slate-50"}`}>
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${isCheckedOut ? "bg-slate-600" : "bg-slate-300"}`}>
                    <LogOut size={24} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800">Check-Out</p>
                    <p className="text-sm text-slate-500">
                      {todayAttendance?.checkOutAt ? dayjs(todayAttendance.checkOutAt).format("h:mm:ss A") : "Not checked out"}
                    </p>
                    {todayAttendance?.checkOutLoc && (
                      <p className="text-xs text-slate-400 mt-1">
                        <MapPin size={12} className="inline" />{" "}
                        {todayAttendance.checkOutLoc.address || `${todayAttendance.checkOutLoc.lat?.toFixed(4)}, ${todayAttendance.checkOutLoc.lng?.toFixed(4)}`}
                      </p>
                    )}
                  </div>
                  {isCheckedOut && <span className="text-xs font-semibold text-slate-500">Done</span>}
                </div>
              </div>

              {/* Duration */}
              {duration != null && (
                <div className="flex items-center gap-2 p-4 rounded-xl bg-blue-50">
                  <Clock size={20} className="text-blue-600" />
                  <div>
                    <p className="font-semibold text-blue-800">Working Duration</p>
                    <p className="text-sm text-blue-600">
                      {Math.floor(duration / 60)} hours {duration % 60} minutes
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4">
                {!isCheckedIn && !isCheckedOut && (
                  <button onClick={handleCheckIn} disabled={checkingIn || !gpsLocation}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 transition disabled:opacity-50">
                    {checkingIn ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />}
                    {checkingIn ? "Checking In..." : "Check In"}
                  </button>
                )}
                {isCheckedIn && !isCheckedOut && (
                  <button onClick={handleCheckOut} disabled={checkingOut || !gpsLocation}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-800 text-white font-semibold text-sm hover:bg-slate-900 transition disabled:opacity-50">
                    {checkingOut ? <Loader2 size={18} className="animate-spin" /> : <LogOut size={18} />}
                    {checkingOut ? "Checking Out..." : "Check Out"}
                  </button>
                )}
                {isCheckedOut && (
                  <div className="flex-1 text-center py-3.5 rounded-xl bg-slate-100 text-slate-500 text-sm font-medium">
                    Already checked out for today
                  </div>
                )}
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="space-y-6">
          <GpsStatusCard
            latitude={gpsLocation?.lat}
            longitude={gpsLocation?.lng}
            loading={gpsLoading}
          />

          <SectionCard title="Monthly Summary" icon={BarChart3} iconColor="text-blue-600">
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Total Days</span>
                <span className="font-semibold">{summary._count || attendanceHistory.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Present</span>
                <span className="font-semibold text-emerald-600">
                  {attendanceHistory.filter((a) => a.status === "PRESENT").length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Absent</span>
                <span className="font-semibold text-red-600">
                  {attendanceHistory.filter((a) => a.status === "ABSENT").length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Avg Duration</span>
                <span className="font-semibold">
                  {summary._avg?.durationMins ? `${Math.round(summary._avg.durationMins / 60)}h` : "N/A"}
                </span>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>

      {/* Attendance History */}
      <SectionCard title="Attendance History" subtitle="This month" icon={CalendarDays} iconColor="text-indigo-600">
        {attendanceHistory.length === 0 ? (
          <EmptyDashboard title="No Records" description="No attendance records found for this month" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="text-left px-5 py-4 text-xs font-semibold text-slate-500 uppercase">Date</th>
                  <th className="text-left px-5 py-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
                  <th className="text-left px-5 py-4 text-xs font-semibold text-slate-500 uppercase">Check-In</th>
                  <th className="text-left px-5 py-4 text-xs font-semibold text-slate-500 uppercase">Check-Out</th>
                  <th className="text-left px-5 py-4 text-xs font-semibold text-slate-500 uppercase">Duration</th>
                  <th className="text-left px-5 py-4 text-xs font-semibold text-slate-500 uppercase">Location</th>
                </tr>
              </thead>
              <tbody>
                {attendanceHistory.map((a, i) => (
                  <tr key={a.id || i} className="border-b hover:bg-slate-50">
                    <td className="px-5 py-4 text-sm font-medium">{dayjs(a.date).format("DD MMM YYYY")}</td>
                    <td className="px-5 py-4"><StatusBadge status={a.status} type="attendance" /></td>
                    <td className="px-5 py-4 text-sm">{a.checkInAt ? dayjs(a.checkInAt).format("h:mm A") : "-"}</td>
                    <td className="px-5 py-4 text-sm">{a.checkOutAt ? dayjs(a.checkOutAt).format("h:mm A") : "-"}</td>
                    <td className="px-5 py-4 text-sm">
                      {a.durationMins != null ? `${Math.floor(a.durationMins / 60)}h ${a.durationMins % 60}m` : "-"}
                    </td>
                    <td className="px-5 py-4">
                      {a.checkInLoc ? (
                        <span className="flex items-center gap-1 text-xs text-blue-600">
                          <MapPin size={12} /> Geo-tagged
                        </span>
                      ) : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </motion.div>
  );
}

