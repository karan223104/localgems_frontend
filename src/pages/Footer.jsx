import React from "react";

export const Footer = () => {
  return (
    <footer className="relative bg-[#101f18] text-gray-400 py-14 px-6 font-[Inter] overflow-hidden">

      {/* 🔥 Subtle Grid */}
      <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] bg-[length:30px_30px]" />

      <div className="max-w-6xl mx-auto grid gap-10 sm:grid-cols-2 md:grid-cols-4 relative z-10">

        <div>
          <h1 className="text-xl font-bold text-white">
            Local<span className="text-orange-400">Gems</span>
          </h1>
          <p className="text-sm mt-3 text-gray-400 leading-relaxed">
            Discover and connect with local talent.
          </p>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-3">Platform</h3>
          <p className="text-sm hover:text-orange-400 cursor-pointer transition">
            Explore Talent
          </p>
          <p className="text-sm hover:text-orange-400 cursor-pointer transition">
            Categories
          </p>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-3">For Talent</h3>
          <p className="text-sm hover:text-orange-400 cursor-pointer transition">
            Join
          </p>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-3">Company</h3>
          <p className="text-sm hover:text-orange-400 cursor-pointer transition">
            About
          </p>
          <p className="text-sm hover:text-orange-400 cursor-pointer transition">
            Contact
          </p>
        </div>

      </div>

      <div className="text-center text-xs mt-12 border-t border-white/10 pt-5 text-gray-500 relative z-10">
        © 2026 LocalGems
      </div>

    </footer>
  );
};