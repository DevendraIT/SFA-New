import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Package,
  Plus,
  Search,
  Pencil,
  Eye,
  X,
  Building,
  Layers,
  Filter,
  RotateCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Tag,
  DollarSign,
  Barcode,
  Boxes
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

import inventoryApi from "../../api/inventory.api";

export default function Products() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [viewProduct, setViewProduct] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [detailedProduct, setDetailedProduct] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    productCode: "",
    description: "",
    category: "",
    brand: "",
    unit: "pcs",
    price: "",
    costPrice: "",
    tax: "0",
    minimumStock: "10",
    barcode: "",
    isActive: true,
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchProducts = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await inventoryApi.getProducts({ q: search });
      const rawProducts = res.data?.data?.products || res.data?.products || (Array.isArray(res.data?.data) ? res.data.data : []);
      setProducts(rawProducts);
      if (isManualRefresh) toast.success("Product list updated");
    } catch (err) {
      console.error("Error fetching products:", err);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Derived Categories for filter dropdown
  const categories = useMemo(() => {
    const set = new Set();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ["ALL", ...Array.from(set)];
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        !search ||
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.sku?.toLowerCase().includes(search.toLowerCase()) ||
        p.productCode?.toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
        selectedCategory === "ALL" || (p.category && p.category === selectedCategory);

      return matchesSearch && matchesCategory;
    });
  }, [products, search, selectedCategory]);

  // Open Form for Create
  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      sku: `SKU-${Date.now().toString().slice(-6)}`,
      category: "General",
      price: "",
      description: "",
      isActive: true,
    });
    setFormError("");
    setShowAddModal(true);
  };

  // Open Form for Edit
  const handleOpenEdit = (prod) => {
    setEditingProduct(prod);
    setFormData({
      name: prod.name || "",
      sku: prod.sku || "",
      category: prod.category || "General",
      price: prod.price !== undefined ? String(prod.price) : "",
      description: prod.description || "",
      isActive: prod.isActive !== false,
    });
    setFormError("");
    setShowAddModal(true);
  };

  // Delete Product
  const handleDeleteProduct = async (prod) => {
    if (!window.confirm(`Are you sure you want to delete product "${prod.name}"?`)) return;
    try {
      await inventoryApi.deleteProduct(prod.id);
      toast.success(`Product "${prod.name}" deleted successfully`);
      fetchProducts();
    } catch (err) {
      console.error("Error deleting product:", err);
      toast.error(err.response?.data?.message || "Failed to delete product");
    }
  };

  // Handle Form Submit
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formData.name.trim() || formData.name.length < 2) {
      setFormError("Product name must be at least 2 characters");
      return;
    }

    if (!formData.sku.trim() || formData.sku.length < 2) {
      setFormError("Valid SKU is required");
      return;
    }

    const numericPrice = parseFloat(formData.price);
    if (isNaN(numericPrice) || numericPrice < 0) {
      setFormError("Please enter a valid non-negative price");
      return;
    }

    const payload = {
      name: formData.name.trim(),
      sku: formData.sku.trim().toUpperCase(),
      category: formData.category.trim() || undefined,
      price: numericPrice,
      description: formData.description.trim() || undefined,
      isActive: formData.isActive,
    };

    setFormSubmitting(true);
    try {
      if (editingProduct) {
        await inventoryApi.updateProduct(editingProduct.id, payload);
        toast.success(`Product "${payload.name}" updated successfully`);
      } else {
        await inventoryApi.createProduct(payload);
        toast.success(`Product "${payload.name}" created successfully`);
      }
      setShowAddModal(false);
      fetchProducts();
    } catch (err) {
      console.error("Error saving product:", err);
      const errMsg = err.response?.data?.message || err.message || "Failed to save product";
      setFormError(errMsg);
      toast.error(errMsg);
    } finally {
      setFormSubmitting(false);
    }
  };

  // View Product Details with Warehouse Breakdown
  const handleViewProduct = async (prod) => {
    setViewProduct(prod);
    setViewLoading(true);
    setDetailedProduct(null);

    try {
      const res = await inventoryApi.getProduct(prod.id);
      const details = res.data?.data || res.data;
      setDetailedProduct(details);
    } catch (err) {
      console.error("Error fetching product details:", err);
      toast.error("Unable to load detailed product stock");
    } finally {
      setViewLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Products Catalog</h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage master product definitions, pricing, SKUs, and stock thresholds.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchProducts(true)}
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
            Add Product
          </button>
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search size={18} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product name or SKU..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Filter size={16} className="text-slate-400 shrink-0" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                Category: {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Product Name</th>
                <th className="px-6 py-4">SKU</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4 text-right">Price</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading products...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Package size={40} className="mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-700">No products found</p>
                    <p className="text-xs text-slate-400 mt-1">Try clearing filters or search criteria.</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((prod) => {
                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
                            <Package size={20} />
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 block">{prod.name}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded">
                          {prod.sku}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                          {prod.category || "General"}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-xs text-slate-500 max-w-xs truncate">
                        {prod.description || "N/A"}
                      </td>

                      <td className="px-6 py-4 text-right font-bold text-slate-800">
                        ₹{Number(prod.price).toLocaleString()}
                      </td>

                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenEdit(prod)}
                            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition"
                            title="Edit Product"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(prod)}
                            className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition"
                            title="Delete Product"
                          >
                            <XCircle size={16} />
                          </button>
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

      {/* CREATE / EDIT PRODUCT MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl p-6 md:p-8"
            >
              <button
                onClick={() => setShowAddModal(false)}
                className="absolute right-5 top-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
              >
                <X size={20} />
              </button>

              <h2 className="text-2xl font-bold text-slate-800 mb-1">
                {editingProduct ? "Edit Product" : "Add New Product"}
              </h2>
              <p className="text-slate-500 text-xs mb-6">
                Single source of truth Product table definition used across SFA & Inventory.
              </p>

              {formError && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
                  <AlertTriangle size={16} />
                  {formError}
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="space-y-4 text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Product Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Paracetamol 500mg"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">SKU *</label>
                    <input
                      type="text"
                      required
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      placeholder="e.g. MED-PAR-500"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="e.g. Pharmaceuticals"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Price (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="0.00"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Product specification, dosage, or details..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="pt-3 flex items-center justify-between border-t border-slate-100">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    Active in Catalog
                  </label>

                  <div className="flex items-center gap-3">
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
                      className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition disabled:opacity-50"
                    >
                      {formSubmitting ? "Saving..." : editingProduct ? "Update Product" : "Create Product"}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
