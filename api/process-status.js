const DEFAULT_WEBHOOK = "https://script.google.com/macros/s/AKfycbwdoB7nNc4LwAL-Gkk5z93FUPGmtLDSuoLuNBu4jL6K01N8szSH1rpF94Kvuk_Vgf0/exec";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Método não permitido" });
  const protocolo = String(req.body?.protocolo || "").trim();
  const requestedStatus = String(req.body?.situacao || "").trim();
  // A validação da planilha usa este texto exato. Aceite também o rótulo antigo
  // para que uma aba ainda em cache não volte a enviar um valor inválido.
  const situacao = requestedStatus === "Enviado para Deliberação do CODEMA"
    ? "Enviado para Deliberação CODEMA"
    : requestedStatus;
  const allowedStatuses = new Set(["Aguardando Vistoria", "Parecer em Elaboração", "Enviado para Deliberação CODEMA", "Encaminhado para Corte pela Secretaria de Obras", "Encaminhado para a Secretaria de Planejamento", "Aguardando Compensação", "Compensado", "Indeferido", "Arquivado"]);
  if (!protocolo || !situacao) return res.status(400).json({ ok: false, error: "Protocolo e situação são obrigatórios" });
  if (!allowedStatuses.has(situacao)) return res.status(400).json({ ok: false, error: "Andamento inválido para a planilha" });

  try {
    const target = process.env.SHEETS_WEBHOOK_URL || DEFAULT_WEBHOOK;
    const capabilityResponse = await fetch(`${target}?action=capabilities&_=${Date.now()}`, { redirect: "follow", cache: "no-store" });
    const capability = await capabilityResponse.json();
    if (Number(capability.apiVersion || 0) < 8) {
      return res.status(409).json({
        ok: false,
        error: "Atualize e publique o Google Apps Script da Vistoria (versão 8) antes de alterar situações."
      });
    }

    const upstream = await fetch(target, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "updateStatus",
        protocolo,
        situacao,
        compensacao: String(req.body?.compensacao || ""),
        formaCompensacao: String(req.body?.formaCompensacao || ""),
        formaCompensacaoLabel: String(req.body?.formaCompensacaoLabel || ""),
        dataCompensacao: String(req.body?.dataCompensacao || ""),
        dataEncaminhamento: String(req.body?.dataEncaminhamento || ""),
        process: null
      }),
      redirect: "follow"
    });
    const data = await upstream.json();
    return res.status(upstream.ok && data.ok ? 200 : 502).json(data);
  } catch (error) {
    return res.status(502).json({ ok: false, error: error.message });
  }
}
