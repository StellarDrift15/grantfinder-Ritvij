import { motion, AnimatePresence } from "framer-motion";
import { SearchX, Sparkles } from "lucide-react";
import GrantMatchCard from "./GrantMatchCard";

function ScanningState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-6">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-4 border-indigo-100 border-t-indigo-500 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles size={18} className="text-indigo-400" />
        </div>
      </div>
      <div className="text-center">
        <p className="text-base font-semibold text-slate-700">AI is scanning grants…</p>
        <p className="text-sm text-slate-400 mt-1">Analyzing eligibility across all available opportunities</p>
      </div>
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-indigo-300"
            animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
      <div className="w-20 h-20 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <circle cx="18" cy="18" r="11" stroke="#A5B4FC" strokeWidth="2.5" />
          <path d="M26 26L33 33" stroke="#A5B4FC" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M14 18h8M18 14v8" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <div>
        <p className="text-base font-semibold text-slate-700">No scans yet</p>
        <p className="text-sm text-slate-400 mt-1 max-w-xs">
          Fill in your organization profile and click <span className="font-medium text-indigo-500">Scan Eligible Grants</span> to discover matching opportunities.
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
          Try adding more detail to your mission keywords or expanding your focus area to surface additional grant opportunities.
        </p>
      </div>
    </div>
  );
}

export default function ResultsPanel({ results, scanning, hasScanned }) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Tailored Funding & Vouchers</h2>
          <p className="text-sm text-slate-500 mt-0.5">AI-matched grants, store credits & sponsorships ranked by eligibility</p>
        </div>
        {hasScanned && !scanning && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-3.5 py-1.5"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-semibold text-emerald-700">
              {results.length} match{results.length !== 1 ? "es" : ""} found
            </span>
          </motion.div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
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
              className="flex flex-col gap-4"
            >
              {results.map((result, i) => (
                <GrantMatchCard key={result.id || i} result={result} index={i} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}