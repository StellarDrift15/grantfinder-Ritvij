export const TYPE_META = {
  grant: { label: "Grant", cls: "text-[#C4B5FD] border-[rgba(139,92,246,0.3)] bg-[rgba(139,92,246,0.14)]" },
  inkind: { label: "In-kind", cls: "text-[#FCD34D] border-[rgba(251,191,36,0.28)] bg-[rgba(251,191,36,0.12)]" },
  sponsor: { label: "Sponsorship", cls: "text-[#7DD3FC] border-[rgba(56,189,248,0.3)] bg-[rgba(56,189,248,0.12)]" },
  voucher: { label: "Voucher", cls: "text-[#6EE7B7] border-[rgba(52,211,153,0.3)] bg-[rgba(52,211,153,0.12)]" },
};

export const TYPE_COLORS = {
  grant: "#8B5CF6",
  inkind: "#FBBF24",
  sponsor: "#38BDF8",
  voucher: "#34D399",
};

export function typeKeyOf(type) {
  if (type === "Cash Grant") return "grant";
  if (type === "Material Sponsorship") return "inkind";
  if (type === "Store Credit" || type === "Advertisement") return "voucher";
  return "grant";
}

export function fmtAmount(value, typeKey) {
  if (!value && value !== 0) return "—";
  const s = "$" + Number(value).toLocaleString();
  return typeKey === "voucher" ? s + " credit" : s;
}

export function deadlineInfo(deadline) {
  if (!deadline) return { label: "Rolling", soon: false, days: Infinity };
  const d = new Date(deadline);
  if (isNaN(d.getTime())) return { label: "Rolling", soon: false, days: Infinity };
  const days = Math.ceil((d.getTime() - Date.now()) / 86400000);
  if (days <= 0) return { label: "Closed", soon: false, days: -1 };
  return {
    label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + " · " + days + "d",
    soon: days <= 45,
    days,
  };
}

// Lightweight browse score — no LLM call. Returns null when no profile.
export function heuristicScore(opp, profile) {
  if (!profile || !Array.isArray(profile.focus_area) || profile.focus_area.length === 0) return null;
  let score = 52;
  const sectors = opp.target_sectors || [];
  const areas = profile.focus_area;
  const overlap = sectors.filter((s) => areas.includes(s)).length;
  score += overlap * 9;
  if (opp.accepts_robotics_teams && (areas.includes("FIRST Robotics") || areas.includes("FIRST LEGO League (FLL)"))) score += 16;
  if (areas.includes("STEM") && sectors.includes("STEM")) score += 8;
  if (areas.includes("Education") && (sectors.includes("Education") || sectors.includes("Youth Education"))) score += 8;
  if (areas.includes("Arts") && sectors.includes("Arts")) score += 10;
  if (areas.includes("Environment") && sectors.includes("Environment")) score += 10;
  if (areas.includes("Human Services") && sectors.includes("Human Services")) score += 10;
  return Math.max(0, Math.min(100, Math.round(score)));
}