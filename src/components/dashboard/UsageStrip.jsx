import { useEffect, useState } from "react";
import { MousePointerClick, Wand2 } from "lucide-react";
import { getUsage } from "@/lib/usage";

export default function UsageStrip() {
  const [usage, setUsage] = useState({ grants_clicked: 0, grants_value_opened: 0, rewrites_generated: 0 });

  useEffect(() => {
    let on = true;
    const load = () => getUsage().then((u) => { if (on) setUsage(u); });
    load();
    const t = setInterval(load, 5000);
    return () => { on = false; clearInterval(t); };
  }, []);

  const items = [
    { icon: MousePointerClick, label: "Grant links opened", value: Number(usage.grants_clicked).toLocaleString(), accent: "text-gf-cyan", ring: "bg-[rgba(56,189,248,0.12)]", border: "border-[rgba(56,189,248,0.25)]" },
    { icon: Wand2, label: "AI rewrites & drafts", value: Number(usage.rewrites_generated).toLocaleString(), accent: "text-gf-violet", ring: "bg-[rgba(139,92,246,0.14)]", border: "border-[rgba(139,92,246,0.28)]" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 mb-5">
      {items.map((it) => {
        const Icon = it.icon;
        return (
          <div key={it.label} className={`flex items-center gap-3 rounded-2xl border ${it.border} ${it.ring} px-4 py-3`}>
            <Icon size={18} className={`${it.accent} shrink-0`} />
            <div className="min-w-0">
              <div className="font-mono text-lg font-bold text-gf-hi leading-none">{it.value}</div>
              <div className="text-[11.5px] text-gf-low mt-1 leading-tight">{it.label}</div>
            </div>
            <span className="ml-auto flex items-center gap-1.5 text-[10.5px] font-semibold text-gf-mint">
              <span className="gf-pulse w-1.5 h-1.5 rounded-full bg-gf-mint" />
              live
            </span>
          </div>
        );
      })}
    </div>
  );
}