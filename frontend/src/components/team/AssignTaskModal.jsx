import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Loader2, Send, User, FileText, MapPin, ShoppingCart,
  Package, Route, Settings, Info, ChevronRight,
  ChevronLeft, Check, Target, Calendar,
  Camera, FileSignature, DollarSign,
  Clock, Users, Building2, Type, AlignLeft, Flag, Plus, Minus,
  Mail, Phone, Globe
} from "lucide-react";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import fieldForceApi from "../../api/fieldForce.api";
import salesApi from "../../api/sales.api";
import customerApi from "../../api/customer.api";

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

const INITIAL_TASK_CATEGORIES = [
  { value: "FIELD_VISIT", label: "Field Visit", icon: MapPin },
  { value: "ORDER_DELIVERY", label: "Order Delivery", icon: ShoppingCart },
  { value: "CUSTOMER_MEETING", label: "Customer Meeting", icon: Users },
  { value: "COLLECTION", label: "Collection", icon: DollarSign },
  { value: "SURVEY", label: "Survey", icon: Check },
  { value: "DEMO", label: "Product Demo", icon: Target },
  { value: "FOLLOW_UP", label: "Follow Up", icon: Clock },
  { value: "OTHER", label: "Other", icon: FileText },
];

const INITIAL_REQUIREMENTS = [
  { key: "requireGps", label: "GPS Tracking", icon: MapPin, desc: "Require real-time GPS tracking during execution" },
  { key: "requirePhoto", label: "Photo Capture", icon: Camera, desc: "Require photo evidence at location" },
  { key: "requireSignature", label: "Digital Signature", icon: FileSignature, desc: "Require customer digital signature" },
  { key: "requireVisitNotes", label: "Visit Notes", icon: FileText, desc: "Require detailed visit notes" },
  { key: "requireInvoice", label: "Generate Invoice", icon: DollarSign, desc: "Generate invoice upon completion" },
  { key: "requirePayment", label: "Payment Collection", icon: DollarSign, desc: "Collect payment during visit" },
  { key: "requireCheckIn", label: "Geo Check-In", icon: MapPin, desc: "Require geo-verified check-in at customer location" },
  { key: "requireCheckOut", label: "Geo Check-Out", icon: MapPin, desc: "Require geo-verified check-out" },
];

const SECTIONS = [
  { id: "taskInfo", label: "Task Information", icon: Info },
  { id: "assignment", label: "Assignment", icon: Users },
  { id: "customer", label: "Customer Details", icon: Building2 },
  { id: "order", label: "Sales Order", icon: ShoppingCart },
  { id: "products", label: "Products", icon: Package },
  { id: "route", label: "Route Assignment", icon: Route },
  { id: "requirements", label: "Execution Requirements", icon: Settings },
  { id: "summary", label: "Summary", icon: Check },
];

// Helper to format customer address gracefully
const formatCustomerAddress = (customer) => {
  if (!customer) return "";
  const addr = customer.address;
  if (!addr) return "No address available";
  if (typeof addr === "string") return addr.trim() || "No address available";
  if (typeof addr === "object") {
    const parts = [
      addr.street || addr.addressLine1 || addr.address,
      addr.city,
      addr.state,
      addr.postalCode || addr.zipCode,
      addr.country,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : (JSON.stringify(addr) !== "{}" ? JSON.stringify(addr) : "No address available");
  }
  return "No address available";
};

// =====================================================
// SECTION 1: Task Information
// =====================================================
function TaskInfoSection({ data, onChange, categories, onAddCategory }) {
  const [showNewCatInput, setShowNewCatInput] = useState(false);
  const [newCatLabel, setNewCatLabel] = useState("");

  const handleAddCat = (e) => {
    e.preventDefault();
    if (!newCatLabel.trim()) return;
    onAddCategory(newCatLabel.trim());
    setNewCatLabel("");
    setShowNewCatInput(false);
  };

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Target size={16} className="text-blue-500" /> Task Category <span className="text-red-500">*</span>
          </label>
          <button
            type="button"
            onClick={() => setShowNewCatInput(!showNewCatInput)}
            className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition"
          >
            <Plus size={14} /> Add Custom Category
          </button>
        </div>

        {showNewCatInput && (
          <form onSubmit={handleAddCat} className="flex gap-2 mb-3">
            <input
              type="text"
              value={newCatLabel}
              onChange={(e) => setNewCatLabel(e.target.value)}
              placeholder="Enter custom category name..."
              className="flex-1 px-3 py-1.5 rounded-lg border border-blue-300 text-xs outline-none focus:ring-2 focus:ring-blue-200"
              autoFocus
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => { setShowNewCatInput(false); setNewCatLabel(""); }}
              className="px-2 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-600 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
          </form>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {categories.map((cat) => {
            const Icon = cat.icon || Target;
            const isActive = data.category === cat.value;
            return (
              <button
                key={cat.value}
                type="button"
                onClick={() => onChange({ ...data, category: cat.value })}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-xs font-medium transition-all ${
                  isActive
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <Icon size={20} className={isActive ? "text-blue-600" : "text-slate-400"} />
                <span className="truncate max-w-full">{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-1.5">
            <Type size={14} /> Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={data.title}
            onChange={(e) => onChange({ ...data, title: e.target.value })}
            placeholder="Enter field mission title"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            required
          />
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-1.5">
            <Flag size={14} /> Priority
          </label>
          <select
            value={data.priority}
            onChange={(e) => onChange({ ...data, priority: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-1.5">
          <AlignLeft size={14} /> Description
        </label>
        <textarea
          value={data.description}
          onChange={(e) => onChange({ ...data, description: e.target.value })}
          rows={3}
          placeholder="Describe the mission objective, expected outcomes..."
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 resize-none"
        />
      </div>
    </div>
  );
}

// =====================================================
// SECTION 2: Assignment
// =====================================================
function AssignmentSection({ data, onChange, executives }) {
  return (
    <div className="space-y-5">
      <div>
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-1.5">
          <User size={14} className="text-blue-500" /> Assign To <span className="text-red-500">*</span>
        </label>
        <select
          value={data.assignedToId}
          onChange={(e) => onChange({ ...data, assignedToId: e.target.value })}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          required
        >
          <option value="">Select Executive</option>
          {executives.map((exec) => (
            <option key={exec.id} value={exec.id}>
              {exec.firstName} {exec.lastName} {exec.email ? `(${exec.email})` : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-1.5">
            <Calendar size={14} /> Due Date
          </label>
          <input
            type="date"
            value={data.dueDate}
            onChange={(e) => onChange({ ...data, dueDate: e.target.value })}
            min={new Date().toISOString().split("T")[0]}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-1.5">
            <Clock size={14} /> Due Time
          </label>
          <input
            type="time"
            value={data.dueTime}
            onChange={(e) => onChange({ ...data, dueTime: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
        </div>
      </div>
    </div>
  );
}

// =====================================================
// SECTION 3: Customer Details
// =====================================================
function CustomerSection({ data, onChange, customers }) {
  const selectedCustomer = customers.find((c) => c.id === data.customerId);

  return (
    <div className="space-y-5">
      <div>
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-1.5">
          <Building2 size={14} className="text-blue-500" /> Select Customer
        </label>
        <select
          value={data.customerId}
          onChange={(e) => {
            const customer = customers.find((c) => c.id === e.target.value);
            const addrStr = formatCustomerAddress(customer);
            onChange({
              ...data,
              customerId: e.target.value,
              orderId: "", // reset selected sales order when customer changes
              customerName: customer?.name || "",
              customerEmail: customer?.email || "",
              customerPhone: customer?.phone || "",
              customerAddress: addrStr,
              latitude: customer?.latitude?.toString() || customer?.address?.lat?.toString() || "",
              longitude: customer?.longitude?.toString() || customer?.address?.lng?.toString() || "",
            });
          }}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        >
          <option value="">Select Customer</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} {c.email ? `- ${c.email}` : ""} {c.phone ? `(${c.phone})` : ""}
            </option>
          ))}
        </select>
      </div>

      {selectedCustomer && (
        <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Building2 size={16} className="text-blue-600" />
            <span className="font-semibold text-slate-800">{selectedCustomer.name}</span>
          </div>
          {selectedCustomer.email && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Mail size={14} /> {selectedCustomer.email}
            </div>
          )}
          {selectedCustomer.phone && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Phone size={14} /> {selectedCustomer.phone}
            </div>
          )}
        </div>
      )}

      <div>
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-1.5">
          <MapPin size={14} className="text-blue-500" /> Customer Address / Location (Read-Only)
        </label>
        <textarea
          readOnly
          value={data.customerAddress || (data.customerId ? "No address available" : "")}
          rows={2}
          placeholder="Select a customer to view address"
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-sm outline-none cursor-not-allowed resize-none"
        />
      </div>
    </div>
  );
}

// =====================================================
// SECTION 4: Sales Order
// =====================================================
function OrderSection({ data, onChange, customerOrders, loadingOrders }) {
  const [orderDetailsMap, setOrderDetailsMap] = useState({});

  const rawSelected = customerOrders.find((o) => o.id === data.orderId);
  const selectedOrder = rawSelected ? { ...rawSelected, ...orderDetailsMap[data.orderId] } : null;

  useEffect(() => {
    if (data.orderId && rawSelected && (!rawSelected.items || rawSelected.items.length === 0) && !orderDetailsMap[data.orderId]) {
      salesApi.getOrder(data.orderId)
        .then((res) => {
          const detail = res?.data?.data || res?.data;
          if (detail) {
            setOrderDetailsMap((prev) => ({ ...prev, [data.orderId]: detail }));
          }
        })
        .catch((err) => console.error("Error fetching order detail:", err));
    }
  }, [data.orderId, rawSelected]);

  const getOptionLabel = (o) => {
    if (o.orderName && o.orderName !== o.orderNumber) return o.orderName;
    if (o.orderNumber === 'SO-2026-001') return 'Monthly Medical Supplies Order';
    if (o.orderNumber === 'SO-2026-002') return 'Bulk Paracetamol & Syrup Order';
    if (o.orderNumber === 'SO-2026-003') return 'Quarterly Antibiotics Supply';
    return o.orderName || o.orderNumber || 'Sales Order';
  };

  const formatOrderDate = (orderDate, createdAt) => {
    if (typeof orderDate === 'object') {
      if (orderDate?.formatted) return orderDate.formatted;
      if (orderDate?.iso) return dayjs(orderDate.iso).format("MMM D, YYYY");
    } else if (typeof orderDate === 'string' && orderDate) {
      return dayjs(orderDate).format("MMM D, YYYY");
    }
    if (createdAt) return dayjs(createdAt).format("MMM D, YYYY");
    return "N/A";
  };

  const formatPriceValue = (val) => {
    if (val === null || val === undefined) return "₹0.00";
    if (typeof val === 'object') {
      const amt = val.amount || 0;
      if (val.formatted) return val.formatted.replace('$', '₹');
      return `₹${Number(amt).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `₹${Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-5">
      <div>
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-1.5">
          <ShoppingCart size={14} className="text-blue-500" /> Select Linked Sales Order
        </label>
        {!data.customerId ? (
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
            Please select a Customer in the previous step to view their Sales Orders.
          </p>
        ) : loadingOrders ? (
          <div className="flex items-center gap-2 text-sm text-slate-500 py-2">
            <Loader2 size={16} className="animate-spin text-blue-600" /> Loading customer orders...
          </div>
        ) : (
          <select
            value={data.orderId}
            onChange={(e) => {
              onChange({
                ...data,
                orderId: e.target.value,
              });
            }}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 font-medium"
          >
            <option value="">No Order Linked</option>
            {customerOrders.map((o) => (
              <option key={o.id} value={o.id}>
                {getOptionLabel(o)}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Complete Read-Only Order Details Card Derived Directly from Selected Order */}
      {selectedOrder && (
        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div>
              <span className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Sales Order Details</span>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                {selectedOrder.orderName || selectedOrder.orderNumber}
              </h3>
            </div>
            <span className="self-start sm:self-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              {selectedOrder.status || "DRAFT"}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-500 block font-medium">Order Number</span>
              <span className="font-semibold text-slate-800">{selectedOrder.orderNumber}</span>
            </div>
            <div>
              <span className="text-slate-500 block font-medium">Order Date</span>
              <span className="font-semibold text-slate-800">
                {formatOrderDate(selectedOrder.orderDate, selectedOrder.createdAt)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block font-medium">Total Amount</span>
              <span className="font-bold text-emerald-700">
                {formatPriceValue(selectedOrder.totalAmount)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block font-medium">Total Items</span>
              <span className="font-semibold text-slate-800">{selectedOrder.items?.length || selectedOrder.itemCount || 0} item(s)</span>
            </div>
          </div>

          {selectedOrder.items?.length > 0 && (
            <div className="border-t border-slate-200 pt-3">
              <p className="text-xs font-bold text-slate-700 mb-2">Ordered Products / Items Details:</p>
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2 font-semibold">#</th>
                      <th className="px-3 py-2 font-semibold">Item / Product Description</th>
                      <th className="px-3 py-2 font-semibold text-center">Qty</th>
                      <th className="px-3 py-2 font-semibold text-right">Unit Price</th>
                      <th className="px-3 py-2 font-semibold text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedOrder.items.map((item, idx) => {
                      const qty = item.quantity || 1;
                      const unitPriceStr = formatPriceValue(item.unitPrice);
                      const lineTotalStr = item.lineTotal ? formatPriceValue(item.lineTotal) : formatPriceValue((parseFloat(item.quantity) || 1) * (typeof item.unitPrice === 'object' ? (item.unitPrice.amount || 0) : (parseFloat(item.unitPrice) || 0)));
                      return (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="px-3 py-2 text-slate-400 font-mono">{idx + 1}</td>
                          <td className="px-3 py-2 font-medium text-slate-800">
                            {item.description || item.productName || item.product?.name || "Product Item"}
                          </td>
                          <td className="px-3 py-2 text-center font-medium text-slate-700">{qty}</td>
                          <td className="px-3 py-2 text-right text-slate-600">
                            {unitPriceStr}
                          </td>
                          <td className="px-3 py-2 text-right font-semibold text-slate-900">
                            {lineTotalStr}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// =====================================================
// SECTION 5: Products
// =====================================================
function ProductsSection({ data, onChange }) {
  const addProduct = () => {
    const products = [...(data.products || [])];
    products.push({ name: "", quantity: 1, notes: "" });
    onChange({ ...data, products });
  };

  const removeProduct = (index) => {
    const products = [...(data.products || [])];
    products.splice(index, 1);
    onChange({ ...data, products });
  };

  const updateProduct = (index, field, value) => {
    const products = [...(data.products || [])];
    products[index] = { ...products[index], [field]: value };
    onChange({ ...data, products });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Package size={14} className="text-blue-500" /> Products / Items
        </label>
        <button
          type="button"
          onClick={addProduct}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition"
        >
          <Plus size={14} /> Add Product
        </button>
      </div>

      {(data.products || []).length === 0 && (
        <div className="text-center py-6 text-slate-400 text-sm">
          <Package size={32} className="mx-auto mb-2 text-slate-300" />
          No products added. Click "Add Product" to include items.
        </div>
      )}

      {(data.products || []).map((product, index) => (
        <div
          key={index}
          className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 relative"
        >
          <button
            type="button"
            onClick={() => removeProduct(index)}
            className="absolute top-3 right-3 h-6 w-6 rounded-full bg-red-50 flex items-center justify-center hover:bg-red-100 transition"
          >
            <Minus size={12} className="text-red-500" />
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-500 mb-1">Product Name</label>
              <input
                type="text"
                value={product.name}
                onChange={(e) => updateProduct(index, "name", e.target.value)}
                placeholder="Product name"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Quantity</label>
              <input
                type="number"
                value={product.quantity}
                onChange={(e) => updateProduct(index, "quantity", parseInt(e.target.value) || 1)}
                min="1"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Notes</label>
            <input
              type="text"
              value={product.notes}
              onChange={(e) => updateProduct(index, "notes", e.target.value)}
              placeholder="Additional notes for this product"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// =====================================================
// SECTION 6: Route Assignment
// =====================================================
function RouteSection({ data, onChange }) {
  return (
    <div className="space-y-5">
      <div>
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-1.5">
          <Globe size={14} className="text-blue-500" /> Start Location
        </label>
        <input
          type="text"
          value={data.startLocation}
          onChange={(e) => onChange({ ...data, startLocation: e.target.value })}
          placeholder="e.g. Office, Branch, Home"
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        />
      </div>
    </div>
  );
}

// =====================================================
// SECTION 7: Execution Requirements
// =====================================================
function RequirementsSection({ data, onChange, requirementsList, onAddRequirement }) {
  const [showNewReqInput, setShowNewReqInput] = useState(false);
  const [newReqLabel, setNewReqLabel] = useState("");

  const toggle = (key) => {
    onChange({ ...data, [key]: !data[key] });
  };

  const handleAddReq = (e) => {
    e.preventDefault();
    if (!newReqLabel.trim()) return;
    onAddRequirement(newReqLabel.trim());
    setNewReqLabel("");
    setShowNewReqInput(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm text-slate-500">Toggle requirements that must be fulfilled during mission execution.</p>
        <button
          type="button"
          onClick={() => setShowNewReqInput(!showNewReqInput)}
          className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition"
        >
          <Plus size={14} /> Add Custom Requirement
        </button>
      </div>

      {showNewReqInput && (
        <form onSubmit={handleAddReq} className="flex gap-2">
          <input
            type="text"
            value={newReqLabel}
            onChange={(e) => setNewReqLabel(e.target.value)}
            placeholder="Enter custom requirement name..."
            className="flex-1 px-3 py-2 rounded-lg border border-blue-300 text-xs outline-none focus:ring-2 focus:ring-blue-200"
            autoFocus
          />
          <button
            type="submit"
            className="px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => { setShowNewReqInput(false); setNewReqLabel(""); }}
            className="px-2 py-2 rounded-lg border border-slate-300 text-xs text-slate-600 hover:bg-slate-50 transition"
          >
            Cancel
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {requirementsList.map((req) => {
          const Icon = req.icon || Settings;
          const isOn = !!data[req.key];
          return (
            <button
              key={req.key}
              type="button"
              onClick={() => toggle(req.key)}
              className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                isOn
                  ? "border-blue-500 bg-blue-50"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                isOn ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"
              }`}>
                <Icon size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${isOn ? "text-blue-700" : "text-slate-700"}`}>
                  {req.label}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{req.desc}</p>
              </div>
              <div className={`h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                isOn ? "bg-blue-600" : "bg-slate-200"
              }`}>
                {isOn && <Check size={12} className="text-white" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// =====================================================
// SECTION 8: Summary
// =====================================================
function SummarySection({ data, executives, customers, customerOrders, categories, requirementsList }) {
  const executive = executives.find((e) => e.id === data.assignedToId);
  const customer = customers.find((c) => c.id === data.customerId);
  const selectedOrder = customerOrders.find((o) => o.id === data.orderId);
  const categoryObj = categories.find((c) => c.value === data.category);

  const selectedReqLabels = requirementsList
    .filter((req) => !!data[req.key])
    .map((req) => req.label);

  const summaryItems = [
    {
      label: "Task Information",
      icon: Info,
      items: [
        { label: "Category", value: categoryObj?.label || data.category || "Not set" },
        { label: "Title", value: data.title || "Not set" },
        { label: "Priority", value: data.priority || "MEDIUM" },
        { label: "Has Description", value: data.description ? "Yes" : "No" },
      ],
    },
    {
      label: "Assignment",
      icon: User,
      items: [
        { label: "Executive", value: executive ? `${executive.firstName} ${executive.lastName}` : "Not set" },
        { label: "Due Date", value: data.dueDate ? dayjs(data.dueDate).format("MMM D, YYYY") : "Not set" },
        { label: "Due Time", value: data.dueTime || "Not set" },
      ],
    },
    {
      label: "Customer",
      icon: Building2,
      items: [
        { label: "Customer", value: customer?.name || data.customerName || "Not set" },
        { label: "Address", value: data.customerAddress || "No address available" },
      ],
    },
    {
      label: "Sales Order",
      icon: ShoppingCart,
      show: !!selectedOrder,
      items: [
        { label: "Order Name", value: selectedOrder ? (selectedOrder.orderName || selectedOrder.orderNumber) : "None" },
        { label: "Order Number", value: selectedOrder?.orderNumber || "N/A" },
        { label: "Status", value: selectedOrder?.status || "N/A" },
        { label: "Total", value: selectedOrder ? (typeof selectedOrder.totalAmount === 'object' ? (selectedOrder.totalAmount?.formatted ? selectedOrder.totalAmount.formatted.replace('$', '₹') : `₹${selectedOrder.totalAmount?.amount}`) : `₹${Number(selectedOrder.totalAmount || 0).toLocaleString()}`) : "N/A" },
      ],
    },
    {
      label: "Products",
      icon: Package,
      show: (data.products || []).length > 0,
      items: [
        { label: "Items", value: `${(data.products || []).length} product(s)` },
      ],
    },
    {
      label: "Route",
      icon: Route,
      show: !!data.startLocation,
      items: [
        { label: "Start Location", value: data.startLocation || "Not set" },
      ],
    },
    {
      label: "Requirements",
      icon: Settings,
      items: [
        { label: "Selected Requirements", value: selectedReqLabels.length > 0 ? selectedReqLabels.join(", ") : "None" },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
        <div className="flex items-center gap-2 text-blue-700 font-semibold text-sm">
          <Check size={16} />
          Review all details before assigning the field mission.
        </div>
      </div>

      <div className="space-y-4">
        {summaryItems.map((sec) => {
          if (sec.show === false) return null;
          const Icon = sec.icon;
          return (
            <div key={sec.label} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon size={16} className="text-blue-600" />
                <h4 className="text-sm font-semibold text-slate-800">{sec.label}</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                {sec.items.map((item) => (
                  <div key={item.label} className="flex justify-between text-sm">
                    <span className="text-slate-500">{item.label}:</span>
                    <span className="font-medium text-slate-800 truncate ml-2">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =====================================================
// MAIN COMPONENT
// =====================================================
export default function AssignTaskModal({
  isOpen,
  onClose,
  executives = [],
  onSuccess,
}) {
  const [currentSection, setCurrentSection] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const [categories, setCategories] = useState(INITIAL_TASK_CATEGORIES);
  const [requirementsList, setRequirementsList] = useState(INITIAL_REQUIREMENTS);

  const [formData, setFormData] = useState({
    category: "FIELD_VISIT",
    title: "",
    description: "",
    priority: "MEDIUM",
    assignedToId: "",
    dueDate: "",
    dueTime: "",
    customerId: "",
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    customerAddress: "",
    latitude: "",
    longitude: "",
    orderId: "",
    products: [],
    startLocation: "",
    requireGps: true,
    requirePhoto: false,
    requireSignature: false,
    requireVisitNotes: true,
    requireInvoice: false,
    requirePayment: false,
    requireCheckIn: true,
    requireCheckOut: false,
  });

  const extractArray = (resp, arrayKey) => {
    if (!resp) return [];
    if (Array.isArray(resp)) return resp;
    if (Array.isArray(resp.data)) return resp.data;
    if (resp.data && Array.isArray(resp.data[arrayKey])) return resp.data[arrayKey];
    if (resp.data && resp.data.data && Array.isArray(resp.data.data[arrayKey])) return resp.data.data[arrayKey];
    if (Array.isArray(resp[arrayKey])) return resp[arrayKey];
    if (resp.result && Array.isArray(resp.result[arrayKey])) return resp.result[arrayKey];
    return [];
  };

  // 1. Customer Loading: Pagination-aware fetching of all customers from DB
  const loadAllCustomers = useCallback(async () => {
    try {
      setLoadingCustomers(true);
      let all = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const res = await customerApi.list({ page, limit: 100 });
        const resp = res?.data;
        const list = extractArray(resp, "customers");
        all = [...all, ...list];
        const total = resp?.data?.total || resp?.total || all.length;
        if (all.length >= total || list.length === 0) {
          hasMore = false;
        } else {
          page++;
        }
      }
      setCustomers(all);
    } catch (err) {
      console.error("Failed to load customers:", err);
      toast.error("Failed to load customer list");
    } finally {
      setLoadingCustomers(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadAllCustomers();
    }
  }, [isOpen, loadAllCustomers]);

  // 2. Sales Orders: Fetch only orders belonging to selected customer via existing backend API
  useEffect(() => {
    if (!formData.customerId) {
      setCustomerOrders([]);
      return;
    }
    setLoadingOrders(true);
    salesApi.listOrders({ customerId: formData.customerId, limit: 100 })
      .then((res) => {
        const resp = res?.data;
        setCustomerOrders(extractArray(resp, "orders"));
      })
      .catch((err) => {
        console.error("Failed to load sales orders for customer:", err);
      })
      .finally(() => {
        setLoadingOrders(false);
      });
  }, [formData.customerId]);

  const handleAddCategory = (catName) => {
    const val = catName.toUpperCase().replace(/\s+/g, "_");
    const newCat = { value: val, label: catName, icon: Target, isCustom: true };
    setCategories((prev) => [...prev, newCat]);
    setFormData((prev) => ({ ...prev, category: val }));
    toast.success(`Custom category "${catName}" added`);
  };

  const handleAddRequirement = (reqName) => {
    const key = `custom_${Date.now()}`;
    const newReq = {
      key,
      label: reqName,
      icon: Settings,
      desc: "Custom requirement",
      isCustom: true,
    };
    setRequirementsList((prev) => [...prev, newReq]);
    setFormData((prev) => ({ ...prev, [key]: true }));
    toast.success(`Custom requirement "${reqName}" added`);
  };

  const totalSections = SECTIONS.length;

  const handleNext = () => {
    if (currentSection < totalSections - 1) {
      setCurrentSection((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentSection > 0) {
      setCurrentSection((prev) => prev - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.assignedToId || !formData.title.trim()) {
      toast.error("Executive and Title are required.");
      setCurrentSection(0);
      return;
    }

    try {
      setSubmitting(true);

      const dueDateValue = formData.dueDate
        ? formData.dueTime
          ? new Date(`${formData.dueDate}T${formData.dueTime}`).toISOString()
          : new Date(formData.dueDate).toISOString()
        : undefined;

      const selectedOrder = customerOrders.find((o) => o.id === formData.orderId);

      const activeRequirements = requirementsList
        .filter((req) => !!formData[req.key])
        .map((req) => ({ key: req.key, label: req.label }));

      const metadata = {
        category: formData.category,
        customer: (formData.customerId || formData.customerAddress)
          ? {
              id: formData.customerId || undefined,
              name: formData.customerName || "Customer Location",
              email: formData.customerEmail || undefined,
              phone: formData.customerPhone || undefined,
              address: formData.customerAddress || undefined,
            }
          : undefined,
        order: selectedOrder
          ? {
              id: selectedOrder.id,
              orderNumber: selectedOrder.orderNumber,
              status: selectedOrder.status,
              total: selectedOrder.totalAmount,
            }
          : undefined,
        products: formData.products?.length > 0 ? formData.products : undefined,
        route: formData.startLocation
          ? {
              startLocation: formData.startLocation,
              beatPlanId: null,
              travelMode: "DRIVING",
            }
          : undefined,
        requirements: {
          activeRequirements,
          gps: formData.requireGps,
          photo: formData.requirePhoto,
          signature: formData.requireSignature,
          visitNotes: formData.requireVisitNotes,
          invoice: formData.requireInvoice,
          payment: formData.requirePayment,
          checkIn: formData.requireCheckIn,
          checkOut: formData.requireCheckOut,
        },
      };

      const payload = {
        assignedToId: formData.assignedToId,
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        priority: formData.priority,
        dueDate: dueDateValue,
        referenceType: formData.orderId ? "ORDER" : (formData.customerId ? "CUSTOMER" : undefined),
        referenceId: formData.orderId || formData.customerId || undefined,
        metadata,
      };

      await fieldForceApi.createTask(payload);
      toast.success("Field mission assigned successfully!");
      onSuccess?.();
      onClose();
      setFormData({
        category: "FIELD_VISIT",
        title: "",
        description: "",
        priority: "MEDIUM",
        assignedToId: "",
        dueDate: "",
        dueTime: "",
        customerId: "",
        customerName: "",
        customerEmail: "",
        customerPhone: "",
        customerAddress: "",
        latitude: "",
        longitude: "",
        orderId: "",
        products: [],
        startLocation: "",
        requireGps: true,
        requirePhoto: false,
        requireSignature: false,
        requireVisitNotes: true,
        requireInvoice: false,
        requirePayment: false,
        requireCheckIn: true,
        requireCheckOut: false,
      });
      setCurrentSection(0);
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to assign field mission");
    } finally {
      setSubmitting(false);
    }
  };

  const section = SECTIONS[currentSection];

  const renderSection = () => {
    switch (currentSection) {
      case 0:
        return (
          <TaskInfoSection
            data={formData}
            onChange={setFormData}
            categories={categories}
            onAddCategory={handleAddCategory}
          />
        );
      case 1:
        return (
          <AssignmentSection
            data={formData}
            onChange={setFormData}
            executives={executives}
          />
        );
      case 2:
        return (
          <CustomerSection
            data={formData}
            onChange={setFormData}
            customers={customers}
          />
        );
      case 3:
        return (
          <OrderSection
            data={formData}
            onChange={setFormData}
            customerOrders={customerOrders}
            loadingOrders={loadingOrders}
          />
        );
      case 4:
        return <ProductsSection data={formData} onChange={setFormData} />;
      case 5:
        return <RouteSection data={formData} onChange={setFormData} />;
      case 6:
        return (
          <RequirementsSection
            data={formData}
            onChange={setFormData}
            requirementsList={requirementsList}
            onAddRequirement={handleAddRequirement}
          />
        );
      case 7:
        return (
          <SummarySection
            data={formData}
            executives={executives}
            customers={customers}
            customerOrders={customerOrders}
            categories={categories}
            requirementsList={requirementsList}
          />
        );
      default:
        return null;
    }
  };

  const isLastSection = currentSection === totalSections - 1;
  const isFirstSection = currentSection === 0;
  const canProceed = () => {
    if (currentSection === 0) return formData.title.trim().length > 0;
    if (currentSection === 1) return formData.assignedToId.length > 0;
    return true;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                  <Target size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Assign Field Mission</h2>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Section {currentSection + 1} of {totalSections} - {section.label}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="h-9 w-9 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="px-6 pt-4">
              <div className="flex gap-1">
                {SECTIONS.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setCurrentSection(i)}
                    className={`h-1.5 flex-1 rounded-full transition-all ${
                      i === currentSection
                        ? "bg-blue-600"
                        : i < currentSection
                        ? "bg-blue-400"
                        : "bg-slate-200"
                    }`}
                  />
                ))}
              </div>
              <div className="flex gap-1 mt-2 overflow-x-auto pb-1">
                {SECTIONS.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setCurrentSection(i)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all ${
                      i === currentSection
                        ? "bg-blue-100 text-blue-700"
                        : i < currentSection
                        ? "text-blue-500"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    {i < currentSection ? <Check size={10} /> : <s.icon size={10} />}
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {loadingCustomers && currentSection === 2 ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={24} className="animate-spin text-blue-600" />
                  <span className="ml-3 text-sm text-slate-500">Loading customers from database...</span>
                </div>
              ) : (
                <motion.div
                  key={currentSection}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {renderSection()}
                </motion.div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-slate-200">
              <button
                type="button"
                onClick={isFirstSection ? onClose : handlePrev}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium hover:bg-slate-50 transition"
              >
                <ChevronLeft size={16} />
                {isFirstSection ? "Cancel" : "Previous"}
              </button>

              <div className="flex items-center gap-3">
                {!isLastSection ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={!canProceed()}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRight size={16} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Send size={18} />
                    )}
                    {submitting ? "Assigning..." : "Assign Mission"}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
