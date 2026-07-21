import { useState } from "react";
import CopyButton from "@/components/coldcalling/CopyButton";
import Shell from "@/components/Shell";
import {
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Handshake,
  Lightbulb,
  FileText,
  Building2,
} from "lucide-react";

const RESEARCH_TIPS = [
  "Target businesses that benefit from your community (restaurants, hardware stores, local banks).",
  "Look for businesses that have sponsored local events — they're already predisposed to giving.",
  "Find the owner's or manager's name before you call; avoid asking for 'whoever handles donations.'",
];

const COLD_EMAIL = `Hi [First Name],

My name is [Your Name], and I'm with [Organization Name], a [brief one-line description — e.g. community robotics team / local nonprofit serving youth]. We [what you do and who you impact — e.g. run STEM programs for 40+ students in the Houston area, competing in FIRST Robotics].

I'm reaching out because [Company Name]'s support for [relevant cause — youth education, STEM, local community, etc.] made me think you'd be a great fit to partner with us.

As a sponsor, you'd get:
- Brand visibility on our team shirts, robot, and at every event we attend
- Feature placement across our social media channels and website
- Direct connection to motivated students — many exploring internships and career paths in your industry
- Community impact — your support directly funds parts, tools, travel, and resources that make this possible for students who couldn't otherwise participate
- Tax-deductible donation — we're a registered 501(c)(3) nonprofit, so your contribution is fully tax-deductible

We're a community-driven program, and every dollar truly goes a long way. Sponsorship packages start at just $50, with tiers up to $300+ for more visibility. I've attached our Sponsorship Packet for more info.

Would you be open to a quick 10-minute call this week to talk through how we could work together? I'll follow up in a few days if I don't hear back, but feel free to reply directly anytime.

Thanks so much for considering it,

[Your Name]
[Your Role], [Organization Name]
[Phone] | [Email] | [Website/Socials]`;

const CALL_RECAP = `"I'm with [Organization Name], a [brief description — e.g. community robotics team / local youth nonprofit] working with students in [your area]. We're looking for a few sponsors to help cover costs like parts, tools, and travel. In return, sponsors get their logo on our team shirts and robot at every event, plus features across our social media. We're also a registered 501(c)(3) nonprofit, so any donation is fully tax-deductible."`;

const OBJECTIONS = [
  {
    q: '"Sure, let\'s set something up"',
    a: '"Awesome — what does your schedule look like next week? I can work around whatever\'s easiest for you." Lock in a specific day/time before hanging up if at all possible.',
  },
  {
    q: '"I don\'t think a meeting is necessary, just send info"',
    a: '"Totally understand — I\'ll send over a sponsorship one-pager with all the details, including our 501(c)(3) info for the tax write-off. If after reading it you have questions or want to talk through specifics, I\'d still love to grab even 15 minutes in person — sometimes it\'s easier to show you what past events looked like."',
  },
  {
    q: '"We don\'t have budget right now"',
    a: '"That makes sense — would in-kind support work instead, like product credits or mentor volunteers? Either way, I\'d still love to sit down and explain the impact a partnership could have, even if it\'s something to consider for next time. Worst case, you get to meet the team behind it."',
  },
  {
    q: '"Not interested"',
    a: '"No worries at all, I appreciate you taking the call. If anything changes, our info is always on our website. Thanks for your time!"',
  },
  {
    q: '"How much are you looking for?"',
    a: '"Our tiers start at 50 dollars and go up to 300 dollars. I\'d love to walk through the breakdown in person so I can explain exactly what each tier gets you. Does meeting sometime next week work?"',
  },
  {
    q: '"Are you actually a registered nonprofit?"',
    a: '"Yep — we\'re fiscally sponsored by Hack Club, which is a registered 501(c)(3). I\'ll bring their EIN and documentation with me to the meeting, or send it ahead of time if that\'s helpful."',
  },
];

const accentMap = {
  indigo: { ring: "bg-[rgba(139,92,246,0.14)]", text: "text-[#C4B5FD]", border: "border-[rgba(139,92,246,0.25)]", chip: "bg-[rgba(139,92,246,0.14)] text-[#C4B5FD]" },
  emerald: { ring: "bg-[rgba(52,211,153,0.12)]", text: "text-[#6EE7B7]", border: "border-[rgba(52,211,153,0.22)]", chip: "bg-[rgba(52,211,153,0.12)] text-[#6EE7B7]" },
};

function SectionCard({ icon: Icon, accent, number, title, subtitle, children }) {
  const c = accentMap[accent];
  return (
    <div className={`rounded-2xl border ${c.border} bg-gf-panel p-6`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-xl ${c.ring} flex items-center justify-center`}>
          <Icon size={18} className={c.text} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {number && <span className={`text-xs font-bold font-mono ${c.chip} rounded-md px-2 py-0.5`}>{number}</span>}
            <h3 className="text-base font-semibold text-gf-hi font-display">{title}</h3>
          </div>
          {subtitle && <p className="text-xs text-gf-low mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

export default function ColdCallingPage() {
  const [emailOpen, setEmailOpen] = useState(false);
  const [callOpen, setCallOpen] = useState(false);

  return (
    <Shell active="">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <span
            className="w-10 h-10 rounded-xl grid place-items-center border shrink-0"
            style={{ background: "rgba(52,211,153,0.12)", borderColor: "rgba(52,211,153,0.26)" }}
          >
            <TrendingUp size={18} className="text-[#6EE7B7]" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-gf-hi font-display">Fundraising strategy</h1>
            <p className="text-sm text-gf-low">A proven email-then-call playbook for raising money from local &amp; corporate sponsors</p>
          </div>
        </div>

        <div className="flex items-stretch gap-3 my-6">
          <div className="flex-1 flex items-center gap-3 rounded-xl bg-[rgba(52,211,153,0.08)] border border-[rgba(52,211,153,0.25)] px-4 py-3">
            <TrendingUp size={16} className="text-[#6EE7B7] shrink-0" />
            <p className="text-sm text-[#A7F3D0] leading-relaxed font-medium">
              This playbook was used to raise over $60,000 from sponsors across 5+ states — with an 80% success rate on contacted companies.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-xl bg-[rgba(251,191,36,0.06)] border border-[rgba(251,191,36,0.22)] px-4 py-3 mb-8">
          <AlertCircle size={15} className="text-[#FCD34D] shrink-0 mt-0.5" />
          <p className="text-sm text-[#FDE68A] leading-relaxed">
            The winning sequence is simple: <strong>send a brief cold email first</strong>, then <strong>follow up with a phone call ~2 days later</strong>.
            Email warms them up and gives them context; the call closes the meeting where the real pitch happens. Lead with impact, your 501(c)(3) tax-deductible status, and small tiered asks ($50–$300).
          </p>
        </div>

        <div className="mb-5">
          <SectionCard icon={Building2} accent="indigo" number="00" title="Research before you reach out" subtitle="Do this before sending a single email">
            <ul className="flex flex-col gap-2.5 ml-1">
              {RESEARCH_TIPS.map((tip, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <CheckCircle2 size={14} className="text-[#6EE7B7] shrink-0 mt-0.5" />
                  <span className="text-sm text-gf-mid leading-relaxed">{tip}</span>
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>

        <div className="mb-5">
          <SectionCard icon={Mail} accent="indigo" number="01" title="Cold email first" subtitle="Send this 2 days before you call. Brief, impact-led, tax-deductible, low ask.">
            <p className="text-sm text-gf-mid leading-relaxed mb-3">
              Keep it short. Explain who you are, what the event is, why this company fits, what sponsors get, and that donations are tax-deductible (501(c)(3) under Hack Club).
              Attach your Sponsorship Packet. Always end with a low-friction ask: a 10-minute call this week. The script below is a generic template — swap the bracketed fields for your own organization.
            </p>
            <div className="rounded-xl border border-[rgba(139,92,246,0.25)] bg-[rgba(139,92,246,0.06)]">
              <button onClick={() => setEmailOpen(!emailOpen)} className="w-full flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <Mail size={15} className="text-[#A78BFA]" />
                  <span className="text-sm font-semibold text-[#C4B5FD]">Cold email script</span>
                </div>
                {emailOpen ? <ChevronUp size={15} className="text-gf-low" /> : <ChevronDown size={15} className="text-gf-low" />}
              </button>
              {emailOpen && (
                <div className="px-4 pb-4">
                  <div className="flex justify-end mb-2">
                    <CopyButton text={COLD_EMAIL} label="Copy email" />
                  </div>
                  <pre className="text-sm text-gf-mid whitespace-pre-wrap leading-relaxed bg-[rgba(7,11,20,0.55)] rounded-lg border border-gf-line p-4 font-body">
                    {COLD_EMAIL}
                  </pre>
                </div>
              )}
            </div>
          </SectionCard>
        </div>

        <div className="mb-5">
          <SectionCard icon={Phone} accent="emerald" number="02" title="Follow-up cold call — 2 days later" subtitle="Goal: confirm they saw the email, recap, and lock in a meeting to pitch in person.">
            <div className="text-sm text-gf-mid leading-relaxed space-y-3">
              <p><strong className="text-gf-hi">Opening:</strong></p>
              <div className="relative">
                <div className="absolute top-2 right-2 z-10"><CopyButton text={`"Hi, is this [Company]? Hey, my name is [Your Name] — I sent over an email a few days ago about [Organization Name], our [team / nonprofit]. Did you get a chance to see it?"`} /></div>
                <pre className="whitespace-pre-wrap bg-[rgba(7,11,20,0.55)] rounded-lg border border-gf-line p-3 pr-24 font-body text-xs text-gf-mid">
{`"Hi, is this [Company]? Hey, my name is [Your Name] — I sent over an email a few days ago about [Organization Name], our [team / nonprofit]. Did you get a chance to see it?"`}
                </pre>
              </div>
              <p className="text-xs text-gf-low">If yes: <em>"Great! Just to recap quickly — ..."</em> &nbsp; If no: <em>"No worries, I'll keep it short. Quick recap of what I sent — ..."</em></p>
              <p><strong className="text-gf-hi">The recap (use either way):</strong></p>
              <div className="relative">
                <div className="absolute top-2 right-2 z-10"><CopyButton text={CALL_RECAP} /></div>
                <pre className="whitespace-pre-wrap bg-[rgba(7,11,20,0.55)] rounded-lg border border-gf-line p-3 pr-24 font-body text-xs text-gf-mid">
{CALL_RECAP}
                </pre>
              </div>
              <p><strong className="text-gf-hi">The ask:</strong></p>
              <div className="relative">
                <div className="absolute top-2 right-2 z-10"><CopyButton text={`"I know that's a lot to cover over the phone, and I'd love the chance to actually walk you through the full pitch — why this partnership makes sense, what past sponsors have gotten out of it, and how we'd showcase [Company Name] specifically. Would you be open to a quick in-person meeting sometime in the next week or two? I'm happy to come to your office, or if that's easier, we could do a video call instead."`} /></div>
                <pre className="whitespace-pre-wrap bg-[rgba(7,11,20,0.55)] rounded-lg border border-gf-line p-3 pr-24 font-body text-xs text-gf-mid">
{`"I know that's a lot to cover over the phone, and I'd love the chance to actually walk you through the full pitch — why this partnership makes sense, what past sponsors have gotten out of it, and how we'd showcase [Company Name] specifically. Would you be open to a quick in-person meeting sometime in the next week or two? I'm happy to come to your office, or if that's easier, we could do a video call instead."`}
                </pre>
              </div>
              <p><strong className="text-gf-hi">Closing:</strong></p>
              <div className="relative">
                <div className="absolute top-2 right-2 z-10"><CopyButton text={`"Perfect — I'll set a meeting and let my team know for [day/time]. Thanks so much, looking forward to it!"`} /></div>
                <pre className="whitespace-pre-wrap bg-[rgba(7,11,20,0.55)] rounded-lg border border-gf-line p-3 pr-24 font-body text-xs text-gf-mid">
{`"Perfect — I'll set a meeting and let my team know for [day/time]. Thanks so much, looking forward to it!"`}
                </pre>
              </div>
            </div>

            <div className="mt-5">
              <h4 className="text-sm font-semibold text-gf-hi mb-2 flex items-center gap-2 font-display">
                <MessageSquare size={14} className="text-[#6EE7B7]" />
                Handling common responses
              </h4>
              <div className="flex flex-col gap-2.5">
                {OBJECTIONS.map((o, i) => (
                  <div key={i} className="rounded-lg border border-gf-line bg-[rgba(7,11,20,0.4)] p-3">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-xs font-semibold text-gf-hi">{o.q}</p>
                      <CopyButton text={o.a} />
                    </div>
                    <p className="text-xs text-gf-mid leading-relaxed">{o.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="mb-5">
          <SectionCard icon={Handshake} accent="emerald" number="03" title="Negotiate in-kind when cash falls through" subtitle="If they can't write a check, upgrade to higher product value instead.">
            <div className="text-sm text-gf-mid leading-relaxed space-y-3">
              <p>
                When a company won't commit financially, <strong className="text-gf-hi">don't walk away</strong> — pivot to in-kind support.
                Companies are far more willing to give <strong className="text-gf-hi">products, store credit, software licenses, or mentor time</strong> than cash,
                and these assets are often worth <strong className="text-gf-hi">far more</strong> than the sponsorship dollar you were asking for.
              </p>
              <ul className="flex flex-col gap-2.5 ml-1">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 size={14} className="text-[#6EE7B7] shrink-0 mt-0.5" />
                  <span><strong className="text-gf-hi">Ask for higher product worth</strong> — if a $50 tier is the cash ask, request $200+ in product/credit of equivalent marketing value.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 size={14} className="text-[#6EE7B7] shrink-0 mt-0.5" />
                  <span><strong className="text-gf-hi">Store credit &amp; licenses</strong> — robotics teams can leverage tooling credits (SOLIDWORKS, Autodesk, Vex, AndyMark) that directly cut season costs.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 size={14} className="text-[#6EE7B7] shrink-0 mt-0.5" />
                  <span><strong className="text-gf-hi">Mentor volunteers</strong> — engineer time is worth its weight in gold; one mentor = hundreds of hours of technical guidance.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 size={14} className="text-[#6EE7B7] shrink-0 mt-0.5" />
                  <span><strong className="text-gf-hi">Frame it as win-win</strong> — "We can't do cash this year, but could we do $500 in product credit? You'd still get all the same brand visibility."</span>
                </li>
              </ul>
              <div className="flex items-start gap-2.5 rounded-lg bg-[rgba(52,211,153,0.06)] border border-[rgba(52,211,153,0.22)] px-3 py-2.5">
                <Lightbulb size={14} className="text-[#6EE7B7] shrink-0 mt-0.5" />
                <p className="text-xs text-[#A7F3D0] leading-relaxed">
                  In-kind donations are still tax-deductible at fair market value under your 501(c)(3). Always get the donation documented — the company writes off the retail value, not the cost to produce.
                </p>
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="mb-5">
          <SectionCard icon={FileText} accent="indigo" number="04" title="Follow up &amp; build the relationship" subtitle="The money isn't the end — it's the start of a multi-year partner.">
            <ul className="flex flex-col gap-2.5 ml-1">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 size={14} className="text-[#6EE7B7] shrink-0 mt-0.5" />
                <span className="text-sm text-gf-mid leading-relaxed">Send a thank-you email or handwritten note within 48 hours of any conversation.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 size={14} className="text-[#6EE7B7] shrink-0 mt-0.5" />
                <span className="text-sm text-gf-mid leading-relaxed">Provide a photo or update after the event — sponsors love seeing their impact.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 size={14} className="text-[#6EE7B7] shrink-0 mt-0.5" />
                <span className="text-sm text-gf-mid leading-relaxed">Set a calendar reminder to reconnect 3 months before next year's season starts.</span>
              </li>
            </ul>
          </SectionCard>
        </div>
      </div>
    </Shell>
  );
}