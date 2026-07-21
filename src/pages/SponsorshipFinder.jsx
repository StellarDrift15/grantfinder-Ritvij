import { useState } from "react";
import { motion } from "framer-motion";
import { Handshake } from "lucide-react";
import { base44 } from "@/api/base44Client";
import Shell from "@/components/Shell";
import SponsorshipProfileForm from "@/components/sponsorship/SponsorshipProfileForm";
import SponsorshipResults from "@/components/sponsorship/SponsorshipResults";

function buildSponsorReason(sponsor, teamData, isMentor) {
  const name = sponsor.company_name;
  const parts = [];
  if (isMentor) {
    parts.push(`${name} is a top match because your team has an internal connection there.`);
    parts.push(`Ask your mentor/coach to contact ${name}'s Community Relations or CSR team about volunteer grants and STEM sponsorship.`);
  } else {
    parts.push(`${name} is a strong sponsorship fit for your ${teamData.program_type || "robotics"} team.`);
    if (sponsor.sponsorship_status === "Open Grant" || sponsor.sponsorship_status === "Confirmed Sponsor") {
      parts.push(`${name} is a proven, accessible sponsor (${sponsor.sponsorship_status}).`);
    } else if (sponsor.sponsorship_status) {
      parts.push(`${name}'s status is "${sponsor.sponsorship_status}".`);
    }
    if (sponsor.description) parts.push(sponsor.description);
  }
  if (sponsor.contact_phone) {
    parts.push(`Call ${name} first at ${sponsor.contact_phone}, then follow up by email.`);
  } else if (sponsor.contact_email) {
    parts.push(`Email ${sponsor.contact_email} with your team summary and sponsorship ask.`);
  }
  return parts.join(" ");
}

function stripCommunityNotes(reason, sponsor) {
  if (!reason) return reason;
  let cleaned = reason;
  const notes = (sponsor && sponsor.community_notes) || "";
  if (notes) {
    const esc = notes.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    cleaned = cleaned.replace(new RegExp(`\\s*Community\\s*notes?:\\s*${esc}\\.?\\s*`, "gi"), " ");
    cleaned = cleaned.replace(new RegExp(`\\s*Note:\\s*${esc}\\.?\\s*`, "gi"), " ");
    cleaned = cleaned.replace(new RegExp(`\\s+${esc}\\.?\\s*$`, "i"), " ");
  }
  cleaned = cleaned.replace(/\s*Community\s*notes?:\s*[^.]*\.\s*/gi, " ");
  return cleaned.replace(/\s+/g, " ").trim();
}

async function runSponsorshipScan(teamData) {
  const allSponsors = await base44.entities.Sponsorships.list();
  if (allSponsors.length === 0) return [];

  const mentorText = (teamData.mentor_connections || "").toLowerCase();
  const mentorMatchedIds = new Set();

  function isMentorMatch(companyName) {
    if (!mentorText) return false;
    const name = companyName.toLowerCase().trim();
    if (mentorText.includes(name)) return true;
    const stopWords = new Set(["the", "and", "for", "inc", "llc", "ltd", "corp", "co", "company"]);
    const words = name.split(/\s+/).filter(w => w.length > 1 && !stopWords.has(w));
    if (words.length > 0 && words.every(w => mentorText.includes(w))) return true;
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
  7. ACCURACY IS CRITICAL: The match_reason for each entry MUST describe ONLY the sponsor identified by that sponsor_id. Read that sponsor's company_name, description, and community notes carefully. Begin the match_reason by naming that company's EXACT name verbatim. NEVER mention or describe a different company from the list — if you reference another company's name, program, email, or phone, the entry is wrong. All contact details (email/phone) in the reason must belong to THAT sponsor only.
  8. Return ALL sponsors scoring above 45, sorted by score descending.
  9. Do NOT include, quote, or paraphrase the "CommunityNotes" field in your match_reason — that information is shown to the user separately. The match_reason should focus on fit, status, and outreach steps only.`;

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

  const enriched = matches
    .filter((m) => m.match_confidence > 45 && sponsorMap[m.sponsor_id])
    .map((m) => {
      const sponsor = sponsorMap[m.sponsor_id];
      const correctName = sponsor.company_name;
      let reason = m.match_reason || "";
      const correctLower = correctName ? correctName.toLowerCase() : "";
      const reasonLower = reason.toLowerCase();
      const mentionsCorrect = correctLower && reasonLower.includes(correctLower);
      const otherNames = allSponsors
        .map((s) => s.company_name)
        .filter((n) => n && n.toLowerCase() !== correctLower && reasonLower.includes(n.toLowerCase()));
      const isMentor = mentorMatchedIds.has(m.sponsor_id);
      if (!mentionsCorrect || otherNames.length > 0) {
        reason = buildSponsorReason(sponsor, teamData, isMentor);
      }
      reason = stripCommunityNotes(reason, sponsor);
      return {
        ...m,
        match_reason: reason,
        match_confidence: Math.min(100, Math.round(m.match_confidence)),
        has_mentor_connection: mentorMatchedIds.has(m.sponsor_id) || !!m.has_mentor_connection,
        sponsor,
      };
    });

  mentorMatchedIds.forEach(id => {
    if (sponsorMap[id]) {
      const alreadyIn = enriched.find(e => e.sponsor_id === id);
      if (alreadyIn) {
        alreadyIn.has_mentor_connection = true;
        alreadyIn.match_confidence = Math.max(alreadyIn.match_confidence, 90);
      } else {
        const s = sponsorMap[id];
        enriched.unshift({
          sponsor_id: id,
          match_confidence: 92,
          match_reason: `Your team has an internal connection at ${s.company_name}! Ask your mentor/coach to:\n1. Contact their company's Community Relations or CSR team directly.\n2. Ask specifically about volunteer grant programs (many companies like Microsoft match volunteer hours with cash donations to nonprofits/STEM teams).\n3. Have them mention your FIRST Robotics team by name and your EIN number.\n4. Request any available matching gift, volunteer hour grants, or direct STEM sponsorship.`,
          has_mentor_connection: true,
          sponsor: s,
        });
      }
    }
  });

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
    <Shell active="">
      <div className="flex items-center gap-3 mb-6">
        <span
          className="w-10 h-10 rounded-xl grid place-items-center border shrink-0"
          style={{ background: "rgba(139,92,246,0.12)", borderColor: "rgba(139,92,246,0.28)" }}
        >
          <Handshake size={18} className="text-[#A78BFA]" />
        </span>
        <div>
          <h1 className="font-display text-xl font-bold text-gf-hi">Sponsorship finder</h1>
          <p className="text-sm text-gf-low">AI-matched companies, plus a cold email drafted for each one.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[400px_1fr] gap-[22px] items-start">
        <aside className="lg:sticky lg:top-[82px]">
          <SponsorshipProfileForm onSubmit={handleSubmit} loading={scanning} />
        </aside>
        <main>
          {scanError && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-4 rounded-xl border border-[rgba(248,113,113,0.3)] bg-[rgba(248,113,113,0.08)] px-4 py-3 text-sm text-[#FCA5A5]"
            >
              {scanError}
            </motion.div>
          )}
          <SponsorshipResults results={results} scanning={scanning} hasScanned={hasScanned} />
        </main>
      </div>
    </Shell>
  );
}