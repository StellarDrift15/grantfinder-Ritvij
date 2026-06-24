import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Handshake, LayoutGrid } from "lucide-react";
import { base44 } from "@/api/base44Client";
import SponsorshipProfileForm from "@/components/sponsorship/SponsorshipProfileForm";
import SponsorshipResults from "@/components/sponsorship/SponsorshipResults";

async function runSponsorshipScan(teamData) {
  const allSponsors = await base44.entities.Sponsorships.list();
  if (allSponsors.length === 0) return [];

  const sponsorsText = allSponsors
    .map((s, i) => `[${i + 1}] ID:${s.id} | ${s.company_name} | Status:${s.sponsorship_status || "Unknown"} | Typical:$${s.typical_amount || "N/A"} | Programs:${(s.target_programs || []).join(",") || "Any"} | Geo:${s.geographic_focus || "Any"} | ${s.description || ""} | CommunityNotes:${(s.community_notes || "").slice(0, 120)}`)
    .join("\n");

  const prompt = `You are a sponsorship-matching AI for FIRST Robotics teams. Analyze the team profile and score each potential sponsor (0–100) based on how good a fit they are.

TEAM PROFILE:
Name: ${teamData.team_name}
Team Number: ${teamData.team_number || "Not specified"}
Program: ${teamData.program_type}
Location: ${teamData.location || "Not specified"}
Team Size: ${teamData.team_size || "Not specified"}
Years Active: ${teamData.years_active || "Not specified"}
Description: ${teamData.description || "Not specified"}

SPONSOR STATUS PRIORITY (use these to weight scores):
- "Open Grant" / "Confirmed Sponsor" → score 85-100 (proven, accessible)
- "Email Outreach" → score 70-90 (contactable, worth trying)
- "Call Required" → score 65-85 (need to call)
- "EDU Discounts" → score 60-80 (not cash but saves money)
- "Needs Connection" → score 50-70 (need employee connection)
- "Untried" → score 55-75 (other teams use them, worth trying)

AVAILABLE SPONSORS:
${sponsorsText}

CRITICAL INSTRUCTIONS:
1. Score each sponsor 0–100 based on status priority, program type match (FTC vs FRC vs FLL), location alignment, and community notes.
2. If a sponsor's target programs include the team's program type, boost score by 10.
3. For each match, write a 2-sentence cold email tip: why they're a good fit and what to say.
4. Return ALL sponsors scoring above 45, sorted by score descending.`;

  const llmResponse = await base44.integrations.Core.InvokeLLM({
    prompt,
    model: "gpt_5_mini",
    response_json_schema: {
      type: "object",
      properties: {
        matches: {
          type: "array",
          items: {
            type: "object",
            properties: {
              sponsor_id: { type: "string" },
              match_confidence: { type: "number" },
              match_reason: { type: "string" },
            },
            required: ["sponsor_id", "match_confidence", "match_reason"],
          },
        },
      },
      required: ["matches"],
    },
  });

  const matches = llmResponse?.matches || [];
  if (matches.length === 0) return [];

  const sponsorMap = {};
  allSponsors.forEach((s) => { sponsorMap[s.id] = s; });

  const enriched = matches
    .filter((m) => m.match_confidence > 50 && sponsorMap[m.sponsor_id])
    .map((m) => ({
      ...m,
      match_confidence: Math.min(100, Math.round(m.match_confidence)),
      sponsor: sponsorMap[m.sponsor_id] || {},
    }));

  enriched.sort((a, b) => b.match_confidence - a.match_confidence);
  return enriched;
}

export default function SponsorshipFinder() {
  const [results, setResults] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [scanError, setScanError] = useState(null);

  const handleSubmit = async (teamData) => {
    setScanning(true);
    setHasScanned(false);
    setScanError(null);
    try {
      const enriched = await runSponsorshipScan(teamData);
      setResults(enriched);
      setHasScanned(true);
    } catch (err) {
      console.error(err);
      setScanError(err.message);
      setResults([]);
      setHasScanned(true);
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <header className="h-14 bg-white border-b border-slate-100 flex items-center px-6 gap-3 shadow-sm">
        <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-purple-600 hover:text-purple-800 transition-colors">
          <ArrowLeft size={16} />
          Back to Grant Finder
        </Link>
        <div className="h-4 w-px bg-slate-200 mx-1" />
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center">
            <Handshake size={14} className="text-white" />
          </div>
          <span className="text-base font-bold text-slate-800 tracking-tight">Sponsorship Finder</span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-[380px] min-w-[320px] max-w-[420px] bg-white border-r border-slate-100 overflow-y-auto">
          <div className="p-6">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-5 h-5 rounded-md bg-purple-700 flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold">1</span>
                </div>
                <h1 className="text-lg font-bold text-slate-800">Team Profile</h1>
              </div>
              <p className="text-xs text-slate-400 ml-7">Tell us about your team so we can find the best sponsors to cold email.</p>
            </div>
            <SponsorshipProfileForm onSubmit={handleSubmit} loading={scanning} />
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            {scanError && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
                {scanError}
              </motion.div>
            )}
            <SponsorshipResults results={results} scanning={scanning} hasScanned={hasScanned} />
          </div>
        </main>
      </div>
    </div>
  );
}