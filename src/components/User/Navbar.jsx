import React, { useEffect, useState } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";

export const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const getUser = () => {
    try {
      const storedUser = localStorage.getItem("user");
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  };

  const [user, setUser] = useState(null);

  // Listen for login/logout changes and validate token
  useEffect(() => {
    const handleAuth = async () => {
      const storedUser = getUser();

      if (!storedUser?.token) {
        setUser(null);
        return;
      }

      try {
        // Optional server validation
        const res = await axios.get("/api/auth/validate", {
          headers: { Authorization: `Bearer ${storedUser.token}` },
        });

        if (res.status === 200 && res.data.user) {
          setUser(res.data.user);
        } else {
          setUser(null);
          localStorage.removeItem("user");
        }
      } catch {
        setUser(null);
        localStorage.removeItem("user");
      }
    };

    window.addEventListener("authChange", handleAuth);
    window.addEventListener("storage", handleAuth);

    // Run once on mount to check existing user
    handleAuth();

    return () => {
      window.removeEventListener("authChange", handleAuth);
      window.removeEventListener("storage", handleAuth);
    };
  }, []);

  // Update user on route change (for any direct changes)
  useEffect(() => {
    setUser(getUser());
  }, [location.pathname]);

  const closeSidebar = () => setIsOpen(false);

  const handleNavigate = (path) => {
    navigate(path);
    closeSidebar();
  };

  const handleProfile = () => {
    if (user?.role === "talent") handleNavigate("/talentprofile");
    else if (user?.role === "talentprovider")
      handleNavigate("/talentproviderprofile");
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    window.dispatchEvent(new Event("authChange"));
    toast.success("Logged out successfully");
    closeSidebar();
  };

  const handleScroll = (id) => {
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate("/");
      setTimeout(() => {
        const sec = document.getElementById(id);
        sec?.scrollIntoView({ behavior: "smooth" });
      }, 300);
    }
    closeSidebar();
  };

  return (
    <>
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/80 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-3 grid grid-cols-3 items-center">
          {/* LEFT - LOGO */}
          <div className="flex justify-start">
            <div
              onClick={() => handleScroll("home")}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center">
                <img
                  src="/logo1.png"
                  alt="Local Gems Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <h1 className="text-lg font-semibold tracking-tight">
                <span className="text-gray-900">Local</span>
                <span className="text-amber-500">Gems</span>
              </h1>
            </div>
          </div>

          {/* CENTER */}
          <div className="flex justify-center gap-6">
            <button
              onClick={() => handleNavigate("/explore")}
              className={`text-sm font-medium transition ${
                location.pathname === "/explore"
                  ? "text-amber-500"
                  : "text-gray-700 hover:text-amber-500"
              }`}
            >
              Explore
            </button>

            <button
              onClick={() => handleNavigate("/event")}
              className={`text-sm font-medium transition ${
                location.pathname === "/event"
                  ? "text-amber-500"
                  : "text-gray-700 hover:text-amber-500"
              }`}
            >
              Events
            </button>
          </div>

          {/* RIGHT */}
          <div className="flex justify-end items-center gap-4">
            {user && (
              <div
                onClick={handleProfile}
                className="hidden sm:flex items-center gap-2 cursor-pointer hover:bg-gray-100 px-3 py-1.5 rounded-lg transition"
              >
                <div className="w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm text-gray-700">{user.name}</span>
              </div>
            )}

            <button
              onClick={() => setIsOpen(true)}
              className="text-xl text-gray-700 hover:text-gray-900"
            >
              ☰
            </button>
          </div>
        </div>
      </nav>

      {/* SIDEBAR */}
      <div className={`fixed inset-0 z-50 ${isOpen ? "visible" : "invisible"}`}>
        <div
          onClick={closeSidebar}
          className={`absolute inset-0 bg-black/30 transition ${
            isOpen ? "opacity-100" : "opacity-0"
          }`}
        />
        <div
          className={`absolute right-0 top-0 h-full w-80 bg-white shadow-2xl transform transition-transform duration-300 ${
            isOpen ? "translate-x-0" : "translate-x-full"
          } flex flex-col`}
        >
          <div className="flex justify-between items-center px-6 py-4 border-b">
            <h2 className="text-base font-semibold text-gray-900">Menu</h2>
            <button
              onClick={closeSidebar}
              className="text-gray-500 hover:text-black"
            >
              ✕
            </button>
          </div>

          <div className="px-6 py-5 border-b">
            {user ? (
              <div
                onClick={handleProfile}
                className="flex items-center gap-3 cursor-pointer"
              >
                <div className="w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center font-medium">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {user.role === "talentprovider"
                      ? "Talent Provider"
                      : "Talent"}
                  </p>
                </div>
              </div>
            ) : (
              <button
                onClick={() => handleNavigate("/login")}
                className="w-full bg-gray-900 text-white py-2.5 rounded-lg text-sm"
              >
                Login
              </button>
            )}
          </div>

          <div className="flex flex-col px-4 py-5 text-sm gap-1">
            <button
              onClick={() => handleScroll("home")}
              className="text-left px-3 py-2 rounded-lg hover:bg-gray-100"
            >
              Home
            </button>
            <button
              onClick={() => handleScroll("featured")}
              className="text-left px-3 py-2 rounded-lg hover:bg-gray-100"
            >
              FeatureGems
            </button>
            <button
              onClick={() => handleScroll("how")}
              className="text-left px-3 py-2 rounded-lg hover:bg-gray-100"
            >
              How It Works
            </button>
          </div>

          {user && (
            <div className="mt-auto px-6 py-4 border-t">
              <button
                onClick={handleLogout}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-lg text-sm"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      <Outlet />
    </>
  );
};