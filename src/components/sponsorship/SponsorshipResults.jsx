import { motion, AnimatePresence } from "framer-motion";
import { SearchX, Sparkles } from "lucide-react";
import SponsorshipCard from "./SponsorshipCard";

function ScanningState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-6">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-4 border-[rgba(139,92,246,0.18)] border-t-gf-violet animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles size={18} className="text-[#A78BFA]" />
        </div>
      </div>
      <div className="text-center">
        <p className="text-base font-semibold text-gf-hi">AI is finding sponsors…</p>
        <p className="text-sm text-gf-low mt-1">Matching your team profile to sponsorship opportunities</p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
      <div className="w-20 h-20 rounded-2xl bg-gf-panel border border-gf-line flex items-center justify-center">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <circle cx="18" cy="18" r="11" stroke="#A78BFA" strokeWidth="2.5" />
          <path d="M26 26L33 33" stroke="#A78BFA" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M14 18h8M18 14v8" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <div>
        <p className="text-base font-semibold text-gf-hi">No scans yet</p>
        <p className="text-sm text-gf-low mt-1 max-w-xs">
          Fill in your team profile and click{" "}
          <span className="font-medium text-[#A78BFA]">Find sponsorship matches</span> to discover companies to cold email.
        </p>
      </div>
    </div>
  );
}

function NoResultsState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
      <div className="w-20 h-20 rounded-2xl bg-[rgba(251,191,36,0.08)] border border-[rgba(251,191,36,0.22)] flex items-center justify-center">
        <SearchX size={32} className="text-[#FCD34D]" />
      </div>
      <div>
        <p className="text-base font-semibold text-gf-hi">No strong matches found</p>
        <p className="text-sm text-gf-low mt-1 max-w-xs">
          Try adding more detail about your team or expanding your description.
        </p>
      </div>
    </div>
  );
}

export default function SponsorshipResults({ results, scanning, hasScanned }) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="font-mono text-[10.5px] font-semibold tracking-[0.14em] uppercase text-gf-cyan mb-2">
            AI-matched · ranked by fit
          </div>
          <h2 className="font-display font-bold text-gf-hi tracking-tight text-2xl">Sponsorship recommendations</h2>
          <p className="text-[13px] text-gf-low mt-1">Companies to cold email, ranked by sponsorship fit</p>
        </div>
        {hasScanned && !scanning && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 rounded-full bg-[rgba(52,211,153,0.1)] border border-[rgba(52,211,153,0.3)] px-3.5 py-1.5"
          >
            <div className="w-2 h-2 rounded-full bg-gf-mint" />
            <span className="text-xs font-semibold text-[#6EE7B7]">
              {results.length} sponsor{results.length !== 1 ? "s" : ""} found
            </span>
          </motion.div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {scanning ? (
          <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ScanningState />
          </motion.div>
        ) : !hasScanned ? (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <EmptyState />
          </motion.div>
        ) : results.length === 0 ? (
          <motion.div key="noresults" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <NoResultsState />
          </motion.div>
        ) : (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-3.5"
          >
            {results.map((result, i) => (
              <SponsorshipCard key={result.id || i} result={result} index={i} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}