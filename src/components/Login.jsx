import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export const Login = () => {

  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({ mode: "all" });

  const onSubmit = async (data) => {
    try {
      const res = await axios.post("/user/login", data);

      if (res.status === 200) {
        localStorage.removeItem("user");
        localStorage.setItem("user", JSON.stringify(res.data.user));
        window.dispatchEvent(new Event("authChange"));
        toast.success("Login successful");
        navigate("/");
      }
    } catch (err) {
      if (err.response?.status === 404) {
        toast.error("Email not registered");
      } else if (err.response?.status === 401) {
        toast.error("Invalid password");
      } else {
        toast.error(err.response?.data?.message || "Login failed");
      }
    }
  };

  const onError = () => {
    toast.error("Enter valid credentials");
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 font-[Inter] bg-white">

      {/* LEFT */}
      <div className="hidden lg:flex flex-col justify-between p-16 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 text-white">

        <h1 className="text-2xl font-semibold tracking-tight">
          Local<span className="text-amber-400">Gems</span>
        </h1>

        <div>
          <h2 className="text-4xl font-semibold leading-tight mb-4">
            Welcome back 👋
          </h2>

          <p className="text-gray-400 text-sm max-w-md">
            Access your dashboard, connect with talents, and manage your
            activities seamlessly.
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
              Sign in to your account
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Don’t have an account?{" "}
              <span
                onClick={() => navigate("/signup")}
                className="text-amber-500 cursor-pointer hover:underline"
              >
                Sign up
              </span>
            </p>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit, onError)}
            className="space-y-5"
          >

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
                placeholder="Enter your password"
                className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 outline-none"
              />
              {errors.password && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3 rounded-lg font-medium transition"
            >
              Sign In
            </button>

          </form>

        </div>

      </div>
    </div>
  );
};