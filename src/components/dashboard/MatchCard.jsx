import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Clock, Bookmark, BookmarkCheck, Pencil, ExternalLink } from "lucide-react";
import { TYPE_META, typeKeyOf, fmtAmount, deadlineInfo } from "@/lib/opportunity";
import { toggleSaveOpportunity, findSavedByOpportunity } from "@/lib/saved";
import { trackGrantClick } from "@/lib/usage";

const C = 195.4;

export default function MatchCard({ result, index }) {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const opp = result.opportunity || {};
  const typeKey = typeKeyOf(opp.type);
  const meta = TYPE_META[typeKey];
  const score = Math.round(result.match_confidence || 0);
  const offset = C * (1 - score / 100);
  const dl = deadlineInfo(opp.deadline);
  const tags = (opp.target_sectors || []).slice(0, 4);

  useEffect(() => {
    let on = true;
    findSavedByOpportunity(opp.id)
      .then((row) => { if (on) setSaved(!!row); })
      .catch(() => {});
    return () => { on = false; };
  }, [opp.id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const now = await toggleSaveOpportunity(opp, score);
      setSaved(now);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.09, ease: "easeOut" }}
      className="grid grid-cols-[auto_1fr_auto] gap-5 items-center p-5 rounded-[18px] border border-gf-line bg-gf-panel hover:bg-gf-panel-hi hover:border-gf-line-hi transition-colors"
    >
      {/* score ring */}
      <div className="relative w-[74px] h-[74px] shrink-0" aria-label={`${score} percent match`}>
        <svg viewBox="0 0 74 74" className="w-[74px] h-[74px] -rotate-90">
          <circle cx="37" cy="37" r="31.1" fill="none" stroke="rgba(148,163,184,0.14)" strokeWidth="6" />
          <motion.circle
            cx="37"
            cy="37"
            r="31.1"
            fill="none"
            stroke="url(#gfScoreGrad)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={C}
            initial={{ strokeDashoffset: C }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: [0.2, 0.7, 0.3, 1] }}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <span className="font-mono text-[16px] font-semibold text-gf-hi leading-none">{score}</span>
        </div>
        <span className="absolute bottom-0.5 left-0 right-0 text-center font-mono text-[8.5px] tracking-widest text-gf-low">
          MATCH
        </span>
      </div>

      {/* body */}
      <div className="min-w-0">
        <span className={`inline-block font-mono text-[10px] font-semibold tracking-widest uppercase px-2 py-0.5 rounded-full border mb-1.5 ${meta.cls}`}>
          {meta.label}
        </span>
        <h3 className="font-display text-[16.5px] font-semibold text-gf-hi mb-1 leading-tight">
          {opp.title || "Untitled opportunity"}
        </h3>
        <div className="text-[12.5px] text-gf-low mb-2">{opp.provider_name || ""}</div>
        <div className="flex gap-2 items-start text-[13px] text-gf-mid leading-snug mb-2.5">
          <Sparkles size={13} className="shrink-0 mt-0.5 text-gf-violet" />
          <span>{result.match_reason || "Matched to your profile."}</span>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {tags.map((t) => (
            <span
              key={t}
              className="text-[11px] font-medium text-gf-low px-2 py-0.5 rounded-full bg-[rgba(148,163,184,0.08)] border border-gf-line"
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* side */}
      <div className="flex flex-col items-end gap-2 text-right">
        <div className="font-mono text-[15.5px] font-semibold text-gf-mint whitespace-nowrap">
          {fmtAmount(opp.value_amount, typeKey)}
        </div>
        <span
          className={`inline-flex items-center gap-1 font-mono text-[11px] font-medium px-2.5 py-1 rounded-full whitespace-nowrap border ${
            dl.soon
              ? "text-[#FCD34D] border-[rgba(251,191,36,0.3)] bg-[rgba(251,191,36,0.1)]"
              : "text-gf-mid border-gf-line bg-[rgba(148,163,184,0.08)]"
          }`}
        >
          <Clock size={11} /> {dl.label}
        </span>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className={`px-3.5 py-1.5 rounded-lg text-[12.5px] font-semibold border transition inline-flex items-center gap-1 disabled:opacity-60 ${
              saved
                ? "text-gf-mint border-[rgba(52,211,153,0.45)] bg-[rgba(52,211,153,0.08)]"
                : "text-gf-mid border-gf-line-hi hover:text-gf-hi hover:border-[rgba(148,163,184,0.45)]"
            }`}
          >
            {saved ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
            {saved ? "Saved ✓" : "Save"}
          </button>
          <Link
            to="/draft-reviewer"
            className="px-3.5 py-1.5 rounded-lg text-[12.5px] font-semibold border text-[#C4B5FD] bg-[rgba(139,92,246,0.14)] border-[rgba(139,92,246,0.35)] hover:bg-[rgba(139,92,246,0.22)] transition inline-flex items-center gap-1"
          >
            <Pencil size={13} /> Draft outreach
          </Link>
        </div>
        {opp.application_url && (
          <a
            href={opp.application_url}
            target="_blank"
            rel="noreferrer"
            onClick={trackGrantClick}
            className="text-[11.5px] text-gf-cyan hover:text-gf-sky inline-flex items-center gap-1 mt-0.5"
            >
            Apply <ExternalLink size={11} />
          </a>
        )}
      </div>
    </motion.article>
  );
}