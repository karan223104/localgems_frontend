import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Footer } from "../../pages/Footer";

export const Event = () => {
  const navigate = useNavigate();
  const [user] = useState(() => JSON.parse(localStorage.getItem("user") || "null"));
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const [form, setForm] = useState({
    title: "",
    description: "",
    skillRequired: "",
    eventDate: "",
    budget: "",
    city: "",
    state: "",
    country: "",
    status: "open",
  });

  const isTalentProvider = user && user.role === "talentprovider";

  // Fetch events from backend (with populated talentproviderId)
  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/event"); // backend should populate talentproviderId
      setEvents(res.data.data || []);
    } catch {
      toast.error("Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!user?._id) {
      toast.error("Please login first");
      navigate("/login");
      return;
    }

    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }

    setSaving(true);
    const payload = {
      talentproviderId: user._id,
      title: form.title,
      description: form.description,
      skillRequired: form.skillRequired,
      eventDate: form.eventDate || undefined,
      budget: Number(form.budget) || 0,
      location: { city: form.city, state: form.state, country: form.country },
      status: form.status,
    };

    try {
      await axios.post("/event", payload);
      toast.success("Event created successfully!");
      setShowModal(false);
      setForm({
        title: "",
        description: "",
        skillRequired: "",
        eventDate: "",
        budget: "",
        city: "",
        state: "",
        country: "",
        status: "open",
      });
      fetchEvents();
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const statusColors = {
    open: "bg-green-50 text-green-600 border-green-200",
    closed: "bg-red-50 text-red-500 border-red-200",
    completed: "bg-blue-50 text-blue-600 border-blue-200",
    cancelled: "bg-gray-100 text-gray-400 border-gray-200",
  };

  const statusDot = {
    open: "bg-green-500",
    closed: "bg-red-400",
    completed: "bg-blue-500",
    cancelled: "bg-gray-300",
  };

  // Filter events by search & status
  const filtered = events.filter((e) => {
    const matchSearch =
      e.title?.toLowerCase().includes(search.toLowerCase()) ||
      e.skillRequired?.toLowerCase().includes(search.toLowerCase()) ||
      e.location?.city?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || e.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const inputCls =
    "w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-900 placeholder:text-gray-300 outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition";
  const labelCls = "block text-xs font-medium text-gray-500 mb-1.5";
  const sectionTitle =
    "text-[11px] font-semibold text-amber-500 uppercase tracking-widest pb-2.5 border-b border-gray-100 mb-4";

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Events</h1>
            <p className="text-sm text-gray-400 mt-1">Discover events and opportunities</p>
          </div>
          {isTalentProvider && (
            <button
              onClick={() => setShowModal(true)}
              className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-colors flex items-center gap-2"
            >
              + Post Event
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-900 placeholder:text-gray-300 outline-none focus:ring-2 focus:ring-amber-400 transition"
            placeholder="Search by title, skill, or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="flex gap-2">
            {["all", "open", "closed", "completed", "cancelled"].map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold capitalize border transition-colors ${
                  filterStatus === s
                    ? "bg-amber-500 text-white border-amber-500"
                    : "bg-white text-gray-500 border-gray-200 hover:border-amber-300"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-10 h-10 border-4 border-gray-200 border-t-amber-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm text-center py-24 px-6">
            <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-3xl mx-auto mb-5">
              🎪
            </div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight mb-2">No events found</h2>
            <p className="text-sm text-gray-400 max-w-xs mx-auto">
              {search || filterStatus !== "all"
                ? "Try adjusting your filters."
                : "No events have been posted yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map((event) => {
              const isOwner = user?._id && event.talentproviderId?._id === user._id;
              const organizer = event.talentproviderId;

              return (
                <div
                  key={event._id}
                  onClick={() => navigate(`/event/${event._id}`)}
                  className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-amber-200 transition-all cursor-pointer flex flex-col justify-between"
                >
                  {/* Event Header */}
                  <div className="mb-3 flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border capitalize ${
                        statusColors[event.status] || statusColors.open
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          statusDot[event.status] || statusDot.open
                        }`}
                      />
                      {event.status}
                    </span>
                    {event.skillRequired && (
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                        {event.skillRequired}
                      </span>
                    )}
                  </div>

                  {/* Event Title & Description */}
                  <h2 className="text-lg font-bold text-gray-900 line-clamp-2 mb-1">
                    {event.title}
                  </h2>
                  {event.description && (
                    <p className="text-xs text-gray-500 mb-3 line-clamp-3">{event.description}</p>
                  )}

                  {/* Event Details */}
                  <div className="flex flex-wrap gap-3 text-gray-500 text-xs mb-3">
                    {event.location?.city && (
                      <span className="flex items-center gap-1">📍 {[
                        event.location.city,
                        event.location.state,
                        event.location.country
                      ].filter(Boolean).join(", ")}</span>
                    )}
                    {event.eventDate && (
                      <span className="flex items-center gap-1">📅 {new Date(event.eventDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                    )}
                    {event.budget > 0 && (
                      <span className="flex items-center gap-1">💰 ₹{event.budget.toLocaleString()}</span>
                    )}
                  </div>

                  {/* Organizer */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center text-white text-xs font-bold">
                        {organizer?.name?.charAt(0).toUpperCase() || "?"}
                      </div>
                      <div className="text-xs">
                        <p className="font-semibold text-gray-700">
                          {organizer?.name || "Unknown Organizer"}
                        </p>
                        <p className="text-gray-400">
                          {isOwner ? "Organizer (You)" : "Organizer"}
                        </p>
                      </div>
                    </div>
                    <span className="text-gray-300 group-hover:text-amber-400 text-lg transition-colors">→</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Event Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-base font-bold text-gray-900 tracking-tight">Post an Event</h2>
                <p className="text-xs text-gray-400 mt-0.5">Fill in the event details</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 text-sm transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto px-6 py-5 flex flex-col gap-5 flex-1">
              {/* Event Info */}
              <div>
                <p className={sectionTitle}>Event Info</p>
                <div className="flex flex-col gap-3">
                  <div>
                    <label className={labelCls}>Event Title *</label>
                    <input
                      className={inputCls}
                      placeholder="e.g. Live Music Night"
                      value={form.title}
                      onChange={(e) => set("title", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Description</label>
                    <textarea
                      className={inputCls + " resize-none"}
                      rows={3}
                      placeholder="Describe the event, what you're looking for..."
                      value={form.description}
                      onChange={(e) => set("description", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Skill Required</label>
                    <input
                      className={inputCls}
                      placeholder="e.g. Guitar, Photography, Dancing..."
                      value={form.skillRequired}
                      onChange={(e) => set("skillRequired", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Logistics */}
              <div>
                <p className={sectionTitle}>Logistics</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Event Date</label>
                    <input
                      className={inputCls}
                      type="date"
                      value={form.eventDate}
                      onChange={(e) => set("eventDate", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Budget (₹)</label>
                    <input
                      className={inputCls}
                      type="number"
                      min="0"
                      placeholder="5000"
                      value={form.budget}
                      onChange={(e) => set("budget", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Status</label>
                    <select
                      className={inputCls}
                      value={form.status}
                      onChange={(e) => set("status", e.target.value)}
                    >
                      <option value="open">Open</option>
                      <option value="closed">Closed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div>
                <p className={sectionTitle}>Location</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    ["City", "city", "Mumbai"],
                    ["State", "state", "Maharashtra"],
                    ["Country", "country", "India"],
                  ].map(([label, key, placeholder]) => (
                    <div key={key}>
                      <label className={labelCls}>{label}</label>
                      <input
                        className={inputCls}
                        placeholder={placeholder}
                        value={form[key]}
                        onChange={(e) => set(key, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                {saving ? "Posting..." : "Post Event"}
              </button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
};