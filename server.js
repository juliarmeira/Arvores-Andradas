import http from "node:http";
import { readFile, stat, writeFile } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";

const root = process.cwd();
const port = Number(process.env.PORT) || 4178;
const VISTORIA_SPREADSHEET_ID = "1f03SZqhFe4AbSd-Z4kg_MgBzDxg9ES-nzgLAiZfLDNU";
const WATER_SPREADSHEET_ID = "1BDuNmB5umdQLre8bDE-Ltuk0WCnl9pLT5kYYmFmzW6Y";
const DEFAULT_WATER_WEBHOOK = "https://script.google.com/macros/s/AKfycbxKCAT7elYq-msoEF9vMPss9TOdu7jlW-ze8xUqUAMs_z4NZHI21psoD-GJEMJJv518/exec";

let localKey = "";
let sheetsWebhookUrl = "";
try {
  const cfg = await readFile(join(root, ".env"), "utf8");
  localKey = cfg.match(/^PLANTNET_API_KEY=(.+)$/m)?.[1]?.trim() || "";
  sheetsWebhookUrl = cfg.match(/^SHEETS_WEBHOOK_URL=(.+)$/m)?.[1]?.trim() || "";
} catch {}

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
  if (clean === "index.html" || clean === "index.css" || clean === "index.js" || clean === "favicon.ico" || clean === "manifest.webmanifest" || clean === "app-icon.svg" || clean === "sw.js") {
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

    // ── GET /api/processes (planilha exclusiva da Vistoria) ──────────────────
    if (req.method === "GET" && u.pathname === "/api/processes") {
      const csvUrl = `https://docs.google.com/spreadsheets/d/${VISTORIA_SPREADSHEET_ID}/export?format=csv&gid=0&_=${Date.now()}`;
      try {
        const upstream = await fetch(csvUrl, { redirect: "follow", cache: "no-store" });
        if (!upstream.ok) return json(res, 502, { ok: false, error: `Planilha respondeu HTTP ${upstream.status}` });
        const rows = (await upstream.text()).split(/\r?\n/).map(parseCsvLine);
        const byProtocol = new Map();
        rows.slice(1).forEach((row, index) => {
          const protocolo = String(row[1] || "").trim();
          if (!protocolo) return;
          byProtocol.set(protocolo, {
            id: `SHEET-${index + 2}-${protocolo}`,
            protocolo,
            data: brDateToIso(row[0]),
            requerente: String(row[2] || ""),
            endereco: String(row[3] || ""),
            intervencao: String(row[4] || ""),
            intervencaoLabel: String(row[4] || ""),
            situacao: String(row[14] || "").trim() || "Em Análise",
            coordenadas: { lat: String(row[5] || ""), lng: String(row[6] || "") },
            responsavelCorte: String(row[7] || ""),
            autorizacao: String(row[8] || ""),
            dataAutorizacao: brDateToIso(row[9]),
            compensacao: String(row[10] || ""),
            prazo: brDateToIso(row[11]),
            coordComp1: String(row[12] || ""),
            coordComp2: String(row[13] || ""),
            parecerTexto: ""
          });
        });
        return json(res, 200, { ok: true, processes: [...byProtocol.values()] });
      } catch (fetchErr) {
        return json(res, 502, { ok: false, error: `Falha ao consultar a planilha da Vistoria: ${fetchErr.message}` });
      }
    }

    // GET/POST /api/water - leitura da planilha e gravacao via Apps Script
    if (u.pathname === "/api/water" && req.method === "GET") {
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
      const target = process.env.WATER_SHEETS_WEBHOOK_URL || DEFAULT_WATER_WEBHOOK || process.env.SHEETS_WEBHOOK_URL || sheetsWebhookUrl;
      if (!target || !/^https:\/\/script\.google\.com\//i.test(target)) return json(res, 503, { ok: false, error: "Google Apps Script da agua ainda nao configurado" });
      try {
        const upstream = await fetch(target, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ ...data, action: "addWaterRecord", module: "water" }), redirect: "follow" });
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
        await writeFile(join(root, ".env"), `PLANTNET_API_KEY=${key}\nSHEETS_WEBHOOK_URL=${sheetsWebhookUrl}\n`, "utf8");
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
      const situacao = String(data.situacao || "").trim();
      if (!protocolo || !situacao) return json(res, 400, { ok: false, error: "Protocolo e situação são obrigatórios" });

      const target = process.env.SHEETS_WEBHOOK_URL || sheetsWebhookUrl;
      try {
        const capabilityResponse = await fetch(`${target}?action=capabilities&_=${Date.now()}`, { redirect: "follow", cache: "no-store" });
        const capability = await capabilityResponse.json();
        if (Number(capability.apiVersion || 0) < 2) {
          return json(res, 409, { ok: false, error: "Atualize e publique novamente o Google Apps Script da Vistoria antes de alterar situações." });
        }
        const upstream = await fetch(target, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ action: "updateStatus", protocolo, situacao, compensacao: String(data.compensacao || "") }),
          redirect: "follow"
        });
        const result = await upstream.json();
        return json(res, upstream.ok && result.ok ? 200 : 502, result);
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
