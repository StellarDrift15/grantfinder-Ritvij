import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const GLOBAL_SCOPE = "global";

export default Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    let body = {};
    try {
      body = await req.json();
    } catch (_e) {
      body = {};
    }
    const action = body.action || "read";

    const svc = base44.asServiceRole;

    // Ensure the single global counter record exists.
    let rows = await svc.entities.UsageStat.filter({ scope: GLOBAL_SCOPE });
    if (!rows || rows.length === 0) {
      rows = [await svc.entities.UsageStat.create({
        scope: GLOBAL_SCOPE,
        grants_clicked: 0,
        rewrites_generated: 0,
      })];
    }

    if (action === "track") {
      const event = body.event;
      const inc = {};
      if (event === "grant_click") inc.grants_clicked = 1;
      else if (event === "rewrite") inc.rewrites_generated = 1;
      else return Response.json({ error: "Unknown event" }, { status: 400 });

      await svc.entities.UsageStat.updateMany({ scope: GLOBAL_SCOPE }, { $inc: inc });
      const fresh = await svc.entities.UsageStat.filter({ scope: GLOBAL_SCOPE });
      const row = (fresh && fresh[0]) || rows[0];
      return Response.json({
        grants_clicked: row.grants_clicked || 0,
        rewrites_generated: row.rewrites_generated || 0,
      });
    }

    // default: read
    const row = (rows && rows[0]) || { grants_clicked: 0, rewrites_generated: 0 };
    return Response.json({
      grants_clicked: row.grants_clicked || 0,
      rewrites_generated: row.rewrites_generated || 0,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});