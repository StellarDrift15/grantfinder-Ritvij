import { useState } from "react";
import { motion } from "framer-motion";
import { Zap, LayoutGrid, FolderOpen } from "lucide-react";
import ImportFromDriveModal from "@/components/ImportFromDriveModal";
import OrgProfileForm from "@/components/OrgProfileForm";
import ResultsPanel from "@/components/ResultsPanel";
import { base44 } from "@/api/base44Client";

async function runGrantScan(formData) {
  const isRobotics = formData.focus_area === "FIRST Robotics";

  // 1. Upsert nonprofit — only pass valid entity fields
  const nonprofitData = {
    nonprofit_name: formData.nonprofit_name,
    ein_number: formData.ein_number,
    focus_area: formData.focus_area,
    annual_budget: formData.annual_budget,
    location: formData.location,
    mission_keywords: formData.mission_keywords,
  };
  const existing = await base44.entities.Nonprofits.filter({ ein_number: formData.ein_number });
  let nonprofit;
  if (existing && existing.length > 0) {
    nonprofit = await base44.entities.Nonprofits.update(existing[0].id, nonprofitData);
  } else {
    nonprofit = await base44.entities.Nonprofits.create(nonprofitData);
  }

  // 2. Create search history record
  const searchRecord = await base44.entities.SearchHistory.create({
    nonprofit_id: nonprofit.id,
    timestamp: new Date().toISOString(),
  });

  // 3. Fetch funding opportunities — filter by relevance to reduce prompt size
  const allOpportunities = await base44.entities.FundingOpportunities.list();

  // Pre-filter: for robotics, prioritize robotics grants + STEM; for others, filter by sector
  let opportunities = allOpportunities;
  if (isRobotics) {
    // Robotics teams: robotics-flagged first, then STEM/Education
    const roboticsFirst = allOpportunities.filter(o => o.accepts_robotics_teams);
    const stemOthers = allOpportunities.filter(o => !o.accepts_robotics_teams && (o.target_sectors || []).some(s => ['STEM', 'Education', 'FIRST Robotics'].includes(s)));
    const rest = allOpportunities.filter(o => !o.accepts_robotics_teams && !(o.target_sectors || []).some(s => ['STEM', 'Education', 'FIRST Robotics'].includes(s)));
    opportunities = [...roboticsFirst, ...stemOthers, ...rest].slice(0, 60);
  } else {
    const focusSectors = {
      Education: ['Education', 'STEM', 'Arts', 'Human Services'],
      STEM: ['STEM', 'Education'],
      Environment: ['Environment', 'Education', 'Human Services'],
      Arts: ['Arts', 'Education', 'Human Services'],
      "Human Services": ['Human Services', 'Education', 'Arts', 'Environment'],
    };
    const relevantSectors = focusSectors[formData.focus_area] || [];
    const sectorMatches = allOpportunities.filter(o => (o.target_sectors || []).some(s => relevantSectors.includes(s)));
    const others = allOpportunities.filter(o => !(o.target_sectors || []).some(s => relevantSectors.includes(s)));
    opportunities = [...sectorMatches, ...others].slice(0, 60);
  }

  // 4. Build LLM prompt — compact format to stay within token limits
  const opportunitiesText = opportunities
    .map(
      (o, i) =>
        `[${i + 1}] ID:${o.id} | ${o.title} | ${o.provider_name} | ${o.type} | $${o.value_amount} | Robotics:${o.accepts_robotics_teams} | Sectors:${(o.target_sectors || []).join(",")} | ${(o.description || "").slice(0, 120)}`
    )
    .join("\n");

  const prompt = `You are a funding-matching AI for nonprofits. Analyze the organization profile and score each funding opportunity (0–100) based on eligibility and mission alignment.

ORGANIZATION PROFILE:
Name: ${formData.nonprofit_name}
EIN: ${formData.ein_number}
Focus Area: ${formData.focus_area}
Annual Budget: $${formData.annual_budget || "Not specified"}
Location: ${formData.location || "Not specified"}
Mission & Keywords: ${formData.mission_keywords || "Not specified"}

${isRobotics ? `CRITICAL ROBOTICS INSTRUCTIONS: This is a FIRST Robotics (FTC/FRC) team based in ${formData.location || "Texas"}.
- AUTOMATICALLY score 90–100 for any opportunity with these keywords in the title or description: "Swyft", "Polymaker", "Gene Haas", "Haas Foundation", "FIRST in Texas", "FiT Grant", "FTC", "FRC", "FIRST Robotics" — these are highly accessible grants specifically designed for teams like this one.
- Score 80–95 for ALL opportunities where 'Accepts Robotics Teams' is TRUE — robotics teams are the primary intended audience.
- Score 70–85 for STEM/education material sponsorships and store credits (REV Robotics, AndyMark, Vex, Limelight, PTC/Creo, Autodesk) — these directly reduce team costs.
- DO NOT score robotics-eligible grants below 75 unless there is a clear hard eligibility conflict (wrong geography, wrong program type).
- Texas-based teams: give extra weight to Texas-specific grants (FIRST in Texas Foundation, Texas Instruments, etc.).` : "Match the organization's focus area and mission to relevant target sectors. For general nonprofits, note how Store Credits (like Google Ad Grants) and Material Sponsorships save operational costs. Prioritize sector-aligned opportunities."}

AVAILABLE FUNDING OPPORTUNITIES:
${opportunitiesText}

INSTRUCTIONS:
1. Score each opportunity 0–100 based on alignment with the nonprofit's focus area, mission keywords, and sector.
2. For opportunities scoring above 60, write a brief 2-sentence explanation of eligibility — specifically note how this type of funding (cash grant, store credit, or material sponsorship) benefits this particular organization.
3. Return ONLY opportunities scoring above 60, sorted by score descending.

RESPONSE SCHEMA:
{
  "matches": [
    {
      "funding_id": "<opportunity ID string>",
      "match_confidence": <number 61–100>,
      "match_reason": "<2-sentence explanation>"
    }
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

  const matches = llmResponse?.matches || [];
  if (matches.length === 0) return [];

  // 5. Save MatchingResults and enrich with opportunity data
  const opportunityMap = {};
  opportunities.forEach((o) => { opportunityMap[o.id] = o; });

  const confidenceThreshold = isRobotics ? 50 : 60;
  const resultsToSave = matches
    .filter((m) => m.match_confidence > confidenceThreshold && opportunityMap[m.funding_id])
    .map((m) => ({
      search_id: searchRecord.id,
      funding_id: m.funding_id,
      match_confidence: Math.min(100, Math.round(m.match_confidence)),
      match_reason: m.match_reason,
    }));

  let savedResults = [];
  if (resultsToSave.length > 0) {
    savedResults = await base44.entities.MatchingResults.bulkCreate(resultsToSave);
  }

  const enriched = (Array.isArray(savedResults) && savedResults.length > 0 ? savedResults : resultsToSave).map((r) => ({
    ...r,
    opportunity: opportunityMap[r.funding_id] || {},
  }));

  enriched.sort((a, b) => b.match_confidence - a.match_confidence);

  return enriched;
}

export default function Dashboard() {
  const [results, setResults] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [scanError, setScanError] = useState(null);
  const [showDriveImport, setShowDriveImport] = useState(false);

  const handleScanStart = () => {
    setScanning(true);
    setHasScanned(false);
    setScanError(null);
  };

  const handleScanComplete = (data) => {
    setScanning(false);
    setHasScanned(true);
    setResults(data || []);
  };

  const handleFormSubmit = async (formData) => {
    handleScanStart();
    try {
      const enriched = await runGrantScan(formData);
      handleScanComplete(enriched);
    } catch (err) {
      console.error(err);
      setScanError(err.message);
      handleScanComplete([]);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {/* Top Nav */}
      <header className="h-14 bg-white border-b border-slate-100 flex items-center px-6 gap-3 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Zap size={14} className="text-white" />
          </div>
          <span className="text-base font-bold text-slate-800 tracking-tight">Universal Non-Profit Funding & Voucher Matcher</span>
        </div>
        <div className="h-4 w-px bg-slate-200 mx-1" />
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <LayoutGrid size={13} />
          <span>Dashboard</span>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={() => setShowDriveImport(true)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors"
          >
            <FolderOpen size={13} className="text-green-600" />
            Import from Drive
          </button>
          <span className="rounded-full bg-indigo-50 border border-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-600">
            AI-Powered Matching
          </span>
        </div>
      </header>
      {showDriveImport && (
        <ImportFromDriveModal
          onClose={() => setShowDriveImport(false)}
          onImported={() => {}}
        />
      )}

      {/* Split-screen body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Profile Sidebar */}
        <aside className="w-[380px] min-w-[320px] max-w-[420px] bg-white border-r border-slate-100 overflow-y-auto">
          <div className="p-6">
            {/* Card header */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-5 h-5 rounded-md bg-slate-800 flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold">1</span>
                </div>
                <h1 className="text-lg font-bold text-slate-800">Organization Profile</h1>
              </div>
              <p className="text-xs text-slate-400 ml-7">
                Tell us about your organization so we can find the most relevant grants.
              </p>
            </div>

            <OrgProfileForm
              onScanStart={handleScanStart}
              onScanComplete={handleScanComplete}
              onFormSubmit={handleFormSubmit}
            />
          </div>
        </aside>

        {/* Right: Results Panel */}
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