import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Warehouse,
  GitBranch,
  UserCheck,
  MapPin,
  Package,
  Layers,
  Lock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RotateCw,
  Building
} from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

import inventoryApi from "../../api/inventory.api";
import { useAuth } from "../../context/AuthContext";

export default function MyWarehouse() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [myWarehouse, setMyWarehouse] = useState(null);
  const [pendingPickups, setPendingPickups] = useState([]);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [error, setError] = useState(null);

  const fetchMyWarehouse = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await inventoryApi.getMyWarehouse();
      const wh = res.data?.data || res.data;
      setMyWarehouse(wh);

      // Fetch pending stock pickup requests for this warehouse
      if (wh && wh.id) {
        const issuesRes = await inventoryApi.getProductIssues().catch((err) => {
          console.warn("Product issues fetch warning:", err);
          return { data: { data: [] } };
        });
        const allIssues = issuesRes.data?.data?.productIssues || issuesRes.data?.productIssues || (Array.isArray(issuesRes.data?.data) ? issuesRes.data.data : []);
        const filtered = allIssues.filter((i) => i.warehouseId === wh.id && i.status === "PENDING");
        setPendingPickups(filtered);
      }

      if (isManualRefresh) toast.success("Warehouse details and pending pickups refreshed");
    } catch (err) {
      console.error("Error loading assigned warehouse:", err);
      const msg = err.response?.data?.message || err.message || "Unable to resolve assigned warehouse";
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMyWarehouse();
  }, [fetchMyWarehouse]);

  const handleApproveHandover = async (issue) => {
    try {
      setActionLoadingId(issue.id);
      await inventoryApi.updateProductIssueStatus(issue.id, {
        status: "ISSUED",
        notes: `Product stock approved and handed over to Sales Executive by ${user?.email || "Warehouse Manager"}`
      });
      toast.success(`Product stock (${issue.quantity} units) approved & handed over to Sales Executive!`);
      await fetchMyWarehouse(false);
    } catch (err) {
      console.error("Error approving handover:", err);
      const msg = err.response?.data?.message || err.message || "Failed to complete product stock handover";
      toast.error(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Derived stock metrics for this specific assigned warehouse
  const stockMetrics = useMemo(() => {
    if (!myWarehouse || !Array.isArray(myWarehouse.stocks)) {
      return { totalProducts: 0, totalPhysical: 0, totalReserved: 0, totalAvailable: 0, lowStockCount: 0, outOfStockCount: 0 };
    }

    let totalPhysical = 0;
    let totalReserved = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    myWarehouse.stocks.forEach((s) => {
      const qty = s.quantity || 0;
      const res = s.reservedQuantity || 0;
      const minStock = s.product?.minimumStock !== undefined && s.product?.minimumStock !== null ? s.product.minimumStock : 10;

      totalPhysical += qty;
      totalReserved += res;

      if (qty === 0) outOfStockCount++;
      else if (qty <= minStock) lowStockCount++;
    });

    const totalAvailable = Math.max(0, totalPhysical - totalReserved);
    const totalProducts = myWarehouse.stocks.length;

    return {
      totalProducts,
      totalPhysical,
      totalReserved,
      totalAvailable,
      lowStockCount,
      outOfStockCount,
    };
  }, [myWarehouse]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium animate-pulse">Resolving assigned branch warehouse...</p>
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
          onClick={() => fetchMyWarehouse(true)}
          className="mt-2 inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-xl transition"
        >
          <RotateCw size={16} /> Retry Resolution
        </button>
      </div>
    );
  }

  const branchName =
    myWarehouse.branches?.[0]?.name ||
    myWarehouse.branch?.name ||
    myWarehouse.warehouseManager?.branch?.name ||
    (myWarehouse.branches && myWarehouse.branches.length > 0 ? myWarehouse.branches.map(b => b.name).join(", ") : null);
  const branchCode = myWarehouse.branches?.[0]?.code || myWarehouse.branch?.code || myWarehouse.warehouseManager?.branch?.code || null;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 block">Assigned Console</span>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{myWarehouse.name}</h1>
          <p className="text-slate-500 text-sm mt-1">
            Dedicated branch warehouse console for operational inventory control.
          </p>
        </div>

        <button
          onClick={() => fetchMyWarehouse(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 self-start md:self-auto px-4 py-2.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-medium text-sm rounded-xl shadow-xs hover:bg-slate-50 transition cursor-pointer"
        >
          <RotateCw size={16} className={refreshing ? "animate-spin text-indigo-600" : "text-slate-500"} />
          {refreshing ? "Refreshing..." : "Refresh Console"}
        </button>
      </div>

      {/* Main Spec Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Warehouse Specs */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600">
              <Warehouse size={24} />
            </div>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-full border border-emerald-200">
              Active
            </span>
          </div>

          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase block">Warehouse Code</span>
            <span className="font-mono text-base font-bold text-slate-800 mt-0.5 block">{myWarehouse.code || "WH-CODE"}</span>
          </div>

          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase block">Physical Location</span>
            <div className="flex items-center gap-2 mt-1 text-slate-700 font-medium text-xs">
              <MapPin size={16} className="text-slate-400 shrink-0" />
              <span>{myWarehouse.location || "Location not specified"}</span>
            </div>
          </div>
        </div>

        {/* Dedicated Branch Specs */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-blue-50 text-blue-600">
              <GitBranch size={24} />
            </div>
            <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 font-bold text-[10px] uppercase rounded border border-blue-100">
              1:1 Dedicated Branch
            </span>
          </div>

          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase block">Branch Name</span>
            <span className="font-bold text-slate-800 text-base mt-0.5 block">{branchName || "Linked Branch"}</span>
          </div>

          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase block">Branch Code</span>
            <span className="font-mono text-xs text-slate-600 mt-1 block">{branchCode || "BR-LINKED"}</span>
          </div>
        </div>

        {/* Manager Profile Specs */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-purple-50 text-purple-600">
              <UserCheck size={24} />
            </div>
            <span className="px-2.5 py-0.5 bg-purple-50 text-purple-700 font-bold text-[10px] uppercase rounded border border-purple-100">
              Assigned Manager
            </span>
          </div>

          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase block">Warehouse Manager</span>
            <span className="font-bold text-slate-800 text-base mt-0.5 block">
              {user ? `${user.firstName} ${user.lastName}` : "Warehouse Manager"}
            </span>
          </div>

          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase block">Email Address</span>
            <span className="text-xs font-mono text-slate-600 mt-1 block">{user?.email}</span>
          </div>
        </div>
      </div>

      {/* Pending Executive Stock Pickup Requests (Warehouse Manager Handover Workspace) */}
      <div className="p-6 rounded-3xl bg-amber-50/70 border border-amber-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Package size={22} className="text-amber-700" />
              <h3 className="text-xl font-bold text-amber-950">Pending Sales Executive Stock Pickups</h3>
            </div>
            <p className="text-xs text-amber-800 mt-1">
              Sales Executives dispatched by Sales Manager to pick up product stock from this warehouse before visiting customers.
            </p>
          </div>
          <span className="px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-amber-200 text-amber-900 self-start sm:self-auto font-mono">
            {pendingPickups.length} Pickups Pending
          </span>
        </div>

        {pendingPickups.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-amber-100 space-y-2">
            <CheckCircle2 size={36} className="text-emerald-500 mx-auto" />
            <p className="font-bold text-slate-800 text-sm">No Pending Stock Pickup Requests</p>
            <p className="text-xs text-slate-500">
              All assigned sales executive stock requests have been handed over and dispatched.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {pendingPickups.map((issue) => {
              const execName = issue.salesExecutive
                ? `${issue.salesExecutive.firstName} ${issue.salesExecutive.lastName}`
                : "Sales Executive";
              const isProcessing = actionLoadingId === issue.id;

              return (
                <div
                  key={issue.id}
                  className="bg-white rounded-2xl p-5 border border-amber-200 shadow-xs space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                          Ref #{issue.id ? issue.id.slice(0, 8) : "REQ"}
                        </span>
                        <h4 className="text-base font-extrabold text-slate-900 mt-1">{issue.product?.name || "Assigned Product"}</h4>
                        <span className="text-xs font-mono text-slate-400">SKU: {issue.product?.sku || "N/A"}</span>
                      </div>
                      <div className="bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-xl text-right shrink-0">
                        <span className="text-[10px] font-bold text-indigo-500 block uppercase">Quantity</span>
                        <span className="text-lg font-extrabold text-indigo-700">{issue.quantity} Units</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Sales Executive:</span>
                        <span className="font-bold text-slate-800">{execName}</span>
                        <span className="text-[11px] text-slate-500 block truncate">{issue.salesExecutive?.email}</span>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Task Reference / Notes:</span>
                        <span className="font-medium text-slate-700 line-clamp-2">{issue.notes || "Product pickup request"}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleApproveHandover(issue)}
                    disabled={isProcessing}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <RotateCw size={16} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={16} />
                    )}
                    {isProcessing ? "Processing Stock Deduction..." : `Approve & Handover ${issue.quantity} Units to Executive`}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Stock Summary Section */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Warehouse Inventory Balance</h3>
            <p className="text-xs text-slate-500 mt-0.5">Live stock statistics for {myWarehouse.name}</p>
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg font-mono">
            {stockMetrics.totalProducts} Managed Items
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-xs text-slate-400 uppercase font-semibold block">Total Physical Stock</span>
            <h4 className="text-2xl font-extrabold text-slate-800 mt-1">{stockMetrics.totalPhysical}</h4>
            <span className="text-[11px] text-slate-500">Units in warehouse</span>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 text-center">
            <span className="text-xs text-emerald-700 uppercase font-semibold block">Available Stock</span>
            <h4 className="text-2xl font-extrabold text-emerald-800 mt-1">{stockMetrics.totalAvailable}</h4>
            <span className="text-[11px] text-emerald-600">Ready for dispatch</span>
          </div>
        </div>
      </div>
    </div>
  );
}
