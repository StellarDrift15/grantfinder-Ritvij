import { motion } from "framer-motion";
import { Trophy, Calendar, DollarSign, Sparkles, Building } from "lucide-react";

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

export default function GrantMatchCard({ result, index }) {
  const grant = result.grant || {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.07 }}
      className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
    >
      {/* Top row: title + badge */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-800 text-base leading-snug truncate">
            {grant.grant_title || "Untitled Grant"}
          </h3>
          <div className="flex items-center gap-1.5 mt-1">
            <Building size={12} className="text-slate-400 shrink-0" />
            <span className="text-xs text-slate-500 truncate">{grant.funder_name || "Unknown Funder"}</span>
          </div>
        </div>
        <ConfidenceBadge score={result.match_confidence} />
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <DollarSign size={13} className="text-indigo-400" />
          <span className="font-semibold text-slate-700">Up to {formatCurrency(grant.award_amount_max)}</span>
        </div>
        {grant.deadline && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Calendar size={13} className="text-slate-400" />
            <span>Due {formatDate(grant.deadline)}</span>
          </div>
        )}
        {grant.accepts_robotics_teams && (
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

      {/* Tags */}
      {grant.criteria_tags && grant.criteria_tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {grant.criteria_tags.slice(0, 5).map((tag, i) => (
            <span
              key={i}
              className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-500"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
}