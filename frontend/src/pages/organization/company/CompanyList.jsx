import { useState, useMemo } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Building2,
  Building,
  Mail,
  Phone,
  Eye,
  X,
  GitBranch,
  MapPin,
  TrendingUp,
  ShoppingCart,
  IndianRupee,
  Users,
  Award,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { motion } from "framer-motion";

import CompanyForm from "./CompanyForm";
import toast from "react-hot-toast";
import companyService from "../../../services/company.service";
import useCompanies from "../../../hooks/useCompanies";
import useHeadOfSalesDashboard from "../../../hooks/useHeadOfSalesDashboard";
import { useAuth } from "../../../context/AuthContext";

import DashboardHeader from "../../../components/dashboard/DashboardHeader";
import StatsGrid from "../../../components/dashboard/StatsGrid";
import StatCard from "../../../components/dashboard/StatCard";
import SectionCard from "../../../components/dashboard/SectionCard";
import ChartCard from "../../../components/dashboard/ChartCard";

export default function CompanyList() {
  const { user } = useAuth();
  const isHeadOfSales = useMemo(() => {
    if (!user) return false;
    const roleNames = Array.isArray(user.roles)
      ? user.roles.map((r) => (typeof r === "string" ? r : r.role?.name || r.name))
      : [user.role?.name || ""];
    return roleNames.some((r) => r && r.toLowerCase().includes("head of sales"));
  }, [user]);

  const { companies, loading, search, setSearch, reload } = useCompanies({
    debounce: true,
  });

  const { dashboard } = useHeadOfSalesDashboard();

  const [showModal, setShowModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [viewCompany, setViewCompany] = useState(null);

  const handleDelete = async (company) => {
    if (isHeadOfSales) return;
    const confirmed = window.confirm(`Delete "${company.name}" ?`);
    if (!confirmed) return;

    try {
      await companyService.deleteCompany(company.id);
      toast.success("Company deleted");
      reload();
    } catch (err) {
      console.log(err);
      toast.error("Unable to delete company");
    }
  };

  const revenue = dashboard?.revenue ?? 0;
  const totalSalesOrders = dashboard?.totalSalesOrders ?? 0;
  const approvedOrders = dashboard?.approvedOrders ?? 0;

  const totalBranchesCount = useMemo(() => {
    return companies?.reduce((sum, c) => sum + (c._count?.branches || 0), 0) || 0;
  }, [companies]);

  const totalTerritoriesCount = useMemo(() => {
    return companies?.reduce((sum, c) => sum + (c._count?.territories || 0), 0) || 0;
  }, [companies]);

  const activeCompaniesCount = useMemo(() => {
    return companies?.filter((c) => c.isActive !== false).length || 0;
  }, [companies]);

  const companyChartData = useMemo(() => {
    if (!companies || companies.length === 0) return [];
    return companies.map((c) => ({
      name: c.name,
      branches: c._count?.branches || 0,
      territories: c._count?.territories || 0,
    }));
  }, [companies]);

  // Head of Sales Analytics View
  if (isHeadOfSales) {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-8">
        <DashboardHeader
          title="Company Analytics & Performance"
          subtitle="Multi-company structural overview & branch capacity analytics"
          onRefresh={reload}
        />

        <StatsGrid>
          <StatCard title="Total Companies" value={companies?.length || 0} icon={Building2} color="bg-indigo-600" />
          <StatCard title="Active Companies" value={activeCompaniesCount} icon={Building} color="bg-emerald-600" />
          <StatCard title="Total Branches" value={totalBranchesCount} icon={GitBranch} color="bg-blue-600" />
          <StatCard title="Total Sales Orders" value={totalSalesOrders} icon={ShoppingCart} color="bg-cyan-500" />
          <StatCard title="Overall Revenue" value={revenue} icon={IndianRupee} color="bg-green-600" format="currency" />
        </StatsGrid>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <ChartCard title="Company Branch Distribution" subtitle="Branch breakdown per company" className="xl:col-span-2">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={companyChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="branches" fill="#3B82F6" radius={[6, 6, 0, 0]} name="Branches" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <SectionCard title="Company Ranking & Overview" subtitle="Status and capacity per company" icon={Award} iconColor="text-amber-500">
            {companies.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center">No companies registered.</p>
            ) : (
              <div className="space-y-3">
                {companies.map((c) => (
                  <div key={c.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/70">
                    <div className="flex items-center justify-between">
                      <h5 className="font-semibold text-slate-900 text-sm">{c.name}</h5>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${c.isActive !== false ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                        {c.isActive !== false ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-2 text-xs text-slate-500">
                      <span>Code: {c.code || "-"}</span>
                      <span className="font-semibold text-blue-600">{c._count?.branches || 0} Branches</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        <SectionCard title="Company Detailed Insights" subtitle="Live organizational records & contacts" icon={Building2} iconColor="text-indigo-600">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {companies.map((company) => (
              <div key={company.id} className="p-4 rounded-2xl border border-slate-200 bg-white hover:shadow-md transition space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                      <Building2 size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-base">{company.name}</h4>
                      <p className="text-xs text-slate-500">Code: {company.code || "-"}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setViewCompany(company)}
                    className="p-2 rounded-lg border hover:bg-slate-50 text-slate-600"
                    title="View Full Record"
                  >
                    <Eye size={16} />
                  </button>
                </div>
                <div className="pt-2 border-t text-xs flex justify-between items-center">
                  <span className="text-slate-400">Total Branches</span>
                  <span className="font-bold text-slate-800 text-sm">{company._count?.branches ?? 0}</span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* View Modal */}
        {viewCompany && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setViewCompany(null)}>
            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <button type="button" onClick={() => setViewCompany(null)} className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
                <X size={22} />
              </button>
              <h2 className="text-2xl font-bold text-slate-800 mb-4">{viewCompany.name}</h2>
              <div className="space-y-3 text-sm text-slate-700">
                <p><strong>Code:</strong> {viewCompany.code || "-"}</p>
                <p><strong>Email:</strong> {viewCompany.email || "-"}</p>
                <p><strong>Phone:</strong> {viewCompany.phone || "-"}</p>
                <p><strong>Address:</strong> {viewCompany.address || "-"}</p>
                <p><strong>Branches:</strong> {viewCompany._count?.branches ?? 0}</p>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    );
  }

  // Regular Management View for other roles
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            Company Management
          </h1>
          <p className="text-slate-500 mt-1">
            Manage companies inside your organization.
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedCompany(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-white hover:bg-indigo-700 transition"
        >
          <Plus size={18} />
          Create Company
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={18} className="absolute left-4 top-3.5 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by company name, code, email or phone..."
          className="w-full rounded-xl border border-slate-300 py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border bg-white">
        <table className="w-full">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-6 py-4 text-left">Company</th>
              <th className="px-6 py-4 text-left">Code</th>
              <th className="px-6 py-4 text-left">Email</th>
              <th className="px-6 py-4 text-left">Phone</th>
              <th className="px-6 py-4 text-center">Status</th>
              <th className="px-6 py-4 text-center">Branches</th>
              <th className="px-6 py-4 text-center">Territories</th>
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="py-16 text-center text-slate-500">
                  Loading companies...
                </td>
              </tr>
            ) : companies.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <div className="flex flex-col items-center justify-center py-16">
                    <Building2 size={60} className="text-slate-300" />
                    <h3 className="mt-5 text-xl font-semibold text-slate-700">
                      No Companies Found
                    </h3>
                    <p className="mt-2 text-slate-500">
                      Create your first company to get started.
                    </p>
                    <button
                      onClick={() => setShowModal(true)}
                      className="mt-6 rounded-xl bg-indigo-600 px-6 py-3 text-white hover:bg-indigo-700"
                    >
                      Create Company
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              companies.map((company) => (
                <tr key={company.id} className="border-t hover:bg-slate-50 transition">
                  <td className="px-6 py-5">
                    <div>
                      <h4 className="font-semibold text-slate-800">{company.name}</h4>
                      <p className="text-sm text-slate-500">
                        Created {company.createdAt ? new Date(company.createdAt).toLocaleDateString() : "-"}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-slate-600">{company.code || "-"}</td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Mail size={15} />
                      <span>{company.email || "-"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Phone size={15} />
                      <span>{company.phone || "-"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${company.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {company.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center">{company._count?.branches ?? 0}</td>
                  <td className="px-6 py-5 text-center">{company._count?.territories ?? 0}</td>
                  <td className="px-6 py-5">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => setViewCompany(company)} className="rounded-lg border p-2 hover:bg-slate-100" title="View">
                        <Eye size={17} />
                      </button>
                      <button onClick={() => { setSelectedCompany(company); setShowModal(true); }} className="rounded-lg border p-2 hover:bg-slate-100" title="Edit">
                        <Pencil size={17} />
                      </button>
                      <button onClick={() => handleDelete(company)} className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50" title="Delete">
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Total Companies : <span className="ml-2 font-semibold text-slate-800">{companies?.length || 0}</span>
        </p>
      </div>

      {/* Statistics */}
      <div className="grid gap-5 md:grid-cols-2">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h4 className="text-sm text-slate-500">Total Companies</h4>
          <h2 className="mt-2 text-3xl font-bold">{companies?.length || 0}</h2>
        </div>
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h4 className="text-sm text-slate-500">Total Branches</h4>
          <h2 className="mt-2 text-3xl font-bold">{totalBranchesCount}</h2>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl">
            <button type="button" onClick={() => { setShowModal(false); setSelectedCompany(null); }} className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
              <X size={22} />
            </button>
            <h2 className="mb-6 text-2xl font-bold">{selectedCompany ? "Edit Company" : "Create Company"}</h2>
            <CompanyForm company={selectedCompany} onClose={() => { setShowModal(false); setSelectedCompany(null); }} onSuccess={reload} />
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setViewCompany(null)}>
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setViewCompany(null)} className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
              <X size={22} />
            </button>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">{viewCompany.name}</h2>
            <div className="space-y-3 text-sm text-slate-700">
              <p><strong>Code:</strong> {viewCompany.code || "-"}</p>
              <p><strong>Email:</strong> {viewCompany.email || "-"}</p>
              <p><strong>Phone:</strong> {viewCompany.phone || "-"}</p>
              <p><strong>Branches:</strong> {viewCompany._count?.branches ?? 0}</p>
              <p><strong>Territories:</strong> {viewCompany._count?.territories ?? 0}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
