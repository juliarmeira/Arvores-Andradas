const DEFAULT_WEBHOOK = "https://script.google.com/macros/s/AKfycbwdoB7nNc4LwAL-Gkk5z93FUPGmtLDSuoLuNBu4jL6K01N8szSH1rpF94Kvuk_Vgf0/exec";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Método não permitido" });
  const protocolo = String(req.body?.protocolo || "").trim();
  const situacao = String(req.body?.situacao || "").trim();
  const allowedStatuses = new Set(["Aguardando Vistoria", "Parecer em Elaboração", "Enviado para Deliberação do CODEMA", "Encaminhado para Corte pela Secretaria de Obras", "Aguardando Compensação", "Compensado", "Indeferido / Arquivado"]);
  if (!protocolo || !situacao) return res.status(400).json({ ok: false, error: "Protocolo e situação são obrigatórios" });
  if (!allowedStatuses.has(situacao)) return res.status(400).json({ ok: false, error: "Andamento inválido para a planilha" });

  try {
    const target = process.env.SHEETS_WEBHOOK_URL || DEFAULT_WEBHOOK;
    const capabilityResponse = await fetch(`${target}?action=capabilities&_=${Date.now()}`, { redirect: "follow", cache: "no-store" });
    const capability = await capabilityResponse.json();
    if (Number(capability.apiVersion || 0) < 2) {
      return res.status(409).json({
        ok: false,
        error: "Atualize e publique novamente o Google Apps Script da Vistoria antes de alterar situações."
      });
    }

    const upstream = await fetch(target, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "updateStatus",
        protocolo,
        situacao,
        compensacao: String(req.body?.compensacao || "")
      }),
      redirect: "follow"
    });
    const data = await upstream.json();
    return res.status(upstream.ok && data.ok ? 200 : 502).json(data);
  } catch (error) {
    return res.status(502).json({ ok: false, error: error.message });
  }
}