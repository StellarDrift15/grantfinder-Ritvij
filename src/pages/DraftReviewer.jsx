import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
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
import Shell from "@/components/Shell";

const REVIEW_SECTIONS = [
  { key: "alignment", label: "Mission Alignment", icon: Target, accent: "indigo" },
  { key: "strengths", label: "What's Strong", icon: CheckCircle2, accent: "emerald" },
  { key: "gaps", label: "What's Missing", icon: AlertTriangle, accent: "amber" },
  { key: "suggestions", label: "Specific Suggestions", icon: Lightbulb, accent: "purple" },
];

const accentMap = {
  indigo: { ring: "bg-[rgba(139,92,246,0.14)]", text: "text-[#C4B5FD]", border: "border-[rgba(139,92,246,0.25)]", chip: "bg-[rgba(139,92,246,0.14)] text-[#C4B5FD]" },
  emerald: { ring: "bg-[rgba(52,211,153,0.12)]", text: "text-[#6EE7B7]", border: "border-[rgba(52,211,153,0.22)]", chip: "bg-[rgba(52,211,153,0.12)] text-[#6EE7B7]" },
  amber: { ring: "bg-[rgba(251,191,36,0.12)]", text: "text-[#FCD34D]", border: "border-[rgba(251,191,36,0.25)]", chip: "bg-[rgba(251,191,36,0.12)] text-[#FCD34D]" },
  purple: { ring: "bg-[rgba(139,92,246,0.14)]", text: "text-[#C4B5FD]", border: "border-[rgba(139,92,246,0.25)]", chip: "bg-[rgba(139,92,246,0.14)] text-[#C4B5FD]" },
};

const inputBase =
  "w-full rounded-xl border border-gf-line bg-[rgba(7,11,20,0.55)] px-3.5 py-2.5 text-sm text-gf-hi placeholder:text-[#475569] focus:outline-none focus:border-[rgba(139,92,246,0.55)] focus:shadow-[0_0_0_3px_rgba(139,92,246,0.14)] transition";

export default function DraftReviewer() {
  const [draft, setDraft] = useState("");
  const [funderName, setFunderName] = useState("");
  const [funderSuggestions, setFunderSuggestions] = useState([]);
  const [review, setReview] = useState(null);
  const [reviewing, setReviewing] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [error, setError] = useState(null);

  const [funderMode, setFunderMode] = useState("known");
  const [customName, setCustomName] = useState("");
  const [customWebsite, setCustomWebsite] = useState("");
  const [customInfo, setCustomInfo] = useState("");

  useEffect(() => {
    (async () => {
      try {
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
    <Shell active="">
      <div className="flex items-center gap-3 mb-6">
        <span
          className="w-10 h-10 rounded-xl grid place-items-center border shrink-0"
          style={{ background: "rgba(56,189,248,0.12)", borderColor: "rgba(56,189,248,0.26)" }}
        >
          <ClipboardCheck size={18} className="text-[#7DD3FC]" />
        </span>
        <div>
          <h1 className="font-display text-xl font-bold text-gf-hi">Draft reviewer</h1>
          <p className="text-sm text-gf-low">AI roleplays your target funder and critiques your application.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[420px_1fr] gap-[22px] items-start">
        {/* Inputs */}
        <aside className="lg:sticky lg:top-[82px]">
          <form onSubmit={handleReview} className="rounded-[18px] border border-gf-line bg-gf-panel p-6 flex flex-col gap-5">
            <div>
              <div className="font-mono text-[10.5px] font-semibold tracking-[0.14em] uppercase text-gf-cyan mb-2">
                Review my draft
              </div>
              <h2 className="font-display text-gf-hi text-[21px] font-bold tracking-tight mb-1">Paste &amp; critique</h2>
              <p className="text-[13px] text-gf-low">
                The AI roleplays as the target funder's review committee and tells you what they'd really think.
              </p>
            </div>

            <div className="flex gap-1 rounded-xl bg-[rgba(7,11,20,0.55)] border border-gf-line p-1">
              <button
                type="button"
                onClick={() => setFunderMode("known")}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                  funderMode === "known" ? "bg-gf-panel-hi text-[#C4B5FD]" : "text-gf-low hover:text-gf-mid"
                }`}
              >
                <Target size={12} /> From grant database
              </button>
              <button
                type="button"
                onClick={() => setFunderMode("other")}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                  funderMode === "other" ? "bg-gf-panel-hi text-[#C4B5FD]" : "text-gf-low hover:text-gf-mid"
                }`}
              >
                <PencilLine size={12} /> Enter manually
              </button>
            </div>

            {funderMode === "known" ? (
              <div>
                <label className="text-[11.5px] font-semibold uppercase tracking-[0.08em] text-gf-mid mb-2 block">
                  Target funder <span className="text-gf-violet">*</span>
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
                <p className="text-[12px] text-gf-low mt-1.5">Type the funder's name — suggestions from your grant database appear below.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4 rounded-2xl bg-[rgba(139,92,246,0.06)] border border-[rgba(139,92,246,0.2)] p-4">
                <div>
                  <label className="text-[11.5px] font-semibold uppercase tracking-[0.08em] text-gf-mid mb-2 block">
                    Grant / funder name <span className="text-gf-violet">*</span>
                  </label>
                  <input
                    className={inputBase}
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g. Acme Local STEM Grant"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-[0.08em] text-gf-mid mb-2">
                    <Globe size={11} /> Grant website
                  </label>
                  <input
                    className={inputBase}
                    type="url"
                    value={customWebsite}
                    onChange={(e) => setCustomWebsite(e.target.value)}
                    placeholder="https://example.org/grant-program"
                  />
                  <p className="text-[12px] text-gf-low mt-1.5">The AI uses this URL to reason about what the funder actually funds.</p>
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-[0.08em] text-gf-mid mb-2">
                    <Info size={11} /> About this grant
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

            <div>
              <label className="text-[11.5px] font-semibold uppercase tracking-[0.08em] text-gf-mid mb-2 block">
                Your draft <span className="text-gf-violet">*</span>
              </label>
              <textarea
                className={inputBase + " resize-none min-h-[240px] font-mono text-[13px]"}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Paste the full text of your application answers, narrative, or cover letter here…"
              />
              <p className="text-[12px] text-gf-low mt-1.5 font-mono">{draft.length} characters</p>
            </div>

            {error && (
              <div className="rounded-xl bg-[rgba(248,113,113,0.1)] border border-[rgba(248,113,113,0.3)] px-4 py-3 text-sm text-[#FCA5A5]">{error}</div>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={reviewing}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold text-white transition-all duration-150 hover:-translate-y-px disabled:opacity-70 disabled:translate-y-0 font-display"
                style={{
                  backgroundImage: "linear-gradient(120deg,#8B5CF6,#38BDF8 55%,#22D3EE)",
                  boxShadow: "0 8px 28px -8px rgba(56,189,248,0.5),0 2px 8px -2px rgba(139,92,246,0.4)",
                }}
              >
                {reviewing ? (
                  <><Loader2 size={16} className="animate-spin" /> Reviewing as {displayName || "funder"}…</>
                ) : (
                  <><Sparkles size={16} /> Review my draft</>
                )}
              </button>
              {hasReviewed && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-gf-line bg-gf-panel hover:bg-gf-panel-hi px-4 py-3.5 text-sm font-medium text-gf-mid transition-colors"
                >
                  <RefreshCw size={14} /> Reset
                </button>
              )}
            </div>
          </form>
        </aside>

        {/* Review output */}
        <main>
          {reviewing && (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <div className="w-10 h-10 border-4 border-[rgba(139,92,246,0.18)] border-t-gf-violet rounded-full animate-spin" />
              <p className="text-sm text-gf-low">
                Reviewing your draft as the {displayName || "funder"} review committee…
              </p>
            </div>
          )}

          {!reviewing && !review && !hasReviewed && (
            <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[rgba(56,189,248,0.08)] border border-[rgba(56,189,248,0.22)] flex items-center justify-center mb-4">
                <ClipboardCheck size={24} className="text-[#7DD3FC]" />
              </div>
              <h2 className="text-base font-semibold text-gf-hi mb-1 font-display">Your funder-persona review will appear here</h2>
              <p className="text-sm text-gf-low max-w-md leading-relaxed">
                Paste your draft on the left, pick the funder you're submitting to, and the AI will critique it the way their actual review committee would — alignment score, strengths, gaps, and concrete rewrite suggestions.
              </p>
            </div>
          )}

          {!reviewing && !review && hasReviewed && (
            <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gf-panel border border-gf-line flex items-center justify-center mb-4">
                <AlertTriangle size={24} className="text-gf-low" />
              </div>
              <h2 className="text-base font-semibold text-gf-hi mb-1 font-display">No review generated</h2>
              <p className="text-sm text-gf-low max-w-md">Try again — make sure your draft and funder name are filled in.</p>
            </div>
          )}

          {!reviewing && review && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-5">
              <div className="rounded-2xl border border-[rgba(139,92,246,0.25)] bg-gf-panel p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Target size={16} className="text-[#A78BFA]" />
                    <h3 className="text-sm font-semibold text-gf-hi font-display">Alignment with {displayName}</h3>
                  </div>
                  <span className={`text-xs font-bold font-mono rounded-md px-2.5 py-1 ${accentMap.indigo.chip}`}>
                    {Math.round(review.alignment)}/100
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-[rgba(148,163,184,0.12)] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, Math.max(0, review.alignment))}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="h-full rounded-full bg-gf-grad"
                  />
                </div>
              </div>

              {REVIEW_SECTIONS.filter((s) => s.key !== "alignment").map((section) => {
                const items = review[section.key] || [];
                const c = accentMap[section.accent];
                const Icon = section.icon;
                return (
                  <div key={section.key} className={`rounded-2xl border ${c.border} bg-gf-panel p-6`}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-9 h-9 rounded-xl ${c.ring} flex items-center justify-center`}>
                        <Icon size={16} className={c.text} />
                      </div>
                      <h3 className="text-sm font-semibold text-gf-hi font-display">{section.label}</h3>
                    </div>
                    {items.length === 0 ? (
                      <p className="text-sm text-gf-low">None noted.</p>
                    ) : (
                      <ul className="flex flex-col gap-2.5 ml-1">
                        {items.map((item, i) => (
                          <li key={i} className="flex items-start gap-2.5">
                            <span className={`mt-1.5 w-1.5 h-1.5 rounded-full ${c.ring} shrink-0`} />
                            <span className="text-sm text-gf-mid leading-relaxed">{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}

              <div className="rounded-2xl border border-gf-line bg-gf-panel p-6">
                <h3 className="text-sm font-semibold text-gf-hi mb-2 font-display">Overall verdict</h3>
                <p className="text-sm text-gf-mid leading-relaxed">{review.overallVerdict}</p>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl bg-[rgba(251,191,36,0.06)] border border-[rgba(251,191,36,0.22)] px-4 py-3">
                <AlertTriangle size={14} className="text-[#FCD34D] shrink-0 mt-0.5" />
                <p className="text-xs text-[#FDE68A] leading-relaxed">
                  <strong>Confidence note:</strong> {review.confidenceNote}
                </p>
              </div>
            </motion.div>
          )}
        </main>
      </div>
    </Shell>
  );
}