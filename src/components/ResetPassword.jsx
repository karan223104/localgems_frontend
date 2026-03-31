import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";

export const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // email passed from ForgotPassword page via navigate state
  const email = location.state?.email;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm({ mode: "all" });

  const onSubmit = async (data) => {
    try {
      const res = await axios.post("/user/reset-password", {
        email: email,
        newPassword: data.newPassword
      });

      if (res.status === 200) {
        toast.success("Password reset successfully!");
        navigate("/login");
      }
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error("Please verify your email first.");
        navigate("/forgot-password");
      } else {
        toast.error(err.response?.data?.message || "Something went wrong");
      }
    }
  };

  // Guard: if someone opens /reset-password directly without going through forgot-password
  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center font-[Inter]">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please verify your email first.</p>
          <button
            onClick={() => navigate("/forgot-password")}
            className="bg-gray-900 text-white px-6 py-2 rounded-lg"
          >
            Go to Forgot Password
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 font-[Inter] bg-white">

      {/* LEFT */}
      <div className="hidden lg:flex flex-col justify-between p-16 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 text-white">
        <h1 className="text-2xl font-semibold tracking-tight">
          Local<span className="text-amber-400">Gems</span>
        </h1>
        <div>
          <h2 className="text-4xl font-semibold leading-tight mb-4">
            Set a new password 🔒
          </h2>
          <p className="text-gray-400 text-sm max-w-md">
            Choose a strong password to keep your account safe.
          </p>
        </div>
        <p className="text-xs text-gray-500">© 2026 LocalGems. All rights reserved.</p>
      </div>

      {/* RIGHT */}
      <div className="flex items-center justify-center px-6">
        <div className="w-full max-w-md">

          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-gray-900">Create new password</h1>
            <p className="text-sm text-gray-500 mt-1">
              Resetting password for <span className="text-amber-500">{email}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            {/* NEW PASSWORD */}
            <div>
              <label className="text-sm text-gray-700">New Password</label>
              <input
                type="password"
                {...register("newPassword", {
                  required: "Password is required",
                  minLength: { value: 6, message: "Minimum 6 characters" }
                })}
                placeholder="Enter new password"
                className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 outline-none"
              />
              {errors.newPassword && (
                <p className="text-xs text-red-500 mt-1">{errors.newPassword.message}</p>
              )}
            </div>

            {/* CONFIRM PASSWORD */}
            <div>
              <label className="text-sm text-gray-700">Confirm Password</label>
              <input
                type="password"
                {...register("confirmPassword", {
                  required: "Please confirm your password",
                  validate: (val) =>
                    val === watch("newPassword") || "Passwords do not match"
                })}
                placeholder="Confirm new password"
                className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 outline-none"
              />
              {errors.confirmPassword && (
                <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3 rounded-lg font-medium transition"
            >
              Reset Password
            </button>

          </form>
        </div>
      </div>
    </div>
  );
};