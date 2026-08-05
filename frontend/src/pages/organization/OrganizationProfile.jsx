import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Building2, ShieldAlert } from "lucide-react";
import toast from "react-hot-toast";

import useOrganizations from "../../hooks/useOrganizations";
import organizationService from "../../services/organization.service";
import { useAuth } from "../../context/AuthContext";

const schema = z.object({
  name: z.string().trim().min(2, "Name is required").max(100, "Name cannot exceed 100 characters"),
  isActive: z.boolean().default(true),
});

export default function OrganizationProfile() {
  const { user } = useAuth();
  const { organization, loading, reload } = useOrganizations();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (organization) {
      reset({
        name: organization.name,
        isActive: organization.isActive,
      });
    }
  }, [organization, reset, isEditing]);

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      if (organization) {
        await organizationService.updateCurrentOrganization(data);
        toast.success("Organization updated successfully");
        setIsEditing(false);
      } else {
        await organizationService.createOrganization(data);
        toast.success("Organization created successfully");
      }
      reload();
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to save organization");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  // Handle case where NO organization exists (Create Mode)
  if (!organization) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 pt-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-slate-800">Create Organization</h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-5 text-lg font-semibold text-[#1e293b]">
              Basic Information
            </h3>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#475569]">
                  Organization Name <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("name")}
                  placeholder="Enter organization name"
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                />
                {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#475569]">
                  Description
                </label>
                <textarea
                  rows={4}
                  placeholder="Organization description..."
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-[#4F46E5] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-70"
            >
              {isSubmitting ? "Creating..." : "Create Organization"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Handle case where Organization exists (View / Edit Mode)
  return (
    <div className="mx-auto max-w-3xl space-y-6 pt-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Organization Profile</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your organization details and settings.</p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="rounded-xl bg-[#4F46E5] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
          >
            Edit Details
          </button>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
          <Building2 size={180} />
        </div>

        <div className="relative z-10">
          {!isEditing ? (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-[#1e293b] border-b border-slate-100 pb-4">
                Basic Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <span className="block text-sm font-semibold text-[#475569] mb-1">Organization Name</span>
                  <span className="block text-slate-800 text-[15px]">{organization.name}</span>
                </div>
                
                <div>
                  <span className="block text-sm font-semibold text-[#475569] mb-1">Status</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${organization.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {organization.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div>
                  <span className="block text-sm font-semibold text-[#475569] mb-1">Organization ID</span>
                  <span className="block text-slate-800 text-[15px] font-mono text-sm">{organization.id}</span>
                </div>

                <div>
                  <span className="block text-sm font-semibold text-[#475569] mb-1">Created At</span>
                  <span className="block text-slate-800 text-[15px]">
                    {new Date(organization.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric', month: 'long', day: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <h3 className="text-lg font-semibold text-[#1e293b] border-b border-slate-100 pb-4">
                Edit Information
              </h3>

              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#475569]">
                    Organization Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register("name")}
                    placeholder="Enter organization name"
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
                </div>

                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <input
                    type="checkbox"
                    id="isActive"
                    {...register("isActive")}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                  />
                  <label htmlFor="isActive" className="text-sm font-semibold text-[#475569] cursor-pointer select-none">
                    Organization is Active
                  </label>
                </div>
                
                {!organization.isActive && (
                  <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-sm">
                    <ShieldAlert size={18} className="shrink-0 mt-0.5 text-amber-600" />
                    <p>Warning: Deactivating the organization may restrict access for all members until it is reactivated.</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="rounded-xl border border-slate-300 bg-white px-6 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-[#4F46E5] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-70"
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
