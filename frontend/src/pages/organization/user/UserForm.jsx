import { useState, useEffect, useMemo } from "react";
import { Loader2, Eye, EyeOff, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import userService from "../../../services/user.service";
import roleService from "../../../services/role.service";
import branchService from "../../../services/branch.service";
import departmentService from "../../../services/department.service";
import teamService from "../../../services/team.service";
import { useAuth } from "../../../context/AuthContext";

export default function UserForm({ user, onClose, onSuccess }) {
  const { user: currentUser } = useAuth();
  const isEditMode = !!user;

  const isSalesManager = useMemo(() => {
    if (!currentUser) return false;
    const roleNames = Array.isArray(currentUser.roles)
      ? currentUser.roles.map((r) => (typeof r === "string" ? r : r.role?.name || r.name))
      : [currentUser.role?.name || ""];
    return (
      roleNames.some((r) => r && r.toLowerCase().includes("sales manager")) &&
      !roleNames.some((r) => r && (r.toLowerCase().includes("super admin") || r.toLowerCase().includes("head of sales")))
    );
  }, [currentUser]);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phoneNumber: "",
    branchId: "",
    departmentId: "",
    teamId: "",
    territoryId: "",
    managerId: "",
    roleIds: [],
    isActive: true,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [roles, setRoles] = useState([]);
  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingDeps, setLoadingDeps] = useState(false);
  const [loadingTeams, setLoadingTeams] = useState(false);

  const isCurrentSuperAdmin = useMemo(() => {
    if (!currentUser) return false;
    const roleNames = Array.isArray(currentUser.roles)
      ? currentUser.roles.map((r) => (typeof r === "string" ? r : r.role?.name || r.name))
      : [currentUser.role?.name || ""];
    return roleNames.some((r) => r && r.toLowerCase().includes("super admin"));
  }, [currentUser]);

  const filteredRoles = useMemo(() => {
    if (!roles) return [];
    let list = roles;
    if (isCurrentSuperAdmin) {
      list = list.filter((role) => role.name && role.name.toLowerCase().includes("company admin"));
    } else {
      list = list.filter((role) => {
        const name = role.name?.toLowerCase() || "";
        return !name.includes("super admin") && !name.includes("company admin");
      });
    }
    if (isSalesManager) {
      list = list.filter((role) => role.name && role.name.toLowerCase() === "sales executive");
    }
    return list;
  }, [roles, isSalesManager, isCurrentSuperAdmin]);

  // Fetch lookup data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rolesRes, branchesRes, deptsRes, usersRes] = await Promise.all([
          roleService.getRoles({ limit: 100 }),
          branchService.getBranches({ limit: 100 }),
          departmentService.getDepartments({ limit: 100 }),
          userService.getUsers({ limit: 100 }),
        ]);
        // roleService.getRoles returns res.data = { success, data: { roles }, meta }
        const rolesData = rolesRes?.data?.roles ?? rolesRes?.roles ?? [];
        const branchesData = branchesRes?.data?.branches ?? branchesRes?.branches ?? [];
        const deptsData = deptsRes?.data?.departments ?? deptsRes?.departments ?? [];
        const usersData = usersRes?.data?.users ?? usersRes?.users ?? [];
        setRoles(rolesData);
        setBranches(branchesData);
        setDepartments(deptsData);
        setUsers(usersData);
      } catch (err) {
        console.error("Failed to load lookup data:", err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!isEditMode && filteredRoles.length > 0 && form.roleIds.length === 0) {
      setForm((prev) => ({
        ...prev,
        roleIds: [filteredRoles[0].id],
      }));
    }
  }, [filteredRoles, isEditMode, form.roleIds.length]);

  // Auto-set Branch & Manager for Sales Manager (Department chosen by Sales Manager)
  useEffect(() => {
    if (!isEditMode && isSalesManager && currentUser) {
      setForm((prev) => ({
        ...prev,
        branchId: currentUser.branchId || currentUser.branch?.id || prev.branchId,
        managerId: currentUser.id || prev.managerId,
      }));
    }
  }, [isSalesManager, isEditMode, currentUser]);

  // Auto-assign Sales Manager when Branch is selected by Company Admin
  useEffect(() => {
    if (form.branchId && users.length > 0 && !isSalesManager) {
      const branchSalesManager = users.find((u) => {
        const isSameBranch = u.branchId === form.branchId || u.branch?.id === form.branchId;
        if (!isSameBranch) return false;
        const roleNames = Array.isArray(u.roles)
          ? u.roles.map((r) => (typeof r === "string" ? r : r.role?.name || r.name))
          : [u.role?.name || ""];
        return roleNames.some((r) => r && r.toLowerCase().includes("sales manager"));
      });
      if (branchSalesManager) {
        setForm((prev) => ({
          ...prev,
          managerId: prev.managerId || branchSalesManager.id,
        }));
      }
    }
  }, [form.branchId, users, isSalesManager]);

  // Fetch departments when branch changes
  useEffect(() => {
    if (!form.branchId) {
      setDepartments([]);
      setForm((prev) => ({ ...prev, departmentId: "" }));
      return;
    }
    const fetchDepts = async () => {
      setLoadingDeps(true);
      try {
        const res = await departmentService.getDepartments({
          branchId: form.branchId,
          limit: 100,
        });
        setDepartments(res?.data?.departments || []);
      } catch (err) {
        console.error("Failed to load departments:", err);
      } finally {
        setLoadingDeps(false);
      }
    };
    fetchDepts();
  }, [form.branchId]);

  // Fetch teams when branch or department changes
  useEffect(() => {
    if (!form.branchId) {
      setTeams([]);
      setForm((prev) => ({ ...prev, teamId: "" }));
      return;
    }
    const fetchTeams = async () => {
      setLoadingTeams(true);
      try {
        const params = { branchId: form.branchId, limit: 100 };
        if (form.departmentId) params.departmentId = form.departmentId;
        const res = await teamService.getTeams(params);
        setTeams(res?.data?.teams || []);
      } catch (err) {
        console.error("Failed to load teams:", err);
      } finally {
        setLoadingTeams(false);
      }
    };
    fetchTeams();
  }, [form.branchId, form.departmentId]);

  // Populate form in edit mode
  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        password: "",
        phoneNumber: user.phoneNumber || "",
        branchId: user.branchId || "",
        departmentId: user.departmentId || "",
        teamId: user.teamId || "",
        territoryId: user.territoryId || "",
        managerId: user.managerId || "",
        roleIds: user.roles?.map((r) => r.role?.id || r.roleId) || [],
        isActive: user.isActive ?? true,
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleRoleSelect = (roleId) => {
    setForm((prev) => ({
      ...prev,
      roleIds: [roleId],
    }));
  };

  const [fieldErrors, setFieldErrors] = useState({});
  const [formErrorMessage, setFormErrorMessage] = useState("");

  const validatePasswordRequirements = (pwd) => {
    if (!pwd) return "Password is required.";
    const missing = [];
    if (pwd.length < 8) missing.push(`minimum 8 characters (currently ${pwd.length})`);
    if (!/[A-Z]/.test(pwd)) missing.push("at least one uppercase letter (A-Z)");
    if (!/[a-z]/.test(pwd)) missing.push("at least one lowercase letter (a-z)");
    if (!/[0-9]/.test(pwd)) missing.push("at least one number (0-9)");
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) missing.push("at least one special character (e.g. @$!%*?&#)");

    if (missing.length > 0) {
      return `Password requirement failed! Missing: ${missing.join(", ")}.`;
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = {};
    if (!form.firstName.trim()) {
      errors.firstName = "First name is required.";
    } else if (form.firstName.trim().length < 2) {
      errors.firstName = "First name must be at least 2 characters.";
    }

    if (!form.lastName.trim()) {
      errors.lastName = "Last name is required.";
    } else if (form.lastName.trim().length < 2) {
      errors.lastName = "Last name must be at least 2 characters.";
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!form.email.trim()) {
      errors.email = "Email address is required.";
    } else if (!emailRegex.test(form.email.trim())) {
      errors.email = "Please enter a valid standard email address (e.g. user@example.com).";
    }

    if (form.phoneNumber && form.phoneNumber.trim().length > 0) {
      if (!/^\d{10}$/.test(form.phoneNumber.trim())) {
        errors.phoneNumber = "Mobile number must be exactly 10 numeric digits.";
      }
    }

    if (!isEditMode) {
      const pwdErr = validatePasswordRequirements(form.password);
      if (pwdErr) errors.password = pwdErr;
    }

    if (form.roleIds.length !== 1) {
      errors.roles = "Please select exactly one role for the user.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const firstMsg = Object.values(errors)[0];
      setFormErrorMessage(firstMsg);
      toast.error(firstMsg);
      return;
    }

    setFieldErrors({});
    setFormErrorMessage("");
    setSubmitting(true);

    try {
      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        phoneNumber: form.phoneNumber.trim() || undefined,
        branchId: form.branchId || undefined,
        departmentId: form.departmentId || undefined,
        teamId: form.teamId || undefined,
        territoryId: form.territoryId || undefined,
        managerId: form.managerId || undefined,
        roleIds: form.roleIds,
        isActive: form.isActive,
      };

      if (!isEditMode) {
        payload.password = form.password;
      }

      if (isEditMode) {
        await userService.updateUser(user.id, payload);
        toast.success("User updated successfully");
      } else {
        await userService.createUser(payload);
        toast.success("User created successfully");
      }

      onSuccess?.();
      onClose?.();
    } catch (err) {
      console.error(err);
      let msg =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.[0]?.message ||
        "Failed to save user";
      if (err?.response?.data?.details) {
        msg += ": " + JSON.stringify(err.response.data.details);
      }
      setFormErrorMessage(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            name="firstName"
            value={form.firstName}
            onChange={handleChange}
            className={inputClass + (fieldErrors.firstName ? " border-red-500 ring-1 ring-red-200" : "")}
            placeholder="John"
          />
          {fieldErrors.firstName && (
            <p className="mt-1 text-xs font-semibold text-red-600 flex items-center gap-1">
              <AlertCircle size={12} /> {fieldErrors.firstName}
            </p>
          )}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Last Name <span className="text-red-500">*</span>
          </label>
          <input
            name="lastName"
            value={form.lastName}
            onChange={handleChange}
            className={inputClass + (fieldErrors.lastName ? " border-red-500 ring-1 ring-red-200" : "")}
            placeholder="Doe"
          />
          {fieldErrors.lastName && (
            <p className="mt-1 text-xs font-semibold text-red-600 flex items-center gap-1">
              <AlertCircle size={12} /> {fieldErrors.lastName}
            </p>
          )}
        </div>
      </div>

      {/* Email */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          className={inputClass + (fieldErrors.email ? " border-red-500 ring-1 ring-red-200" : "")}
          placeholder="john@example.com"
        />
        {fieldErrors.email && (
          <p className="mt-1 text-xs font-semibold text-red-600 flex items-center gap-1">
            <AlertCircle size={12} /> {fieldErrors.email}
          </p>
        )}
      </div>

      {/* Password (only for create) */}
      {!isEditMode && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={handleChange}
              className={inputClass + " pr-10" + (fieldErrors.password ? " border-red-500 ring-1 ring-red-200" : "")}
              placeholder="Min 8 chars, upper, lower, number, special"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {fieldErrors.password ? (
            <p className="mt-1.5 text-xs font-bold text-red-600 flex items-start gap-1">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>{fieldErrors.password}</span>
            </p>
          ) : (
            <p className="mt-1 text-xs text-slate-400">
              Must contain minimum 8 characters, uppercase, lowercase, number & special character
            </p>
          )}
        </div>
      )}

      {/* Phone */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Mobile Number (10 Digits)</label>
        <input
          name="phoneNumber"
          type="tel"
          maxLength={10}
          inputMode="numeric"
          pattern="[0-9]{10}"
          value={form.phoneNumber}
          onChange={(e) => {
            const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 10);
            setForm((prev) => ({ ...prev, phoneNumber: digitsOnly }));
          }}
          className={inputClass + (fieldErrors.phoneNumber ? " border-red-500 ring-1 ring-red-200" : "")}
          placeholder="10-digit mobile number (e.g. 9876543210)"
        />
        {fieldErrors.phoneNumber && (
          <p className="mt-1 text-xs font-semibold text-red-600 flex items-center gap-1">
            <AlertCircle size={12} /> {fieldErrors.phoneNumber}
          </p>
        )}
      </div>

      {/* Structural Assignments */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Department */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Department</label>
          <select
            name="departmentId"
            value={form.departmentId}
            onChange={handleChange}
            className={inputClass}
          >
            <option value="">Select Department</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* Branch */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Branch</label>
          <select
            name="branchId"
            value={form.branchId}
            onChange={handleChange}
            disabled={isSalesManager}
            className={inputClass + (isSalesManager ? " bg-slate-100 cursor-not-allowed" : "")}
          >
            <option value="">Select Branch</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* Team */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Team</label>
          <select
            name="teamId"
            value={form.teamId}
            onChange={handleChange}
            className={inputClass}
          >
            <option value="">Select Team</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Manager */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Manager</label>
        {isSalesManager ? (
          <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-3.5 flex items-center justify-between">
            <div>
              <span className="block text-xs font-bold uppercase text-indigo-700">Assigned Manager (Default)</span>
              <span className="text-sm font-bold text-slate-900">
                {currentUser?.firstName} {currentUser?.lastName} (Sales Manager)
              </span>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
              Selected by Default
            </span>
          </div>
        ) : (
          <select
            name="managerId"
            value={form.managerId}
            onChange={handleChange}
            className={inputClass}
          >
            <option value="">No Manager</option>
            {users
              .filter((u) => u.id !== user?.id)
              .map((u) => (
                <option key={u.id} value={u.id}>
                  {u.firstName} {u.lastName} ({u.email})
                </option>
              ))}
          </select>
        )}
      </div>

      {/* Roles - Single Role Selection */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          Role Designation <span className="text-red-500">*</span>{" "}
          <span className="text-xs text-slate-400 font-normal">(Select 1 Role)</span>
        </label>
        <div className={`flex flex-wrap gap-3 rounded-xl border p-4 ${fieldErrors.roles ? "border-red-500 bg-red-50/20" : "border-slate-200"}`}>
          {filteredRoles.length === 0 && (
            <p className="text-sm text-slate-400">No roles available</p>
          )}
          {filteredRoles.map((role) => {
            const isSelected = form.roleIds.includes(role.id);
            return (
              <label
                key={role.id}
                className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                  isSelected
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-200 shadow-xs"
                    : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="userSingleRole"
                  checked={isSelected}
                  onChange={() => handleRoleSelect(role.id)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                />
                {role.name}
              </label>
            );
          })}
        </div>
        {fieldErrors.roles && (
          <p className="mt-1 text-xs font-semibold text-red-600 flex items-center gap-1">
            <AlertCircle size={12} /> {fieldErrors.roles}
          </p>
        )}
      </div>

      {/* Active Status */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          name="isActive"
          checked={form.isActive}
          onChange={handleChange}
          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
        />
        <label className="text-sm font-medium text-slate-700">Active</label>
      </div>

      {/* Validation Error Banner at End of Form */}
      {formErrorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700 flex items-start gap-2.5 shadow-sm">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block text-sm text-red-800 mb-0.5">Validation Alert:</span>
            {formErrorMessage}
          </div>
        </div>
      )}

      {/* Buttons */}
      <div className="flex justify-end gap-3 border-t pt-5">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition disabled:opacity-60"
        >
          {submitting && <Loader2 size={16} className="animate-spin" />}
          {isEditMode ? "Update User" : "Create User"}
        </button>
      </div>
    </form>
  );
}

