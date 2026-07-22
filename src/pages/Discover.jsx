import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, SlidersHorizontal, Clock, ChevronRight, AlertCircle } from "lucide-react";
import Shell from "@/components/Shell";
import OpportunityCard from "@/components/discover/OpportunityCard";
import { base44 } from "@/api/base44Client";
import { toggleSaveOpportunity, fetchSavedIds } from "@/lib/saved";
import { typeKeyOf, deadlineInfo, heuristicScore } from "@/lib/opportunity";

const FOCUS_AREAS = [
  "STEM",
  "FIRST Robotics",
  "FIRST LEGO League (FLL)",
  "Education",
  "Youth Education",
  "Community Outreach",
  "Environment",
  "Arts",
  "Human Services",
  "Health & Wellness",
  "Workforce Development",
  "Hackathon (Virtual)",
  "Hackathon (In-Person)",
];

const TYPE_TABS = [
  { key: "all", label: "All" },
  { key: "grant", label: "Grants" },
  { key: "inkind", label: "In-kind" },
  { key: "sponsor", label: "Sponsorships" },
  { key: "voucher", label: "Vouchers" },
];

const selectCls =
  "bg-[rgba(7,11,20,0.55)] border border-gf-line rounded-lg text-[12.5px] text-gf-mid px-3 py-2 cursor-pointer focus:outline-none focus:border-[rgba(139,92,246,0.55)]";

const PAGE_SIZE = 12;

export default function Discover() {
  const [opps, setOpps] = useState([]);
  const [profile, setProfile] = useState(null);
  const [savedIds, setSavedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");
  const [typeTab, setTypeTab] = useState("all");
  const [focus, setFocus] = useState("any");
  const [region, setRegion] = useState("any");
  const [amount, setAmount] = useState("any");
  const [deadline, setDeadline] = useState("any");
  const [sort, setSort] = useState("best");
  const [page, setPage] = useState(1);

  useEffect(() => {
    (async () => {
      try {
        const [list, profiles, saved] = await Promise.all([
          base44.entities.FundingOpportunities.list("-created_date", 500),
          base44.entities.Nonprofits.list("-created_date", 1),
          fetchSavedIds(),
        ]);
        setOpps(list || []);
        setProfile((profiles && profiles[0]) || null);
        setSavedIds(saved);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const hasProfile = !!(profile && Array.isArray(profile.focus_area) && profile.focus_area.length > 0);

  const filtered = useMemo(() => {
    let arr = opps.filter((o) => {
      const tk = typeKeyOf(o.type);
      if (typeTab !== "all" && tk !== typeTab) return false;
      if (focus !== "any" && !((o.target_sectors || []).includes(focus))) return false;
      if (region !== "any") {
        const hay = ((o.title || "") + " " + (o.description || "") + " " + (o.target_sectors || []).join(" ")).toLowerCase();
        if (!hay.includes(region.toLowerCase())) return false;
      }
      if (amount !== "any") {
        const cap = amount === "5k" ? 5000 : amount === "25k" ? 25000 : amount === "100k" ? 100000 : Infinity;
        if ((o.value_amount || 0) > cap) return false;
      }
      if (deadline !== "any") {
        const d = deadlineInfo(o.deadline);
        if (deadline === "rolling") {
          if (d.days !== Infinity) return false;
        } else {
          const limit = deadline === "30" ? 30 : 90;
          if (d.days === Infinity || d.days < 0 || d.days > limit) return false;
        }
      }
      if (query.trim()) {
        const hay = ((o.title || "") + " " + (o.provider_name || "") + " " + (o.description || "")).toLowerCase();
        if (!hay.includes(query.trim().toLowerCase())) return false;
      }
      return true;
    });

    const withScore = arr.map((o) => ({ o, score: hasProfile ? heuristicScore(o, profile) : null }));

    if (sort === "deadline") {
      withScore.sort((a, b) => deadlineInfo(a.o.deadline).days - deadlineInfo(b.o.deadline).days);
    } else if (sort === "amount") {
      withScore.sort((a, b) => (b.o.value_amount || 0) - (a.o.value_amount || 0));
    } else if (sort === "newest") {
      withScore.sort((a, b) => new Date(b.o.created_date || 0) - new Date(a.o.created_date || 0));
    } else {
      withScore.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    }
    return withScore;
  }, [opps, typeTab, focus, region, amount, deadline, sort, query, hasProfile, profile]);

  const closingSoon = useMemo(
    () =>
      opps
        .map((o) => ({ o, d: deadlineInfo(o.deadline) }))
        .filter((x) => x.d.days >= 0 && x.d.days <= 30)
        .sort((a, b) => a.d.days - b.d.days)
        .slice(0, 12),
    [opps]
  );

  const visible = filtered.slice(0, page * PAGE_SIZE);

  const handleToggleSave = async (o, score) => {
    const now = await toggleSaveOpportunity(o, score);
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (now) next.add(o.id);
      else next.delete(o.id);
      return next;
    });
  };

  const clearFilters = () => {
    setQuery("");
    setTypeTab("all");
    setFocus("any");
    setRegion("any");
    setAmount("any");
    setDeadline("any");
    setSort("best");
    setPage(1);
  };

  return (
    <Shell active="Discover">
      <div className="mb-6">
        <div className="font-mono text-[10.5px] font-semibold tracking-[0.14em] uppercase text-gf-cyan mb-2">
          Directory · 12,400+ sources
        </div>
        <h1 className="font-display text-2xl font-bold text-gf-hi tracking-tight">Discover funding</h1>
        <p className="text-[13px] text-gf-low mt-1">
          Browse every grant, voucher, in-kind offer, and sponsorship — no scan required.
        </p>
      </div>

      {!hasProfile && (
        <div className="flex items-center gap-2.5 rounded-xl border border-[rgba(56,189,248,0.25)] bg-[rgba(56,189,248,0.06)] px-4 py-3 mb-5">
          <AlertCircle size={15} className="text-[#7DD3FC] shrink-0" />
          <p className="text-[13px] text-gf-mid">
            Complete your profile to see match scores.{" "}
            <Link to="/" className="text-[#7DD3FC] font-semibold hover:text-gf-sky">
              Go to dashboard →
            </Link>
          </p>
        </div>
      )}

      {/* search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gf-low" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          placeholder="Search by name, funder, or keyword…"
          className="w-full rounded-xl border border-gf-line bg-gf-panel pl-10 pr-4 py-3 text-sm text-gf-hi placeholder:text-[#475569] focus:outline-none focus:border-[rgba(139,92,246,0.55)] focus:shadow-[0_0_0_3px_rgba(139,92,246,0.14)]"
        />
      </div>

      {/* filter row */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        {TYPE_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => {
              setTypeTab(t.key);
              setPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-full border text-[12.5px] font-medium transition ${
              typeTab === t.key
                ? "bg-gf-panel-hi border-gf-line-hi text-gf-hi"
                : "border-gf-line text-gf-mid hover:border-gf-line-hi hover:text-gf-hi"
            }`}
          >
            {t.label}
          </button>
        ))}
        <span className="w-px h-5 bg-gf-line mx-1" />
        <select value={focus} onChange={(e) => { setFocus(e.target.value); setPage(1); }} className={selectCls} aria-label="Focus area">
          <option value="any">Focus area: Any</option>
          {FOCUS_AREAS.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
        <select value={region} onChange={(e) => { setRegion(e.target.value); setPage(1); }} className={selectCls} aria-label="Region">
          <option value="any">Region: Any</option>
          <option value="texas">Texas</option>
          <option value="national">National</option>
        </select>
        <select value={amount} onChange={(e) => { setAmount(e.target.value); setPage(1); }} className={selectCls} aria-label="Amount">
          <option value="any">Amount: Any</option>
          <option value="5k">≤ $5,000</option>
          <option value="25k">≤ $25,000</option>
          <option value="100k">≤ $100,000</option>
        </select>
        <select value={deadline} onChange={(e) => { setDeadline(e.target.value); setPage(1); }} className={selectCls} aria-label="Deadline">
          <option value="any">Deadline: Any</option>
          <option value="30">≤ 30 days</option>
          <option value="90">≤ 90 days</option>
          <option value="rolling">Rolling</option>
        </select>
        <span className="w-px h-5 bg-gf-line mx-1" />
        <SlidersHorizontal size={13} className="text-gf-low" />
        <select value={sort} onChange={(e) => setSort(e.target.value)} className={selectCls} aria-label="Sort">
          <option value="best">Best match</option>
          <option value="deadline">Deadline</option>
          <option value="amount">Amount</option>
          <option value="newest">Newest</option>
        </select>
      </div>

      {/* closing soon rail */}
      {closingSoon.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={14} className="text-[#FCD34D]" />
            <h2 className="font-display text-sm font-semibold text-gf-hi">Closing soon</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
            {closingSoon.map(({ o, d }) => (
              <div
                key={o.id}
                className="min-w-[230px] max-w-[230px] rounded-xl border border-[rgba(251,191,36,0.3)] bg-[rgba(251,191,36,0.05)] p-3.5 shrink-0"
              >
                <span className="font-mono text-[9.5px] uppercase tracking-widest px-1.5 py-0.5 rounded-full border text-[#FCD34D] border-[rgba(251,191,36,0.3)] bg-[rgba(251,191,36,0.1)]">
                  {typeKeyOf(o.type)}
                </span>
                <h3 className="font-display text-[13.5px] font-semibold text-gf-hi mt-1.5 leading-tight">{o.title}</h3>
                <div className="text-[11px] text-gf-low mt-0.5">{o.provider_name}</div>
                <div className="font-mono text-[11px] text-[#FCD34D] mt-2">{d.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* main grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="gf-skel h-[120px] rounded-[18px] border border-gf-line" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="border border-dashed border-gf-line-hi rounded-[18px] py-14 px-8 text-center">
          <h3 className="font-display text-lg font-semibold text-gf-hi mb-2">No opportunities match those filters</h3>
          <p className="text-[13.5px] text-gf-low mb-5">Try widening your search or clearing the filters.</p>
          <button onClick={clearFilters} className="px-4 py-2 rounded-lg border border-gf-line-hi text-gf-mid hover:text-gf-hi hover:border-[rgba(34,211,238,0.5)] hover:bg-[rgba(34,211,238,0.06)] text-[13px] font-semibold transition">
            Clear filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 gap-4">
            {visible.map(({ o, score }) => (
              <OpportunityCard
                key={o.id}
                opp={o}
                score={score}
                saved={savedIds.has(o.id)}
                onToggleSave={() => handleToggleSave(o, score)}
              />
            ))}
          </div>
          {visible.length < filtered.length && (
            <div className="flex justify-center mt-6">
              <button
                onClick={() => setPage((p) => p + 1)}
                className="px-5 py-2.5 rounded-xl border border-gf-line-hi bg-gf-panel text-gf-mid hover:text-gf-hi hover:bg-gf-panel-hi text-[13px] font-semibold transition inline-flex items-center gap-1.5"
              >
                Load more <ChevronRight size={14} />
              </button>
            </div>
          )}
        </>
      )}
    </Shell>
  );
}