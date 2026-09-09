import { useState, useMemo } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Users,
  Eye,
  X,
  Mail,
  Phone,
  Shield,
  Building,
  GitBranch,
  LayoutGrid,
  UserCircle,
  UserCog,
  UserCheck,
  Award,
  CheckCircle,
  AlertTriangle,
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

import UserForm from "./UserForm";
import toast from "react-hot-toast";
import userService from "../../../services/user.service";
import useUsers from "../../../hooks/useUsers";
import useHeadOfSalesDashboard from "../../../hooks/useHeadOfSalesDashboard";
import { useAuth } from "../../../context/AuthContext";

import DashboardHeader from "../../../components/dashboard/DashboardHeader";
import StatsGrid from "../../../components/dashboard/StatsGrid";
import StatCard from "../../../components/dashboard/StatCard";
import SectionCard from "../../../components/dashboard/SectionCard";
import ChartCard from "../../../components/dashboard/ChartCard";

export default function UserList() {
  const { user } = useAuth();
  const isHeadOfSales = useMemo(() => {
    if (!user) return false;
    const roleNames = Array.isArray(user.roles)
      ? user.roles.map((r) => (typeof r === "string" ? r : r.role?.name || r.name))
      : [user.role?.name || ""];
    return roleNames.some((r) => r && r.toLowerCase().includes("head of sales"));
  }, [user]);

  const isSalesManager = useMemo(() => {
    if (!user) return false;
    const roleNames = Array.isArray(user.roles)
      ? user.roles.map((r) => (typeof r === "string" ? r : r.role?.name || r.name))
      : [user.role?.name || ""];
    return roleNames.some((r) => r && r.toLowerCase().includes("sales manager"));
  }, [user]);

  const isCurrentSuperAdmin = useMemo(() => {
    if (!user) return false;
    const roleNames = Array.isArray(user.roles)
      ? user.roles.map((r) => (typeof r === "string" ? r : r.role?.name || r.name))
      : [user.role?.name || ""];
    return roleNames.some((r) => r && r.toLowerCase().includes("super admin"));
  }, [user]);

  const { users, license, loading, search, setSearch, reload } = useUsers({
    debounce: true,
  });

  const licenseQuota = useMemo(() => {
    const max = license?.maxLicenses ?? user?.organization?.maxLicenses ?? 20;
    const consumed = license?.consumedLicenses ?? users?.length ?? 0;
    const available = license?.availableLicenses ?? Math.max(0, max - consumed);
    const isLimitReached = license?.isLimitReached ?? (consumed >= max);
    const percentUsed = Math.min(100, Math.round((consumed / max) * 100));
    return { max, consumed, available, isLimitReached, percentUsed };
  }, [license, users, user]);

  const displayedUsers = useMemo(() => {
    if (!users) return [];
    if (isSalesManager) {
      return users.filter((u) => {
        const uRoleNames = Array.isArray(u.roles)
          ? u.roles.map((r) => (typeof r === "string" ? r : r.role?.name || r.name || ""))
          : [u.role?.name || ""];

        const isWM = uRoleNames.some((r) => r.toLowerCase().includes("warehouse manager") || r.toLowerCase().includes("inventory manager"));
        const isAdmin = uRoleNames.some((r) => r.toLowerCase().includes("admin"));
        if (isWM || isAdmin) return false;

        if (user?.branchId) {
          return u.branchId === user.branchId || u.branch?.id === user.branchId || u.managerId === user.id;
        }
        return true;
      });
    }
    return users;
  }, [users, isSalesManager, user]);

  const { dashboard } = useHeadOfSalesDashboard({ enabled: isHeadOfSales });

  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [viewUser, setViewUser] = useState(null);

  const isTargetSuperAdmin = (userItem) => {
    if (!userItem) return false;
    const roleNames = Array.isArray(userItem.roles)
      ? userItem.roles.map((r) => (typeof r === "string" ? r : r.role?.name || r.name))
      : [userItem.role?.name || ""];
    return roleNames.some((r) => r && r.toLowerCase().includes("super admin"));
  };

  const isTargetCompanyAdmin = (userItem) => {
    if (!userItem) return false;
    const roleNames = Array.isArray(userItem.roles)
      ? userItem.roles.map((r) => (typeof r === "string" ? r : r.role?.name || r.name))
      : [userItem.role?.name || ""];
    return roleNames.some((r) => r && r.toLowerCase().includes("company admin"));
  };

  const hasCompanyAdmin = useMemo(() => {
    if (!users) return false;
    return users.some((u) => isTargetCompanyAdmin(u));
  }, [users]);

  const isTargetSalesExecutive = (userItem) => {
    if (!userItem) return false;
    const roleNames = Array.isArray(userItem.roles)
      ? userItem.roles.map((r) => (typeof r === "string" ? r : r.role?.name || r.name))
      : [userItem.role?.name || ""];
    return roleNames.some((r) => r && r.toLowerCase().includes("sales executive"));
  };

  const canManageUserItem = (userItem) => {
    if (!userItem) return false;

    if (isCurrentSuperAdmin) {
      // Super Admin can manage (edit/delete) his own account AND Company Admin accounts, none other than
      return userItem.id === user?.id || isTargetCompanyAdmin(userItem);
    }

    if (isSalesManager) {
      // Sales Manager CAN delete/edit Sales Executive accounts
      return isTargetSalesExecutive(userItem) && userItem.id !== user?.id;
    }

    // Users cannot edit or delete their own logged-in account
    if (userItem.id === user?.id) return false;
    if (isHeadOfSales) return false;
    if (isTargetSuperAdmin(userItem)) return false;
    // Company Admin cannot edit/delete Company Admin accounts (only Super Admin manages Company Admin)
    if (isTargetCompanyAdmin(userItem)) return false;

    return true;
  };

  const handleDelete = async (userItem) => {
    if (isTargetSuperAdmin(userItem)) {
      toast.error("Super Admin accounts cannot be deleted.");
      return;
    }
    if (!canManageUserItem(userItem)) {
      toast.error("You do not have permission to delete this account");
      return;
    }
    const confirmed = window.confirm(
      `Delete "${userItem.firstName} ${userItem.lastName}" ?`
    );
    if (!confirmed) return;

    try {
      await userService.deleteUser(userItem.id);
      toast.success("User deleted");
      reload();
    } catch (err) {
      console.log(err);
      toast.error("Unable to delete user");
    }
  };

  const handleToggleStatus = async (userItem) => {
    if (!canManageUserItem(userItem)) {
      toast.error("Company Admin cannot modify Super Admin status");
      return;
    }
    try {
      if (userItem.isActive) {
        await userService.deactivateUser(userItem.id);
        toast.success("User deactivated");
      } else {
        await userService.activateUser(userItem.id);
        toast.success("User activated");
      }
      reload();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update status");
    }
  };

  const totalSalesManagers = dashboard?.totalSalesManagers ?? 0;
  const presentSalesManagers = dashboard?.presentSalesManagers ?? 0;
  const totalSalesExecutives = dashboard?.totalSalesExecutives ?? 0;
  const attendance = dashboard?.attendance || { present: 0, absent: 0, leave: 0, rate: 0 };
  const salesManagers = dashboard?.salesManagers || [];
  const salesExecutives = dashboard?.salesExecutives || [];

  const activeUsersCount = useMemo(() => {
    return users?.filter((u) => u.isActive !== false).length || 0;
  }, [users]);

  const getInitials = (firstName, lastName) => {
    return `${(firstName?.[0] || "").toUpperCase()}${(lastName?.[0] || "").toUpperCase()}`;
  };

  const roleDistributionData = useMemo(() => {
    return [
      { name: "Sales Managers", count: totalSalesManagers || salesManagers.length || 1 },
      { name: "Sales Executives", count: totalSalesExecutives || salesExecutives.length || 1 },
      { name: "Present Today", count: presentSalesManagers },
    ];
  }, [totalSalesManagers, totalSalesExecutives, presentSalesManagers, salesManagers, salesExecutives]);

  // Head of Sales Analytics View
  if (isHeadOfSales) {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-8">
        <DashboardHeader
          title="Executive & Manager Analytics"
          subtitle="Sales force headcount, manager hierarchy, role metrics & attendance overview"
          onRefresh={reload}
        />

        <StatsGrid>
          <StatCard title="Sales Force Users" value={users?.length || 0} icon={Users} color="bg-indigo-600" />
          <StatCard title="Active Employees" value={activeUsersCount} icon={CheckCircle} color="bg-emerald-600" />
          <StatCard title="Sales Managers" value={totalSalesManagers || salesManagers.length} icon={UserCheck} color="bg-blue-600" />
          <StatCard title="Sales Executives" value={totalSalesExecutives || salesExecutives.length} icon={UserCog} color="bg-purple-600" />
          <StatCard title="Present Managers Today" value={presentSalesManagers} icon={UserCheck} color="bg-cyan-500" />
          <StatCard title="Attendance Rate" value={attendance.rate || 0} icon={Award} color="bg-green-600" suffix="%" />
        </StatsGrid>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <ChartCard title="Sales Force Role Distribution" subtitle="Headcount by role designation" className="xl:col-span-2">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roleDistributionData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#2563EB" radius={[6, 6, 0, 0]} name="Headcount" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <SectionCard title="Sales Managers Summary" subtitle="Assigned sales managers & teams" icon={UserCheck} iconColor="text-indigo-600">
            {salesManagers.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center">No sales managers assigned.</p>
            ) : (
              <div className="space-y-3">
                {salesManagers.map((m) => (
                  <div key={m.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/70">
                    <div className="flex items-center justify-between">
                      <h5 className="font-semibold text-slate-900 text-sm">{m.name}</h5>
                      <span className="text-xs font-semibold text-indigo-600">{m.executiveCount} Executives</span>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">{m.email} | {m.teamCount} Teams</div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        <SectionCard title="Sales Force User Directory" subtitle="Live user accounts, roles & branch assignments" icon={Users} iconColor="text-blue-600">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map((u) => (
              <div key={u.id} className="p-4 rounded-2xl border border-slate-200 bg-white hover:shadow-md transition space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700 text-sm">
                      {getInitials(u.firstName, u.lastName)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{u.firstName} {u.lastName}</h4>
                      <p className="text-xs text-slate-500">{u.email}</p>
                    </div>
                  </div>
                  <button onClick={() => setViewUser(u)} className="p-2 rounded-lg border hover:bg-slate-50 text-slate-600" title="View Full Record">
                    <Eye size={16} />
                  </button>
                </div>
                <div className="pt-2 border-t text-xs flex justify-between items-center">
                  <span className="text-slate-500">Branch: <strong className="text-slate-800">{u.branch?.name || "-"}</strong></span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${u.isActive !== false ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                    {u.isActive !== false ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* View Modal */}
        {viewUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setViewUser(null)}>
            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <button type="button" onClick={() => setViewUser(null)} className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
                <X size={22} />
              </button>
              <h2 className="text-2xl font-bold text-slate-800 mb-4">{viewUser.firstName} {viewUser.lastName}</h2>
              <div className="space-y-3 text-sm text-slate-700">
                <p><strong>Email:</strong> {viewUser.email}</p>
                <p><strong>Branch:</strong> {viewUser.branch?.name || "-"}</p>
                <p><strong>Status:</strong> {viewUser.isActive !== false ? "Active" : "Inactive"}</p>
                <p><strong>Roles:</strong> {viewUser.roles?.map(r => r.role?.name).join(", ") || "-"}</p>
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
            User Management
          </h1>
          <p className="text-slate-500 mt-1">
            Manage users inside your organization.
          </p>
        </div>

        {!search && !loading && (isCurrentSuperAdmin ? (
          !hasCompanyAdmin ? (
            <button
              onClick={() => {
                if (licenseQuota.isLimitReached) {
                  toast.error("License limit reached. Your organization has consumed all seat licenses. Contact Franchise Administrator.");
                  return;
                }
                setSelectedUser(null);
                setShowModal(true);
              }}
              disabled={licenseQuota.isLimitReached}
              className={`flex items-center gap-2 rounded-xl px-5 py-3 text-white font-semibold transition ${
                licenseQuota.isLimitReached
                  ? "bg-slate-400 cursor-not-allowed opacity-80"
                  : "bg-indigo-600 hover:bg-indigo-700 cursor-pointer shadow-sm"
              }`}
              title={licenseQuota.isLimitReached ? "All seat licenses consumed. Contact Franchise Administrator." : "Create Company Admin"}
            >
              <Plus size={18} />
              Create Company Admin
            </button>
          ) : null
        ) : (
          <button
            onClick={() => {
              if (licenseQuota.isLimitReached) {
                toast.error("License limit reached. Your organization has consumed all seat licenses. Contact Franchise Administrator.");
                return;
              }
              setSelectedUser(null);
              setShowModal(true);
            }}
            disabled={licenseQuota.isLimitReached}
            className={`flex items-center gap-2 rounded-xl px-5 py-3 text-white font-semibold transition ${
              licenseQuota.isLimitReached
                ? "bg-slate-400 cursor-not-allowed opacity-80"
                : "bg-indigo-600 hover:bg-indigo-700 cursor-pointer shadow-sm"
            }`}
            title={licenseQuota.isLimitReached ? "All seat licenses consumed. Contact Franchise Administrator." : "Create User"}
          >
            <Plus size={18} />
            Create User
          </button>
        ))}
      </div>

      {/* License Seat Allocation Banner */}
      <div
        className={`p-4 rounded-2xl border transition-all ${
          licenseQuota.isLimitReached
            ? "bg-red-50/90 border-red-200 text-red-950"
            : licenseQuota.available <= 3
            ? "bg-amber-50/90 border-amber-200 text-amber-950"
            : "bg-slate-50/90 border-slate-200 text-slate-900"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl ${
                licenseQuota.isLimitReached
                  ? "bg-red-100 text-red-700"
                  : licenseQuota.available <= 3
                  ? "bg-amber-100 text-amber-700"
                  : "bg-indigo-100 text-indigo-700"
              }`}
            >
              <Shield size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Organization Seat License Quota
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    licenseQuota.isLimitReached
                      ? "bg-red-200 text-red-800"
                      : licenseQuota.available <= 3
                      ? "bg-amber-200 text-amber-800"
                      : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {licenseQuota.isLimitReached ? "Limit Reached" : `${licenseQuota.available} Seats Available`}
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-800 mt-0.5">
                {licenseQuota.consumed} of {licenseQuota.max} Seats Consumed (1 user = 1 license)
              </p>
            </div>
          </div>

          {licenseQuota.isLimitReached ? (
            <div className="text-xs font-medium text-red-700 bg-red-100/80 border border-red-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
              <AlertTriangle size={14} className="shrink-0" />
              <span>All licenses consumed. Contact your Franchise Administrator to upgrade seats.</span>
            </div>
          ) : (
            <div className="text-xs text-slate-500 font-medium">
              Every created role (Super Admin, Admin, Manager, Sales Executive) counts as 1 seat.
            </div>
          )}
        </div>

        {/* Quota Progress Bar */}
        <div className="w-full bg-slate-200/80 rounded-full h-2 mt-3 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              licenseQuota.isLimitReached
                ? "bg-red-500"
                : licenseQuota.available <= 3
                ? "bg-amber-500"
                : "bg-indigo-600"
            }`}
            style={{ width: `${licenseQuota.percentUsed}%` }}
          />
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={18} className="absolute left-4 top-3.5 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, phone, role, branch, department, team, status..."
          className="w-full rounded-xl border border-slate-300 py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border bg-white">
        <table className="w-full">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-6 py-4 text-left">User</th>
              <th className="px-6 py-4 text-left">Email</th>
              <th className="px-6 py-4 text-left">Roles</th>
              <th className="px-6 py-4 text-left">Branch</th>
              <th className="px-6 py-4 text-center">Status</th>
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="py-16 text-center text-slate-500">
                  Loading users...
                </td>
              </tr>
            ) : displayedUsers.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="flex flex-col items-center justify-center py-16">
                    <Users size={60} className="text-slate-300" />
                    <h3 className="mt-5 text-xl font-semibold text-slate-700">
                      No Users Found
                    </h3>
                    <p className="mt-2 text-slate-500">
                      {search ? `No user records matching "${search}".` : "No user records found."}
                    </p>
                    {!search && (!isCurrentSuperAdmin ? (
                      <button
                        onClick={() => {
                          if (licenseQuota.isLimitReached) {
                            toast.error("License limit reached. Cannot create more users.");
                            return;
                          }
                          setShowModal(true);
                        }}
                        disabled={licenseQuota.isLimitReached}
                        className={`mt-6 rounded-xl px-6 py-3 text-white transition ${
                          licenseQuota.isLimitReached
                            ? "bg-slate-400 cursor-not-allowed opacity-80"
                            : "bg-indigo-600 hover:bg-indigo-700 cursor-pointer"
                        }`}
                      >
                        Create User
                      </button>
                    ) : !hasCompanyAdmin ? (
                      <button
                        onClick={() => {
                          if (licenseQuota.isLimitReached) {
                            toast.error("License limit reached. Cannot create more users.");
                            return;
                          }
                          setShowModal(true);
                        }}
                        disabled={licenseQuota.isLimitReached}
                        className={`mt-6 rounded-xl px-6 py-3 text-white transition ${
                          licenseQuota.isLimitReached
                            ? "bg-slate-400 cursor-not-allowed opacity-80"
                            : "bg-indigo-600 hover:bg-indigo-700 cursor-pointer"
                        }`}
                      >
                        Create Company Admin
                      </button>
                    ) : null)}
                  </div>
                </td>
              </tr>
            ) : (
              displayedUsers.map((userItem) => (
                <tr key={userItem.id} className="border-t hover:bg-slate-50 transition">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-semibold text-sm">
                        {getInitials(userItem.firstName, userItem.lastName)}
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-800">
                          {userItem.firstName} {userItem.lastName}
                        </h4>
                        <p className="text-xs text-slate-400">
                          {userItem.code ? `Code: ${userItem.code}` : ""}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 text-slate-600 text-sm">
                      <Mail size={15} />
                      <span>{userItem.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-wrap gap-1">
                      {userItem.roles?.length > 0 ? (
                        userItem.roles.map((ur) => (
                          <span
                            key={ur.role?.id}
                            className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-700"
                          >
                            <Shield size={11} />
                            {ur.role?.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-slate-400">-</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Building size={15} />
                      <span>{userItem.branch?.name || "-"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    {canManageUserItem(userItem) ? (
                      <button
                        onClick={() => handleToggleStatus(userItem)}
                        title={userItem.isActive ? "Deactivate" : "Activate"}
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition ${
                          userItem.isActive
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-red-100 text-red-700 hover:bg-red-200"
                        }`}
                      >
                        {userItem.isActive ? "Active" : "Inactive"}
                      </button>
                    ) : (
                      <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                        userItem.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}>
                        {userItem.isActive ? "Active" : "Inactive"}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => setViewUser(userItem)} className="rounded-lg border p-2 hover:bg-slate-100" title="View">
                        <Eye size={17} />
                      </button>
                      {canManageUserItem(userItem) && (
                        <>
                          <button onClick={() => { setSelectedUser(userItem); setShowModal(true); }} className="rounded-lg border p-2 hover:bg-slate-100" title="Edit">
                            <Pencil size={17} />
                          </button>
                          {!isTargetSuperAdmin(userItem) && (
                            <button onClick={() => handleDelete(userItem)} className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50" title="Delete">
                              <Trash2 size={17} />
                            </button>
                          )}
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
          <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white p-4 sm:p-8 shadow-2xl my-auto">
            <button type="button" onClick={() => { setShowModal(false); setSelectedUser(null); }} className="absolute right-3 top-3 sm:right-4 sm:top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
              <X size={20} />
            </button>
            <h2 className="mb-4 sm:mb-6 text-xl sm:text-2xl font-bold">{selectedUser ? "Edit User" : "Create User"}</h2>
            <UserForm
              user={selectedUser}
              onClose={() => { setShowModal(false); setSelectedUser(null); }}
              onSuccess={reload}
              isLimitReached={licenseQuota.isLimitReached && !selectedUser}
            />
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto" onClick={() => setViewUser(null)}>
          <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white p-4 sm:p-8 shadow-2xl my-auto" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setViewUser(null)} className="absolute right-3 top-3 sm:right-4 sm:top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
              <X size={20} />
            </button>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-4">{viewUser.firstName} {viewUser.lastName}</h2>
            <div className="space-y-3 text-sm text-slate-700">
              <p><strong>Email:</strong> {viewUser.email}</p>
              <p><strong>Branch:</strong> {viewUser.branch?.name || "-"}</p>
              <p><strong>Roles:</strong> {viewUser.roles?.map(r => r.role?.name).join(", ") || "-"}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
