import { useState, useEffect, useMemo } from "react";
import {
  Building2,
  Users,
  CheckCircle2,
  Plus,
  Search,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  Loader2,
  X,
  Eye,
  Edit3,
  Trash2,
  AlertTriangle,
  GitBranch,
} from "lucide-react";
import toast from "react-hot-toast";
import franchiseApi from "../../api/franchise.api";
import { useAuth } from "../../context/AuthContext";

export default function FranchiseDashboard() {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState([]);
  const [metrics, setMetrics] = useState({
    totalOrganizations: 0,
    activeOrganizations: 0,
    totalUsers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [viewOrg, setViewOrg] = useState(null);

  const [editOrg, setEditOrg] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    gstNumber: "",
    panNumber: "",
    isActive: true,
  });
  const [updating, setUpdating] = useState(false);

  const [deleteOrg, setDeleteOrg] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Form State for Creation
  const [formData, setFormData] = useState({
    orgName: "",
    orgEmail: "",
    orgPhone: "",
    address: "",
    city: "",
    state: "",
    gstNumber: "",
    adminFirstName: "",
    adminLastName: "",
    adminEmail: "",
    adminPassword: "",
    adminPhone: "",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [orgsRes, metricsRes] = await Promise.all([
        franchiseApi.getOrganizations(),
        franchiseApi.getMetrics(),
      ]);

      setOrganizations(orgsRes.data?.data || orgsRes.data || []);
      setMetrics(
        metricsRes.data?.data ||
          metricsRes.data || { totalOrganizations: 0, activeOrganizations: 0, totalUsers: 0 }
      );
    } catch (err) {
      console.error("Failed to load franchise data:", err);
      toast.error(err.response?.data?.message || "Failed to load franchise organizations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredOrgs = useMemo(() => {
    if (!search.trim()) return organizations;
    const q = search.toLowerCase();
    return organizations.filter(
      (o) =>
        o.name?.toLowerCase().includes(q) ||
        o.email?.toLowerCase().includes(q) ||
        o.superAdmin?.email?.toLowerCase().includes(q) ||
        o.city?.toLowerCase().includes(q)
    );
  }, [organizations, search]);

  const handleCreateOrganization = async (e) => {
    e.preventDefault();

    if (!formData.orgName.trim()) {
      toast.error("Organization Name is required");
      return;
    }
    if (!formData.adminEmail.trim()) {
      toast.error("Super Admin Email is required");
      return;
    }
    if (!formData.adminPassword.trim() || formData.adminPassword.trim().length < 6) {
      toast.error("Super Admin Password must be at least 6 characters");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        organization: {
          name: formData.orgName.trim(),
          email: formData.orgEmail.trim() || formData.adminEmail.trim(),
          phone: formData.orgPhone.trim() || formData.adminPhone.trim(),
          address: formData.address.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          gstNumber: formData.gstNumber.trim(),
        },
        superAdmin: {
          firstName: formData.adminFirstName.trim() || "Super",
          lastName: formData.adminLastName.trim() || "Admin",
          email: formData.adminEmail.trim(),
          password: formData.adminPassword.trim(),
          phoneNumber: formData.adminPhone.trim(),
        },
      };

      await franchiseApi.provisionOrganization(payload);
      toast.success(`Organization "${formData.orgName}" & Super Admin successfully created!`, {
        duration: 5000,
      });

      setShowCreateModal(false);
      setFormData({
        orgName: "",
        orgEmail: "",
        orgPhone: "",
        address: "",
        city: "",
        state: "",
        gstNumber: "",
        adminFirstName: "",
        adminLastName: "",
        adminEmail: "",
        adminPassword: "",
        adminPhone: "",
      });
      loadData();
    } catch (err) {
      console.error("Failed to provision organization:", err);
      toast.error(err.response?.data?.message || "Failed to provision organization");
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (org) => {
    setEditOrg(org);
    setEditFormData({
      name: org.name || "",
      email: org.email || "",
      phone: org.phone || "",
      address: org.address || "",
      city: org.city || "",
      state: org.state || "",
      gstNumber: org.gstNumber || "",
      panNumber: org.panNumber || "",
      isActive: org.isActive ?? true,
    });
  };

  const handleUpdateOrganization = async (e) => {
    e.preventDefault();
    if (!editOrg?.id) return;

    try {
      setUpdating(true);
      await franchiseApi.updateOrganization(editOrg.id, editFormData);
      toast.success("Organization details updated successfully!");
      setEditOrg(null);
      loadData();
    } catch (err) {
      console.error("Update organization error:", err);
      toast.error(err.response?.data?.message || "Failed to update organization");
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteOrganization = async () => {
    if (!deleteOrg?.id) return;

    try {
      setDeleting(true);
      await franchiseApi.deleteOrganization(deleteOrg.id);
      toast.success(`Organization "${deleteOrg.name}" and all associated data deleted successfully!`);
      setDeleteOrg(null);
      loadData();
    } catch (err) {
      console.error("Delete organization error:", err);
      toast.error(err.response?.data?.message || "Failed to delete organization");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 shadow-xs">
              <ShieldCheck size={13} />
              IT360 Franchise Management Console
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1 tracking-tight">
            Franchise Organizations & Reseller Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Provision client companies, auto-generate isolated Super Admin credentials, and manage client deployments.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-medium text-sm shadow-sm hover:bg-blue-700 transition shrink-0 cursor-pointer"
        >
          <Plus size={18} />
          <span>Create Organization & Super Admin</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Client Orgs</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">{metrics.totalOrganizations}</h2>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building2 size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Organizations</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-emerald-600 mt-1">{metrics.activeOrganizations}</h2>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Users Across Orgs</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-purple-600 mt-1">{metrics.totalUsers}</h2>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search size={18} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search organizations by name, email, city..."
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Organizations Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[800px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
              <tr>
                <th className="px-5 py-4">Client Organization</th>
                <th className="px-5 py-4">Designated Super Admin</th>
                <th className="px-5 py-4">Location & Contact</th>
                <th className="px-5 py-4 text-center">Branches & Staff</th>
                <th className="px-5 py-4 text-center">Status</th>
                <th className="px-5 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Loader2 size={24} className="animate-spin mx-auto mb-2 text-blue-600" />
                    Loading client organizations...
                  </td>
                </tr>
              ) : filteredOrgs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Building2 size={36} className="mx-auto mb-2 text-slate-300" />
                    No client organizations found. Click "Create Organization & Super Admin" to provision your first client.
                  </td>
                </tr>
              ) : (
                filteredOrgs.map((org) => (
                  <tr key={org.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900">{org.name}</div>
                      <div className="text-xs text-slate-400 font-mono">slug: {org.slug}</div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <ShieldCheck size={14} className="text-blue-600 shrink-0" />
                        {org.superAdmin ? `${org.superAdmin.firstName} ${org.superAdmin.lastName}` : "Super Admin"}
                      </div>
                      <div className="text-xs text-slate-500">{org.superAdmin?.email || org.email || "-"}</div>
                    </td>

                    <td className="px-5 py-4 text-xs text-slate-600">
                      <div>{org.city ? `${org.city}, ${org.state || "India"}` : "India"}</div>
                      {org.phone && <div className="text-slate-400">{org.phone}</div>}
                    </td>

                    <td className="px-5 py-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-xs font-semibold text-slate-700">
                        {org.totalBranches || 0} Branches / {org.totalUsers || 0} Users
                      </span>
                    </td>

                    <td className="px-5 py-4 text-center">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold border ${
                          org.isActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-red-50 text-red-700 border-red-200"
                        }`}
                      >
                        {org.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    {/* Actions Column: View, Edit, Delete */}
                    <td className="px-5 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* 1. View Organization */}
                        <button
                          onClick={() => setViewOrg(org)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium text-xs transition cursor-pointer"
                          title="View Organization Details"
                        >
                          <Eye size={13} />
                          <span>View</span>
                        </button>

                        {/* 2. Edit Organization */}
                        <button
                          onClick={() => openEditModal(org)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium text-xs transition border border-blue-200 cursor-pointer"
                          title="Edit Organization Details"
                        >
                          <Edit3 size={13} />
                          <span>Edit</span>
                        </button>

                        {/* 3. Delete Organization */}
                        <button
                          onClick={() => setDeleteOrg(org)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 font-medium text-xs transition border border-red-200 cursor-pointer"
                          title="Delete Organization & All Associated Data"
                        >
                          <Trash2 size={13} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 1. VIEW ORGANIZATION MODAL */}
      {viewOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-6 max-h-[92vh] flex flex-col my-auto overflow-hidden">
            <button
              onClick={() => setViewOrg(null)}
              className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 border-b pb-4 mb-5">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Building2 size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{viewOrg.name}</h2>
                <span className="text-xs font-mono text-slate-400">slug: {viewOrg.slug}</span>
              </div>
            </div>

            <div className="space-y-6 overflow-y-auto pr-1">
              {/* General details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <p className="text-xs font-semibold text-slate-400 uppercase">Status</p>
                  <p className="font-bold text-slate-800 mt-0.5">
                    <span
                      className={`inline-block w-2 h-2 rounded-full mr-2 ${
                        viewOrg.isActive ? "bg-emerald-500" : "bg-red-500"
                      }`}
                    />
                    {viewOrg.isActive ? "Active Deployment" : "Inactive"}
                  </p>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <p className="text-xs font-semibold text-slate-400 uppercase">Created Date</p>
                  <p className="font-bold text-slate-800 mt-0.5">
                    {new Date(viewOrg.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <p className="text-xs font-semibold text-slate-400 uppercase">Branches & Staff</p>
                  <p className="font-bold text-slate-800 mt-0.5">
                    {viewOrg.totalBranches || 0} Branches & {viewOrg.totalUsers || 0} Users
                  </p>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <p className="text-xs font-semibold text-slate-400 uppercase">Location</p>
                  <p className="font-bold text-slate-800 mt-0.5">
                    {viewOrg.city ? `${viewOrg.city}, ${viewOrg.state || "India"}` : "India"}
                  </p>
                </div>
              </div>

              {/* Super Admin Info Card */}
              <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-100 space-y-2">
                <div className="flex items-center gap-2 text-blue-700 font-bold text-sm">
                  <ShieldCheck size={18} />
                  <span>Designated Super Admin</span>
                </div>
                <div className="text-sm text-slate-800 font-medium">
                  {viewOrg.superAdmin ? `${viewOrg.superAdmin.firstName} ${viewOrg.superAdmin.lastName}` : "Super Admin"}
                </div>
                <div className="text-xs text-slate-500">
                  Email: <span className="font-mono text-slate-700">{viewOrg.superAdmin?.email || viewOrg.email || "-"}</span>
                </div>
                {viewOrg.superAdmin?.phoneNumber && (
                  <div className="text-xs text-slate-500">
                    Phone: <span className="text-slate-700">{viewOrg.superAdmin.phoneNumber}</span>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setViewOrg(null)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. EDIT ORGANIZATION MODAL */}
      {editOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl p-6 max-h-[92vh] flex flex-col my-auto overflow-hidden">
            <button
              onClick={() => setEditOrg(null)}
              className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="mb-5">
              <h2 className="text-xl font-bold text-slate-900">Edit Organization</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Update company profile, contact details, or active deployment status.
              </p>
            </div>

            <form onSubmit={handleUpdateOrganization} className="space-y-4 overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Organization Name *</label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Company Email</label>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Company Phone</label>
                  <input
                    type="text"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Street Address</label>
                <input
                  type="text"
                  value={editFormData.address}
                  onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={editFormData.city}
                    onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    value={editFormData.state}
                    onChange={(e) => setEditFormData({ ...editFormData, state: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">GST Number</label>
                  <input
                    type="text"
                    value={editFormData.gstNumber}
                    onChange={(e) => setEditFormData({ ...editFormData, gstNumber: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">PAN Number</label>
                  <input
                    type="text"
                    value={editFormData.panNumber}
                    onChange={(e) => setEditFormData({ ...editFormData, panNumber: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveOrg"
                  checked={editFormData.isActive}
                  onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="isActiveOrg" className="text-sm font-semibold text-slate-700 cursor-pointer select-none">
                  Organization is Active
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setEditOrg(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50 cursor-pointer"
                >
                  {updating ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. DELETE ORGANIZATION CONFIRMATION MODAL */}
      {deleteOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Delete Organization</h3>
                <p className="text-xs text-red-500 font-semibold">Permanent Cascading Action</p>
              </div>
            </div>

            <p className="text-sm text-slate-600">
              Are you sure you want to permanently delete{" "}
              <span className="font-bold text-slate-900">{deleteOrg.name}</span>?
            </p>

            <div className="bg-red-50 p-3 rounded-xl border border-red-200 text-xs text-red-700 leading-relaxed">
              ⚠️ <strong>Warning:</strong> All data for this particular organization (including users, branches, sales
              orders, inventory, customers, and field force visits) will be permanently wiped out.
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setDeleteOrg(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteOrganization}
                disabled={deleting}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-red-600 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-70 cursor-pointer shadow-sm"
              >
                {deleting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Deleting all data...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    <span>Yes, Delete Organization</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. PROVISION NEW CLIENT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-5 sm:p-8 max-h-[92vh] flex flex-col my-auto overflow-hidden">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Provision Client Organization</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Creates a brand new multi-tenant organization, auto-seeds standard enterprise roles, and creates its primary Super Admin credentials.
              </p>
            </div>

            <form onSubmit={handleCreateOrganization} className="space-y-5 overflow-y-auto pr-1">
              {/* Organization Info */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
                  <Building2 size={16} className="text-blue-600" /> Company / Organization Information
                </h3>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.orgName}
                    onChange={(e) => setFormData({ ...formData, orgName: e.target.value })}
                    placeholder="e.g. Acme Supermarket Pvt Ltd"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Company Email</label>
                    <input
                      type="email"
                      value={formData.orgEmail}
                      onChange={(e) => setFormData({ ...formData, orgEmail: e.target.value })}
                      placeholder="info@company.com"
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Company Phone</label>
                    <input
                      type="text"
                      value={formData.orgPhone}
                      onChange={(e) => setFormData({ ...formData, orgPhone: e.target.value })}
                      placeholder="+91 9876543210"
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="e.g. Mumbai"
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      placeholder="e.g. Maharashtra"
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Super Admin Credentials */}
              <div className="space-y-3 pt-2">
                <h3 className="text-sm font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
                  <ShieldCheck size={16} className="text-amber-600" /> Client Super Admin Credentials
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">First Name</label>
                    <input
                      type="text"
                      value={formData.adminFirstName}
                      onChange={(e) => setFormData({ ...formData, adminFirstName: e.target.value })}
                      placeholder="e.g. Rajesh"
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      value={formData.adminLastName}
                      onChange={(e) => setFormData({ ...formData, adminLastName: e.target.value })}
                      placeholder="e.g. Kumar"
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Super Admin Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.adminEmail}
                      onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                      placeholder="superadmin@company.com"
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Initial Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      value={formData.adminPassword}
                      onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                      placeholder="Min. 6 characters"
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Provisioning Organization...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>Provision Organization</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
