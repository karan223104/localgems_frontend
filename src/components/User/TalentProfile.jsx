import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

export const TalentProfile = () => {

  // ── ALL HOOKS FIRST (Rules of Hooks — no early returns before this line) ──
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

  // ── CONDITIONAL RENDERS (all hooks done above) ──

  if (!user?._id) {
    navigate("/");
    return null;
  }

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

  const inputCls = "w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-900 placeholder:text-gray-300 outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition";
  const labelCls = "block text-xs font-medium text-gray-500 mb-1.5";
  const sectionTitle = "text-[11px] font-semibold text-amber-500 uppercase tracking-widest pb-2.5 border-b border-gray-100 mb-4";

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

        {/* ── EMPTY STATE ── */}
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
              {/* ambient glow */}
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
                { label: "Rating",      value: profile.ratingAverage?.toFixed(1) || "—" },
                { label: "Reviews",     value: profile.totalReviews || 0 },
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
                      <a
                        key={u} href={ensureProtocol(u)} target="_blank" rel="noreferrer"
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

          </div>
        )}
      </div>

      {/* ── MODAL ── */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl">

            {/* Header */}
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

            {/* Body */}
            <div className="overflow-y-auto px-6 py-5 flex flex-col gap-5 flex-1">

              {/* Basic Info */}
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

              {/* Skills */}
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
                  <button
                    onClick={addSkill}
                    className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-600 border border-amber-200 text-sm font-medium rounded-xl flex-shrink-0 transition-colors"
                  >
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

              {/* Professional */}
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

              {/* Location */}
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

              {/* Portfolio */}
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
                  <button
                    onClick={addPortfolio}
                    className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-600 border border-amber-200 text-sm font-medium rounded-xl flex-shrink-0 transition-colors"
                  >
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
                {saving ? "Saving..." : profile ? "Update Profile" : "Create Profile"}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
