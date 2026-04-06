import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate, useLocation } from "react-router-dom";

export const PaymentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { bookingId } = useParams();

  const [booking, setBooking] = useState(location.state?.booking || null);
  const [application] = useState(location.state?.application || null);
  const [event] = useState(location.state?.event || null);

  const [bookingLoading, setBookingLoading] = useState(
    !location.state?.booking && !location.state?.application
  );
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loggedUser = JSON.parse(localStorage.getItem("user") || "null");

  useEffect(() => {
    if (booking || application) { setBookingLoading(false); return; }
    if (bookingId) {
      const fetchBooking = async () => {
        try {
          const res = await axios.get(`/booking/${bookingId}`);
          setBooking(res.data.data);
        } catch {
          setError("Could not load booking details.");
        } finally {
          setBookingLoading(false);
        }
      };
      fetchBooking();
    }
  }, [bookingId]);

  useEffect(() => {
    const budget =
      booking?.eventId?.budget ||
      event?.budget ||
      application?.eventId?.budget;
    if (budget && Number(budget) > 0) {
      setAmount(String(budget));
    }
  }, [booking, event, application]);

  const isAuthorized = loggedUser?.role === "talent";

  const handlePayment = async () => {
    setError("");
    setSuccess("");

    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        payerId: loggedUser._id,
        amount: Number(amount),
        paymentMethod,
        paymentStatus: "completed",
        paymentDate: new Date().toISOString(),
      };

      if (booking) {
        // ── Booking flow ──
        payload.bookingId = booking._id;
        payload.receiverId = booking?.providerId?._id || booking?.providerId;

        if (!payload.receiverId) {
          setError("Could not determine payment receiver for this booking.");
          setSubmitting(false);
          return;
        }
      } else if (application) {
        // ── Event application flow (no booking) ──
        const ev = event || application?.eventId;
        payload.eventId = ev?._id || ev;
        payload.applicationId = application._id;

        // Try every possible path to find the provider's user ID
        const receiverId =
          ev?.talentproviderId?._id ||
          ev?.talentproviderId ||
          ev?.providerId?._id ||
          ev?.providerId ||
          ev?.userId?._id ||
          ev?.userId ||
          application?.talentproviderId?._id ||
          application?.talentproviderId;

        if (!receiverId) {
          setError(
            "Could not determine payment receiver. The event may not have provider details loaded. Please go back and try again."
          );
          setSubmitting(false);
          return;
        }

        payload.receiverId = receiverId;
      }

      await axios.post("/payment", payload);
      setSuccess("Payment recorded successfully!");
      setTimeout(() => navigate(-1), 1800);
    } catch (err) {
      setError(err.response?.data?.message || "Payment failed. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (bookingLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-3 px-4">
        <div className="text-4xl">🔒</div>
        <p className="text-sm font-semibold text-gray-500 text-center">
          You are not authorized to make a payment.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="mt-2 text-xs font-bold text-amber-600 hover:underline"
        >
          ← Go back
        </button>
      </div>
    );
  }

  const ev = event || booking?.eventId || application?.eventId;
  const eventTitle = ev?.title || "Event";
  const providerName =
    booking?.providerId?.organizationName ||
    booking?.providerId?.name ||
    ev?.providerId?.organizationName ||
    ev?.providerId?.name ||
    "Provider";

  const methodIcons = { UPI: "📱", Card: "💳", NetBanking: "🏦", Cash: "💵" };
  const statusLabel = booking?.status || "accepted";

  return (
    <div className="min-h-screen bg-gray-50 font-[Inter] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-gray-400 hover:text-amber-500 mb-8"
        >
          ← Back
        </button>

        <div className="bg-gray-900 rounded-2xl p-6 mb-4 relative overflow-hidden shadow-lg">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">
            Payment for event
          </p>
          <h1 className="text-white font-bold text-xl">{eventTitle}</h1>
          <p className="text-gray-400 text-xs mt-1">To: {providerName}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-[11px] font-semibold px-3 py-1 rounded-full border bg-green-900/30 text-green-400 border-green-500/20">
              ● {statusLabel}
            </span>
            {(booking?.bookingDate || application?.createdAt) && (
              <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-white/5 text-gray-400 border border-white/10">
                📅{" "}
                {new Date(
                  booking?.bookingDate || application?.createdAt
                ).toLocaleDateString("en-IN", {
                  day: "numeric", month: "short", year: "numeric",
                })}
              </span>
            )}
            {amount && (
              <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/20">
                ₹{Number(amount).toLocaleString("en-IN")}
              </span>
            )}
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
            Payment Details
          </p>

          <div>
            <label className="text-xs text-gray-400 font-semibold mb-1.5 block">
              Amount (₹) <span className="text-red-400">*</span>
              {ev?.budget > 0 && (
                <span className="ml-2 text-[10px] text-green-500 font-normal bg-green-50 px-1.5 py-0.5 rounded-full">
                  auto-filled
                </span>
              )}
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-100 transition font-semibold"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 font-semibold mb-2 block">
              Payment Method <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {["UPI", "Card", "NetBanking", "Cash"].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPaymentMethod(m)}
                  className={`flex items-center gap-2 text-xs font-semibold px-3 py-2.5 rounded-xl border transition-colors ${
                    paymentMethod === m
                      ? "bg-amber-50 border-amber-400 text-amber-700"
                      : "border-gray-200 text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <span>{methodIcons[m]}</span> {m}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
              {error}
            </p>
          )}
          {success && (
            <p className="text-xs text-green-600 bg-green-50 border border-green-100 rounded-xl px-3 py-2">
              ✅ {success}
            </p>
          )}

          <button
            onClick={handlePayment}
            disabled={submitting || !!success}
            className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white text-xs font-bold py-3 rounded-xl transition mt-1"
          >
            {submitting
              ? "Processing..."
              : `Confirm Payment ₹${amount ? Number(amount).toLocaleString("en-IN") : "—"}`}
          </button>
        </div>
      </div>
    </div>
  );
};
