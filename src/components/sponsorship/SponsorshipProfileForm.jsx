import { useState } from "react";
import { Loader2, Zap, Users, Hash, MapPin, Calendar, Wrench } from "lucide-react";

const PROGRAM_TYPES = [
  { value: "FRC", label: "FRC (FIRST Robotics Competition)" },
  { value: "FTC", label: "FTC (FIRST Tech Challenge)" },
  { value: "FLL", label: "FLL (FIRST LEGO League)" },
  { value: "Multiple", label: "Multiple Programs" },
];

const inputBase =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200";

export default function SponsorshipProfileForm({ onSubmit, loading }) {
  const [form, setForm] = useState({
    team_name: "",
    team_number: "",
    program_type: "",
    location: "",
    team_size: "",
    years_active: "",
    description: "",
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <Users size={12} /> Team Name <span className="text-purple-500">*</span>
        </label>
        <input className={inputBase} name="team_name" value={form.team_name} onChange={handleChange} placeholder="e.g. Steel Hawks Robotics" />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <Hash size={12} /> Team Number
        </label>
        <input className={inputBase} name="team_number" value={form.team_number} onChange={handleChange} placeholder="e.g. FRC 1234" />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <Wrench size={12} /> Program Type <span className="text-purple-500">*</span>
        </label>
        <select className={inputBase + " cursor-pointer"} name="program_type" value={form.program_type} onChange={handleChange}>
          <option value="">Select program…</option>
          {PROGRAM_TYPES.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <MapPin size={12} /> Location
        </label>
        <input className={inputBase} name="location" value={form.location} onChange={handleChange} placeholder="e.g. Houston, Texas" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <Users size={12} /> Team Size
          </label>
          <input className={inputBase} name="team_size" type="number" min="1" value={form.team_size} onChange={handleChange} placeholder="e.g. 25" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <Calendar size={12} /> Years Active
          </label>
          <input className={inputBase} name="years_active" type="number" min="0" value={form.years_active} onChange={handleChange} placeholder="e.g. 3" />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">About Your Team</label>
        <textarea
          className={inputBase + " resize-none min-h-[80px]"}
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Briefly describe your team, needs, and what you'd offer sponsors (e.g. logo placement, social media mentions)."
        />
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed px-5 py-3.5 text-sm font-semibold text-white transition-all duration-200 shadow-md shadow-purple-200"
      >
        {loading ? (
          <><Loader2 size={16} className="animate-spin" /> Finding Sponsors…</>
        ) : (
          <><Zap size={16} /> Find Sponsorship Matches</>
        )}
      </button>
    </form>
  );
}