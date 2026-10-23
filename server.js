import http from "node:http";
import { readFile, stat, writeFile } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";

const root = process.cwd();
const port = Number(process.env.PORT) || 4178;
const VISTORIA_SPREADSHEET_ID = "1f03SZqhFe4AbSd-Z4kg_MgBzDxg9ES-nzgLAiZfLDNU";
const INVENTORY_SPREADSHEET_ID = "1A8mIArlQiqcvnIgRGYgSiU5WDF2ClbGYe0XOHiyOciU";
const INVENTORY_SHEET_GID = "180119124";
const DEFAULT_INVENTORY_WEBHOOK = "https://script.google.com/macros/s/AKfycbzYaVf1-1iWrUVNZZkvNwPH1TvNqEqS7EYqu2goz-gNTO7tw5ZvKVPXz-HIZB6jrHiB/exec";
const DEFAULT_VISTORIA_WEBHOOK = "https://script.google.com/macros/s/AKfycbwdoB7nNc4LwAL-Gkk5z93FUPGmtLDSuoLuNBu4jL6K01N8szSH1rpF94Kvuk_Vgf0/exec";
const WATER_SPREADSHEET_ID = "1BDuNmB5umdQLre8bDE-Ltuk0WCnl9pLT5kYYmFmzW6Y";
const geocodeCache = new Map();
const DEFAULT_WATER_WEBHOOK = "https://script.google.com/macros/s/AKfycbxKCAT7elYq-msoEF9vMPss9TOdu7jlW-ze8xUqUAMs_z4NZHI21psoD-GJEMJJv518/exec";
const PROCESS_MIN_API_VERSION = 8;
const WATER_MIN_API_VERSION = 3;

let localKey = "";
let sheetsWebhookUrl = "";
let waterWebhookUrl = "";
let inventoryWebhookUrl = "";
const localEnv = {};
for (const filename of [".env.local", ".env"]) {
  try {
    const cfg = await readFile(join(root, filename), "utf8");
    for (const line of cfg.split(/\r?\n/)) {
      const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (match && localEnv[match[1]] === undefined) localEnv[match[1]] = match[2].trim();
    }
  } catch {}
}
localKey = localEnv.PLANTNET_API_KEY || "";
sheetsWebhookUrl = localEnv.SHEETS_WEBHOOK_URL || "";
waterWebhookUrl = localEnv.WATER_SHEETS_WEBHOOK_URL || "";
inventoryWebhookUrl = localEnv.INVENTORY_WEBHOOK_URL || "";

const readJson = async (response, label) => {
  const text = await response.text();
  try { return JSON.parse(text); }
  catch { throw new Error(label + " respondeu em formato invalido (HTTP " + response.status + ")"); }
};

const updateEnvValue = (contents, key, value) => {
  const line = key + "=" + value;
  const pattern = new RegExp("^" + key + "=.*$", "m");
  if (pattern.test(contents)) return contents.replace(pattern, line);
  return contents.replace(/\s*$/, "") + "\n" + line + "\n";
};

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webmanifest": "application/manifest+json; charset=utf-8"
};

const json = (res, status, data) => {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "X-Content-Type-Options": "nosniff"
  });
  res.end(JSON.stringify(data));
};

const readBody = (req, limit = 2_000_000) =>
  new Promise((res, rej) => {
    const parts = [];
    let size = 0;
    req.on("data", c => {
      size += c.length;
      if (size > limit) {
        rej(new Error("Requisição excede o limite máximo permitido"));
        req.destroy();
      } else parts.push(c);
    });
    req.on("end", () => res(Buffer.concat(parts)));
    req.on("error", rej);
  });

const parseCsvLine = (line) => {
  const values = [];
  line.replace(/(?:^|,)("(?:[^"]|"")*"|[^,]*)/g, (_, cell) => {
    values.push(cell.startsWith('"') ? cell.slice(1, -1).replace(/""/g, '"') : cell);
    return "";
  });
  return values;
};

const parseCsv = (text) => {
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

const sheetHeaderIndex = (headers, name, fallback = -1) => {
  const normalizeHeader = value => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
  const index = headers.findIndex(header => normalizeHeader(header) === normalizeHeader(name));
  return index >= 0 ? index : fallback;
};

const normalizeSheetValue = value => String(value || "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .trim()
  .replace(/\s+/g, " ")
  .toUpperCase();

const verifyProcessStatusInSheet = async (protocolo, situacao) => {
  const url = `https://docs.google.com/spreadsheets/d/${VISTORIA_SPREADSHEET_ID}/export?format=csv&gid=0&_=${Date.now()}`;
  const response = await fetch(url, { redirect: "follow", cache: "no-store" });
  if (!response.ok) return false;
  const rows = parseCsv(await response.text());
  const headers = rows[0] || [];
  const protocolColumn = sheetHeaderIndex(headers, "Protocolo");
  const statusColumn = sheetHeaderIndex(headers, "Situação");
  if (protocolColumn < 0 || statusColumn < 0) return false;
  const protocolKey = normalizeSheetValue(protocolo).replace(/\s/g, "");
  for (let index = rows.length - 1; index > 0; index--) {
    if (normalizeSheetValue(rows[index][protocolColumn]).replace(/\s/g, "") !== protocolKey) continue;
    return normalizeSheetValue(rows[index][statusColumn]) === normalizeSheetValue(situacao);
  }
  return false;
};

const processDetailsFromSheetRow = (row, headers = []) => {
  const configuredPositions = [1, 2, 3, 4]
    .map(part => sheetHeaderIndex(headers, "Dados da Vistoria " + part, -1));
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
const coordinateFromSheetCell = (value, maxAbsolute) => {
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
const brDateToIso = (value) => {
  const text = String(value || "").trim();
  const match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) return `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
  const months = { janeiro: 1, fevereiro: 2, "março": 3, abril: 4, maio: 5, junho: 6, julho: 7, agosto: 8, setembro: 9, outubro: 10, novembro: 11, dezembro: 12 };
  const long = text.toLowerCase().match(/^(\d{1,2}) de ([a-zç]+) de (\d{4})$/);
  return long && months[long[2]] ? `${long[3]}-${String(months[long[2]]).padStart(2, "0")}-${long[1].padStart(2, "0")}` : text;
};
const isAllowedStatic = (relPath) => {
  if (!relPath || relPath.includes("..") || relPath.startsWith(".") || relPath.includes("/.")) {
    return false;
  }
  const clean = relPath.toLowerCase().replace(/\\/g, "/");
  if (clean === "index.html" || clean === "index.css" || clean === "index.js" || clean === "pending-map.js" || clean === "favicon.ico" || clean === "manifest.webmanifest" || clean === "app-icon.svg" || clean === "sw.js") {
    return true;
  }
  if (clean.startsWith("data/") && (clean.endsWith(".js") || clean.endsWith(".json"))) {
    return true;
  }
  return false;
};

const server = http.createServer(async (req, res) => {
  try {
    const u = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

    // ── GET /api/config ──────────────────────────────────────────────────────
    if (req.method === "GET" && u.pathname === "/api/config") {
      return json(res, 200, {
        plantnetConfigured: !!(process.env.PLANTNET_API_KEY || localKey),
        key: process.env.PLANTNET_API_KEY || localKey || "",
        sheetsWebhookUrl: process.env.SHEETS_WEBHOOK_URL || sheetsWebhookUrl || ""
      });
    }

    if (req.method === "GET" && u.pathname === "/api/geocode") {
      const address = String(u.searchParams.get("address") || "").trim();
      if (!address || address.length > 300) return json(res, 400, { ok: false, error: "Endereço inválido" });
      const key = address.toLowerCase();
      if (geocodeCache.has(key)) return json(res, 200, { ok: true, location: geocodeCache.get(key), cached: true });
      const searchUrl = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=br&q=${encodeURIComponent(address)}`;
      try {
        const upstream = await fetch(searchUrl, { headers: { "User-Agent": "GestaoAmbientalAndradas/1.0 (Prefeitura Municipal de Andradas)" } });
        let places = await upstream.json();
        if ((!upstream.ok || !Array.isArray(places) || !places.length) && address.includes(",")) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          const street = address.split(",")[0].replace(/^Av\.?\s+/i, "Avenida ").trim();
          const fallbackUrl = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=br&q=${encodeURIComponent(`${street}, Andradas, MG, Brasil`)}`;
          const fallback = await fetch(fallbackUrl, { headers: { "User-Agent": "GestaoAmbientalAndradas/1.0 (Prefeitura Municipal de Andradas)" } });
          places = await fallback.json();
        }
        if (!Array.isArray(places) || !places.length) return json(res, 404, { ok: false, error: "Endereço não localizado no mapa" });
        const location = { lat: Number(places[0].lat), lng: Number(places[0].lon), displayName: String(places[0].display_name || address) };
        geocodeCache.set(key, location);
        return json(res, 200, { ok: true, location });
      } catch (error) { return json(res, 502, { ok: false, error: `Falha ao localizar endereço: ${error.message}` }); }
    }
    if (u.pathname === "/api/inventory" && req.method === "GET") {
      const url = `https://docs.google.com/spreadsheets/d/${INVENTORY_SPREADSHEET_ID}/gviz/tq?tqx=out:csv&gid=${INVENTORY_SHEET_GID}&_=${Date.now()}`;
      try {
        const upstream = await fetch(url, { redirect: "follow", cache: "no-store" });
        if (!upstream.ok) return json(res, 502, { ok: false, error: `Planilha do Inventário respondeu HTTP ${upstream.status}` });
        const rows = parseCsv(await upstream.text());
        const headers = rows.shift() || [];
        const trees = rows.map(row => Object.fromEntries(headers.map((header, index) => [header, row[index] || ""]))).filter(tree => String(tree.ID || "").trim());
        return json(res, 200, { ok: true, status: "ok", trees });
      } catch (error) { return json(res, 502, { ok: false, error: error.message }); }
    }
    if (u.pathname === "/api/inventory" && req.method === "POST") {
      const bodyBuffer = await readBody(req, 30_000_000);
      let data; try { data = JSON.parse(bodyBuffer.toString("utf8")); } catch { return json(res, 400, { ok: false, error: "JSON inválido" }); }
      const target = process.env.INVENTORY_WEBHOOK_URL || inventoryWebhookUrl || DEFAULT_INVENTORY_WEBHOOK;
      try {
        const capabilityResponse = await fetch(`${target}?action=capabilities&_=${Date.now()}`, { redirect: "follow", cache: "no-store" });
        const capability = await capabilityResponse.json();
        if (!Number(capability.apiVersion || 0)) capability.apiVersion = 2;
        if (Number(capability.apiVersion || 0) < 2) return json(res, 409, { ok: false, error: "Atualize e publique o Apps Script do Inventário (versão 2)." });
        const upstream = await fetch(target, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(data), redirect: "follow" });
        const result = await upstream.json();
        return json(res, upstream.ok && (result.ok || result.status === "ok" || result.success) ? 200 : 502, result);
      } catch (error) { return json(res, 502, { ok: false, error: error.message }); }
    }
    if (u.pathname === "/api/process-sync" && req.method === "POST") {
      const bodyBuffer = await readBody(req, 10_000_000);
      let data; try { data = JSON.parse(bodyBuffer.toString("utf8")); } catch { return json(res, 400, { ok: false, error: "JSON inválido" }); }
      const target = process.env.SHEETS_WEBHOOK_URL || sheetsWebhookUrl || DEFAULT_VISTORIA_WEBHOOK;
      try {
        const capabilityResponse = await fetch(`${target}?action=capabilities&_=${Date.now()}`, { redirect: "follow", cache: "no-store" });
        const capability = await capabilityResponse.json();
        if (Number(capability.apiVersion || 0) < PROCESS_MIN_API_VERSION) return json(res, 409, { ok: false, error: "Atualize e publique o Apps Script da planilha de Processos (versão 8 ou superior)." });
        const upstream = await fetch(target, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(data), redirect: "follow" });
        const result = await upstream.json();
        return json(res, upstream.ok && result.ok ? 200 : 502, result);
      } catch (error) { return json(res, 502, { ok: false, error: error.message }); }
    }
    // ── GET /api/processes (planilha exclusiva da Vistoria) ──────────────────
    if (req.method === "GET" && u.pathname === "/api/processes") {
      const csvUrl = `https://docs.google.com/spreadsheets/d/${VISTORIA_SPREADSHEET_ID}/export?format=csv&gid=0&_=${Date.now()}`;
      try {
        const upstream = await fetch(csvUrl, { redirect: "follow", cache: "no-store" });
        if (!upstream.ok) return json(res, 502, { ok: false, error: `Planilha respondeu HTTP ${upstream.status}` });
        const rows = parseCsv(await upstream.text());
        const headers = rows[0] || [];
        const byProtocol = new Map();
        rows.slice(1).forEach((row, index) => {
          const protocolPosition = sheetHeaderIndex(headers, "Protocolo", 1);
          const protocolo = String(row[protocolPosition] || "").trim();
          if (!protocolo) return;
          const details = processDetailsFromSheetRow(row, headers);
          const cell = (name, fallback = -1) => {
            const position = sheetHeaderIndex(headers, name, fallback);
            return position >= 0 ? String(row[position] || "") : "";
          };
          const base = {
            id: `SHEET-${index + 2}-${protocolo}`,
            protocolo,
            data: brDateToIso(cell("Data", 0)),
            requerente: cell("Solicitante", 2),
            telefone: cell("Telefone"),
            endereco: cell("Endere\u00e7o", 5),
            solicitacaoRequerente: cell("Solicita\u00e7\u00e3o", 4),
            intervencao: cell("Solicita\u00e7\u00e3o", 4),
            intervencaoLabel: cell("Solicita\u00e7\u00e3o", 4),
            situacao: (() => {
              const named = cell("Situação").trim();
              if (named) return named;
              const fromDetails = String(details.situacao || "").trim();
              if (fromDetails) return fromDetails;
              const allowed = new Set(["Aguardando Vistoria", "Parecer em Elaboração", "Enviado para Deliberação CODEMA", "Enviado para Deliberação do CODEMA", "Encaminhado para Corte pela Secretaria de Obras", "Aguardando Compensação", "Encaminhado para a Secretaria de Planejamento", "Compensado", "Indeferido", "Arquivado"]);
              // Formato legado: texto plano em "Dados da Vistoria 1"
              const dv1 = cell("Dados da Vistoria 1");
              if (dv1 && !dv1.trim().startsWith("{") && allowed.has(dv1.trim())) return dv1.trim();
              return [row[14], row[15]].map(v => String(v || "").trim()).find(v => allowed.has(v)) || "Aguardando Vistoria";
            })(),
            coordenadas: {
              lat: coordinateFromSheetCell(cell("Coordenada 1 Corte", 6), 90),
              lng: coordinateFromSheetCell(cell("Coordenada 2 Corte", 7), 180)
            },
            responsavelCorte: cell("Respons\u00e1vel Corte", 8),
            autorizacao: cell("Autoriza\u00e7\u00e3o", 9),
            dataAutorizacao: brDateToIso(cell("Data da Autoriza\u00e7\u00e3o", 10)),
            compensacao: cell("Compensa\u00e7\u00e3o", 11),
            fiscalNome: (() => {
              const fromNamed = cell("Fiscal");
              if (fromNamed) return fromNamed;
              const fromDetails = String(details.fiscalNome || "");
              if (fromDetails) return fromDetails;
              // Formato legado: nome do fiscal em texto plano em "Dados da Vistoria 2"
              const dv2 = cell("Dados da Vistoria 2");
              if (dv2 && !dv2.trim().startsWith("{") && dv2.trim().length > 2) return dv2.trim();
              return "";
            })(),
            formaCompensacaoLabel: cell("Forma de Compensa\u00e7\u00e3o", 20),
            prazo: brDateToIso(cell("Prazo", 12)),
            coordComp1: cell("Coordenada 1 Comp.", 13),
            coordComp2: cell("Coordenada 2 Comp.", 14),
            parecerTexto: ""
          };
          byProtocol.set(protocolo, {
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
          });
        });
        return json(res, 200, { ok: true, processes: [...byProtocol.values()] });
      } catch (fetchErr) {
        return json(res, 502, { ok: false, error: `Falha ao consultar a planilha da Vistoria: ${fetchErr.message}` });
      }
    }

    // GET/POST /api/water - leitura da planilha e gravacao via Apps Script
    if (u.pathname === "/api/water" && req.method === "GET") {
      if (u.searchParams.get("resource") === "points") {
        const pointsUrl = `https://docs.google.com/spreadsheets/d/${WATER_SPREADSHEET_ID}/export?format=csv&gid=602322873&_=${Date.now()}`;
        try {
          const upstream = await fetch(pointsUrl, { redirect: "follow", cache: "no-store" });
          if (!upstream.ok) return json(res, 502, { ok: false, error: `Cadastro de pontos respondeu HTTP ${upstream.status}` });
          const rows = (await upstream.text()).split(/\r?\n/).map(parseCsvLine);
          const points = rows.slice(1).filter(row => String(row[0] || "").trim()).map(row => ({ id: String(row[0]), district: String(row[1] || ""), image: String(row[2] || ""), type: String(row[3] || ""), location: String(row[4] || ""), coordinates: String(row[5] || ""), source: String(row[6] || "") }));
          return json(res, 200, { ok: true, points });
        } catch (error) { return json(res, 502, { ok: false, error: error.message }); }
      }
      const csvUrl = `https://docs.google.com/spreadsheets/d/${WATER_SPREADSHEET_ID}/export?format=csv&gid=1745208866&_=${Date.now()}`;
      try {
        const upstream = await fetch(csvUrl, { redirect: "follow", cache: "no-store" });
        if (!upstream.ok) return json(res, 502, { ok: false, error: `Planilha de agua respondeu HTTP ${upstream.status}` });
        const rows = (await upstream.text()).split(/\r?\n/).map(parseCsvLine);
        const records = rows.slice(1).filter(row => String(row[0] || "").trim()).map(row => ({
          sheetId: String(row[0] || ""), date: brDateToIso(row[1]), district: String(row[2] || ""),
          pointType: String(row[3] || ""), location: String(row[4] || ""), chlorinator: String(row[5] || ""),
          turbidity: row[6] === "" ? null : Number(String(row[6]).replace(",", ".")),
          color: row[7] === "" ? null : Number(String(row[7]).replace(",", ".")),
          chlorine: row[8] === "" ? null : Number(String(row[8]).replace(",", ".")),
          ph: row[9] === "" ? null : Number(String(row[9]).replace(",", ".")),
          sdt: row[10] === "" ? null : Number(String(row[10]).replace(",", ".")),
          temperature: row[11] === "" ? null : Number(String(row[11]).replace(",", ".")), syncStatus: "synced"
        }));
        return json(res, 200, { ok: true, records });
      } catch (error) { return json(res, 502, { ok: false, error: `Falha ao consultar a planilha de agua: ${error.message}` }); }
    }
    if (u.pathname === "/api/water" && req.method === "POST") {
      const bodyBuffer = await readBody(req);
      let data; try { data = JSON.parse(bodyBuffer.toString("utf8")); } catch { return json(res, 400, { ok: false, error: "JSON invalido" }); }
      const target = process.env.WATER_SHEETS_WEBHOOK_URL || waterWebhookUrl || DEFAULT_WATER_WEBHOOK;
      if (!target || !/^https:\/\/script\.google\.com\//i.test(target)) return json(res, 503, { ok: false, error: "Google Apps Script da agua ainda nao configurado" });
      try {
        const capabilityResponse = await fetch(`${target}?action=capabilities&module=water&_=${Date.now()}`, { redirect: "follow", cache: "no-store" });
        const capability = await readJson(capabilityResponse, "Apps Script da Agua");
        if (Number(capability.apiVersion || 0) < WATER_MIN_API_VERSION) return json(res, 409, { ok: false, error: `O Apps Script da Agua precisa ser versao ${WATER_MIN_API_VERSION} ou superior.` });
        const upstream = await fetch(target, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ ...data, action: data.action === "saveWaterPoint" ? "saveWaterPoint" : "addWaterRecord", module: "water" }), redirect: "follow" });
        const text = await upstream.text(); let result; try { result = JSON.parse(text); } catch { result = { ok: false, error: "Resposta invalida do Google Apps Script" }; }
        return json(res, upstream.ok && result.ok ? 200 : 502, result);
      } catch (error) { return json(res, 502, { ok: false, error: error.message }); }
    }    // ── POST /api/config/save-key ──────────────────────────────────────────
    if (req.method === "POST" && u.pathname === "/api/config/save-key") {
      const bodyBuffer = await readBody(req);
      let data;
      try { data = JSON.parse(bodyBuffer.toString("utf8")); } catch { return json(res, 400, { ok: false, error: "JSON inválido" }); }
      const key = String(data.key || "").trim();
      if (!key) return json(res, 400, { ok: false, error: "Chave não informada" });
      localKey = key;
      process.env.PLANTNET_API_KEY = key;
      try {
        let current = "";
        try { current = await readFile(join(root, ".env"), "utf8"); } catch {}
        await writeFile(join(root, ".env"), updateEnvValue(current, "PLANTNET_API_KEY", key), "utf8");
      } catch (err) {
        console.warn("[server] Não foi possível salvar no .env:", err.message);
      }
      return json(res, 200, { ok: true, message: "Chave salva permanentemente no servidor" });
    }

    // ── GET /api/get-trees (proxy para Apps Script doGet) ───────────────────
    if (req.method === "GET" && u.pathname === "/api/get-trees") {
      const webhookUrl = u.searchParams.get("url") || sheetsWebhookUrl;
      if (!webhookUrl || !/^https:\/\/script\.google\.com\//i.test(webhookUrl)) {
        return json(res, 400, { ok: false, error: "URL do Google Apps Script não configurada" });
      }
      try {
        const upstream = await fetch(webhookUrl, {
          method: "GET",
          redirect: "follow"
        });
        const text = await upstream.text();
        let result;
        try { result = JSON.parse(text); } catch { result = { ok: false, raw: text.slice(0, 300) }; }
        return json(res, upstream.ok ? 200 : 502, result);
      } catch (fetchErr) {
        return json(res, 502, { ok: false, error: fetchErr.message });
      }
    }

    // ── POST /api/identify (proxy Pl@ntNet) ──────────────────────────────────
    if (req.method === "POST" && u.pathname === "/api/identify") {
      const key = u.searchParams.get("key") || process.env.PLANTNET_API_KEY || localKey;
      if (!key) return json(res, 400, { error: "Chave Pl@ntNet não configurada" });

      const multipart = await readBody(req, 55_000_000);
      const upstream = await fetch(
        `https://my-api.plantnet.org/v2/identify/all?api-key=${encodeURIComponent(key)}&lang=pt&nb-results=5`,
        {
          method: "POST",
          headers: {
            "content-type": req.headers["content-type"] || "multipart/form-data",
            "content-length": String(multipart.length)
          },
          body: multipart
        }
      );
      const body = await upstream.text();
      res.writeHead(upstream.status, {
        "Content-Type": upstream.headers.get("content-type") || "application/json",
        "X-Content-Type-Options": "nosniff"
      });
      return res.end(body);
    }

    // ── POST /api/process-status (atualiza linha existente com segurança) ─────
    if (req.method === "POST" && u.pathname === "/api/process-status") {
      const bodyBuffer = await readBody(req);
      let data;
      try { data = JSON.parse(bodyBuffer.toString("utf8")); }
      catch { return json(res, 400, { ok: false, error: "JSON inválido" }); }
      const protocolo = String(data.protocolo || "").trim();
      const requestedStatus = String(data.situacao || "").trim();
      const situacao = requestedStatus === "Enviado para Deliberação do CODEMA"
        ? "Enviado para Deliberação CODEMA"
        : requestedStatus;
      const allowedStatuses = new Set(["Aguardando Vistoria", "Parecer em Elaboração", "Enviado para Deliberação CODEMA", "Encaminhado para Corte pela Secretaria de Obras", "Encaminhado para a Secretaria de Planejamento", "Aguardando Compensação", "Compensado", "Indeferido", "Arquivado"]);
      if (!protocolo || !situacao) return json(res, 400, { ok: false, error: "Protocolo e situação são obrigatórios" });
      if (!allowedStatuses.has(situacao)) return json(res, 400, { ok: false, error: "Andamento inválido para a planilha" });

      const target = process.env.SHEETS_WEBHOOK_URL || sheetsWebhookUrl || DEFAULT_VISTORIA_WEBHOOK;
      try {
        const capabilityResponse = await fetch(`${target}?action=capabilities&_=${Date.now()}`, { redirect: "follow", cache: "no-store" });
        const capability = await capabilityResponse.json();
        if (Number(capability.apiVersion || 0) < 8) {
          return json(res, 409, { ok: false, error: "Atualize e publique o Google Apps Script da Vistoria (versão 8) antes de alterar situações." });
        }
        const upstream = await fetch(target, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({
            action: "updateStatus", protocolo, situacao, compensacao: String(data.compensacao || ""),
            formaCompensacao: String(data.formaCompensacao || ""), formaCompensacaoLabel: String(data.formaCompensacaoLabel || ""), dataCompensacao: String(data.dataCompensacao || ""),
            dataEncaminhamento: String(data.dataEncaminhamento || ""), process: null
          }),
          redirect: "follow"
        });
        const result = await upstream.json();
        if (upstream.ok && result.ok) return json(res, 200, result);
        try {
          if (await verifyProcessStatusInSheet(protocolo, situacao)) {
            return json(res, 200, {
              ok: true, protocolo, situacao, verified: true,
              recoveredFromPostWriteError: true
            });
          }
        } catch (verificationError) {
          console.warn("[process-status] Falha ao confirmar a gravação:", verificationError.message);
        }
        return json(res, 502, result);
      } catch (error) {
        return json(res, 502, { ok: false, error: error.message });
      }
    }
    // ── POST /api/sheet (proxy Apps Script doPost) ───────────────────────────
    if (req.method === "POST" && u.pathname === "/api/sheet") {
      const bodyBuffer = await readBody(req);
      let data;
      try {
        data = JSON.parse(bodyBuffer.toString("utf8"));
      } catch {
        return json(res, 400, { ok: false, error: "JSON inválido" });
      }

      const target = data.url || process.env.SHEETS_WEBHOOK_URL || sheetsWebhookUrl;
      if (!target || !/^https:\/\/script\.google\.com\//i.test(target)) {
        return json(res, 400, { ok: false, error: "URL válida do Google Apps Script não configurada" });
      }

      const upstream = await fetch(target, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(data.payload),
        redirect: "follow"
      });

      const text = await upstream.text();
      let result;
      try {
        result = JSON.parse(text);
      } catch {
        result = { ok: upstream.ok, response: text.slice(0, 300) };
      }
      return json(res, upstream.ok ? 200 : 502, result);
    }

    if (req.method !== "GET" && req.method !== "HEAD") {
      return json(res, 405, { error: "Método não permitido" });
    }

    // ── Static file serving ───────────────────────────────────────────────────
    const rawPath = decodeURIComponent(u.pathname);
    const rel = rawPath === "/" ? "index.html" : rawPath.replace(/^\/+/, "");

    if (!isAllowedStatic(rel)) {
      return json(res, 404, { error: "Arquivo não encontrado ou acesso restrito" });
    }

    const filePath = resolve(root, normalize(rel));
    if (!filePath.startsWith(resolve(root))) {
      return json(res, 403, { error: "Acesso proibido" });
    }

    try {
      const fileStat = await stat(filePath);
      if (!fileStat.isFile()) {
        return json(res, 404, { error: "Arquivo não encontrado" });
      }
    } catch {
      return json(res, 404, { error: "Arquivo não encontrado" });
    }

    const fileBody = await readFile(filePath);
    const ext = extname(filePath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": types[ext] || "application/octet-stream",
      "Cache-Control": [".html", ".js", ".css"].includes(ext) ? "no-store" : "public, max-age=3600",
      "X-Content-Type-Options": "nosniff"
    });
    if (req.method === "HEAD") return res.end();
    return res.end(fileBody);

  } catch (e) {
    console.error("[servidor]", e.message);
    if (!res.headersSent) {
      json(res, 500, { error: "Erro interno do servidor", message: e.message });
    } else {
      res.end();
    }
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Parecer Ambiental rodando em: http://127.0.0.1:${port}`);
});
