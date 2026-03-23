import React from "react";
import { useNavigate } from "react-router-dom";

export const Hero = () => {
  const navigate = useNavigate();

  return (
    <div className="font-[Inter]">
      <section className="relative overflow-hidden py-20 px-6 min-h-[65vh] flex items-center bg-[#101f18]">

        {/* Subtle Glow */}
        <div className="absolute -top-32 -left-32 w-[260px] h-[260px] bg-amber-400/10 blur-[100px] rounded-full" />
        <div className="absolute bottom-[-120px] right-[-100px] w-[260px] h-[260px] bg-orange-400/10 blur-[120px] rounded-full" />

        {/* Grid (same as footer) */}
        <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] bg-[length:30px_30px]" />

        {/* Content */}
        <div className="max-w-3xl mx-auto text-center relative z-10">

          {/* Badge */}
          <div className="inline-block bg-amber-400/10 border border-amber-400/30 text-amber-400 px-4 py-1 rounded-full text-[10px] font-semibold tracking-widest mb-5">
            DISCOVER LOCAL TALENT
          </div>

          {/* Heading */}
          <h1 className="text-white text-3xl md:text-4xl font-semibold leading-tight mb-5 tracking-tight">
            Find Skilled People <br />
            for <span className="text-amber-400">Any Talent</span>
          </h1>

          {/* Subtext */}
          <p className="text-gray-400 text-sm max-w-md mx-auto mb-6 leading-relaxed">
            Connect with musicians, artists, coaches, and performers near you.
          </p>

          {/* Categories */}
          <p className="text-gray-500 text-[11px] tracking-wide">
            Music · Dance · Sports · Arts · Fitness · Photography
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex justify-center gap-3">
            <button
              onClick={() => navigate("/explore")}
              className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition"
            >
              Explore Talent
            </button>

            <button
              onClick={() => navigate("/login")}
              className="border border-white/10 text-gray-300 px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-white/5 transition"
            >
              Join Now
            </button>
          </div>

        </div>
      </section>
    </div>
  );
};