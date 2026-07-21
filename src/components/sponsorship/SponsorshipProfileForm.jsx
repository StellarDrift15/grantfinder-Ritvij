import { useState } from "react";
import { Loader2, Zap, Users, Hash, MapPin, Calendar, Wrench, UserCheck } from "lucide-react";

const PROGRAM_TYPES = [
  { value: "FRC", label: "FRC (FIRST Robotics Competition)" },
  { value: "FTC", label: "FTC (FIRST Tech Challenge)" },
  { value: "FLL", label: "FLL (FIRST LEGO League)" },
  { value: "Multiple", label: "Multiple Programs" },
];

const labelBase = "flex items-center gap-1.5 text-[11.5px] font-semibold tracking-[0.08em] uppercase text-gf-mid mb-2";
const inputBase =
  "w-full rounded-xl border border-gf-line bg-[rgba(7,11,20,0.55)] px-3.5 py-2.5 text-sm text-gf-hi placeholder:text-[#475569] focus:outline-none focus:border-[rgba(139,92,246,0.55)] focus:shadow-[0_0_0_3px_rgba(139,92,246,0.14)] transition";

export default function SponsorshipProfileForm({ onSubmit, loading }) {
  const [form, setForm] = useState({
    team_name: "",
    team_number: "",
    program_type: "",
    location: "",
    team_size: "",
    years_active: "",
    description: "",
    mentor_connections: "",
  });
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.team_name || !form.program_type) {
      setError("Please fill in Team Name and Program Type.");
      return;
    }
    setError(null);
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-[18px] border border-gf-line bg-gf-panel p-6">
      <div className="font-mono text-[10.5px] font-semibold tracking-[0.14em] uppercase text-gf-cyan mb-2">
        Step 1 · Team profile
      </div>
      <h2 className="font-display text-gf-hi text-[21px] font-bold tracking-tight mb-1">Tell us about your team</h2>
      <p className="text-[13px] text-gf-low mb-5">
        We'll match you to the best companies to cold email for sponsorship.
      </p>

      <div className="flex flex-col gap-5">
        <div>
          <label className={labelBase}>
            <Users size={13} className="text-gf-low" /> Team name <span className="text-gf-violet">*</span>
          </label>
          <input className={inputBase} name="team_name" value={form.team_name} onChange={handleChange} placeholder="e.g. Steel Hawks Robotics" />
        </div>

        <div>
          <label className={labelBase}>
            <Hash size={13} className="text-gf-low" /> Team number
          </label>
          <input className={inputBase + " font-mono text-[13.5px]"} name="team_number" value={form.team_number} onChange={handleChange} placeholder="e.g. FRC 1234" />
        </div>

        <div>
          <label className={labelBase}>
            <Wrench size={13} className="text-gf-low" /> Program type <span className="text-gf-violet">*</span>
          </label>
          <select className={inputBase + " cursor-pointer"} name="program_type" value={form.program_type} onChange={handleChange}>
            <option value="">Select program…</option>
            {PROGRAM_TYPES.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelBase}>
            <MapPin size={13} className="text-gf-low" /> Location
          </label>
          <input className={inputBase} name="location" value={form.location} onChange={handleChange} placeholder="e.g. Houston, Texas" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelBase}>
              <Users size={13} className="text-gf-low" /> Team size
            </label>
            <input className={inputBase + " font-mono text-[13.5px]"} name="team_size" type="number" min="1" value={form.team_size} onChange={handleChange} placeholder="e.g. 25" />
          </div>
          <div>
            <label className={labelBase}>
              <Calendar size={13} className="text-gf-low" /> Years active
            </label>
            <input className={inputBase + " font-mono text-[13.5px]"} name="years_active" type="number" min="0" value={form.years_active} onChange={handleChange} placeholder="e.g. 3" />
          </div>
        </div>

        <div>
          <label className={labelBase}>About your team</label>
          <textarea
            className={inputBase + " resize-y min-h-[80px]"}
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Briefly describe your team, needs, and what you'd offer sponsors (e.g. logo placement, social media mentions)."
          />
        </div>

        <div className="flex flex-col gap-2 rounded-2xl bg-[rgba(56,189,248,0.06)] border border-[rgba(56,189,248,0.2)] p-4">
          <label className="flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-[0.08em] text-[#7DD3FC]">
            <UserCheck size={13} /> Mentor connections (optional)
          </label>
          <p className="text-[12px] text-gf-low -mt-1">List any companies where your mentors, parents, or team members work.</p>
          <textarea
            className={inputBase + " resize-none min-h-[70px]"}
            name="mentor_connections"
            value={form.mentor_connections}
            onChange={handleChange}
            placeholder="e.g. Coach Mike works at Boeing, parent works at Google, mentor at Lockheed Martin..."
          />
          <p className="text-[11px] text-gf-low">The AI gives specific advice on how to approach these connections internally.</p>
        </div>

        {error && (
          <div className="rounded-xl bg-[rgba(248,113,113,0.1)] border border-[rgba(248,113,113,0.3)] px-4 py-3 text-sm text-[#FCA5A5]">{error}</div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2.5 rounded-2xl px-5 py-3.5 text-gf-hi font-display text-[15px] font-semibold transition-all duration-150 hover:-translate-y-px disabled:opacity-70 disabled:translate-y-0"
          style={{
            backgroundImage: "linear-gradient(120deg,#8B5CF6,#38BDF8 55%,#22D3EE)",
            boxShadow: "0 8px 28px -8px rgba(56,189,248,0.5),0 2px 8px -2px rgba(139,92,246,0.4)",
          }}
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Finding sponsors…
            </>
          ) : (
            <>
              <Zap size={16} />
              Find sponsorship matches
            </>
          )}
        </button>
      </div>
    </form>
  );
}