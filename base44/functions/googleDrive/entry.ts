import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');
    const body = await req.json().catch(() => ({}));
    const { action = 'list', fileId, pageSize = 30 } = body;

    if (action === 'list') {
      // List spreadsheets only
      const q = encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
      const url = `https://www.googleapis.com/drive/v3/files?pageSize=${pageSize}&q=${q}&fields=files(id,name,modifiedTime,webViewLink)`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
      if (!res.ok) {
        const err = await res.json();
        return Response.json({ error: err.error?.message || 'Drive API error' }, { status: res.status });
      }
      const data = await res.json();
      return Response.json({ files: data.files || [] });
    }

    if (action === 'export' && fileId) {
      // Export spreadsheet as CSV
      const url = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text%2Fcsv`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
      if (!res.ok) {
        const err = await res.text();
        return Response.json({ error: 'Failed to export file: ' + err }, { status: res.status });
      }
      const csvText = await res.text();

      // Parse CSV into rows
      const lines = csvText.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase().replace(/\s+/g, '_'));
      const rows = lines.slice(1).map(line => {
        const values = line.match(/(".*?"|[^,]+)(?=,|$)/g) || [];
        const obj = {};
        headers.forEach((h, i) => {
          obj[h] = (values[i] || '').trim().replace(/^"|"$/g, '');
        });
        return obj;
      });

      // Map to FundingOpportunities schema
      const mapped = rows
        .filter(r => r.title || r.grant_title || r.name)
        .map(r => ({
          title: r.title || r.grant_title || r.name || 'Untitled',
          provider_name: r.provider_name || r.provider || r.funder || r.organization || '',
          type: ['Cash Grant', 'Store Credit', 'Material Sponsorship'].includes(r.type) ? r.type : 'Cash Grant',
          value_amount: parseFloat(r.value_amount || r.amount || r.award_amount || 0) || 0,
          deadline: r.deadline || r.due_date || null,
          accepts_robotics_teams: r.accepts_robotics_teams === 'true' || r.accepts_robotics_teams === 'TRUE' || r.robotics === 'true',
          target_sectors: r.target_sectors ? r.target_sectors.split(';').map(s => s.trim()).filter(Boolean) : [],
          application_url: r.application_url || r.url || r.link || '',
          description: r.description || r.notes || '',
        }));

      return Response.json({ rows: mapped, count: mapped.length });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});