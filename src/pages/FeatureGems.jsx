import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export const FeatureGems = () => {
  const navigate = useNavigate();

  const [talents, setTalents] = useState([]);

  // Render stars helper
  const renderStars = (value, size = "text-xs") => {
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={`${size} ${i < value ? "text-amber-400" : "text-gray-200"}`}
      >
        ★
      </span>
    ));
  };

  // Fetch latest 5 talents with ratings
  useEffect(() => {
    const fetchTalents = async () => {
      try {
        const res = await axios.get("/talent/all");
        const latest = res.data.data.slice(-5).reverse();

        const talentsWithRatings = await Promise.all(
          latest.map(async (t) => {
            try {
              const reviewRes = await axios.get(`/review/received/${t.userId._id}`);
              return { ...t, ratingAverage: reviewRes.data.averageRating || 0 };
            } catch {
              return { ...t, ratingAverage: 0 };
            }
          })
        );

        setTalents(talentsWithRatings);
      } catch (err) {
        console.log(err);
      }
    };

    fetchTalents();
  }, []);

  return (
    <section className="relative bg-white py-16 px-4 sm:px-6 lg:px-8 font-[Inter] overflow-hidden">

      {/* 🔥 subtle glow */}
      <div className="absolute -top-24 left-0 w-[260px] h-[260px] bg-amber-400/10 blur-[100px] rounded-full" />

      {/* 🔥 grid pattern */}
      <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_1px_1px,black_1px,transparent_0)] bg-[length:28px_28px]" />

      <div className="max-w-7xl mx-auto relative z-10">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 mb-10">
          <div>
            <p className="text-[10px] font-medium text-gray-400 tracking-widest mb-2">
              FEATURED TALENT
            </p>

            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 tracking-tight">
              Featured Gems ✨
            </h2>

            <p className="text-gray-500 mt-1 text-sm">
              Discover top-rated professionals near you
            </p>
          </div>

          <button
            onClick={() => navigate("/explore")}
            className="border border-amber-500 text-amber-500 px-5 py-2 rounded-xl text-sm font-medium hover:bg-amber-50 transition"
          >
            View All →
          </button>
        </div>

        {/* CARDS */}
        <div className="flex gap-5 overflow-x-auto pb-4 -mx-4 px-4">
          {talents.length === 0 ? (
            <div className="text-gray-400 text-sm px-4">
              No talent available
            </div>
          ) : (
            talents.map((t) => (
              <div
                key={t._id}
                onClick={() => navigate(`/talent/${t._id}`)}
                className="min-w-[240px] bg-white rounded-2xl border border-gray-100 hover:border-amber-200 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer p-4"
              >

                {/* TOP */}
                <div className="flex items-center gap-3 mb-3">

                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-semibold">
                    {t.userId?.name?.charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      {t.userId?.name}
                    </h3>

                    <p className="text-[11px] text-amber-500">
                      {t.skills?.[0]}
                    </p>
                  </div>
                </div>

                {/* INFO */}
                <div className="flex justify-between items-center text-[11px] text-gray-400 mb-2">
                  <span>
                    📍 {t.location?.city}, {t.location?.state}
                  </span>

                  <div className="flex items-center gap-1 text-gray-700 font-medium">
                    <div>{renderStars(Math.round(t.ratingAverage))}</div>
                    <span className="text-xs">{t.ratingAverage?.toFixed(1) || "—"}</span>
                  </div>
                </div>

                {/* STATUS */}
                <div className="mt-3">
                  <span
                    className={`text-[10px] px-2.5 py-1 rounded-full font-medium
                    ${t.availability ? "bg-green-100 text-green-600" : "bg-gray-200 text-gray-500"}`}
                  >
                    {t.availability ? "Available" : "Unavailable"}
                  </span>
                </div>

              </div>
            ))
          )}
        </div>

      </div>
    </section>
  );
};