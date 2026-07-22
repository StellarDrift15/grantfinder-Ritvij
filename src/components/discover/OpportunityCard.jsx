import { useState } from "react";
import { Bookmark, BookmarkCheck, Clock } from "lucide-react";
import { TYPE_META, typeKeyOf, fmtAmount, deadlineInfo } from "@/lib/opportunity";

const C = 2 * Math.PI * 19; // r=19 for the 44px ring

export default function OpportunityCard({ opp, score, saved, onToggleSave }) {
  const [saving, setSaving] = useState(false);
  const typeKey = typeKeyOf(opp.type);
  const meta = TYPE_META[typeKey];
  const dl = deadlineInfo(opp.deadline);
  const tags = (opp.target_sectors || []).slice(0, 3);
  const offset = score != null ? C * (1 - score / 100) : C;

  const handleSave = async (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    setSaving(true);
    try {
      await onToggleSave();
    } finally {
      setSaving(false);
    }
  };

  const Tag = opp.application_url ? "a" : "div";
  const tagProps = opp.application_url
    ? { href: opp.application_url, target: "_blank", rel: "noreferrer" }
    : {};

  return (
    <Tag {...tagProps} className="flex gap-4 p-4 rounded-[18px] border border-gf-line bg-gf-panel hover:bg-gf-panel-hi hover:border-gf-line-hi transition-colors">
      {score != null && (
        <div className="relative w-11 h-11 shrink-0" aria-label={`${score} percent match`}>
          <svg viewBox="0 0 44 44" className="w-11 h-11 -rotate-90">
            <circle cx="22" cy="22" r="19" fill="none" stroke="rgba(148,163,184,0.14)" strokeWidth="4" />
            <circle
              cx="22"
              cy="22"
              r="19"
              fill="none"
              stroke="url(#gfScoreGrad)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={offset}
            />
          </svg>
          <span className="absolute inset-0 grid place-items-center font-mono text-[11px] font-semibold text-gf-hi">
            {score}
          </span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <span className={`inline-block font-mono text-[9.5px] font-semibold tracking-widest uppercase px-2 py-0.5 rounded-full border mb-1.5 ${meta.cls}`}>
          {meta.label}
        </span>
        <h3 className="font-display text-[15px] font-semibold text-gf-hi leading-tight">{opp.title}</h3>
        <div className="text-[12px] text-gf-low mt-0.5">{opp.provider_name}</div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {tags.map((t) => (
            <span key={t} className="text-[10.5px] text-gf-low px-2 py-0.5 rounded-full bg-[rgba(148,163,184,0.08)] border border-gf-line">
              {t}
            </span>
          ))}
        </div>
      </div>
      <div className="flex flex-col items-end gap-2 shrink-0">
        <div className="font-mono text-[13px] font-semibold text-gf-mint whitespace-nowrap">{fmtAmount(opp.value_amount, typeKey)}</div>
        <span
          className={`inline-flex items-center gap-1 font-mono text-[10.5px] px-2 py-0.5 rounded-full border whitespace-nowrap ${
            dl.soon
              ? "text-[#FCD34D] border-[rgba(251,191,36,0.3)] bg-[rgba(251,191,36,0.1)]"
              : "text-gf-mid border-gf-line bg-[rgba(148,163,184,0.08)]"
          }`}
        >
          <Clock size={10} /> {dl.label}
        </span>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition inline-flex items-center gap-1 disabled:opacity-60 ${
            saved
              ? "text-gf-mint border-[rgba(52,211,153,0.45)] bg-[rgba(52,211,153,0.08)]"
              : "text-gf-mid border-gf-line-hi hover:text-gf-hi"
          }`}
        >
          {saved ? <BookmarkCheck size={11} /> : <Bookmark size={11} />} {saved ? "Saved" : "Save"}
        </button>
      </div>
    </Tag>
  );
}