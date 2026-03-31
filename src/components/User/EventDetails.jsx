import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Footer } from "../../pages/Footer";

export const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user] = useState(() => JSON.parse(localStorage.getItem("user") || "null"));
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  // Applications (for talent provider)
  const [applications, setApplications] = useState([]);
  const [appsLoading, setAppsLoading] = useState(false);

  // Apply state (for talent)
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  // Edit modal (for talent provider)
  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});

  const isTalentProvider = user?.role === "talentprovider";
  const isTalent = user?.role === "talent";
  const isOwner = isTalentProvider && event?.talentproviderId?._id === user?._id;

  // Fetch event
  useEffect(() => {
    const fetchEvent = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/event/${id}`);
        setEvent(res.data.data);

        // Check if talent already applied
        if (user?.role === "talent") {
          const appRes = await axios.get(`/eventdetails/event/${id}`);
          const applied = appRes.data.data.some(
            (a) => a.talentId?.userId?._id === user._id || a.talentId?.userId === user._id
          );
          setHasApplied(applied);
        }
      } catch {
        toast.error("Event not found");
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id, user]);

  // Fetch applications (only if owner)
  const fetchApplications = async () => {
    setAppsLoading(true);
    try {
      const res = await axios.get(`/eventdetails/event/${id}`);
      setApplications(res.data.data || []);
    } catch {
      setApplications([]);
    } finally {
      setAppsLoading(false);
    }
  };

  useEffect(() => {
    if (event && isOwner) fetchApplications();
  }, [event, isOwner]);

  const handleApply = async () => {
    if (!user?._id) {
      toast.error("Please log in first");
      return;
    }

    try {
      const talentRes = await axios.get("/talent/all");
      const myProfile = talentRes.data.data.find(
        (t) => t.userId?._id === user._id || t.userId === user._id
      );
      if (!myProfile) {
        toast.error("Please create your talent profile first");
        return;
      }

      setApplying(true);
      await axios.post("/eventdetails", { eventId: id, talentId: myProfile._id });
      setHasApplied(true);
      toast.success("Applied successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to apply");
    } finally {
      setApplying(false);
    }
  };

  const handleUpdateStatus = async (applicationId, status) => {
    try {
      await axios.put(`/eventdetails/${applicationId}/status`, { status });
      toast.success(`Application ${status}`);
      fetchApplications();
    } catch {
      toast.error("Failed to update status");
    }
  };

  // Toast-based delete
  const handleDeleteEvent = () => {
    toast.info(
      <div className="flex flex-col gap-2">
        <span>Are you sure you want to delete this event?</span>
        <div className="flex gap-2 mt-1">
          <button
            onClick={async () => {
              try {
                await axios.delete(`/event/${id}`);
                toast.dismiss();
                toast.success("Event deleted");
                navigate("/events");
              } catch {
                toast.error("Failed to delete event");
              }
            }}
            className="px-3 py-1 bg-red-500 text-white rounded-full text-xs font-medium"
          >
            Delete
          </button>
          <button
            onClick={() => toast.dismiss()}
            className="px-3 py-1 bg-gray-300 text-gray-800 rounded-full text-xs font-medium"
          >
            Cancel
          </button>
        </div>
      </div>,
      { autoClose: false, closeOnClick: false }
    );
  };

  // Edit modal setup
  const openEditModal = () => {
    setForm({
      title: event.title || "",
      description: event.description || "",
      skillRequired: event.skillRequired || "",
      eventDate: event.eventDate ? event.eventDate.split("T")[0] : "",
      budget: event.budget || "",
      city: event.location?.city || "",
      state: event.location?.state || "",
      country: event.location?.country || "",
      status: event.status || "open",
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      const updatedEvent = {
        title: form.title,
        description: form.description,
        skillRequired: form.skillRequired,
        eventDate: form.eventDate,
        budget: form.budget,
        location: {
          city: form.city,
          state: form.state,
          country: form.country,
        },
        status: form.status,
      };
      await axios.put(`/event/${id}`, updatedEvent);
      toast.success("Event updated successfully");
      setEvent((prev) => ({ ...prev, ...updatedEvent }));
      setShowEditModal(false);
    } catch {
      toast.error("Failed to update event");
    } finally {
      setSaving(false);
    }
  };

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

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

  const appStatusColors = {
    pending: "bg-amber-50 text-amber-600 border-amber-200",
    accepted: "bg-green-50 text-green-600 border-green-200",
    rejected: "bg-red-50 text-red-500 border-red-200",
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400 text-lg font-medium">
        Event not found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-4xl mx-auto px-4 space-y-6">
        {/* Back Button */}
        <button
          onClick={() => window.history.back()}
          className="text-xs font-semibold uppercase tracking-widest text-gray-400 hover:text-amber-500 transition-colors"
        >
          ← Back
        </button>

        {/* Event Card */}
        <div className="bg-gray-900 rounded-2xl p-6 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-72 h-72 bg-amber-400/10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4 pointer-events-none" />
          <div className="flex flex-col sm:flex-row justify-between gap-4 relative">
            <div className="flex-1">
              <div className="flex flex-wrap gap-2 mb-3">
                <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full border capitalize ${statusColors[event.status]}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusDot[event.status]}`} />
                  {event.status}
                </span>
                {event.skillRequired && (
                  <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    {event.skillRequired}
                  </span>
                )}
              </div>
              <h1 className="text-white font-bold text-2xl">{event.title}</h1>
              {event.description && <p className="text-gray-400 mt-2">{event.description}</p>}

              <div className="flex flex-wrap gap-3 mt-4 text-xs text-gray-300">
                {event.location?.city && <span>📍 {[event.location.city, event.location.state, event.location.country].filter(Boolean).join(", ")}</span>}
                {event.eventDate && <span>📅 {new Date(event.eventDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>}
                {event.budget > 0 && <span>💰 ₹{event.budget.toLocaleString()}</span>}
              </div>
            </div>

            {/* Owner Actions */}
            {isOwner && (
              <div className="flex gap-2 mt-4 sm:mt-0">
                <button
                  onClick={openEditModal}
                  className="px-3 py-0.5 bg-amber-500 text-white rounded-full text-xs font-medium hover:bg-amber-600 transition leading-tight"
                >
                  Edit
                </button>
                <button
                  onClick={handleDeleteEvent}
                  className="px-3 py-0.5 bg-red-500 text-white rounded-full text-xs font-medium hover:bg-red-600 transition leading-tight"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Organizer & Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-white font-bold">{event.talentproviderId?.name?.charAt(0) || "?"}</div>
            <div>
              <p className="text-sm font-semibold text-gray-800">{event.talentproviderId?.name || "Unknown"}</p>
              <p className="text-xs text-gray-400">{event.talentproviderId?.email || "—"}</p>
            </div>
          </div>

          {event.budget > 0 && (
            <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Budget</p>
              <p className="text-lg font-bold text-gray-900">₹{event.budget.toLocaleString()}</p>
            </div>
          )}

          {event.eventDate && (
            <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Event Date</p>
              <p className="text-base font-bold text-gray-900">{new Date(event.eventDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
              <p className="text-xs text-gray-400">{new Date(event.eventDate).toLocaleDateString("en-IN", { year: "numeric" })}</p>
            </div>
          )}
        </div>

        {/* Apply Section */}
        {event.status === "open" && isTalent && (
          <div className="bg-white rounded-2xl p-5 shadow-sm mt-4">
            <p className="text-sm text-gray-500 mb-3 font-semibold">Apply for this Event</p>
            <button
              onClick={handleApply}
              disabled={hasApplied || applying}
              className={`w-full py-2.5 rounded-xl text-white font-semibold transition ${hasApplied ? "bg-green-500 cursor-not-allowed" : "bg-amber-500 hover:bg-amber-600"}`}
            >
              {hasApplied ? "Applied" : applying ? "Applying..." : "Apply Now"}
            </button>
          </div>
        )}

        {/* Applications for owner */}
        {isOwner && (
          <div className="bg-white rounded-2xl p-5 shadow-sm mt-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold uppercase text-amber-500">Applications</p>
              <span className="text-xs text-gray-400">{applications.length} total</span>
            </div>

            {appsLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-4 border-gray-200 border-t-amber-500 rounded-full animate-spin" />
              </div>
            ) : applications.length === 0 ? (
              <p className="text-xs text-gray-300 text-center py-6">No applications yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {applications.map((app) => (
                  <div key={app._id} className="border border-gray-100 rounded-xl p-4 flex flex-col sm:flex-row justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold">{app.talentId?.userId?.name?.charAt(0) || "T"}</div>
                      <div>
                        <p className="text-sm font-semibold">{app.talentId?.userId?.name || "Talent"}</p>
                        <p className="text-xs text-gray-400">{app.talentId?.userId?.email || "—"}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border capitalize ${appStatusColors[app.status] || appStatusColors.pending}`}>
                        {app.status}
                      </span>
                      {app.status === "pending" && (
                        <div className="flex gap-1">
                          <button onClick={() => handleUpdateStatus(app._id, "accepted")} className="text-[11px] px-3 py-1 rounded-lg bg-green-50 text-green-600 border border-green-200 hover:bg-green-100 transition">Accept</button>
                          <button onClick={() => handleUpdateStatus(app._id, "rejected")} className="text-[11px] px-3 py-1 rounded-lg bg-red-50 text-red-500 border border-red-200 hover:bg-red-100 transition">Reject</button>
                        </div>
                      )}
                      <p className="text-[10px] text-gray-300 mt-1">Applied {new Date(app.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Closed notice */}
        {isTalent && event.status !== "open" && (
          <div className="bg-gray-100 border border-gray-200 rounded-2xl p-5 mt-4 text-center">
            <p className="text-sm font-semibold text-gray-500 capitalize">This event is {event.status} and cannot be applied for.</p>
          </div>
        )}

      </div>

      {/* Edit Event Modal Form */}
      {showEditModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setShowEditModal(false)}
        >
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-base font-bold text-gray-900 tracking-tight">Edit Event</h2>
                <p className="text-xs text-gray-400 mt-0.5">Update the event details</p>
              </div>
              <button onClick={() => setShowEditModal(false)} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 text-sm transition-colors">✕</button>
            </div>
            {/* Body */}
            <div className="overflow-y-auto px-6 py-5 flex flex-col gap-5 flex-1">
              {/* Event Info */}
              <div>
                <p className="text-[11px] font-semibold text-amber-500 uppercase tracking-widest pb-2.5 border-b border-gray-100 mb-4">Event Info</p>
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Event Title *</label>
                    <input className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-900 placeholder:text-gray-300 outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition" placeholder="e.g. Live Music Night" value={form.title} onChange={(e) => set("title", e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Description</label>
                    <textarea className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-900 placeholder:text-gray-300 outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent resize-none transition" rows={3} placeholder="Describe the event, what you're looking for..." value={form.description} onChange={(e) => set("description", e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Skill Required</label>
                    <input className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-900 placeholder:text-gray-300 outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition" placeholder="e.g. Guitar, Photography, Dancing..." value={form.skillRequired} onChange={(e) => set("skillRequired", e.target.value)} />
                  </div>
                </div>
              </div>
              {/* Logistics */}
              <div>
                <p className="text-[11px] font-semibold text-amber-500 uppercase tracking-widest pb-2.5 border-b border-gray-100 mb-4">Logistics</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Event Date</label>
                    <input className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-900 placeholder:text-gray-300 outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition" type="date" value={form.eventDate} onChange={(e) => set("eventDate", e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Budget (₹)</label>
                    <input className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-900 placeholder:text-gray-300 outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition" type="number" min="0" placeholder="5000" value={form.budget} onChange={(e) => set("budget", e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Status</label>
                    <select className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-900 outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition" value={form.status} onChange={(e) => set("status", e.target.value)}>
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
                <p className="text-[11px] font-semibold text-amber-500 uppercase tracking-widest pb-2.5 border-b border-gray-100 mb-4">Location</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    ["City", "city", "Mumbai"],
                    ["State", "state", "Maharashtra"],
                    ["Country", "country", "India"],
                  ].map(([label, key, placeholder]) => (
                    <div key={key}>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label>
                      <input className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-900 placeholder:text-gray-300 outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition" placeholder={placeholder} value={form[key]} onChange={(e) => set(key, e.target.value)} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={() => setShowEditModal(false)} className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={handleSaveEdit} disabled={saving} className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors">
                {saving ? "Saving..." : "Save Changes"}
              </button>
              
            </div>
            
          </div>
          
        </div>
        
      )}
      
    </div>
  );
};