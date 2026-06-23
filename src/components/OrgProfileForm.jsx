import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Zap, Building2, Hash, MapPin, DollarSign, Tag, BookOpen } from "lucide-react";

const FOCUS_AREAS = [
  { value: "Education", label: "Education" },
  { value: "STEM", label: "STEM" },
  { value: "FIRST Robotics", label: "FIRST Robotics (FRC/FTC)" },
  { value: "Environment", label: "Environment" },
  { value: "Arts", label: "Arts" },
];

const inputBase =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200";

export default function OrgProfileForm({ onScanComplete, onScanStart, onFormSubmit }) {
  const [form, setForm] = useState({
    nonprofit_name: "",
    ein_number: "",
    focus_area: "",
    annual_budget: "",
    location: "",
    mission_keywords: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nonprofit_name || !form.ein_number || !form.focus_area) {
      setError("Please fill in the required fields: Organization Name, EIN, and Focus Area.");
      return;
    }
    setError(null);
    setLoading(true);
    setSubmitted(true);
    try {
      await onFormSubmit({
        ...form,
        annual_budget: form.annual_budget ? parseFloat(form.annual_budget) : null,
      });
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-5"
    >
      {/* Org Name */}
      <div className="flex flex-col gap-1.5">
        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <Building2 size={12} /> Organization Name <span className="text-indigo-500">*</span>
        </label>
        <input
          className={inputBase}
          name="nonprofit_name"
          value={form.nonprofit_name}
          onChange={handleChange}
          placeholder="e.g. Robotics for All Foundation"
        />
      </div>

      {/* EIN */}
      <div className="flex flex-col gap-1.5">
        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <Hash size={12} /> EIN Number <span className="text-indigo-500">*</span>
        </label>
        <input
          className={inputBase}
          name="ein_number"
          value={form.ein_number}
          onChange={handleChange}
          placeholder="e.g. 12-3456789"
        />
      </div>

      {/* Focus Area */}
      <div className="flex flex-col gap-1.5">
        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <Tag size={12} /> Focus Area <span className="text-indigo-500">*</span>
        </label>
        <select
          className={inputBase + " cursor-pointer"}
          name="focus_area"
          value={form.focus_area}
          onChange={handleChange}
        >
          <option value="">Select your primary focus area…</option>
          {FOCUS_AREAS.map((fa) => (
            <option key={fa.value} value={fa.value}>
              {fa.label}
            </option>
          ))}
        </select>
      </div>

      {/* Location */}
      <div className="flex flex-col gap-1.5">
        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <MapPin size={12} /> Location
        </label>
        <input
          className={inputBase}
          name="location"
          value={form.location}
          onChange={handleChange}
          placeholder="e.g. Austin, Texas"
        />
      </div>

      {/* Annual Budget */}
      <div className="flex flex-col gap-1.5">
        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <DollarSign size={12} /> Annual Budget ($)
        </label>
        <input
          className={inputBase}
          name="annual_budget"
          type="number"
          min="0"
          value={form.annual_budget}
          onChange={handleChange}
          placeholder="e.g. 50000"
        />
      </div>

      {/* Mission Keywords */}
      <div className="flex flex-col gap-1.5">
        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <BookOpen size={12} /> Mission & Keywords
        </label>
        <textarea
          className={inputBase + " resize-none min-h-[90px]"}
          name="mission_keywords"
          value={form.mission_keywords}
          onChange={handleChange}
          placeholder="Describe your mission, programs, and key words (e.g. 'FTC robotics team, low-income youth, STEM outreach, Title I schools')"
        />
        <p className="text-xs text-slate-400">The AI uses these to find your best-fit grants.</p>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600"
        >
          {error}
        </motion.div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed px-5 py-3.5 text-sm font-semibold text-white transition-all duration-200 shadow-md shadow-indigo-200"
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Scanning Grants…
          </>
        ) : (
          <>
            <Zap size={16} />
            Scan Eligible Grants
          </>
        )}
      </button>
    </motion.form>
  );
}