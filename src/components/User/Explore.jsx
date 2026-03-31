import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { SearchFilter } from "./SearchFilter";
import { Footer } from "../../pages/Footer";

export const Explore = () => {
  const navigate = useNavigate();

  const [talents, setTalents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Helper to render stars
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

  // Fetch talents + their average ratings
  useEffect(() => {
    const fetchTalents = async () => {
      try {
        const res = await axios.get("/talent/all");

        // For each talent, fetch reviews to get average rating
        const talentsWithRatings = await Promise.all(
          res.data.data.map(async (talent) => {
            try {
              const reviewRes = await axios.get(
                `/review/received/${talent.userId._id}`
              );
              return {
                ...talent,
                averageRating: reviewRes.data.averageRating || 0,
              };
            } catch {
              return { ...talent, averageRating: 0 };
            }
          })
        );

        setTalents(talentsWithRatings);
        setFiltered(talentsWithRatings);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTalents();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-[Inter]">
      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* TITLE */}
        <div className="mb-8">
          <p className="text-xs font-medium text-gray-400 tracking-wide mb-2">
            EXPLORE TALENT
          </p>
          <h1 className="text-3xl font-semibold text-gray-900">
            Discover Local Talent
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Connect with skilled professionals in your area
          </p>
        </div>

        {/* SEARCH */}
        <SearchFilter
          talents={talents}
          setFiltered={setFiltered}
          search={search}
          setSearch={setSearch}
        />

        {/* CARD GRID */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400 text-sm">
            No talent found
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {filtered.map((talent) => (
              <div
                key={talent._id}
                onClick={() => navigate(`/talent/${talent._id}`)}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer p-5 group"
              >
                {/* TOP (Avatar + Name) */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-900 to-gray-700 text-white flex items-center justify-center text-lg font-semibold shadow-md group-hover:scale-105 transition">
                    {talent.userId?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-sm tracking-tight">
                      {talent.userId?.name}
                    </h3>
                    <p className="text-xs text-orange-400 font-medium mt-0.5">
                      {talent.skills?.[0]}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] px-2.5 py-1 rounded-full font-semibold ${
                      talent.availability
                        ? "bg-green-100 text-green-600"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {talent.availability ? "Available" : "Unavailable"}
                  </span>
                </div>

                <div className="border-t border-gray-100 my-3" />

                {/* INFO */}
                <div className="flex justify-between items-center text-xs">
                  <div className="text-gray-400">
                    📍 {talent.location?.city}, {talent.location?.state}
                  </div>
                  <div className="flex items-center gap-1 text-gray-700 font-semibold">
                    {renderStars(Math.round(talent.averageRating))}
                    <span className="ml-1">{talent.averageRating?.toFixed(1) || "—"}</span>
                  </div>
                </div>

                {/* BOTTOM */}
                <div className="mt-4 flex justify-between items-center">
                  <div className="flex gap-1 flex-wrap">
                    {talent.skills?.slice(0, 2).map((s) => (
                      <span
                        key={s}
                        className="text-[10px] px-2.5 py-1 bg-orange-50 text-orange-500 rounded-full border border-orange-100 font-medium"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                  <span className="text-[11px] text-gray-400 group-hover:text-orange-400 font-medium transition">
                    View →
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};