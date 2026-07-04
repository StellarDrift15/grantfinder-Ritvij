import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ClipboardCheck,
  Loader2,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Target,
  RefreshCw,
  Globe,
  Info,
  PencilLine,
} from "lucide-react";
import { base44 } from "@/api/base44Client";

const REVIEW_SECTIONS = [
  { key: "alignment", label: "Mission Alignment", icon: Target, accent: "indigo" },
  { key: "strengths", label: "What's Strong", icon: CheckCircle2, accent: "emerald" },
  { key: "gaps", label: "What's Missing", icon: AlertTriangle, accent: "amber" },
  { key: "suggestions", label: "Specific Suggestions", icon: Lightbulb, accent: "purple" },
];

const accentMap = {
  indigo: { ring: "bg-indigo-100", text: "text-indigo-600", border: "border-indigo-100", chip: "bg-indigo-50 text-indigo-600" },
  emerald: { ring: "bg-emerald-100", text: "text-emerald-600", border: "border-emerald-100", chip: "bg-emerald-50 text-emerald-600" },
  amber: { ring: "bg-amber-100", text: "text-amber-600", border: "border-amber-100", chip: "bg-amber-50 text-amber-600" },
  purple: { ring: "bg-purple-100", text: "text-purple-600", border: "border-purple-100", chip: "bg-purple-50 text-purple-600" },
};

const inputBase =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200";

export default function DraftReviewer() {
  const [draft, setDraft] = useState("");
  const [funderName, setFunderName] = useState("");
  const [funderSuggestions, setFunderSuggestions] = useState([]);
  const [review, setReview] = useState(null);
  const [reviewing, setReviewing] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [error, setError] = useState(null);

  // "known" = pick from grant database; "other" = manually enter grant name + website + info
  const [funderMode, setFunderMode] = useState("known");
  const [customName, setCustomName] = useState("");
  const [customWebsite, setCustomWebsite] = useState("");
  const [customInfo, setCustomInfo] = useState("");

  useEffect(() => {
    (async () => {
      try {
        // Pull a large batch so all funders (incl. Gene Haas) are covered, then keep only
        // those that actually display a website/application_url on the grant finder.
        const opps = await base44.entities.FundingOpportunities.list("-created_date", 500);
        const withUrl = opps.filter((o) => o.application_url);
        const names = Array.from(new Set(withUrl.map((o) => o.provider_name).filter(Boolean))).sort();
        setFunderSuggestions(names);
      } catch {
        setFunderSuggestions([]);
      }
    })();
  }, []);

  const handleReview = async (e) => {
    e.preventDefault();
    const displayName =
      funderMode === "other" ? customName.trim() : funderName.trim();
    if (!draft.trim() || !displayName) {
      setError(
        funderMode === "other"
          ? "Please paste your draft and enter the grant name."
          : "Please paste your draft text and enter the target funder's name."
      );
      return;
    }
    setError(null);
    setReviewing(true);
    setHasReviewed(false);
    setReview(null);

    try {
      // Build the funder context the AI should roleplay as.
      let funderContext;
      if (funderMode === "other") {
        const websiteLine = customWebsite.trim() ? `\nFunder website (use this as the source of truth for their priorities): ${customWebsite.trim()}` : "";
        const infoLine = customInfo.trim() ? `\nAdditional info about this grant/funder provided by the applicant:\n"""\n${customInfo.trim()}\n"""` : "";
        funderContext = `${displayName}${websiteLine}${infoLine}`;
      } else {
        funderContext = displayName;
      }

      const prompt = `You are roleplaying as the ${displayName} grant review committee — the actual decision-makers who read applications and decide what gets funded. You know this funder's real-world priorities, preferences, and red flags.

${funderMode === "other" ? `Because the applicant entered this funder manually, rely PRIMARILY on the website and additional info below to determine ${displayName}'s priorities. If a website URL is given, treat it as the authoritative source — reason about what kind of funder runs that site and what they likely fund. Use the additional info as direct evidence of their criteria. Only fall back on general knowledge if the provided info is thin, and say so explicitly in the confidence note.

FUNDER PROFILE:
${funderContext}` : `You know this funder's real-world priorities, preferences, and red flags.`}

A nonprofit applicant has pasted the draft of the text they plan to submit to ${displayName}. Your job is to critique it the way the real review committee would, BEFORE they submit it.

DRAFT TO REVIEW:
"""
${draft}
"""

Review instructions:
1. alignment (0-100 score): How well does this draft align with what ${displayName} actually funds? Base this on ${displayName}'s known priorities (geographic focus, cause areas, population served, typical grant size, volunteer-engagement emphasis, etc.)${funderMode === "other" ? " and the website/info the applicant provided" : ""}. If you're unsure of a specific priority, say so rather than inventing one.
2. strengths: 2-4 bullet points of what's working in the draft.
3. gaps: 2-4 bullet points of what's missing or weak — specific to ${displayName}'s known review criteria.
4. suggestions: 3-5 concrete, actionable rewrite suggestions. Quote the exact phrase from the draft when relevant and show a stronger alternative. Each suggestion should reference ${displayName} by name.
5. overallVerdict: One honest paragraph (3-5 sentences) — would this draft get funded as-is? What's the single most important change before submitting?
6. confidenceNote: One sentence on how confident you are in your knowledge of ${displayName}'s actual priorities, and what the applicant should verify on the funder's official guidelines page.

Be constructive but honest. Don't sugarcoat. The applicant wants real feedback, not praise.`;

      const llmResponse = await base44.integrations.Core.InvokeLLM({
        prompt,
        model: "gpt_5_mini",
        response_json_schema: {
          type: "object",
          properties: {
            alignment: { type: "number" },
            strengths: { type: "array", items: { type: "string" } },
            gaps: { type: "array", items: { type: "string" } },
            suggestions: { type: "array", items: { type: "string" } },
            overallVerdict: { type: "string" },
            confidenceNote: { type: "string" },
          },
          required: ["alignment", "strengths", "gaps", "suggestions", "overallVerdict", "confidenceNote"],
        },
      });

      setReview(llmResponse);
      setHasReviewed(true);
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong while reviewing your draft.");
      setHasReviewed(true);
    } finally {
      setReviewing(false);
    }
  };

  const handleReset = () => {
    setReview(null);
    setHasReviewed(false);
    setError(null);
  };

  const displayName =
    funderMode === "other" ? customName.trim() : funderName.trim();

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <header className="h-14 bg-white border-b border-slate-100 flex items-center px-6 gap-3 shadow-sm">
        <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
          <ArrowLeft size={16} />
          Back to Grant Finder
        </Link>
        <div className="h-4 w-px bg-slate-200 mx-1" />
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
            <ClipboardCheck size={14} className="text-white" />
          </div>
          <span className="text-base font-bold text-slate-800 tracking-tight">Draft Reviewer</span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Inputs */}
        <aside className="w-[420px] min-w-[340px] max-w-[460px] bg-white border-r border-slate-100 overflow-y-auto">
          <div className="p-6">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-5 h-5 rounded-md bg-indigo-600 flex items-center justify-center">
                  <Sparkles size={11} className="text-white" />
                </div>
                <h1 className="text-lg font-bold text-slate-800">Review My Draft</h1>
              </div>
              <p className="text-xs text-slate-400 ml-7">
                Paste the text you plan to submit. The AI roleplays as the target funder's review committee and tells you what they'd really think.
              </p>
            </div>

            <form onSubmit={handleReview} className="flex flex-col gap-5">
              {/* Mode toggle */}
              <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setFunderMode("known")}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                    funderMode === "known" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <Target size={12} /> From Grant Database
                </button>
                <button
                  type="button"
                  onClick={() => setFunderMode("other")}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                    funderMode === "other" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <PencilLine size={12} /> Other (Enter Manually)
                </button>
              </div>

              {funderMode === "known" ? (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Target Funder <span className="text-indigo-500">*</span>
                  </label>
                  <input
                    className={inputBase}
                    list="funder-suggestions"
                    value={funderName}
                    onChange={(e) => setFunderName(e.target.value)}
                    placeholder="e.g. Walmart Community Grant, Gene Haas Foundation, Google Ad Grants"
                  />
                  <datalist id="funder-suggestions">
                    {funderSuggestions.map((n) => (
                      <option key={n} value={n} />
                    ))}
                  </datalist>
                  <p className="text-xs text-slate-400">Type the funder's name — suggestions from your grant database appear below.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4 rounded-2xl bg-indigo-50 border border-indigo-100 p-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Grant / Funder Name <span className="text-indigo-500">*</span>
                    </label>
                    <input
                      className={inputBase}
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="e.g. Acme Local STEM Grant"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      <Globe size={11} /> Grant Website
                    </label>
                    <input
                      className={inputBase}
                      type="url"
                      value={customWebsite}
                      onChange={(e) => setCustomWebsite(e.target.value)}
                      placeholder="https://example.org/grant-program"
                    />
                    <p className="text-xs text-slate-400">The AI uses this URL to reason about what the funder actually funds.</p>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      <Info size={11} /> About This Grant
                    </label>
                    <textarea
                      className={inputBase + " resize-none min-h-[80px]"}
                      value={customInfo}
                      onChange={(e) => setCustomInfo(e.target.value)}
                      placeholder="Paste anything you know: eligibility, award size, focus areas, geographic limits, deadlines, review criteria…"
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Your Draft <span className="text-indigo-500">*</span>
                </label>
                <textarea
                  className={inputBase + " resize-none min-h-[260px]"}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Paste the full text of your application answers, narrative, or cover letter here…"
                />
                <p className="text-xs text-slate-400">{draft.length} characters</p>
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">{error}</div>
              )}

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={reviewing}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed px-5 py-3.5 text-sm font-semibold text-white transition-all duration-200 shadow-md shadow-indigo-200"
                >
                  {reviewing ? (
                    <><Loader2 size={16} className="animate-spin" /> Reviewing as {displayName || "funder"}…</>
                  ) : (
                    <><Sparkles size={16} /> Review My Draft</>
                  )}
                </button>
                {hasReviewed && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-3.5 text-sm font-medium text-slate-600 transition-colors"
                  >
                    <RefreshCw size={14} /> Reset
                  </button>
                )}
              </div>
            </form>
          </div>
        </aside>

        {/* Right: Review output */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
                {error}
              </motion.div>
            )}

            {reviewing && (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                <p className="text-sm text-slate-500">
                  Reviewing your draft as the {displayName || "funder"} review committee…
                </p>
              </div>
            )}

            {!reviewing && !review && !hasReviewed && (
              <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
                  <ClipboardCheck size={24} className="text-indigo-500" />
                </div>
                <h2 className="text-base font-semibold text-slate-700 mb-1">Your funder-persona review will appear here</h2>
                <p className="text-sm text-slate-400 max-w-md leading-relaxed">
                  Paste your draft on the left, pick the funder you're submitting to, and the AI will critique it the way their actual review committee would — alignment score, strengths, gaps, and concrete rewrite suggestions.
                </p>
              </div>
            )}

            {!reviewing && !review && hasReviewed && (
              <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                  <AlertTriangle size={24} className="text-slate-400" />
                </div>
                <h2 className="text-base font-semibold text-slate-700 mb-1">No review generated</h2>
                <p className="text-sm text-slate-400 max-w-md">Try again — make sure your draft and funder name are filled in.</p>
              </div>
            )}

            {!reviewing && review && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-5">
                {/* Alignment score */}
                <div className="rounded-2xl border border-indigo-100 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Target size={16} className="text-indigo-500" />
                      <h3 className="text-sm font-semibold text-slate-700">Alignment with {displayName}</h3>
                    </div>
                    <span className={`text-xs font-bold rounded-md px-2.5 py-1 ${accentMap.indigo.chip}`}>
                      {Math.round(review.alignment)}/100
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, Math.max(0, review.alignment))}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600"
                    />
                  </div>
                </div>

                {/* Section cards */}
                {REVIEW_SECTIONS.filter((s) => s.key !== "alignment").map((section) => {
                  const items = review[section.key] || [];
                  const c = accentMap[section.accent];
                  const Icon = section.icon;
                  return (
                    <div key={section.key} className={`rounded-2xl border ${c.border} bg-white p-6 shadow-sm`}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-9 h-9 rounded-xl ${c.ring} flex items-center justify-center`}>
                          <Icon size={16} className={c.text} />
                        </div>
                        <h3 className="text-sm font-semibold text-slate-700">{section.label}</h3>
                      </div>
                      {items.length === 0 ? (
                        <p className="text-sm text-slate-400">None noted.</p>
                      ) : (
                        <ul className="flex flex-col gap-2.5 ml-1">
                          {items.map((item, i) => (
                            <li key={i} className="flex items-start gap-2.5">
                              <span className={`mt-1.5 w-1.5 h-1.5 rounded-full ${c.ring} shrink-0`} />
                              <span className="text-sm text-slate-600 leading-relaxed">{item}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}

                {/* Overall verdict */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">Overall Verdict</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{review.overallVerdict}</p>
                </div>

                {/* Confidence note */}
                <div className="flex items-start gap-2.5 rounded-xl bg-amber-50 border border-amber-100 px-4 py-3">
                  <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 leading-relaxed">
                    <strong>Confidence note:</strong> {review.confidenceNote}
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}