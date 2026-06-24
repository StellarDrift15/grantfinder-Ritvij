import { motion, AnimatePresence } from "framer-motion";
import { SearchX, Sparkles } from "lucide-react";
import SponsorshipCard from "./SponsorshipCard";

function ScanningState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-6">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-4 border-purple-100 border-t-purple-500 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles size={18} className="text-purple-400" />
        </div>
      </div>
      <div className="text-center">
        <p className="text-base font-semibold text-slate-700">AI is finding sponsors…</p>
        <p className="text-sm text-slate-400 mt-1">Matching your team profile to sponsorship opportunities</p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
      <div className="w-20 h-20 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <circle cx="18" cy="18" r="11" stroke="#C4B5FD" strokeWidth="2.5" />
          <path d="M26 26L33 33" stroke="#C4B5FD" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M14 18h8M18 14v8" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <div>
        <p className="text-base font-semibold text-slate-700">No scans yet</p>
        <p className="text-sm text-slate-400 mt-1 max-w-xs">
          Fill in your team profile and click <span className="font-medium text-purple-500">Find Sponsorship Matches</span> to discover companies to cold email.
        </p>
      </div>
    </div>
  );
}

function NoResultsState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
      <div className="w-20 h-20 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center">
        <SearchX size={32} className="text-amber-400" />
      </div>
      <div>
        <p className="text-base font-semibold text-slate-700">No strong matches found</p>
        <p className="text-sm text-slate-400 mt-1 max-w-xs">
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
          <h2 className="text-xl font-bold text-slate-800">Sponsorship Recommendations</h2>
          <p className="text-sm text-slate-500 mt-0.5">AI-matched companies to cold email, ranked by fit</p>
        </div>
        {hasScanned && !scanning && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-3.5 py-1.5"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-semibold text-emerald-700">
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
          <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-4">
            {results.map((result, i) => (
              <SponsorshipCard key={result.id || i} result={result} index={i} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}