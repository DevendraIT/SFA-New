import { useState, useMemo } from "react";
import { Plus, Search, Pencil, Trash2, GitBranch, Eye, X, Building, Users, LayoutGrid, MapPin } from "lucide-react";
import { motion } from "framer-motion";

import TerritoryForm from "./TerritoryForm";
import toast from "react-hot-toast";
import territoryService from "../../../services/territory.service";
import useTerritories from "../../../hooks/useTerritories";
import { useAuth } from "../../../context/AuthContext";

export default function TerritoryList() {
  const { user } = useAuth();
  
  const { territories, loading, search, setSearch, reload } = useTerritories({ debounce: true });
  
  const [showModal, setShowModal] = useState(false);
  const [selectedTerritory, setSelectedTerritory] = useState(null);
  const [viewTerritory, setViewTerritory] = useState(null);

  const isSalesManager = useMemo(() => {
    if (!user) return false;
    const roleNames = Array.isArray(user.roles)
      ? user.roles.map((r) => (typeof r === "string" ? r : r.role?.name || r.name))
      : [user.role?.name || ""];
    return roleNames.some((r) => r && r.toLowerCase().includes("sales manager"));
  }, [user]);

  const canManageTerritory = useMemo(() => {
    if (!user) return false;
    const roleNames = Array.isArray(user.roles)
      ? user.roles.map((r) => (typeof r === "string" ? r : r.role?.name || r.name))
      : [user.role?.name || ""];
    const isSuperAdmin = roleNames.some((r) => r && r.toLowerCase().includes("super admin"));
    if (isSuperAdmin) return false;
    const isCompanyAdmin = roleNames.some((r) => r && (r.toLowerCase() === "admin" || r.toLowerCase().includes("company admin")));
    return isCompanyAdmin;
  }, [user]);

  const displayedTerritories = useMemo(() => {
    if (!territories) return [];
    if (isSalesManager) {
      return territories.filter((t) => {
        if (user?.territoryId && t.id === user.territoryId) return true;
        if (user?.branchId && Array.isArray(t.branches)) {
          const match = t.branches.some((b) => b.id === user.branchId || b.branchId === user.branchId || b.name === user.branch?.name);
          if (match) return true;
        }
        if (user?.branch?.territoryId && t.id === user.branch.territoryId) return true;
        // If branch name is linked
        if (user?.branch?.name && Array.isArray(t.branches)) {
          return t.branches.some((b) => b.name === user.branch.name);
        }
        return true;
      });
    }
    return territories;
  }, [territories, isSalesManager, user]);

  const handleDelete = async (territory) => {
    if (!canManageTerritory) return;
    const confirmed = window.confirm(`Delete "${territory.name}" ?`);
    if (!confirmed) return;

    try {
      await territoryService.deleteTerritory(territory.id);
      toast.success("Territory deleted");
      reload();
    } catch (err) {
      console.log(err);
      toast.error("Unable to delete territory");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            Territory Management
          </h1>
          <p className="text-slate-500 mt-1">
            Manage territories inside your departments.
          </p>
        </div>

        {!search && canManageTerritory && (
          <button
            onClick={() => {
              setSelectedTerritory(null);
              setShowModal(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-white hover:bg-indigo-700 transition"
          >
            <Plus size={18} />
            Create Territory
          </button>
        )}
      </div>

      <div className="relative max-w-md">
        <Search size={18} className="absolute left-4 top-3.5 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by territory, code, department, branch, team..."
          className="w-full rounded-xl border border-slate-300 py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[700px]">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-6 py-4 text-left">Territory</th>
              <th className="px-6 py-4 text-left">Code</th>
              <th className="px-6 py-4 text-left">Organization</th>
              <th className="px-6 py-4 text-left">Department</th>
              <th className="px-6 py-4 text-center">Branches</th>
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="py-16 text-center text-slate-500">
                  Loading territories...
                </td>
              </tr>
            ) : displayedTerritories.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="flex flex-col items-center justify-center py-16">
                    <MapPin size={60} className="text-slate-300" />
                    <h3 className="mt-5 text-xl font-semibold text-slate-700">
                      No Territories Found
                    </h3>
                    <p className="mt-2 text-slate-500">
                      {search ? `No territories matching "${search}".` : "No territory records assigned to your branch."}
                    </p>
                    {!search && canManageTerritory && (
                      <button
                        onClick={() => setShowModal(true)}
                        className="mt-6 rounded-xl bg-indigo-600 px-6 py-3 text-white hover:bg-indigo-700"
                      >
                        Create Territory
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              displayedTerritories.map((territory) => (
                <tr key={territory.id} className="border-t hover:bg-slate-50 transition">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-indigo-50 p-2">
                        <MapPin size={18} className="text-indigo-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-800">{territory.name}</h4>
                        <p className="text-sm text-slate-500">
                          Created {territory.createdAt ? new Date(territory.createdAt).toLocaleDateString() : "-"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-slate-600">{territory.code || "-"}</td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <Building size={15} className="text-slate-400" />
                      <span className="text-slate-700 font-medium">{territory.organization?.name || "-"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <LayoutGrid size={15} className="text-slate-400" />
                      <span className="text-slate-700">{territory.department?.name || "-"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <GitBranch size={15} className="text-slate-400" />
                      <span className="font-semibold text-slate-800">{territory._count?.branches ?? territory.branches?.length ?? 0}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => setViewTerritory(territory)} className="rounded-lg border p-2 hover:bg-slate-100" title="View">
                        <Eye size={17} />
                      </button>
                      {canManageTerritory && (
                        <>
                          <button onClick={() => { setSelectedTerritory(territory); setShowModal(true); }} className="rounded-lg border p-2 hover:bg-slate-100" title="Edit">
                            <Pencil size={17} />
                          </button>
                          <button onClick={() => handleDelete(territory)} className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50" title="Delete">
                            <Trash2 size={17} />
                          </button>
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

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Total Territories : <span className="ml-2 font-semibold text-slate-800">{territories?.length || 0}</span>
        </p>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl">
            <button type="button" onClick={() => { setShowModal(false); setSelectedTerritory(null); }} className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
              <X size={22} />
            </button>
            <h2 className="mb-6 text-2xl font-bold">{selectedTerritory ? "Edit Territory" : "Create Territory"}</h2>
            <TerritoryForm territory={selectedTerritory} onClose={() => { setShowModal(false); setSelectedTerritory(null); }} onSuccess={reload} />
          </div>
        </div>
      )}

      {/* Rich Enterprise Territory View Details Modal */}
      {viewTerritory && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setViewTerritory(null)}
        >
          <div
            className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl bg-white shadow-2xl transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Hero Banner Header */}
            <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-6 md:p-8 relative">
              <button
                type="button"
                onClick={() => setViewTerritory(null)}
                className="absolute right-5 top-5 rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white transition"
              >
                <X size={20} />
              </button>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-indigo-300">
                    <MapPin size={32} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">Territory Details</span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {viewTerritory.isActive !== false ? "Active Territory" : "Inactive"}
                      </span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-white mt-1">{viewTerritory.name}</h2>
                    <p className="text-sm text-indigo-200 mt-0.5">Code: {viewTerritory.code || "N/A"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-indigo-200 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
                    Org: {viewTerritory.organization?.name || "IT Software"}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-slate-50 border-b border-slate-100">
              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
                <span className="block text-xs font-semibold text-slate-500 uppercase">Department</span>
                <span className="block text-base font-bold text-slate-800 mt-1 truncate">{viewTerritory.department?.name || "-"}</span>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
                <span className="block text-xs font-semibold text-slate-500 uppercase">Operating Branches</span>
                <span className="block text-base font-bold text-slate-800 mt-1">{viewTerritory._count?.branches ?? viewTerritory.branches?.length ?? 0} Branches</span>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
                <span className="block text-xs font-semibold text-slate-500 uppercase">Active Teams</span>
                <span className="block text-base font-bold text-indigo-600 mt-1">{viewTerritory._count?.teams ?? viewTerritory.teams?.length ?? 0} Teams</span>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
                <span className="block text-xs font-semibold text-slate-500 uppercase">Field Strength</span>
                <span className="block text-base font-bold text-emerald-600 mt-1">{viewTerritory._count?.users ?? viewTerritory.users?.length ?? 0} Personnel</span>
              </div>
            </div>

            {/* Scrollable Main Content */}
            <div className="p-6 md:p-8 space-y-6 max-h-[55vh] overflow-y-auto">
              {/* General Info */}
              <div>
                <h3 className="text-base font-semibold text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-indigo-600" />
                  General Territory Attributes
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-sm">
                  <div>
                    <span className="block text-xs font-semibold text-slate-400 uppercase">Territory ID</span>
                    <span className="font-mono text-xs text-slate-700 bg-slate-100 px-2 py-1 rounded inline-block mt-1">{viewTerritory.id}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-slate-400 uppercase">Territory Code</span>
                    <span className="font-semibold text-slate-800 mt-1 block">{viewTerritory.code || "-"}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-slate-400 uppercase">Description</span>
                    <span className="font-semibold text-slate-800 mt-1 block">{viewTerritory.description || "N/A"}</span>
                  </div>
                </div>
              </div>

              {/* Connected Branches */}
              {viewTerritory.branches?.length > 0 && (
                <div>
                  <h3 className="text-base font-semibold text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-indigo-600" />
                    Covered Branches ({viewTerritory.branches.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {viewTerritory.branches.map((b) => (
                      <div key={b.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-slate-800 text-sm block">{b.name}</span>
                          <span className="text-xs text-slate-500">Code: {b.code || "-"}</span>
                        </div>
                        {b.city && <span className="text-xs text-slate-600 bg-white px-2 py-0.5 rounded border">{b.city}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Connected Teams */}
              {viewTerritory.teams?.length > 0 && (
                <div>
                  <h3 className="text-base font-semibold text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-600" />
                    Territory Teams ({viewTerritory.teams.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {viewTerritory.teams.map((t) => (
                      <div key={t.id} className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between shadow-xs">
                        <div>
                          <span className="font-semibold text-slate-800 text-sm">{t.name}</span>
                          {t.description && <p className="text-xs text-slate-500 mt-0.5">{t.description}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex justify-end">
              <button
                type="button"
                onClick={() => setViewTerritory(null)}
                className="px-6 py-2.5 rounded-xl bg-slate-800 text-white font-medium text-sm hover:bg-slate-900 transition"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
