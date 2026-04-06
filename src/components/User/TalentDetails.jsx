import React, { useEffect, useState } from "react";
import axios from "axios";
import { Footer } from "../../pages/Footer";
import { useParams, useNavigate } from "react-router-dom";

export const TalentDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [talent, setTalent] = useState(null);
  const [loading, setLoading] = useState(true);

  // review states
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [reviewLoading, setReviewLoading] = useState(true);

  // form states
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [comment, setComment] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  // modal state
  const [showAllReviews, setShowAllReviews] = useState(false);

  // ── LOGGED-IN USER ──
  const [loggedUser] = useState(() =>
    JSON.parse(localStorage.getItem("user") || "null"),
  );
  const isTalentProvider = loggedUser?.role === "talentprovider";

  // ── BOOKING STATES ──
  const [providerProfile, setProviderProfile] = useState(null);
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [myBookings, setMyBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [showBookModal, setShowBookModal] = useState(false);
  const [showAllBookingsModal, setShowAllBookingsModal] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState("");

  // ── PAYMENT HISTORY STATES ──
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [paymentLoading, setPaymentLoading] = useState(false);

  // ── NEW: track which bookings already have a completed payment ──
  const [paidBookingIds, setPaidBookingIds] = useState(new Set());

  // fetch talent
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

  // ── true only if the logged-in user IS this specific talent profile ──
  const isThisTalent =
    loggedUser?.role === "talent" &&
    talent?.userId?._id &&
    String(loggedUser._id) === String(talent.userId._id);

  // fetch reviews
  const fetchReviews = async () => {
    if (!talent?.userId?._id) return;
    try {
      setReviewLoading(true);
      const res = await axios.get(`/review/received/${talent.userId._id}`);
      setReviews(res.data.data || []);
      setAverageRating(res.data.averageRating || 0);
      setTotalReviews(res.data.totalReviews || 0);
    } catch (err) {
      setReviews([]);
      setAverageRating(0);
      setTotalReviews(0);
    } finally {
      setReviewLoading(false);
    }
  };

  useEffect(() => {
    if (talent) fetchReviews();
  }, [talent]);

  // ── fetch provider profile + their open events ──
  const fetchOpenEvents = async () => {
    if (!loggedUser?._id) return;
    try {
      setEventsLoading(true);
      const provRes = await axios.get("/talentprovider/all");
      const mine = (provRes.data.data || []).find(
        (p) => String(p.userId?._id || p.userId) === String(loggedUser._id),
      );
      if (!mine) {
        setEvents([]);
        return;
      }
      setProviderProfile(mine);

      const evRes = await axios.get("/event");
      const myId = String(mine.userId?._id || mine.userId);
      const myOpenEvents = (evRes.data.data || []).filter((e) => {
        const tpId = String(
          e.talentproviderId?._id || e.talentproviderId || "",
        );
        return e.status === "open" && tpId === myId;
      });
      setEvents(myOpenEvents);
    } catch {
      setEvents([]);
    } finally {
      setEventsLoading(false);
    }
  };

  // ── fetch bookings for this talent ──
  const fetchMyBookings = async () => {
    if (!id) return;
    try {
      setBookingsLoading(true);
      const res = await axios.get(`/booking/talent/${id}`);
      setMyBookings(res.data.data || []);
    } catch {
      setMyBookings([]);
    } finally {
      setBookingsLoading(false);
    }
  };

  // ── NEW: fetch payments for all bookings, build paidBookingIds + history ──
  const fetchPaymentsAndHistory = async (bookingsList) => {
    if (!bookingsList?.length) return;
    try {
      setPaymentLoading(true);
      const allPayments = [];
      const paidIds = new Set();
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

      // sort newest first
      allPayments.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      );
      setPaymentHistory(allPayments);
      setPaidBookingIds(paidIds);
    } catch {
      setPaymentHistory([]);
      setPaidBookingIds(new Set());
    } finally {
      setPaymentLoading(false);
    }
  };

  useEffect(() => {
    if (talent) {
      fetchMyBookings();
      if (isTalentProvider) fetchOpenEvents();
    }
  }, [talent]);

  // ── NEW: run payment fetch whenever bookings list changes ──
  useEffect(() => {
    if (myBookings.length > 0) fetchPaymentsAndHistory(myBookings);
  }, [myBookings]);

  // ── open booking modal ──
  const openBookModal = () => {
    setBookingError("");
    setBookingSuccess("");
    setSelectedEventId("");
    setBookingDate("");
    setShowBookModal(true);
  };

  // ── submit booking ──
  const handleBooking = async () => {
    setBookingError("");
    setBookingSuccess("");

    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (!user?._id) {
      setBookingError("You must be logged in to book.");
      return;
    }
    if (!selectedEventId) {
      setBookingError("Please select an event.");
      return;
    }

    const providerId = providerProfile?._id;
    if (!providerId) {
      setBookingError(
        "Provider profile not found. Please complete your provider profile first.",
      );
      return;
    }

    try {
      setBookingSubmitting(true);
      await axios.post("/booking/create", {
        eventId: selectedEventId,
        talentId: id,
        providerId,
        bookingDate: bookingDate || undefined,
      });
      setBookingSuccess("Booking request sent successfully!");
      setShowBookModal(false);
      fetchMyBookings();
    } catch (err) {
      setBookingError(err.response?.data?.message || "Error creating booking.");
    } finally {
      setBookingSubmitting(false);
    }
  };

  const handleBookingStatus = async (bookingId, status) => {
    try {
      await axios.put(`/booking/update/${bookingId}`, { status });
      fetchMyBookings();
    } catch {
      // silent fail
    }
  };

  // ── navigate to payment page — only THIS talent (on their own profile) ──
  const handlePayNow = (booking) => {
    if (!isThisTalent) return;
    navigate(`/payment/${booking._id}`, { state: { booking } });
  };

  // submit review
  const handleSubmitReview = async () => {
    setSubmitError("");
    setSubmitSuccess("");

    const user = JSON.parse(localStorage.getItem("user") || "null");
    const userId = user?._id;
    const receiverId = talent?.userId?._id;

    if (!userId) {
      setSubmitError("You must be logged in to submit a review");
      return;
    }
    if (!receiverId) {
      setSubmitError("Invalid talent profile");
      return;
    }
    if (rating === 0) {
      setSubmitError("Please select a rating");
      return;
    }
    if (!comment.trim()) {
      setSubmitError("Please write a comment");
      return;
    }

    try {
      setSubmitLoading(true);
      await axios.post("/review/add", {
        giverId: userId,
        receiverId,
        rating,
        comment,
      });
      setSubmitSuccess("Review submitted successfully!");
      setRating(0);
      setComment("");
      fetchReviews();
    } catch (err) {
      setSubmitError(err.response?.data?.message || "Error submitting review");
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!talent) {
    return (
      <div className="p-10 text-center text-gray-400">Profile not found</div>
    );
  }

  const initials = talent.userId?.name?.charAt(0).toUpperCase();

  const expertiseBadge = {
    Beginner: "bg-gray-100 text-gray-500 border-gray-200",
    Intermediate: "bg-amber-50 text-amber-600 border-amber-200",
    Expert: "bg-green-50 text-green-600 border-green-200",
  };

  const renderStars = (value, size = "text-base") =>
    Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={`${size} ${i < value ? "text-amber-400" : "text-gray-200"}`}
      >
        ★
      </span>
    ));

  const statusColors = {
    pending: "bg-yellow-50 text-yellow-600 border-yellow-200",
    confirmed: "bg-green-50 text-green-600 border-green-200",
    cancelled: "bg-red-50 text-red-500 border-red-200",
    completed: "bg-blue-50 text-blue-600 border-blue-200",
  };
  const statusDot = {
    pending: "bg-yellow-400",
    confirmed: "bg-green-500",
    cancelled: "bg-red-400",
    completed: "bg-blue-500",
  };

  const paymentStatusColors = {
    pending: "bg-yellow-50 text-yellow-600 border-yellow-200",
    completed: "bg-green-50 text-green-600 border-green-200",
    failed: "bg-red-50 text-red-500 border-red-200",
    refunded: "bg-purple-50 text-purple-600 border-purple-200",
  };
  const paymentStatusDot = {
    pending: "bg-yellow-400",
    completed: "bg-green-500",
    failed: "bg-red-400",
    refunded: "bg-purple-500",
  };

  const methodIcons = { UPI: "📱", Card: "💳", NetBanking: "🏦", Cash: "💵" };

  // ── NEW: inModal prop so Pay Now can close the modal before navigating ──
  const BookingCard = ({ booking, inModal = false }) => {
    const alreadyPaid = paidBookingIds.has(String(booking._id));
    return (
      <div key={booking._id} className="border border-gray-100 rounded-xl p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize mb-2 ${statusColors[booking.status]}`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${statusDot[booking.status]}`}
              />
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
                    day: "numeric",
                    month: "short",
                    year: "numeric",
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
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>

          <div className="flex flex-col gap-1.5 flex-shrink-0">
            {/* Talent action buttons — only THIS talent sees */}
            {isThisTalent && (
              <>
                {booking.status === "pending" && (
                  <>
                    <button
                      onClick={() =>
                        handleBookingStatus(booking._id, "confirmed")
                      }
                      className="text-[10px] font-semibold text-green-600 border border-green-200 px-2.5 py-1 rounded-lg"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() =>
                        handleBookingStatus(booking._id, "cancelled")
                      }
                      className="text-[10px] font-semibold text-red-500 border border-red-200 px-2.5 py-1 rounded-lg"
                    >
                      Reject
                    </button>
                  </>
                )}
                {booking.status === "confirmed" && (
                  <button
                    onClick={() =>
                      handleBookingStatus(booking._id, "completed")
                    }
                    className="text-[10px] font-semibold text-blue-600 border border-blue-200 px-2.5 py-1 rounded-lg"
                  >
                    Complete
                  </button>
                )}
              </>
            )}

            {/* ── NEW: show Pay Now only if not already paid; show ✓ Paid badge if paid ── */}
            {isThisTalent && booking.status === "confirmed" && !alreadyPaid && (
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
            {isThisTalent && booking.status === "confirmed" && alreadyPaid && (
              <span className="text-[10px] font-semibold text-green-600 bg-green-50 border border-green-200 px-2.5 py-1 rounded-lg">
                ✓ Paid
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 font-[Inter]">
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* BACK */}
        <button
          onClick={() => navigate("/explore")}
          className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-gray-400 hover:text-amber-500 mb-8"
        >
          ← Back
        </button>

        {/* HERO CARD */}
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
                className={`text-[11px] font-semibold px-3 py-1 rounded-full border ${expertiseBadge[talent.expertiseLevel] || expertiseBadge.Beginner}`}
              >
                {talent.expertiseLevel || "Beginner"}
              </span>
              <span
                className={`text-[11px] font-semibold px-3 py-1 rounded-full border ${talent.availability ? "bg-green-900/30 text-green-400 border-green-500/20" : "bg-white/5 text-gray-400 border-white/10"}`}
              >
                {talent.availability ? "● Available" : "○ Unavailable"}
              </span>
              {talent.location?.city && (
                <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-white/5 text-gray-400 border border-white/10">
                  📍{" "}
                  {[
                    talent.location.city,
                    talent.location.state,
                    talent.location.country,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </span>
              )}
            </div>
          </div>

          {/* Book button — only for talent providers */}
          {isTalentProvider && (
            <button
              onClick={openBookModal}
              className="flex-shrink-0 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow transition-colors"
            >
              + Book
            </button>
          )}
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
          {[
            {
              label: "Rating",
              value: averageRating ? parseFloat(averageRating).toFixed(1) : "—",
            },
            { label: "Reviews", value: totalReviews || 0 },
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
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            </div>
          ))}
        </div>

        {/* SKILLS */}
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

        {/* PROFESSIONAL + PORTFOLIO */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
              Professional
            </p>
            <div className="flex flex-col gap-2.5">
              {[
                { k: "Expertise", v: talent.expertiseLevel },
                { k: "Experience", v: `${talent.experience || 0} years` },
                {
                  k: "Hourly Rate",
                  v: talent.hourlyRate ? `₹${talent.hourlyRate}/hr` : "—",
                },
                { k: "Email", v: talent.userId?.email },
              ].map((row) => (
                <div key={row.k} className="flex justify-between text-xs">
                  <span className="text-gray-400">{row.k}</span>
                  <span className="font-semibold text-gray-800">{row.v}</span>
                </div>
              ))}
            </div>
          </div>
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

        {/* BOOKINGS SECTION */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm mt-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Bookings
              {myBookings.length > 0 && (
                <span className="ml-2 text-amber-500">{myBookings.length}</span>
              )}
            </p>
            <div className="flex items-center gap-2">
              {myBookings.length > 1 && (
                <button
                  onClick={() => setShowAllBookingsModal(true)}
                  className="text-xs text-amber-600 font-semibold hover:text-amber-700 transition-colors"
                >
                  View All ({myBookings.length})
                </button>
              )}
              {isTalentProvider && (
                <button
                  onClick={openBookModal}
                  className="text-xs text-amber-600 font-semibold hover:text-amber-700 transition-colors"
                >
                  + New Booking
                </button>
              )}
            </div>
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
              No bookings yet for this talent.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              <BookingCard booking={myBookings[0]} />
              {myBookings.length > 1 && (
                <button
                  onClick={() => setShowAllBookingsModal(true)}
                  className="text-xs text-center text-gray-400 hover:text-amber-500 border border-dashed border-gray-200 hover:border-amber-300 rounded-xl py-2.5 transition-colors"
                >
                  +{myBookings.length - 1} more booking
                  {myBookings.length - 1 > 1 ? "s" : ""} — tap to view all
                </button>
              )}
            </div>
          )}
        </div>

        {/* REVIEWS LIST */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm mt-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Reviews
            </p>
            {totalReviews > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="flex">
                  {renderStars(Math.round(averageRating))}
                </div>
                <span className="text-sm font-bold text-gray-800">
                  {parseFloat(averageRating).toFixed(1)}
                </span>
                <span className="text-xs text-gray-400">({totalReviews})</span>
              </div>
            )}
          </div>

          {reviewLoading ? (
            <div className="flex justify-center py-6">
              <div className="w-6 h-6 border-4 border-gray-200 border-t-amber-500 rounded-full animate-spin" />
            </div>
          ) : reviews.length === 0 ? (
            <p className="text-xs text-gray-300 text-center py-4">
              No reviews yet. Be the first to review!
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {reviews.slice(0, 1).map((review) => (
                <div
                  key={review._id}
                  className="border border-gray-100 rounded-xl p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold text-xs">
                        {review.giverId?.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-800">
                          {review.giverId?.name}
                        </p>
                        <p className="text-[10px] text-gray-400 capitalize">
                          {review.giverId?.role}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex justify-end">
                        {renderStars(review.rating, "text-sm")}
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {new Date(review.createdAt).toLocaleDateString(
                          "en-IN",
                          { day: "numeric", month: "short", year: "numeric" },
                        )}
                      </p>
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-xs text-gray-600 mt-2.5 leading-relaxed">
                      {review.comment}
                    </p>
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

        {/* WRITE A REVIEW */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm mt-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">
            Write a Review
          </p>
          <div className="mb-3">
            <label className="text-xs text-gray-400 font-semibold mb-1 block">
              Rating
            </label>
            <div className="flex gap-1">
              {Array.from({ length: 5 }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onMouseEnter={() => setHoveredStar(i + 1)}
                  onMouseLeave={() => setHoveredStar(0)}
                  onClick={() => setRating(i + 1)}
                  className="text-2xl transition-transform hover:scale-110 focus:outline-none"
                >
                  <span
                    className={
                      i < (hoveredStar || rating)
                        ? "text-amber-400"
                        : "text-gray-200"
                    }
                  >
                    ★
                  </span>
                </button>
              ))}
              {rating > 0 && (
                <span className="text-xs text-gray-400 self-center ml-1">
                  {
                    ["", "Poor", "Fair", "Good", "Very Good", "Excellent"][
                      rating
                    ]
                  }
                </span>
              )}
            </div>
          </div>
          <div className="mb-4">
            <label className="text-xs text-gray-400 font-semibold mb-1 block">
              Comment
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience..."
              rows={3}
              className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-100 transition resize-none"
            />
          </div>
          {submitError && (
            <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2 mb-3">
              {submitError}
            </p>
          )}
          {submitSuccess && (
            <p className="text-xs text-green-600 bg-green-50 border border-green-100 rounded-xl px-3 py-2 mb-3">
              {submitSuccess}
            </p>
          )}
          <button
            onClick={handleSubmitReview}
            disabled={submitLoading}
            className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white text-xs font-bold py-2.5 rounded-xl transition"
          >
            {submitLoading ? "Submitting..." : "Submit Review"}
          </button>
        </div>
      </div>

      {/* ALL REVIEWS MODAL */}
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
                <div
                  key={review._id}
                  className="border border-gray-100 rounded-xl p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold text-xs">
                        {review.giverId?.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-800">
                          {review.giverId?.name}
                        </p>
                        <p className="text-[10px] text-gray-400 capitalize">
                          {review.giverId?.role}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex justify-end">
                        {renderStars(review.rating, "text-sm")}
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {new Date(review.createdAt).toLocaleDateString(
                          "en-IN",
                          { day: "numeric", month: "short", year: "numeric" },
                        )}
                      </p>
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-xs text-gray-600 mt-2.5 leading-relaxed">
                      {review.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ALL BOOKINGS MODAL */}
      {showAllBookingsModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={(e) =>
            e.target === e.currentTarget && setShowAllBookingsModal(false)
          }
        >
          <div className="bg-white w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  All Bookings
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {myBookings.length} booking
                  {myBookings.length !== 1 ? "s" : ""} for {talent.userId?.name}
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

            {isTalentProvider && (
              <div className="px-6 py-4 border-t border-gray-100">
                <button
                  onClick={() => {
                    setShowAllBookingsModal(false);
                    openBookModal();
                  }}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold py-2.5 rounded-xl transition"
                >
                  + New Booking
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* BOOKING MODAL */}
      {showBookModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) =>
            e.target === e.currentTarget && setShowBookModal(false)
          }
        >
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  Book Talent
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Select an event to book {talent.userId?.name}
                </p>
              </div>
              <button
                onClick={() => setShowBookModal(false)}
                className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 text-sm transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="px-6 py-5 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  Select Event <span className="text-red-400">*</span>
                </label>
                {eventsLoading ? (
                  <div className="flex items-center gap-2 text-xs text-gray-400 py-2">
                    <div className="w-4 h-4 border-2 border-gray-200 border-t-amber-500 rounded-full animate-spin" />
                    Loading events...
                  </div>
                ) : events.length === 0 ? (
                  <p className="text-xs text-gray-400 py-2">
                    No open events available right now.
                  </p>
                ) : (
                  <select
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-900 outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
                  >
                    <option value="">— Choose an event —</option>
                    {events.map((event) => (
                      <option key={event._id} value={event._id}>
                        {event.title}
                        {event.eventDate
                          ? ` · ${new Date(event.eventDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
                          : ""}
                        {event.location?.city
                          ? ` · ${event.location.city}`
                          : ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  Booking Date (optional)
                </label>
                <input
                  type="date"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-900 outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
                />
              </div>

              {bookingError && (
                <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                  {bookingError}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => setShowBookModal(false)}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBooking}
                disabled={bookingSubmitting || events.length === 0}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                {bookingSubmitting ? "Booking..." : "Confirm Booking"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};
