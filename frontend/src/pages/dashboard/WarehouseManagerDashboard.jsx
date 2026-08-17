import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Warehouse,
  GitBranch,
  Package,
  Clock,
  ArrowRight,
  RotateCw,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Layers
} from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

import inventoryApi from "../../api/inventory.api";
import { useAuth } from "../../context/AuthContext";

export default function WarehouseManagerDashboard() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [myWarehouse, setMyWarehouse] = useState(null);
  const [pendingPickups, setPendingPickups] = useState([]);
  const [recentMovements, setRecentMovements] = useState([]);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [whRes, issuesRes, mvtsRes] = await Promise.all([
        inventoryApi.getMyWarehouse().catch((err) => {
          console.warn("My warehouse fetch warning:", err);
          return { data: { data: null } };
        }),
        inventoryApi.getProductIssues().catch((err) => {
          console.warn("Product issues fetch warning:", err);
          return { data: { data: [] } };
        }),
        inventoryApi.getStockMovements({ limit: 10 }).catch((err) => {
          console.warn("Stock movements fetch warning:", err);
          return { data: { data: { movements: [] } } };
        })
      ]);

      const wh = whRes.data?.data || whRes.data;
      setMyWarehouse(wh);

      if (wh && wh.id) {
        const allIssues = issuesRes.data?.data?.productIssues || issuesRes.data?.productIssues || (Array.isArray(issuesRes.data?.data) ? issuesRes.data.data : []);
        const filtered = allIssues.filter((i) => i.warehouseId === wh.id && i.status === "PENDING");
        setPendingPickups(filtered);

        const allMvts = mvtsRes.data?.data?.movements || mvtsRes.data?.movements || (Array.isArray(mvtsRes.data?.data) ? mvtsRes.data.data : []);
        const filteredMvts = allMvts.filter((m) => m.warehouseId === wh.id);
        setRecentMovements(filteredMvts.slice(0, 5));
      }

      if (isManualRefresh) toast.success("Dashboard metrics refreshed");
    } catch (err) {
      console.error("Error loading Warehouse Manager Dashboard:", err);
      setError("Unable to load warehouse dashboard metrics");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Derived stock metrics for this specific assigned warehouse
  const metrics = useMemo(() => {
    if (!myWarehouse || !Array.isArray(myWarehouse.stocks)) {
      return { totalItems: 0, totalPhysical: 0, totalAvailable: 0, lowStockCount: 0 };
    }

    let totalPhysical = 0;
    let totalReserved = 0;
    let lowStockCount = 0;

    myWarehouse.stocks.forEach((s) => {
      const qty = s.quantity || 0;
      const res = s.reservedQuantity || 0;
      const minStock = s.product?.minimumStock ?? 10;

      totalPhysical += qty;
      totalReserved += res;
      if (qty <= minStock) lowStockCount++;
    });

    const totalAvailable = Math.max(0, totalPhysical - totalReserved);
    const totalItems = myWarehouse.stocks.length;

    return {
      totalItems,
      totalPhysical,
      totalAvailable,
      lowStockCount,
    };
  }, [myWarehouse]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium animate-pulse">Loading Warehouse Manager Dashboard...</p>
      </div>
    );
  }

  if (error || !myWarehouse) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 bg-white rounded-3xl border border-amber-200 shadow-xs text-center max-w-xl mx-auto my-12 space-y-4">
        <div className="p-4 rounded-full bg-amber-50 text-amber-600">
          <AlertTriangle size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Warehouse Assignment Required</h2>
        <p className="text-slate-500 text-sm">
          No dedicated branch warehouse is currently assigned to your account. Please contact an Inventory Manager or Company Admin to assign your warehouse.
        </p>
        <button
          onClick={() => fetchDashboardData(true)}
          className="mt-2 inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-xl transition cursor-pointer"
        >
          <RotateCw size={16} /> Retry Resolution
        </button>
      </div>
    );
  }

  const linkedBranchName =
    myWarehouse.branches?.[0]?.name ||
    myWarehouse.branch?.name ||
    myWarehouse.warehouseManager?.branch?.name ||
    "Linked Branch";

  return (
    <div className="space-y-6 pb-12">
      {/* Top Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 md:p-8 rounded-3xl text-white shadow-md">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 block">Warehouse Operational Hub</span>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-1">
            Welcome, {user ? `${user.firstName} ${user.lastName}` : "Warehouse Manager"} 👋
          </h1>
          <p className="text-slate-300 text-sm mt-1">
            Overview for <span className="text-white font-bold">{myWarehouse.name}</span> — Linked to <span className="text-indigo-300 font-bold">{linkedBranchName}</span>.
          </p>
        </div>

        <button
          onClick={() => fetchDashboardData(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 self-start md:self-auto px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-medium text-sm rounded-xl transition cursor-pointer"
        >
          <RotateCw size={16} className={refreshing ? "animate-spin text-indigo-400" : "text-slate-300"} />
          {refreshing ? "Refreshing..." : "Refresh Dashboard"}
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Assigned Warehouse */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
              <Warehouse size={22} />
            </div>
            <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-[10px] uppercase rounded border border-emerald-200">
              Active
            </span>
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Assigned Warehouse</span>
            <h3 className="text-lg font-bold text-slate-800 mt-0.5 truncate">{myWarehouse.name}</h3>
            <span className="text-xs font-mono text-slate-500 block">Code: {myWarehouse.code || "WH-001"}</span>
          </div>
        </div>

        {/* Card 2: Linked Branch */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
              <GitBranch size={22} />
            </div>
            <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 font-bold text-[10px] uppercase rounded border border-blue-200">
              Linked Branch
            </span>
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Connected Branch</span>
            <h3 className="text-lg font-bold text-slate-800 mt-0.5 truncate">{linkedBranchName}</h3>
            <span className="text-xs text-slate-500 block">1:1 Warehouse-Branch Link</span>
          </div>
        </div>

        {/* Card 3: Stock Balance */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
              <Package size={22} />
            </div>
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-[10px] rounded border border-emerald-200">
              {metrics.totalItems} Items
            </span>
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Available Stock</span>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-0.5">{metrics.totalAvailable} <span className="text-xs font-normal text-slate-500">units</span></h3>
            <span className="text-xs text-slate-500 block">Total physical: {metrics.totalPhysical} units</span>
          </div>
        </div>

        {/* Card 4: Pending Pickups */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
              <Clock size={22} />
            </div>
            <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${pendingPickups.length > 0 ? "bg-amber-100 text-amber-800 border-amber-300" : "bg-slate-100 text-slate-600 border-slate-200"}`}>
              {pendingPickups.length} Pending
            </span>
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Executive Pickups</span>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-0.5">{pendingPickups.length} <span className="text-xs font-normal text-slate-500">requests</span></h3>
            <span className="text-xs text-slate-500 block">Awaiting manager handover</span>
          </div>
        </div>
      </div>

      {/* Quick Navigation Hub */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/inventory/my-warehouse"
          className="p-6 rounded-3xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md transition group space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition">
              <Warehouse size={24} />
            </div>
            <ArrowRight size={18} className="text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition">My Warehouse Console</h3>
            <p className="text-slate-500 text-xs mt-1">
              View warehouse specs, location coordinates, manager profile, and approve pending stock pick-ups.
            </p>
          </div>
        </Link>

        <Link
          to="/inventory/stock"
          className="p-6 rounded-3xl bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-md transition group space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition">
              <Package size={24} />
            </div>
            <ArrowRight size={18} className="text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-600 transition">Stock Availability</h3>
            <p className="text-slate-500 text-xs mt-1">
              Inspect current product stock balances, SKU breakdown, and physical vs available stock in this warehouse.
            </p>
          </div>
        </Link>

        <Link
          to="/inventory/stock-movements"
          className="p-6 rounded-3xl bg-white border border-slate-200 hover:border-purple-300 hover:shadow-md transition group space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition">
              <Activity size={24} />
            </div>
            <ArrowRight size={18} className="text-slate-400 group-hover:text-purple-600 group-hover:translate-x-1 transition" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 group-hover:text-purple-600 transition">Stock Movements Audit</h3>
            <p className="text-slate-500 text-xs mt-1">
              Track recent stock movements, additions, deductions, and transfer logs for this warehouse.
            </p>
          </div>
        </Link>
      </div>

      {/* Operational Highlights Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Pickups Summary */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Clock size={20} className="text-amber-600" />
              <h3 className="text-lg font-bold text-slate-900">Pending Executive Handovers</h3>
            </div>
            <Link to="/inventory/my-warehouse" className="text-xs font-bold text-indigo-600 hover:underline">
              View All Handovers →
            </Link>
          </div>

          {pendingPickups.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <CheckCircle2 size={32} className="text-emerald-500 mx-auto" />
              <p className="text-sm font-bold text-slate-700">No Pending Stock Pickups</p>
              <p className="text-xs text-slate-400">All sales executive stock requests for this warehouse are cleared.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingPickups.slice(0, 3).map((issue) => (
                <div key={issue.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">{issue.product?.name || "Product Stock"}</h4>
                    <span className="text-xs text-slate-500">
                      Exec: {issue.salesExecutive ? `${issue.salesExecutive.firstName} ${issue.salesExecutive.lastName}` : "Executive"}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-indigo-600 block">{issue.quantity} Units</span>
                    <span className="text-[10px] uppercase font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">Pending</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Stock Movements Feed */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Activity size={20} className="text-purple-600" />
              <h3 className="text-lg font-bold text-slate-900">Recent Warehouse Audit Log</h3>
            </div>
            <Link to="/inventory/stock-movements" className="text-xs font-bold text-indigo-600 hover:underline">
              Full Audit Log →
            </Link>
          </div>

          {recentMovements.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <Layers size={32} className="text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">No Recent Stock Movements</p>
              <p className="text-xs text-slate-400">Movement logs will appear here when stock is added or issued.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentMovements.map((mvt) => (
                <div key={mvt.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">{mvt.product?.name || "Product Item"}</h4>
                    <span className="text-xs text-slate-500 font-mono">SKU: {mvt.product?.sku || "N/A"}</span>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-extrabold block ${mvt.type === "ADDITION" || mvt.type === "IN" ? "text-emerald-600" : "text-amber-600"}`}>
                      {mvt.type === "ADDITION" || mvt.type === "IN" ? `+${mvt.quantity}` : `-${mvt.quantity}`} Units
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{mvt.type}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
