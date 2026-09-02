import { useState, useEffect } from "react";
import {
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  X,
  RotateCw,
  ShoppingBag,
  ArrowRight,
  Sparkles,
  Link as LinkIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

import crmApi from "../../api/crm.api";
import inventoryApi from "../../api/inventory.api";

export default function ImportOrdersModal({ isOpen, onClose, onOrdersConverted }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [converting, setConverting] = useState(false);
  const [importSummary, setImportSummary] = useState(null);

  // Available products for manual re-mapping dropdown
  const [availableProducts, setAvailableProducts] = useState([]);
  const [mappingRowId, setMappingRowId] = useState(null);

  // Fetch product catalog for mapping lookup
  useEffect(() => {
    if (isOpen) {
      inventoryApi.getProducts()
        .then((res) => {
          const prods = res.data?.data?.products || res.data?.products || (Array.isArray(res.data?.data) ? res.data.data : []);
          setAvailableProducts(prods);
        })
        .catch((err) => console.warn("Failed to load products for mapping:", err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle File Selection
  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (!selected.name.endsWith('.xlsx') && !selected.name.endsWith('.xls')) {
        toast.error("Only Excel files (.xlsx or .xls) are supported.");
        return;
      }
      setFile(selected);
      setImportSummary(null);
    }
  };

  // Download Sample Template
  const handleDownloadTemplate = async () => {
    try {
      const res = await crmApi.getCRMTemplate();
      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "CRM_Orders_Import_Template.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Sample Excel template downloaded");
    } catch (err) {
      console.error("Template download error:", err);
      toast.error("Failed to download sample template");
    }
  };

  // Submit Upload
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error("Please select an Excel file to upload");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    try {
      const res = await crmApi.uploadCRMFile(formData);
      const summary = res.data?.data || res.data;
      setImportSummary(summary);
      toast.success(`Excel processed! ${summary.successfulRows || 0} rows staged successfully.`);
    } catch (err) {
      console.error("Upload error:", err);
      const msg = err.response?.data?.message || err.message || "Failed to process Excel import";
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  // Handle Manual Product Mapping
  const handleMapProduct = async (rowId, productId) => {
    if (!productId) return;
    setMappingRowId(rowId);
    try {
      await crmApi.mapCRMProduct(rowId, productId);
      toast.success("Product mapped successfully");
      // Re-fetch import summary
      if (importSummary?.id) {
        const res = await crmApi.getCRMImportById(importSummary.id);
        setImportSummary(res.data?.data || res.data);
      }
    } catch (err) {
      console.error("Mapping error:", err);
      toast.error(err.response?.data?.message || "Failed to map product");
    } finally {
      setMappingRowId(null);
    }
  };

  // Convert Staged Rows to Orders
  const handleConvertOrders = async () => {
    if (!importSummary?.id) return;

    setConverting(true);
    try {
      const res = await crmApi.convertImportToOrders(importSummary.id);
      const result = res.data?.data || res.data;

      toast.success(
        `Successfully converted ${result.convertedRowsCount || 0} rows into ${result.convertedOrdersCount || 0} Sales Orders!`,
        { duration: 5000 }
      );

      if (onOrdersConverted) onOrdersConverted(result);
      onClose();
    } catch (err) {
      console.error("Conversion error:", err);
      const msg = err.response?.data?.message || err.message || "Failed to convert import into Sales Orders";
      toast.error(msg);
    } finally {
      setConverting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-4xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 md:p-8 max-h-[92vh] flex flex-col my-auto overflow-hidden"
      >
        {/* Modal Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600">
            <FileSpreadsheet size={26} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Import Sales Orders (Excel)</h2>
            <p className="text-slate-500 text-xs mt-0.5">
              Upload customer demand & order lists in Excel format to stage and generate Sales Orders.
            </p>
          </div>
        </div>

        {/* Step 1: Upload Form */}
        {!importSummary ? (
          <div className="space-y-6">
            {/* Download Template Bar */}
            <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between gap-4">
              <div>
                <span className="font-bold text-slate-800 text-sm block">Need the standard Excel format?</span>
                <span className="text-xs text-slate-500 block">Download the pre-formatted Excel template with required column headers.</span>
              </div>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-indigo-50 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 shadow-xs transition shrink-0 cursor-pointer"
              >
                <Download size={14} /> Download Template
              </button>
            </div>

            {/* Dropzone */}
            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div className="border-2 border-dashed border-slate-200 hover:border-indigo-500 rounded-3xl p-8 text-center bg-slate-50/50 hover:bg-indigo-50/30 transition cursor-pointer relative">
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <Upload size={40} className="mx-auto text-indigo-500 mb-3" />
                {file ? (
                  <div>
                    <span className="font-bold text-slate-800 text-sm block">{file.name}</span>
                    <span className="text-xs text-slate-500 block font-mono mt-1">{(file.size / 1024).toFixed(1)} KB</span>
                  </div>
                ) : (
                  <div>
                    <span className="font-bold text-slate-800 text-sm block">Click or drag Excel file (.xlsx, .xls) here</span>
                    <span className="text-xs text-slate-400 block mt-1">Supported headers: Customer ID, Customer Name, Product Code/SKU, Quantity, Requirement</span>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!file || uploading}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {uploading ? <RotateCw size={16} className="animate-spin" /> : <Upload size={16} />}
                  {uploading ? "Processing Excel..." : "Upload & Parse Excel"}
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Step 2: Staged Summary & Re-mapping */
          <div className="space-y-6 overflow-hidden flex flex-col flex-1">
            {/* KPI Summary Banner */}
            {(() => {
              const rowsList = importSummary.rows || [];
              const mappedCount = rowsList.length > 0
                ? rowsList.filter(r => r.status === 'MAPPED' || r.status === 'PROCESSED').length
                : (importSummary.summary?.mappedRows !== undefined ? importSummary.summary.mappedRows : (importSummary.successfulRows || 0));
              const invalidProdCount = rowsList.length > 0
                ? rowsList.filter(r => r.status === 'INVALID_PRODUCT').length
                : (importSummary.summary?.invalidProducts || 0);

              return (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Rows</span>
                    <span className="text-xl font-extrabold text-slate-800 mt-0.5 block">{importSummary.totalRows || rowsList.length}</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">Mapped Rows</span>
                    <span className="text-xl font-extrabold text-emerald-800 mt-0.5 block">{mappedCount}</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">Invalid Products</span>
                    <span className="text-xl font-extrabold text-amber-800 mt-0.5 block">{invalidProdCount}</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-red-700 block">Failed Rows</span>
                    <span className="text-xl font-extrabold text-red-800 mt-0.5 block">{importSummary.failedRows || 0}</span>
                  </div>
                </div>
              );
            })()}

            {/* Staged Rows Table (With Horizontal & Vertical Scroll) */}
            <div className="border border-slate-200 rounded-2xl overflow-x-auto overflow-y-auto flex-1 max-h-72 shadow-xs">
              <table className="w-full min-w-[850px] text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 min-w-[50px]">#</th>
                    <th className="px-4 py-3 min-w-[180px]">Customer</th>
                    <th className="px-4 py-3 min-w-[240px]">Product Reference</th>
                    <th className="px-4 py-3 text-center min-w-[70px]">Qty</th>
                    <th className="px-4 py-3 min-w-[200px]">Requirement</th>
                    <th className="px-4 py-3 text-center min-w-[110px]">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {importSummary.rows?.map((row) => {
                    const isInvalidProd = row.status === "INVALID_PRODUCT";
                    const isMapped = row.status === "MAPPED";
                    const isProcessed = row.status === "PROCESSED";

                    return (
                      <tr key={row.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-4 py-3 font-mono font-bold text-slate-500">{row.rowNumber}</td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-slate-800 block">{row.customerName || row.crmCustomerId || "N/A"}</span>
                          <span className="text-[10px] text-slate-400 font-mono block">{row.phoneNumber || row.email}</span>
                        </td>
                        <td className="px-4 py-3">
                          {row.mappedProduct ? (
                            <div>
                              <span className="font-bold text-emerald-700 block">{row.mappedProduct.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono block">SKU: {row.mappedProduct.sku}</span>
                            </div>
                          ) : (
                            <div>
                              <span className="font-mono text-slate-700 block">{row.productCode || row.crmProductId || "Unmapped"}</span>
                              {isInvalidProd && (
                                <div className="mt-1 flex items-center gap-1">
                                  <select
                                    disabled={mappingRowId === row.id}
                                    onChange={(e) => handleMapProduct(row.id, e.target.value)}
                                    defaultValue=""
                                    className="px-2 py-1 bg-amber-50 border border-amber-200 text-slate-800 rounded font-semibold text-[11px] focus:outline-none"
                                  >
                                    <option value="" disabled>Map to active product...</option>
                                    {availableProducts.map((p) => (
                                      <option key={p.id} value={p.id}>
                                        {p.name} ({p.sku})
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-slate-800">
                          {row.quantity || 1}
                        </td>
                        <td className="px-4 py-3 text-slate-600 max-w-xs truncate">
                          {row.requirement || row.notes || "—"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${
                              isProcessed
                                ? "bg-purple-50 text-purple-700 border-purple-200"
                                : isMapped
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : isInvalidProd
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-red-50 text-red-700 border-red-200"
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => { setFile(null); setImportSummary(null); }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
              >
                Upload Another File
              </button>

              <button
                type="button"
                onClick={handleConvertOrders}
                disabled={converting || !importSummary.successfulRows}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
              >
                {converting ? <RotateCw size={16} className="animate-spin" /> : <ShoppingBag size={16} />}
                {converting ? "Generating Sales Orders..." : "Convert Mapped Rows to Sales Orders"}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
