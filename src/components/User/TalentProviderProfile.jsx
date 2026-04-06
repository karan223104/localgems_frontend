import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { Footer } from "../../pages/Footer";

export const TalentProviderProfile = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("user") || "null"));
  const [profile, setProfile] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    profilePic: "", organizationName: "", providerType: "Individual",
    experience: "", description: "", phone: "", city: "", state: "",
    country: "", portfolio: "", budgetMin: "", budgetMax: "", availability: true,
  });

  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);

  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [showAllEventsModal, setShowAllEventsModal] = useState(false); // ← NEW

  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [showAllBookingsModal, setShowAllBookingsModal] = useState(false);
  const [modalBookingFilter, setModalBookingFilter] = useState("all");

  // ── PAYMENT HISTORY ──
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [showAllPaymentsModal, setShowAllPaymentsModal] = useState(false);
  const [modalPaymentFilter, setModalPaymentFilter] = useState("all");

  useEffect(() => { if (!loading && !user?._id) navigate("/"); }, [user?._id, loading]);

  useEffect(() => {
    const syncUser = () => {
      const updated = JSON.parse(localStorage.getItem("user") || "null");
      setUser(updated);
      if (!updated) { setProfile(null); setShowModal(false); navigate("/"); }
    };
    window.addEventListener("authChange", syncUser);
    return () => window.removeEventListener("authChange", syncUser);
  }, []);

  useEffect(() => {
    if (!user?._id) { setLoading(false); return; }
    let cancelled = false;
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await axios.get("/talentprovider/all");
        if (!cancelled) {
          const mine = res.data.data.find((p) => p.userId?._id === user._id || p.userId === user._id);
          setProfile(mine || null);
        }
      } catch {} finally { if (!cancelled) setLoading(false); }
    };
    fetchProfile();
    return () => { cancelled = true; };
  }, [user?._id]);

  const fetchReviews = async (receiverId) => {
    if (!receiverId) return;
    try {
      setReviewLoading(true);
      const res = await axios.get(`/review/received/${receiverId}`);
      setReviews(res.data.data || []);
      setAverageRating(res.data.averageRating || 0);
      setTotalReviews(res.data.totalReviews || 0);
    } catch { setReviews([]); setAverageRating(0); setTotalReviews(0); }
    finally { setReviewLoading(false); }
  };

  useEffect(() => {
    if (profile?.userId?._id) fetchReviews(profile.userId._id);
    else if (profile?.userId && typeof profile.userId === "string") fetchReviews(profile.userId);
  }, [profile]);

  const fetchEvents = async (userId) => {
    if (!userId) return;
    try {
      setEventsLoading(true);
      const res = await axios.get("/event");
      setEvents((res.data.data || []).filter((e) => {
        const tpId = e.talentproviderId?._id || e.talentproviderId;
        return tpId === userId;
      }));
    } catch { setEvents([]); } finally { setEventsLoading(false); }
  };

  useEffect(() => { if (profile && user?._id) fetchEvents(user._id); }, [profile, user?._id]);

  const fetchBookings = async () => {
    if (!profile?._id) return;
    try {
      setBookingsLoading(true);
      const res = await axios.get(`/booking/provider/${profile._id}`);
      setBookings(res.data.data || []);
    } catch { setBookings([]); } finally { setBookingsLoading(false); }
  };

  useEffect(() => { if (profile?._id) fetchBookings(); }, [profile]);

  useEffect(() => {
    if (!profile?._id) return;
    const interval = setInterval(fetchBookings, 30000);
    return () => clearInterval(interval);
  }, [profile?._id]);

  useEffect(() => {
    if (!profile?._id) return;
    const handleVisibilityChange = () => { if (document.visibilityState === "visible") fetchBookings(); };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [profile?._id]);

  // ── Fetch payments: from bookings + from event applications ──
  const fetchPaymentHistory = async () => {
    if (!profile?._id) return;
    try {
      setPaymentLoading(true);
      const allPayments = [];

      // 1. Payments linked to bookings
      const bookingsRes = await axios.get(`/booking/provider/${profile._id}`);
      const providerBookings = bookingsRes.data.data || [];
      await Promise.all(providerBookings.map(async (booking) => {
        try {
          const payRes = await axios.get(`/payment/booking/${booking._id}`);
          const payments = Array.isArray(payRes.data) ? payRes.data : [];
          payments.forEach((p) => {
            if (!allPayments.find((x) => x._id === p._id)) {
              allPayments.push({ ...p, booking });
            }
          });
        } catch {}
      }));

      // 2. Payments linked to event applications (no booking)
      await Promise.all(events.map(async (event) => {
        try {
          const appRes = await axios.get(`/eventdetails/event/${event._id}`);
          const applications = appRes.data.data || [];
          await Promise.all(
            applications
              .filter((a) => a.status === "accepted")
              .map(async (application) => {
                try {
                  const payRes = await axios.get(`/payment/application/${application._id}`);
                  const payments = Array.isArray(payRes.data) ? payRes.data : [];
                  payments.forEach((p) => {
                    if (!allPayments.find((x) => x._id === p._id)) {
                      allPayments.push({
                        ...p,
                        booking: { eventId: event, talentId: application.talentId },
                      });
                    }
                  });
                } catch {}
              })
          );
        } catch {}
      }));

      allPayments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setPaymentHistory(allPayments);
    } catch { setPaymentHistory([]); }
    finally { setPaymentLoading(false); }
  };

  // re-run whenever bookings or events are loaded
  useEffect(() => {
    if (profile?._id) fetchPaymentHistory();
  }, [profile?._id, bookings, events]);

  const ensureProtocol = (url) => !url ? url : /^https?:\/\//i.test(url) ? url : `https://${url}`;
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const openModal = () => {
    if (profile) {
      setForm({
        profilePic: profile.profilePic || "", organizationName: profile.organizationName || "",
        providerType: profile.providerType || "Individual", experience: profile.experience ?? "",
        description: profile.description || "", phone: profile.phone || "",
        city: profile.location?.city || "", state: profile.location?.state || "",
        country: profile.location?.country || "", portfolio: profile.portfolio || "",
        budgetMin: profile.budgetRange?.min ?? "", budgetMax: profile.budgetRange?.max ?? "",
        availability: profile.availability !== false,
      });
    } else {
      setForm({ profilePic: "", organizationName: "", providerType: "Individual", experience: "", description: "", phone: "", city: "", state: "", country: "", portfolio: "", budgetMin: "", budgetMax: "", availability: true });
    }
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.organizationName.trim()) { toast.error("Organization name is required"); return; }
    setSaving(true);
    const payload = {
      userId: user._id, profilePic: form.profilePic, organizationName: form.organizationName,
      providerType: form.providerType, experience: Number(form.experience) || 0,
      description: form.description, phone: form.phone,
      location: { city: form.city, state: form.state, country: form.country },
      portfolio: form.portfolio ? ensureProtocol(form.portfolio) : "",
      budgetRange: { min: Number(form.budgetMin) || 0, max: Number(form.budgetMax) || 0 },
      availability: form.availability,
    };
    try {
      if (profile) {
        const res = await axios.put(`/talentprovider/update/${profile._id}`, payload);
        setProfile(res.data.data); toast.success("Profile updated successfully");
      } else {
        const res = await axios.post("/talentprovider/register", payload);
        setProfile(res.data.data); toast.success("Profile created successfully");
      }
      setShowModal(false);
    } catch (err) { toast.error(err.response?.data?.message || "Something went wrong"); }
    finally { setSaving(false); }
  };

  const renderStars = (value, size = "text-base") =>
    Array.from({ length: 5 }, (_, i) => <span key={i} className={`${size} ${i < value ? "text-amber-400" : "text-gray-200"}`}>★</span>);

  const eventStatusColors = { open: "bg-green-50 text-green-600 border-green-200", closed: "bg-red-50 text-red-500 border-red-200", completed: "bg-blue-50 text-blue-600 border-blue-200", cancelled: "bg-gray-100 text-gray-400 border-gray-200" };
  const eventStatusDot = { open: "bg-green-500", closed: "bg-red-400", completed: "bg-blue-500", cancelled: "bg-gray-300" };
  const bookingStatusColors = { pending: "bg-yellow-50 text-yellow-600 border-yellow-200", confirmed: "bg-green-50 text-green-600 border-green-200", cancelled: "bg-red-50 text-red-500 border-red-200", completed: "bg-blue-50 text-blue-600 border-blue-200" };
  const bookingStatusDot = { pending: "bg-yellow-400", confirmed: "bg-green-500", cancelled: "bg-red-400", completed: "bg-blue-500" };
  const payStatusColors = { pending: "bg-yellow-50 text-yellow-600 border-yellow-200", completed: "bg-green-50 text-green-600 border-green-200", failed: "bg-red-50 text-red-500 border-red-200", refunded: "bg-purple-50 text-purple-600 border-purple-200" };
  const payStatusDot = { pending: "bg-yellow-400", completed: "bg-green-500", failed: "bg-red-400", refunded: "bg-purple-500" };
  const methodIcons = { UPI: "📱", Card: "💳", NetBanking: "🏦", Cash: "💵" };

  if (!user?._id) return null;
  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="w-8 h-8 border-4 border-gray-200 border-t-amber-500 rounded-full animate-spin" /></div>;

  const initials = profile?.organizationName?.charAt(0).toUpperCase() || user?.name?.charAt(0).toUpperCase();
  const providerTypeBadge = { Individual: "bg-gray-100 text-gray-500 border-gray-200", Company: "bg-amber-50 text-amber-600 border-amber-200", Agency: "bg-green-50 text-green-600 border-green-200" };
  const inputCls = "w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-900 placeholder:text-gray-300 outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition";
  const labelCls = "block text-xs font-medium text-gray-500 mb-1.5";
  const sectionTitle = "text-[11px] font-semibold text-amber-500 uppercase tracking-widest pb-2.5 border-b border-gray-100 mb-4";

  const previewBookings = bookings.slice(0, 1);
  const hasMoreBookings = bookings.length > 1;
  const previewPayments = paymentHistory.slice(0, 1);
  const hasMorePayments = paymentHistory.length > 1;
  const previewEvents = events.slice(0, 1);
  const hasMoreEvents = events.length > 1;

  const modalFilteredBookings = modalBookingFilter === "all" ? bookings : bookings.filter((b) => b.status === modalBookingFilter);
  const modalFilteredPayments = modalPaymentFilter === "all" ? paymentHistory : paymentHistory.filter((p) => p.paymentStatus === modalPaymentFilter);
  const pendingCount = bookings.filter((b) => b.status === "pending").length;

  const BookingCard = ({ booking }) => (
    <div className="border border-gray-100 rounded-xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize mb-2 ${bookingStatusColors[booking.status]}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${bookingStatusDot[booking.status]}`} />{booking.status}
            {booking.status === "cancelled" && <span className="text-[9px] text-red-400 ml-0.5">(by talent)</span>}
          </span>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold text-[10px]">
              {(booking.talentId?.userId?.name?.[0] || booking.talentId?.name?.[0] || "?").toUpperCase()}
            </div>
            <p className="text-sm font-semibold text-gray-800 truncate">{booking.talentId?.userId?.name || booking.talentId?.name || "Unknown Talent"}</p>
          </div>
          <p className="text-xs text-gray-500 truncate">📋 {booking.eventId?.title || "Event"}</p>
          <div className="flex flex-wrap gap-3 mt-1.5 text-[11px] text-gray-400">
            {booking.bookingDate && <span>📅 {new Date(booking.bookingDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>}
            <span>🕒 {new Date(booking.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
          </div>
        </div>
        <div className="flex-shrink-0 text-[10px] font-semibold text-gray-400 capitalize text-right">
          {booking.status === "pending" && "Waiting for talent"}
          {booking.status === "confirmed" && "Accepted by talent"}
          {booking.status === "cancelled" && "Rejected by talent"}
          {booking.status === "completed" && "Completed"}
        </div>
      </div>
    </div>
  );

  const PaymentCard = ({ payment }) => {
    const talentName = payment.booking?.talentId?.userId?.name || payment.booking?.talentId?.name || "Unknown Talent";
    const talentInitial = talentName[0]?.toUpperCase() || "?";
    return (
      <div className="border border-gray-100 rounded-xl p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize mb-2 ${payStatusColors[payment.paymentStatus] || payStatusColors.pending}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${payStatusDot[payment.paymentStatus] || payStatusDot.pending}`} />{payment.paymentStatus}
            </span>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold text-[10px]">{talentInitial}</div>
              <p className="text-sm font-semibold text-gray-800 truncate">{talentName}</p>
            </div>
            <p className="text-xs text-gray-500 truncate">📋 {payment.booking?.eventId?.title || "Event"}</p>
            <div className="flex flex-wrap gap-3 mt-1.5 text-[11px] text-gray-400">
              <span>{methodIcons[payment.paymentMethod]} {payment.paymentMethod}</span>
              {payment.paymentDate && <span>📅 {new Date(payment.paymentDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>}
            </div>
          </div>
          <p className={`text-base font-bold flex-shrink-0 ${payment.paymentStatus === "completed" ? "text-green-600" : payment.paymentStatus === "refunded" ? "text-purple-500" : "text-gray-400"}`}>
            ₹{payment.amount?.toLocaleString("en-IN")}
          </p>
        </div>
      </div>
    );
  };

  const EventCard = ({ event, onClick }) => (
    <div
      onClick={onClick || (() => navigate(`/event/${event._id}`))}
      className="border border-gray-100 rounded-xl p-4 cursor-pointer hover:border-amber-200 hover:bg-amber-50/40 transition-all group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap gap-1.5 mb-1.5">
            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${eventStatusColors[event.status] || eventStatusColors.open}`}>
              <span className={`w-1 h-1 rounded-full ${eventStatusDot[event.status] || eventStatusDot.open}`} />{event.status}
            </span>
            {event.skillRequired && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100">{event.skillRequired}</span>
            )}
          </div>
          <p className="text-sm font-semibold text-gray-800 group-hover:text-amber-600 transition-colors truncate">{event.title}</p>
          {event.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{event.description}</p>}
          <div className="flex flex-wrap gap-2 mt-1.5 text-[11px] text-gray-400">
            {event.location?.city && <span>📍 {[event.location.city, event.location.state].filter(Boolean).join(", ")}</span>}
            {event.eventDate && <span>📅 {new Date(event.eventDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>}
            {event.budget > 0 && <span>💰 ₹{event.budget.toLocaleString()}</span>}
          </div>
        </div>
        <span className="text-gray-300 group-hover:text-amber-400 transition-colors flex-shrink-0 mt-1 text-sm">→</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <button onClick={() => window.history.back()} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-gray-400 hover:text-amber-500 mb-8 transition-colors">← Back</button>

        {!profile ? (
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm text-center py-24 px-6">
            <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-3xl mx-auto mb-5">🏢</div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">Create your Provider Profile</h2>
            <p className="text-sm text-gray-400 mb-8 max-w-xs mx-auto leading-relaxed">Showcase your organization, set your budget range, and connect with top talent for your events.</p>
            <button onClick={openModal} className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-xl text-sm font-semibold shadow-sm transition-colors">+ Create Profile</button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">

            {/* ── HERO CARD ── */}
            <div className="bg-gray-900 rounded-2xl p-6 flex items-start gap-5 relative overflow-hidden shadow-lg">
              <div className="absolute top-0 right-0 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
              <div className="w-14 h-14 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold text-xl flex-shrink-0 border-2 border-white/10">{initials}</div>
              <div className="flex-1 min-w-0">
                <h1 className="text-white font-bold text-lg tracking-tight">{profile.organizationName}</h1>
                <p className="text-gray-400 text-xs mt-0.5">{user?.email}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className={`text-[11px] font-semibold px-3 py-1 rounded-full border ${providerTypeBadge[profile.providerType] || providerTypeBadge.Individual}`}>{profile.providerType || "Individual"}</span>
                  <span className={`text-[11px] font-semibold px-3 py-1 rounded-full border ${profile.availability ? "bg-green-900/30 text-green-400 border-green-500/20" : "bg-white/5 text-gray-400 border-white/10"}`}>{profile.availability ? "● Available" : "○ Unavailable"}</span>
                  {profile.location?.city && <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-white/5 text-gray-400 border border-white/10">📍 {[profile.location.city, profile.location.state, profile.location.country].filter(Boolean).join(", ")}</span>}
                  {profile.phone && <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-white/5 text-gray-400 border border-white/10">📞 {profile.phone}</span>}
                </div>
              </div>
              <button onClick={openModal} className="flex-shrink-0 bg-white/10 hover:bg-white/15 text-white border border-white/10 px-4 py-2 rounded-xl text-xs font-medium transition-colors">Edit Profile</button>
            </div>

            {/* ── STATS ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Rating", value: averageRating ? parseFloat(averageRating).toFixed(1) : "—" },
                { label: "Reviews", value: totalReviews || 0 },
                { label: "Experience", value: `${profile.experience || 0} yrs` },
                { label: "Bookings", value: bookings.length || 0 },
              ].map((s) => (
                <div key={s.label} className="bg-white border border-gray-100 rounded-2xl p-4 text-center shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">{s.label}</p>
                  <p className="text-2xl font-bold text-gray-900 tracking-tight">{s.value}</p>
                </div>
              ))}
            </div>

            {/* ── ABOUT ── */}
            {profile.description && (
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">About</p>
                <p className="text-sm text-gray-600 leading-relaxed">{profile.description}</p>
              </div>
            )}

            {/* ── PROFESSIONAL + PORTFOLIO ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Professional</p>
                <div className="flex flex-col gap-2.5">
                  {[
                    { k: "Organization", v: profile.organizationName },
                    { k: "Provider Type", v: profile.providerType },
                    { k: "Experience", v: profile.experience ? `${profile.experience} years` : "—" },
                    { k: "Budget Range", v: profile.budgetRange?.min || profile.budgetRange?.max ? `₹${profile.budgetRange.min || 0} – ₹${profile.budgetRange.max || 0}` : "—" },
                    { k: "Email", v: user?.email },
                  ].map((row) => (
                    <div key={row.k} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
                      <span className="text-xs text-gray-400">{row.k}</span>
                      <span className="text-xs font-semibold text-gray-800">{row.v || "—"}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Portfolio</p>
                {profile.portfolio ? (
                  <a href={ensureProtocol(profile.portfolio)} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-100 px-3 py-2 rounded-lg hover:opacity-70 transition-opacity">
                    <span className="flex-shrink-0">🔗</span>
                    <span className="truncate">{profile.portfolio.replace(/^https?:\/\//, "")}</span>
                    <span className="ml-auto flex-shrink-0 text-gray-300">↗</span>
                  </a>
                ) : <p className="text-xs text-gray-300">No portfolio link added.</p>}
              </div>
            </div>

            {/* ── MY EVENTS ── */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  My Events
                  {events.length > 0 && <span className="ml-2 text-amber-500">{events.length}</span>}
                </p>
                {hasMoreEvents && (
                  <button onClick={() => setShowAllEventsModal(true)} className="text-xs text-amber-600 font-semibold hover:text-amber-700 transition-colors">
                    View All ({events.length})
                  </button>
                )}
              </div>
              {eventsLoading ? (
                <div className="flex justify-center py-6"><div className="w-6 h-6 border-4 border-gray-200 border-t-amber-500 rounded-full animate-spin" /></div>
              ) : events.length === 0 ? (
                <p className="text-xs text-gray-300 text-center py-4">No events created yet.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {previewEvents.map((event) => <EventCard key={event._id} event={event} />)}
                  {hasMoreEvents && (
                    <button onClick={() => setShowAllEventsModal(true)} className="text-xs text-center text-gray-400 hover:text-amber-500 border border-dashed border-gray-200 hover:border-amber-300 rounded-xl py-2.5 transition-colors">
                      +{events.length - 1} more event{events.length - 1 > 1 ? "s" : ""} — tap to view all
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* ── INCOMING BOOKINGS ── */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Incoming Bookings</p>
                  {bookings.length > 0 && <span className="text-[10px] font-bold bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">{bookings.length}</span>}
                  {pendingCount > 0 && <span className="text-[10px] font-bold bg-yellow-100 text-yellow-600 px-2 py-0.5 rounded-full">{pendingCount} pending</span>}
                </div>
                {hasMoreBookings && (
                  <button onClick={() => { setModalBookingFilter("all"); setShowAllBookingsModal(true); }} className="text-xs text-amber-600 font-semibold hover:text-amber-700 transition-colors">
                    View All ({bookings.length})
                  </button>
                )}
              </div>
              {bookingsLoading ? (
                <div className="flex justify-center py-6"><div className="w-6 h-6 border-4 border-gray-200 border-t-amber-500 rounded-full animate-spin" /></div>
              ) : bookings.length === 0 ? (
                <p className="text-xs text-gray-300 text-center py-4">No bookings received yet.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {previewBookings.map((booking) => <BookingCard key={booking._id} booking={booking} />)}
                  {hasMoreBookings && (
                    <button onClick={() => { setModalBookingFilter("all"); setShowAllBookingsModal(true); }} className="text-xs text-center text-gray-400 hover:text-amber-500 border border-dashed border-gray-200 hover:border-amber-300 rounded-xl py-2.5 transition-colors">
                      +{bookings.length - 1} more booking{bookings.length - 1 > 1 ? "s" : ""} — tap to view all
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* ── PAYMENT HISTORY ── */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Payment History</p>
                  {paymentHistory.length > 0 && <span className="text-[10px] font-bold bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">{paymentHistory.length}</span>}
                </div>
                {hasMorePayments && (
                  <button onClick={() => { setModalPaymentFilter("all"); setShowAllPaymentsModal(true); }} className="text-xs text-amber-600 font-semibold hover:text-amber-700 transition-colors">
                    View All ({paymentHistory.length})
                  </button>
                )}
              </div>
              {paymentLoading ? (
                <div className="flex justify-center py-6"><div className="w-6 h-6 border-4 border-gray-200 border-t-amber-500 rounded-full animate-spin" /></div>
              ) : paymentHistory.length === 0 ? (
                <p className="text-xs text-gray-300 text-center py-4">No payments received yet.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {previewPayments.map((payment) => <PaymentCard key={payment._id} payment={payment} />)}
                  {hasMorePayments && (
                    <button onClick={() => { setModalPaymentFilter("all"); setShowAllPaymentsModal(true); }} className="text-xs text-center text-gray-400 hover:text-amber-500 border border-dashed border-gray-200 hover:border-amber-300 rounded-xl py-2.5 transition-colors">
                      +{paymentHistory.length - 1} more payment{paymentHistory.length - 1 > 1 ? "s" : ""} — tap to view all
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* ── REVIEWS ── */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Reviews</p>
                {totalReviews > 0 && <div className="flex items-center gap-1.5"><div className="flex">{renderStars(Math.round(averageRating))}</div><span className="text-sm font-bold text-gray-800">{parseFloat(averageRating).toFixed(1)}</span><span className="text-xs text-gray-400">({totalReviews})</span></div>}
              </div>
              {reviewLoading ? (
                <div className="flex justify-center py-6"><div className="w-6 h-6 border-4 border-gray-200 border-t-amber-500 rounded-full animate-spin" /></div>
              ) : reviews.length === 0 ? (
                <p className="text-xs text-gray-300 text-center py-4">No reviews yet.</p>
              ) : (
                <div className="flex flex-col gap-4">
                  {reviews.slice(0, 1).map((review) => (
                    <div key={review._id} className="border border-gray-100 rounded-xl p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold text-xs">{review.giverId?.name?.charAt(0).toUpperCase()}</div>
                          <div><p className="text-xs font-semibold text-gray-800">{review.giverId?.name}</p><p className="text-[10px] text-gray-400 capitalize">{review.giverId?.role}</p></div>
                        </div>
                        <div className="text-right"><div className="flex justify-end">{renderStars(review.rating, "text-sm")}</div><p className="text-[10px] text-gray-400 mt-0.5">{new Date(review.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p></div>
                      </div>
                      {review.comment && <p className="text-xs text-gray-600 mt-2.5 leading-relaxed">{review.comment}</p>}
                    </div>
                  ))}
                  {reviews.length > 1 && <button onClick={() => setShowAllReviews(true)} className="text-xs text-amber-600 font-semibold mt-2">View All Reviews</button>}
                </div>
              )}
            </div>

          </div>
        )}
      </div>

      {/* ── ALL EVENTS MODAL ── */}
      {showAllEventsModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setShowAllEventsModal(false)}>
          <div className="bg-white w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <div>
                <h3 className="text-base font-bold text-gray-900">My Events</h3>
                <p className="text-xs text-gray-400 mt-0.5">{events.length} event{events.length !== 1 ? "s" : ""}</p>
              </div>
              <button onClick={() => setShowAllEventsModal(false)} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 text-sm transition-colors">✕</button>
            </div>
            <div className="overflow-y-auto px-6 py-4 flex flex-col gap-3 flex-1">
              {events.map((event) => (
                <EventCard
                  key={event._id}
                  event={event}
                  onClick={() => { setShowAllEventsModal(false); navigate(`/event/${event._id}`); }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── ALL BOOKINGS MODAL ── */}
      {showAllBookingsModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setShowAllBookingsModal(false)}>
          <div className="bg-white w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <div><h3 className="text-base font-bold text-gray-900">All Bookings</h3><p className="text-xs text-gray-400 mt-0.5">{bookings.length} booking{bookings.length !== 1 ? "s" : ""} received</p></div>
              <button onClick={() => setShowAllBookingsModal(false)} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 text-sm transition-colors">✕</button>
            </div>
            <div className="px-6 py-3 border-b border-gray-100 flex-shrink-0">
              <div className="flex gap-1.5 flex-wrap">
                {["all", "pending", "confirmed", "completed", "cancelled"].map((f) => (
                  <button key={f} onClick={() => setModalBookingFilter(f)}
                    className={`text-[10px] font-semibold px-2.5 py-1 rounded-full capitalize transition-colors ${modalBookingFilter === f ? "bg-amber-500 text-white" : "bg-gray-100 text-gray-400 hover:bg-gray-200"}`}>
                    {f} ({f === "all" ? bookings.length : bookings.filter((b) => b.status === f).length})
                  </button>
                ))}
              </div>
            </div>
            {modalBookingFilter === "cancelled" && modalFilteredBookings.length > 0 && (
              <div className="px-6 pt-3 flex-shrink-0">
                <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
                  <span className="text-red-400 text-xs mt-0.5">ℹ️</span>
                  <p className="text-xs text-red-500">Some bookings may have been cancelled by the talent directly.</p>
                </div>
              </div>
            )}
            <div className="overflow-y-auto px-6 py-4 flex flex-col gap-3 flex-1">
              {modalFilteredBookings.length === 0
                ? <p className="text-xs text-gray-300 text-center py-8">{modalBookingFilter === "all" ? "No bookings yet." : `No ${modalBookingFilter} bookings.`}</p>
                : modalFilteredBookings.map((booking) => <BookingCard key={booking._id} booking={booking} />)}
            </div>
          </div>
        </div>
      )}

      {/* ── ALL PAYMENTS MODAL ── */}
      {showAllPaymentsModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setShowAllPaymentsModal(false)}>
          <div className="bg-white w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <div>
                <h3 className="text-base font-bold text-gray-900">Payment History</h3>
                <p className="text-xs text-gray-400 mt-0.5">{paymentHistory.length} payment{paymentHistory.length !== 1 ? "s" : ""}</p>
              </div>
              <button onClick={() => setShowAllPaymentsModal(false)} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 text-sm transition-colors">✕</button>
            </div>
            <div className="px-6 py-3 border-b border-gray-100 flex-shrink-0">
              <div className="flex gap-1.5 flex-wrap">
                {["all", "completed", "pending", "failed", "refunded"].map((f) => (
                  <button key={f} onClick={() => setModalPaymentFilter(f)}
                    className={`text-[10px] font-semibold px-2.5 py-1 rounded-full capitalize transition-colors ${modalPaymentFilter === f ? "bg-amber-500 text-white" : "bg-gray-100 text-gray-400 hover:bg-gray-200"}`}>
                    {f} ({f === "all" ? paymentHistory.length : paymentHistory.filter((p) => p.paymentStatus === f).length})
                  </button>
                ))}
              </div>
            </div>
            <div className="overflow-y-auto px-6 py-4 flex flex-col gap-3 flex-1">
              {modalFilteredPayments.length === 0
                ? <p className="text-xs text-gray-300 text-center py-8">{modalPaymentFilter === "all" ? "No payments yet." : `No ${modalPaymentFilter} payments.`}</p>
                : modalFilteredPayments.map((payment) => <PaymentCard key={payment._id} payment={payment} />)}
            </div>
          </div>
        </div>
      )}

      {/* ── ALL REVIEWS MODAL ── */}
      {showAllReviews && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-5 max-h-[80vh] overflow-y-auto relative">
            <button onClick={() => setShowAllReviews(false)} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600">✕</button>
            <h3 className="text-sm font-bold mb-4">All Reviews</h3>
            <div className="flex flex-col gap-4">
              {reviews.map((review) => (
                <div key={review._id} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold text-xs">{review.giverId?.name?.charAt(0).toUpperCase()}</div>
                      <div><p className="text-xs font-semibold text-gray-800">{review.giverId?.name}</p><p className="text-[10px] text-gray-400 capitalize">{review.giverId?.role}</p></div>
                    </div>
                    <div className="text-right"><div className="flex justify-end">{renderStars(review.rating, "text-sm")}</div><p className="text-[10px] text-gray-400 mt-0.5">{new Date(review.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p></div>
                  </div>
                  {review.comment && <p className="text-xs text-gray-600 mt-2.5 leading-relaxed">{review.comment}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT / CREATE MODAL ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 rounded-t-2xl">
              <div><h2 className="text-base font-bold text-gray-900 tracking-tight">{profile ? "Edit Profile" : "Create Profile"}</h2><p className="text-xs text-gray-400 mt-0.5">Fill in your organization details</p></div>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 text-sm transition-colors">✕</button>
            </div>
            <div className="overflow-y-auto px-6 py-5 flex flex-col gap-5 flex-1">
              <div>
                <p className={sectionTitle}>Basic Info</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2"><label className={labelCls}>Organization Name <span className="text-red-400">*</span></label><input className={inputCls} placeholder="e.g. Starlight Events Co." value={form.organizationName} onChange={(e) => set("organizationName", e.target.value)} /></div>
                  <div><label className={labelCls}>Phone</label><input className={inputCls} placeholder="+91 98765 43210" value={form.phone} onChange={(e) => set("phone", e.target.value)} /></div>
                  <div><label className={labelCls}>Profile Pic URL</label><input className={inputCls} placeholder="https://..." value={form.profilePic} onChange={(e) => set("profilePic", e.target.value)} /></div>
                </div>
              </div>
              <div>
                <p className={sectionTitle}>Professional</p>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={labelCls}>Provider Type</label><select className={inputCls} value={form.providerType} onChange={(e) => set("providerType", e.target.value)}><option>Individual</option><option>Company</option><option>Agency</option></select></div>
                  <div><label className={labelCls}>Experience (yrs)</label><input className={inputCls} type="number" min="0" placeholder="5" value={form.experience} onChange={(e) => set("experience", e.target.value)} /></div>
                  <div><label className={labelCls}>Budget Min (₹)</label><input className={inputCls} type="number" min="0" placeholder="10000" value={form.budgetMin} onChange={(e) => set("budgetMin", e.target.value)} /></div>
                  <div><label className={labelCls}>Budget Max (₹)</label><input className={inputCls} type="number" min="0" placeholder="100000" value={form.budgetMax} onChange={(e) => set("budgetMax", e.target.value)} /></div>
                  <div className="col-span-2">
                    <label className={labelCls}>Availability</label>
                    <div className="flex items-center gap-3 mt-1">
                      <button onClick={() => set("availability", !form.availability)} className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${form.availability ? "bg-amber-500" : "bg-gray-200"}`}>
                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${form.availability ? "translate-x-5" : "translate-x-0"}`} />
                      </button>
                      <span className="text-xs text-gray-500">{form.availability ? "Available" : "Unavailable"}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <p className={sectionTitle}>About</p>
                <textarea rows={3} className={`${inputCls} resize-none`} placeholder="Describe your organization..." value={form.description} onChange={(e) => set("description", e.target.value)} />
              </div>
              <div>
                <p className={sectionTitle}>Location</p>
                <div className="grid grid-cols-3 gap-3">
                  {[["City", "city", "Mumbai"], ["State", "state", "Maharashtra"], ["Country", "country", "India"]].map(([label, key, placeholder]) => (
                    <div key={key}><label className={labelCls}>{label}</label><input className={inputCls} placeholder={placeholder} value={form[key]} onChange={(e) => set(key, e.target.value)} /></div>
                  ))}
                </div>
              </div>
              <div>
                <p className={sectionTitle}>Portfolio Link</p>
                <input className={inputCls} placeholder="linkedin.com/company/... or website.com" value={form.portfolio} onChange={(e) => set("portfolio", e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={handleSubmit} disabled={saving} className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors">{saving ? "Saving..." : profile ? "Update Profile" : "Create Profile"}</button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
};
