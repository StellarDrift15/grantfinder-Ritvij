import { Link } from "react-router-dom";
import { Pencil, Clock, Trophy, X as XIcon } from "lucide-react";
import { TYPE_META, typeKeyOf, fmtAmount, deadlineInfo } from "@/lib/opportunity";

export default function PipelineCard({ item, onSetOutcome }) {
  const typeKey = typeKeyOf(item.type);
  const dl = deadlineInfo(item.deadline);
  const soon = dl.days >= 0 && dl.days <= 14;
  const won = item.outcome === "won";
  const lost = item.outcome === "lost";

  return (
    <div
      className={`rounded-xl border p-3.5 ${
        won
          ? "border-[rgba(52,211,153,0.45)] bg-[rgba(52,211,153,0.08)]"
          : lost
          ? "border-[rgba(148,163,184,0.18)] bg-gf-panel opacity-70"
          : "border-gf-line bg-gf-panel"
      } ${soon ? "border-l-2 border-l-[#FBBF24]" : ""}`}
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className={`font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-full border ${TYPE_META[typeKey].cls}`}>
          {TYPE_META[typeKey].label}
        </span>
        {item.match_score != null && <span className="font-mono text-[10px] text-gf-low">{item.match_score}%</span>}
      </div>
      <h4 className="font-display text-[13.5px] font-semibold text-gf-hi leading-tight">{item.title}</h4>
      <div className="text-[11px] text-gf-low mt-0.5">{item.funder}</div>
      <div className="flex items-center justify-between mt-2">
        <span className="font-mono text-[12px] font-semibold text-gf-mint">{fmtAmount(item.amount, typeKey)}</span>
        <span
          className={`inline-flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded-full border ${
            dl.soon
              ? "text-[#FCD34D] border-[rgba(251,191,36,0.3)] bg-[rgba(251,191,36,0.1)]"
              : "text-gf-mid border-gf-line"
          }`}
        >
          <Clock size={9} /> {dl.label}
        </span>
      </div>
      <div className="flex items-center gap-1.5 mt-2.5">
        {item.status === "decided" ? (
          <>
            <button
              onClick={() => onSetOutcome(item.id, "won")}
              className={`px-2.5 py-1 rounded-lg text-[10.5px] font-semibold border inline-flex items-center gap-1 transition ${
                won
                  ? "text-gf-mint border-[rgba(52,211,153,0.45)] bg-[rgba(52,211,153,0.12)]"
                  : "text-gf-mid border-gf-line-hi hover:text-gf-hi"
              }`}
            >
              <Trophy size={10} /> Won
            </button>
            <button
              onClick={() => onSetOutcome(item.id, "lost")}
              className={`px-2.5 py-1 rounded-lg text-[10.5px] font-semibold border inline-flex items-center gap-1 transition ${
                lost
                  ? "text-[#FCA5A5] border-[rgba(248,113,113,0.4)] bg-[rgba(248,113,113,0.1)]"
                  : "text-gf-mid border-gf-line-hi hover:text-gf-hi"
              }`}
            >
              <XIcon size={10} /> Lost
            </button>
          </>
        ) : (
          <Link
            to="/draft-reviewer"
            className="px-2.5 py-1 rounded-lg text-[10.5px] font-semibold border text-[#C4B5FD] bg-[rgba(139,92,246,0.14)] border-[rgba(139,92,246,0.35)] inline-flex items-center gap-1"
          >
            <Pencil size={10} /> Draft outreach
          </Link>
        )}
      </div>
    </div>
  );
}