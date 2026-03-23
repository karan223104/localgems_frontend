import React from "react";

const STEPS = [
  {
    step: "01",
    title: "Create Your Profile",
    desc: "Sign up as a talent or user and set up your detailed profile.",
  },
  {
    step: "02",
    title: "Search & Discover",
    desc: "Find local talent by skill, location, rating, and availability.",
  },
  {
    step: "03",
    title: "Book & Connect",
    desc: "Book talent for events, projects or collaborations seamlessly.",
  },
  {
    step: "04",
    title: "Review & Grow",
    desc: "Leave reviews, build reputation, and grow your community.",
  },
];

export const HowItWorks = () => {
  return (
    <section className="relative overflow-hidden py-20 px-6 font-[Inter] bg-[#0b1210]">

      {/* 🔥 SAME HERO GRADIENT */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0b1210] via-[#101f18] to-[#0d1c16]" />

      {/* 🔥 Glow Effects */}
      <div className="absolute -top-20 -left-20 w-[280px] h-[280px] bg-amber-500/20 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-100px] right-[-80px] w-[300px] h-[300px] bg-orange-400/10 blur-[140px] rounded-full" />

      {/* 🔥 Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] bg-[length:30px_30px]" />

      {/* HEADER */}
      <div className="max-w-5xl mx-auto text-center mb-14 relative z-10">
        <h2 className="text-2xl md:text-3xl font-semibold text-white tracking-tight mb-3">
          How LocalGems Works
        </h2>

        <p className="text-gray-400 text-sm md:text-base">
          Simple steps to discover and connect with local talent
        </p>
      </div>

      {/* STEPS */}
      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-4 max-w-6xl mx-auto relative z-10">

        {STEPS.map((item, i) => (
          <div
            key={i}
            className="group bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 text-center
                       hover:border-amber-400/40 hover:-translate-y-1 hover:bg-white/10
                       transition-all duration-300"
          >

            {/* STEP NUMBER */}
            <div className="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center 
                            bg-amber-500/20 text-amber-400 font-semibold text-sm 
                            border border-amber-400/30 group-hover:scale-105 transition">
              {item.step}
            </div>

            {/* TITLE */}
            <h3 className="text-white text-sm font-semibold mb-2">
              {item.title}
            </h3>

            {/* DESC */}
            <p className="text-gray-400 text-xs leading-relaxed">
              {item.desc}
            </p>

            {/* HOVER LINE */}
            <div className="mt-4 h-[2px] w-0 bg-amber-400 group-hover:w-full transition-all duration-300 mx-auto rounded-full" />
          </div>
        ))}

      </div>
    </section>
  );
};