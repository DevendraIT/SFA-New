import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import dayjs from "dayjs";
import { IndianRupee, RefreshCw, Plus, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

import { useAuth } from "../../context/AuthContext";
import fieldForceApi from "../../api/fieldForce.api";
import PageHeader from "../../components/dashboard/PageHeader";
import SectionCard from "../../components/dashboard/SectionCard";
import ExpenseCard from "../../components/field-force/ExpenseCard";
import StatusBadge from "../../components/field-force/StatusBadge";
import EmptyDashboard from "../../components/dashboard/EmptyDashboard";
import ErrorState from "../../components/dashboard/ErrorState";
import { TableSkeleton } from "../../components/dashboard/LoadingSkeleton";

const EXPENSE_FILTERS = ["ALL", "PENDING", "APPROVED", "REJECTED"];

const CATEGORIES = ["TRAVEL", "MEALS", "ACCOMMODATION", "OTHER"];

export default function ExpensesPage() {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    category: "TRAVEL",
    date: dayjs().format("YYYY-MM-DD"),
    notes: "",
    receiptUrl: "",
  });

  const {
    data: expenses = [],
    isLoading: loading,
    error,
    refetch: loadData,
  } = useQuery({
    queryKey: ["expenses"],
    queryFn: async () => {
      const res = await fieldForceApi.listExpenses({ take: 100 });
      const data = res.data?.data || res.data;
      return data?.expenses || data || [];
    },
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await fieldForceApi.logExpense({
        amount: parseFloat(formData.amount),
        category: formData.category,
        date: new Date(formData.date).toISOString(),
        notes: formData.notes || undefined,
        receiptUrl: formData.receiptUrl || undefined,
      });
      toast.success("Expense logged successfully!");
      setShowForm(false);
      setFormData({ amount: "", category: "TRAVEL", date: dayjs().format("YYYY-MM-DD"), notes: "", receiptUrl: "" });
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to log expense");
    } finally {
      setSaving(false);
    }
  };

  const filteredExpenses = activeFilter === "ALL"
    ? expenses
    : expenses.filter((e) => e.status === activeFilter);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-slate-200 rounded animate-pulse" />
        <TableSkeleton rows={5} cols={3} />
      </div>
    );
  }

  if (error) {
    return <ErrorState message="Failed to load expenses" onRetry={loadData} />;
  }

  const totalAmount = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const pendingAmount = expenses.filter((e) => e.status === "PENDING").reduce((sum, e) => sum + (e.amount || 0), 0);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <PageHeader title="Expenses" subtitle="Log and manage your field expenses">
        <div className="flex gap-3">
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition">
            <Plus size={16} /> {showForm ? "Cancel" : "Log Expense"}
          </button>
          <button onClick={loadData} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium hover:bg-slate-50 transition">
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </PageHeader>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl bg-slate-50 p-4 text-center">
          <p className="text-2xl font-bold text-slate-800">{expenses.length}</p>
          <p className="text-xs text-slate-500 mt-1">Total</p>
        </div>
        <div className="rounded-xl bg-emerald-50 p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">₹{totalAmount.toLocaleString("en-IN")}</p>
          <p className="text-xs text-slate-500 mt-1">Total Amount</p>
        </div>
        <div className="rounded-xl bg-amber-50 p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{expenses.filter((e) => e.status === "PENDING").length}</p>
          <p className="text-xs text-slate-500 mt-1">Pending</p>
        </div>
        <div className="rounded-xl bg-blue-50 p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">₹{pendingAmount.toLocaleString("en-IN")}</p>
          <p className="text-xs text-slate-500 mt-1">Pending Amount</p>
        </div>
      </div>

      {/* Create Form */}
      {showForm && (
        <SectionCard title="Log New Expense" icon={IndianRupee} iconColor="text-cyan-600">
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Amount (₹) *</label>
                <input type="number" required step="0.01" min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
                <select value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat.charAt(0) + cat.slice(1).toLowerCase()}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date *</label>
              <input type="date" required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
              <textarea value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 text-sm"
                rows={3} placeholder="Optional description"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Receipt URL</label>
              <input type="url"
                value={formData.receiptUrl}
                onChange={(e) => setFormData({ ...formData, receiptUrl: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="https://..."
              />
            </div>
            <button type="submit" disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 transition disabled:opacity-50">
              {saving ? "Logging..." : "Log Expense"}
            </button>
          </form>
        </SectionCard>
      )}

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {EXPENSE_FILTERS.map((filter) => (
          <button key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition ${
              activeFilter === filter ? "bg-blue-600 text-white shadow-sm" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {filter === "ALL" ? "All" : filter.charAt(0) + filter.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Expense List */}
      <SectionCard title="Expenses" subtitle={`${filteredExpenses.length} expense(s)`} icon={IndianRupee} iconColor="text-cyan-600">
        {filteredExpenses.length === 0 ? (
          <EmptyDashboard title="No Expenses" description="No expenses logged yet" onAction={loadData} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredExpenses.map((expense, i) => (
              <ExpenseCard key={expense.id} expense={expense} index={i} />
            ))}
          </div>
        )}
      </SectionCard>
    </motion.div>
  );
}
