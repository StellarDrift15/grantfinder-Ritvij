import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { ScanLine, Sparkles, Bookmark, Wallet, RefreshCw, Download, ExternalLink, Lightbulb } from "lucide-react";
import Shell from "@/components/Shell";
import { base44 } from "@/api/base44Client";
import { typeKeyOf, TYPE_COLORS, fmtAmount } from "@/lib/opportunity";

function StatCard({ Icon, label, value, mint }) {
  return (
    <div className="rounded-2xl border border-gf-line bg-gf-panel p-4">
      <div className="flex items-center gap-2 mb-2 text-gf-low">
        <Icon size={14} />
        <span className="text-[11px] uppercase tracking-wider">{label}</span>
      </div>
      <div className={`font-mono text-2xl font-semibold ${mint ? "text-gf-mint" : "text-gf-hi"}`}>{value}</div>
    </div>
  );
}

export default function Reports() {
  const [scans, setScans] = useState([]);
  const [matches, setMatches] = useState([]);
  const [oppMap, setOppMap] = useState({});
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);
  const [insight, setInsight] = useState("");
  const [insightLoading, setInsightLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [s, m, o, sv] = await Promise.all([
          base44.entities.SearchHistory.list("-timestamp", 200),
          base44.entities.MatchingResults.list("-created_date", 500),
          base44.entities.FundingOpportunities.list("-created_date", 500),
          base44.entities.SavedOpportunity.list("-created_date", 500),
        ]);
        setScans(s || []);
        setMatches(m || []);
        setSaved(sv || []);
        const map = {};
        (o || []).forEach((x) => { map[x.id] = x; });
        setOppMap(map);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const matchesByType = useMemo(() => {
    const counts = { grant: 0, inkind: 0, sponsor: 0, voucher: 0 };
    matches.forEach((mr) => {
      const o = oppMap[mr.funding_id];
      if (o) counts[typeKeyOf(o.type)]++;
    });
    return [
      { name: "Grants", key: "grant", value: counts.grant },
      { name: "In-kind", key: "inkind", value: counts.inkind },
      { name: "Sponsorships", key: "sponsor", value: counts.sponsor },
      { name: "Vouchers", key: "voucher", value: counts.voucher },
    ].filter((x) => x.value > 0);
  }, [matches, oppMap]);

  const scoresByScan = useMemo(() => {
    const byScan = {};
    matches.forEach((mr) => {
      (byScan[mr.search_id] = byScan[mr.search_id] || []).push(mr.match_confidence || 0);
    });
    return scans
      .map((sc, i) => {
        const arr = byScan[sc.id] || [];
        const top = arr.length ? Math.max(...arr) : 0;
        const avg = arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
        return { name: `Scan ${scans.length - i}`, top, avg };
      })
      .reverse()
      .slice(-8);
  }, [scans, matches]);

  const pipelineValue = saved.reduce((s, it) => s + (it.amount || 0), 0);

  const rows = useMemo(
    () =>
      scans.map((sc, i) => {
        const ms = matches.filter((m) => m.search_id === sc.id);
        const top = ms.length ? Math.max(...ms.map((m) => m.match_confidence || 0)) : 0;
        return {
          date: sc.timestamp,
          matches: ms.length,
          top,
          idx: scans.length - i,
        };
      }),
    [scans, matches]
  );

  const generateInsight = async () => {
    setInsightLoading(true);
    try {
      const topType = matchesByType.sort((a, b) => b.value - a.value)[0];
      const soon = saved.filter((it) => {
        if (!it.deadline) return false;
        const days = Math.ceil((new Date(it.deadline) - Date.now()) / 86400000);
        return days >= 0 && days <= 14;
      }).length;
      const prompt = `You are an analytics assistant for a nonprofit using GrantFinder. Write 2-3 plain sentences of insight citing these real numbers only:
- Scans run: ${scans.length}
- Total matches found: ${matches.length}
- Saved opportunities: ${saved.length}
- Pipeline value: $${pipelineValue.toLocaleString()}
- Strongest category: ${topType ? topType.name : "n/a"} (${topType ? topType.value : 0} matches)
- Saved items with a deadline inside 14 days: ${soon}
Suggest one focus-area tag the org might add to find more. Keep it concise and specific. No bullet points.`;
      const res = await base44.integrations.Core.InvokeLLM({ prompt, model: "gpt_5_mini" });
      setInsight(typeof res === "string" ? res : JSON.stringify(res));
    } catch {
      setInsight("Insight unavailable right now — try refreshing.");
    } finally {
      setInsightLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && scans.length > 0) generateInsight();
  }, [loading, scans.length]);

  const exportCsv = () => {
    const header = "Date,Sources scanned,Matches,Top score,Duration\n";
    const body = rows
      .map((r) => {
        const d = r.date ? new Date(r.date).toLocaleString() : "—";
        return `${d},12,400+,${r.matches},${r.top},—`;
      })
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "grantfinder-scans.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Shell active="Reports">
      <div className="mb-6">
        <div className="font-mono text-[10.5px] font-semibold tracking-[0.14em] uppercase text-gf-cyan mb-2">Analytics</div>
        <h1 className="font-display text-2xl font-bold text-gf-hi tracking-tight">Reports</h1>
        <p className="text-[13px] text-gf-low mt-1">How your funding search is going.</p>
      </div>

      {loading ? (
        <div className="gf-skel h-40 rounded-[18px] border border-gf-line" />
      ) : scans.length === 0 ? (
        <div className="border border-dashed border-gf-line-hi rounded-[18px] py-16 px-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gf-panel border border-gf-line grid place-items-center mx-auto mb-4">
            <ScanLine size={24} className="text-gf-low" />
          </div>
          <h3 className="font-display text-lg font-semibold text-gf-hi mb-2">No scans yet</h3>
          <p className="text-[13.5px] text-gf-low mb-5">Run your first scan from the Dashboard.</p>
          <Link
            to="/"
            className="px-4 py-2 rounded-lg text-gf-hi font-semibold text-[13px] transition"
            style={{ backgroundImage: "linear-gradient(120deg,#8B5CF6,#38BDF8 55%,#22D3EE)" }}
          >
            Go to dashboard
          </Link>
        </div>
      ) : (
        <>
          {/* stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <StatCard Icon={ScanLine} label="Scans run" value={scans.length} />
            <StatCard Icon={Sparkles} label="Matches found" value={matches.length} />
            <StatCard Icon={Bookmark} label="Saved" value={saved.length} />
            <StatCard Icon={Wallet} label="Pipeline value" value={fmtAmount(pipelineValue, "grant")} mint />
          </div>

          {/* charts */}
          <div className="grid lg:grid-cols-2 gap-4 mb-6">
            <div className="rounded-2xl border border-gf-line bg-gf-panel p-5">
              <h3 className="font-display text-sm font-semibold text-gf-hi mb-4">Matches by type</h3>
              {matchesByType.length === 0 ? (
                <p className="text-sm text-gf-low">No matches yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={matchesByType} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                      {matchesByType.map((e) => (
                        <Cell key={e.key} fill={TYPE_COLORS[e.key]} stroke="#070B14" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: "#0b1424", border: "1px solid rgba(148,163,184,0.2)", borderRadius: 10, color: "#F1F5F9", fontSize: 12 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12, color: "#94A3B8" }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="rounded-2xl border border-gf-line bg-gf-panel p-5">
              <h3 className="font-display text-sm font-semibold text-gf-hi mb-4">Scores by scan</h3>
              {scoresByScan.length === 0 ? (
                <p className="text-sm text-gf-low">No scored scans yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={scoresByScan}>
                    <XAxis dataKey="name" tick={{ fill: "#64748B", fontSize: 11 }} stroke="rgba(148,163,184,0.14)" />
                    <YAxis tick={{ fill: "#64748B", fontSize: 11 }} stroke="rgba(148,163,184,0.14)" domain={[0, 100]} />
                    <Tooltip
                      cursor={{ fill: "rgba(148,163,184,0.06)" }}
                      contentStyle={{ background: "#0b1424", border: "1px solid rgba(148,163,184,0.2)", borderRadius: 10, color: "#F1F5F9", fontSize: 12 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12, color: "#94A3B8" }} />
                    <Bar dataKey="top" name="Top score" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="avg" name="Average" fill="#22D3EE" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* AI insight */}
          <div className="rounded-2xl border border-[rgba(139,92,246,0.25)] bg-[rgba(139,92,246,0.06)] p-5 mb-6">
            <div className="flex items-start gap-3">
              <span className="w-9 h-9 rounded-xl grid place-items-center border shrink-0" style={{ background: "rgba(139,92,246,0.14)", borderColor: "rgba(139,92,246,0.3)" }}>
                <Lightbulb size={16} className="text-[#C4B5FD]" />
              </span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1.5">
                  <h3 className="font-display text-sm font-semibold text-gf-hi">AI insight</h3>
                  <button
                    onClick={generateInsight}
                    disabled={insightLoading}
                    className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-gf-mid hover:text-gf-hi disabled:opacity-60 transition"
                  >
                    <RefreshCw size={12} className={insightLoading ? "animate-spin" : ""} /> Refresh insight
                  </button>
                </div>
                <p className="text-[13px] text-gf-mid leading-relaxed">{insightLoading ? "Generating…" : insight}</p>
              </div>
            </div>
          </div>

          {/* scan history table */}
          <div className="rounded-2xl border border-gf-line bg-gf-panel overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gf-line">
              <h3 className="font-display text-sm font-semibold text-gf-hi">Scan history</h3>
              <button
                onClick={exportCsv}
                className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-gf-mid hover:text-gf-hi transition"
              >
                <Download size={13} /> Export CSV
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wider text-gf-low border-b border-gf-line">
                    <th className="px-5 py-2.5 font-semibold">Date</th>
                    <th className="px-5 py-2.5 font-semibold">Sources</th>
                    <th className="px-5 py-2.5 font-semibold">Matches</th>
                    <th className="px-5 py-2.5 font-semibold">Top score</th>
                    <th className="px-5 py-2.5 font-semibold">Duration</th>
                    <th className="px-5 py-2.5 font-semibold text-right">Results</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className="border-b border-gf-line last:border-0 hover:bg-gf-panel-hi transition-colors">
                      <td className="px-5 py-3 text-gf-mid">{r.date ? new Date(r.date).toLocaleString() : "—"}</td>
                      <td className="px-5 py-3 font-mono text-gf-mid">12,400+</td>
                      <td className="px-5 py-3 font-mono text-gf-hi">{r.matches}</td>
                      <td className="px-5 py-3 font-mono text-gf-hi">{r.top}</td>
                      <td className="px-5 py-3 font-mono text-gf-low">—</td>
                      <td className="px-5 py-3 text-right">
                        <Link
                          to={`/?scan=${scans[i].id}`}
                          className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#7DD3FC] hover:text-gf-sky"
                        >
                          View <ExternalLink size={12} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </Shell>
  );
}