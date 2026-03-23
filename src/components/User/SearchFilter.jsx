import React, { useEffect } from "react";

export const SearchFilter = ({
  talents,
  setFiltered,
  search,
  setSearch,
}) => {

  useEffect(() => {
    let data = [...talents];

    if (search) {
      data = data.filter((t) =>
        (
          (t.userId?.name || "") +
          (t.skills?.join(" ") || "") +
          (t.location?.city || "") +
          (t.location?.state || "") +
          (t.location?.country || "")
        )
          .toLowerCase()
          .includes(search.toLowerCase())
      );
    }

    setFiltered(data);
  }, [search, talents, setFiltered]);

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 mb-6 font-[Inter]">

      {/* 🔹 TITLE */}
      <p className="text-xs font-medium text-gray-400 tracking-wide mb-2">
        DISCOVER TALENT
      </p>

      {/* 🔹 HEADING */}
      <h2 className="text-xl font-semibold text-gray-900 leading-tight">
        Find the perfect talent
      </h2>

      {/* 🔹 SUBTEXT */}
      <p className="text-sm text-gray-500 mt-1 mb-5 leading-relaxed">
        Search by name, skills or location to connect with the best local professionals.
      </p>

      {/* 🔹 SEARCH INPUT */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search singers, dancers, photographers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 text-sm border border-gray-200 rounded-xl bg-gray-50 text-gray-800 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white transition"
        />

        {/* 🔍 ICON */}
        <span className="absolute left-3 top-3 text-gray-400 text-sm">
          🔍
        </span>
      </div>

    </div>
  );
};