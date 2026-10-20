const SPREADSHEET_ID = "1A8mIArlQiqcvnIgRGYgSiU5WDF2ClbGYe0XOHiyOciU";
const SHEET_GID = "180119124";
const DEFAULT_WEBHOOK = "https://script.google.com/macros/s/AKfycbzYaVf1-1iWrUVNZZkvNwPH1TvNqEqS7EYqu2goz-gNTO7tw5ZvKVPXz-HIZB6jrHiB/exec";
export const config = { api: { bodyParser: { sizeLimit: "4mb" } } };

function parseCsv(text) {
  const rows = []; let row = []; let value = ""; let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"' && quoted && text[i + 1] === '"') { value += '"'; i++; }
    else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) { row.push(value); value = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(value); if (row.some(cell => cell !== "")) rows.push(row); row = []; value = "";
    } else value += char;
  }
  if (value || row.length) { row.push(value); rows.push(row); }
  return rows;
}

function measurement(value) {
  const match = String(value || '').match(/-?\d+(?:[.,]\d+)?/);
  return match ? match[0].replace(',', '.') : '';
}

function normalizeInventoryRow(tree) {
  const reference = String(tree.Referencia || '');
  return {
    ...tree,
    DAP: tree.DAP || measurement(tree.Tronco),
    Altura: tree.Altura || measurement(tree.Porte),
    'Protocolo Vistoria': tree['Protocolo Vistoria'] || (reference.match(/Vistoria\s+(.+?)\s+·/i)?.[1] || '')
  };
}

async function readInventory() {
  // Columns AC:AG contain multi-megabyte base64 photos. Inventory matching and
  // write verification only need A:AB; excluding photos keeps sync under the
  // serverless timeout while the originals remain preserved in the sheet.
  const url = "https://docs.google.com/spreadsheets/d/" + SPREADSHEET_ID + "/gviz/tq?tqx=out:csv&gid=" + SHEET_GID + "&range=A:AB&_=" + Date.now();
  const upstream = await fetch(url, { redirect: "follow", cache: "no-store" });
  if (!upstream.ok) throw new Error("Planilha do Inventário respondeu HTTP " + upstream.status);
  const rows = parseCsv(await upstream.text());
  const headers = rows.shift() || [];
  return rows.map(row => normalizeInventoryRow(Object.fromEntries(headers.map((header, index) => [header, row[index] || ""]))))
    .filter(tree => String(tree.ID || "").trim());
}

export default async function handler(req, res) {
  const webhook = process.env.INVENTORY_WEBHOOK_URL || DEFAULT_WEBHOOK;
  if (req.method === "GET") {
    try {
      const trees = await readInventory();
      res.setHeader("Cache-Control", "no-store");
      return res.status(200).json({ ok: true, status: "ok", trees });
    } catch (error) {
      return res.status(502).json({ ok: false, error: error.message });
    }
  }
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Método não permitido" });
  try {
    const body = JSON.parse(JSON.stringify(req.body || {}));
    let duplicateMatched = false;
    if (body.action === "create" && body.data) {
      const reference = String(body.data.referencia || "").trim();
      const protocol = String(body.data.protocoloVistoria || "").trim();
      if (reference || protocol) {
        try {
          const current = await readInventory();
          const match = current.find(tree =>
            (reference && String(tree.Referencia || "").trim() === reference) ||
            (protocol && String(tree["Protocolo Vistoria"] || "").trim() === protocol)
          );
          if (match?.ID) {
            body.action = "update";
            body.id = match.ID;
            body.data.id = match.ID;
            duplicateMatched = true;
          }
        } catch (preflightError) {
          console.warn("[inventory] Não foi possível verificar duplicidade:", preflightError.message);
        }
      }
    }

    const capabilityResponse = await fetch(webhook + "?action=capabilities&_=" + Date.now(), { redirect: "follow", cache: "no-store" });
    const capability = await capabilityResponse.json();
    if (!Number(capability.apiVersion || 0)) capability.apiVersion = 2;
    if (Number(capability.apiVersion || 0) < 2) {
      return res.status(409).json({ ok: false, error: "Atualize e publique o Apps Script do Inventário (versão 2) para salvar fotos, DAP, altura e coordenadas." });
    }
    const upstream = await fetch(webhook, {
      method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(body), redirect: "follow"
    });
    const result = await upstream.json();
    if (duplicateMatched && !result.id) result.id = body.id;
    if (duplicateMatched) result.duplicateMatched = true;

    const upstreamSucceeded = upstream.ok && (result.ok || result.status === "ok" || result.success);
    if (upstreamSucceeded && body.data) {
      const current = await readInventory();
      const savedId = String(result.id || body.id || body.data.id || '').trim();
      const reference = String(body.data.referencia || '').trim();
      const saved = current.find(tree =>
        (savedId && String(tree.ID || '').trim() === savedId) ||
        (reference && String(tree.Referencia || '').trim() === reference)
      );
      if (!saved) return res.status(502).json({ ok: false, error: 'O inventário respondeu, mas o registro não apareceu na planilha.' });

      const mismatches = [];
      const expectedDap = measurement(body.data.dap);
      const expectedHeight = measurement(body.data.altura);
      const expectedNote = String(body.data.observacoes || '').trim();
      if (expectedDap && measurement(saved.DAP || saved.Tronco) !== expectedDap) mismatches.push('DAP');
      if (expectedHeight && measurement(saved.Altura || saved.Porte) !== expectedHeight) mismatches.push('altura');
      if (expectedNote && String(saved.Observacoes || saved['Observações'] || '').trim() !== expectedNote) mismatches.push('observação');
      if (mismatches.length) {
        return res.status(502).json({ ok: false, error: 'A planilha não confirmou: ' + mismatches.join(', ') + '. O envio continuará pendente no aparelho.' });
      }
      result.verified = true;
    }
    return res.status(upstreamSucceeded ? 200 : 502).json(result);
  } catch (error) {
    return res.status(502).json({ ok: false, error: error.message });
  }
}