import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Zap,
  Building2,
  Hash,
  MapPin,
  DollarSign,
  Tag,
  BookOpen,
  HelpCircle,
  Search,
  CheckCircle2,
} from "lucide-react";
import { base44 } from "@/api/base44Client";

const FOCUS_AREAS = [
  { value: "STEM", label: "STEM" },
  { value: "FIRST Robotics", label: "FIRST Robotics (FRC/FTC)" },
  { value: "FIRST LEGO League (FLL)", label: "FIRST LEGO League (FLL)" },
  { value: "Education", label: "Education" },
  { value: "Youth Education", label: "Youth education" },
  { value: "Community Outreach", label: "Community outreach" },
  { value: "Environment", label: "Environment" },
  { value: "Arts", label: "Arts" },
  { value: "Human Services", label: "Human services" },
  { value: "Health & Wellness", label: "Health & wellness" },
  { value: "Workforce Development", label: "Workforce development" },
  { value: "Hackathon (Virtual)", label: "Hackathon (virtual)" },
  { value: "Hackathon (In-Person)", label: "Hackathon (in-person)" },
];

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
  "FIRST LEGO League (FLL)": [
    { name: "fll_program_level", label: "FLL Program Level", type: "select", options: ["FLL Discover (ages 4–6)", "FLL Explore (ages 6–10)", "FLL Challenge (ages 9–16)", "Multiple levels"], hint: "FLL has age-divided subprograms; some grants fund specific levels." },
    { name: "team_number", label: "Team Number (optional)", type: "text", placeholder: "e.g. FLL 12345", hint: "Useful for sponsor verification." },
    { name: "serves_low_income_youth", label: "Do you serve low-income or underrepresented youth?", type: "select", options: ["Yes", "No"], hint: "Boosts eligibility for equity-focused grants." },
    { name: "years_of_programming", label: "Years Active", type: "select", options: ["Less than 1 year", "1–2 years", "3–5 years", "5+ years"], hint: "Longer history increases credibility for larger grants." },
    { name: "school_affiliation", label: "School/Community Affiliation", type: "select", options: ["Public school team", "Private school team", "Community/independent team", "Other"], hint: "Affects eligibility for school-based grants." },
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

const labelBase = "flex items-center gap-1.5 text-[11.5px] font-semibold tracking-[0.08em] uppercase text-gf-mid mb-2";
const inputBase =
  "w-full rounded-xl border border-gf-line bg-[rgba(7,11,20,0.55)] px-3.5 py-2.5 text-sm text-gf-hi placeholder:text-[#475569] focus:outline-none focus:border-[rgba(139,92,246,0.55)] focus:shadow-[0_0_0_3px_rgba(139,92,246,0.14)] transition";

export default function OrgProfileForm({ onFormSubmit }) {
  const [form, setForm] = useState({
    nonprofit_name: "",
    ein_number: "",
    focus_area: [],
    annual_budget: "",
    location: "",
    mission_keywords: "",
  });
  const [categoryAnswers, setCategoryAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [einLooking, setEinLooking] = useState(false);
  const [einResult, setEinResult] = useState(null);
  const [einError, setEinError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const toggleTag = (value) => {
    setForm((prev) => {
      const current = Array.isArray(prev.focus_area) ? prev.focus_area : [];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, focus_area: next };
    });
    setCategoryAnswers({});
  };

  const handleEinLookup = async () => {
    const digits = form.ein_number.replace(/[^0-9]/g, "");
    if (digits.length !== 9) return;
    setEinLooking(true);
    setEinError(null);
    setEinResult(null);
    try {
      const res = await base44.functions.invoke("einLookup", { ein: form.ein_number });
      const data = res?.data || res;
      setEinResult(data);
      setForm((prev) => ({
        ...prev,
        nonprofit_name: prev.nonprofit_name || data.name || "",
        location: prev.location || data.location || "",
      }));
    } catch (err) {
      setEinError(err?.response?.data?.error || err?.message || "Lookup failed.");
    } finally {
      setEinLooking(false);
    }
  };

  const handleCategoryChange = (e) => {
    const { name, value } = e.target;
    setCategoryAnswers((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const areas = Array.isArray(form.focus_area) ? form.focus_area : [];
    if (!form.nonprofit_name || !form.ein_number || areas.length === 0) {
      setError("Please fill in the required fields: Organization Name, EIN, and at least one Focus Area.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
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

  const categoryQuestions = (Array.isArray(form.focus_area) ? form.focus_area : [])
    .flatMap((fa) => CATEGORY_QUESTIONS[fa] || [])
    .filter((q, i, arr) => arr.findIndex((x) => x.name === q.name) === i);

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-[18px] border border-gf-line bg-gf-panel p-6"
    >
      <div className="font-mono text-[10.5px] font-semibold tracking-[0.14em] uppercase text-gf-cyan mb-2">
        Step 1 · Organization profile
      </div>
      <h2 className="font-display text-gf-hi text-[21px] font-bold tracking-tight mb-1">Tell us who you are</h2>
      <p className="text-[13px] text-gf-low mb-5">
        The scan uses every field below to rank grants, credits, and donors by your eligibility.
      </p>

      <div className="flex flex-col gap-5">
        {/* EIN */}
        <div>
          <label className={labelBase}>
            <Hash size={13} className="text-gf-low" /> EIN number <span className="text-gf-violet">*</span>
          </label>
          <div className="flex gap-2">
            <input
              className={inputBase + " flex-1 font-mono text-[13.5px]"}
              name="ein_number"
              value={form.ein_number}
              onChange={handleChange}
              onBlur={handleEinLookup}
              placeholder="12-3456789"
            />
            <button
              type="button"
              onClick={handleEinLookup}
              disabled={einLooking || form.ein_number.replace(/[^0-9]/g, "").length !== 9}
              className="px-4 rounded-xl border text-[13px] font-semibold text-[#C4B5FD] transition hover:bg-[rgba(139,92,246,0.18)] hover:border-[rgba(139,92,246,0.55)] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              style={{ background: "rgba(139,92,246,0.10)", borderColor: "rgba(139,92,246,0.35)" }}
            >
              {einLooking ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
              {einLooking ? "Looking up" : "Look up"}
            </button>
          </div>
          {einResult && (
            <div className="flex items-start gap-2 rounded-lg bg-[rgba(52,211,153,0.08)] border border-[rgba(52,211,153,0.25)] px-3 py-2 mt-2">
              <CheckCircle2 size={14} className="text-gf-mint shrink-0 mt-0.5" />
              <div className="text-xs text-gf-mint leading-relaxed">
                Found in IRS records — name &amp; location filled in.
              </div>
            </div>
          )}
          {einError && (
            <div className="text-xs text-[#FCD34D] mt-2">{einError} You can still fill in the fields manually.</div>
          )}
          <p className="text-[12px] text-gf-low mt-2">Your 9-digit EIN autofills the rest from IRS public data.</p>
        </div>

        {/* Org name */}
        <div>
          <label className={labelBase}>
            <Building2 size={13} className="text-gf-low" /> Organization name <span className="text-gf-violet">*</span>
          </label>
          <input
            className={inputBase}
            name="nonprofit_name"
            value={form.nonprofit_name}
            onChange={handleChange}
            placeholder="Robotics for All Foundation"
          />
        </div>

        {/* Focus areas */}
        <div>
          <label className={labelBase}>
            <Tag size={13} className="text-gf-low" /> Focus areas <span className="text-gf-violet">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {FOCUS_AREAS.map((fa) => {
              const selected = Array.isArray(form.focus_area) && form.focus_area.includes(fa.value);
              return (
                <button
                  key={fa.value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleTag(fa.value)}
                  className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-medium border transition ${
                    selected
                      ? "text-[#E0F2FE] border-[rgba(34,211,238,0.6)] shadow-[0_2px_12px_-4px_rgba(34,211,238,0.35)]"
                      : "bg-[rgba(7,11,20,0.45)] border-gf-line text-gf-mid hover:border-gf-line-hi hover:text-gf-hi"
                  }`}
                  style={
                    selected
                      ? { background: "linear-gradient(120deg,rgba(139,92,246,0.16),rgba(34,211,238,0.14))" }
                      : undefined
                  }
                >
                  {fa.label}
                </button>
              );
            })}
          </div>
          <p className="text-[12px] text-gf-low mt-2">Pick every area that fits — more signal means sharper matches.</p>
        </div>

        {/* Category questions */}
        <AnimatePresence>
          {categoryQuestions.length > 0 && (
            <motion.div
              key={(form.focus_area || []).join(",")}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-4 rounded-2xl bg-[rgba(139,92,246,0.06)] border border-[rgba(139,92,246,0.18)] p-4"
            >
              <div className="flex items-center gap-2">
                <HelpCircle size={14} className="text-gf-violet shrink-0" />
                <span className="text-xs font-semibold text-[#C4B5FD] uppercase tracking-wider">
                  Eligibility questions
                </span>
              </div>
              <p className="text-xs text-gf-low -mt-2">
                Based on: {(form.focus_area || []).join(", ")} — these help the AI find your best-matched grants.
              </p>
              {categoryQuestions.map((q) => (
                <div key={q.name}>
                  <label className="text-xs font-semibold text-gf-mid mb-1.5 block">{q.label}</label>
                  {q.type === "select" ? (
                    <select
                      className={inputBase + " cursor-pointer"}
                      name={q.name}
                      value={categoryAnswers[q.name] || ""}
                      onChange={handleCategoryChange}
                    >
                      <option value="">Select…</option>
                      {q.options.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
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
                  {q.hint && <p className="text-[11px] text-gf-low mt-1">{q.hint}</p>}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Location */}
        <div>
          <label className={labelBase}>
            <MapPin size={13} className="text-gf-low" /> Location
          </label>
          <input
            className={inputBase}
            name="location"
            value={form.location}
            onChange={handleChange}
            placeholder="Austin, Texas"
          />
        </div>

        {/* Budget */}
        <div>
          <label className={labelBase}>
            <DollarSign size={13} className="text-gf-low" /> Annual budget
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-[13px] text-gf-low">$</span>
            <input
              className={inputBase + " pl-8 font-mono text-[13.5px]"}
              name="annual_budget"
              type="number"
              min="0"
              value={form.annual_budget}
              onChange={handleChange}
              placeholder="50,000"
            />
          </div>
        </div>

        {/* Mission */}
        <div>
          <label className={labelBase}>
            <BookOpen size={13} className="text-gf-low" /> Mission &amp; keywords
          </label>
          <textarea
            className={inputBase + " resize-y min-h-[96px]"}
            name="mission_keywords"
            value={form.mission_keywords}
            onChange={handleChange}
            placeholder="e.g. FTC robotics team serving low-income youth, STEM outreach in Title I schools"
          />
          <p className="text-[12px] text-gf-low mt-1.5">
            The AI weighs these words heavily when ranking your best-fit grants.
          </p>
        </div>

        {error && (
          <div className="rounded-xl bg-[rgba(248,113,113,0.1)] border border-[rgba(248,113,113,0.3)] px-4 py-3 text-sm text-[#FCA5A5]">
            {error}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full mt-6 flex items-center justify-center gap-2.5 rounded-2xl px-5 py-3.5 text-gf-hi font-display text-[15px] font-semibold transition-all duration-150 hover:-translate-y-px disabled:opacity-70 disabled:translate-y-0"
        style={{
          backgroundImage: "linear-gradient(120deg,#8B5CF6,#38BDF8 55%,#22D3EE)",
          boxShadow: "0 8px 28px -8px rgba(56,189,248,0.5),0 2px 8px -2px rgba(139,92,246,0.4)",
        }}
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Scanning 12,400+ sources…
          </>
        ) : (
          <>
            <Zap size={16} />
            Scan for funding
          </>
        )}
      </button>
      <p className="text-[11.5px] text-gf-low text-center mt-2.5">
        Searches <b className="text-gf-mid font-mono text-[11px]">12,400+</b> grants, vouchers &amp; corporate donors
      </p>
    </motion.form>
  );
}