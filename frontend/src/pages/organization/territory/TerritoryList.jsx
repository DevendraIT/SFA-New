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

  const isHeadOfSales = useMemo(() => {
    if (!user) return false;
    const roleNames = Array.isArray(user.roles)
      ? user.roles.map((r) => (typeof r === "string" ? r : r.role?.name || r.name))
      : [user.role?.name || ""];
    return roleNames.some((r) => r && r.toLowerCase().includes("head of sales"));
  }, [user]);

  const handleDelete = async (territory) => {
    if (isHeadOfSales) return;
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

        {!isHeadOfSales && (
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
          placeholder="Search by territory name..."
          className="w-full rounded-xl border border-slate-300 py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border bg-white">
        <table className="w-full">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-6 py-4 text-left">Territory</th>
              <th className="px-6 py-4 text-left">Code</th>
              <th className="px-6 py-4 text-left">Department</th>
              <th className="px-6 py-4 text-center">Branches</th>
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="py-16 text-center text-slate-500">
                  Loading territories...
                </td>
              </tr>
            ) : territories.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <div className="flex flex-col items-center justify-center py-16">
                    <MapPin size={60} className="text-slate-300" />
                    <h3 className="mt-5 text-xl font-semibold text-slate-700">
                      No Territories Found
                    </h3>
                    <p className="mt-2 text-slate-500">
                      Create your first territory to get started.
                    </p>
                    {!isHeadOfSales && (
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
              territories.map((territory) => (
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
                      <LayoutGrid size={15} className="text-slate-400" />
                      <span className="text-slate-700">{territory.department?.name || "-"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">{territory._count?.branches ?? 0}</td>
                  <td className="px-6 py-5">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => setViewTerritory(territory)} className="rounded-lg border p-2 hover:bg-slate-100" title="View">
                        <Eye size={17} />
                      </button>
                      {!isHeadOfSales && (
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

      {viewTerritory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setViewTerritory(null)}>
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setViewTerritory(null)} className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
              <X size={22} />
            </button>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">{viewTerritory.name}</h2>
            <div className="space-y-3 text-sm text-slate-700">
              <p><strong>Code:</strong> {viewTerritory.code || "-"}</p>
              <p><strong>Department:</strong> {viewTerritory.department?.name || "-"}</p>
              <p><strong>Description:</strong> {viewTerritory.description || "-"}</p>
              <p><strong>Branches:</strong> {viewTerritory._count?.branches ?? 0}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
