const SPREADSHEET_ID = "1f03SZqhFe4AbSd-Z4kg_MgBzDxg9ES-nzgLAiZfLDNU";

const parseCsvLine = (line) => {
  const values = [];
  line.replace(/(?:^|,)("(?:[^"]|"")*"|[^,]*)/g, (_, cell) => {
    values.push(cell.startsWith('"') ? cell.slice(1, -1).replace(/""/g, '"') : cell);
    return "";
  });
  return values;
};

const brDateToIso = (value) => {
  const match = String(value || "").trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  return match ? `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}` : String(value || "");
};

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ ok: false, error: "Método não permitido" });
  try {
    const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=0&_=${Date.now()}`;
    const upstream = await fetch(url, { redirect: "follow", cache: "no-store" });
    if (!upstream.ok) return res.status(502).json({ ok: false, error: `Planilha respondeu HTTP ${upstream.status}` });
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
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ ok: true, processes: [...byProtocol.values()] });
  } catch (error) {
    return res.status(502).json({ ok: false, error: `Falha ao consultar a planilha: ${error.message}` });
  }
}