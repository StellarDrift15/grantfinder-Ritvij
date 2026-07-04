import { useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Calendar, DollarSign, Sparkles, Building, ExternalLink, ThumbsUp, ThumbsDown } from "lucide-react";
import { base44 } from "@/api/base44Client";

function ConfidenceBadge({ score }) {
  const isGreen = score >= 80;
  const colorClass = isGreen
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : "bg-amber-50 text-amber-700 border-amber-200";
  const barColor = isGreen ? "bg-emerald-500" : "bg-amber-400";

  return (
    <div className={`flex items-center gap-2 rounded-full border px-3 py-1 ${colorClass}`}>
      <div className="relative w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div
          className={`absolute left-0 top-0 h-full rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-xs font-bold">{score}% match</span>
    </div>
  );
}

function formatCurrency(amount) {
  if (!amount) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const TYPE_STYLES = {
  "Cash Grant": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Store Credit": "bg-blue-50 text-blue-700 border-blue-200",
  "Material Sponsorship": "bg-orange-50 text-orange-700 border-orange-200",
};

const TYPE_LABELS = {
  "Cash Grant": "💰 Cash Grant",
  "Store Credit": "🎟 Store Credit",
  "Material Sponsorship": "📦 Material Sponsorship",
};

export default function GrantMatchCard({ result, index }) {
  const opportunity = result.opportunity || {};
  const [feedback, setFeedback] = useState(null);
  const [saved, setSaved] = useState(false);

  const handleFeedback = async (value) => {
    const next = feedback === value ? null : value;
    setFeedback(next);
    setSaved(!!next);
    if (next) {
      try {
        await base44.entities.MatchFeedback.create({
          funding_id: result.funding_id || opportunity.id || "",
          search_id: result.search_id || "",
          feedback: next,
        });
      } catch (e) {
        console.error("Feedback save failed", e);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.07, 0.5) }}
      className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
    >
      {/* Top row: title + badge */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          {opportunity.application_url ? (
            <a
              href={opportunity.application_url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-indigo-700 hover:text-indigo-900 hover:underline text-base leading-snug inline-flex items-center gap-1"
            >
              {opportunity.title || "Untitled Opportunity"}
              <ExternalLink size={13} className="shrink-0 opacity-60" />
            </a>
          ) : (
            <h3 className="font-semibold text-slate-800 text-base leading-snug">
              {opportunity.title || "Untitled Opportunity"}
            </h3>
          )}
          <div className="flex items-center gap-1.5 mt-1">
            <Building size={12} className="text-slate-400 shrink-0" />
            <span className="text-xs text-slate-500 truncate">{opportunity.provider_name || "Unknown Provider"}</span>
          </div>
        </div>
        <ConfidenceBadge score={result.match_confidence} />
      </div>

      {/* Stats row */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {opportunity.type && (
          <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${TYPE_STYLES[opportunity.type] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
            {TYPE_LABELS[opportunity.type] || opportunity.type}
          </span>
        )}
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <DollarSign size={13} className="text-indigo-400" />
          <span className="font-semibold text-slate-700">{formatCurrency(opportunity.value_amount)}</span>
        </div>
        {opportunity.deadline && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Calendar size={13} className="text-slate-400" />
            <span>Due {formatDate(opportunity.deadline)}</span>
          </div>
        )}
        {opportunity.accepts_robotics_teams && (
          <div className="flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-600">
            <Trophy size={11} />
            Robotics Eligible
          </div>
        )}
      </div>

      {/* Match Reason */}
      <div className="rounded-xl bg-indigo-50 border border-indigo-100 px-4 py-3">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Sparkles size={12} className="text-indigo-500" />
          <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Why You Match</span>
        </div>
        <p className="text-sm text-slate-700 leading-relaxed">{result.match_reason || "No explanation provided."}</p>
      </div>

      {/* Feedback row */}
      <div className="flex items-center gap-2 mt-3">
        <span className="text-xs text-slate-400">Was this relevant?</span>
        <button
          type="button"
          onClick={() => handleFeedback("up")}
          className={`flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
            feedback === "up"
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
          }`}
        >
          <ThumbsUp size={13} /> Yes
        </button>
        <button
          type="button"
          onClick={() => handleFeedback("down")}
          className={`flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
            feedback === "down"
              ? "bg-rose-50 border-rose-200 text-rose-700"
              : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
          }`}
        >
          <ThumbsDown size={13} /> No
        </button>
        {saved && <span className="text-xs text-emerald-500">Thanks — saved!</span>}
      </div>

      {/* Bottom row: sectors + apply link */}
      <div className="flex items-center justify-between mt-3 gap-3">
        {opportunity.target_sectors && opportunity.target_sectors.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {opportunity.target_sectors.map((sector, i) => (
              <span key={i} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-500">
                {sector}
              </span>
            ))}
          </div>
        ) : <div />}
        {opportunity.application_url && (
          <a
            href={opportunity.application_url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-3.5 py-2 text-xs font-semibold text-white transition-colors"
          >
            Apply Now <ExternalLink size={12} />
          </a>
        )}
      </div>
    </motion.div>
  );
}