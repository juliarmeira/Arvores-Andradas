const SPREADSHEET_ID = '1A8mIArlQiqcvnIgRGYgSiU5WDF2ClbGYe0XOHiyOciU';
const SHEET_GID = '180119124';
const DEFAULT_WEBHOOK = 'https://script.google.com/macros/s/AKfycbzYaVf1-1iWrUVNZZkvNwPH1TvNqEqS7EYqu2goz-gNTO7tw5ZvKVPXz-HIZB6jrHiB/exec';
export const config = { api: { bodyParser: { sizeLimit: '4mb' } } };

function parseCsv(text) {
  const rows = []; let row = []; let value = ''; let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"' && quoted && text[i + 1] === '"') { value += '"'; i++; }
    else if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) { row.push(value); value = ''; }
    else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[i + 1] === '\n') i++;
      row.push(value); if (row.some(cell => cell !== '')) rows.push(row); row = []; value = '';
    } else value += char;
  }
  if (value || row.length) { row.push(value); rows.push(row); }
  return rows;
}

export default async function handler(req, res) {
  const webhook = process.env.INVENTORY_WEBHOOK_URL || DEFAULT_WEBHOOK;
  if (req.method === 'GET') {
    try {
      const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&gid=${SHEET_GID}&_=${Date.now()}`;
      const upstream = await fetch(url, { redirect: 'follow', cache: 'no-store' });
      if (!upstream.ok) return res.status(502).json({ ok: false, error: `Planilha do Inventário respondeu HTTP ${upstream.status}` });
      const rows = parseCsv(await upstream.text());
      const headers = rows.shift() || [];
      const trees = rows.map(row => Object.fromEntries(headers.map((header, index) => [header, row[index] || '']))).filter(tree => String(tree.ID || '').trim());
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).json({ ok: true, status: 'ok', trees });
    } catch (error) {
      return res.status(502).json({ ok: false, error: error.message });
    }
  }
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Método não permitido' });
  try {
    const capabilityResponse = await fetch(`${webhook}?action=capabilities&_=${Date.now()}`, { redirect: 'follow', cache: 'no-store' });
    const capability = await capabilityResponse.json();
    if (Number(capability.apiVersion || 0) < 2) {
      return res.status(409).json({ ok: false, error: 'Atualize e publique o Apps Script do Inventário (versão 2) para salvar fotos, DAP, altura e coordenadas.' });
    }
    const upstream = await fetch(webhook, {
      method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(req.body || {}), redirect: 'follow'
    });
    const result = await upstream.json();
    return res.status(upstream.ok && (result.ok || result.status === 'ok' || result.success) ? 200 : 502).json(result);
  } catch (error) {
    return res.status(502).json({ ok: false, error: error.message });
  }
}
