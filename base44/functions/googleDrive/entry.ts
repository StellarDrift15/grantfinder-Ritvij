import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');

    const { query = '', pageSize = 20 } = await req.json().catch(() => ({}));

    let url = `https://www.googleapis.com/drive/v3/files?pageSize=${pageSize}&fields=files(id,name,mimeType,modifiedTime,size,webViewLink)`;
    if (query) url += `&q=${encodeURIComponent(query)}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      const err = await res.json();
      return Response.json({ error: err.error?.message || 'Google Drive API error', status: res.status }, { status: res.status });
    }

    const data = await res.json();
    return Response.json({ files: data.files || [] });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});