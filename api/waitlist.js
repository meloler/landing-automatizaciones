// Función Node.js para Vercel (CommonJS + parseo manual de body)
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

    console.log('[waitlist]', { name, email, note, source, at: new Date().toISOString() });

    // Opcional: reenviar a un webhook (Apps Script → Sheets)
    if (process.env.WEBHOOK_URL) {
      await fetch(process.env.WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, note, source, at: new Date().toISOString() })
      });
    }

    res.statusCode = 200;
    return res.json({ ok: true });
  } catch (err) {
    console.error('waitlist error', err);
    res.statusCode = 500;
    return res.json({ ok: false });
  }
};

// Lee el body y lo parsea a JSON
function readJson(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => (data += chunk));
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}
