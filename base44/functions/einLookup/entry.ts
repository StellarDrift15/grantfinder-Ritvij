import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    let body = {};
    try { body = await req.json(); } catch { /* no body */ }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const ein = String(body.ein || '').replace(/[^0-9]/g, '');
    if (ein.length !== 9) {
      return Response.json({ error: 'Enter a valid 9-digit EIN.' }, { status: 400 });
    }

    const res = await fetch(`https://projects.propublica.org/nonprofits/api/v2/organizations/${ein}.json`, {
      headers: { 'Accept': 'application/json' },
    });
    if (res.status === 404) {
      return Response.json({ error: 'No organization found for that EIN.' }, { status: 404 });
    }
    if (!res.ok) {
      return Response.json({ error: 'Lookup service unavailable. Please try again.' }, { status: 502 });
    }

    const data = await res.json();
    // ProPublica returns 200 with an "error" field when the org isn't found
    if (data.error || !data.organization) {
      return Response.json({ error: 'No organization found for that EIN.' }, { status: 404 });
    }

    const org = data.organization;
    const locationParts = [org.city, org.state].filter(Boolean);
    const is501c3 = org.subsection_code === 3;

    return Response.json({
      name: org.name || '',
      ein: String(org.ein || ein),
      location: locationParts.length ? locationParts.join(', ') : '',
      is_501c3: is501c3,
      tax_status: is501c3 ? '501(c)(3) — Tax-deductible' : 'Not a 501(c)(3)',
    });
  } catch (error) {
    return Response.json({ error: error.message || 'Lookup failed.' }, { status: 500 });
  }
});