import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Shell from "@/components/Shell";
import ToolRail from "@/components/dashboard/ToolRail";
import OrgProfileForm from "@/components/OrgProfileForm";
import ResultsArea from "@/components/dashboard/ResultsArea";
import { base44 } from "@/api/base44Client";

function buildOpportunityReason(opportunity) {
  const title = opportunity.title;
  const prov = opportunity.provider_name;
  const bits = [`${title} from ${prov}`];
  if (opportunity.type) bits.push(`is a ${opportunity.type}`);
  if (opportunity.value_amount) bits.push(`worth up to $${Number(opportunity.value_amount).toLocaleString()}`);
  bits.push(".");
  if (opportunity.description) bits.push(opportunity.description);
  if (opportunity.type === "Cash Grant") {
    bits.push("This funding can directly offset registration, travel, or program costs for your organization.");
  } else if (opportunity.type === "Store Credit") {
    bits.push("This credit reduces out-of-pocket spending on critical hardware and supplies.");
  } else if (opportunity.type === "Material Sponsorship") {
    bits.push("This sponsorship provides physical materials at no cost, lowering your operating expenses.");
  }
  if (opportunity.application_url) bits.push("Apply via the link on this card.");
  return bits.join(" ");
}

async function runGrantScan(formData) {
  const focusAreas = Array.isArray(formData.focus_area) ? formData.focus_area : (formData.focus_area ? [formData.focus_area] : []);
  const isRobotics = focusAreas.includes("FIRST Robotics");
  const isFLL = focusAreas.includes("FIRST LEGO League (FLL)");
  const isFIRST = isRobotics || isFLL;

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

  const searchRecord = await base44.entities.SearchHistory.create({
    nonprofit_id: nonprofit.id,
    timestamp: new Date().toISOString(),
  });

  const allOpportunities = await base44.entities.FundingOpportunities.list();

  const fllKeywords = ['fll', 'lego league', 'class pack', 'first lego'];
  const matchesFll = (o) => fllKeywords.some(k => (o.title + ' ' + (o.description || '') + ' ' + (o.target_sectors || []).join(' ')).toLowerCase().includes(k));
  let opportunities = allOpportunities;
  if (isFLL) {
    const fllFirst = allOpportunities.filter(matchesFll);
    const roboticsOthers = allOpportunities.filter(o => !fllFirst.includes(o) && o.accepts_robotics_teams);
    const stemOthers = allOpportunities.filter(o => !fllFirst.includes(o) && !roboticsOthers.includes(o) && (o.target_sectors || []).some(s => ['STEM', 'Education', 'FIRST Robotics'].includes(s)));
    const rest = allOpportunities.filter(o => !fllFirst.includes(o) && !roboticsOthers.includes(o) && !stemOthers.includes(o));
    opportunities = [...fllFirst, ...roboticsOthers, ...stemOthers, ...rest].slice(0, 60);
  } else if (isRobotics) {
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
    const relevantSectors = Array.from(new Set(focusAreas.flatMap(fa => focusSectors[fa] || [])));
    const sectorMatches = allOpportunities.filter(o => (o.target_sectors || []).some(s => relevantSectors.includes(s)));
    const others = allOpportunities.filter(o => !(o.target_sectors || []).some(s => relevantSectors.includes(s)));
    opportunities = [...sectorMatches, ...others].slice(0, 60);
  }

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
Focus Areas: ${focusAreas.join(", ")}
Annual Budget: $${formData.annual_budget || "Not specified"}
Location: ${formData.location || "Not specified"}
Mission & Keywords: ${formData.mission_keywords || "Not specified"}

${isFLL ? `CRITICAL FLL INSTRUCTIONS: This is a FIRST LEGO League (FLL) team based in ${formData.location || "the US"}.
- AUTOMATICALLY score 90–100 for FLL-specific opportunities (title or description contains "FLL", "LEGO League", "Class Pack", "FIRST LEGO", "Explore", "Discover") — these are explicitly designed for FLL teams.
- Score 85–95 for general FIRST/robotics material sponsorships (LEGO Education, REV, AndyMark) that explicitly serve FLL.
- IMPORTANT: Score 0–30 and EXCLUDE grants that are explicitly FTC-only or FRC-only (titles containing "FTC" or "FRC" without "FLL") — an FLL team is NOT eligible for FTC/FRC programs. For example "FTC Hardship Registration Grant" or any FRC Rookie Grant is INELIGIBLE for an FLL team.
- Score 60–80 for broad STEM/education grants and store credits any youth STEM program can use.` : isRobotics ? `CRITICAL ROBOTICS INSTRUCTIONS: This is a FIRST Robotics (FTC/FRC) team based in ${formData.location || "Texas"}.
- AUTOMATICALLY score 90–100 for any opportunity with these keywords in the title or description: "Swyft", "Polymaker", "Gene Haas", "Haas Foundation", "FIRST in Texas", "FiT Grant", "FTC", "FRC", "FIRST Robotics" — these are highly accessible grants specifically designed for teams like this one.
- IMPORTANT: Score 0–30 and EXCLUDE grants that are explicitly FLL-only (titles containing "FLL", "LEGO League", "Class Pack") — an FTC/FRC team is generally NOT eligible for FLL-only grants.
- Score 80–95 for ALL opportunities where 'Accepts Robotics Teams' is TRUE and the program type is compatible.
- Score 70–85 for STEM/education material sponsorships and store credits (REV Robotics, AndyMark, Vex, Limelight, PTC/Creo, Autodesk) — these directly reduce team costs.
- DO NOT score compatible robotics-eligible grants below 75 unless there is a clear hard eligibility conflict (wrong geography, wrong program type).
- Texas-based teams: give extra weight to Texas-specific grants (FIRST in Texas Foundation, Texas Instruments, etc.).` : "Match the organization's focus area and mission to relevant target sectors. For general nonprofits, note how Store Credits (like Google Ad Grants) and Material Sponsorships save operational costs. Prioritize sector-aligned opportunities."}

AVAILABLE FUNDING OPPORTUNITIES:
${opportunitiesText}

INSTRUCTIONS:
1. Score each opportunity 0–100 based on alignment with the nonprofit's focus area, mission keywords, and sector.
2. ACCURACY IS CRITICAL: For each match, the match_reason MUST describe ONLY the opportunity identified by that funding_id. Read that opportunity's title, provider_name, and description carefully. Begin the match_reason by naming that opportunity's EXACT title verbatim from the list. NEVER describe or name a different grant, and never invent a title that is not in the list. If the program type does not match the team (e.g. an FTC/FRC-only grant for an FLL team, or an FLL-only grant for an FTC/FRC team), score it below 30 and exclude it.
3. For opportunities scoring above 60, write a brief 2-sentence explanation of eligibility — specifically note how this type of funding (cash grant, store credit, or material sponsorship) benefits this particular organization.
4. Return ONLY opportunities scoring above 60, sorted by score descending.

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

  const byId = new Map();
  for (const m of (llmResponse?.matches || [])) {
    if (!m || !m.funding_id) continue;
    const prev = byId.get(m.funding_id);
    if (!prev || (m.match_confidence || 0) > (prev.match_confidence || 0)) {
      byId.set(m.funding_id, m);
    }
  }
  const matches = Array.from(byId.values());
  if (matches.length === 0) return [];

  const opportunityMap = {};
  opportunities.forEach((o) => { opportunityMap[o.id] = o; });

  const confidenceThreshold = isFIRST ? 50 : 60;
  const allTitles = opportunities.map((o) => o.title).filter(Boolean);
  const resultsToSave = matches
    .filter((m) => m.match_confidence > confidenceThreshold && opportunityMap[m.funding_id])
    .map((m) => {
      const opp = opportunityMap[m.funding_id];
      const correctTitle = (opp.title || "").toLowerCase();
      const reason = (m.match_reason || "").toLowerCase();
      const mentionsCorrect = correctTitle && reason.includes(correctTitle);
      const mentionsOther = allTitles.some(
        (t) => t && t.toLowerCase() !== correctTitle && reason.includes(t.toLowerCase())
      );
      const match_reason =
        !mentionsCorrect || mentionsOther ? buildOpportunityReason(opp) : m.match_reason;
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
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const scanId = searchParams.get("scan");
    if (!scanId) return;
    (async () => {
      setScanning(true);
      try {
        const [mrs, opps] = await Promise.all([
          base44.entities.MatchingResults.filter({ search_id: scanId }),
          base44.entities.FundingOpportunities.list("-created_date", 500),
        ]);
        const map = {};
        (opps || []).forEach((o) => { map[o.id] = o; });
        const enriched = (mrs || []).map((r) => ({ ...r, opportunity: map[r.funding_id] || {} }));
        enriched.sort((a, b) => b.match_confidence - a.match_confidence);
        setResults(enriched);
        setHasScanned(true);
      } catch (err) {
        setScanError(err.message);
        setHasScanned(true);
      } finally {
        setScanning(false);
      }
    })();
  }, [searchParams]);

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
    <Shell active="Dashboard">
      <ToolRail />
      <div className="grid lg:grid-cols-[400px_1fr] gap-[22px] items-start">
        <aside className="lg:sticky lg:top-[82px]">
          <OrgProfileForm onFormSubmit={handleFormSubmit} />
        </aside>
        <main>
          {scanError && (
            <div className="mb-4 rounded-xl border border-[rgba(248,113,113,0.3)] bg-[rgba(248,113,113,0.08)] px-4 py-3 text-sm text-[#FCA5A5]">
              {scanError}
            </div>
          )}
          <ResultsArea results={results} scanning={scanning} hasScanned={hasScanned} />
        </main>
      </div>
    </Shell>
  );
}