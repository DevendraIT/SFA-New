import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Building2, ShieldAlert, Trash2, Mail, Phone, MapPin, FileText, Globe, Building } from "lucide-react";
import toast from "react-hot-toast";

import useOrganizations from "../../hooks/useOrganizations";
import organizationService from "../../services/organization.service";
import { useAuth } from "../../context/AuthContext";

const schema = z.object({
  name: z.string().trim().min(2, "Name is required").max(100, "Name cannot exceed 100 characters"),
  email: z
    .string()
    .trim()
    .refine((val) => !val || /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(val), {
      message: "Please enter a valid standard email address",
    })
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .trim()
    .refine((val) => !val || /^\d{10}$/.test(val), {
      message: "Mobile number must be exactly 10 numeric digits",
    })
    .optional()
    .or(z.literal("")),
  address: z.string().trim().max(255, "Address cannot exceed 255 characters").optional().or(z.literal("")),
  city: z.string().trim().max(100, "City cannot exceed 100 characters").optional().or(z.literal("")),
  state: z.string().trim().max(100, "State cannot exceed 100 characters").optional().or(z.literal("")),
  country: z.string().trim().max(100, "Country cannot exceed 100 characters").optional().or(z.literal("")),
  postalCode: z
    .string()
    .trim()
    .refine((val) => !val || /^\d{6}$/.test(val), {
      message: "PIN Code must be 6 numeric digits",
    })
    .optional()
    .or(z.literal("")),
  gstNumber: z.string().trim().max(50, "GST number cannot exceed 50 characters").optional().or(z.literal("")),
  panNumber: z.string().trim().max(50, "PAN number cannot exceed 50 characters").optional().or(z.literal("")),
  isActive: z.boolean().default(true),
});

export default function OrganizationProfile() {
  const { user } = useAuth();
  const { organization, loading, reload } = useOrganizations();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSuperAdmin = useMemo(() => {
    if (!user) return false;
    const roleNames = Array.isArray(user.roles)
      ? user.roles.map((r) => (typeof r === "string" ? r : r.role?.name || r.name))
      : [user.role?.name || ""];
    // Strictly restrict to Organization Super Admin / Super Admin (EXCLUDE Company Admin)
    return roleNames.some((r) => r && r.toLowerCase().includes("super admin"));
  }, [user]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (organization) {
      reset({
        name: organization.name || "",
        email: organization.email || "",
        phone: organization.phone || "",
        address: organization.address || "",
        city: organization.city || "",
        state: organization.state || "",
        country: organization.country || "",
        postalCode: organization.postalCode || "",
        gstNumber: organization.gstNumber || "",
        panNumber: organization.panNumber || "",
        isActive: organization.isActive ?? true,
      });
    } else {
      reset({
        name: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        country: "India",
        postalCode: "",
        gstNumber: "",
        panNumber: "",
        isActive: true,
      });
    }
  }, [organization, reset, isEditing]);

  const onSubmit = async (data) => {
    if (!isSuperAdmin) {
      toast.error("Only Super Admin can create or update organization details.");
      return;
    }
    try {
      setIsSubmitting(true);
      if (organization) {
        await organizationService.updateCurrentOrganization(data);
        toast.success("Organization details updated successfully");
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

  // Handle case where NO organization exists (Create Mode - Super Admin Only)
  if (!organization) {
    if (!isSuperAdmin) {
      return (
        <div className="mx-auto max-w-4xl space-y-6 pt-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <Building2 className="mx-auto h-12 w-12 text-slate-400" />
            <h2 className="mt-4 text-xl font-bold text-slate-800">No Active Organization Found</h2>
            <p className="mt-2 text-sm text-slate-500">Only Organization Super Admin can set up or create an organization.</p>
          </div>
        </div>
      );
    }
    return (
      <div className="mx-auto max-w-4xl space-y-6 pt-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Create Single Organization</h1>
            <p className="text-sm text-slate-500 mt-1">No active organization found. Set up your enterprise organization below.</p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            0 / 1 Organization Created
          </span>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
            <h3 className="text-lg font-semibold text-[#1e293b] border-b border-slate-100 pb-3 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              General & Tax Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-[#475569]">
                  Organization Name <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("name")}
                  placeholder="e.g. Acme Corporation"
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                />
                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-[#475569]">Company Email</label>
                <input
                  {...register("email")}
                  placeholder="contact@company.com"
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                />
                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-[#475569]">Phone Number</label>
                <input
                  {...register("phone")}
                  placeholder="+91 9876543210"
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-[#475569]">GST Number</label>
                <input
                  {...register("gstNumber")}
                  placeholder="22AAAAA0000A1Z5"
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-[#475569]">PAN Number</label>
                <input
                  {...register("panNumber")}
                  placeholder="ABCDE1234F"
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                />
              </div>
            </div>

            <h3 className="text-lg font-semibold text-[#1e293b] border-b border-slate-100 pb-3 flex items-center gap-2 pt-4">
              <MapPin className="w-5 h-5 text-indigo-600" />
              Address & Location Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="mb-1.5 block text-sm font-semibold text-[#475569]">Street Address</label>
                <input
                  {...register("address")}
                  placeholder="Building, Suite, Street name"
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-[#475569]">City</label>
                <input
                  {...register("city")}
                  placeholder="City name"
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-[#475569]">State</label>
                <input
                  {...register("state")}
                  placeholder="State name"
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-[#475569]">Country</label>
                <input
                  {...register("country")}
                  placeholder="Country name"
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-[#475569]">Postal Code</label>
                <input
                  {...register("postalCode")}
                  placeholder="400001"
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-[#4F46E5] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-70 cursor-pointer shadow-sm"
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
    <div className="mx-auto max-w-4xl space-y-6 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-800">Organization Profile</h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Single Organization Active (1/1)
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">View and manage full enterprise organization details and settings.</p>
        </div>

        <div className="flex items-center gap-3">
          {isSuperAdmin && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="rounded-xl bg-[#4F46E5] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 cursor-pointer shadow-sm"
            >
              Edit Details
            </button>
          )}
        </div>
      </div>

      {/* Main Content Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
          <Building2 size={200} />
        </div>

        <div className="relative z-10">
          {!isEditing ? (
            /* View Mode */
            <div className="space-y-8">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold text-[#1e293b] border-b border-slate-100 pb-3 mb-5 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-indigo-600" />
                  General Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <span className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1">Organization Name</span>
                    <span className="block text-slate-800 text-[15px] font-bold">{organization.name}</span>
                  </div>
                  
                  <div>
                    <span className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1">Organization Code / Slug</span>
                    <span className="block text-slate-800 text-[15px] font-mono">{organization.slug || organization.code || "N/A"}</span>
                  </div>

                  <div>
                    <span className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1">Status</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${organization.isActive ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                      {organization.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div>
                    <span className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1">Company Email</span>
                    <span className="block text-slate-800 text-[15px] flex items-center gap-1.5">
                      <Mail className="w-4 h-4 text-slate-400" />
                      {organization.email || "N/A"}
                    </span>
                  </div>

                  <div>
                    <span className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1">Phone Number</span>
                    <span className="block text-slate-800 text-[15px] flex items-center gap-1.5">
                      <Phone className="w-4 h-4 text-slate-400" />
                      {organization.phone || "N/A"}
                    </span>
                  </div>

                  <div>
                    <span className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1">Organization ID</span>
                    <span className="block text-slate-800 text-xs font-mono bg-slate-100 px-2 py-1 rounded w-fit">{organization.id}</span>
                  </div>
                </div>
              </div>

              {/* Address Details */}
              <div>
                <h3 className="text-lg font-semibold text-[#1e293b] border-b border-slate-100 pb-3 mb-5 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-indigo-600" />
                  Address & Location
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <span className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1">Street Address</span>
                    <span className="block text-slate-800 text-[15px]">{organization.address || "N/A"}</span>
                  </div>

                  <div>
                    <span className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1">City</span>
                    <span className="block text-slate-800 text-[15px]">{organization.city || "N/A"}</span>
                  </div>

                  <div>
                    <span className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1">State</span>
                    <span className="block text-slate-800 text-[15px]">{organization.state || "N/A"}</span>
                  </div>

                  <div>
                    <span className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1">Country</span>
                    <span className="block text-slate-800 text-[15px]">{organization.country || "N/A"}</span>
                  </div>

                  <div>
                    <span className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1">Postal Code</span>
                    <span className="block text-slate-800 text-[15px]">{organization.postalCode || "N/A"}</span>
                  </div>
                </div>
              </div>

              {/* Tax Information */}
              <div>
                <h3 className="text-lg font-semibold text-[#1e293b] border-b border-slate-100 pb-3 mb-5 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  Tax & Identification Numbers
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <span className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1">GST Number</span>
                    <span className="block text-slate-800 text-[15px] font-mono">{organization.gstNumber || "N/A"}</span>
                  </div>

                  <div>
                    <span className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1">PAN Number</span>
                    <span className="block text-slate-800 text-[15px] font-mono">{organization.panNumber || "N/A"}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Edit Mode - Super Admin All Fields Form */
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <h3 className="text-lg font-semibold text-[#1e293b] border-b border-slate-100 pb-4">
                Edit All Organization Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-[#475569]">
                    Organization Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register("name")}
                    placeholder="Enter organization name"
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                  />
                  {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-[#475569]">Company Email</label>
                  <input
                    {...register("email")}
                    placeholder="contact@company.com"
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                  />
                  {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-[#475569]">Phone Number (10 Digits)</label>
                  <input
                    {...register("phone", {
                      onChange: (e) => {
                        const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 10);
                        setValue("phone", digitsOnly);
                      }
                    })}
                    type="tel"
                    maxLength={10}
                    inputMode="numeric"
                    pattern="[0-9]{10}"
                    placeholder="10-digit mobile number (e.g. 9876543210)"
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                  />
                  {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-[#475569]">GST Number</label>
                  <input
                    {...register("gstNumber")}
                    placeholder="22AAAAA0000A1Z5"
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-[#475569]">PAN Number</label>
                  <input
                    {...register("panNumber")}
                    placeholder="ABCDE1234F"
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <h4 className="text-md font-semibold text-[#1e293b] pt-2 border-t border-slate-100">
                Address & Location
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-sm font-semibold text-[#475569]">Street Address</label>
                  <input
                    {...register("address")}
                    placeholder="Building, Street name"
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-[#475569]">City</label>
                  <input
                    {...register("city")}
                    placeholder="City"
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-[#475569]">State</label>
                  <input
                    {...register("state")}
                    placeholder="State"
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-[#475569]">Country</label>
                  <input
                    {...register("country")}
                    placeholder="Country"
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-[#475569]">Postal Code</label>
                  <input
                    {...register("postalCode")}
                    placeholder="400001"
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
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

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="rounded-xl border border-slate-300 bg-white px-6 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-[#4F46E5] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-70 cursor-pointer shadow-sm"
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
