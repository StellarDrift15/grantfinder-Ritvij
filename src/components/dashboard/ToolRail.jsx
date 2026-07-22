import { Link } from "react-router-dom";
import { Handshake, TrendingUp, ClipboardCheck, Gift, FileText, ArrowRight } from "lucide-react";

const TOOLS = [
  {
    to: "/sponsorship-finder",
    Icon: Handshake,
    title: "Sponsorship finder",
    desc: "AI-matched companies, plus a cold email drafted for each one.",
    hue: "linear-gradient(90deg,#8B5CF6,#A78BFA)",
    tint: "rgba(139,92,246,0.12)",
    border: "rgba(139,92,246,0.28)",
    icon: "#A78BFA",
  },
  {
    to: "/cold-calling",
    Icon: TrendingUp,
    title: "Fundraising strategy",
    desc: "Playbooks that raised a confirmed $100k+ across 5+ states.",
    hue: "linear-gradient(90deg,#34D399,#22D3EE)",
    tint: "rgba(52,211,153,0.10)",
    border: "rgba(52,211,153,0.26)",
    icon: "#6EE7B7",
  },
  {
    to: "/draft-reviewer",
    Icon: ClipboardCheck,
    title: "Draft reviewer",
    desc: "AI roleplays your target funder and critiques your application.",
    hue: "linear-gradient(90deg,#38BDF8,#22D3EE)",
    tint: "rgba(56,189,248,0.10)",
    border: "rgba(56,189,248,0.26)",
    icon: "#7DD3FC",
  },
  {
    to: "/in-kind-donations",
    Icon: Gift,
    title: "In-kind donations",
    desc: "Companies donating goods, materials, and store credits.",
    hue: "linear-gradient(90deg,#FBBF24,#F59E0B)",
    tint: "rgba(251,191,36,0.10)",
    border: "rgba(251,191,36,0.26)",
    icon: "#FCD34D",
  },
  {
    to: "/essay-drafter",
    Icon: FileText,
    title: "AI essay drafter",
    desc: "Generate a grant essay from a prompt, then get clarity rewrites.",
    hue: "linear-gradient(90deg,#8B5CF6,#6366F1)",
    tint: "rgba(139,92,246,0.10)",
    border: "rgba(139,92,246,0.28)",
    icon: "#A78BFA",
  },
];

export default function ToolRail() {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6" aria-label="Tools">
      {TOOLS.map((t) => (
        <Link
          key={t.to}
          to={t.to}
          className="group relative flex gap-3 items-start p-4 rounded-[18px] border border-gf-line bg-gf-panel hover:bg-gf-panel-hi hover:border-gf-line-hi transition-all duration-[180ms] hover:-translate-y-0.5 overflow-hidden"
        >
          <span
            className="absolute inset-x-0 top-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: t.hue }}
          />
          <span
            className="w-[38px] h-[38px] rounded-[11px] grid place-items-center shrink-0 border"
            style={{ background: t.tint, borderColor: t.border }}
          >
            <t.Icon size={19} style={{ color: t.icon }} />
          </span>
          <div className="min-w-0">
            <h3 className="font-display text-[14.5px] font-semibold text-gf-hi mb-0.5 flex items-center gap-1.5">
              {t.title}
              <ArrowRight
                size={14}
                className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-gf-low"
              />
            </h3>
            <p className="text-[12.5px] text-gf-low leading-snug">{t.desc}</p>
          </div>
        </Link>
      ))}
    </section>
  );
}