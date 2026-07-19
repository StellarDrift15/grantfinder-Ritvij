import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Gift } from "lucide-react";
import { base44 } from "@/api/base44Client";
import OrgProfileForm from "@/components/OrgProfileForm";
import ResultsPanel from "@/components/ResultsPanel";

function buildInKindReason(opp) {
  const parts = [`${opp.title} from ${opp.provider_name}`];
  if (opp.type) parts.push(`is a ${opp.type}`);
  if (opp.value_amount) parts.push(`valued up to $${Number(opp.value_amount).toLocaleString()}`);
  parts.push(".");
  if (opp.description) parts.push(opp.description);
  if (opp.type === "Store Credit") {
    parts.push("This credit reduces out-of-pocket spending on critical hardware, software, and supplies.");
  } else if (opp.type === "Material Sponsorship") {
    parts.push("This sponsorship provides physical materials at no cost, lowering your operating expenses.");
  }
  if (opp.application_url) parts.push("Apply via the link on this card.");
  return parts.join(" ");
}

async function runInKindScan(formData) {
  const focusAreas = Array.isArray(formData.focus_area)
    ? formData.focus_area
    : formData.focus_area
      ? [formData.focus_area]
      : [];

  const allOpportunities = await base44.entities.FundingOpportunities.list();
  // In-kind donations = Store Credits + Material Sponsorships (goods/credits, not cash)
  const inKindOpps = allOpportunities.filter(
    (o) => o.type === "Store Credit" || o.type === "Material Sponsorship"
  );
  if (inKindOpps.length === 0) return [];

  // Upsert nonprofit profile + search history (consistent with the grant dashboard)
  const nonprofitData = {
    nonprofit_name: formData.nonprofit_name,
    ein_number: formData.ein_number,
    focus_area: formData.focus_area,
    annual_budget: formData.annual_budget,
    location: formData.location,
    mission_keywords: formData.mission_keywords,
  };
  const existing = await base44.entities.Nonprofits.filter({ ein_number: formData.ein_number });
  const nonprofit =
    existing && existing.length > 0
      ? await base44.entities.Nonprofits.update(existing[0].id, nonprofitData)
      : await base44.entities.Nonprofits.create(nonprofitData);

  const searchRecord = await base44.entities.SearchHistory.create({
    nonprofit_id: nonprofit.id,
    timestamp: new Date().toISOString(),
  });

  const oppsText = inKindOpps
    .map(
      (o, i) =>
        `[${i + 1}] ID:${o.id} | ${o.title} | ${o.provider_name} | ${o.type} | $${o.value_amount} | Robotics:${o.accepts_robotics_teams} | Sectors:${(o.target_sectors || []).join(",")} | ${(o.description || "").slice(0, 150)}`
    )
    .join("\n");

  const prompt = `You are an in-kind donation matching AI for nonprofits and robotics teams. The organization is looking for DONATED GOODS, MATERIALS, and STORE CREDITS (not cash grants). Score each in-kind opportunity (0–100) based on how useful the donated goods or credits are to this organization's specific programs.

ORGANIZATION PROFILE:
Name: ${formData.nonprofit_name}
Focus Areas: ${focusAreas.join(", ")}
Annual Budget: $${formData.annual_budget || "Not specified"}
Location: ${formData.location || "Not specified"}
Mission & Keywords: ${formData.mission_keywords || "Not specified"}

IN-KIND OPPORTUNITIES (Store Credits & Material Sponsorships only):
${oppsText}

INSTRUCTIONS:
1. Score each opportunity 0–100 based on how well the donated goods/credits serve this organization's programs.
2. For robotics/STEM teams, heavily favor material sponsorships of robotics hardware (REV, AndyMark, Vex, LEGO Education, Polymaker, Swyft, etc.) and store credits for parts or software.
3. ACCURACY IS CRITICAL: The match_reason MUST begin by naming that opportunity's EXACT title verbatim and describe ONLY that one opportunity. NEVER mention or describe a different opportunity. Explain in 2 sentences what goods or credits are donated and how this organization would use them.
4. Return ONLY opportunities scoring above 55, sorted by score descending.

RESPONSE SCHEMA:
{
  "matches": [
    { "funding_id": "<id string>", "match_confidence": <number 56-100>, "match_reason": "<2-sentence explanation>" }
  ]
}`;

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
              funding_id: { type: "string" },
              match_confidence: { type: "number" },
              match_reason: { type: "string" },
            },
            required: ["funding_id", "match_confidence", "match_reason"],
          },
        },
      },
      required: ["matches"],
    },
  });

  // Dedupe by funding_id — keep highest confidence
  const byId = new Map();
  for (const m of llmResponse?.matches || []) {
    if (!m || !m.funding_id) continue;
    const prev = byId.get(m.funding_id);
    if (!prev || (m.match_confidence || 0) > (prev.match_confidence || 0)) byId.set(m.funding_id, m);
  }
  const matches = Array.from(byId.values());
  if (matches.length === 0) return [];

  const oppMap = {};
  inKindOpps.forEach((o) => { oppMap[o.id] = o; });
  const allTitles = inKindOpps.map((o) => o.title).filter(Boolean);

  const resultsToSave = matches
    .filter((m) => m.match_confidence > 55 && oppMap[m.funding_id])
    .map((m) => {
      const opp = oppMap[m.funding_id];
      const correctTitle = (opp.title || "").toLowerCase();
      const reason = (m.match_reason || "").toLowerCase();
      const mentionsCorrect = correctTitle && reason.includes(correctTitle);
      const mentionsOther = allTitles.some(
        (t) => t && t.toLowerCase() !== correctTitle && reason.includes(t.toLowerCase())
      );
      const match_reason = !mentionsCorrect || mentionsOther ? buildInKindReason(opp) : m.match_reason;
      return {
        search_id: searchRecord.id,
        funding_id: m.funding_id,
        match_confidence: Math.min(100, Math.round(m.match_confidence)),
        match_reason,
      };
    });

  let savedResults = [];
  if (resultsToSave.length > 0) {
    savedResults = await base44.entities.MatchingResults.bulkCreate(resultsToSave);
  }

  const enriched = (Array.isArray(savedResults) && savedResults.length > 0 ? savedResults : resultsToSave).map(
    (r) => ({ ...r, opportunity: oppMap[r.funding_id] || {} })
  );
  enriched.sort((a, b) => b.match_confidence - a.match_confidence);
  return enriched;
}

export default function InKindDonations() {
  const [results, setResults] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [scanError, setScanError] = useState(null);

  const handleSubmit = async (formData) => {
    setScanning(true);
    setHasScanned(false);
    setScanError(null);
    try {
      const enriched = await runInKindScan(formData);
      setResults(enriched);
    } catch (err) {
      console.error(err);
      setScanError(err.message);
      setResults([]);
    } finally {
      setHasScanned(true);
      setScanning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-cyan-50/40 flex flex-col">
      <header className="h-14 bg-white/60 backdrop-blur-xl border-b border-white/40 flex items-center px-6 gap-3 shadow-sm">
        <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-teal-600 hover:text-teal-800 transition-colors">
          <ArrowLeft size={16} />
          Back to Grant Finder
        </Link>
        <div className="h-4 w-px bg-slate-200 mx-1" />
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-600 flex items-center justify-center">
            <Gift size={14} className="text-white" />
          </div>
          <span className="text-base font-bold text-slate-800 tracking-tight">In-Kind Donations Finder</span>
        </div>
        <div className="ml-auto">
          <span className="rounded-full bg-teal-50 border border-teal-100 px-3 py-1 text-xs font-semibold text-teal-600">
            Goods, Materials & Store Credits
          </span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-[380px] min-w-[320px] max-w-[420px] bg-white/55 backdrop-blur-xl border-r border-white/40 flex flex-col">
          <div className="px-6 pt-6 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-5 h-5 rounded-md bg-teal-700 flex items-center justify-center">
                <span className="text-white text-[10px] font-bold">1</span>
              </div>
              <h1 className="text-lg font-bold text-slate-800">Organization Profile</h1>
            </div>
            <p className="text-xs text-slate-400 ml-7">
              Tell us about your organization so we can match you with companies donating goods, materials, and store credits.
            </p>
          </div>
          <OrgProfileForm onFormSubmit={handleSubmit} />
        </aside>

        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            {scanError && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-4 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600"
              >
                {scanError}
              </motion.div>
            )}
            <ResultsPanel results={results} scanning={scanning} hasScanned={hasScanned} />
          </div>
        </main>
      </div>
    </div>
  );
}