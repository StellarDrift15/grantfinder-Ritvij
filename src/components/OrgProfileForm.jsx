import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Zap, Building2, Hash, MapPin, DollarSign, Tag, BookOpen, HelpCircle } from "lucide-react";

const FOCUS_AREAS = [
  { value: "Education", label: "Education" },
  { value: "STEM", label: "STEM" },
  { value: "FIRST Robotics", label: "FIRST Robotics (FRC/FTC)" },
  { value: "Environment", label: "Environment" },
  { value: "Arts", label: "Arts" },
  { value: "Human Services", label: "Human Services" },
];

// Category-specific eligibility questions
const CATEGORY_QUESTIONS = {
  Education: [
    { name: "years_of_programming", label: "Years of Programming", type: "select", options: ["Less than 1 year", "1–2 years", "3–5 years", "5+ years"], hint: "Some grants require 3–5+ years of history." },
    { name: "serves_low_income_youth", label: "Do you serve low-income or Title I school youth?", type: "select", options: ["Yes", "No"], hint: "Many education grants prioritize underserved communities." },
    { name: "age_range_served", label: "Primary Age Range Served", type: "select", options: ["Early childhood (0–5)", "K–12", "High school (9–12)", "College/Post-secondary", "Adults"], hint: "Helps match grants by target age group." },
    { name: "geographic_reach", label: "Geographic Reach", type: "select", options: ["Local/neighborhood", "City-wide", "County-wide", "State-wide", "National"], hint: "Some funders like Hearst or Truist fund specific regions." },
  ],
  STEM: [
    { name: "years_of_programming", label: "Years of Programming", type: "select", options: ["Less than 1 year", "1–2 years", "3–5 years", "5+ years"], hint: "Some grants require 3–5+ years of history." },
    { name: "serves_disabilities", label: "Do you serve youth with disabilities?", type: "select", options: ["Yes", "No"], hint: "Mitsubishi Electric and CTA Foundation specifically fund disability-inclusive STEM." },
    { name: "age_range_served", label: "Primary Age Range Served", type: "select", options: ["K–8", "High school (9–12)", "College/Post-secondary", "Adults"], hint: "Helps match grants like Best Buy Teen Tech (teens only)." },
    { name: "serves_low_income_youth", label: "Do you serve low-income or underserved youth?", type: "select", options: ["Yes", "No"], hint: "Best Buy, Motorola, and others require underserved community focus." },
  ],
  "FIRST Robotics": [
    { name: "robotics_program_type", label: "Program Type", type: "select", options: ["FTC (First Tech Challenge)", "FRC (FIRST Robotics Competition)", "FLL (FIRST LEGO League)", "Multiple programs"], hint: "Helps identify robotics-specific sponsors like Haas, Swyft, Polymaker." },
    { name: "team_number", label: "Team Number (optional)", type: "text", placeholder: "e.g. FRC 1234 or FTC 5678", hint: "Useful for sponsor verification." },
    { name: "serves_low_income_youth", label: "Does your team serve low-income or underrepresented youth?", type: "select", options: ["Yes", "No"], hint: "Boosts eligibility for equity-focused grants." },
    { name: "years_of_programming", label: "Years Active", type: "select", options: ["Less than 1 year", "1–2 years", "3–5 years", "5+ years"], hint: "Longer history increases credibility for larger grants." },
    { name: "school_affiliation", label: "School/Community Affiliation", type: "select", options: ["Public school team", "Private school team", "Community/independent team", "Other"], hint: "Affects eligibility for school-based grants like Publix." },
  ],
  Environment: [
    { name: "environmental_focus", label: "Primary Environmental Focus", type: "select", options: ["Conservation/wildlife", "Climate/energy", "Sustainability/green communities", "Environmental education", "Open space/parks"], hint: "Matches to funders like MDU, Cafritz, and Block Foundation." },
    { name: "geographic_reach", label: "Geographic Reach", type: "select", options: ["Local/neighborhood", "City-wide", "County-wide", "State-wide", "National"], hint: "Some funders like Mazda are region-specific." },
    { name: "serves_low_income_communities", label: "Do you serve low-income communities?", type: "select", options: ["Yes", "No"], hint: "Bank of America prioritizes LMI/BIPOC environmental work." },
    { name: "years_of_programming", label: "Years of Programming", type: "select", options: ["Less than 1 year", "1–2 years", "3–5 years", "5+ years"], hint: "Eligibility requirement for NEA and others." },
  ],
  Arts: [
    { name: "years_of_programming", label: "Years of Arts Programming", type: "select", options: ["Less than 3 years", "3–5 years", "5–10 years", "10+ years"], hint: "NEA requires 5+ years; Southern Cultural Treasures also has requirements." },
    { name: "arts_discipline", label: "Primary Arts Discipline", type: "select", options: ["Visual arts", "Performing arts (music/dance/theater)", "Literary arts", "Film/media", "Folk & traditional arts", "Multi-disciplinary"], hint: "NEA GAP and Southern Arts fund specific disciplines." },
    { name: "bipoc_led", label: "Is your organization BIPOC-led?", type: "select", options: ["Yes", "No"], hint: "Southern Cultural Treasures specifically funds BIPOC-led arts organizations." },
    { name: "serves_underserved_communities", label: "Do you serve underserved communities?", type: "select", options: ["Yes", "No"], hint: "Many arts funders like Cafritz and NEA prioritize community access." },
    { name: "annual_operating_expenses", label: "Annual Operating Expenses", type: "select", options: ["Under $20k", "$20k–$100k", "$100k–$500k", "$500k+"], hint: "NEA requires minimum $20k in operating expenses." },
  ],
  "Human Services": [
    { name: "population_served", label: "Primary Population Served", type: "select", options: ["Children/youth", "Seniors", "Persons with disabilities", "Immigrants/refugees", "Domestic violence survivors", "Homeless individuals", "Veterans", "General community"], hint: "Critical for matching to specialized funders like Ray Solem or OVW." },
    { name: "serves_low_income", label: "Do you primarily serve low-income individuals?", type: "select", options: ["Yes", "No"], hint: "Most human services funders like Bank of America require this." },
    { name: "geographic_reach", label: "Geographic Reach", type: "select", options: ["Local/neighborhood", "City-wide", "County-wide", "State-wide", "National"], hint: "Funders like Cafritz (DC-area), Publix (Southeast), and others are region-specific." },
    { name: "service_type", label: "Primary Service Type", type: "select", options: ["Basic needs (food/shelter/clothing)", "Workforce development", "Mental health/counseling", "Housing assistance", "Legal services", "Youth programs", "Healthcare access"], hint: "Helps match Bank of America, Truist, and Walmart grants." },
    { name: "years_of_programming", label: "Years of Programming", type: "select", options: ["Less than 1 year", "1–2 years", "3–5 years", "5+ years"], hint: "Track record required by most institutional funders." },
  ],
};

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
  const [categoryAnswers, setCategoryAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === "focus_area") setCategoryAnswers({});
  };

  const handleCategoryChange = (e) => {
    const { name, value } = e.target;
    setCategoryAnswers((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nonprofit_name || !form.ein_number || !form.focus_area) {
      setError("Please fill in the required fields: Organization Name, EIN, and Focus Area.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      // Build a combined eligibility context from category-specific answers
      const categoryContext = Object.entries(categoryAnswers)
        .map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`)
        .join("; ");

      const enrichedKeywords = [form.mission_keywords, categoryContext].filter(Boolean).join(". ");

      await onFormSubmit({
        ...form,
        annual_budget: form.annual_budget ? parseFloat(form.annual_budget) : null,
        mission_keywords: enrichedKeywords,
        eligibility_details: categoryAnswers,
      });
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const categoryQuestions = CATEGORY_QUESTIONS[form.focus_area] || [];

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

      {/* Category-Specific Eligibility Questions */}
      <AnimatePresence>
        {categoryQuestions.length > 0 && (
          <motion.div
            key={form.focus_area}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-4 rounded-2xl bg-indigo-50 border border-indigo-100 p-4"
          >
            <div className="flex items-center gap-2">
              <HelpCircle size={14} className="text-indigo-500 shrink-0" />
              <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                {form.focus_area} Eligibility Questions
              </span>
            </div>
            <p className="text-xs text-indigo-500 -mt-2">These help the AI find your best-matched grants.</p>
            {categoryQuestions.map((q) => (
              <div key={q.name} className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600">{q.label}</label>
                {q.type === "select" ? (
                  <select
                    className={inputBase + " cursor-pointer"}
                    name={q.name}
                    value={categoryAnswers[q.name] || ""}
                    onChange={handleCategoryChange}
                  >
                    <option value="">Select…</option>
                    {q.options.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    className={inputBase}
                    name={q.name}
                    value={categoryAnswers[q.name] || ""}
                    onChange={handleCategoryChange}
                    placeholder={q.placeholder || ""}
                  />
                )}
                {q.hint && <p className="text-xs text-slate-400">{q.hint}</p>}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

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