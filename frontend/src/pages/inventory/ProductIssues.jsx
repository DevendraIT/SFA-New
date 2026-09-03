import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ClipboardCheck,
  Plus,
  Search,
  Filter,
  Eye,
  X,
  CheckCircle2,
  XCircle,
  RotateCw,
  Warehouse,
  Package,
  User,
  AlertTriangle,
  Clock,
  ArrowRight,
  TrendingDown,
  Layers
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

import inventoryApi from "../../api/inventory.api";
import userApi from "../../api/user.api";
import { useAuth } from "../../context/AuthContext";

export default function ProductIssues() {
  const { user } = useAuth();

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("ALL");
  const [selectedWarehouseFilter, setSelectedWarehouseFilter] = useState("ALL");

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);

  const {
    data: issuesData = { productIssues: [], products: [], warehouses: [], users: [] },
    isLoading: loading,
    isRefetching: refreshing,
    refetch: fetchData,
  } = useQuery({
    queryKey: ["productIssuesData"],
    queryFn: async () => {
      const [issuesRes, prodRes, whRes, usersRes] = await Promise.all([
        inventoryApi.getProductIssues().catch((err) => { console.error("Error fetching product issues:", err); return { data: { data: [] } }; }),
        inventoryApi.getProducts().catch((err) => { console.error("Error fetching products:", err); return { data: { data: [] } }; }),
        inventoryApi.getWarehouses().catch((err) => { console.error("Error fetching warehouses:", err); return { data: { data: [] } }; }),
        userApi.getUsers().catch((err) => { console.error("Error fetching users:", err); return { data: { data: [] } }; }),
      ]);

      const productIssues = issuesRes.data?.data?.productIssues || issuesRes.data?.productIssues || (Array.isArray(issuesRes.data?.data) ? issuesRes.data.data : []);
      const products = prodRes.data?.data?.products || prodRes.data?.products || (Array.isArray(prodRes.data?.data) ? prodRes.data.data : []);
      const warehouses = whRes.data?.data?.warehouses || whRes.data?.warehouses || (Array.isArray(whRes.data?.data) ? whRes.data.data : []);
      const users = usersRes.data?.data?.users || usersRes.data?.users || (Array.isArray(usersRes.data?.data) ? usersRes.data.data : []);

      return { productIssues, products, warehouses, users };
    },
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const productIssues = issuesData.productIssues;
  const products = issuesData.products;
  const warehouses = issuesData.warehouses;
  const users = issuesData.users;
  const [viewIssueItem, setViewIssueItem] = useState(null);

  // Create Form State
  const [createForm, setCreateForm] = useState({
    productId: "",
    warehouseId: "",
    salesExecutiveId: "",
    quantity: "",
    notes: "",
  });
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState("");

  // Role Checks
  const isWarehouseManager = useMemo(() => {
    if (!user) return false;
    const roleNames = Array.isArray(user.roles)
      ? user.roles.map((r) => (typeof r === "string" ? r : r.role?.name || r.name))
      : [user.role?.name || ""];
    return roleNames.some((r) => r && r.toLowerCase().includes("warehouse manager"));
  }, [user]);

  // Sales Executives List (filtered users)
  const salesExecutives = useMemo(() => {
    return users.filter((u) => {
      const roles = Array.isArray(u.roles)
        ? u.roles.map((r) => (typeof r === "string" ? r : r.role?.name || r.name))
        : [u.role?.name || ""];
      return roles.some((r) => r && (r.toLowerCase().includes("executive") || r.toLowerCase().includes("sales")));
    });
  }, [users]);

  // Filtered Product Issues
  const filteredIssues = useMemo(() => {
    return productIssues.filter((issue) => {
      const prodName = issue.product?.name || "";
      const prodSku = issue.product?.sku || "";
      const execName = issue.salesExecutive ? `${issue.salesExecutive.firstName} ${issue.salesExecutive.lastName}` : "";
      const issueId = issue.id || "";

      const matchesSearch =
        !search ||
        prodName.toLowerCase().includes(search.toLowerCase()) ||
        prodSku.toLowerCase().includes(search.toLowerCase()) ||
        execName.toLowerCase().includes(search.toLowerCase()) ||
        issueId.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        selectedStatusFilter === "ALL" || issue.status === selectedStatusFilter;

      const matchesWarehouse =
        selectedWarehouseFilter === "ALL" || issue.warehouseId === selectedWarehouseFilter;

      return matchesSearch && matchesStatus && matchesWarehouse;
    });
  }, [productIssues, search, selectedStatusFilter, selectedWarehouseFilter]);

  // Metrics
  const metrics = useMemo(() => {
    const total = productIssues.length;
    const pending = productIssues.filter((i) => i.status === "PENDING").length;
    const issued = productIssues.filter((i) => i.status === "ISSUED").length;
    const returned = productIssues.filter((i) => i.status === "RETURNED").length;
    const cancelled = productIssues.filter((i) => i.status === "CANCELLED").length;

    return { total, pending, issued, returned, cancelled };
  }, [productIssues]);

  // Available stock preview in create form
  const selectedProductStock = useMemo(() => {
    if (!createForm.productId || !createForm.warehouseId) return null;

    const prod = products.find((p) => p.id === createForm.productId);
    if (!prod || !Array.isArray(prod.stocks)) return null;

    const stockRec = prod.stocks.find(
      (s) => s.warehouseId === createForm.warehouseId || s.warehouse?.id === createForm.warehouseId
    );

    if (!stockRec) return { physical: 0, reserved: 0, available: 0 };
    const physical = stockRec.quantity || 0;
    const reserved = stockRec.reservedQuantity || 0;
    return {
      physical,
      reserved,
      available: Math.max(0, physical - reserved),
    };
  }, [products, createForm.productId, createForm.warehouseId]);

  // Executive -> Branch -> Warehouse resolution
  const resolveExecutiveWarehouse = useCallback((execId) => {
    if (!execId) return null;
    const exec = users.find((u) => u.id === execId);
    if (!exec) return null;

    // 1. Direct exec.branch.warehouses check
    if (exec.branch?.warehouses && Array.isArray(exec.branch.warehouses) && exec.branch.warehouses.length > 0) {
      return exec.branch.warehouses[0];
    }

    // 2. Lookup in warehouses list by exec.branchId or exec.branch?.id
    const branchId = exec.branchId || exec.branch?.id;
    if (branchId && warehouses.length > 0) {
      const match = warehouses.find((w) =>
        Array.isArray(w.branches)
          ? w.branches.some((b) => b.id === branchId)
          : w.branchId === branchId
      );
      if (match) return match;
    }

    return null;
  }, [users, warehouses]);

  // Executive selection change handler
  const handleExecutiveChange = (execId) => {
    setCreateError("");
    if (!execId) {
      setCreateForm((prev) => ({ ...prev, salesExecutiveId: "", warehouseId: "" }));
      return;
    }

    const resolvedWh = resolveExecutiveWarehouse(execId);
    if (resolvedWh) {
      setCreateForm((prev) => ({
        ...prev,
        salesExecutiveId: execId,
        warehouseId: resolvedWh.id,
      }));
    } else {
      setCreateForm((prev) => ({
        ...prev,
        salesExecutiveId: execId,
        warehouseId: "",
      }));
      setCreateError("No dedicated warehouse is assigned to this executive's branch.");
    }
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    const initialExecId = salesExecutives[0]?.id || users[0]?.id || "";
    const resolvedWh = resolveExecutiveWarehouse(initialExecId);

    setCreateForm({
      productId: products[0]?.id || "",
      warehouseId: resolvedWh ? resolvedWh.id : "",
      salesExecutiveId: initialExecId,
      quantity: "1",
      notes: "",
    });
    setCreateError(
      initialExecId && !resolvedWh
        ? "No dedicated warehouse is assigned to this executive's branch."
        : ""
    );
    setShowCreateModal(true);
  };

  // Submit Create Product Issue
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateError("");

    const qty = parseInt(createForm.quantity);
    if (isNaN(qty) || qty <= 0) {
      setCreateError("Quantity must be a positive integer");
      return;
    }

    if (!createForm.productId || !createForm.warehouseId || !createForm.salesExecutiveId) {
      setCreateError("Please select Product, Warehouse, and Sales Executive");
      return;
    }

    if (selectedProductStock && qty > selectedProductStock.available) {
      setCreateError(`Insufficient stock. Available stock is ${selectedProductStock.available} units.`);
      return;
    }

    setCreateSubmitting(true);
    try {
      await inventoryApi.createProductIssue({
        productId: createForm.productId,
        warehouseId: createForm.warehouseId,
        salesExecutiveId: createForm.salesExecutiveId,
        quantity: qty,
        notes: createForm.notes.trim() || undefined,
      });
      toast.success("Product issue request created successfully");
      setShowCreateModal(false);
      fetchData();
    } catch (err) {
      console.error("Error creating product issue:", err);
      const msg = err.response?.data?.message || err.message || "Failed to create product issue request";
      setCreateError(msg);
      toast.error(msg);
    } finally {
      setCreateSubmitting(false);
    }
  };

  // Status Action (Dispatch, Cancel, Return)
  const handleStatusChange = async (issue, newStatus) => {
    const actionLabel =
      newStatus === "ISSUED"
        ? "dispatch/issue"
        : newStatus === "CANCELLED"
        ? "cancel"
        : "return";

    if (!window.confirm(`Are you sure you want to ${actionLabel} this product issue?`)) {
      return;
    }

    try {
      await inventoryApi.updateProductIssueStatus(issue.id, {
        status: newStatus,
        notes: `Status changed to ${newStatus} by ${user?.email || "Manager"}`,
      });
      toast.success(`Product issue status updated to ${newStatus}`);
      fetchData();
    } catch (err) {
      console.error("Error updating issue status:", err);
      const msg = err.response?.data?.message || err.message || "Failed to update issue status";
      toast.error(msg);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Product Issues & Dispatches</h1>
          <p className="text-slate-500 text-sm mt-1">
            Hand over physical inventory from dedicated branch warehouses to Sales Executives.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-medium text-sm rounded-xl shadow-xs hover:bg-slate-50 transition"
          >
            <RotateCw size={16} className={refreshing ? "animate-spin text-indigo-600" : "text-slate-500"} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-xs transition"
          >
            <Plus size={18} />
            Create Issue Request
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Requests</span>
            <h3 className="text-2xl font-extrabold text-slate-800 mt-0.5">{metrics.total}</h3>
            <span className="text-[11px] text-slate-500">All issue logs</span>
          </div>
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
            <ClipboardCheck size={22} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pending</span>
            <h3 className="text-2xl font-extrabold text-amber-600 mt-0.5">{metrics.pending}</h3>
            <span className="text-[11px] text-slate-500">Awaiting dispatch</span>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
            <Clock size={22} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Issued / Dispatched</span>
            <h3 className="text-2xl font-extrabold text-emerald-600 mt-0.5">{metrics.issued}</h3>
            <span className="text-[11px] text-slate-500">Stock handed over</span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={22} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Returned</span>
            <h3 className="text-2xl font-extrabold text-blue-600 mt-0.5">{metrics.returned}</h3>
            <span className="text-[11px] text-slate-500">Added back to WH</span>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
            <RotateCw size={22} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Cancelled</span>
            <h3 className="text-2xl font-extrabold text-slate-500 mt-0.5">{metrics.cancelled}</h3>
            <span className="text-[11px] text-slate-500">Request cancelled</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-100 text-slate-500">
            <XCircle size={22} />
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
            placeholder="Search product, SKU, executive, or issue ID..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-400" />
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">PENDING</option>
              <option value="ISSUED">ISSUED</option>
              <option value="RETURNED">RETURNED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Warehouse size={16} className="text-slate-400" />
            <select
              value={selectedWarehouseFilter}
              onChange={(e) => setSelectedWarehouseFilter(e.target.value)}
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

      {/* Product Issues Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[850px]">
            <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Issue Reference</th>
                <th className="px-6 py-4">Product Name</th>
                <th className="px-6 py-4">Warehouse</th>
                <th className="px-6 py-4">Sales Executive</th>
                <th className="px-6 py-4 text-center">Qty</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Requested At</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading product issue requests...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredIssues.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <ClipboardCheck size={40} className="mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-700">No product issue records found</p>
                    <p className="text-xs text-slate-400 mt-1">Try clearing status or search filters.</p>
                  </td>
                </tr>
              ) : (
                filteredIssues.map((issue) => {
                  let statusBadge = (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      <Clock size={12} /> PENDING
                    </span>
                  );

                  if (issue.status === "ISSUED") {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 size={12} /> ISSUED
                      </span>
                    );
                  } else if (issue.status === "RETURNED") {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        <RotateCw size={12} /> RETURNED
                      </span>
                    );
                  } else if (issue.status === "CANCELLED") {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                        <XCircle size={12} /> CANCELLED
                      </span>
                    );
                  }

                  const execName = issue.salesExecutive
                    ? `${issue.salesExecutive.firstName} ${issue.salesExecutive.lastName}`
                    : "Sales Executive";

                  return (
                    <tr key={issue.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">
                          #{issue.id ? issue.id.slice(0, 8) : "REQ"}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
                            <Package size={20} />
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 block">{issue.product?.name || "Product"}</span>
                            <span className="text-xs font-mono text-slate-400 block">{issue.product?.sku}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 font-semibold text-slate-800 text-xs">
                        {issue.warehouse?.name || "Warehouse"}
                      </td>

                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-800 text-xs block">{execName}</span>
                        <span className="text-[11px] text-slate-400 block">{issue.salesExecutive?.email}</span>
                      </td>

                      <td className="px-6 py-4 text-center font-extrabold text-indigo-600 text-base">
                        {issue.quantity}
                      </td>

                      <td className="px-6 py-4 text-center">{statusBadge}</td>

                      <td className="px-6 py-4 text-center text-xs text-slate-500">
                        {new Date(issue.createdAt || Date.now()).toLocaleDateString()}
                      </td>

                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setViewIssueItem(issue)}
                            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition"
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>

                          {issue.status === "PENDING" && (
                            <>
                              <button
                                onClick={() => handleStatusChange(issue, "ISSUED")}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center gap-1"
                                title="Approve & Issue Product (Reduces Stock)"
                              >
                                <CheckCircle2 size={14} /> Issue
                              </button>

                              <button
                                onClick={() => handleStatusChange(issue, "CANCELLED")}
                                className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition"
                                title="Cancel Request"
                              >
                                <XCircle size={16} />
                              </button>
                            </>
                          )}

                          {issue.status === "ISSUED" && (
                            <button
                              onClick={() => handleStatusChange(issue, "RETURNED")}
                              className="px-2 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-bold text-xs transition flex items-center gap-1"
                              title="Mark Returned (Restores Stock)"
                            >
                              <RotateCw size={14} /> Return
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE PRODUCT ISSUE MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 md:p-8"
            >
              <button
                onClick={() => setShowCreateModal(false)}
                className="absolute right-5 top-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
              >
                <X size={20} />
              </button>

              <h2 className="text-2xl font-bold text-slate-800 mb-1">
                Create Product Issue Request
              </h2>
              <p className="text-slate-500 text-xs mb-6">
                Request physical product hand-over to a Sales Executive.
              </p>

              {createError && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
                  <AlertTriangle size={16} />
                  {createError}
                </div>
              )}

              <form onSubmit={handleCreateSubmit} className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Sales Executive *</label>
                  <select
                    value={createForm.salesExecutiveId}
                    onChange={(e) => handleExecutiveChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">-- Select Sales Executive --</option>
                    {(salesExecutives.length > 0 ? salesExecutives : users).map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.firstName} {u.lastName} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">Dedicated Branch Warehouse *</label>
                    <span className="text-[10px] font-bold text-indigo-600 uppercase bg-indigo-50 px-2 py-0.5 rounded">
                      Auto-Derived from Executive Branch
                    </span>
                  </div>
                  {createForm.warehouseId ? (
                    <select
                      disabled
                      value={createForm.warehouseId}
                      className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 cursor-not-allowed opacity-90"
                    >
                      {warehouses.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name} ({w.code || "WH"})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
                      No dedicated warehouse is assigned to this executive's branch.
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Select Product *</label>
                  <select
                    value={createForm.productId}
                    onChange={(e) => setCreateForm({ ...createForm, productId: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Real-time Available Stock Context Box */}
                {selectedProductStock && createForm.warehouseId && (
                  <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium">Warehouse Stock Availability:</span>
                    <div className="flex items-center gap-3">
                      <span>Physical: <strong>{selectedProductStock.physical}</strong></span>
                      <span>Reserved: <strong className="text-amber-600">{selectedProductStock.reserved}</strong></span>
                      <span>Available: <strong className="text-emerald-700 text-sm font-bold">{selectedProductStock.available}</strong></span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Issue Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={createForm.quantity}
                    onChange={(e) => setCreateForm({ ...createForm, quantity: e.target.value })}
                    placeholder="e.g. 5"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Task Reference</label>
                  <input
                    type="text"
                    value={createForm.notes}
                    onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                    placeholder="e.g. Dispatched for Client Visit Task #104"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium text-xs hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createSubmitting}
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition disabled:opacity-50"
                  >
                    {createSubmitting ? "Creating..." : "Submit Issue Request"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* VIEW ISSUE DETAILS MODAL */}
      <AnimatePresence>
        {viewIssueItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="bg-slate-900 text-white p-6 relative">
                <button
                  onClick={() => setViewIssueItem(null)}
                  className="absolute right-5 top-5 p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition"
                >
                  <X size={20} />
                </button>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-white/10 text-indigo-400 border border-white/10">
                    <ClipboardCheck size={28} />
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wider font-semibold text-indigo-300 block">Product Issue Specification</span>
                    <h2 className="text-2xl font-bold text-white mt-0.5">#{viewIssueItem.id ? viewIssueItem.id.slice(0, 8) : "REQ"}</h2>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-5 text-xs">
                <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div>
                    <span className="text-slate-400 uppercase font-semibold block">Product</span>
                    <span className="font-bold text-slate-800 mt-1 block">{viewIssueItem.product?.name}</span>
                    <span className="text-[11px] font-mono text-slate-500 block">{viewIssueItem.product?.sku}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase font-semibold block">Warehouse</span>
                    <span className="font-bold text-indigo-600 mt-1 block">{viewIssueItem.warehouse?.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase font-semibold block">Sales Executive</span>
                    <span className="font-bold text-slate-800 mt-1 block">
                      {viewIssueItem.salesExecutive ? `${viewIssueItem.salesExecutive.firstName} ${viewIssueItem.salesExecutive.lastName}` : "Executive"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase font-semibold block">Requested Quantity</span>
                    <span className="font-extrabold text-indigo-600 text-base mt-1 block">{viewIssueItem.quantity} units</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 uppercase font-semibold block">Current Status</span>
                    <span className="font-extrabold text-slate-800 text-sm mt-1 block">{viewIssueItem.status}</span>
                  </div>
                  {viewIssueItem.notes && (
                    <div className="text-right">
                      <span className="text-slate-400 uppercase font-semibold block">Notes</span>
                      <span className="text-slate-600 mt-1 block">{viewIssueItem.notes}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
                <button
                  onClick={() => setViewIssueItem(null)}
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
