import { useState } from "react";
import { motion } from "framer-motion";
import {
  Loader2,
  Wand2,
  Scissors,
  Copy,
  Check,
  AlertTriangle,
  FileText,
  RefreshCw,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { trackRewrite } from "@/lib/usage";

const inputBase =
  "w-full rounded-xl border border-gf-line bg-[rgba(7,11,20,0.55)] px-3.5 py-2.5 text-sm text-gf-hi placeholder:text-[#475569] focus:outline-none focus:border-[rgba(139,92,246,0.55)] focus:shadow-[0_0_0_3px_rgba(139,92,246,0.14)] transition";

function countWords(text) {
  const t = (text || "").trim();
  return t ? t.split(/\s+/).length : 0;
}

export default function EssayDraftTool() {
  const [prompt, setPrompt] = useState("");
  const [wordLimit, setWordLimit] = useState("");
  const [draft, setDraft] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [hasDrafted, setHasDrafted] = useState(false);

  const [suggestions, setSuggestions] = useState(null);
  const [reviewing, setReviewing] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleDraft = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) {
      setError("Please enter the grant prompt or question you want the essay to answer.");
      return;
    }
    setError(null);
    setDrafting(true);
    setHasDrafted(false);
    setDraft("");
    setSuggestions(null);
    setHasReviewed(false);
    try {
      const limit = parseInt(wordLimit, 10);
      const limitLine = limit && limit > 0 ? `Keep the response under ${limit} words (aim for roughly ${limit} words).` : "There is no strict word limit; be thorough but concise.";
      const llmPrompt = `You are an expert grant writer. Write a compelling first draft of a grant essay response based on the applicant's prompt below.

${limitLine}

Make it specific, persuasive, and tailored to the prompt. Write in the first person as the applicant organization. Use clear, confident, concrete language with real-sounding details. Do not include headings, labels, or commentary — output only the essay text.

APPLICANT'S PROMPT:
"""
${prompt}
"""`;

      const res = await base44.integrations.Core.InvokeLLM({
        prompt: llmPrompt,
        model: "gpt_5_mini",
        response_json_schema: {
          type: "object",
          properties: { essay: { type: "string" } },
          required: ["essay"],
        },
      });
      setDraft(res?.essay || "");
      setHasDrafted(true);
      trackRewrite();
    } catch (err) {
      setError(err.message || "Something went wrong while drafting your essay.");
      setHasDrafted(true);
    } finally {
      setDrafting(false);
    }
  };

  const handleReview = async () => {
    if (!draft.trim()) return;
    setReviewing(true);
    setHasReviewed(false);
    setSuggestions(null);
    try {
      const llmPrompt = `You are an expert grant-writing editor. Review the following grant essay draft and suggest specific ways to rewrite passages to be CLEARER and MORE CONCISE.

Identify 4 to 7 specific passages worth improving. For each one:
- "original": the EXACT phrase or sentence quoted from the draft
- "rewrite": a tighter, clearer rewrite of that passage
- "reason": one short sentence explaining why the rewrite is better (e.g. cuts redundancy, replaces passive voice, sharpens vague wording)

Focus on wordiness, vague language, passive voice, and weak phrasing. Do NOT rewrite the whole essay — only targeted improvements. Skip passages that are already strong.

DRAFT:
"""
${draft}
"""`;

      const res = await base44.integrations.Core.InvokeLLM({
        prompt: llmPrompt,
        model: "gpt_5_mini",
        response_json_schema: {
          type: "object",
          properties: {
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
          },
          required: ["suggestions"],
        },
      });
      setSuggestions(res?.suggestions || []);
      setHasReviewed(true);
      trackRewrite();
    } catch (err) {
      setError(err.message || "Something went wrong while reviewing your draft.");
      setHasReviewed(true);
    } finally {
      setReviewing(false);
    }
  };

  const handleReset = () => {
    setDraft("");
    setSuggestions(null);
    setHasDrafted(false);
    setHasReviewed(false);
    setError(null);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="grid lg:grid-cols-[420px_1fr] gap-[22px] items-start">
      <aside className="lg:sticky lg:top-[82px]">
        <form onSubmit={handleDraft} className="rounded-[18px] border border-gf-line bg-gf-panel p-6 flex flex-col gap-5">
          <div>
            <div className="font-mono text-[10.5px] font-semibold tracking-[0.14em] uppercase text-gf-cyan mb-2">
              Draft an essay
            </div>
            <h2 className="font-display text-gf-hi text-[21px] font-bold tracking-tight mb-1">Add the prompt</h2>
            <p className="text-[13px] text-gf-low">
              Paste the grant question or prompt. The AI writes a persuasive first draft you can refine.
            </p>
          </div>

          <div>
            <label className="text-[11.5px] font-semibold uppercase tracking-[0.08em] text-gf-mid mb-2 block">
              Grant prompt / question <span className="text-gf-violet">*</span>
            </label>
            <textarea
              className={inputBase + " resize-none min-h-[180px]"}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Describe your organization's mission and how this grant would expand STEM access for underserved youth in your community."
            />
            <p className="text-[12px] text-gf-low mt-1.5 font-mono">{countWords(prompt)} words</p>
          </div>

          <div>
            <label className="text-[11.5px] font-semibold uppercase tracking-[0.08em] text-gf-mid mb-2 block">
              Word limit <span className="text-gf-low normal-case tracking-normal">(optional)</span>
            </label>
            <input
              className={inputBase + " font-mono"}
              type="number"
              min="0"
              value={wordLimit}
              onChange={(e) => setWordLimit(e.target.value)}
              placeholder="e.g. 500"
            />
            <p className="text-[12px] text-gf-low mt-1.5">The AI stays under your limit if you set one.</p>
          </div>

          {error && (
            <div className="rounded-xl bg-[rgba(248,113,113,0.1)] border border-[rgba(248,113,113,0.3)] px-4 py-3 text-sm text-[#FCA5A5]">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={drafting}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold text-white transition-all duration-150 hover:-translate-y-px disabled:opacity-70 disabled:translate-y-0 font-display"
              style={{
                backgroundImage: "linear-gradient(120deg,#8B5CF6,#38BDF8 55%,#22D3EE)",
                boxShadow: "0 8px 28px -8px rgba(56,189,248,0.5),0 2px 8px -2px rgba(139,92,246,0.4)",
              }}
            >
              {drafting ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Drafting…
                </>
              ) : (
                <>
                  <Wand2 size={16} /> Draft essay
                </>
              )}
            </button>
            {hasDrafted && (
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
        {drafting && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-10 h-10 border-4 border-[rgba(139,92,246,0.18)] border-t-gf-violet rounded-full animate-spin" />
            <p className="text-sm text-gf-low">Drafting your essay…</p>
          </div>
        )}

        {!drafting && !draft && !hasDrafted && (
          <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[rgba(139,92,246,0.08)] border border-[rgba(139,92,246,0.22)] flex items-center justify-center mb-4">
              <FileText size={24} className="text-[#A78BFA]" />
            </div>
            <h2 className="text-base font-semibold text-gf-hi mb-1 font-display">Your draft will appear here</h2>
            <p className="text-sm text-gf-low max-w-md leading-relaxed">
              Add the grant prompt on the left, optionally set a word limit, then generate a first draft — and review it for clearer, more concise rewrites.
            </p>
          </div>
        )}

        {!drafting && !draft && hasDrafted && (
          <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gf-panel border border-gf-line flex items-center justify-center mb-4">
              <AlertTriangle size={24} className="text-gf-low" />
            </div>
            <h2 className="text-base font-semibold text-gf-hi mb-1 font-display">No draft generated</h2>
            <p className="text-sm text-gf-low max-w-md">Try again — make sure your prompt is filled in.</p>
          </div>
        )}

        {!drafting && draft && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-5">
            <div className="rounded-2xl border border-gf-line bg-gf-panel p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-[#A78BFA]" />
                  <h3 className="text-sm font-semibold text-gf-hi font-display">Your draft</h3>
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-[rgba(148,163,184,0.12)] text-gf-low">
                    {countWords(draft)} words
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-gf-mid hover:text-gf-hi transition"
                >
                  {copied ? <Check size={13} className="text-gf-mint" /> : <Copy size={13} />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <textarea
                className={inputBase + " resize-y min-h-[280px] leading-relaxed"}
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value);
                  setHasReviewed(false);
                }}
              />
              <p className="text-[12px] text-gf-low mt-2">Edit anything above, then review it for clearer, more concise rewrites.</p>
              <div className="flex justify-end mt-4">
                <button
                  type="button"
                  onClick={handleReview}
                  disabled={reviewing}
                  className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-px disabled:opacity-70 font-display"
                  style={{
                    backgroundImage: "linear-gradient(120deg,#34D399,#22D3EE)",
                    boxShadow: "0 8px 28px -8px rgba(52,211,153,0.45)",
                  }}
                >
                  {reviewing ? (
                    <>
                      <Loader2 size={15} className="animate-spin" /> Reviewing…
                    </>
                  ) : (
                    <>
                      <Scissors size={15} /> Review for clarity
                    </>
                  )}
                </button>
              </div>
            </div>

            {reviewing && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-9 h-9 border-4 border-[rgba(52,211,153,0.18)] border-t-gf-mint rounded-full animate-spin" />
                <p className="text-sm text-gf-low">Finding clearer, more concise rewrites…</p>
              </div>
            )}

            {!reviewing && suggestions && suggestions.length === 0 && hasReviewed && (
              <div className="rounded-2xl border border-gf-line bg-gf-panel p-6 text-center">
                <p className="text-sm text-gf-mid">Your draft reads clearly — no major rewrites suggested.</p>
              </div>
            )}

            {!reviewing && suggestions && suggestions.length > 0 && (
              <div className="rounded-2xl border border-[rgba(52,211,153,0.25)] bg-gf-panel p-6">
                <div className="flex items-center gap-2 mb-1">
                  <Scissors size={16} className="text-gf-mint" />
                  <h3 className="text-sm font-semibold text-gf-hi font-display">Clarity &amp; conciseness suggestions</h3>
                </div>
                <p className="text-[12.5px] text-gf-low mb-4">Targeted rewrites to tighten your draft. Swap them in where it fits.</p>
                <ul className="flex flex-col gap-3">
                  {suggestions.map((s, i) => (
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
              </div>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
}