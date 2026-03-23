import React from "react";

const AdminSidebar = () => {
  return (
    <aside className="w-72 min-h-screen bg-white border-r border-gray-200 shadow-sm hidden md:flex flex-col">

      {/* Logo */}
      <div className="px-6 py-6 border-b border-gray-100">
        <h1 className="text-2xl font-bold tracking-tight">
          <span className="text-yellow-500">◆</span>
          Local<span className="text-yellow-600">Gems</span>
        </h1>
        <p className="text-xs text-gray-400 mt-1">Admin Dashboard</p>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 px-4 py-6 overflow-y-auto">

        {/* Section: Overview */}
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-3">
          Overview
        </p>

        <div className="space-y-1 mb-6">
          <div className="flex items-center px-4 py-2.5 rounded-lg bg-yellow-50 text-yellow-600 font-medium border-l-4 border-yellow-500 cursor-pointer">
            Dashboard
          </div>

          <div className="flex items-center px-4 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-yellow-600 hover:border-l-4 hover:border-yellow-400 transition-all cursor-pointer">
            Analytics
          </div>
        </div>

        {/* Section: Management */}
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-3">
          Management
        </p>

        <div className="space-y-1 mb-6">
          <div className="flex items-center px-4 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-yellow-600 hover:border-l-4 hover:border-yellow-400 transition-all cursor-pointer">
            Users
          </div>

          <div className="flex items-center px-4 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-yellow-600 hover:border-l-4 hover:border-yellow-400 transition-all cursor-pointer">
            Talents
          </div>

          <div className="flex items-center px-4 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-yellow-600 hover:border-l-4 hover:border-yellow-400 transition-all cursor-pointer">
            Bookings
          </div>

          <div className="flex items-center px-4 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-yellow-600 hover:border-l-4 hover:border-yellow-400 transition-all cursor-pointer">
            Reviews
          </div>

          <div className="flex items-center px-4 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-yellow-600 hover:border-l-4 hover:border-yellow-400 transition-all cursor-pointer">
            Categories
          </div>
        </div>

        {/* Section: Settings */}
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-3">
          Settings
        </p>

        <div className="space-y-1">
          <div className="flex items-center px-4 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-yellow-600 hover:border-l-4 hover:border-yellow-400 transition-all cursor-pointer">
            Platform Settings
          </div>

          <div className="flex items-center px-4 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-yellow-600 hover:border-l-4 hover:border-yellow-400 transition-all cursor-pointer">
            Admin Profile
          </div>
        </div>

      </div>

      {/* Bottom Logout */}
      <div className="px-6 py-5 border-t border-gray-100">
        <button className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-2.5 rounded-lg font-medium hover:opacity-90 transition">
          Logout
        </button>
      </div>

    </aside>
  );
};

export default AdminSidebar;