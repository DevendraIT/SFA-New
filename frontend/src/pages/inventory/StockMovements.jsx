import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Activity,
  Search,
  Filter,
  Eye,
  X,
  Warehouse,
  Package,
  User,
  ArrowUpRight,
  ArrowDownRight,
  RotateCw,
  Lock,
  Clock,
  Layers,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

import inventoryApi from "../../api/inventory.api";

export default function StockMovements() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [movements, setMovements] = useState([]);
  const [warehouses, setWarehouses] = useState([]);

  // Search & Filter state
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [warehouseFilter, setWarehouseFilter] = useState("ALL");

  // Modal
  const [viewMovement, setViewMovement] = useState(null);

  // Load Movements and Warehouses
  const fetchData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [mvtRes, whRes] = await Promise.all([
        inventoryApi.getStockMovements().catch((err) => { console.error("Error fetching stock movements:", err); return { data: { data: { movements: [] } } }; }),
        inventoryApi.getWarehouses().catch((err) => { console.error("Error fetching warehouses:", err); return { data: { data: [] } }; }),
      ]);

      const fetchedMovements = mvtRes.data?.data?.movements || mvtRes.data?.movements || (Array.isArray(mvtRes.data?.data) ? mvtRes.data.data : []);
      const fetchedWarehouses = whRes.data?.data?.warehouses || whRes.data?.warehouses || (Array.isArray(whRes.data?.data) ? whRes.data.data : []);

      setMovements(fetchedMovements);
      setWarehouses(fetchedWarehouses);

      if (isManualRefresh) toast.success("Audit log refreshed");
    } catch (err) {
      console.error("Error loading stock movements:", err);
      toast.error("Failed to load stock movement audit log");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtered Movements
  const filteredMovements = useMemo(() => {
    return movements.filter((mvt) => {
      const prodName = mvt.product?.name || "";
      const prodSku = mvt.product?.sku || "";
      const whName = mvt.warehouse?.name || "";
      const mvtId = mvt.id || "";
      const refId = mvt.referenceId || "";
      const actorName = mvt.user ? `${mvt.user.firstName} ${mvt.user.lastName}` : mvt.performedBy?.name || "";

      const matchesSearch =
        !search ||
        prodName.toLowerCase().includes(search.toLowerCase()) ||
        prodSku.toLowerCase().includes(search.toLowerCase()) ||
        whName.toLowerCase().includes(search.toLowerCase()) ||
        mvtId.toLowerCase().includes(search.toLowerCase()) ||
        refId.toLowerCase().includes(search.toLowerCase()) ||
        actorName.toLowerCase().includes(search.toLowerCase());

      const matchesType =
        typeFilter === "ALL" || mvt.type === typeFilter;

      const matchesWarehouse =
        warehouseFilter === "ALL" || mvt.warehouseId === warehouseFilter;

      return matchesSearch && matchesType && matchesWarehouse;
    });
  }, [movements, search, typeFilter, warehouseFilter]);

  // Summary Metrics (dynamically calculated from filtered movements)
  const metrics = useMemo(() => {
    const totalCount = filteredMovements.length;
    let unitsAdded = 0;
    let unitsReduced = 0;
    let unitsReserved = 0;

    filteredMovements.forEach((m) => {
      const qty = Math.abs(m.quantity || 0);
      if (m.type === "ADD" || m.type === "RETURN") {
        unitsAdded += qty;
      } else if (m.type === "REDUCE" || m.type === "ISSUE" || m.type === "CONSUME") {
        unitsReduced += qty;
      } else if (m.type === "RESERVE") {
        unitsReserved += qty;
      }
    });

    return { totalCount, unitsAdded, unitsReduced, unitsReserved };
  }, [filteredMovements]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Stock Movements Ledger</h1>
          <p className="text-slate-500 text-sm mt-1">
            Read-only inventory audit log tracking stock additions, reductions, dispatches, and reservations.
          </p>
        </div>

        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 self-start md:self-auto px-4 py-2.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-medium text-sm rounded-xl shadow-xs hover:bg-slate-50 transition"
        >
          <RotateCw size={16} className={refreshing ? "animate-spin text-indigo-600" : "text-slate-500"} />
          {refreshing ? "Refreshing..." : "Refresh Log"}
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Audit Logs</span>
            <h3 className="text-2xl font-extrabold text-slate-800 mt-0.5">{metrics.totalCount}</h3>
            <span className="text-[11px] text-slate-500">Transacted movements</span>
          </div>
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
            <Activity size={22} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Stock Added</span>
            <h3 className="text-2xl font-extrabold text-emerald-600 mt-0.5">+{metrics.unitsAdded}</h3>
            <span className="text-[11px] text-slate-500">Units added / returned</span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
            <ArrowUpRight size={22} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Stock Reduced / Issued</span>
            <h3 className="text-2xl font-extrabold text-amber-600 mt-0.5">-{metrics.unitsReduced}</h3>
            <span className="text-[11px] text-slate-500">Units reduced / dispatched</span>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
            <ArrowDownRight size={22} />
          </div>
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative w-full md:w-80">
          <Search size={18} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search product, SKU, warehouse, actor, reference..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Movement Types</option>
              <option value="ADD">ADD (+)</option>
              <option value="REDUCE">REDUCE (-)</option>
              <option value="ISSUE">ISSUE (Dispatch)</option>
              <option value="RETURN">RETURN</option>
              <option value="RESERVE">RESERVE</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Warehouse size={16} className="text-slate-400" />
            <select
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Warehouses</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stock Movements Audit Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Movement Type</th>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Warehouse & Branch</th>
                <th className="px-6 py-4 text-center">Quantity</th>
                <th className="px-6 py-4">Actor / Performed By</th>
                <th className="px-6 py-4">Reference & Notes</th>
                <th className="px-6 py-4 text-center">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading inventory audit ledger...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Activity size={40} className="mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-700">No stock movements found</p>
                    <p className="text-xs text-slate-400 mt-1">Stock operations will automatically generate audit logs here.</p>
                  </td>
                </tr>
              ) : (
                filteredMovements.map((mvt) => {
                  let typeBadge = (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      {mvt.type}
                    </span>
                  );

                  if (mvt.type === "ADD") {
                    typeBadge = (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <ArrowUpRight size={12} /> ADD
                      </span>
                    );
                  } else if (mvt.type === "REDUCE") {
                    typeBadge = (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <ArrowDownRight size={12} /> REDUCE
                      </span>
                    );
                  } else if (mvt.type === "ISSUE") {
                    typeBadge = (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                        <ArrowDownRight size={12} /> ISSUE
                      </span>
                    );
                  } else if (mvt.type === "RETURN") {
                    typeBadge = (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        <RotateCw size={12} /> RETURN
                      </span>
                    );
                  } else if (mvt.type === "RESERVE") {
                    typeBadge = (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        <Lock size={12} /> RESERVE
                      </span>
                    );
                  }

                  const actorName = mvt.user
                    ? `${mvt.user.firstName} ${mvt.user.lastName}`
                    : mvt.performedBy?.name || "System";

                  const branchName = mvt.warehouse?.branches?.[0]?.name || "Central Branch";

                  return (
                    <tr key={mvt.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-6 py-4 text-xs font-mono text-slate-500 whitespace-nowrap">
                        {new Date(mvt.createdAt).toLocaleString()}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">{typeBadge}</td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <Package size={18} className="text-indigo-600 shrink-0" />
                          <div>
                            <span className="font-bold text-slate-800 block text-xs">{mvt.product?.name || "Product"}</span>
                            <span className="font-mono text-[11px] text-slate-400 block">{mvt.product?.sku}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-800 text-xs block">{mvt.warehouse?.name || "Warehouse"}</span>
                        <span className="text-[11px] text-slate-500 block">{branchName}</span>
                      </td>

                      <td className="px-6 py-4 text-center font-extrabold text-slate-800 text-base">
                        {mvt.type === "REDUCE" || mvt.type === "ISSUE" ? `-${mvt.quantity}` : `+${mvt.quantity}`}
                      </td>

                      <td className="px-6 py-4">
                        <span className="font-semibold text-slate-800 text-xs block">{actorName}</span>
                        <span className="text-[11px] text-slate-400 block">{mvt.user?.email}</span>
                      </td>

                      <td className="px-6 py-4 text-xs text-slate-600 max-w-[200px] truncate">
                        {mvt.notes || mvt.referenceId || "N/A"}
                      </td>

                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => setViewMovement(mvt)}
                          className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition"
                          title="View Movement Details"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* VIEW MOVEMENT DETAILS MODAL */}
      <AnimatePresence>
        {viewMovement && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="bg-slate-900 text-white p-6 relative">
                <button
                  onClick={() => setViewMovement(null)}
                  className="absolute right-5 top-5 p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition"
                >
                  <X size={20} />
                </button>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-white/10 text-indigo-400 border border-white/10">
                    <Activity size={28} />
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wider font-semibold text-indigo-300 block">Stock Movement Audit Log</span>
                    <h2 className="text-2xl font-bold text-white mt-0.5">#{viewMovement.id ? viewMovement.id.slice(0, 8) : "LOG"}</h2>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-5 text-xs">
                <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div>
                    <span className="text-slate-400 uppercase font-semibold block">Movement Type</span>
                    <span className="font-extrabold text-indigo-600 text-sm mt-1 block">{viewMovement.type}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase font-semibold block">Transacted Quantity</span>
                    <span className="font-extrabold text-slate-900 text-base mt-1 block">{viewMovement.quantity} units</span>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase font-semibold block">Product</span>
                    <span className="font-bold text-slate-800 mt-1 block">{viewMovement.product?.name}</span>
                    <span className="font-mono text-slate-500 block">{viewMovement.product?.sku}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase font-semibold block">Warehouse</span>
                    <span className="font-bold text-indigo-600 mt-1 block">{viewMovement.warehouse?.name}</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Timestamp:</span>
                    <span className="font-mono font-bold text-slate-800">{new Date(viewMovement.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Actor / Performed By:</span>
                    <span className="font-bold text-slate-800">
                      {viewMovement.user ? `${viewMovement.user.firstName} ${viewMovement.user.lastName}` : viewMovement.performedBy?.name || "System"}
                    </span>
                  </div>
                  {viewMovement.notes && (
                    <div className="flex justify-between pt-1 border-t border-slate-200">
                      <span className="text-slate-500 font-medium">Notes / Audit Memo:</span>
                      <span className="font-medium text-slate-800">{viewMovement.notes}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
                <button
                  onClick={() => setViewMovement(null)}
                  className="px-6 py-2 bg-slate-800 hover:bg-slate-900 text-white font-medium text-xs rounded-xl transition"
                >
                  Close Audit Details
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
