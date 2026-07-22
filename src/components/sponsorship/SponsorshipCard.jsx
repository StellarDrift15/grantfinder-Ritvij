import { motion } from "framer-motion";
import { DollarSign, Sparkles, Building, ExternalLink, Globe, Mail, Phone, MessageCircle, UserCheck } from "lucide-react";
import { trackGrantClick } from "@/lib/usage";

function ConfidenceBadge({ score }) {
  const isGreen = score >= 80;
  return (
    <div
      className={`flex items-center gap-2 rounded-full border px-3 py-1 ${
        isGreen
          ? "bg-[rgba(52,211,153,0.1)] text-[#6EE7B7] border-[rgba(52,211,153,0.3)]"
          : "bg-[rgba(251,191,36,0.1)] text-[#FCD34D] border-[rgba(251,191,36,0.3)]"
      }`}
    >
      <div className="relative w-20 h-1.5 bg-[rgba(148,163,184,0.16)] rounded-full overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all duration-700"
          style={{ width: `${score}%`, background: isGreen ? "#34D399" : "#FBBF24" }}
        />
      </div>
      <span className="text-xs font-bold font-mono">{score}% match</span>
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
      className="bg-gf-panel border border-gf-line rounded-[18px] p-5 hover:bg-gf-panel-hi hover:border-gf-line-hi transition-colors"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-semibold text-gf-hi text-base leading-snug">{sponsor.company_name || "Unknown Company"}</h3>
          {sponsor.industry && (
            <div className="flex items-center gap-1.5 mt-1">
              <Building size={12} className="text-gf-low shrink-0" />
              <span className="text-xs text-gf-low">{sponsor.industry}</span>
            </div>
          )}
        </div>
        <ConfidenceBadge score={result.match_confidence} />
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {sponsor.typical_amount && (
          <div className="flex items-center gap-1.5 text-xs text-gf-mid">
            <DollarSign size={13} className="text-[#A78BFA]" />
            <span className="font-semibold text-gf-hi font-mono">Usually offers {formatCurrency(sponsor.typical_amount)}</span>
          </div>
        )}
        {sponsor.sponsorship_status && (
          <span className="rounded-full bg-[rgba(139,92,246,0.14)] border border-[rgba(139,92,246,0.3)] px-2.5 py-0.5 text-xs font-medium text-[#C4B5FD]">{sponsor.sponsorship_status}</span>
        )}
        {sponsor.geographic_focus && (
          <span className="rounded-full bg-[rgba(148,163,184,0.08)] border border-gf-line px-2.5 py-0.5 text-xs text-gf-mid">
            <Globe size={10} className="inline mr-1" />{sponsor.geographic_focus}
          </span>
        )}
        {sponsor.target_programs?.length > 0 && sponsor.target_programs.map((p, i) => (
          <span key={i} className="rounded-full bg-[rgba(139,92,246,0.1)] border border-[rgba(139,92,246,0.25)] px-2.5 py-0.5 text-xs font-medium text-[#C4B5FD]">{p}</span>
        ))}
      </div>

      {result.has_mentor_connection ? (
        <div className="rounded-xl bg-[rgba(56,189,248,0.08)] border border-[rgba(56,189,248,0.25)] px-4 py-3 mb-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <UserCheck size={12} className="text-[#7DD3FC]" />
            <span className="text-xs font-semibold text-[#7DD3FC] uppercase tracking-wider">🎯 You have an internal connection!</span>
          </div>
          <p className="text-sm text-gf-mid leading-relaxed whitespace-pre-line">{result.match_reason || "No explanation provided."}</p>
        </div>
      ) : (
        <div className="rounded-xl bg-[rgba(139,92,246,0.08)] border border-[rgba(139,92,246,0.22)] px-4 py-3 mb-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Sparkles size={12} className="text-[#A78BFA]" />
            <span className="text-xs font-semibold text-[#C4B5FD] uppercase tracking-wider">Why contact them</span>
          </div>
          <p className="text-sm text-gf-mid leading-relaxed">{result.match_reason || "No explanation provided."}</p>
        </div>
      )}

      {sponsor.community_notes && (
        <div className="rounded-xl bg-[rgba(251,191,36,0.06)] border border-[rgba(251,191,36,0.22)] px-4 py-3 mb-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <MessageCircle size={12} className="text-[#FCD34D]" />
            <span className="text-xs font-semibold text-[#FCD34D] uppercase tracking-wider">Community notes</span>
          </div>
          <p className="text-xs text-gf-mid leading-relaxed">{sponsor.community_notes}</p>
        </div>
      )}

      <div className="flex items-center gap-2">
        {sponsor.contact_email && (
          <a href={`mailto:${sponsor.contact_email}`} onClick={() => trackGrantClick(sponsor.typical_amount)} className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold text-white transition-colors" style={{ background: "linear-gradient(120deg,#8B5CF6,#38BDF8 55%,#22D3EE)" }}>
            <Mail size={12} /> Email them
          </a>
        )}
        {sponsor.contact_phone && (
          <a href={`tel:${sponsor.contact_phone}`} className="flex items-center gap-1.5 rounded-lg bg-[rgba(148,163,184,0.12)] hover:bg-[rgba(148,163,184,0.2)] border border-gf-line-hi px-3.5 py-2 text-xs font-semibold text-gf-hi transition-colors">
            <Phone size={12} /> Call
          </a>
        )}
        {sponsor.website_url && (
          <a href={sponsor.website_url} target="_blank" rel="noopener noreferrer" onClick={() => trackGrantClick(sponsor.typical_amount)} className="flex items-center gap-1.5 rounded-lg border border-gf-line hover:bg-gf-panel-hi px-3.5 py-2 text-xs font-semibold text-gf-mid transition-colors">
            <ExternalLink size={12} /> Website
          </a>
        )}
      </div>
    </motion.div>
  );
}