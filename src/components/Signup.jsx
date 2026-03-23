import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export const Signup = () => {

  const navigate = useNavigate();
  const [role, setRole] = useState("talent");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({ mode: "all" });

  const password = watch("password");

  const strengthColor = {
    Weak: "text-red-500",
    Medium: "text-yellow-500",
    Strong: "text-green-600",
  };

  const getPasswordStrength = () => {
    if (!password) return "";

    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[!@#$%^&*]/.test(password)) score++;

    if (score <= 2) return "Weak";
    if (score <= 4) return "Medium";
    return "Strong";
  };

  const onSubmit = async (data) => {
    try {
      const payload = {
        name: data.name,
        email: data.email,
        password: data.password,
        role: role,
      };

      const res = await axios.post("/user/register", payload);

      if (res.status === 201) {
        toast.success("User registered successfully");
        navigate("/login");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    }
  };

  const onError = () => {
    toast.error("Please fix the form errors");
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 font-[Inter] bg-white">

      {/* LEFT */}
      <div className="hidden lg:flex flex-col justify-between p-16 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 text-white">

        <h1 className="text-2xl font-semibold">
          Local<span className="text-amber-400">Gems</span>
        </h1>

        <div>
          <h2 className="text-4xl font-semibold mb-4">
            Create your account 🚀
          </h2>
          <p className="text-gray-400 text-sm max-w-md">
            Join the platform and start connecting with amazing local talent.
          </p>
        </div>

        <p className="text-xs text-gray-500">
          © 2026 LocalGems. All rights reserved.
        </p>
      </div>

      {/* RIGHT */}
      <div className="flex items-center justify-center px-6">

        <div className="w-full max-w-md">

          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-gray-900">
              Create account
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Already have an account?{" "}
              <span
                onClick={() => navigate("/login")}
                className="text-amber-500 cursor-pointer hover:underline"
              >
                Sign in
              </span>
            </p>
          </div>

          {/* ROLE SWITCH */}
          <div className="flex border border-gray-300 rounded-lg p-1 mb-6">
            <button
              type="button"
              onClick={() => setRole("talentprovider")}
              className={`flex-1 py-2 rounded-md text-sm ${
                role === "talentprovider"
                  ? "bg-gray-900 text-white"
                  : "text-gray-600"
              }`}
            >
              Talent Provider
            </button>

            <button
              type="button"
              onClick={() => setRole("talent")}
              className={`flex-1 py-2 rounded-md text-sm ${
                role === "talent"
                  ? "bg-gray-900 text-white"
                  : "text-gray-600"
              }`}
            >
              Talent
            </button>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit, onError)}
            className="space-y-5"
          >

            {/* NAME */}
            <div>
              <label className="text-sm text-gray-700">Full Name</label>
              <input
                type="text"
                {...register("name", { required: "Name required" })}
                placeholder="John Doe"
                className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 outline-none"
              />
              {errors.name && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* EMAIL */}
            <div>
              <label className="text-sm text-gray-700">Email</label>
              <input
                type="email"
                {...register("email", { required: "Email required" })}
                placeholder="you@example.com"
                className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 outline-none"
              />
              {errors.email && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* PASSWORD */}
            <div>
              <label className="text-sm text-gray-700">Password</label>
              <input
                type="password"
                {...register("password", { required: "Password required" })}
                placeholder="Create password"
                className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 outline-none"
              />

              {errors.password && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.password.message}
                </p>
              )}

              {password && (
                <p className={`text-xs mt-1 ${strengthColor[getPasswordStrength()]}`}>
                  {getPasswordStrength()} password
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3 rounded-lg font-medium transition"
            >
              Create Account
            </button>

          </form>

        </div>

      </div>
    </div>
  );
};