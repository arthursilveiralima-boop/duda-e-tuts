const { list } = require('@vercel/blob');

const KEY = 'naB2JnHcThhV';
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

module.exports = async (req, res) => {
  if ((req.query && req.query.k) !== KEY) return res.status(404).send('Not found');
  const blobs = [];
  let cursor;
  do {
    const r = await list({ prefix: 'rsvps/', cursor, limit: 1000 });
    blobs.push(...r.blobs);
    cursor = r.hasMore ? r.cursor : undefined;
  } while (cursor);

  const all = (await Promise.all(blobs.map(b => fetch(b.url, { cache: 'no-store' }).then(r => r.json()).catch(() => null)))).filter(Boolean);
  all.sort((a, b) => a.em.localeCompare(b.em));
  const byName = new Map();
  for (const e of all) byName.set(e.nome.toLowerCase().replace(/\s+/g, ' '), e);
  const rows = [...byName.values()].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  const sim = rows.filter(r => r.vai), nao = rows.filter(r => !r.vai);
  const adultos = sim.reduce((s, r) => s + 1 + r.adultos, 0);
  const criancas = sim.reduce((s, r) => s + r.criancas, 0);
  const fmt = iso => new Date(iso).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.send(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Confirmados · Duda e Tuts</title>
<style>body{margin:0;padding:24px 16px;font:15px/1.5 -apple-system,Helvetica,Arial,sans-serif;color:#1f2a37;background:#eef0eb}main{max-width:640px;margin:0 auto}h1{font-weight:500;font-size:20px;margin:0 0 16px}.tot{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:24px}.tot div{background:#fbfbf8;border:1px solid #d9dcd4;padding:12px}.tot b{display:block;font-size:26px;font-weight:500;font-variant-numeric:tabular-nums}.tot span{font-size:12px;color:#6b7380}table{width:100%;border-collapse:collapse;background:#fbfbf8;border:1px solid #d9dcd4;font-variant-numeric:tabular-nums}th,td{text-align:left;padding:8px 10px;border-bottom:1px solid #e6e8e2}th{font-size:12px;color:#6b7380;font-weight:500}td.n{text-align:center}h2{font-size:14px;font-weight:500;margin:24px 0 8px;color:#6b7380}.wrap{overflow-x:auto}</style></head><body><main>
<h1>Confirmados</h1>
<div class="tot"><div><b>${adultos + criancas}</b><span>pessoas no total</span></div><div><b>${adultos}</b><span>adultos</span></div><div><b>${criancas}</b><span>crianças</span></div></div>
<div class="wrap"><table><thead><tr><th>Nome</th><th>+ Adultos</th><th>Crianças</th><th>Respondeu</th></tr></thead><tbody>
${sim.map(r => `<tr><td>${esc(r.nome)}</td><td class="n">${r.adultos}</td><td class="n">${r.criancas}</td><td>${fmt(r.em)}</td></tr>`).join('') || '<tr><td colspan="4">Nenhuma confirmação ainda.</td></tr>'}
</tbody></table></div>
${nao.length ? `<h2>Não vão (${nao.length})</h2><div class="wrap"><table><tbody>${nao.map(r => `<tr><td>${esc(r.nome)}</td><td>${fmt(r.em)}</td></tr>`).join('')}</tbody></table></div>` : ''}
</main></body></html>`);
};
