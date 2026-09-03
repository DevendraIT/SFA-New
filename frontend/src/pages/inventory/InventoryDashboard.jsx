import { useState, useEffect, useMemo, useCallback } from "react";
import { 
  Package, 
  Warehouse, 
  Layers, 
  AlertTriangle, 
  XCircle, 
  ClipboardCheck, 
  Users, 
  RotateCw,
  MapPin,
  GitBranch,
  Building,
  UserCheck,
  UserX,
  TrendingDown,
  Activity,
  CheckCircle2
} from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

import inventoryApi from "../../api/inventory.api";

export default function InventoryDashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [productIssues, setProductIssues] = useState([]);

  const fetchData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const [prodRes, whRes, issuesRes] = await Promise.all([
        inventoryApi.getProducts().catch((err) => { console.error("Error fetching products:", err); return { data: { data: [] } }; }),
        inventoryApi.getWarehouses().catch((err) => { console.error("Error fetching warehouses:", err); return { data: { data: [] } }; }),
        inventoryApi.getProductIssues().catch((err) => { console.error("Error fetching product issues:", err); return { data: { data: [] } }; }),
      ]);

      const fetchedProducts = prodRes.data?.data?.products || prodRes.data?.products || (Array.isArray(prodRes.data?.data) ? prodRes.data.data : []);
      const fetchedWarehouses = whRes.data?.data?.warehouses || whRes.data?.warehouses || (Array.isArray(whRes.data?.data) ? whRes.data.data : []);
      const fetchedIssues = issuesRes.data?.data?.productIssues || issuesRes.data?.productIssues || (Array.isArray(issuesRes.data?.data) ? issuesRes.data.data : []);

      setProducts(fetchedProducts);
      setWarehouses(fetchedWarehouses);
      setProductIssues(fetchedIssues);

      if (isManualRefresh) {
        toast.success("Inventory metrics refreshed successfully");
      }
    } catch (err) {
      console.error("Error loading inventory dashboard data:", err);
      setError("Failed to load inventory metrics from backend. Please try again.");
      toast.error("Unable to load inventory metrics");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Derived Metrics from Real Backend Data
  const metrics = useMemo(() => {
    const totalProducts = products.length;
    const totalWarehouses = warehouses.length;

    let totalStockUnits = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    products.forEach((prod) => {
      const prodTotalStock = Array.isArray(prod.stocks)
        ? prod.stocks.reduce((acc, s) => acc + (s.quantity || 0), 0)
        : 0;

      totalStockUnits += prodTotalStock;

      const minStock = prod.minimumStock !== null && prod.minimumStock !== undefined ? prod.minimumStock : 10;
      if (prodTotalStock === 0) {
        outOfStockCount++;
      } else if (prodTotalStock <= minStock) {
        lowStockCount++;
      }
    });

    const pendingIssuesCount = productIssues.filter((i) => i.status === "PENDING").length;
    const issuedCount = productIssues.filter((i) => i.status === "ISSUED").length;
    const activeManagersCount = warehouses.filter((w) => Boolean(w.warehouseManagerId || w.warehouseManager)).length;

    return {
      totalProducts,
      totalWarehouses,
      totalStockUnits,
      lowStockCount,
      outOfStockCount,
      pendingIssuesCount,
      issuedCount,
      activeManagersCount,
    };
  }, [products, warehouses, productIssues]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium animate-pulse">Loading live inventory metrics...</p>
      </div>
    );
  }

  if (error && products.length === 0 && warehouses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 bg-white rounded-3xl border border-red-100 shadow-sm text-center">
        <div className="p-4 rounded-full bg-red-50 text-red-600 mb-4">
          <AlertTriangle size={36} />
        </div>
        <h3 className="text-xl font-bold text-slate-800">Connection Error</h3>
        <p className="text-slate-500 mt-2 max-w-md">{error}</p>
        <button
          onClick={() => fetchData(true)}
          className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition"
        >
          <RotateCw size={18} /> Retry Loading
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Inventory Manager Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">
            Real-time warehouse stock tracking, product availability & dispatch monitoring.
          </p>
        </div>

        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 self-start md:self-auto px-4 py-2.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-medium text-sm rounded-xl shadow-xs hover:bg-slate-50 transition disabled:opacity-50"
        >
          <RotateCw size={16} className={refreshing ? "animate-spin text-indigo-600" : "text-slate-500"} />
          {refreshing ? "Refreshing..." : "Refresh Data"}
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Products</span>
            <h3 className="text-3xl font-extrabold text-slate-800 mt-1">{metrics.totalProducts}</h3>
            <span className="text-xs text-slate-500 mt-1 block">Active in catalog</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-indigo-50 text-indigo-600">
            <Package size={26} />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.05 }} className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Warehouses</span>
            <h3 className="text-3xl font-extrabold text-slate-800 mt-1">{metrics.totalWarehouses}</h3>
            <span className="text-xs text-emerald-600 font-medium mt-1 block">Dedicated Branch WHs</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-blue-50 text-blue-600">
            <Warehouse size={26} />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.1 }} className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Stock Units</span>
            <h3 className="text-3xl font-extrabold text-slate-800 mt-1">{metrics.totalStockUnits}</h3>
            <span className="text-xs text-slate-500 mt-1 block">Across all warehouses</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-600">
            <Layers size={26} />
          </div>
        </motion.div>
      </div>

      {/* Warehouse Overview Section (1 Branch = 1 Dedicated Warehouse) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Warehouse className="text-indigo-600" size={22} />
            Dedicated Branch Warehouses
          </h2>
          <span className="text-xs font-semibold px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
            1 Branch = 1 Dedicated Warehouse
          </span>
        </div>

        {warehouses.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
            <Warehouse className="mx-auto text-slate-300 mb-2" size={40} />
            <p className="text-slate-500 font-medium">No warehouses found in your organization.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {warehouses.map((wh) => {
              const managerName = wh.warehouseManager
                ? `${wh.warehouseManager.firstName} ${wh.warehouseManager.lastName}`
                : "Not Assigned";
              const branchName = wh.branches?.[0]?.name || "Unlinked Branch";
              const stockCount = Array.isArray(wh.stocks)
                ? wh.stocks.reduce((acc, s) => acc + (s.available !== undefined ? s.available : Math.max(0, (s.quantity || 0) - (s.reservedQuantity || 0))), 0)
                : 0;

              return (
                <div
                  key={wh.id}
                  className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-1 text-xs font-bold bg-slate-100 text-slate-700 rounded-lg font-mono">
                        {wh.code || "WH"}
                      </span>
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${wh.isActive !== false ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>
                        {wh.isActive !== false ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-800 text-lg leading-snug">{wh.name}</h3>

                    <div className="mt-3 space-y-2 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <GitBranch size={14} className="text-indigo-500 shrink-0" />
                        <span className="font-medium text-slate-700 truncate">{branchName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-slate-400 shrink-0" />
                        <span className="truncate">{wh.location || "N/A"}</span>
                      </div>
                      <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                        {wh.warehouseManager ? (
                          <UserCheck size={14} className="text-emerald-600 shrink-0" />
                        ) : (
                          <UserX size={14} className="text-slate-400 shrink-0" />
                        )}
                        <span className={`font-semibold ${wh.warehouseManager ? "text-slate-800" : "text-slate-500"}`}>
                          {managerName}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Warehouse Stock</span>
                    <span className="font-bold text-indigo-600 text-sm">{stockCount} units</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Products Stock Breakdown (Full Width) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Product Stock Overview</h3>
            <p className="text-xs text-slate-500">Inventory levels per product in the single master product table</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
            {products.length} Items
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[500px]">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-3 rounded-l-xl">Product Name</th>
                <th className="p-3">SKU</th>
                <th className="p-3">Category</th>
                <th className="p-3 text-right">Price</th>
                <th className="p-3 text-center rounded-r-xl">Total Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No product records found.
                  </td>
                </tr>
              ) : (
                products.slice(0, 10).map((prod) => {
                  const totalStock = Array.isArray(prod.stocks)
                    ? prod.stocks.reduce((acc, s) => acc + (s.quantity || 0), 0)
                    : 0;

                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 font-semibold text-slate-800">{prod.name}</td>
                      <td className="p-3 font-mono text-slate-500">{prod.sku}</td>
                      <td className="p-3 text-slate-600">{prod.category || "General"}</td>
                      <td className="p-3 text-right font-medium text-slate-800">₹{prod.price}</td>
                      <td className="p-3 text-center font-bold text-indigo-600">{totalStock}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
