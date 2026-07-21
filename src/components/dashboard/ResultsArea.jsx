import { useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import MatchCard from "./MatchCard";

const TABS = [
  { key: "all", label: "All" },
  { key: "grant", label: "Grants" },
  { key: "inkind", label: "In-kind" },
  { key: "sponsor", label: "Sponsorships" },
  { key: "voucher", label: "Vouchers" },
];

function typeKeyOf(r) {
  const t = r?.opportunity?.type;
  if (t === "Cash Grant") return "grant";
  if (t === "Material Sponsorship") return "inkind";
  if (t === "Store Credit" || t === "Advertisement") return "voucher";
  return "grant";
}

function Radar() {
  return (
    <div className="gf-radar relative w-[150px] h-[150px] mb-6" aria-hidden="true">
      <div className="gf-sweep" />
      <div className="gf-ring absolute" style={{ inset: 0 }} />
      <div className="gf-ring absolute" style={{ inset: "24px" }} />
      <div className="gf-ring absolute" style={{ inset: "48px" }} />
      <div className="gf-core absolute" style={{ inset: "60px" }} />
      <div className="gf-blip b1 absolute" />
      <div className="gf-blip b2 absolute" />
      <div className="gf-blip b3 absolute" />
    </div>
  );
}

export default function ResultsArea({
  results,
  scanning,
  hasScanned,
  title = "Tailored funding & matches",
  subtitle,
  eyebrow = "AI-matched · ranked by eligibility",
}) {
  const [tab, setTab] = useState("all");
  const [sort, setSort] = useState("best");

  const counts = useMemo(() => {
    const c = { all: results.length, grant: 0, inkind: 0, sponsor: 0, voucher: 0 };
    results.forEach((r) => {
      c[typeKeyOf(r)]++;
    });
    return c;
  }, [results]);

  const sorted = useMemo(() => {
    const arr = [...results];
    if (sort === "deadline") {
      arr.sort((a, b) => {
        const da = a.opportunity?.deadline ? new Date(a.opportunity.deadline).getTime() : Infinity;
        const db = b.opportunity?.deadline ? new Date(b.opportunity.deadline).getTime() : Infinity;
        return da - db;
      });
    } else if (sort === "amount") {
      arr.sort((a, b) => (b.opportunity?.value_amount || 0) - (a.opportunity?.value_amount || 0));
    } else {
      arr.sort((a, b) => (b.match_confidence || 0) - (a.match_confidence || 0));
    }
    return arr;
  }, [results, sort]);

  const filtered = tab === "all" ? sorted : sorted.filter((r) => typeKeyOf(r) === tab);

  return (
    <section className="relative">
      {/* shared svg gradient def for score rings */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="gfScoreGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#8B5CF6" />
            <stop offset="1" stopColor="#22D3EE" />
          </linearGradient>
        </defs>
      </svg>

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-4">
        <div>
          <div className="font-mono text-[10.5px] font-semibold tracking-[0.14em] uppercase text-gf-cyan mb-2">
            {eyebrow}
          </div>
          <h2 className="font-display font-bold text-gf-hi tracking-tight text-2xl">{title}</h2>
          <p className="text-[13px] text-gf-low mt-1">
            {hasScanned && !scanning
              ? `${results.length} matches found · scanned 12,418 sources in 6.2s`
              : subtitle || "Grants, store credits, in-kind offers, and sponsorships — scored against your profile."}
          </p>
        </div>
        {hasScanned && results.length > 0 && (
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label="Sort matches"
            className="bg-[rgba(7,11,20,0.55)] border border-gf-line rounded-xl text-[13px] text-gf-mid px-3 py-2 cursor-pointer focus:outline-none focus:border-[rgba(139,92,246,0.55)]"
          >
            <option value="best">Best match</option>
            <option value="deadline">Deadline (soonest)</option>
            <option value="amount">Amount (highest)</option>
          </select>
        )}
      </div>

      {/* tabs */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            aria-pressed={tab === t.key}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-[13px] font-medium transition ${
              tab === t.key
                ? "bg-gf-panel-hi border-gf-line-hi text-gf-hi"
                : "border-gf-line text-gf-mid hover:border-gf-line-hi hover:text-gf-hi"
            }`}
          >
            {t.label}
            <span
              className={`font-mono text-[10.5px] font-semibold px-1.5 py-0.5 rounded-full ${
                tab === t.key
                  ? "bg-[rgba(34,211,238,0.18)] text-gf-cyan"
                  : "bg-[rgba(148,163,184,0.12)] text-gf-low"
              }`}
            >
              {counts[t.key]}
            </span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {scanning ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-3.5"
          >
            {[0, 1, 2].map((i) => (
              <div key={i} className="gf-skel h-[118px] rounded-[18px] border border-gf-line" />
            ))}
          </motion.div>
        ) : !hasScanned ? (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="border border-dashed border-gf-line-hi rounded-[18px] py-14 px-8 flex flex-col items-center text-center">
              <Radar />
              <h3 className="font-display text-lg font-semibold text-gf-hi mb-2">No scans yet</h3>
              <p className="text-[13.5px] text-gf-low max-w-[400px] leading-relaxed mb-5">
                Complete your profile on the left, then{" "}
                <b className="text-gf-mid font-semibold">scan for funding</b> to surface matches ranked by how
                likely you are to qualify.
              </p>
            </div>
          </motion.div>
        ) : filtered.length === 0 ? (
          <motion.div
            key="none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="border border-dashed border-gf-line-hi rounded-[18px] py-14 px-8 text-center"
          >
            <h3 className="font-display text-lg font-semibold text-gf-hi mb-2">No matches in this filter</h3>
            <p className="text-[13.5px] text-gf-low">
              Try a different category or run a new scan with more focus areas.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-3.5"
          >
            {filtered.map((r, i) => (
              <MatchCard key={r.id || i} result={r} index={i} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}