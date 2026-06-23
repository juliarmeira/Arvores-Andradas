import express from "express";
import fs from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Carregar GEMINI_API_KEY
let API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
if (!API_KEY) {
  try {
    const dotenvPath = path.resolve(__dirname, ".env");
    if (fs.existsSync(dotenvPath)) {
      const cfg = fs.readFileSync(dotenvPath, "utf-8");
      const m = cfg.match(/GEMINI_API_KEY\s*=\s*(.+)/);
      if (m) API_KEY = m[1].trim();
    }
  } catch (e) {
    console.error("Erro ao ler arquivo .env:", e.message);
  }
}

const app = express();
const PORT = 3000;

// Configurar limites de JSON altos para fotos em base64
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Servir arquivos estáticos da pasta public
app.use(express.static(path.join(__dirname, "public")));

// Endpoint para verificar configuração
app.get("/api/config", (req, res) => {
  res.json({
    hasApiKey: !!API_KEY,
    localIp: getLocalIp(),
    port: PORT
  });
});

// Endpoint proxy para buscar árvores cadastradas na planilha
app.get("/api/trees", async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ error: "URL da planilha não fornecida" });
    }

    const response = await fetch(url, {
      method: "GET",
      headers: { "Accept": "application/json" }
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar dados do Google Apps Script (${response.status})`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Erro ao buscar árvores:", error);
    res.status(500).json({ error: error.message || "Erro desconhecido ao carregar árvores." });
  }
});

// Endpoint proxy para o Gemini
app.post("/api/analyze-tree", async (req, res) => {
  try {
    const { photoBase64, customApiKey } = req.body;

    if (!photoBase64) {
      return res.status(400).json({ error: "Foto não fornecida" });
    }

    const key = customApiKey || API_KEY;
    if (!key) {
      return res.status(400).json({ error: "Chave da API Gemini não configurada no servidor. Por favor, configure nas configurações do app." });
    }

    // Processar base64 da foto
    const match = photoBase64.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!match) {
      return res.status(400).json({ error: "Formato de imagem inválido" });
    }
    const mimeType = match[1];
    const base64Data = match[2];

    const PROMPT_JSON = `Você é um botânico forense e fiscal ambiental especializado em vistorias técnicas para avaliação de árvores.
Analise a foto da árvore com rigor técnico e retorne um objeto JSON estritamente no seguinte formato:
{
  "scientificName": "Nome científico da árvore (ex: Tabebuia alba)",
  "popularNames": "Nomes populares separados por vírgula (ex: Ipê Amarelo, Ipê)",
  "family": "Família botânica (ex: Bignoniaceae)",
  "origin": "Origem: Nativa do Brasil ou Exótica",
  "dimensions": "Porte estimado: Altura, Diâmetro de Tronco, Copa (ex: Altura: 10m, DAP: 35cm, Copa: 6m)",
  "developmentStage": "Estádio de desenvolvimento: Jovem, Adulto ou Senil",
  "barkCondition": "Diagnóstico do estado da casca: Relate se há lesões, rachaduras profundas, desprendimento anormal, ocos ou se está saudável",
  "pestsAndDiseases": "Sinais de pragas/doenças: Identifique se há cupins, fungos orelha-de-pau, brocas ou outras pragas. Caso não haja nada, indique 'Nenhuma identificada'",
  "riskLevel": "Nível de risco estimado de queda ou quebra de galhos grandes: Baixo, Médio ou Alto",
  "conflicts": "Conflitos visíveis com estruturas urbanas: Ex: fiação elétrica, calçada levantada, muros trincados, tubulação ou 'Nenhum visível'",
  "parecer": "Parecer inicial de manejo sugerido: FAVORÁVEL (para corte/remoção se houver risco grave ou morte), DESFAVORÁVEL (manter árvore saudável), ou NECESSITA AVALIAÇÃO PRESENCIAL (se a imagem não der certeza)",
  "justificativa": "Justificativa técnica detalhada sobre as condições da árvore e o motivo do parecer acima.",
  "confidence": "Grau de confiança da identificação botânica: Alto, Médio ou Baixo"
}

IMPORTANTE: Seja conservador. Se não for possível identificar a espécie ou avaliar o risco devido à qualidade da foto ou ângulo, indique isso nos campos correspondentes.`;

    const requestBody = {
      contents: [
        {
          parts: [
            { text: PROMPT_JSON },
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.15,
        maxOutputTokens: 8192,
        responseMimeType: "application/json"
      }
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Erro na API do Gemini (${response.status}): ${errText}`);
    }

    const responseData = await response.json();
    const responseText = responseData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      throw new Error("Resposta vazia da API do Gemini.");
    }

    // Retornar o JSON analisado para o frontend
    const parsedData = JSON.parse(responseText.trim());
    res.json(parsedData);

  } catch (error) {
    console.error("Erro na análise da árvore:", error);
    res.status(500).json({ error: error.message || "Erro desconhecido na análise da árvore." });
  }
});

// Função para buscar IP local
function getLocalIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return "127.0.0.1";
}

// Iniciar servidor
app.listen(PORT, "0.0.0.0", () => {
  const localIp = getLocalIp();
  console.log("\n" + "=".repeat(64));
  console.log("  🌳 SISTEMA DE CADASTRO E VISTORIA DE ÁRVORES - ANDRADAS 🌳");
  console.log("=".repeat(64));
  console.log(`\n  🖥️  Acesso no Computador:  http://localhost:${PORT}`);
  console.log(`  📱  Acesso no Celular:     http://${localIp}:${PORT}`);
  console.log("\n  * Certifique-se de que o celular está no mesmo Wi-Fi do computador.");
  console.log("  * A interface no computador exibirá um QR Code para escanear!");
  console.log("=".repeat(64) + "\n");
});
