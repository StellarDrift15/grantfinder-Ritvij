// Location helpers for grant matching: detect US states in free-text locations
// and decide whether an opportunity's geographic eligibility covers a nonprofit.

const STATE_ABBR = {
  al: "Alabama", ak: "Alaska", az: "Arizona", ar: "Arkansas", ca: "California",
  co: "Colorado", ct: "Connecticut", de: "Delaware", fl: "Florida", ga: "Georgia",
  hi: "Hawaii", id: "Idaho", il: "Illinois", "in": "Indiana", ia: "Iowa",
  ks: "Kansas", ky: "Kentucky", la: "Louisiana", me: "Maine", md: "Maryland",
  ma: "Massachusetts", mi: "Michigan", mn: "Minnesota", ms: "Mississippi",
  mo: "Missouri", mt: "Montana", ne: "Nebraska", nv: "Nevada", nh: "New Hampshire",
  nj: "New Jersey", nm: "New Mexico", ny: "New York", nc: "North Carolina",
  nd: "North Dakota", oh: "Ohio", ok: "Oklahoma", or: "Oregon", pa: "Pennsylvania",
  ri: "Rhode Island", sc: "South Carolina", sd: "South Dakota", tn: "Tennessee",
  tx: "Texas", ut: "Utah", vt: "Vermont", va: "Virginia", wa: "Washington",
  wv: "West Virginia", wi: "Wisconsin", wy: "Wyoming", dc: "District of Columbia",
};

const STATE_NAMES = {};
Object.values(STATE_ABBR).forEach((name) => {
  STATE_NAMES[name.toLowerCase()] = name;
});

const NATIONAL_MARKERS = [
  "all 50 states", "national", "nationwide", "united states", "any", "n/a",
];

// Extract the set of US state names mentioned in free text (full names + abbreviations).
export function statesFromText(text) {
  if (!text) return new Set();
  const t = String(text).toLowerCase();
  const found = new Set();
  // standalone 2-letter abbreviations
  const tokens = t.split(/[^a-z]+/).filter(Boolean);
  for (const tok of tokens) {
    if (STATE_ABBR[tok]) found.add(STATE_ABBR[tok]);
  }
  // full state names as word-boundary substrings
  for (const name of Object.values(STATE_ABBR)) {
    const ln = name.toLowerCase();
    const re = new RegExp(`\\b${ln.replace(/\s+/g, "\\s+")}\\b`);
    if (re.test(t)) found.add(name);
  }
  return found;
}

// An opportunity is location-eligible for a nonprofit if it has no stated
// geography, is national, or explicitly includes one of the nonprofit's states.
export function isLocationEligible(opp, npStates) {
  const locs = opp.eligible_locations;
  if (!locs || locs.length === 0) return true;
  const joined = locs.join(" ").toLowerCase();
  if (NATIONAL_MARKERS.some((n) => joined.includes(n))) return true;
  if (!npStates || npStates.size === 0) return true;
  return locs.some((l) => npStates.has(l));
}