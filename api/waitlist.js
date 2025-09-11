// Vercel Serverless Function (Node.js CommonJS)
// - Parseo manual del body (no Next.js)
// - Reenvío opcional a Google Apps Script (Sheets) con token en la URL

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    return res.json({ ok: false, error: 'Method Not Allowed' });
  }

  try {
    const body = await readJson(req);
    const { name, email, note, source } = body || {};

    if (!name || !email) {
      res.statusCode = 400;
      return res.json({ ok: false, error: 'Faltan campos' });
    }

    const payload = { name, email, note, source, at: new Date().toISOString() };
    console.log('[waitlist]', payload);

    // Reenvío a Google Sheets (Apps Script) si está configurado
    if (process.env.WEBHOOK_URL) {
      const url = `${process.env.WEBHOOK_URL}?token=${encodeURIComponent(process.env.WEBHOOK_TOKEN || '')}`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const txt = await resp.text().catch(() => '');
      console.log('[webhook]', resp.status, txt);
    } else {
      console.warn('WEBHOOK_URL no definido; no se envía a Sheets');
    }

    res.statusCode = 200;
    return res.json({ ok: true });
  } catch (err) {
    console.error('waitlist error', err);
    res.statusCode = 500;
    return res.json({ ok: false });
  }
};

// Utilidad: leer y parsear JSON del body en funciones Node puras
function readJson(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => (data += chunk));
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}); }
      catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}
