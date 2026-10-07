const DEFAULT_WEBHOOK = "https://script.google.com/macros/s/AKfycbwdoB7nNc4LwAL-Gkk5z93FUPGmtLDSuoLuNBu4jL6K01N8szSH1rpF94Kvuk_Vgf0/exec";

export default function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Método não permitido" });
  return res.status(200).json({
    plantnetConfigured: Boolean(process.env.PLANTNET_API_KEY),
    key: "",
    sheetsWebhookUrl: process.env.SHEETS_WEBHOOK_URL || DEFAULT_WEBHOOK
  });
}