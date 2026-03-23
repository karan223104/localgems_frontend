import React from "react";
import { useNavigate } from "react-router-dom";

export const CTA = () => {
  const navigate = useNavigate();

  return (
    <section className="relative bg-white py-20 px-6 text-center font-[Inter] overflow-hidden">

      {/* 🔥 FeatureGems Style Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.10),transparent_60%)]" />

      {/* Content */}
      <div className="max-w-3xl mx-auto relative z-10">

        {/* TITLE */}
        <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 tracking-tight mb-3">
          Ready to Showcase Your Talent?
        </h2>

        {/* SUBTEXT */}
        <p className="text-gray-500 mb-8 text-sm md:text-base">
          Join LocalGems and reach thousands of people.
        </p>

        {/* BUTTONS */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">

          {/* PRIMARY */}
          <button
            onClick={() => navigate("/signup")}
            className="bg-amber-500 hover:bg-amber-600 text-white px-7 py-3 rounded-xl text-sm font-semibold shadow-sm hover:shadow-md transition-all duration-300"
          >
            Join as Talent
          </button>

          {/* SECONDARY */}
          <button
            onClick={() => navigate("/explore")}
            className="border border-amber-500 text-amber-500 px-7 py-3 rounded-xl text-sm font-semibold 
                       hover:bg-amber-50 transition-all duration-300"
          >
            Explore Talent
          </button>

        </div>

      </div>
    </section>
  );
};