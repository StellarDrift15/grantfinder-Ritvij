import { motion } from "framer-motion";
import { DollarSign, Sparkles, Building, ExternalLink, Globe, Mail } from "lucide-react";

function ConfidenceBadge({ score }) {
  const isGreen = score >= 80;
  const colorClass = isGreen
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : "bg-amber-50 text-amber-700 border-amber-200";
  const barColor = isGreen ? "bg-emerald-500" : "bg-amber-400";

  return (
    <div className={`flex items-center gap-2 rounded-full border px-3 py-1 ${colorClass}`}>
      <div className="relative w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div className={`absolute left-0 top-0 h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-bold">{score}% match</span>
    </div>
  );
}

function formatCurrency(amount) {
  if (!amount) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);
}

export default function SponsorshipCard({ result, index }) {
  const sponsor = result.sponsor || {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.07, 0.5) }}
      className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-800 text-base leading-snug">{sponsor.company_name || "Unknown Company"}</h3>
          {sponsor.industry && (
            <div className="flex items-center gap-1.5 mt-1">
              <Building size={12} className="text-slate-400 shrink-0" />
              <span className="text-xs text-slate-500">{sponsor.industry}</span>
            </div>
          )}
        </div>
        <ConfidenceBadge score={result.match_confidence} />
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {sponsor.typical_amount && (
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <DollarSign size={13} className="text-purple-400" />
            <span className="font-semibold text-slate-700">Usually offers {formatCurrency(sponsor.typical_amount)}</span>
          </div>
        )}
        {sponsor.geographic_focus && (
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-500">
            <Globe size={10} className="inline mr-1" />{sponsor.geographic_focus}
          </span>
        )}
        {sponsor.target_programs?.length > 0 && sponsor.target_programs.map((p, i) => (
          <span key={i} className="rounded-full bg-purple-50 border border-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-600">{p}</span>
        ))}
      </div>

      <div className="rounded-xl bg-purple-50 border border-purple-100 px-4 py-3 mb-3">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Sparkles size={12} className="text-purple-500" />
          <span className="text-xs font-semibold text-purple-600 uppercase tracking-wider">Why Contact Them</span>
        </div>
        <p className="text-sm text-slate-700 leading-relaxed">{result.match_reason || "No explanation provided."}</p>
      </div>

      <div className="flex items-center gap-2">
        {sponsor.contact_email && (
          <a href={`mailto:${sponsor.contact_email}`} className="flex items-center gap-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 px-3.5 py-2 text-xs font-semibold text-white transition-colors">
            <Mail size={12} /> Email Them
          </a>
        )}
        {sponsor.website_url && (
          <a href={sponsor.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-600 transition-colors">
            <ExternalLink size={12} /> Website
          </a>
        )}
      </div>
    </motion.div>
  );
}