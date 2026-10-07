const DEFAULT_WEBHOOK = "https://script.google.com/macros/s/AKfycbwdoB7nNc4LwAL-Gkk5z93FUPGmtLDSuoLuNBu4jL6K01N8szSH1rpF94Kvuk_Vgf0/exec";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Método não permitido" });
  try {
    const target = process.env.SHEETS_WEBHOOK_URL || DEFAULT_WEBHOOK;
    const upstream = await fetch(target, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(req.body?.payload || {}),
      redirect: "follow"
    });
    const text = await upstream.text();
    try { return res.status(upstream.ok ? 200 : 502).json(JSON.parse(text)); }
    catch { return res.status(502).json({ ok: false, error: "Resposta inválida do Google Apps Script" }); }
  } catch (error) {
    return res.status(502).json({ ok: false, error: error.message });
  }
}