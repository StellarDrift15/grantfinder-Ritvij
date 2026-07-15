import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SearchX, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
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

const PAGE_SIZE_OPTIONS = [10, 20, 50];

export default function ResultsPanel({ results, scanning, hasScanned }) {
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const sortedResults = [...results].sort((a, b) => {
    const aHasLink = !!a.opportunity?.application_url;
    const bHasLink = !!b.opportunity?.application_url;
    if (aHasLink && !bHasLink) return -1;
    if (!aHasLink && bHasLink) return 1;
    return 0;
  });

  const total = sortedResults.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, total);
  const pageResults = sortedResults.slice(startIdx, endIdx);

  const goToPage = (p) => {
    const target = Math.max(1, Math.min(p, totalPages));
    setPage(target);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const pageNumbers = [];
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1)) {
      pageNumbers.push(p);
    } else if (pageNumbers[pageNumbers.length - 1] !== "…") {
      pageNumbers.push("…");
    }
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Tailored Funding & Vouchers</h2>
          <p className="text-sm text-slate-500 mt-0.5">AI-matched grants, store credits & sponsorships ranked by eligibility</p>
        </div>
        {hasScanned && !scanning && results.length > 0 && (
          <div className="flex items-center gap-3">
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
            <div className="flex items-center gap-1.5 rounded-full bg-white border border-slate-200 px-2 py-1">
              <span className="text-xs font-medium text-slate-400 px-1">Show</span>
              {PAGE_SIZE_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => { setPageSize(opt); setPage(1); }}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                    pageSize === opt
                      ? "bg-indigo-600 text-white"
                      : "text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div>
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
              {pageResults.map((result, i) => (
                <GrantMatchCard key={result.id || i} result={result} index={startIdx + i} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {hasScanned && !scanning && totalPages > 1 && (
        <div className="mt-6 flex flex-col items-center gap-3">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={14} /> Prev
            </button>
            {pageNumbers.map((p, idx) =>
              p === "…" ? (
                <span key={`ellipsis-${idx}`} className="px-2 text-xs text-slate-400">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => goToPage(p)}
                  className={`min-w-[32px] rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    p === currentPage
                      ? "bg-indigo-600 text-white border border-indigo-600"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {p}
                </button>
              )
            )}
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
          <p className="text-xs text-slate-400">
            Showing {startIdx + 1}–{endIdx} of {total}
          </p>
        </div>
      )}
    </div>
  );
}