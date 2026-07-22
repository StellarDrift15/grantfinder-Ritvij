import { useState } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  Loader2,
  Sparkles,
  RefreshCw,
  Target,
  ShieldCheck,
  AlertTriangle,
  Lightbulb,
  Scissors,
  Copy,
  Check,
  ListChecks,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import Shell from "@/components/Shell";

const inputBase =
  "w-full rounded-xl border border-gf-line bg-[rgba(7,11,20,0.55)] px-3.5 py-2.5 text-sm text-gf-hi placeholder:text-[#475569] focus:outline-none focus:border-[rgba(56,189,248,0.55)] focus:shadow-[0_0_0_3px_rgba(56,189,248,0.14)] transition";

const SECTIONS = [
  { key: "strengths", label: "What's working", icon: ShieldCheck, accent: "emerald" },
  { key: "risks", label: "Rejection risks", icon: AlertTriangle, accent: "amber" },
  { key: "suggestions", label: "Line-by-line rewrites", icon: Lightbulb, accent: "purple" },
  { key: "checklist", label: "Pre-send checklist", icon: ListChecks, accent: "sky" },
];

const accentMap = {
  emerald: { ring: "bg-[rgba(52,211,153,0.12)]", text: "text-[#6EE7B7]", border: "border-[rgba(52,211,153,0.22)]", dot: "bg-[rgba(52,211,153,0.6)]" },
  amber: { ring: "bg-[rgba(251,191,36,0.12)]", text: "text-[#FCD34D]", border: "border-[rgba(251,191,36,0.25)]", dot: "bg-[rgba(251,191,36,0.6)]" },
  purple: { ring: "bg-[rgba(139,92,246,0.14)]", text: "text-[#C4B5FD]", border: "border-[rgba(139,92,246,0.25)]", dot: "bg-[rgba(139,92,246,0.6)]" },
  sky: { ring: "bg-[rgba(56,189,248,0.12)]", text: "text-[#7DD3FC]", border: "border-[rgba(56,189,248,0.25)]", dot: "bg-[rgba(56,189,248,0.6)]" },
};

function riskColor(score) {
  if (score >= 70) return { chip: "bg-[rgba(248,113,113,0.16)] text-[#FCA5A5]", bar: "linear-gradient(90deg,#F87171,#FCA5A5)" };
  if (score >= 40) return { chip: "bg-[rgba(251,191,36,0.16)] text-[#FCD34D]", bar: "linear-gradient(90deg,#FBBF24,#FCD34D)" };
  return { chip: "bg-[rgba(52,211,153,0.16)] text-[#6EE7B7]", bar: "linear-gradient(90deg,#34D399,#6EE7B7)" };
}

export default function ColdEmailReviewer() {
  const [email, setEmail] = useState("");
  const [context, setContext] = useState("");
  const [review, setReview] = useState(null);
  const [reviewing, setReviewing] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleReview = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Paste your cold email template to review it.");
      return;
    }
    setError(null);
    setReviewing(true);
    setHasReviewed(false);
    setReview(null);
    try {
      const llmPrompt = `You are an elite cold-outreach coach for nonprofit and robotics-team fundraisers. A fundraiser has pasted a cold email template they plan to send to a potential sponsor/donor. Your job is to review it with EXTREME thoroughness and give brutally honest, specific, actionable advice.

Your central principle: GENERIC EMAILS GET DELETED — but so do AGGRESSIVE ones. The goal is a warm, human reply, not dominance. Remember at all times: the company OWES YOU NOTHING. They are a stranger doing you a favor if they even read this. The best cold emails are SPECIFIC yet WARM and GENUINE: tailored to the recipient's real work, written the way a thoughtful, humble person would actually type to a stranger, with an optional, no-pressure ask that expresses gratitude.

Tone rules (enforce these in every rewrite):
- Sound like a real human writing one-on-one — warm, courteous, appreciative, slightly humble. Not a sales template, not a pitch deck, not a business proposal.
- NEVER use minimizing or pressuring language that frames the ask as cheap for the recipient: avoid "low-effort", "easy", "quick", "won't take much of your time", "all I need is", "just a simple yes/no", "minimal lift", "no commitment required". These sound entitled and minimize the recipient's time.
- NEVER use ultimatums, forced choices, or demanding phrasing ("Reply A or B", "pick one", "here's what you'll get", "I need", "you'll receive").
- Frame the ask as a genuine request: "would you be open to…", "if you're willing, I'd be grateful for…", "no pressure either way — I know you're busy". Express that any help is appreciated and there's no obligation.
- Be specific about why you're contacting THIS company and what would genuinely help, then make a soft, optional ask. Gratitude and specificity together earn replies.

CONTEXT THE FUNDRAISER PROVIDED (use it to tailor feedback; may be empty):
"""
${context.trim() || "(none provided)"}
"""

COLD EMAIL TO REVIEW:
"""
${email}
"""

Produce an EXTREMELY thorough review. Cover:
1. rejectionRisk (0-100): likelihood this email is ignored, deleted, or rejected as-is. 100 = certain to be ignored.
2. specificityScore (0-100): how specifically tailored this email is to THIS recipient vs. a mass template. Be harsh — anything copy-pastable to any company scores low.
3. summary: 2-3 sentences of honest overall assessment.
4. strengths: 2-4 bullet points of what works.
5. risks: 3-6 bullet points of specific reasons this email could get rejected/ignored — vague subject lines, no clear reason for contacting them, me-focused opening, demanding or ultimatum-style ask, pushy/aggressive tone, too-long or overwhelming lists of deliverables, generic flattery, unclear value to THEM, guilt-tripping, or any phrasing that feels like a hard pitch rather than a friendly ask. Flag aggressive or over-confident language explicitly — it gets emails left on read even when they're specific. Be specific to the actual text.
6. suggestions: 4-7 targeted line-by-line rewrites. Each must include "original" (exact quote from the email), "rewrite" (a stronger, more specific, WARMER alternative that sounds like a real human typed it — never ultimatum-style, never demanding, never over-confident, and never using minimizing language like "low-effort" or "easy"), and "reason" (one sentence on why it reduces rejection risk while staying warm and human). Prioritize a specific subject line, a first line that proves you researched THEM, a genuine ask framed as a grateful request (not a hard pitch), and a soft, optional call to action that respects that they're busy and owe nothing. If the original is aggressive or pushy, soften the tone while keeping the specificity.
7. rewritten: a full, optimized rewrite of the entire email that is specific, concise, recipient-focused, warm, and low-pressure — maximizing the chance of a reply WITHOUT sounding aggressive, demanding, or transactional. It must read like a thoughtful human wrote it one-on-one: humble, grateful, and genuinely curious about THEM. The call to action should be a soft, optional request (e.g. offering to send a short one-page summary if they'd like to see it, asking if they'd be open to a brief chat, or suggesting they point you to the right person) — never an ultimatum, never "low-effort/easy/quick" framing, never a hard sell. Express that there's no pressure and you appreciate their time. Include a subject line at the top as "Subject: ...".
8. checklist: 5-7 short pre-send checks the fundraiser must confirm (e.g. "I named a specific reason I'm contacting THIS company", "My ask takes one step, not five", "I cut every me-focused sentence").

Be direct and specific. Never say "this is great" unless it truly is. The goal is to reduce the chance of rejection.`;

      const res = await base44.integrations.Core.InvokeLLM({
        prompt: llmPrompt,
        model: "gpt_5_mini",
        response_json_schema: {
          type: "object",
          properties: {
            rejectionRisk: { type: "number" },
            specificityScore: { type: "number" },
            summary: { type: "string" },
            strengths: { type: "array", items: { type: "string" } },
            risks: { type: "array", items: { type: "string" } },
            suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  original: { type: "string" },
                  rewrite: { type: "string" },
                  reason: { type: "string" },
                },
                required: ["original", "rewrite", "reason"],
              },
            },
            rewritten: { type: "string" },
            checklist: { type: "array", items: { type: "string" } },
          },
          required: ["rejectionRisk", "specificityScore", "summary", "strengths", "risks", "suggestions", "rewritten", "checklist"],
        },
      });
      setReview(res);
      setHasReviewed(true);
    } catch (err) {
      setError(err.message || "Something went wrong while reviewing your email.");
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

  const handleCopyRewritten = async () => {
    if (!review?.rewritten) return;
    try {
      await navigator.clipboard.writeText(review.rewritten);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  };

  return (
    <Shell active="">
      <div className="flex items-center gap-3 mb-6">
        <span
          className="w-10 h-10 rounded-xl grid place-items-center border shrink-0"
          style={{ background: "rgba(56,189,248,0.12)", borderColor: "rgba(56,189,248,0.26)" }}
        >
          <Mail size={18} className="text-[#7DD3FC]" />
        </span>
        <div>
          <h1 className="font-display text-xl font-bold text-gf-hi">Cold email reviewer</h1>
          <p className="text-sm text-gf-low">Thorough critique to make your email specific and rejection-proof.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[420px_1fr] gap-[22px] items-start">
        <aside className="lg:sticky lg:top-[82px]">
          <form onSubmit={handleReview} className="rounded-[18px] border border-gf-line bg-gf-panel p-6 flex flex-col gap-5">
            <div>
              <div className="font-mono text-[10.5px] font-semibold tracking-[0.14em] uppercase text-gf-cyan mb-2">
                Review my cold email
              </div>
              <h2 className="font-display text-gf-hi text-[21px] font-bold tracking-tight mb-1">Paste your template</h2>
              <p className="text-[13px] text-gf-low">
                The AI grades rejection risk, calls out vague language, and rewrites it to be specific to each recipient.
              </p>
            </div>

            <div>
              <label className="text-[11.5px] font-semibold uppercase tracking-[0.08em] text-gf-mid mb-2 block">
                Your cold email <span className="text-gf-violet">*</span>
              </label>
              <textarea
                className={inputBase + " resize-none min-h-[220px] font-mono text-[13px]"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Paste the full cold email — subject line and body…"
              />
              <p className="text-[12px] text-gf-low mt-1.5 font-mono">{email.length} characters</p>
            </div>

            <div>
              <label className="text-[11.5px] font-semibold uppercase tracking-[0.08em] text-gf-mid mb-2 block">
                Context <span className="text-gf-low normal-case tracking-normal">(optional)</span>
              </label>
              <textarea
                className={inputBase + " resize-none min-h-[90px]"}
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Who you're emailing (company + role), what you're asking for, your org / team — helps tailor the advice."
              />
              <p className="text-[12px] text-gf-low mt-1.5">More context = sharper, more specific feedback.</p>
            </div>

            {error && (
              <div className="rounded-xl bg-[rgba(248,113,113,0.1)] border border-[rgba(248,113,113,0.3)] px-4 py-3 text-sm text-[#FCA5A5]">
                {error}
              </div>
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
                  <>
                    <Loader2 size={16} className="animate-spin" /> Reviewing…
                  </>
                ) : (
                  <>
                    <Sparkles size={16} /> Review my email
                  </>
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

        <main>
          {reviewing && (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <div className="w-10 h-10 border-4 border-[rgba(56,189,248,0.18)] border-t-gf-sky rounded-full animate-spin" />
              <p className="text-sm text-gf-low">Scoring rejection risk and rewriting your email…</p>
            </div>
          )}

          {!reviewing && !review && !hasReviewed && (
            <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[rgba(56,189,248,0.08)] border border-[rgba(56,189,248,0.22)] flex items-center justify-center mb-4">
                <Mail size={24} className="text-[#7DD3FC]" />
              </div>
              <h2 className="text-base font-semibold text-gf-hi mb-1 font-display">Your email review will appear here</h2>
              <p className="text-sm text-gf-low max-w-md leading-relaxed">
                Paste your cold email on the left and get a rejection-risk score, a specificity grade, line-by-line rewrites, an optimized version, and a pre-send checklist.
              </p>
            </div>
          )}

          {!reviewing && !review && hasReviewed && (
            <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gf-panel border border-gf-line flex items-center justify-center mb-4">
                <AlertTriangle size={24} className="text-gf-low" />
              </div>
              <h2 className="text-base font-semibold text-gf-hi mb-1 font-display">No review generated</h2>
              <p className="text-sm text-gf-low max-w-md">Try again — make sure you pasted your email.</p>
            </div>
          )}

          {!reviewing && review && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-5">
              {/* scores */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-[rgba(248,113,113,0.25)] bg-gf-panel p-5">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle size={15} className="text-[#FCA5A5]" />
                    <h3 className="text-[12.5px] font-semibold text-gf-hi font-display uppercase tracking-wide">Rejection risk</h3>
                  </div>
                  <div className="flex items-end justify-between mb-2">
                    <span className="font-mono text-3xl font-bold text-gf-hi">{Math.round(review.rejectionRisk)}</span>
                    <span className={`text-[11px] font-bold font-mono rounded-md px-2 py-1 ${riskColor(review.rejectionRisk).chip}`}>
                      {review.rejectionRisk >= 70 ? "High" : review.rejectionRisk >= 40 ? "Medium" : "Low"}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[rgba(148,163,184,0.12)] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, Math.max(0, review.rejectionRisk))}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{ background: riskColor(review.rejectionRisk).bar }}
                    />
                  </div>
                  <p className="text-[12px] text-gf-low mt-2">Likelihood this email is ignored or deleted as-is.</p>
                </div>

                <div className="rounded-2xl border border-[rgba(52,211,153,0.25)] bg-gf-panel p-5">
                  <div className="flex items-center gap-2 mb-1">
                    <Target size={15} className="text-gf-mint" />
                    <h3 className="text-[12.5px] font-semibold text-gf-hi font-display uppercase tracking-wide">Specificity</h3>
                  </div>
                  <div className="flex items-end justify-between mb-2">
                    <span className="font-mono text-3xl font-bold text-gf-hi">{Math.round(review.specificityScore)}</span>
                    <span className={`text-[11px] font-bold font-mono rounded-md px-2 py-1 ${review.specificityScore >= 70 ? "bg-[rgba(52,211,153,0.16)] text-[#6EE7B7]" : review.specificityScore >= 40 ? "bg-[rgba(251,191,36,0.16)] text-[#FCD34D]" : "bg-[rgba(248,113,113,0.16)] text-[#FCA5A5]"}`}>
                      {review.specificityScore >= 70 ? "Tailored" : review.specificityScore >= 40 ? "Generic-ish" : "Mass-mail"}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[rgba(148,163,184,0.12)] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, Math.max(0, review.specificityScore))}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className="h-full rounded-full bg-gf-grad-money"
                    />
                  </div>
                  <p className="text-[12px] text-gf-low mt-2">Generic emails get deleted — specificity is the #1 fix.</p>
                </div>
              </div>

              <div className="rounded-2xl border border-gf-line bg-gf-panel p-6">
                <h3 className="text-sm font-semibold text-gf-hi mb-2 font-display">Summary</h3>
                <p className="text-sm text-gf-mid leading-relaxed">{review.summary}</p>
              </div>

              {SECTIONS.map((section) => {
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
                      <span className="font-mono text-[11px] text-gf-low ml-auto">{items.length}</span>
                    </div>
                    {section.key === "suggestions" ? (
                      items.length === 0 ? (
                        <p className="text-sm text-gf-low">None.</p>
                      ) : (
                        <ul className="flex flex-col gap-3">
                          {items.map((s, i) => (
                            <li key={i} className="rounded-xl border border-gf-line bg-[rgba(7,11,20,0.4)] p-4">
                              <div className="text-[13px] text-gf-low leading-relaxed mb-2">
                                <span className="font-mono text-[10px] uppercase tracking-wider text-gf-low mr-1.5">Original</span>
                                <span className="line-through decoration-[rgba(148,163,184,0.4)]">{s.original}</span>
                              </div>
                              <div className="text-[13.5px] text-gf-hi leading-relaxed mb-2">
                                <span className="font-mono text-[10px] uppercase tracking-wider text-gf-mint mr-1.5">Rewrite</span>
                                {s.rewrite}
                              </div>
                              <div className="text-[12px] text-gf-mid leading-relaxed">
                                <span className="text-gf-violet font-semibold">Why: </span>
                                {s.reason}
                              </div>
                            </li>
                          ))}
                        </ul>
                      )
                    ) : items.length === 0 ? (
                      <p className="text-sm text-gf-low">None noted.</p>
                    ) : (
                      <ul className="flex flex-col gap-2.5 ml-1">
                        {items.map((item, i) => (
                          <li key={i} className="flex items-start gap-2.5">
                            <span className={`mt-1.5 w-1.5 h-1.5 rounded-full ${c.dot} shrink-0`} />
                            <span className="text-sm text-gf-mid leading-relaxed">{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}

              {/* rewritten */}
              <div className="rounded-2xl border border-[rgba(52,211,153,0.25)] bg-gf-panel p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Scissors size={16} className="text-gf-mint" />
                    <h3 className="text-sm font-semibold text-gf-hi font-display">Optimized rewrite</h3>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyRewritten}
                    className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-gf-mid hover:text-gf-hi transition"
                  >
                    {copied ? <Check size={13} className="text-gf-mint" /> : <Copy size={13} />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
                <pre className="whitespace-pre-wrap break-words font-mono text-[13px] leading-relaxed text-gf-hi bg-[rgba(7,11,20,0.4)] border border-gf-line rounded-xl p-4">
{review.rewritten}
                </pre>
              </div>
            </motion.div>
          )}
        </main>
      </div>
    </Shell>
  );
}