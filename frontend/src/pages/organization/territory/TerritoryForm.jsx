import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import territoryService from "../../../services/territory.service";
import useDepartments from "../../../hooks/useDepartments";
import { Loader2 } from "lucide-react";

export default function TerritoryForm({ territory, onClose, onSuccess }) {
  const queryClient = useQueryClient();
  const isEdit = !!territory;

  const [form, setForm] = useState({
    departmentId: "",
    name: "",
    code: "",
    description: "",
  });
  
  const { departments, loading: loadingDepartments } = useDepartments();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (territory) {
      setForm({
        departmentId: territory.departmentId || "",
        name: territory.name || "",
        code: territory.code || "",
        description: territory.description || "",
      });
    }
  }, [territory]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.departmentId) {
      toast.error("Please select a department");
      return;
    }
    if (!form.name.trim()) {
      toast.error("Territory name is required");
      return;
    }

    try {
      setSubmitting(true);
      if (isEdit) {
        await territoryService.updateTerritory(territory.id, form);
        toast.success("Territory updated successfully");
      } else {
        await territoryService.createTerritory(form);
        toast.success("Territory created successfully");
      }
      queryClient.invalidateQueries({ queryKey: ["territories"] });
      onSuccess?.();
      onClose?.();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to save territory");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          Department <span className="text-red-500">*</span>
        </label>
        {loadingDepartments ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
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
            <option value="">Select a department</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} {d.code ? `(${d.code})` : ""}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 p-5">
        <h3 className="mb-4 text-lg font-semibold text-slate-800">
          Basic Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Territory Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter territory name"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Territory Code
            </label>
            <input
              type="text"
              name="code"
              value={form.code}
              onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
              placeholder="e.g. TER-001"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        <div className="mt-5">
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Description
          </label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={3}
            placeholder="Territory description..."
            className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          ></textarea>
        </div>
      </div>

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
          {isEdit ? "Update Territory" : "Create Territory"}
        </button>
      </div>
    </form>
  );
}
