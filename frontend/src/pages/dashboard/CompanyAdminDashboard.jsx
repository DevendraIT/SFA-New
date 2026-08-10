import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  GitBranch,
  LayoutGrid,
  MapPin,
  Users,
  UserCog,
  ShoppingCart,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { motion } from "framer-motion";
import dayjs from "dayjs";

import { useAuth } from "../../context/AuthContext";
import useBranches from "../../hooks/useBranches";
import useDepartments from "../../hooks/useDepartments";
import useTeams from "../../hooks/useTeams";
import useUsers from "../../hooks/useUsers";

export default function CompanyAdminDashboard() {
  const { user } = useAuth();
  const { branches, loading: loadingBranches } = useBranches();
  const { departments, loading: loadingDepts } = useDepartments();
  const { teams, loading: loadingTeams } = useTeams();
  const { users, loading: loadingUsers } = useUsers();

  const fullName = useMemo(() => {
    if (!user) return "Company Admin";
    return `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "Company Admin";
  }, [user]);

  const activeUsersCount = useMemo(() => {
    return users?.filter((u) => u.isActive !== false).length || 0;
  }, [users]);

  const greetingTime = useMemo(() => {
    const hour = dayjs().hour();
    if (hour < 12) return "morning";
    if (hour < 17) return "afternoon";
    return "evening";
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8 pb-10"
    >
      {/* Hero Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-200 border border-indigo-500/30 backdrop-blur-md">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-300" />
                Company Admin Operations Control Center
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
              Good {greetingTime}, {fullName} 👋
            </h1>
            <p className="text-sm md:text-base text-indigo-200 max-w-xl">
              Manage your company&apos;s branches, departments, teams, and staff directory from a centralized operational workspace.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/10 p-4 rounded-2xl border border-white/10 backdrop-blur-md">
            <div className="p-3 rounded-xl bg-white/10 text-indigo-300">
              <Building2 size={28} />
            </div>
            <div>
              <span className="block text-xs font-semibold text-indigo-200 uppercase tracking-wider">Active Enterprise</span>
              <span className="block text-base font-bold text-white">{user?.organization?.name || user?.organizationName || "Company Organization"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Specific & Focused Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Branches */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
              <GitBranch size={22} />
            </div>
            <Link to="/organization/branch" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
              View All <ArrowRight size={13} />
            </Link>
          </div>
          <div className="mt-4">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Operating Branches</span>
            <h3 className="text-3xl font-bold text-slate-900 mt-1">
              {loadingBranches ? "..." : branches?.length || 0}
            </h3>
            <p className="text-xs text-slate-500 mt-1">Branch locations & facilities</p>
          </div>
        </div>

        {/* Departments */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
              <LayoutGrid size={22} />
            </div>
            <Link to="/organization/department" className="text-xs font-semibold text-purple-600 hover:text-purple-800 flex items-center gap-1">
              View All <ArrowRight size={13} />
            </Link>
          </div>
          <div className="mt-4">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Departments</span>
            <h3 className="text-3xl font-bold text-slate-900 mt-1">
              {loadingDepts ? "..." : departments?.length || 0}
            </h3>
            <p className="text-xs text-slate-500 mt-1">Operational business units</p>
          </div>
        </div>

        {/* Teams */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
              <Users size={22} />
            </div>
            <Link to="/organization/teams" className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 flex items-center gap-1">
              View All <ArrowRight size={13} />
            </Link>
          </div>
          <div className="mt-4">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Teams</span>
            <h3 className="text-3xl font-bold text-slate-900 mt-1">
              {loadingTeams ? "..." : teams?.length || 0}
            </h3>
            <p className="text-xs text-slate-500 mt-1">Assigned team units</p>
          </div>
        </div>

        {/* Users */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-xl bg-cyan-50 text-cyan-600">
              <UserCog size={22} />
            </div>
            <Link to="/organization/users" className="text-xs font-semibold text-cyan-600 hover:text-cyan-800 flex items-center gap-1">
              View All <ArrowRight size={13} />
            </Link>
          </div>
          <div className="mt-4">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Company Users</span>
            <h3 className="text-3xl font-bold text-slate-900 mt-1">
              {loadingUsers ? "..." : activeUsersCount}
            </h3>
            <p className="text-xs text-slate-500 mt-1">Active staff & personnel</p>
          </div>
        </div>
      </div>

      {/* Quick Access Operations Hub */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-indigo-600" />
          Company Operations Management Hub
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Branch Operations */}
          <Link
            to="/organization/branch"
            className="p-6 rounded-2xl border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-md transition group"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition">
                <GitBranch size={22} />
              </div>
              <ArrowRight size={18} className="text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-4 group-hover:text-indigo-600 transition">
              Branch Management
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Create, edit, and configure operating branches, assign departments, and manage branch staff.
            </p>
          </Link>

          {/* Department Operations */}
          <Link
            to="/organization/department"
            className="p-6 rounded-2xl border border-slate-200 bg-white hover:border-purple-300 hover:shadow-md transition group"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition">
                <LayoutGrid size={22} />
              </div>
              <ArrowRight size={18} className="text-slate-400 group-hover:text-purple-600 group-hover:translate-x-1 transition" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-4 group-hover:text-purple-600 transition">
              Department Management
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Set up business departments, define departmental codes, and oversee team assignments.
            </p>
          </Link>

          {/* Territory Operations */}
          <Link
            to="/organization/territory"
            className="p-6 rounded-2xl border border-slate-200 bg-white hover:border-blue-300 hover:shadow-md transition group"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition">
                <MapPin size={22} />
              </div>
              <ArrowRight size={18} className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-4 group-hover:text-blue-600 transition">
              Territory Management
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Define operational territories, assign geographic coverage, and connect branches.
            </p>
          </Link>

          {/* Teams Operations */}
          <Link
            to="/organization/teams"
            className="p-6 rounded-2xl border border-slate-200 bg-white hover:border-emerald-300 hover:shadow-md transition group"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition">
                <Users size={22} />
              </div>
              <ArrowRight size={18} className="text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-4 group-hover:text-emerald-600 transition">
              Team Management
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Create execution teams, assign sales managers and executives, and configure team units.
            </p>
          </Link>

          {/* User & Staff Governance */}
          <Link
            to="/organization/users"
            className="p-6 rounded-2xl border border-slate-200 bg-white hover:border-cyan-300 hover:shadow-md transition group"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-cyan-50 text-cyan-600 group-hover:bg-cyan-600 group-hover:text-white transition">
                <UserCog size={22} />
              </div>
              <ArrowRight size={18} className="text-slate-400 group-hover:text-cyan-600 group-hover:translate-x-1 transition" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-4 group-hover:text-cyan-600 transition">
              User Directory & Roles
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Register company personnel, assign roles, manage branch affiliations, and oversee user access.
            </p>
          </Link>

          {/* Sales Orders */}
          <Link
            to="/orders"
            className="p-6 rounded-2xl border border-slate-200 bg-white hover:border-amber-300 hover:shadow-md transition group"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition">
                <ShoppingCart size={22} />
              </div>
              <ArrowRight size={18} className="text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1 transition" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-4 group-hover:text-amber-600 transition">
              Sales Orders Management
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Monitor customer sales orders, view order pricing, items, and branch order fulfillment.
            </p>
          </Link>
        </div>
      </div>

      {/* Operational Status Banner */}
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-600 text-white">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <h4 className="font-bold text-emerald-900 text-base">Company Operational Hierarchy Healthy</h4>
            <p className="text-xs text-emerald-700 mt-0.5">
              All branch structures, departments, and user roles are active under IT Software.
            </p>
          </div>
        </div>
        <Link
          to="/organization/organization"
          className="px-4 py-2 rounded-xl bg-white border border-emerald-300 text-emerald-800 font-semibold text-xs hover:bg-emerald-100 transition"
        >
          View Organization Profile
        </Link>
      </div>
    </motion.div>
  );
}
