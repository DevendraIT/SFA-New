import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, KeyRound, ArrowLeft, Loader2, CheckCircle, ShieldCheck, Check, X } from "lucide-react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import toast from "react-hot-toast";
import authService from "../../services/auth.service";

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1: Send OTP, 2: Reset Password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Timer countdown for resend OTP
  useEffect(() => {
    let timer;
    if (resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendTimer]);

  const validateEmail = (val) => {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(val.trim());
  };

  // Live Password Validation Criteria
  const pwdValidations = {
    minLength: newPassword.length >= 8,
    hasUpper: /[A-Z]/.test(newPassword),
    hasLower: /[a-z]/.test(newPassword),
    hasNumber: /[0-9]/.test(newPassword),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword),
    passwordsMatch: newPassword.length > 0 && newPassword === confirmPassword,
  };

  const isFormValid =
    pwdValidations.minLength &&
    pwdValidations.hasUpper &&
    pwdValidations.hasLower &&
    pwdValidations.hasNumber &&
    pwdValidations.hasSpecial &&
    pwdValidations.passwordsMatch;

  // Step 1: Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      toast.error("Please enter your registered email address.");
      return;
    }

    if (!validateEmail(cleanEmail)) {
      toast.error("Please enter a valid email address (e.g. user@example.com).");
      return;
    }

    setLoading(true);
    try {
      await authService.forgotPassword(cleanEmail);
      toast.success("Verification OTP sent to your email!");
      setStep(2);
      setResendTimer(60);
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to send reset OTP. Please check your email.");
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    try {
      await authService.forgotPassword(email.trim().toLowerCase());
      toast.success("A new OTP has been sent to your email!");
      setResendTimer(60);
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Reset Password with OTP
  const handleResetPassword = async (e) => {
    e.preventDefault();

    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      toast.error("Please enter the 6-digit OTP received in your email.");
      return;
    }

    if (!isFormValid) {
      if (!pwdValidations.minLength) toast.error("Password must be at least 8 characters long.");
      else if (!pwdValidations.hasUpper) toast.error("Password must contain at least 1 uppercase letter (A-Z).");
      else if (!pwdValidations.hasLower) toast.error("Password must contain at least 1 lowercase letter (a-z).");
      else if (!pwdValidations.hasNumber) toast.error("Password must contain at least 1 number (0-9).");
      else if (!pwdValidations.hasSpecial) toast.error("Password must contain at least 1 special character (!@#$%^&*).");
      else if (!pwdValidations.passwordsMatch) toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword({
        email: email.trim().toLowerCase(),
        otp: cleanOtp,
        newPassword,
      });

      toast.success("Password reset successfully! Redirecting to login...");
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to reset password. Please check your OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* LEFT SIDE - SFA Platform Branding */}
      <div className="hidden lg:flex bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white p-16 flex-col justify-between">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="text-4xl font-bold">IT360 SFA</h1>
          <p className="mt-3 text-slate-300 leading-7">Sales Force Automation Platform</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <h2 className="text-5xl font-bold leading-tight">
            Secure Account Recovery
          </h2>
          <p className="mt-8 text-slate-300 text-lg">
            Verify your email via OTP to reset your password and safely restore access to your SFA workspace.
          </p>
        </motion.div>

        <div className="text-slate-400">© 2026 IT360</div>
      </div>

      {/* RIGHT SIDE - Form Container */}
      <div className="flex justify-center items-center bg-slate-50 p-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8"
        >
          {/* Navigation Back */}
          <div className="flex items-center justify-between mb-6">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition"
            >
              <ArrowLeft size={16} />
              Back to Login
            </Link>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
              Step {step} of 2
            </span>
          </div>

          {/* Header */}
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-slate-900">
              {step === 1 ? "Forgot Password?" : "Set New Password"}
            </h2>
            <p className="text-slate-500 mt-2 text-sm">
              {step === 1
                ? "Enter your registered email address and we'll send you a 6-digit OTP code."
                : `Enter the 6-digit OTP sent to ${email} and set your new password below.`}
            </p>
          </div>

          {/* STEP 1: Request OTP Form */}
          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-6" autoComplete="off">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your registered email"
                    className="w-full rounded-xl border border-slate-300 py-3 pl-11 pr-4 text-slate-800 placeholder-slate-400 outline-none transition focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-indigo-600 py-3.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  "Send Verification OTP"
                )}
              </button>
            </form>
          )}

          {/* STEP 2: Verify OTP & Reset Password Form */}
          {step === 2 && (
            <form onSubmit={handleResetPassword} className="space-y-5" autoComplete="off">
              {/* OTP Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  6-Digit Verification OTP
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    maxLength={6}
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    autoComplete="one-time-code"
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="Enter 6-digit OTP"
                    className="w-full rounded-xl border border-slate-300 py-3 pl-11 pr-4 font-mono text-lg font-bold tracking-widest text-slate-900 placeholder-slate-400 outline-none transition focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                  />
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    name="sfa_new_password_field"
                    id="sfa_new_password_field"
                    autoComplete="new-password"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full rounded-xl border border-slate-300 py-3 pl-4 pr-11 text-slate-900 placeholder-slate-400 outline-none transition focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                  >
                    {showNewPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
              </div>

              {/* Password Validation Requirements Checklist */}
              {newPassword.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-1.5 text-xs">
                  <span className="block font-semibold text-slate-700 mb-1">Password Requirements:</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className={`flex items-center gap-1.5 ${pwdValidations.minLength ? "text-emerald-600 font-medium" : "text-slate-400"}`}>
                      {pwdValidations.minLength ? <Check size={14} /> : <X size={14} />}
                      <span>Min 8 Characters</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${pwdValidations.hasUpper ? "text-emerald-600 font-medium" : "text-slate-400"}`}>
                      {pwdValidations.hasUpper ? <Check size={14} /> : <X size={14} />}
                      <span>Uppercase (A-Z)</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${pwdValidations.hasLower ? "text-emerald-600 font-medium" : "text-slate-400"}`}>
                      {pwdValidations.hasLower ? <Check size={14} /> : <X size={14} />}
                      <span>Lowercase (a-z)</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${pwdValidations.hasNumber ? "text-emerald-600 font-medium" : "text-slate-400"}`}>
                      {pwdValidations.hasNumber ? <Check size={14} /> : <X size={14} />}
                      <span>Number (0-9)</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${pwdValidations.hasSpecial ? "text-emerald-600 font-medium" : "text-slate-400"}`}>
                      {pwdValidations.hasSpecial ? <Check size={14} /> : <X size={14} />}
                      <span>Special (!@#$)</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="sfa_confirm_password_field"
                    id="sfa_confirm_password_field"
                    autoComplete="new-password"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className={`w-full rounded-xl border py-3 pl-4 pr-11 text-slate-900 placeholder-slate-400 outline-none transition focus:ring-2 focus:ring-indigo-600 focus:border-transparent ${
                      confirmPassword && !pwdValidations.passwordsMatch
                        ? "border-red-500 focus:ring-red-500"
                        : "border-slate-300"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
                {confirmPassword && !pwdValidations.passwordsMatch && (
                  <p className="mt-1 text-xs text-red-600 font-semibold">Passwords do not match.</p>
                )}
              </div>

              {/* Resend OTP Timer */}
              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span>Didn't receive the OTP?</span>
                {resendTimer > 0 ? (
                  <span className="font-semibold text-slate-600">Resend in {resendTimer}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={loading}
                    className="font-semibold text-indigo-600 hover:text-indigo-700 underline"
                  >
                    Resend OTP
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || (newPassword.length > 0 && !isFormValid)}
                className="w-full rounded-xl bg-indigo-600 py-3.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Updating Password...
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} />
                    Reset & Save Password
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-center text-xs font-medium text-slate-500 hover:text-slate-800 transition"
              >
                Change email address
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}