import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import dayjs from "dayjs";
import {
  User, Mail, Phone, Building2, MapPin, Target,
  RefreshCw, CalendarDays, Activity, Award,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import useFieldForce from "../../hooks/useFieldForce";
import userApi from "../../api/user.api";
import PageHeader from "../../components/dashboard/PageHeader";
import SectionCard from "../../components/dashboard/SectionCard";
import PerformanceCard from "../../components/dashboard/PerformanceCard";
import StatusBadge from "../../components/field-force/StatusBadge";
import ErrorState from "../../components/dashboard/ErrorState";
import { TableSkeleton } from "../../components/dashboard/LoadingSkeleton";

export default function ProfilePage() {
  const { user } = useAuth();
  const fullName = useMemo(() => {
    if (!user) return "";
    return `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
  }, [user]);

  const [managerName, setManagerName] = useState("");
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const {
    tasks, visits, attendanceHistory, loading: ffLoading,
    error, refresh, visitSummary, taskSummary,
  } = useFieldForce(user?.id);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) return;
      try {
        setLoading(true);
        const res = await userApi.getUser(user.id);
        const data = res.data?.data || res.data;
        setProfile(data);
        if (data.manager) {
          setManagerName(`${data.manager.firstName || ""} ${data.manager.lastName || ""}`.trim());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [user?.id]);

  if (loading || ffLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-slate-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TableSkeleton rows={4} cols={2} />
          </div>
          <TableSkeleton rows={4} cols={2} />
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorState message="Failed to load profile data" onRetry={refresh} />;
  }

  const employeeId = profile?.id ? `EMP-${profile.id.slice(0, 6).toUpperCase()}` : "EMP-1002";
  const organizationName = profile?.organization?.name || "IT360 Sales Force Automation";
  const joiningDate = profile?.createdAt ? dayjs(profile.createdAt).format("DD MMMM YYYY") : "01 Jan 2024";

  const attendancePresent = attendanceHistory.filter((a) => a.status === "PRESENT").length;
  const attendanceAbsent = attendanceHistory.filter((a) => a.status === "ABSENT").length;
  const attendanceLeave = attendanceHistory.filter((a) => a.status === "LEAVE").length;
  const attendanceRate = attendanceHistory.length > 0 ? Math.round((attendancePresent / attendanceHistory.length) * 100) : 100;

  const performanceMetrics = [
    { label: "Visit Completion", value: visitSummary.total > 0 ? Math.round((visitSummary.completed / visitSummary.total) * 100) : 0 },
    { label: "Task Completion", value: taskSummary.completionRate },
    { label: "Attendance Rate", value: attendanceRate },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <PageHeader title="Executive Profile" subtitle="Your official employee profile, territory details, and performance metrics">
        <button onClick={refresh} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium hover:bg-slate-50 transition">
          <RefreshCw size={16} /> Refresh Profile
        </button>
      </PageHeader>

      {/* Profile Header */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 lg:p-8">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="relative">
            <div className="h-28 w-28 rounded-full overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold text-4xl shadow-xl shadow-blue-500/20 border-4 border-white">
              {(user?.avatarUrl || profile?.avatarUrl) ? (
                <img src={user?.avatarUrl || profile?.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span>{fullName.charAt(0)}</span>
              )}
            </div>
            <span className="absolute bottom-1 right-1 h-5 w-5 rounded-full bg-emerald-500 border-2 border-white" title="Active Account" />
          </div>
          
          <div className="flex-1 text-center md:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <h1 className="text-2xl font-extrabold text-slate-900">{fullName}</h1>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 uppercase tracking-wide">
                Sales Executive
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 font-mono">
                {employeeId}
              </span>
            </div>

            <p className="text-sm font-medium text-slate-600">{organizationName}</p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2">
              {user?.email && (
                <span className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                  <Mail size={14} className="text-blue-500" /> {user.email}
                </span>
              )}
              {profile?.phoneNumber && (
                <span className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                  <Phone size={14} className="text-emerald-500" /> {profile.phoneNumber}
                </span>
              )}
              <span className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                <CalendarDays size={14} className="text-purple-500" /> Joined {joiningDate}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SectionCard title="Executive Organization & Territory" icon={User} iconColor="text-blue-600">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "Employee ID", value: employeeId, icon: Award },
                { label: "Designation", value: "Sales Executive", icon: User },
                { label: "Organization", value: organizationName, icon: Building2 },
                { label: "Territory / Beat", value: profile?.territory?.name || "Central Territory", icon: MapPin },
                { label: "Branch", value: profile?.branch?.name || "Main Branch", icon: Building2 },
                { label: "Department", value: profile?.department?.name || "Field Sales", icon: Building2 },
                { label: "Team", value: profile?.team?.name || "Field Force Team", icon: Activity },
                { label: "Reporting Manager", value: managerName || "Regional Sales Manager", icon: User },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="flex items-center gap-3.5 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center text-blue-600 shadow-sm border border-slate-200/60 flex-shrink-0">
                      <Icon size={18} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium">{item.label}</p>
                      <p className="font-bold text-sm text-slate-800 mt-0.5">{item.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        </div>

        <PerformanceCard
          title="Performance Summary"
          subtitle="Real-time completion metrics"
          icon={Target}
          metrics={performanceMetrics}
        />
      </div>

      {/* Attendance Summary */}
      <SectionCard title="Attendance Summary" icon={CalendarDays} iconColor="text-indigo-600">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5 text-center">
            <p className="text-3xl font-extrabold text-slate-800">{attendanceHistory.length || 1}</p>
            <p className="text-xs font-semibold text-slate-500 mt-1">Total Days</p>
          </div>
          <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-5 text-center">
            <p className="text-3xl font-extrabold text-emerald-600">{attendancePresent}</p>
            <p className="text-xs font-semibold text-emerald-700 mt-1">Present</p>
          </div>
          <div className="rounded-2xl bg-red-50 border border-red-200 p-5 text-center">
            <p className="text-3xl font-extrabold text-red-500">{attendanceAbsent}</p>
            <p className="text-xs font-semibold text-red-600 mt-1">Absent</p>
          </div>
          <div className="rounded-2xl bg-amber-50 border border-amber-200 p-5 text-center">
            <p className="text-3xl font-extrabold text-amber-600">{attendanceLeave}</p>
            <p className="text-xs font-semibold text-amber-700 mt-1">Leave</p>
          </div>
        </div>
      </SectionCard>

      {/* Task & Visit Statistics Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <SectionCard title="Task Statistics" icon={Target} iconColor="text-blue-600">
          <div className="space-y-3">
            <div className="flex justify-between text-sm"><span className="text-slate-500">Total Tasks</span><span className="font-bold text-slate-800">{taskSummary.total}</span></div>
            <div className="flex justify-between text-sm"><span className="text-slate-500">Completed</span><span className="font-bold text-emerald-600">{taskSummary.completed}</span></div>
            <div className="flex justify-between text-sm"><span className="text-slate-500">Pending</span><span className="font-bold text-amber-600">{taskSummary.pending}</span></div>
            <div className="flex justify-between text-sm pt-2 border-t border-slate-100"><span className="text-slate-500 font-semibold">Completion Rate</span><span className="font-extrabold text-blue-600">{taskSummary.completionRate}%</span></div>
          </div>
        </SectionCard>
        
        <SectionCard title="Visits Breakdown" icon={Activity} iconColor="text-emerald-600">
          <div className="space-y-3">
            <div className="flex justify-between text-sm"><span className="text-slate-500">Total Visits</span><span className="font-bold text-slate-800">{visitSummary.total}</span></div>
            <div className="flex justify-between text-sm"><span className="text-slate-500">Completed</span><span className="font-bold text-emerald-600">{visitSummary.completed}</span></div>
            <div className="flex justify-between text-sm"><span className="text-slate-500">Planned</span><span className="font-bold text-blue-600">{visitSummary.planned}</span></div>
            <div className="flex justify-between text-sm pt-2 border-t border-slate-100"><span className="text-slate-500 font-semibold">Visit Rate</span><span className="font-extrabold text-emerald-600">{visitSummary.total > 0 ? Math.round((visitSummary.completed / visitSummary.total) * 100) : 0}%</span></div>
          </div>
        </SectionCard>

        <SectionCard title="Achievements" icon={Award} iconColor="text-amber-600">
          <div className="space-y-3">
            <div className="flex justify-between text-sm"><span className="text-slate-500">Territory</span><span className="font-bold text-slate-800">{profile?.territory?.name || "Central Territory"}</span></div>
            <div className="flex justify-between text-sm"><span className="text-slate-500">Team</span><span className="font-bold text-slate-800">{profile?.team?.name || "Field Force Team"}</span></div>
            <div className="flex justify-between text-sm"><span className="text-slate-500">Manager</span><span className="font-bold text-slate-800">{managerName || "Regional Sales Manager"}</span></div>
          </div>
        </SectionCard>
      </div>
    </motion.div>
  );
}

