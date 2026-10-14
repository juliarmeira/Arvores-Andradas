const DEFAULT_WEBHOOK = 'https://script.google.com/macros/s/AKfycbwdoB7nNc4LwAL-Gkk5z93FUPGmtLDSuoLuNBu4jL6K01N8szSH1rpF94Kvuk_Vgf0/exec';
export const config = { api: { bodyParser: { sizeLimit: '4mb' } } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Método não permitido' });
  const target = process.env.SHEETS_WEBHOOK_URL || DEFAULT_WEBHOOK;
  try {
    const capabilityResponse = await fetch(`${target}?action=capabilities&_=${Date.now()}`, { redirect: 'follow', cache: 'no-store' });
    const capability = await capabilityResponse.json();
    if (Number(capability.apiVersion || 0) < 7) {
      return res.status(409).json({ ok: false, error: 'Atualize e publique o Apps Script da planilha de Processos (versão 7) para sincronizar fiscais, datas e detalhes da vistoria.' });
    }
    const upstream = await fetch(target, {
      method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(req.body || {}), redirect: 'follow'
    });
    const result = await upstream.json();
    return res.status(upstream.ok && result.ok ? 200 : 502).json(result);
  } catch (error) {
    return res.status(502).json({ ok: false, error: error.message });
  }
}
