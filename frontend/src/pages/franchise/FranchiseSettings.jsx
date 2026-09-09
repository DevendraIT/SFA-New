import { useState, useEffect } from "react";
import {
  ShieldCheck,
  User,
  Lock,
  Mail,
  Phone,
  Building2,
  Save,
  Loader2,
  KeyRound,
  CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";
import franchiseApi from "../../api/franchise.api";
import { useAuth } from "../../context/AuthContext";

export default function FranchiseSettings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("profile"); // 'profile' | 'security'
  const [loading, setLoading] = useState(true);

  // Profile Form
  const [profileData, setProfileData] = useState({
    name: "",
    code: "",
    contactName: "",
    email: "",
    phone: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Security Form
  const [passData, setPassData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [updatingPassword, setUpdatingPassword] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await franchiseApi.getProfile();
      const prof = res.data?.data || res.data;
      if (prof) {
        setProfileData({
          name: prof.name || "",
          code: prof.code || "",
          contactName: prof.contactName || "",
          email: prof.email || "",
          phone: prof.phone || "",
        });
      }
    } catch (err) {
      console.error("Failed to load franchise profile:", err);
      toast.error(err.response?.data?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      await franchiseApi.updateProfile({
        name: profileData.name,
        contactName: profileData.contactName,
        phone: profileData.phone,
      });
      toast.success("Franchise profile updated successfully!");
    } catch (err) {
      console.error("Failed to update profile:", err);
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (passData.newPassword !== passData.confirmPassword) {
      toast.error("New password and confirm password do not match");
      return;
    }

    if (passData.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }

    try {
      setUpdatingPassword(true);
      await franchiseApi.changePassword({
        currentPassword: passData.currentPassword,
        newPassword: passData.newPassword,
      });
      toast.success("Password updated successfully!");
      setPassData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      console.error("Change password error:", err);
      toast.error(err.response?.data?.message || "Failed to update password");
    } finally {
      setUpdatingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <ShieldCheck size={13} />
            Franchise Administration
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1 tracking-tight">Franchise Settings</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Manage your Franchise profile, contact information, and security credentials.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab("profile")}
          className={`pb-3 border-b-2 transition flex items-center gap-2 cursor-pointer ${
            activeTab === "profile"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <User size={16} />
          <span>Profile Details</span>
        </button>

        <button
          onClick={() => setActiveTab("security")}
          className={`pb-3 border-b-2 transition flex items-center gap-2 cursor-pointer ${
            activeTab === "security"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <KeyRound size={16} />
          <span>Security & Password</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400">
          <Loader2 size={28} className="animate-spin mx-auto mb-2 text-blue-600" />
          Loading franchise details...
        </div>
      ) : activeTab === "profile" ? (
        /* 1. Profile Tab */
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Franchise Organization Name
                </label>
                <div className="relative">
                  <Building2 size={16} className="absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Franchise Code (Identifier)</label>
                <input
                  type="text"
                  disabled
                  value={profileData.code}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-500 font-mono select-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Contact Person Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={profileData.contactName}
                    onChange={(e) => setProfileData({ ...profileData, contactName: e.target.value })}
                    placeholder="Owner or Manager Name"
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email (Login ID)</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="email"
                    disabled
                    value={profileData.email}
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-500 font-mono"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Contact Phone Number</label>
                <div className="relative max-w-md">
                  <Phone size={16} className="absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    placeholder="+91 9876543210"
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t flex justify-end">
              <button
                type="submit"
                disabled={savingProfile}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition disabled:opacity-50 cursor-pointer"
              >
                {savingProfile ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                <span>Save Profile Changes</span>
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* 2. Security / Password Tab */
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm max-w-xl">
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Current Password *</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="password"
                  required
                  value={passData.currentPassword}
                  onChange={(e) => setPassData({ ...passData, currentPassword: e.target.value })}
                  placeholder="Enter your current password"
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">New Password *</label>
              <div className="relative">
                <KeyRound size={16} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="password"
                  required
                  value={passData.newPassword}
                  onChange={(e) => setPassData({ ...passData, newPassword: e.target.value })}
                  placeholder="Min. 6 characters"
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Confirm New Password *</label>
              <div className="relative">
                <KeyRound size={16} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="password"
                  required
                  value={passData.confirmPassword}
                  onChange={(e) => setPassData({ ...passData, confirmPassword: e.target.value })}
                  placeholder="Re-enter new password"
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="pt-4 border-t flex justify-end">
              <button
                type="submit"
                disabled={updatingPassword}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition disabled:opacity-50 cursor-pointer"
              >
                {updatingPassword ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                <span>Update Password</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
