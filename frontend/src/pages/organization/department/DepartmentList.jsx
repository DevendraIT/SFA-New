import { useState, useMemo } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  GitBranch,
  Eye,
  X,
  Building,
  Users,
  LayoutGrid,
  ClipboardCheck,
  Clock3,
  IndianRupee,
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

import DepartmentForm from "./DepartmentForm";
import toast from "react-hot-toast";
import departmentService from "../../../services/department.service";
import useDepartments from "../../../hooks/useDepartments";
import useHeadOfSalesDashboard from "../../../hooks/useHeadOfSalesDashboard";
import { useAuth } from "../../../context/AuthContext";

import DashboardHeader from "../../../components/dashboard/DashboardHeader";
import StatsGrid from "../../../components/dashboard/StatsGrid";
import StatCard from "../../../components/dashboard/StatCard";
import SectionCard from "../../../components/dashboard/SectionCard";
import ChartCard from "../../../components/dashboard/ChartCard";

export default function DepartmentList() {
  const { user } = useAuth();
  const isHeadOfSales = useMemo(() => {
    if (!user) return false;
    const roleNames = Array.isArray(user.roles)
      ? user.roles.map((r) => (typeof r === "string" ? r : r.role?.name || r.name))
      : [user.role?.name || ""];
    return roleNames.some((r) => r && r.toLowerCase().includes("head of sales"));
  }, [user]);

  const { departments, loading, search, setSearch, reload } = useDepartments({
    debounce: true,
  });

  const { dashboard } = useHeadOfSalesDashboard();

  const [showModal, setShowModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [viewDepartment, setViewDepartment] = useState(null);

  const handleDelete = async (dept) => {
    if (isHeadOfSales) return;
    const confirmed = window.confirm(`Delete "${dept.name}" ?`);
    if (!confirmed) return;

    try {
      await departmentService.deleteDepartment(dept.id);
      toast.success("Department deleted");
      reload();
    } catch (err) {
      console.log(err);
      toast.error("Unable to delete department");
    }
  };

  const revenue = dashboard?.revenue ?? 0;
  const completedVisits = dashboard?.completedVisits ?? 0;
  const pendingVisits = dashboard?.pendingVisits ?? 0;

  const totalTeamsCount = useMemo(() => {
    return departments?.reduce((sum, d) => sum + (d._count?.teams || 0), 0) || 0;
  }, [departments]);

  const totalUsersCount = useMemo(() => {
    return departments?.reduce((sum, d) => sum + (d._count?.users || 0), 0) || 0;
  }, [departments]);

  const departmentChartData = useMemo(() => {
    if (!departments || departments.length === 0) return [];
    return departments.map((d) => ({
      name: d.name,
      teams: d._count?.teams || 0,
      users: d._count?.users || 0,
    }));
  }, [departments]);

  // Head of Sales Analytics View
  if (isHeadOfSales) {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-8">
        <DashboardHeader
          title="Department Analytics & Insights"
          subtitle="Department-wise team allocations, employee capacity & operational trends"
          onRefresh={reload}
        />

        <StatsGrid>
          <StatCard title="Total Departments" value={departments?.length || 0} icon={LayoutGrid} color="bg-indigo-600" />
          <StatCard title="Assigned Teams" value={totalTeamsCount} icon={Users} color="bg-purple-600" />
          <StatCard title="Department Employees" value={totalUsersCount} icon={Users} color="bg-blue-600" />
          <StatCard title="Completed Visits" value={completedVisits} icon={ClipboardCheck} color="bg-emerald-600" />
          <StatCard title="Pending Visits" value={pendingVisits} icon={Clock3} color="bg-amber-500" />
          <StatCard title="Department Revenue" value={revenue} icon={IndianRupee} color="bg-green-600" format="currency" />
        </StatsGrid>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <ChartCard title="Department Team & Employee Distribution" subtitle="Resource allocation across departments" className="xl:col-span-2">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="teams" fill="#8B5CF6" radius={[6, 6, 0, 0]} name="Teams" />
                  <Bar dataKey="users" fill="#3B82F6" radius={[6, 6, 0, 0]} name="Employees" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <SectionCard title="Department Overview" subtitle="Operational capacity per department" icon={Award} iconColor="text-amber-500">
            {departments.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center">No departments registered.</p>
            ) : (
              <div className="space-y-3">
                {departments.map((d) => (
                  <div key={d.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/70">
                    <div className="flex items-center justify-between">
                      <h5 className="font-semibold text-slate-900 text-sm">{d.name}</h5>
                    </div>
                    <div className="flex justify-between items-center mt-2 text-xs text-slate-500">
                      <span>Code: {d.code || "-"}</span>
                      <span className="font-semibold text-slate-800">{d._count?.users || 0} Staff | {d._count?.teams || 0} Teams</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        <SectionCard title="Department Detailed Insights" subtitle="Live department directory & hierarchy" icon={LayoutGrid} iconColor="text-indigo-600">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments.map((dept) => (
              <div key={dept.id} className="p-4 rounded-2xl border border-slate-200 bg-white hover:shadow-md transition space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
                      <LayoutGrid size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-base">{dept.name}</h4>
                      <p className="text-xs text-slate-500">{dept.organization?.name || "-"}</p>
                    </div>
                  </div>
                  <button onClick={() => setViewDepartment(dept)} className="p-2 rounded-lg border hover:bg-slate-50 text-slate-600" title="View Full Record">
                    <Eye size={16} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t text-xs">
                  <div>
                    <span className="text-slate-400 block">Teams</span>
                    <span className="font-bold text-slate-800 text-sm">{dept._count?.teams ?? 0}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Users</span>
                    <span className="font-bold text-slate-800 text-sm">{dept._count?.users ?? 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* View Modal */}
        {viewDepartment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setViewDepartment(null)}>
            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <button type="button" onClick={() => setViewDepartment(null)} className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
                <X size={22} />
              </button>
              <h2 className="text-2xl font-bold text-slate-800 mb-4">{viewDepartment.name}</h2>
              <div className="space-y-3 text-sm text-slate-700">
                <p><strong>Code:</strong> {viewDepartment.code || "-"}</p>
                <p><strong>Organization:</strong> {viewDepartment.organization?.name || "-"}</p>
                <p><strong>Description:</strong> {viewDepartment.description || "-"}</p>
                <p><strong>Teams:</strong> {viewDepartment._count?.teams ?? 0}</p>
                <p><strong>Users:</strong> {viewDepartment._count?.users ?? 0}</p>
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
            Department Management
          </h1>
          <p className="text-slate-500 mt-1">
            Manage departments inside your organization.
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedDepartment(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-white hover:bg-indigo-700 transition"
        >
          <Plus size={18} />
          Create Department
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={18} className="absolute left-4 top-3.5 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by department name..."
          className="w-full rounded-xl border border-slate-300 py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border bg-white">
        <table className="w-full">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-6 py-4 text-left">Department</th>
              <th className="px-6 py-4 text-left">Code</th>
              <th className="px-6 py-4 text-left">Organization</th>
              <th className="px-6 py-4 text-center">Teams</th>
              <th className="px-6 py-4 text-center">Users</th>
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="py-16 text-center text-slate-500">
                  Loading departments...
                </td>
              </tr>
            ) : departments.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="flex flex-col items-center justify-center py-16">
                    <LayoutGrid size={60} className="text-slate-300" />
                    <h3 className="mt-5 text-xl font-semibold text-slate-700">
                      No Departments Found
                    </h3>
                    <p className="mt-2 text-slate-500">
                      Create your first department to get started.
                    </p>
                    <button
                      onClick={() => setShowModal(true)}
                      className="mt-6 rounded-xl bg-indigo-600 px-6 py-3 text-white hover:bg-indigo-700"
                    >
                      Create Department
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              departments.map((dept) => (
                <tr key={dept.id} className="border-t hover:bg-slate-50 transition">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-indigo-50 p-2">
                        <LayoutGrid size={18} className="text-indigo-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-800">{dept.name}</h4>
                        <p className="text-sm text-slate-500">
                          Created {dept.createdAt ? new Date(dept.createdAt).toLocaleDateString() : "-"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-slate-600">{dept.code || "-"}</td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <Building size={15} className="text-slate-400" />
                      <span className="text-slate-700">{dept.organization?.name || "-"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">{dept._count?.teams ?? 0}</td>
                  <td className="px-6 py-5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Users size={15} className="text-slate-400" />
                      <span>{dept._count?.users ?? 0}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => setViewDepartment(dept)} className="rounded-lg border p-2 hover:bg-slate-100" title="View">
                        <Eye size={17} />
                      </button>
                      <button onClick={() => { setSelectedDepartment(dept); setShowModal(true); }} className="rounded-lg border p-2 hover:bg-slate-100" title="Edit">
                        <Pencil size={17} />
                      </button>
                      <button onClick={() => handleDelete(dept)} className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50" title="Delete">
                        <Trash2 size={17} />
                      </button>
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
          Total Departments : <span className="ml-2 font-semibold text-slate-800">{departments?.length || 0}</span>
        </p>
      </div>

      {/* Statistics */}
      <div className="grid gap-5 md:grid-cols-3">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h4 className="text-sm text-slate-500">Total Departments</h4>
          <h2 className="mt-2 text-3xl font-bold">{departments?.length || 0}</h2>
        </div>
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h4 className="text-sm text-slate-500">Total Teams</h4>
          <h2 className="mt-2 text-3xl font-bold">{totalTeamsCount}</h2>
        </div>
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h4 className="text-sm text-slate-500">Total Users</h4>
          <h2 className="mt-2 text-3xl font-bold">{totalUsersCount}</h2>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl">
            <button type="button" onClick={() => { setShowModal(false); setSelectedDepartment(null); }} className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
              <X size={22} />
            </button>
            <h2 className="mb-6 text-2xl font-bold">{selectedDepartment ? "Edit Department" : "Create Department"}</h2>
            <DepartmentForm department={selectedDepartment} onClose={() => { setShowModal(false); setSelectedDepartment(null); }} onSuccess={reload} />
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewDepartment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setViewDepartment(null)}>
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setViewDepartment(null)} className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
              <X size={22} />
            </button>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">{viewDepartment.name}</h2>
            <div className="space-y-3 text-sm text-slate-700">
              <p><strong>Code:</strong> {viewDepartment.code || "-"}</p>
              <p><strong>Organization:</strong> {viewDepartment.organization?.name || "-"}</p>
              <p><strong>Description:</strong> {viewDepartment.description || "-"}</p>
              <p><strong>Teams:</strong> {viewDepartment._count?.teams ?? 0}</p>
              <p><strong>Users:</strong> {viewDepartment._count?.users ?? 0}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
