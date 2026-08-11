import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email or Phone Number is required"),

  password: z
    .string()
    .min(1, "Password is required"),
});

export default function Login() {
  const navigate = useNavigate();

  const { login } = useAuth();

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    try {
      setLoading(true);

      const response = await login(data);

      if (!response.success) {
        toast.error(response.message || "Login failed");
        return;
      }

      const payload = response.data;

      if (payload?.emailVerified === false && !payload?.tokens?.accessToken && !payload?.user) {
        toast.error("Please verify your email address.");
        return;
      }

      if (payload.passwordExpired) {
        toast("Password expired.");

        navigate("/reset-password", {
          state: {
            email: payload.email,
          },
        });

        return;
      }

      toast.success("Login Successful");

      navigate("/dashboard");
    } catch (error) {
      console.log(error);

      toast.error(
        error?.response?.data?.message ||
          "Unable to login"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">

      {/* LEFT SIDE */}

      <div className="hidden lg:flex bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white p-16 flex-col justify-between">

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <h1 className="text-4xl font-bold">

            IT360 SFA

          </h1>

          <p className="mt-3 text-slate-300 leading-7">

            Sales Force Automation Platform

          </p>
        </motion.div>

        <motion.div
          initial={{
            opacity: 0,
            y: 40,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: .7,
          }}
        >
          <h2 className="text-5xl font-bold leading-tight">

            Accelerate your
            sales team with
            intelligent automation.

          </h2>

          <p className="mt-8 text-slate-300 text-lg">

            Manage Sales Orders,
            Field Force,
            Reporting,
            Team Management
            and much more from one dashboard.

          </p>
        </motion.div>

        <div className="text-slate-400">

          © 2026 IT360

        </div>

      </div>

      {/* RIGHT SIDE */}

      <div className="flex justify-center items-center bg-slate-50">

        <motion.div
          initial={{
            opacity:0,
            y:30
          }}
          animate={{
            opacity:1,
            y:0
          }}
          className="w-full max-w-md bg-white rounded-2xl shadow-xl p-10"
        >

          <div className="mb-10">

            <h2 className="text-3xl font-bold">

              Welcome Back

            </h2>

            <p className="text-gray-500 mt-2">

              Login to continue

            </p>

          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6"
          >

            <div>

              <label className="font-medium">

                Email or Phone Number

              </label>

              <input
                {...register("email")}
                type="text"
                placeholder="john@example.com or 9876543210"
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
              />

              {errors.email && (

                <p className="text-red-500 mt-2 text-sm">

                  {errors.email.message}

                </p>

              )}

            </div>

            <div>

              <label className="font-medium">

                Password

              </label>

              <div className="relative mt-2">

                <input
                  {...register("password")}
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="********"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 pr-12 outline-none focus:ring-2 focus:ring-indigo-500"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  className="absolute right-4 top-4"
                >
                  {showPassword ? (
                    <FiEyeOff size={20}/>
                  ) : (
                    <FiEye size={20}/>
                  )}
                </button>

              </div>

              {errors.password && (

                <p className="text-red-500 mt-2 text-sm">

                  {errors.password.message}

                </p>

              )}

            </div>

                        <div className="flex items-center justify-between">

              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">

                <input
                  type="checkbox"
                  className="rounded border-gray-300"
                />

                Remember Me

              </label>

              <Link
                to="/forgot-password"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                Forgot Password?
              </Link>

            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-indigo-600 py-3 text-white font-semibold transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2
                    className="mr-2 h-5 w-5 animate-spin"
                  />
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </button>

          </form>


          <div className="mt-8 text-center text-sm text-gray-500">

            Powered by

            <span className="ml-2 font-semibold text-indigo-600">

              ITSoftLab Consultancy Services Pvt.Ltd.

            </span>

          </div>

        </motion.div>

      </div>

    </div>
  );
}