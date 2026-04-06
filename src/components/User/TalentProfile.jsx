import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { Footer } from "../../pages/Footer";

export const TalentProfile = () => {

  const navigate = useNavigate();

  const [user, setUser] = useState(() =>
    JSON.parse(localStorage.getItem("user") || "null")
  );
  const [profile, setProfile] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [skillInput, setSkillInput] = useState("");
  const [portfolioInput, setPortfolioInput] = useState("");
  const [form, setForm] = useState({
    phone: "",
    profilePic: "",
    skills: [],
    experience: "",
    expertiseLevel: "Beginner",
    hourlyRate: "",
    availability: true,
    city: "",
    state: "",
    country: "",
    portfolio: [],
  });

  // review states
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);

  // applied events states
  const [appliedEvents, setAppliedEvents] = useState([]);
  const [appliedEventsLoading, setAppliedEventsLoading] = useState(false);
  const [showAllEventsModal, setShowAllEventsModal] = useState(false); // ← NEW

  // ── BOOKING STATES ──
  const [myBookings, setMyBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [showAllBookingsModal, setShowAllBookingsModal] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState("");

  // ── PAYMENT STATES ──
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paidBookingIds, setPaidBookingIds] = useState(new Set());
  const [showAllPaymentsModal, setShowAllPaymentsModal] = useState(false);

  const isTalent = user?.role === "talent";

  // Sync on login / logout
  useEffect(() => {
    const syncUser = () => {
      const updated = JSON.parse(localStorage.getItem("user") || "null");
      setUser(updated);
      if (!updated) {
        setProfile(null);
        setShowModal(false);
        navigate("/");
      }
    };
    window.addEventListener("authChange", syncUser);
    return () => window.removeEventListener("authChange", syncUser);
  }, []);

  // Fetch profile when user changes
  useEffect(() => {
    if (!user?._id) { setLoading(false); return; }
    let cancelled = false;
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await axios.get("/talent/all");
        if (!cancelled) {
          const mine = res.data.data.find(
            (t) => t.userId?._id === user._id || t.userId === user._id
          );
          setProfile(mine || null);
        }
      } catch { } finally { if (!cancelled) setLoading(false); }
    };
    fetchProfile();
    return () => { cancelled = true; };
  }, [user?._id]);

  // Fetch reviews
  const fetchReviews = async (receiverId) => {
    if (!receiverId) return;
    try {
      setReviewLoading(true);
      const res = await axios.get(`/review/received/${receiverId}`);
      setReviews(res.data.data || []);
      setAverageRating(res.data.averageRating || 0);
      setTotalReviews(res.data.totalReviews || 0);
    } catch {
      setReviews([]);
      setAverageRating(0);
      setTotalReviews(0);
    } finally {
      setReviewLoading(false);
    }
  };

  useEffect(() => {
    if (profile && user?._id) {
      fetchReviews(user._id);
    }
  }, [profile]);

  // Fetch applied events
  const fetchAppliedEvents = async (talentProfileId) => {
    if (!talentProfileId) return;
    try {
      setAppliedEventsLoading(true);
      const res = await axios.get(`/eventdetails/talent/${talentProfileId}`);
      setAppliedEvents(res.data.data || []);
    } catch (err) {
      console.error("Error fetching applied events:", err);
      setAppliedEvents([]);
    } finally {
      setAppliedEventsLoading(false);
    }
  };

  useEffect(() => {
    if (profile?._id) {
      fetchAppliedEvents(profile._id);
    }
  }, [profile?._id]);

  // ── fetch bookings for this talent (own profile) ──
  const fetchMyBookings = async () => {
    if (!profile?._id) return;
    try {
      setBookingsLoading(true);
      const res = await axios.get(`/booking/talent/${profile._id}`);
      setMyBookings(res.data.data || []);
    } catch {
      setMyBookings([]);
    } finally {
      setBookingsLoading(false);
    }
  };

  useEffect(() => {
    if (profile?._id) {
      fetchMyBookings();
    }
  }, [profile?._id]);

  // ── fetch payments for all bookings + event applications, build paidBookingIds + history ──
  const fetchPaymentsAndHistory = async (bookingsList) => {
    try {
      setPaymentLoading(true);
      const allPayments = [];
      const paidIds = new Set();

      // Fetch payments linked to bookings
      if (bookingsList?.length) {
        await Promise.all(
          bookingsList.map(async (booking) => {
            try {
              const payRes = await axios.get(`/payment/booking/${booking._id}`);
              const payments = Array.isArray(payRes.data) ? payRes.data : [];
              payments.forEach((p) => {
                allPayments.push({ ...p, booking });
                if (p.paymentStatus === "completed")
                  paidIds.add(String(booking._id));
              });
            } catch {
              // no payments for this booking
            }
          }),
        );
      }

      // Fetch payments linked to event applications (no booking)
      if (appliedEvents?.length) {
        await Promise.all(
          appliedEvents
            .filter((a) => a.status === "accepted")
            .map(async (application) => {
              try {
                const payRes = await axios.get(`/payment/application/${application._id}`);
                const payments = Array.isArray(payRes.data) ? payRes.data : [];
                payments.forEach((p) => {
                  // avoid duplicates
                  if (!allPayments.find((x) => x._id === p._id)) {
                    allPayments.push({ ...p, booking: { eventId: application.eventId } });
                  }
                });
              } catch {
                // no payments for this application
              }
            }),
        );
      }

      allPayments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setPaymentHistory(allPayments);
      setPaidBookingIds(paidIds);
    } catch {
      setPaymentHistory([]);
      setPaidBookingIds(new Set());
    } finally {
      setPaymentLoading(false);
    }
  };

  // ── run payment fetch whenever bookings or applied events change ──
  useEffect(() => {
    fetchPaymentsAndHistory(myBookings);
  }, [myBookings, appliedEvents]);

  // ── accept / reject / complete a booking ──
  const handleBookingStatus = async (bookingId, status) => {
    try {
      await axios.put(`/booking/update/${bookingId}`, { status });
      fetchMyBookings();
    } catch {
      // silent fail
    }
  };

  // ── navigate to payment page ──
  const handlePayNow = (booking) => {
    navigate(`/payment/${booking._id}`, { state: { booking } });
  };

  // ── navigate to payment page from accepted event ──
  // First tries a real booking; if none, goes via application flow directly
  const handlePayForEvent = (eventId, application) => {
    const matchingBooking = myBookings.find(
      (b) => String(b.eventId?._id || b.eventId) === String(eventId)
    );
    if (matchingBooking) {
      // booking exists — use normal booking payment flow
      navigate(`/payment/${matchingBooking._id}`, { state: { booking: matchingBooking } });
    } else {
      // no booking — go directly via application, PaymentPage handles it
      const ev = application?.eventId;
      navigate(`/payment/event/${application._id}`, {
        state: { application, event: ev },
      });
    }
  };

  // ── END OF HOOKS ──

  const ensureProtocol = (url) =>
    !url ? url : /^https?:\/\//i.test(url) ? url : `https://${url}`;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !form.skills.includes(s)) { set("skills", [...form.skills, s]); setSkillInput(""); }
  };
  const removeSkill = (s) => set("skills", form.skills.filter((x) => x !== s));

  const addPortfolio = () => {
    const raw = portfolioInput.trim();
    if (!raw) return;
    const u = ensureProtocol(raw);
    if (!form.portfolio.includes(u)) { set("portfolio", [...form.portfolio, u]); setPortfolioInput(""); }
  };
  const removePortfolio = (u) => set("portfolio", form.portfolio.filter((x) => x !== u));

  const openModal = () => {
    if (profile) {
      setForm({
        phone: profile.phone || "",
        profilePic: profile.profilePic || "",
        skills: profile.skills || [],
        experience: profile.experience ?? "",
        expertiseLevel: profile.expertiseLevel || "Beginner",
        hourlyRate: profile.hourlyRate ?? "",
        availability: profile.availability !== false,
        city: profile.location?.city || "",
        state: profile.location?.state || "",
        country: profile.location?.country || "",
        portfolio: profile.portfolio || [],
      });
    } else {
      setForm({ phone: "", profilePic: "", skills: [], experience: "", expertiseLevel: "Beginner", hourlyRate: "", availability: true, city: "", state: "", country: "", portfolio: [] });
    }
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.skills.length) { toast.error("Add at least one skill"); return; }
    setSaving(true);
    const payload = {
      userId: user._id, phone: form.phone, profilePic: form.profilePic,
      skills: form.skills, experience: Number(form.experience) || 0,
      expertiseLevel: form.expertiseLevel, hourlyRate: Number(form.hourlyRate) || 0,
      availability: form.availability,
      location: { city: form.city, state: form.state, country: form.country },
      portfolio: form.portfolio,
    };
    try {
      if (profile) {
        const res = await axios.put(`/talent/update/${profile._id}`, payload);
        setProfile(res.data.data);
        toast.success("Profile updated successfully");
      } else {
        const res = await axios.post("/talent/register", payload);
        setProfile(res.data.data);
        toast.success("Profile created successfully");
      }
      setShowModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally { setSaving(false); }
  };

  const renderStars = (value, size = "text-base") => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={`${size} ${i < value ? "text-amber-400" : "text-gray-200"}`}>★</span>
    ));
  };

  useEffect(() => {
    if (!user?._id) navigate("/");
  }, [user?._id]);

  if (!user?._id) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  const initials = user?.name?.charAt(0).toUpperCase();

  const expertiseBadge = {
    Beginner:     "bg-gray-100 text-gray-500 border-gray-200",
    Intermediate: "bg-amber-50 text-amber-600 border-amber-200",
    Expert:       "bg-green-50 text-green-600 border-green-200",
  };

  const appStatusColors = {
    pending:  "bg-amber-50 text-amber-600 border-amber-200",
    accepted: "bg-green-50 text-green-600 border-green-200",
    rejected: "bg-red-50 text-red-500 border-red-200",
  };

  const appStatusIcon = {
    pending:  "⏳",
    accepted: "✅",
    rejected: "❌",
  };

  const eventStatusDot = {
    open:      "bg-green-500",
    closed:    "bg-red-400",
    completed: "bg-blue-500",
    cancelled: "bg-gray-300",
  };

  const statusColors = {
    pending:   "bg-yellow-50 text-yellow-600 border-yellow-200",
    confirmed: "bg-green-50 text-green-600 border-green-200",
    cancelled: "bg-red-50 text-red-500 border-red-200",
    completed: "bg-blue-50 text-blue-600 border-blue-200",
  };
  const statusDot = {
    pending:   "bg-yellow-400",
    confirmed: "bg-green-500",
    cancelled: "bg-red-400",
    completed: "bg-blue-500",
  };

  const paymentStatusColors = {
    pending:   "bg-yellow-50 text-yellow-600 border-yellow-200",
    completed: "bg-green-50 text-green-600 border-green-200",
    failed:    "bg-red-50 text-red-500 border-red-200",
    refunded:  "bg-purple-50 text-purple-600 border-purple-200",
  };
  const paymentStatusDot = {
    pending:   "bg-yellow-400",
    completed: "bg-green-500",
    failed:    "bg-red-400",
    refunded:  "bg-purple-500",
  };
  const methodIcons = { UPI: "📱", Card: "💳", NetBanking: "🏦", Cash: "💵" };

  const inputCls = "w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-900 placeholder:text-gray-300 outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition";
  const labelCls = "block text-xs font-medium text-gray-500 mb-1.5";
  const sectionTitle = "text-[11px] font-semibold text-amber-500 uppercase tracking-widest pb-2.5 border-b border-gray-100 mb-4";

  // ── Payment Card (reusable) ──
  const PaymentCard = ({ payment }) => (
    <div className="border border-gray-100 rounded-xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${paymentStatusColors[payment.paymentStatus] || paymentStatusColors.pending}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${paymentStatusDot[payment.paymentStatus] || paymentStatusDot.pending}`} />
              {payment.paymentStatus}
            </span>
            <span className="text-[10px] text-gray-400">
              {methodIcons[payment.paymentMethod]} {payment.paymentMethod}
            </span>
          </div>
          <p className="text-sm font-semibold text-gray-800 truncate">
            {payment.booking?.eventId?.title || "Event"}
          </p>
          <div className="flex flex-wrap gap-3 mt-1.5 text-[11px] text-gray-400">
            {payment.payerId?.name && (
              <span>👤 {payment.payerId.name}</span>
            )}
            {payment.transactionId && (
              <span className="font-mono">#{payment.transactionId}</span>
            )}
            {payment.paymentDate && (
              <span>
                📅{" "}
                {new Date(payment.paymentDate).toLocaleDateString("en-IN", {
                  day: "numeric", month: "short", year: "numeric",
                })}
              </span>
            )}
          </div>
          <p className="text-[10px] text-gray-300 mt-1">
            Recorded on{" "}
            {new Date(payment.createdAt).toLocaleDateString("en-IN", {
              day: "numeric", month: "short", year: "numeric",
            })}
          </p>
        </div>
        <div className="flex-shrink-0 text-right">
          <p className={`text-base font-bold ${payment.paymentStatus === "completed" ? "text-green-600" : payment.paymentStatus === "refunded" ? "text-purple-500" : "text-gray-400"}`}>
            ₹{payment.amount?.toLocaleString("en-IN")}
          </p>
        </div>
      </div>
    </div>
  );

  // ── Booking card with Pay Now / ✓ Paid ──
  const BookingCard = ({ booking, inModal = false }) => {
    const alreadyPaid = paidBookingIds.has(String(booking._id));
    return (
      <div className="border border-gray-100 rounded-xl p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize mb-2 ${statusColors[booking.status]}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${statusDot[booking.status]}`} />
              {booking.status}
            </span>
            <p className="text-sm font-semibold text-gray-800 truncate">
              {booking.eventId?.title || "Event"}
            </p>
            <div className="flex flex-wrap gap-3 mt-1.5 text-[11px] text-gray-400">
              {booking.eventId?.location?.city && (
                <span>📍 {booking.eventId.location.city}</span>
              )}
              {booking.bookingDate && (
                <span>
                  📅{" "}
                  {new Date(booking.bookingDate).toLocaleDateString("en-IN", {
                    day: "numeric", month: "short", year: "numeric",
                  })}
                </span>
              )}
              {booking.providerId?.organizationName && (
                <span>🏢 {booking.providerId.organizationName}</span>
              )}
            </div>
            <p className="text-[10px] text-gray-300 mt-1">
              Booked on{" "}
              {new Date(booking.createdAt).toLocaleDateString("en-IN", {
                day: "numeric", month: "short", year: "numeric",
              })}
            </p>
          </div>

          {isTalent && (
            <div className="flex flex-col gap-1.5 flex-shrink-0">
              {booking.status === "pending" && (
                <>
                  <button
                    onClick={() => handleBookingStatus(booking._id, "confirmed")}
                    className="text-[10px] font-semibold text-green-600 border border-green-200 px-2.5 py-1 rounded-lg"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleBookingStatus(booking._id, "cancelled")}
                    className="text-[10px] font-semibold text-red-500 border border-red-200 px-2.5 py-1 rounded-lg"
                  >
                    Reject
                  </button>
                </>
              )}
              {booking.status === "confirmed" && (
                <button
                  onClick={() => handleBookingStatus(booking._id, "completed")}
                  className="text-[10px] font-semibold text-blue-600 border border-blue-200 px-2.5 py-1 rounded-lg"
                >
                  Complete
                </button>
              )}
              {booking.status === "confirmed" && !alreadyPaid && (
                <button
                  onClick={() => {
                    if (inModal) setShowAllBookingsModal(false);
                    handlePayNow(booking);
                  }}
                  className="text-[10px] font-bold text-white bg-amber-500 hover:bg-amber-600 px-2.5 py-1 rounded-lg transition-colors"
                >
                  Pay Now
                </button>
              )}
              {booking.status === "confirmed" && alreadyPaid && (
                <span className="text-[10px] font-semibold text-green-600 bg-green-50 border border-green-200 px-2.5 py-1 rounded-lg">
                  ✓ Paid
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const AppliedEventCard = ({ application, inModal = false }) => {
    const ev = application.eventId;
    if (!ev) return null;

    const eventId = ev._id || ev;

    // Keep booking logic intact for booking-based pay/paid
    const matchingBooking = myBookings.find(
      (b) => String(b.eventId?._id || b.eventId) === String(eventId)
    );
    const bookingPaid = matchingBooking
      ? paidBookingIds.has(String(matchingBooking._id))
      : false;

    // Also check paymentHistory directly by eventId or applicationId
    const eventPaid = paymentHistory.some(
      (p) =>
        p.paymentStatus === "completed" &&
        (String(p.booking?.eventId?._id || p.booking?.eventId) === String(eventId) ||
          String(p.eventId?._id || p.eventId) === String(eventId) ||
          String(p.applicationId) === String(application._id))
    );

    const alreadyPaid = bookingPaid || eventPaid;

    const showPayButton = application.status === "accepted" && !alreadyPaid;
    const showPaidBadge = application.status === "accepted" && alreadyPaid;

    return (
      <div className="border border-gray-100 rounded-xl p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-1.5 mb-2">
              <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border capitalize ${appStatusColors[application.status] || appStatusColors.pending}`}>
                <span>{appStatusIcon[application.status] || "⏳"}</span>
                {application.status}
              </span>
              {ev.status && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-gray-50 text-gray-500 border border-gray-200 capitalize">
                  <span className={`w-1.5 h-1.5 rounded-full ${eventStatusDot[ev.status] || "bg-gray-300"}`} />
                  {ev.status}
                </span>
              )}
              {ev.skillRequired && (
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100">
                  {ev.skillRequired}
                </span>
              )}
            </div>
            <p className="text-sm font-semibold text-gray-800 truncate">{ev.title}</p>
            <div className="flex flex-wrap gap-3 mt-1.5 text-[11px] text-gray-400">
              {ev.location?.city && (
                <span>📍 {[ev.location.city, ev.location.state].filter(Boolean).join(", ")}</span>
              )}
              {ev.eventDate && (
                <span>📅 {new Date(ev.eventDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
              )}
              {ev.budget > 0 && (
                <span>💰 ₹{ev.budget.toLocaleString()}</span>
              )}
            </div>
            <p className="text-[10px] text-gray-300 mt-1.5">
              Applied {new Date(application.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          </div>

          {/* Pay Now / ✓ Paid badge */}
          <div className="flex-shrink-0">
            {showPayButton && (
              <button
                onClick={() => {
                  if (inModal) setShowAllEventsModal(false);
                  handlePayForEvent(eventId, application);
                }}
                className="text-[10px] font-bold text-white bg-amber-500 hover:bg-amber-600 px-3 py-1.5 rounded-lg transition-colors"
              >
                Pay Now
              </button>
            )}
            {showPaidBadge && (
              <span className="text-[10px] font-semibold text-green-600 bg-green-50 border border-green-200 px-2.5 py-1 rounded-lg">
                ✓ Paid
              </span>
            )}
          </div>
        </div>

        {application.status === "accepted" && (
          <div className="mt-3 px-3 py-2 bg-green-50 border border-green-100 rounded-lg">
            <p className="text-[11px] text-green-600 font-semibold">🎉 Congratulations! Your application was accepted.</p>
          </div>
        )}
        {application.status === "rejected" && (
          <div className="mt-3 px-3 py-2 bg-red-50 border border-red-100 rounded-lg">
            <p className="text-[11px] text-red-500 font-semibold">Unfortunately your application was not selected this time.</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-10">

        {/* Back */}
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-gray-400 hover:text-amber-500 mb-8 transition-colors"
        >
          ← Back
        </button>

        {!profile ? (
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm text-center py-24 px-6">
            <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-3xl mx-auto mb-5">
              🎭
            </div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">
              Create your Talent Profile
            </h2>
            <p className="text-sm text-gray-400 mb-8 max-w-xs mx-auto leading-relaxed">
              Showcase your skills, set your rate, and get discovered by top event organizers.
            </p>
            <button
              onClick={openModal}
              className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-xl text-sm font-semibold shadow-sm transition-colors"
            >
              + Create Profile
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">

            {/* ── HERO CARD ── */}
            <div className="bg-gray-900 rounded-2xl p-6 flex items-start gap-5 relative overflow-hidden shadow-lg">
              <div className="absolute top-0 right-0 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
              <div className="w-14 h-14 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold text-xl flex-shrink-0 border-2 border-white/10">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-white font-bold text-lg tracking-tight">{user?.name}</h1>
                <p className="text-gray-400 text-xs mt-0.5">{user?.email}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className={`text-[11px] font-semibold px-3 py-1 rounded-full border ${expertiseBadge[profile.expertiseLevel] || expertiseBadge.Beginner}`}>
                    {profile.expertiseLevel || "Beginner"}
                  </span>
                  <span className={`text-[11px] font-semibold px-3 py-1 rounded-full border ${profile.availability ? "bg-green-900/30 text-green-400 border-green-500/20" : "bg-white/5 text-gray-400 border-white/10"}`}>
                    {profile.availability ? "● Available" : "○ Unavailable"}
                  </span>
                  {profile.location?.city && (
                    <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-white/5 text-gray-400 border border-white/10">
                      📍 {[profile.location.city, profile.location.state, profile.location.country].filter(Boolean).join(", ")}
                    </span>
                  )}
                  {profile.phone && (
                    <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-white/5 text-gray-400 border border-white/10">
                      📞 {profile.phone}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={openModal}
                className="flex-shrink-0 bg-white/10 hover:bg-white/15 text-white border border-white/10 px-4 py-2 rounded-xl text-xs font-medium transition-colors"
              >
                Edit Profile
              </button>
            </div>

            {/* ── STATS ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Rating",      value: averageRating ? parseFloat(averageRating).toFixed(1) : "—" },
                { label: "Reviews",     value: totalReviews || 0 },
                { label: "Experience",  value: `${profile.experience || 0} yrs` },
                { label: "Hourly Rate", value: profile.hourlyRate ? `₹${profile.hourlyRate}` : "—" },
              ].map((s) => (
                <div key={s.label} className="bg-white border border-gray-100 rounded-2xl p-4 text-center shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">{s.label}</p>
                  <p className="text-2xl font-bold text-gray-900 tracking-tight">{s.value}</p>
                </div>
              ))}
            </div>

            {/* ── SKILLS ── */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Skills</p>
              {profile.skills?.length ? (
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((s) => (
                    <span key={s} className="text-xs font-semibold px-3 py-1.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-full">
                      {s}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-300">No skills added yet.</p>
              )}
            </div>

            {/* ── PROFESSIONAL + PORTFOLIO ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Professional</p>
                <div className="flex flex-col gap-2.5">
                  {[
                    { k: "Expertise",    v: profile.expertiseLevel },
                    { k: "Experience",   v: profile.experience ? `${profile.experience} years` : "—" },
                    { k: "Hourly Rate",  v: profile.hourlyRate ? `₹${profile.hourlyRate}/hr` : "—" },
                    { k: "Email",        v: user?.email },
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
                {profile.portfolio?.length ? (
                  <div className="flex flex-col gap-2">
                    {profile.portfolio.map((u) => (
                      <a key={u} href={ensureProtocol(u)} target="_blank" rel="noreferrer"
                        className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-100 px-3 py-2 rounded-lg hover:opacity-70 transition-opacity"
                      >
                        <span className="flex-shrink-0">🔗</span>
                        <span className="truncate">{u.replace(/^https?:\/\//, "")}</span>
                        <span className="ml-auto flex-shrink-0 text-gray-300">↗</span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-300">No portfolio links added.</p>
                )}
              </div>
            </div>

            {/* ── BOOKINGS SECTION ── */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Bookings
                  {myBookings.length > 0 && (
                    <span className="ml-2 text-amber-500">{myBookings.length}</span>
                  )}
                </p>
                {myBookings.length > 1 && (
                  <button
                    onClick={() => setShowAllBookingsModal(true)}
                    className="text-xs text-amber-600 font-semibold hover:text-amber-700 transition-colors"
                  >
                    View All ({myBookings.length})
                  </button>
                )}
              </div>

              {bookingSuccess && (
                <p className="text-xs text-green-600 bg-green-50 border border-green-100 rounded-xl px-3 py-2 mb-3">
                  {bookingSuccess}
                </p>
              )}

              {bookingsLoading ? (
                <div className="flex justify-center py-6">
                  <div className="w-6 h-6 border-4 border-gray-200 border-t-amber-500 rounded-full animate-spin" />
                </div>
              ) : myBookings.length === 0 ? (
                <p className="text-xs text-gray-300 text-center py-4">
                  No bookings yet.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  <BookingCard booking={myBookings[0]} />
                  {myBookings.length > 1 && (
                    <button
                      onClick={() => setShowAllBookingsModal(true)}
                      className="text-xs text-center text-gray-400 hover:text-amber-500 border border-dashed border-gray-200 hover:border-amber-300 rounded-xl py-2.5 transition-colors"
                    >
                      +{myBookings.length - 1} more booking{myBookings.length - 1 > 1 ? "s" : ""} — tap to view all
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* ── PAYMENT HISTORY ── */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                {/* ← CHANGE 3: removed total received amount, only show label + count */}
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Payment History
                  {paymentHistory.length > 0 && (
                    <span className="ml-2 text-amber-500">{paymentHistory.length}</span>
                  )}
                </p>
                {paymentHistory.length > 1 && (
                  <button
                    onClick={() => setShowAllPaymentsModal(true)}
                    className="text-xs text-amber-600 font-semibold hover:text-amber-700 transition-colors"
                  >
                    View All ({paymentHistory.length})
                  </button>
                )}
              </div>

              {paymentLoading ? (
                <div className="flex justify-center py-6">
                  <div className="w-6 h-6 border-4 border-gray-200 border-t-amber-500 rounded-full animate-spin" />
                </div>
              ) : paymentHistory.length === 0 ? (
                <p className="text-xs text-gray-300 text-center py-4">No payments received yet.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  <PaymentCard payment={paymentHistory[0]} />
                  {paymentHistory.length > 1 && (
                    <button
                      onClick={() => setShowAllPaymentsModal(true)}
                      className="text-xs text-center text-gray-400 hover:text-amber-500 border border-dashed border-gray-200 hover:border-amber-300 rounded-xl py-2.5 transition-colors"
                    >
                      +{paymentHistory.length - 1} more payment{paymentHistory.length - 1 > 1 ? "s" : ""} — tap to view all
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* ── APPLIED EVENTS ── */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Applied Events
                  {appliedEvents.length > 0 && (
                    <span className="ml-2 text-amber-500">{appliedEvents.length}</span>
                  )}
                </p>
                {/* ← CHANGE 1: View All button when more than 1 event */}
                {appliedEvents.length > 1 && (
                  <button
                    onClick={() => setShowAllEventsModal(true)}
                    className="text-xs text-amber-600 font-semibold hover:text-amber-700 transition-colors"
                  >
                    View All ({appliedEvents.length})
                  </button>
                )}
              </div>

              {appliedEventsLoading ? (
                <div className="flex justify-center py-6">
                  <div className="w-6 h-6 border-4 border-gray-200 border-t-amber-500 rounded-full animate-spin" />
                </div>
              ) : appliedEvents.length === 0 ? (
                <p className="text-xs text-gray-300 text-center py-4">No events applied to yet.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {/* Show only the first event inline */}
                  <AppliedEventCard application={appliedEvents[0]} />
                  {appliedEvents.length > 1 && (
                    <button
                      onClick={() => setShowAllEventsModal(true)}
                      className="text-xs text-center text-gray-400 hover:text-amber-500 border border-dashed border-gray-200 hover:border-amber-300 rounded-xl py-2.5 transition-colors"
                    >
                      +{appliedEvents.length - 1} more event{appliedEvents.length - 1 > 1 ? "s" : ""} — tap to view all
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* ── REVIEWS LIST ── */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Reviews</p>
                {totalReviews > 0 && (
                  <div className="flex items-center gap-1.5">
                    <div className="flex">{renderStars(Math.round(averageRating))}</div>
                    <span className="text-sm font-bold text-gray-800">{parseFloat(averageRating).toFixed(1)}</span>
                    <span className="text-xs text-gray-400">({totalReviews})</span>
                  </div>
                )}
              </div>

              {reviewLoading ? (
                <div className="flex justify-center py-6">
                  <div className="w-6 h-6 border-4 border-gray-200 border-t-amber-500 rounded-full animate-spin" />
                </div>
              ) : reviews.length === 0 ? (
                <p className="text-xs text-gray-300 text-center py-4">No reviews yet.</p>
              ) : (
                <div className="flex flex-col gap-4">
                  {reviews.slice(0, 1).map((review) => (
                    <div key={review._id} className="border border-gray-100 rounded-xl p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold text-xs">
                            {(review.giverId?.name || "U").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-800">{review.giverId?.name || "Anonymous"}</p>
                            <p className="text-[10px] text-gray-400 capitalize">{review.giverId?.role || "user"}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex justify-end">{renderStars(review.rating, "text-sm")}</div>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {new Date(review.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-xs text-gray-600 mt-2.5 leading-relaxed">{review.comment}</p>
                      )}
                    </div>
                  ))}
                  {reviews.length > 1 && (
                    <button
                      onClick={() => setShowAllReviews(true)}
                      className="text-xs text-amber-600 font-semibold mt-2"
                    >
                      View All Reviews
                    </button>
                  )}
                </div>
              )}
            </div>

          </div>
        )}
      </div>

      {/* ── VIEW ALL REVIEWS MODAL ── */}
      {showAllReviews && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-5 max-h-[80vh] overflow-y-auto relative">
            <button
              onClick={() => setShowAllReviews(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
            <h3 className="text-sm font-bold mb-4">All Reviews</h3>
            <div className="flex flex-col gap-4">
              {reviews.map((review) => (
                <div key={review._id} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold text-xs">
                        {(review.giverId?.name || "U").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-800">{review.giverId?.name || "Anonymous"}</p>
                        <p className="text-[10px] text-gray-400 capitalize">{review.giverId?.role || "user"}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex justify-end">{renderStars(review.rating, "text-sm")}</div>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {new Date(review.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-xs text-gray-600 mt-2.5 leading-relaxed">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── ALL BOOKINGS MODAL ── */}
      {showAllBookingsModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setShowAllBookingsModal(false)}
        >
          <div className="bg-white w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900">All Bookings</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {myBookings.length} booking{myBookings.length !== 1 ? "s" : ""}
                </p>
              </div>
              <button
                onClick={() => setShowAllBookingsModal(false)}
                className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 text-sm transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto px-6 py-5 flex flex-col gap-3 flex-1">
              {myBookings.map((booking) => (
                <BookingCard key={booking._id} booking={booking} inModal={true} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── ALL PAYMENTS MODAL ── */}
      {showAllPaymentsModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setShowAllPaymentsModal(false)}
        >
          <div className="bg-white w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900">Payment History</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {paymentHistory.length} payment{paymentHistory.length !== 1 ? "s" : ""}
                </p>
              </div>
              <button
                onClick={() => setShowAllPaymentsModal(false)}
                className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 text-sm transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto px-6 py-5 flex flex-col gap-3 flex-1">
              {paymentHistory.map((payment) => (
                <PaymentCard key={payment._id} payment={payment} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── ALL APPLIED EVENTS MODAL ── */}
      {showAllEventsModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setShowAllEventsModal(false)}
        >
          <div className="bg-white w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900">Applied Events</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {appliedEvents.length} event{appliedEvents.length !== 1 ? "s" : ""}
                </p>
              </div>
              <button
                onClick={() => setShowAllEventsModal(false)}
                className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 text-sm transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto px-6 py-5 flex flex-col gap-3 flex-1">
              {appliedEvents.map((application) => (
                <AppliedEventCard
                  key={application._id}
                  application={application}
                  inModal={true}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT / CREATE MODAL ── */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl">

            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 rounded-t-2xl">
              <div>
                <h2 className="text-base font-bold text-gray-900 tracking-tight">
                  {profile ? "Edit Profile" : "Create Profile"}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">Fill in your professional details</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 text-sm transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto px-6 py-5 flex flex-col gap-5 flex-1">

              <div>
                <p className={sectionTitle}>Basic Info</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Phone</label>
                    <input className={inputCls} placeholder="+91 98765 43210" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Profile Pic URL</label>
                    <input className={inputCls} placeholder="https://..." value={form.profilePic} onChange={(e) => set("profilePic", e.target.value)} />
                  </div>
                </div>
              </div>

              <div>
                <p className={sectionTitle}>Skills</p>
                <div className="flex gap-2">
                  <input
                    className={inputCls}
                    placeholder="e.g. Guitar, Photography..."
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                  />
                  <button onClick={addSkill} className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-600 border border-amber-200 text-sm font-medium rounded-xl flex-shrink-0 transition-colors">
                    + Add
                  </button>
                </div>
                {form.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {form.skills.map((s) => (
                      <span key={s} className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-full">
                        {s}
                        <button onClick={() => removeSkill(s)} className="text-amber-300 hover:text-red-400 transition-colors leading-none">✕</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <p className={sectionTitle}>Professional</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Experience (yrs)</label>
                    <input className={inputCls} type="number" min="0" placeholder="3" value={form.experience} onChange={(e) => set("experience", e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Expertise Level</label>
                    <select className={inputCls} value={form.expertiseLevel} onChange={(e) => set("expertiseLevel", e.target.value)}>
                      <option>Beginner</option>
                      <option>Intermediate</option>
                      <option>Expert</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Hourly Rate (₹)</label>
                    <input className={inputCls} type="number" min="0" placeholder="500" value={form.hourlyRate} onChange={(e) => set("hourlyRate", e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Availability</label>
                    <div className="mt-2 flex items-center gap-3">
                      <button
                        onClick={() => set("availability", !form.availability)}
                        className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${form.availability ? "bg-amber-500" : "bg-gray-200"}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${form.availability ? "translate-x-5" : "translate-x-0"}`} />
                      </button>
                      <span className="text-xs text-gray-500">{form.availability ? "Available" : "Unavailable"}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <p className={sectionTitle}>Location</p>
                <div className="grid grid-cols-3 gap-3">
                  {[["City", "city", "Mumbai"], ["State", "state", "Maharashtra"], ["Country", "country", "India"]].map(([label, key, placeholder]) => (
                    <div key={key}>
                      <label className={labelCls}>{label}</label>
                      <input className={inputCls} placeholder={placeholder} value={form[key]} onChange={(e) => set(key, e.target.value)} />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className={sectionTitle}>Portfolio Links</p>
                <div className="flex gap-2">
                  <input
                    className={inputCls}
                    placeholder="youtube.com/yourchannel"
                    value={portfolioInput}
                    onChange={(e) => setPortfolioInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addPortfolio())}
                  />
                  <button onClick={addPortfolio} className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-600 border border-amber-200 text-sm font-medium rounded-xl flex-shrink-0 transition-colors">
                    + Add
                  </button>
                </div>
                {form.portfolio.length > 0 && (
                  <div className="flex flex-col gap-2 mt-3">
                    {form.portfolio.map((u) => (
                      <div key={u} className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
                        <span className="text-xs text-amber-600 truncate max-w-[85%]">{u}</span>
                        <button onClick={() => removePortfolio(u)} className="text-gray-300 hover:text-red-400 transition-colors text-xs ml-2 flex-shrink-0">✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={saving} className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors">
                {saving ? "Saving..." : profile ? "Update Profile" : "Create Profile"}
              </button>
            </div>

          </div>
        </div>
      )}
      <Footer />
    </div>
  );
};
