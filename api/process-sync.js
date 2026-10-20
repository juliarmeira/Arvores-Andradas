import { parseCsv, processFromRow } from "./processes.js";

const DEFAULT_WEBHOOK = "https://script.google.com/macros/s/AKfycbwdoB7nNc4LwAL-Gkk5z93FUPGmtLDSuoLuNBu4jL6K01N8szSH1rpF94Kvuk_Vgf0/exec";
const SPREADSHEET_ID = "1f03SZqhFe4AbSd-Z4kg_MgBzDxg9ES-nzgLAiZfLDNU";
export const config = { api: { bodyParser: { sizeLimit: "4mb" } } };

const processRank = process => {
  const trees = Array.isArray(process?.trees) ? process.trees : [];
  const meaningfulTree = trees.some(tree =>
    tree?.popular || tree?.cientifico || tree?.dap || tree?.altura ||
    Object.values(tree?.photos || {}).some(Boolean) ||
    (Number(tree?.latitude) && Number(tree?.longitude))
  );
  if (process?.parecerTexto || process?.diagnostico || process?.conclusao) return 3;
  if (process?.vistoriaInLoco || process?.dataVistoria || meaningfulTree) return 2;
  return 1;
};

const timestamp = value => {
  const number = Date.parse(String(value || ""));
  return Number.isFinite(number) ? number : 0;
};

async function currentRemoteProcess(protocol) {
  const url = "https://docs.google.com/spreadsheets/d/" + SPREADSHEET_ID + "/export?format=csv&gid=0&_=" + Date.now();
  const response = await fetch(url, { redirect: "follow", cache: "no-store" });
  if (!response.ok) return null;
  const rows = parseCsv(await response.text());
  const headers = rows[0] || [];
  let found = null;
  rows.slice(1).forEach((row, index) => {
    const process = processFromRow(row, index, headers);
    if (process.protocolo === protocol) found = process;
  });
  return found;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Método não permitido" });
  const target = process.env.SHEETS_WEBHOOK_URL || DEFAULT_WEBHOOK;
  const body = req.body || {};
  const incoming = body.process || {};
  const protocol = String(incoming.protocolo || body.protocolo || "").trim();

  try {
    if (body.action === "upsertProcess" && protocol) {
      try {
        const remote = await currentRemoteProcess(protocol);
        const remoteRank = processRank(remote);
        const incomingRank = processRank(incoming);
        const remoteTime = timestamp(remote?.updatedAt);
        const incomingTime = timestamp(incoming?.updatedAt);
        const staleStage = remote && remoteRank > incomingRank;
        const staleTime = remote && remoteRank === incomingRank && remoteTime && incomingTime && remoteTime > incomingTime;
        if (staleStage || staleTime) {
          return res.status(200).json({
            ok: true,
            skipped: true,
            reason: staleStage ? "remote-stage-newer" : "remote-edit-newer",
            process: remote
          });
        }
      } catch (preflightError) {
        console.warn("[process-sync] Não foi possível comparar a versão remota:", preflightError.message);
      }
    }

    const capabilityResponse = await fetch(target + "?action=capabilities&_=" + Date.now(), { redirect: "follow", cache: "no-store" });
    const capability = await capabilityResponse.json();
    if (Number(capability.apiVersion || 0) < 8) {
      return res.status(409).json({ ok: false, error: "Atualize e publique o Apps Script da planilha de Processos (versão 8 ou superior)." });
    }
    const upstream = await fetch(target, {
      method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(body), redirect: "follow"
    });
    const result = await upstream.json();
    return res.status(upstream.ok && result.ok ? 200 : 502).json(result);
  } catch (error) {
    return res.status(502).json({ ok: false, error: error.message });
  }
}
