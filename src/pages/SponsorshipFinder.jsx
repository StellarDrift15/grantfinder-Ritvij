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

  // Pre-match mentor connections on the frontend — multiple strategies for robustness
  const mentorText = (teamData.mentor_connections || "").toLowerCase();
  const mentorMatchedIds = new Set();

  function isMentorMatch(companyName) {
    if (!mentorText) return false;
    const name = companyName.toLowerCase().trim();
    // Strategy 1: exact full name
    if (mentorText.includes(name)) return true;
    // Strategy 2: all significant words present (ignores Inc, LLC, etc.)
    const stopWords = new Set(["the", "and", "for", "inc", "llc", "ltd", "corp", "co", "company"]);
    const words = name.split(/\s+/).filter(w => w.length > 1 && !stopWords.has(w));
    if (words.length > 0 && words.every(w => mentorText.includes(w))) return true;
    // Strategy 3: any significant word as a whole word (catches "Microsoft" in "coach at Microsoft Volunteer")
    if (words.some(w => new RegExp(`\\b${w}\\b`).test(mentorText))) return true;
    return false;
  }

  if (mentorText) {
    allSponsors.forEach((s) => {
      if (isMentorMatch(s.company_name || "")) {
        mentorMatchedIds.add(s.id);
      }
    });
  }

  const sponsorsText = allSponsors
    .map((s, i) => {
      const mentorFlag = mentorMatchedIds.has(s.id) ? " | ⭐MENTOR_MATCH=TRUE (team has internal connection here — score 92-100, give step-by-step internal guidance)" : "";
      return `[${i + 1}] ID:${s.id} | ${s.company_name} | Status:${s.sponsorship_status || "Unknown"} | Typical:$${s.typical_amount || "N/A"} | Programs:${(s.target_programs || []).join(",") || "Any"} | Geo:${s.geographic_focus || "Any"} | Phone:${s.contact_phone || "None"} | Email:${s.contact_email || "None"} | ${s.description || ""} | CommunityNotes:${(s.community_notes || "").slice(0, 120)}${mentorFlag}`;
    })
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
Mentor/Parent Company Connections: ${teamData.mentor_connections || "None provided"}

SPONSOR STATUS PRIORITY:
- "Open Grant" / "Confirmed Sponsor" → score 85-100 (proven, accessible)
- "Email Outreach" → score 70-90 (contactable, worth trying)
- "Call Required" → score 65-85 (need to call)
- "EDU Discounts" → score 60-80 (not cash but saves money)
- "Needs Connection" → score 50-70 (need employee connection)
- "Untried" → score 55-75 (other teams use them, worth trying)

MENTOR CONNECTION RULE: If the team listed a mentor/parent who works at a company AND that company is in the list below AND that company offers sponsorship (status is NOT "Do not sponsor"), massively boost that company's score to 90-100 and set has_mentor_connection=true. The match_reason must then include a specific step-by-step internal approach: how to ask the mentor to inquire at their company, who they should contact internally (e.g. Community Relations, HR, CSR team), what to say, and what to ask for.

AVAILABLE SPONSORS:
${sponsorsText}

CRITICAL INSTRUCTIONS:
  1. Score each sponsor 0–100 based on status priority, program type match, location, and community notes.
  2. If a sponsor's target programs include the team's program type, boost score by 10.
  3. MANDATORY: Each entry in your response must include "company_name" set to the EXACT company name from that sponsor's entry above. Do NOT copy the company name from a different entry.
  4. The match_reason for each entry MUST mention that company's EXACT name in the first sentence. Write as if you are speaking about ONLY that one company.
  5. OUTREACH ORDER: When a phone number is available for a sponsor (status "Call Required" or any sponsor with contact info), ALWAYS recommend calling first before emailing. Format advice as: "Call [company] first at their main number, introduce your team, then follow up with an email." If no phone contact is available, then recommend email outreach.
  6. If has_mentor_connection is true, the match_reason must be a step-by-step internal guide (3-4 steps) for the mentor to unlock sponsorship at their workplace — referencing THAT company by name throughout.
  7. Return ALL sponsors scoring above 45, sorted by score descending.`;

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
              company_name: { type: "string" },
              match_confidence: { type: "number" },
              match_reason: { type: "string" },
              has_mentor_connection: { type: "boolean" },
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

  // Track all LLM-returned sponsor IDs (before filtering) to avoid double-adding in fallback
  const llmReturnedIds = new Set(matches.map(m => m.sponsor_id));

  const enriched = matches
    .filter((m) => m.match_confidence > 45 && sponsorMap[m.sponsor_id])
    .map((m) => {
      const sponsor = sponsorMap[m.sponsor_id];
      const correctName = sponsor.company_name;
      // If the reason doesn't mention the correct company name, prepend a correction
      let reason = m.match_reason || "";
      if (correctName && !reason.toLowerCase().includes(correctName.toLowerCase())) {
        reason = `${correctName} is a strong match for your team. ${reason}`;
      }
      return {
        ...m,
        match_reason: reason,
        match_confidence: Math.min(100, Math.round(m.match_confidence)),
        has_mentor_connection: mentorMatchedIds.has(m.sponsor_id) || !!m.has_mentor_connection,
        sponsor,
      };
    });

  // Guarantee: inject any mentor-matched company the LLM missed or scored too low
  mentorMatchedIds.forEach(id => {
    if (sponsorMap[id]) {
      const alreadyIn = enriched.find(e => e.sponsor_id === id);
      if (alreadyIn) {
        // Make sure it's flagged and boosted
        alreadyIn.has_mentor_connection = true;
        alreadyIn.match_confidence = Math.max(alreadyIn.match_confidence, 90);
      } else {
        // LLM missed it entirely — add it manually
        const s = sponsorMap[id];
        enriched.unshift({
          sponsor_id: id,
          match_confidence: 92,
          match_reason: `Your team has an internal connection at ${s.company_name}! Ask your mentor/coach to:\n1. Contact their company's Community Relations or CSR team directly.\n2. Ask specifically about volunteer grant programs (many companies like Microsoft match volunteer hours with cash donations to nonprofits/STEM teams).\n3. Have them mention your FIRST Robotics team by name and your EIN number.\n4. Request any available matching gift, volunteer hour grants, or direct STEM sponsorship.\n${s.community_notes ? "\nNote: " + s.community_notes : ""}`,
          has_mentor_connection: true,
          sponsor: s,
        });
      }
    }
  });

  // Sort: mentor connections first, then by confidence
  enriched.sort((a, b) => {
    if (a.has_mentor_connection && !b.has_mentor_connection) return -1;
    if (!a.has_mentor_connection && b.has_mentor_connection) return 1;
    return b.match_confidence - a.match_confidence;
  });

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