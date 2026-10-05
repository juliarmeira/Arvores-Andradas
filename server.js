import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";

const root = process.cwd();
const port = Number(process.env.PORT) || 4178;

let localKey = "";
try {
  const cfg = await readFile(join(root, ".env"), "utf8");
  localKey = cfg.match(/^PLANTNET_API_KEY=(.+)$/m)?.[1]?.trim() || "";
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
  ".ico": "image/x-icon"
};

const json = (res, status, data) => {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
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

// Whitelist of allowed public paths for safe static serving
const isAllowedStatic = (relPath) => {
  if (!relPath || relPath.includes("..") || relPath.startsWith(".") || relPath.includes("/.")) {
    return false;
  }
  const clean = relPath.toLowerCase().replace(/\\/g, "/");
  if (clean === "index.html" || clean === "index.css" || clean === "index.js" || clean === "favicon.ico") {
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

    if (req.method === "GET" && u.pathname === "/api/config") {
      return json(res, 200, {
        plantnetConfigured: !!(process.env.PLANTNET_API_KEY || localKey)
      });
    }

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

    if (req.method === "POST" && u.pathname === "/api/sheet") {
      const bodyBuffer = await readBody(req);
      let data;
      try {
        data = JSON.parse(bodyBuffer.toString("utf8"));
      } catch {
        return json(res, 400, { ok: false, error: "JSON inválido" });
      }

      const target = data.url || process.env.SHEETS_WEBHOOK_URL;
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

    // Static file serving with strict whitelist & path sanitization
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

    const body = await readFile(filePath);
    const ext = extname(filePath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": types[ext] || "application/octet-stream",
      "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=3600",
      "X-Content-Type-Options": "nosniff"
    });
    if (req.method === "HEAD") {
      return res.end();
    }
    return res.end(body);
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