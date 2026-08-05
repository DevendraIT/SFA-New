import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import teamService from "../../../services/team.service";
import branchService from "../../../services/branch.service";
import departmentService from "../../../services/department.service";
import { Loader2 } from "lucide-react";

export default function TeamForm({ team, onClose, onSuccess }) {
  const isEdit = !!team;

  const [form, setForm] = useState({
    branchId: "",
    departmentId: "",
    territoryId: "",
    name: "",
    description: "",
  });
  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [loadingDepartments, setLoadingDepartments] = useState(false);

  useEffect(() => {
    loadBranches();
    if (team) {
      setForm({
        branchId: team.branchId || "",
        departmentId: team.departmentId || "",
        territoryId: team.territoryId || "",
        name: team.name || "",
        description: team.description || "",
      });
      if (team.branchId) {
        loadDepartments(team.branchId);
      }
    }
  }, [team]);

  const loadBranches = async () => {
    try {
      setLoadingBranches(true);
      const res = await branchService.getBranches({ limit: 100 });
      setBranches(res?.data?.branches || []);
    } catch (err) {
      console.error("Failed to load branches:", err);
      toast.error("Failed to load branches");
    } finally {
      setLoadingBranches(false);
    }
  };

  const loadDepartments = async (branchId) => {
    if (!branchId) {
      setDepartments([]);
      return;
    }
    try {
      setLoadingDepartments(true);
      const res = await departmentService.getDepartments({
        branchId,
        limit: 100,
      });
      setDepartments(res?.data?.departments || []);
    } catch (err) {
      console.error("Failed to load departments:", err);
    } finally {
      setLoadingDepartments(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (name === "branchId") {
      setForm((prev) => ({ ...prev, branchId: value, departmentId: "" }));
      loadDepartments(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.branchId) {
      toast.error("Please select a branch");
      return;
    }
    if (!form.name.trim()) {
      toast.error("Team name is required");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        branchId: form.branchId,
        name: form.name.trim(),
        description: form.description.trim() || undefined,
      };
      if (form.departmentId) payload.departmentId = form.departmentId;

      if (isEdit) {
        await teamService.updateTeam(team.id, payload);
        toast.success("Team updated successfully");
      } else {
        await teamService.createTeam(payload);
        toast.success("Team created successfully");
      }
      onSuccess?.();
      onClose?.();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to save team");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Branch Selection */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          Branch <span className="text-red-500">*</span>
        </label>
        {loadingBranches ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 size={16} className="animate-spin" />
            Loading branches...
          </div>
        ) : (
          <select
            name="branchId"
            value={form.branchId}
            onChange={handleChange}
            disabled={isEdit}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
          >
            <option value="">Select a branch</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} {b.organization?.name ? `(${b.organization.name})` : ""}
              </option>
            ))}
          </select>
        )}
        {isEdit && (
          <p className="mt-1 text-xs text-slate-400">
            Branch cannot be changed after creation.
          </p>
        )}
      </div>

      {/* Basic Information */}
      <div className="rounded-xl border border-slate-200 p-5">
        <h3 className="mb-4 text-lg font-semibold text-slate-800">
          Basic Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Team Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter team name"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Department
            </label>
            {loadingDepartments ? (
              <div className="flex items-center gap-2 text-sm text-slate-500 mt-3">
                <Loader2 size={16} className="animate-spin" />
                Loading departments...
              </div>
            ) : (
              <select
                name="departmentId"
                value={form.departmentId}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">No department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="md:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Description
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Enter team description (optional)"
              rows={3}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-slate-300 px-6 py-3 text-slate-700 hover:bg-slate-50 transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-white hover:bg-indigo-700 transition disabled:opacity-60"
        >
          {submitting && <Loader2 size={18} className="animate-spin" />}
          {isEdit ? "Update Team" : "Create Team"}
        </button>
      </div>
    </form>
  );
}

