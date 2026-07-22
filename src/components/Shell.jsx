import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import Logo from "./Logo";

const NAV = [
  { label: "Dashboard", to: "/" },
  { label: "Discover", to: "/discover" },
  { label: "Saved", to: "/saved" },
  { label: "Reports", to: "/reports" },
];

export default function Shell({ active = "Dashboard", children }) {
  const [initials, setInitials] = useState("GF");
  const location = useLocation();

  useEffect(() => {
    base44
      .auth
      .me()
      .then((u) => {
        const name = u?.full_name || u?.email || "";
        if (name) {
          const parts = name.trim().split(/\s+/);
          setInitials(((parts[0]?.[0] || "") + (parts[1]?.[0] || "")) || "GF");
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-gf-ink text-gf-mid font-body">
      {/* shared svg gradient def for eligibility rings */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="gfScoreGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#8B5CF6" />
            <stop offset="1" stopColor="#22D3EE" />
          </linearGradient>
        </defs>
      </svg>

      {/* ambient aurora */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div
          className="absolute rounded-full blur-[110px]"
          style={{ width: 640, height: 640, top: -260, left: -160, background: "radial-gradient(circle,rgba(139,92,246,0.16),transparent 65%)" }}
        />
        <div
          className="absolute rounded-full blur-[110px]"
          style={{ width: 560, height: 560, top: "10%", right: -200, background: "radial-gradient(circle,rgba(34,211,238,0.12),transparent 65%)" }}
        />
        <div
          className="absolute rounded-full blur-[110px]"
          style={{ width: 520, height: 520, bottom: -240, left: "32%", background: "radial-gradient(circle,rgba(52,211,153,0.08),transparent 65%)" }}
        />
      </div>

      {/* topbar */}
      <header
        className="sticky top-0 z-50 flex items-center gap-7 px-7 py-3.5 border-b border-gf-line backdrop-blur-[18px]"
        style={{ background: "rgba(7,11,20,0.78)" }}
      >
        <Logo />
        <nav className="hidden sm:flex gap-1 ml-2" aria-label="Primary">
          {NAV.map((n) => {
            const isActive = active === n.label || location.pathname === n.to;
            return (
              <Link
                key={n.label}
                to={n.to}
                className={`px-3.5 py-1.5 rounded-lg text-[13.5px] font-medium transition ${
                  isActive ? "text-gf-hi bg-gf-panel-hi" : "text-gf-mid hover:text-gf-hi hover:bg-gf-panel-hi"
                }`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-3.5">
          <span
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-semibold"
            style={{ borderColor: "rgba(139,92,246,0.35)", background: "rgba(139,92,246,0.10)", color: "#C4B5FD" }}
          >
            <span className="gf-pulse w-1.5 h-1.5 rounded-full bg-gf-mint" />
            AI matching · live
          </span>
          <div
            className="w-[34px] h-[34px] rounded-full grid place-items-center font-mono text-[11.5px] font-semibold text-gf-cyan border"
            style={{ background: "linear-gradient(135deg,#1E293B,#0F172A)", borderColor: "var(--gf-line-hi)" }}
            title="Account"
          >
            {initials.toUpperCase()}
          </div>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-[1440px] px-7 pb-16 pt-6">{children}</div>
    </div>
  );
}