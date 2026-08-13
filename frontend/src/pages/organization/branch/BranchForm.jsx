import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import branchService from "../../../services/branch.service";
import useDepartments from "../../../hooks/useDepartments";
import useTerritories from "../../../hooks/useTerritories";

const schema = z.object({
  departmentId: z.string().uuid("Please select a department."),
  territoryId: z.string().uuid("Please select a territory."),
  name: z
    .string()
    .trim()
    .min(2, "Branch name is required.")
    .max(100, "Branch name cannot exceed 100 characters."),
  code: z
    .string()
    .trim()
    .min(2, "Branch code is required.")
    .max(20, "Branch code cannot exceed 20 characters."),

  email: z.string().trim().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().trim().max(20, "Phone cannot exceed 20 characters.").optional(),
  address: z.string().trim().max(255, "Address cannot exceed 255 characters.").optional(),
  city: z.string().trim().max(100, "City cannot exceed 100 characters.").optional(),
  state: z.string().trim().max(100, "State cannot exceed 100 characters.").optional(),
  country: z.string().trim().max(100, "Country cannot exceed 100 characters.").optional(),
  postalCode: z.string().trim().max(20, "Postal Code cannot exceed 20 characters.").optional(),
});

export default function BranchForm({ branch, onClose, onSuccess }) {
  const { departments } = useDepartments();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      departmentId: "",
      territoryId: "",
      name: "",
      code: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      country: "",
      postalCode: "",
    },
  });

  const selectedDepartmentId = watch("departmentId");
  const { territories } = useTerritories({ debounce: false });
  const filteredTerritories = territories.filter(t => t.departmentId === selectedDepartmentId);

  useEffect(() => {
    if (!branch) return;

    reset({
      departmentId: branch.departmentId || "",
      territoryId: branch.territoryId || "",
      name: branch.name || "",
      code: branch.code || "",
      email: branch.email || "",
      phone: branch.phone || "",
      address: branch.address || "",
      city: branch.city || "",
      state: branch.state || "",
      country: branch.country || "",
      postalCode: branch.postalCode || "",
    });
  }, [branch, reset]);

  const onSubmit = async (values) => {
    const payload = {
      ...values,
      code: values.code?.toUpperCase(),
      email: values.email || undefined,
      phone: values.phone || undefined,
      address: values.address || undefined,
      city: values.city || undefined,
      state: values.state || undefined,
      country: values.country || undefined,
      postalCode: values.postalCode || undefined,
    };

    try {
      if (branch) {
        await branchService.updateBranch(branch.id, payload);
        toast.success("Branch updated successfully.");
      } else {
        await branchService.createBranch(payload);
        toast.success("Branch created successfully.");
      }
      onSuccess?.();
      onClose?.();
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Operation failed.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Basic Information */}
      <div className="rounded-xl border border-slate-200 p-5">
        <h3 className="mb-5 text-lg font-semibold text-slate-800">
          Basic Information
        </h3>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="md:col-span-1">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Department *
            </label>
            <select
              {...register("departmentId", {
                onChange: () => setValue("territoryId", "")
              })}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            >
              <option value="">Select a department...</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} {d.code ? `(${d.code})` : ""}
                </option>
              ))}
            </select>
            {errors.departmentId && (
              <p className="mt-1 text-sm text-red-500">{errors.departmentId.message}</p>
            )}
          </div>

          <div className="md:col-span-1">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Territory *
            </label>
            <select
              {...register("territoryId")}
              disabled={!selectedDepartmentId}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:bg-slate-100 disabled:cursor-not-allowed"
            >
              <option value="">Select a territory...</option>
              {filteredTerritories.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} {t.code ? `(${t.code})` : ""}
                </option>
              ))}
            </select>
            {errors.territoryId && (
              <p className="mt-1 text-sm text-red-500">{errors.territoryId.message}</p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Branch Name *
            </label>
            <input
              {...register("name")}
              placeholder="Enter branch name"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Branch Code *
            </label>
            <input
              {...register("code")}
              onChange={(e) => setValue("code", e.target.value.toUpperCase())}
              placeholder="BR001"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 uppercase outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
            {errors.code && (
              <p className="mt-1 text-sm text-red-500">{errors.code.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="rounded-xl border border-slate-200 p-5">
        <h3 className="mb-5 text-lg font-semibold text-slate-800">
          Contact Information
        </h3>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              {...register("email")}
              type="email"
              placeholder="branch@example.com"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Phone
            </label>
            <input
              {...register("phone")}
              placeholder="+919876543210"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-500">{errors.phone.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Address Information */}
      <div className="rounded-xl border border-slate-200 p-5">
        <h3 className="mb-5 text-lg font-semibold text-slate-800">
          Address Information
        </h3>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Address
            </label>
            <input
              {...register("address")}
              placeholder="Street address"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
            {errors.address && (
              <p className="mt-1 text-sm text-red-500">{errors.address.message}</p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              City
            </label>
            <input
              {...register("city")}
              placeholder="Enter city"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
            {errors.city && (
              <p className="mt-1 text-sm text-red-500">{errors.city.message}</p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              State
            </label>
            <input
              {...register("state")}
              placeholder="Enter state"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
            {errors.state && (
              <p className="mt-1 text-sm text-red-500">{errors.state.message}</p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Country
            </label>
            <input
              {...register("country")}
              placeholder="Enter country"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
            {errors.country && (
              <p className="mt-1 text-sm text-red-500">{errors.country.message}</p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Postal Code
            </label>
            <input
              {...register("postalCode")}
              placeholder="Enter postal code"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
            {errors.postalCode && (
              <p className="mt-1 text-sm text-red-500">{errors.postalCode.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 border-t border-slate-200 pt-6">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-slate-300 px-5 py-2.5 font-medium transition hover:bg-slate-100"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-xl bg-indigo-600 px-6 py-2.5 font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting
            ? "Saving..."
            : branch
            ? "Update Branch"
            : "Create Branch"}
        </button>
      </div>
    </form>
  );
}

