import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

export const TalentDetails = () => {
  const { id } = useParams();

  const [talent, setTalent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTalent = async () => {
      try {
        const res = await axios.get(`/talent/${id}`);
        setTalent(res.data.data);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTalent();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!talent) {
    return <div className="p-10 text-center text-gray-400">Profile not found</div>;
  }

  const initials = talent.userId?.name?.charAt(0).toUpperCase();

  const expertiseBadge = {
    Beginner: "bg-gray-100 text-gray-500 border-gray-200",
    Intermediate: "bg-amber-50 text-amber-600 border-amber-200",
    Expert: "bg-green-50 text-green-600 border-green-200",
  };

  return (
    <div className="min-h-screen bg-gray-50 font-[Inter]">
      <div className="max-w-3xl mx-auto px-4 py-10">

        {/* BACK */}
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-gray-400 hover:text-amber-500 mb-8"
        >
          ← Back
        </button>

        {/* ── HERO CARD ── */}
        <div className="bg-gray-900 rounded-2xl p-6 flex items-start gap-5 relative overflow-hidden shadow-lg">

          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />

          <div className="w-14 h-14 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold text-xl">
            {initials}
          </div>

          <div className="flex-1">
            <h1 className="text-white font-bold text-lg">
              {talent.userId?.name}
            </h1>

            <p className="text-gray-400 text-xs mt-0.5">
              {talent.userId?.email}
            </p>

            <div className="flex flex-wrap gap-2 mt-3">
              <span
                className={`text-[11px] font-semibold px-3 py-1 rounded-full border ${
                  expertiseBadge[talent.expertiseLevel] || expertiseBadge.Beginner
                }`}
              >
                {talent.expertiseLevel || "Beginner"}
              </span>

              <span
                className={`text-[11px] font-semibold px-3 py-1 rounded-full border ${
                  talent.availability
                    ? "bg-green-900/30 text-green-400 border-green-500/20"
                    : "bg-white/5 text-gray-400 border-white/10"
                }`}
              >
                {talent.availability ? "● Available" : "○ Unavailable"}
              </span>

              {talent.location?.city && (
                <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-white/5 text-gray-400 border border-white/10">
                  📍{" "}
                  {[talent.location.city, talent.location.state, talent.location.country]
                    .filter(Boolean)
                    .join(", ")}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── STATS ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
          {[
            { label: "Rating", value: talent.ratingAverage?.toFixed(1) || "—" },
            { label: "Reviews", value: talent.totalReviews || 0 },
            { label: "Experience", value: `${talent.experience || 0} yrs` },
            {
              label: "Hourly Rate",
              value: talent.hourlyRate ? `₹${talent.hourlyRate}` : "—",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white border border-gray-100 rounded-2xl p-4 text-center shadow-sm"
            >
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                {s.label}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {/* ── SKILLS ── */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm mt-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
            Skills
          </p>

          {talent.skills?.length ? (
            <div className="flex flex-wrap gap-2">
              {talent.skills.map((s) => (
                <span
                  key={s}
                  className="text-xs font-semibold px-3 py-1.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-full"
                >
                  {s}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-300">No skills added</p>
          )}
        </div>

        {/* ── PROFESSIONAL + PORTFOLIO ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">

          {/* PROFESSIONAL */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
              Professional
            </p>

            <div className="flex flex-col gap-2.5">
              {[
                { k: "Expertise", v: talent.expertiseLevel },
                { k: "Experience", v: `${talent.experience || 0} years` },
                { k: "Hourly Rate", v: talent.hourlyRate ? `₹${talent.hourlyRate}/hr` : "—" },
                { k: "Email", v: talent.userId?.email },
              ].map((row) => (
                <div key={row.k} className="flex justify-between text-xs">
                  <span className="text-gray-400">{row.k}</span>
                  <span className="font-semibold text-gray-800">{row.v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* PORTFOLIO */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
              Portfolio
            </p>

            {talent.portfolio?.length ? (
              <div className="flex flex-col gap-2">
                {talent.portfolio.map((u) => (
                  <a
                    key={u}
                    href={u}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-amber-600 bg-amber-50 border border-amber-100 px-3 py-2 rounded-lg"
                  >
                    🔗 {u}
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-300">No portfolio links</p>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};