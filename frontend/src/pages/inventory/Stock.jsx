import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Layers,
  Search,
  Filter,
  PlusCircle,
  MinusCircle,
  Eye,
  X,
  Warehouse,
  Package,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RotateCw,
  GitBranch,
  TrendingDown,
  Lock,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

import inventoryApi from "../../api/inventory.api";
import { useAuth } from "../../context/AuthContext";
import {
  isWarehouseManagerUser,
  isInventoryManagerUser,
  isCompanyAdminUser,
  isSuperAdminUser,
} from "../../utils/roleUtils";

export default function Stock() {
  const { user } = useAuth();
  const isWMOnly = isWarehouseManagerUser(user) && !isInventoryManagerUser(user) && !isCompanyAdminUser(user) && !isSuperAdminUser(user);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);

  // Search & Filters
  const [search, setSearch] = useState("");
  const [selectedWarehouseFilter, setSelectedWarehouseFilter] = useState("ALL");
  const [healthFilter, setHealthFilter] = useState("ALL"); // ALL, IN_STOCK, LOW_STOCK, OUT_OF_STOCK

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showReduceModal, setShowReduceModal] = useState(false);
  const [viewStockItem, setViewStockItem] = useState(null);

  // Selected Stock Item for Add / Reduce
  const [targetStockItem, setTargetStockItem] = useState(null);

  // Form State
  const [formWarehouseId, setFormWarehouseId] = useState("");
  const [formProductId, setFormProductId] = useState("");
  const [formQuantity, setFormQuantity] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Load Data
  const fetchData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [whRes, prodRes] = await Promise.all([
        inventoryApi.getWarehouses().catch((err) => { console.error("Error fetching warehouses:", err); return { data: { data: [] } }; }),
        inventoryApi.getProducts().catch((err) => { console.error("Error fetching products:", err); return { data: { data: [] } }; }),
      ]);

      const fetchedWarehouses = whRes.data?.data?.warehouses || whRes.data?.warehouses || (Array.isArray(whRes.data?.data) ? whRes.data.data : []);
      const fetchedProducts = prodRes.data?.data?.products || prodRes.data?.products || (Array.isArray(prodRes.data?.data) ? prodRes.data.data : []);

      setWarehouses(fetchedWarehouses);
      setProducts(fetchedProducts);

      if (isManualRefresh) toast.success("Stock metrics updated");
    } catch (err) {
      console.error("Error loading stock data:", err);
      toast.error("Failed to load inventory stock matrix");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Construct Stock Matrix Rows ($Products \times Warehouses$)
  const stockRows = useMemo(() => {
    const rows = [];

    // Map through warehouses & products
    warehouses.forEach((wh) => {
      const branchName =
        wh.branches?.[0]?.name ||
        wh.branch?.name ||
        wh.warehouseManager?.branch?.name ||
        (wh.branches && wh.branches.length > 0 ? wh.branches.map(b => b.name).join(", ") : "Linked Branch");

      products.forEach((prod) => {
        // Find existing stock record in product.stocks or wh.stocks
        const foundInWh = Array.isArray(wh.stocks)
          ? wh.stocks.find((s) => s.productId === prod.id)
          : null;

        const foundInProd = Array.isArray(prod.stocks)
          ? prod.stocks.find((s) => s.warehouseId === wh.id || s.warehouse?.id === wh.id)
          : null;

        const stockRecord = foundInWh || foundInProd;

        const physicalQty = stockRecord ? stockRecord.quantity || 0 : 0;
        const reservedQty = stockRecord ? stockRecord.reservedQuantity || 0 : 0;
        const availableQty = Math.max(0, physicalQty - reservedQty);
        const minStock = prod.minimumStock !== null && prod.minimumStock !== undefined ? prod.minimumStock : 10;

        let health = "IN_STOCK";
        if (physicalQty === 0) {
          health = "OUT_OF_STOCK";
        } else if (physicalQty <= minStock) {
          health = "LOW_STOCK";
        }

        rows.push({
          id: `${wh.id}-${prod.id}`,
          warehouseId: wh.id,
          warehouseName: wh.name,
          warehouseCode: wh.code || "WH",
          branchName,
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          category: prod.category || "General",
          price: prod.price,
          unit: prod.unit || "pcs",
          minimumStock: minStock,
          physicalQty,
          reservedQty,
          availableQty,
          health,
          updatedAt: stockRecord?.updatedAt || new Date().toISOString(),
        });
      });
    });

    return rows;
  }, [warehouses, products]);

  // Filtered Stock Rows
  const filteredStockRows = useMemo(() => {
    return stockRows.filter((row) => {
      const matchesSearch =
        !search ||
        row.productName.toLowerCase().includes(search.toLowerCase()) ||
        row.sku.toLowerCase().includes(search.toLowerCase()) ||
        row.warehouseName.toLowerCase().includes(search.toLowerCase());

      const matchesWarehouse =
        selectedWarehouseFilter === "ALL" || row.warehouseId === selectedWarehouseFilter;

      const matchesHealth =
        healthFilter === "ALL" || row.health === healthFilter;

      return matchesSearch && matchesWarehouse && matchesHealth;
    });
  }, [stockRows, search, selectedWarehouseFilter, healthFilter]);

  // Summary Metrics (Dynamically scoped to selected warehouse filter)
  const summaryMetrics = useMemo(() => {
    const targetRows = selectedWarehouseFilter === "ALL"
      ? stockRows
      : stockRows.filter((r) => r.warehouseId === selectedWarehouseFilter);

    let totalPhysical = 0;
    let totalReserved = 0;
    let totalAvailable = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    targetRows.forEach((r) => {
      totalPhysical += r.physicalQty;
      totalReserved += r.reservedQty;
      totalAvailable += r.availableQty;

      if (r.health === "LOW_STOCK") lowStockCount++;
      if (r.health === "OUT_OF_STOCK") outOfStockCount++;
    });

    return {
      totalPhysical,
      totalReserved,
      totalAvailable,
      lowStockCount,
      outOfStockCount,
    };
  }, [stockRows, selectedWarehouseFilter]);

  // Open Add Stock Modal
  const handleOpenAdd = (row = null) => {
    setTargetStockItem(row);
    setFormWarehouseId(row ? row.warehouseId : warehouses[0]?.id || "");
    setFormProductId(row ? row.productId : products[0]?.id || "");
    setFormQuantity("");
    setFormNotes("");
    setFormError("");
    setShowAddModal(true);
  };

  // Open Reduce Stock Modal
  const handleOpenReduce = (row) => {
    setTargetStockItem(row);
    setFormWarehouseId(row.warehouseId);
    setFormProductId(row.productId);
    setFormQuantity("");
    setFormNotes("");
    setFormError("");
    setShowReduceModal(true);
  };

  // Submit Add Stock
  const handleAddStockSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    const qty = parseInt(formQuantity);
    if (isNaN(qty) || qty <= 0) {
      setFormError("Quantity must be a positive integer");
      return;
    }

    if (!formWarehouseId || !formProductId) {
      setFormError("Please select both Warehouse and Product");
      return;
    }

    setFormSubmitting(true);
    try {
      await inventoryApi.addStock({
        warehouseId: formWarehouseId,
        productId: formProductId,
        quantity: qty,
        notes: formNotes.trim() || "Manual stock add",
      });
      toast.success(`Successfully added ${qty} units to warehouse stock`);
      setShowAddModal(false);
      fetchData();
    } catch (err) {
      console.error("Error adding stock:", err);
      const msg = err.response?.data?.message || err.message || "Failed to add stock";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Submit Reduce Stock
  const handleReduceStockSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    const qty = parseInt(formQuantity);
    if (isNaN(qty) || qty <= 0) {
      setFormError("Quantity must be a positive integer");
      return;
    }

    if (targetStockItem && qty > targetStockItem.physicalQty) {
      setFormError(`Cannot reduce by ${qty}. Current physical stock is ${targetStockItem.physicalQty}`);
      return;
    }

    setFormSubmitting(true);
    try {
      await inventoryApi.reduceStock({
        warehouseId: formWarehouseId,
        productId: formProductId,
        quantity: qty,
        notes: formNotes.trim() || "Manual stock reduction",
      });
      toast.success(`Successfully reduced stock by ${qty} units`);
      setShowReduceModal(false);
      fetchData();
    } catch (err) {
      console.error("Error reducing stock:", err);
      const msg = err.response?.data?.message || err.message || "Failed to reduce stock";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Stock Management</h1>
          <p className="text-slate-500 text-sm mt-1">
            Warehouse-wise stock balance, physical/reserved quantities & manual stock control.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-medium text-sm rounded-xl shadow-xs hover:bg-slate-50 transition cursor-pointer"
          >
            <RotateCw size={16} className={refreshing ? "animate-spin text-indigo-600" : "text-slate-500"} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>

          {!isWMOnly && (
            <button
              onClick={() => handleOpenAdd(null)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-xs transition cursor-pointer"
            >
              <PlusCircle size={18} />
              + Add Stock
            </button>
          )}
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
            placeholder="Search product, SKU, or warehouse..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
          />
        </div>

        {!isWMOnly && (
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <Warehouse size={16} className="text-slate-400" />
              <select
                value={selectedWarehouseFilter}
                onChange={(e) => setSelectedWarehouseFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">All Warehouses (Global)</option>
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name} ({wh.code || "WH"})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Filter size={16} className="text-slate-400" />
              <select
                value={healthFilter}
                onChange={(e) => setHealthFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">All Stock Health</option>
                <option value="IN_STOCK">In Stock</option>
                <option value="LOW_STOCK">Low Stock</option>
                <option value="OUT_OF_STOCK">Out of Stock</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Stock Availability Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[700px]">
            <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Warehouse & Branch</th>
                <th className="px-6 py-4">Product Name</th>
                <th className="px-6 py-4">SKU</th>
                <th className="px-6 py-4 text-center">Available Stock</th>
                {!isWMOnly && <th className="px-6 py-4 text-center">Stock Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={isWMOnly ? 4 : 5} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading stock availability records...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredStockRows.length === 0 ? (
                <tr>
                  <td colSpan={isWMOnly ? 4 : 5} className="py-12 text-center text-slate-400">
                    <Layers size={40} className="mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-700">No stock availability entries found</p>
                    <p className="text-xs text-slate-400 mt-1">Try another search query.</p>
                  </td>
                </tr>
              ) : (
                filteredStockRows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-blue-50 text-blue-600 shrink-0">
                          <Warehouse size={20} />
                        </div>
                        <div>
                          <span className="font-bold text-slate-800 block">{row.warehouseName}</span>
                          <span className="text-xs text-indigo-600 font-medium block">{row.branchName}</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-800 block">{row.productName}</span>
                    </td>

                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded">
                        {row.sku}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span className="text-base font-extrabold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                        {row.availableQty} units
                      </span>
                    </td>

                    {!isWMOnly && (
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenAdd(row)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition"
                            title="Add Stock"
                          >
                            <PlusCircle size={14} /> + Add
                          </button>
                          <button
                            onClick={() => handleOpenReduce(row)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold transition"
                            title="Reduce Stock"
                          >
                            <MinusCircle size={14} /> - Reduce
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD STOCK MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 md:p-8"
            >
              <button
                onClick={() => setShowAddModal(false)}
                className="absolute right-5 top-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
                  <PlusCircle size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Add Stock</h2>
                  <p className="text-xs text-slate-500">Increases physical quantity in warehouse</p>
                </div>
              </div>

              {formError && (
                <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
                  <AlertTriangle size={16} />
                  {formError}
                </div>
              )}

              <form onSubmit={handleAddStockSubmit} className="space-y-4 text-sm mt-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Warehouse *</label>
                  <select
                    disabled={Boolean(targetStockItem)}
                    value={formWarehouseId}
                    onChange={(e) => setFormWarehouseId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-75"
                  >
                    {warehouses.map((wh) => (
                      <option key={wh.id} value={wh.id}>
                        {wh.name} ({wh.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Product *</label>
                  <select
                    disabled={Boolean(targetStockItem)}
                    value={formProductId}
                    onChange={(e) => setFormProductId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-75"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity to Add *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formQuantity}
                    onChange={(e) => setFormQuantity(e.target.value)}
                    placeholder="e.g. 50"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Reason / Notes</label>
                  <input
                    type="text"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="e.g. Stock shipment received"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium text-xs hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition disabled:opacity-50"
                  >
                    {formSubmitting ? "Adding..." : "+ Confirm Add Stock"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* REDUCE STOCK MODAL */}
      <AnimatePresence>
        {showReduceModal && targetStockItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 md:p-8"
            >
              <button
                onClick={() => setShowReduceModal(false)}
                className="absolute right-5 top-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 rounded-2xl bg-amber-50 text-amber-600">
                  <MinusCircle size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Reduce Stock</h2>
                  <p className="text-xs text-slate-500">Decreases physical quantity in warehouse</p>
                </div>
              </div>

              {/* Current Stock Specs */}
              <div className="mt-4 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Product:</span>
                  <span className="font-bold text-slate-800">{targetStockItem.productName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Warehouse:</span>
                  <span className="font-bold text-slate-800">{targetStockItem.warehouseName}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200">
                  <span className="text-slate-500">Current Physical Stock:</span>
                  <span className="font-extrabold text-indigo-600">{targetStockItem.physicalQty} units</span>
                </div>
              </div>

              {formError && (
                <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
                  <AlertTriangle size={16} />
                  {formError}
                </div>
              )}

              <form onSubmit={handleReduceStockSubmit} className="space-y-4 text-sm mt-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity to Reduce *</label>
                  <input
                    type="number"
                    min="1"
                    max={targetStockItem.physicalQty}
                    required
                    value={formQuantity}
                    onChange={(e) => setFormQuantity(e.target.value)}
                    placeholder="e.g. 10"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Reason / Notes</label>
                  <input
                    type="text"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="e.g. Damaged stock removal"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowReduceModal(false)}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium text-xs hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-xs transition disabled:opacity-50"
                  >
                    {formSubmitting ? "Reducing..." : "- Confirm Reduce Stock"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* VIEW STOCK ITEM DETAILS MODAL */}
      <AnimatePresence>
        {viewStockItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="bg-slate-900 text-white p-6 relative">
                <button
                  onClick={() => setViewStockItem(null)}
                  className="absolute right-5 top-5 p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition"
                >
                  <X size={20} />
                </button>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-white/10 text-indigo-400 border border-white/10">
                    <Layers size={28} />
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wider font-semibold text-indigo-300 block">Stock Record Details</span>
                    <h2 className="text-2xl font-bold text-white mt-0.5">{viewStockItem.productName}</h2>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-400 uppercase font-semibold block">SKU</span>
                    <span className="font-mono text-sm font-bold text-slate-800 mt-1 block">{viewStockItem.sku}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase font-semibold block">Category</span>
                    <span className="text-sm font-bold text-slate-800 mt-1 block">{viewStockItem.category}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase font-semibold block">Warehouse</span>
                    <span className="text-sm font-bold text-indigo-600 mt-1 block">{viewStockItem.warehouseName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase font-semibold block">Branch</span>
                    <span className="text-sm font-bold text-slate-800 mt-1 block">{viewStockItem.branchName}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100">
                    <span className="text-xs text-indigo-600 font-semibold block">Physical Stock</span>
                    <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{viewStockItem.physicalQty}</h3>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
                    <span className="text-xs text-amber-600 font-semibold block">Reserved</span>
                    <h3 className="text-2xl font-extrabold text-amber-700 mt-1">{viewStockItem.reservedQty}</h3>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                    <span className="text-xs text-emerald-600 font-semibold block">Available</span>
                    <h3 className="text-2xl font-extrabold text-emerald-700 mt-1">{viewStockItem.availableQty}</h3>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
                <button
                  onClick={() => setViewStockItem(null)}
                  className="px-6 py-2 bg-slate-800 hover:bg-slate-900 text-white font-medium text-xs rounded-xl transition"
                >
                  Close Details
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
