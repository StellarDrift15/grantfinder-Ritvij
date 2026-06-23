import { useState } from "react";
import { motion } from "framer-motion";
import { Zap, LayoutGrid } from "lucide-react";
import OrgProfileForm from "@/components/OrgProfileForm";
import ResultsPanel from "@/components/ResultsPanel";
import { base44 } from "@/api/base44Client";

async function runGrantScan(formData) {
  // 1. Upsert nonprofit
  const existing = await base44.entities.Nonprofits.filter({ ein_number: formData.ein_number });
  let nonprofit;
  if (existing && existing.length > 0) {
    nonprofit = await base44.entities.Nonprofits.update(existing[0].id, {
      nonprofit_name: formData.nonprofit_name,
      focus_area: formData.focus_area,
      annual_budget: formData.annual_budget,
      location: formData.location,
      mission_keywords: formData.mission_keywords,
    });
  } else {
    nonprofit = await base44.entities.Nonprofits.create(formData);
  }

  // 2. Create search history record
  const searchRecord = await base44.entities.SearchHistory.create({
    nonprofit_id: nonprofit.id,
    timestamp: new Date().toISOString(),
  });

  // 3. Fetch all grants
  const grants = await base44.entities.Grants.list();

  // 4. Call LLM for matching
  const grantsListText = grants
    .map(
      (g, i) =>
        `[${i + 1}] ID: ${g.id}
Title: ${g.grant_title}
Funder: ${g.funder_name}
Description: ${g.description}
Max Award: $${g.award_amount_max}
Deadline: ${g.deadline}
Accepts Robotics Teams: ${g.accepts_robotics_teams}
Tags: ${(g.criteria_tags || []).join(", ")}`
    )
    .join("\n\n");

  const roboticsBoost =
    formData.focus_area === "FIRST Robotics"
      ? "IMPORTANT: This organization is a FIRST Robotics (FTC/FRC) team. You MUST heavily boost the confidence score (by 20-30 points) for any grants where 'Accepts Robotics Teams' is TRUE. These are highly relevant."
      : "";

  const prompt = `You are a grant-matching AI assistant for nonprofits. Your task is to analyze a nonprofit's profile and score each grant based on eligibility and alignment.

NONPROFIT PROFILE:
Name: ${formData.nonprofit_name}
EIN: ${formData.ein_number}
Focus Area: ${formData.focus_area}
Annual Budget: $${formData.annual_budget || "Not specified"}
Location: ${formData.location || "Not specified"}
Mission & Keywords: ${formData.mission_keywords || "Not specified"}

${roboticsBoost}

AVAILABLE GRANTS:
${grantsListText}

INSTRUCTIONS:
1. Score each grant from 0–100 based on how well it aligns with this nonprofit's profile, focus area, and mission keywords.
2. If focus_area is "FIRST Robotics", boost scores for grants where accepts_robotics_teams is TRUE by 20–30 points.
3. For each grant that scores above 60, write exactly 2 sentences explaining why this nonprofit is eligible. Be specific and reference the nonprofit's actual keywords and focus area.
4. Return ONLY grants with a score above 60.
5. Return your response as a JSON object matching the schema below.

RESPONSE SCHEMA:
{
  "matches": [
    {
      "grant_id": "<the grant's ID string>",
      "match_confidence": <number 61–100>,
      "match_reason": "<2-sentence eligibility explanation>"
    }
  ]
}`;

  const llmResponse = await base44.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: {
      type: "object",
      properties: {
        matches: {
          type: "array",
          items: {
            type: "object",
            properties: {
              grant_id: { type: "string" },
              match_confidence: { type: "number" },
              match_reason: { type: "string" },
            },
            required: ["grant_id", "match_confidence", "match_reason"],
          },
        },
      },
      required: ["matches"],
    },
  });

  const matches = llmResponse?.matches || [];

  if (matches.length === 0) {
    return [];
  }

  // 5. Save MatchingResults and build enriched result set
  const grantMap = {};
  grants.forEach((g) => { grantMap[g.id] = g; });

  const resultsToSave = matches
    .filter((m) => m.match_confidence > 60 && grantMap[m.grant_id])
    .map((m) => ({
      search_id: searchRecord.id,
      grant_id: m.grant_id,
      match_confidence: Math.min(100, Math.round(m.match_confidence)),
      match_reason: m.match_reason,
    }));

  let savedResults = [];
  if (resultsToSave.length > 0) {
    savedResults = await base44.entities.MatchingResults.bulkCreate(resultsToSave);
  }

  // Enrich with grant data and sort by confidence descending
  const enriched = (Array.isArray(savedResults) ? savedResults : resultsToSave).map((r) => ({
    ...r,
    grant: grantMap[r.grant_id] || {},
  }));

  enriched.sort((a, b) => b.match_confidence - a.match_confidence);

  return enriched;
}

export default function Dashboard() {
  const [results, setResults] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [scanError, setScanError] = useState(null);

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
          <span className="text-base font-bold text-slate-800 tracking-tight">GrantFinder NP</span>
        </div>
        <div className="h-4 w-px bg-slate-200 mx-1" />
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <LayoutGrid size={13} />
          <span>Dashboard</span>
        </div>
        <div className="ml-auto">
          <span className="rounded-full bg-indigo-50 border border-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-600">
            AI-Powered Matching
          </span>
        </div>
      </header>

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
          <div className="p-6 h-full">
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