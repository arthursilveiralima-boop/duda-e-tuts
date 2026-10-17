const { put } = require('@vercel/blob');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch { b = {}; } }
  const nome = String((b && b.nome) || '').trim().slice(0, 80);
  if (!nome) return res.status(400).json({ error: 'nome' });
  const n = v => Math.max(0, Math.min(20, parseInt(v, 10) || 0));
  const vai = b.vai !== false;
  const entry = { nome, vai, adultos: vai ? n(b.adultos) : 0, criancas: vai ? n(b.criancas) : 0, em: new Date().toISOString() };
  await put(`rsvps/${Date.now()}.json`, JSON.stringify(entry), {
    access: 'public', addRandomSuffix: true, contentType: 'application/json'
  });
  res.status(200).json({ ok: true });
};
