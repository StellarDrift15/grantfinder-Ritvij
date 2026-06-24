import { useState } from "react";
import { Link } from "react-router-dom";
import { Phone, CheckCircle2, AlertCircle, MessageSquare, ChevronDown, ChevronUp, ArrowLeft } from "lucide-react";

const STEPS = [
  {
    number: "01",
    title: "Research Local Businesses First",
    tips: [
      "Target businesses that benefit from your community (restaurants, hardware stores, local banks).",
      "Look for businesses that have sponsored local events — they're already predisposed to giving.",
      "Find the owner's or manager's name before you call; avoid asking for 'whoever handles donations.'",
    ],
  },
  {
    number: "02",
    title: "Craft Your 30-Second Pitch",
    tips: [
      "Lead with your impact: \"We help 40 local students learn robotics and compete nationally.\"",
      "State the ask clearly: \"We're looking for a $500 sponsorship to cover registration fees.\"",
      "Offer something in return: logo on banners, mention at events, social media shoutout.",
    ],
  },
  {
    number: "03",
    title: "Make the Call",
    tips: [
      "Call Tuesday–Thursday between 10am–12pm or 2pm–4pm — avoid Mondays and Fridays.",
      "If you get a gatekeeper, say: \"I'd like to speak with [Name] about a local sponsorship opportunity.\"",
      "Don't read from a script — be natural, friendly, and specific about your team/organization.",
    ],
  },
  {
    number: "04",
    title: "Handle Objections",
    tips: [
      "\"We don't do donations\" → \"This is a sponsorship — your logo appears on our team materials.\"",
      "\"Send us an email\" → Ask for the exact email and the person's name, then follow up within 24 hours.",
      "\"We already gave this year\" → \"Would it be okay to follow up in January for next year's budget?\"",
    ],
  },
  {
    number: "05",
    title: "Follow Up & Build the Relationship",
    tips: [
      "Send a thank-you email or handwritten note within 48 hours of any conversation.",
      "Provide a photo or update after the event — sponsors love seeing their impact.",
      "Set a calendar reminder to reconnect 3 months before next year's season starts.",
    ],
  },
];

const SCRIPT = `"Hi, may I speak with [Owner/Manager Name]?

My name is [Your Name] and I'm with [Organization Name] — we're a local [robotics team / nonprofit] based right here in [City].

We serve [X] students/community members and we're preparing for [event/season/program].

We're reaching out to a few local businesses about sponsorship opportunities — it's a great way to show your support for the community and get your name in front of [audience].

We're looking for sponsors at the $[amount] level, which would cover [specific cost]. In return, we'd feature your logo on [banners / shirts / website].

Would that be something you'd be open to discussing?"`;

export default function ColdCallingPage() {
  const [scriptOpen, setScriptOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {/* Top Nav */}
      <header className="h-14 bg-white border-b border-slate-100 flex items-center px-6 gap-3 shadow-sm">
        <Link
          to="/"
          className="flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Grant Finder
        </Link>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Phone size={18} className="text-amber-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Cold Calling Local Businesses</h1>
              <p className="text-sm text-slate-500">A practical guide to raising money directly from your community</p>
            </div>
          </div>

          {/* Callout */}
          <div className="flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 my-6">
            <AlertCircle size={15} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800 leading-relaxed">
              Local businesses often give $250–$2,000 to community organizations — and a 15-minute phone call can close it faster than a 6-month grant cycle. Many robotics teams and nonprofits raise 30–50% of their budget this way.
            </p>
          </div>

          {/* Steps */}
          <div className="flex flex-col gap-5 mb-8">
            {STEPS.map((step) => (
              <div key={step.number} className="rounded-xl border border-slate-200 p-5 bg-white">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-sm font-bold text-indigo-500 font-mono bg-indigo-50 rounded-lg px-2.5 py-1">{step.number}</span>
                  <h3 className="text-base font-semibold text-slate-800">{step.title}</h3>
                </div>
                <ul className="flex flex-col gap-2.5 ml-1">
                  {step.tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-600 leading-relaxed">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Sample Script */}
          <div className="rounded-xl border border-indigo-100 bg-indigo-50">
            <button
              onClick={() => setScriptOpen(!scriptOpen)}
              className="w-full flex items-center justify-between px-5 py-4"
            >
              <div className="flex items-center gap-2.5">
                <MessageSquare size={16} className="text-indigo-500" />
                <span className="text-sm font-semibold text-indigo-700">Sample Phone Script</span>
              </div>
              {scriptOpen ? <ChevronUp size={16} className="text-indigo-400" /> : <ChevronDown size={16} className="text-indigo-400" />}
            </button>
            {scriptOpen && (
              <div className="px-5 pb-5">
                <pre className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed bg-white rounded-lg border border-indigo-100 p-5 font-body">
                  {SCRIPT}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}