const SPREADSHEET_ID = "1f03SZqhFe4AbSd-Z4kg_MgBzDxg9ES-nzgLAiZfLDNU";

export const parseCsv = (text) => {
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
};

const brDateToIso = (value) => {
  const match = String(value || "").trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  return match ? match[3] + "-" + match[2].padStart(2, "0") + "-" + match[1].padStart(2, "0") : String(value || "");
};

export const coordinateFromCell = (value, maxAbsolute) => {
  const original = String(value == null ? "" : value).trim();
  if (!original) return "";
  let candidate = original.replace(/\s+/g, "");
  if (candidate.includes(",")) {
    candidate = candidate.includes(".")
      ? candidate.replace(/\./g, "").replace(",", ".")
      : candidate.replace(",", ".");
  } else if ((candidate.match(/\./g) || []).length > 1) {
    const parts = candidate.split(".");
    candidate = parts.shift() + "." + parts.join("");
  }
  let number = Number(candidate);
  if (!Number.isFinite(number)) return original;
  while (Math.abs(number) > maxAbsolute && Math.abs(number) >= 10) number /= 10;
  return Math.abs(number) <= maxAbsolute ? String(number) : original;
};

const headerIndex = (headers, name, fallback = -1) => {
  const normalize = value => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
  const index = headers.findIndex(header => normalize(header) === normalize(name));
  return index >= 0 ? index : fallback;
};

export const processDetailsFromRow = (row, headers = []) => {
  // API v6 stores JSON in P:S; v7 adds Fiscal in P and stores JSON in Q:T.
  const configuredPositions = [1, 2, 3, 4]
    .map(part => headerIndex(headers, "Dados da Vistoria " + part, -1));
  if (configuredPositions[0] >= 0) {
    const configuredRaw = configuredPositions.map(position => position >= 0 ? row[position] || "" : "").join("");
    if (configuredRaw.trim().startsWith("{")) {
      try { return JSON.parse(configuredRaw); } catch {}
    }
  }
  const starts = [15, 16];
  for (const start of starts) {
    const raw = row.slice(start, start + 4).join("");
    if (!raw.trim().startsWith("{")) continue;
    try { return JSON.parse(raw); } catch {}
  }
  return {};
};

export const processFromRow = (row, index, headers = []) => {
  const protocolPosition = headerIndex(headers, "Protocolo", 1);
  const protocolo = String(row[protocolPosition] || "").trim();
  const details = processDetailsFromRow(row, headers);
  const cell = (name, fallback = -1) => {
    const position = headerIndex(headers, name, fallback);
    return position >= 0 ? String(row[position] || "") : "";
  };
  const base = {
    id: "SHEET-" + (index + 2) + "-" + protocolo,
    protocolo,
    data: brDateToIso(cell("Data", 0)),
    requerente: cell("Solicitante", 2),
    telefone: cell("Telefone"),
    endereco: cell("Endereço", 5),
    solicitacaoRequerente: cell("Solicitação", 4),
    intervencao: cell("Solicitação", 4),
    intervencaoLabel: cell("Solicitação", 4),
    situacao: (() => {
      const named = cell("Situação").trim();
      if (named) return named;
      const saved = String(details.situacao || "").trim();
      if (saved) return saved;
      const allowed = new Set(["Aguardando Vistoria", "Parecer em Elaboração", "Enviado para Deliberação do CODEMA", "Encaminhado para Corte pela Secretaria de Obras", "Aguardando Compensação", "Encaminhado para a Secretaria de Planejamento", "Compensado", "Indeferido", "Arquivado"]);
      return [row[14], row[15]].map(value => String(value || "").trim()).find(value => allowed.has(value)) || "Aguardando Vistoria";
    })(),
    coordenadas: {
      lat: coordinateFromCell(cell("Coordenada 1 Corte", 6), 90),
      lng: coordinateFromCell(cell("Coordenada 2 Corte", 7), 180)
    },
    responsavelCorte: cell("Responsável Corte", 8),
    autorizacao: cell("Autorização", 9),
    dataAutorizacao: brDateToIso(cell("Data da Autorização", 10)),
    compensacao: cell("Compensação", 11),
    fiscalNome: cell("Fiscal") || String(details.fiscalNome || ""),
    formaCompensacaoLabel: cell("Forma de Compensação", 20),
    prazo: brDateToIso(cell("Prazo", 12)),
    coordComp1: cell("Coordenada 1 Comp.", 13),
    coordComp2: cell("Coordenada 2 Comp.", 14),
    parecerTexto: ""
  };
  return {
    ...base,
    ...details,
    id: details.id || base.id,
    protocolo,
    requerente: base.requerente || details.requerente || "",
    telefone: base.telefone || details.telefone || "",
    endereco: base.endereco || details.endereco || "",
    solicitacaoRequerente: base.solicitacaoRequerente || details.solicitacaoRequerente || "",
    situacao: base.situacao,
    coordenadas: details.coordenadas || base.coordenadas,
    syncStatus: "synced"
  };
};

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ ok: false, error: "Método não permitido" });
  try {
    const url = "https://docs.google.com/spreadsheets/d/" + SPREADSHEET_ID + "/export?format=csv&gid=0&_=" + Date.now();
    const upstream = await fetch(url, { redirect: "follow", cache: "no-store" });
    if (!upstream.ok) return res.status(502).json({ ok: false, error: "Planilha respondeu HTTP " + upstream.status });
    const rows = parseCsv(await upstream.text());
    const headers = rows[0] || [];
    const byProtocol = new Map();
    rows.slice(1).forEach((row, index) => {
      const process = processFromRow(row, index, headers);
      if (!process.protocolo) return;
      byProtocol.set(process.protocolo, process);
    });
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ ok: true, processes: [...byProtocol.values()] });
  } catch (error) {
    return res.status(502).json({ ok: false, error: "Falha ao consultar a planilha: " + error.message });
  }
}
