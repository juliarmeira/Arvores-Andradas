/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import dotenv from "dotenv";

dotenv.config();

// Google Sheets Configuration
const SPREADSHEET_ID = "1A8mIArlQiqcvnIgRGYgSiU5WDF2ClbGYe0XOHiyOciU";
const SHEET_NAME = "Árvores";

const HEADERS = ["ID","Latitude","Longitude","Endereço","Ponto de Referência","Local de Plantio","Espécie","Certeza","Tipo de Planta","Foto Árvore","Foto Tronco","Foto Folha","Foto Flor/Fruto","Foto Dano","Porte","Tronco DBH","Inclinação Tronco","Rachaduras Tronco","Fungos Tronco","Pragas Tronco","Broca Tronco","Copa Seca","Galhos Quebrados","Parasitas Copa","Raízes Calçada","Raízes Estrangulamento","Rede Elétrica","Sinalização","Muros/Telhados","Acessibilidade","Intervenção","Mês Poda","Data Última Poda","Histórico Podas","Observações","Técnico","Data Criação"];

async function getSpreadsheet(): Promise<GoogleSpreadsheet> {
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!serviceAccountEmail || !privateKey) {
    throw new Error("Credenciais do Google Service Account não configuradas. Defina GOOGLE_SERVICE_ACCOUNT_EMAIL e GOOGLE_PRIVATE_KEY no .env");
  }

  const serviceAccountAuth = new JWT({
    email: serviceAccountEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const doc = new GoogleSpreadsheet(SPREADSHEET_ID, serviceAccountAuth);
  await doc.loadInfo();
  return doc;
}

async function getSheet() {
  const doc = await getSpreadsheet();
  let sheet = doc.sheetsByTitle[SHEET_NAME];
  if (!sheet) {
    sheet = await doc.addSheet({ title: SHEET_NAME, headerValues: HEADERS });
  }
  return sheet;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json({ limit: "10mb" }));

  // Lazy initialize Gemini API client to prevent crashes if key is missing on startup
  let aiClient: GoogleGenAI | null = null;
  function getGenAI(): GoogleGenAI {
    if (!aiClient) {
      const key = process.env.GEMINI_API_KEY;
      if (!key) {
        throw new Error("A chave GEMINI_API_KEY não está configurada nos segredos do AI Studio.");
      }
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
    return aiClient;
  }

  // API endpoints
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // Proxy API endpoint for generating technical tree diagnostics via Gemini
  app.post("/api/generate-laudo", async (req, res) => {
    try {
      const { tree } = req.body;
      if (!tree) {
        res.status(400).json({ error: "Os dados da árvore são obrigatórios para gerar o laudo." });
        return;
      }

      const ai = getGenAI();

      // Compile tree parameters for the model
      const healthIssues: string[] = [];
      const health = tree.healthCheck || {};
      if (health.trunkInclined) healthIssues.push("Tronco com inclinação acentuada");
      if (health.trunkCracks) healthIssues.push("Presença de rachaduras profundas ou buracos grandes no tronco");
      if (health.trunkFungi) healthIssues.push("Presença de fungos/cogumelos (orelha-de-pau) na madeira");
      if (health.trunkPests) healthIssues.push("Presença de pragas na base (cupins, excesso de formigas)");
      if (health.trunkBorer) healthIssues.push("Sinais de furos no tronco com pó de serra (indicativo de broca)");
      if (health.canopyDry) healthIssues.push("Presença de galhos secos ou mortos na copa");
      if (health.canopyBroken) healthIssues.push("Presença de galhos grandes quebrados e pendurados");
      if (health.canopyParasite) healthIssues.push("Presença de erva-de-passarinho ou outras plantas parasitas");
      if (health.rootsDamage) healthIssues.push("Raízes danificando gravemente o calçamento ou asfalto");
      if (health.rootsStrangling) healthIssues.push("Raízes estrangulando o próprio tronco");

      const interferences: string[] = [];
      const conflicts = tree.urbanInterferences || {};
      if (conflicts.powerGrid) interferences.push("Copa em conflito com a rede elétrica");
      if (conflicts.signaling) interferences.push("Obstruindo a iluminação pública ou sinalização de trânsito");
      if (conflicts.wallsTelhados) interferences.push("Encostando ou danificando muros/telhados de terceiros");
      if (conflicts.accessibility) interferences.push("Atrapalhando a acessibilidade de pedestres ou cadeirantes na calçada");

      const prompt = `
Você é o Especialista em Arborização Urbana e Gestão de Riscos do Departamento de Meio Ambiente da Prefeitura de Andradas, Minas Gerais.
Sua tarefa é analisar os dados coletados em campo por um técnico e gerar um **Laudo Técnico de Diagnóstico e Recomendações de Manejo** completo, formal, estruturado e extremamente profissional.

Aqui estão os dados coletados sobre a árvore:
- **Espécie (Nome Popular):** ${tree.species || "Não identificada"}
- **Tipo de Planta:** ${tree.plantType || "Árvore Nativa"}
- **Grau de Certeza da Identificação:** ${tree.certainty || "Não informado"}
- **Endereço/Logradouro:** ${tree.address || "Não informado"}
- **Ponto de Referência:** ${tree.referencePoint || "Nenhum informado"}
- **Local de Plantio:** ${tree.plantingLocation || "Calçada"}
- **Porte/Altura Estimada:** ${tree.height || "Pequeno (< 4m)"}
- **Espessura do Tronco (DBH):** ${tree.girth || "Fino"}
- **Problemas de Saúde Coletados (Checklist):** ${healthIssues.length > 0 ? healthIssues.join(", ") : "Nenhum problema grave relatado"}
- **Interferências Urbanas Coletadas:** ${interferences.length > 0 ? interferences.join(", ") : "Nenhuma interferência em conflito direto"}
- **Necessidade Visual de Intervenção Sugerida:** ${tree.intervention || "Nenhuma"}
- **Mês sugerido para próxima poda:** ${tree.suggestedMonth || "Não especificado"}
- **Histórico de Podas Anterior:** ${tree.pruningHistory || "Não especificado"}
- **Observações Finais e Relatos da Comunidade:** ${tree.finalObservations || "Sem observações adicionais"}
- **Coordenadas GPS:** Latitude ${tree.coordinates?.lat || "Não capturada"}, Longitude ${tree.coordinates?.lng || "Não capturada"}

Gere o laudo técnico em formato Markdown elegante, estruturado e fluído. O texto deve ser profissional, usando vocabulário técnico de engenharia florestal/biologia e gestão pública urbana.

Certifique-se de incluir as seguintes seções de forma clara e legível:
1. **Identificação e Aspectos Gerais**: Descreva brevemente o exemplar, sua localização em Andradas e se o nível de certeza botânica sugere necessidade de reavaliação.
2. **Análise de Dimensões e Ambiente**: Comente sobre a adequação do porte da árvore (${tree.height}) e diâmetro do tronco (${tree.girth}) ao local de plantio (${tree.plantingLocation}) em que está inserida.
3. **Diagnóstico Fitossanitário e de Segurança**: Faça um parecer técnico consolidado sobre os riscos à saúde biológica do exemplar com base nas anomalias reportadas: ${healthIssues.join(", ") || "nenhuma anomalia fitossanitária foi registrada"}.
4. **Análise de Conflitos e Acessibilidade**: Descreva as interferências e os riscos de segurança pública ou infraestrutura urbana identificados: ${interferences.join(", ") || "sem conflitos imediatos"}.
5. **Recomendações Técnicas de Manejo**: Prescreva as ações exatas que as equipes de poda ou de infraestrutura da prefeitura devem executar (ex: poda de limpeza, adequação, supressão, correção de raiz, etc.). Indique diretrizes de segurança de trabalho e ferramentas recomendadas para o manejo.
6. **Classificação Geral de Risco e Cronograma**: Defina formalmente o grau de risco (Baixo, Médio, Alto, Urgente/Crítico) e justifique. Reitere a janela de intervenção recomendada (Mês sugerido: ${tree.suggestedMonth}) para o planejamento do Meio Ambiente.

Escreva o laudo de maneira objetiva, mas aprofundada, pronta para ser anexada ao sistema de gestão urbana da Prefeitura de Andradas. Não adicione notas de assistente ou meta-conversas, comece diretamente com o título do laudo.
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "Você é um Engenheiro Florestal sênior e Fiscal Ambiental da Prefeitura Municipal de Andradas-MG, focado na segurança pública e preservação da cobertura verde.",
          temperature: 0.7,
        },
      });

      const laudoText = response.text || "Erro ao gerar o laudo técnico de forma automática.";
      res.json({ laudo: laudoText });
    } catch (error: any) {
      console.error("Erro na rota /api/generate-laudo:", error);
      res.status(500).json({ error: error?.message || "Ocorreu um erro interno ao gerar o laudo." });
    }
  });

  // ==================== GOOGLE SHEETS API ROUTES ====================

  function rowToTree(row: any): any {
    return {
      id: row["ID"] || "",
      coordinates: { lat: parseFloat(row["Latitude"]) || -22.0682, lng: parseFloat(row["Longitude"]) || -46.5694 },
      address: row["Endereço"] || "",
      referencePoint: row["Ponto de Referência"] || "",
      plantingLocation: row["Local de Plantio"] || "Calçada",
      species: row["Espécie"] || "",
      certainty: row["Certeza"] || "Tenho certeza",
      plantType: row["Tipo de Planta"] || "Árvore Nativa",
      photos: { tree: null, trunk: null, leaf: null, flowerFruit: null, damage: null },
      height: row["Porte"] || "Médio",
      girth: row["Tronco DBH"] || "Médio",
      healthCheck: {
        trunkInclined: row["Inclinação Tronco"] === true || row["Inclinação Tronco"] === "TRUE",
        trunkCracks: row["Rachaduras Tronco"] === true || row["Rachaduras Tronco"] === "TRUE",
        trunkFungi: row["Fungos Tronco"] === true || row["Fungos Tronco"] === "TRUE",
        trunkPests: row["Pragas Tronco"] === true || row["Pragas Tronco"] === "TRUE",
        trunkBorer: row["Broca Tronco"] === true || row["Broca Tronco"] === "TRUE",
        canopyDry: row["Copa Seca"] === true || row["Copa Seca"] === "TRUE",
        canopyBroken: row["Galhos Quebrados"] === true || row["Galhos Quebrados"] === "TRUE",
        canopyParasite: row["Parasitas Copa"] === true || row["Parasitas Copa"] === "TRUE",
        rootsDamage: row["Raízes Calçada"] === true || row["Raízes Calçada"] === "TRUE",
        rootsStrangling: row["Raízes Estrangulamento"] === true || row["Raízes Estrangulamento"] === "TRUE",
      },
      urbanInterferences: {
        powerGrid: row["Rede Elétrica"] === true || row["Rede Elétrica"] === "TRUE",
        signaling: row["Sinalização"] === true || row["Sinalização"] === "TRUE",
        wallsTelhados: row["Muros/Telhados"] === true || row["Muros/Telhados"] === "TRUE",
        accessibility: row["Acessibilidade"] === true || row["Acessibilidade"] === "TRUE",
      },
      intervention: row["Intervenção"] || "Nenhuma",
      suggestedMonth: row["Mês Poda"] || "JUN",
      lastPruningDate: row["Data Última Poda"] || "",
      pruningHistory: row["Histórico Podas"] || "",
      finalObservations: row["Observações"] || "",
      technicianName: row["Técnico"] || "Eng. Júlia Reis Meira",
      createdAt: row["Data Criação"] || new Date().toISOString(),
    };
  }

  function treeToRow(tree: any): any {
    return {
      "ID": tree.id,
      "Latitude": tree.coordinates?.lat,
      "Longitude": tree.coordinates?.lng,
      "Endereço": tree.address,
      "Ponto de Referência": tree.referencePoint || "",
      "Local de Plantio": tree.plantingLocation,
      "Espécie": tree.species,
      "Certeza": tree.certainty,
      "Tipo de Planta": tree.plantType,
      "Foto Árvore": tree.photos?.tree ? "Sim" : "Não",
      "Foto Tronco": tree.photos?.trunk ? "Sim" : "Não",
      "Foto Folha": tree.photos?.leaf ? "Sim" : "Não",
      "Foto Flor/Fruto": tree.photos?.flowerFruit ? "Sim" : "Não",
      "Foto Dano": tree.photos?.damage ? "Sim" : "Não",
      "Porte": tree.height,
      "Tronco DBH": tree.girth,
      "Inclinação Tronco": tree.healthCheck?.trunkInclined,
      "Rachaduras Tronco": tree.healthCheck?.trunkCracks,
      "Fungos Tronco": tree.healthCheck?.trunkFungi,
      "Pragas Tronco": tree.healthCheck?.trunkPests,
      "Broca Tronco": tree.healthCheck?.trunkBorer,
      "Copa Seca": tree.healthCheck?.canopyDry,
      "Galhos Quebrados": tree.healthCheck?.canopyBroken,
      "Parasitas Copa": tree.healthCheck?.canopyParasite,
      "Raízes Calçada": tree.healthCheck?.rootsDamage,
      "Raízes Estrangulamento": tree.healthCheck?.rootsStrangling,
      "Rede Elétrica": tree.urbanInterferences?.powerGrid,
      "Sinalização": tree.urbanInterferences?.signaling,
      "Muros/Telhados": tree.urbanInterferences?.wallsTelhados,
      "Acessibilidade": tree.urbanInterferences?.accessibility,
      "Intervenção": tree.intervention,
      "Mês Poda": tree.suggestedMonth,
      "Data Última Poda": tree.lastPruningDate || "",
      "Histórico Podas": tree.pruningHistory || "",
      "Observações": tree.finalObservations || "",
      "Técnico": tree.technicianName,
      "Data Criação": tree.createdAt,
    };
  }

  // GET /api/sheets/health
  app.get("/api/sheets/health", async (req, res) => {
    try {
      const doc = await getSpreadsheet();
      res.json({ connected: true, title: doc.title });
    } catch (error: any) {
      console.error("[Google Sheets] Erro de conexão:", error.message);
      res.json({ connected: false, error: error.message });
    }
  });

  // GET /api/sheets/trees
  app.get("/api/sheets/trees", async (req, res) => {
    try {
      const sheet = await getSheet();
      const rows = await sheet.getRows();
      const trees = rows.map((row) => rowToTree(row));
      res.json({ success: true, data: trees });
    } catch (error: any) {
      console.error("Erro ao buscar árvores:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/sheets/trees
  app.post("/api/sheets/trees", async (req, res) => {
    try {
      const sheet = await getSheet();
      await sheet.addRow(treeToRow(req.body));
      res.json({ success: true, message: "Árvore adicionada" });
    } catch (error: any) {
      console.error("Erro ao adicionar árvore:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // PUT /api/sheets/trees/:id
  app.put("/api/sheets/trees/:id", async (req, res) => {
    try {
      const sheet = await getSheet();
      const rows = await sheet.getRows();
      const target = rows.find((r) => r["ID"] === req.params.id);
      if (target) {
        Object.assign(target, treeToRow(req.body));
        await target.save();
        res.json({ success: true, message: "Árvore atualizada" });
      } else {
        res.status(404).json({ error: "Árvore não encontrada na planilha" });
      }
    } catch (error: any) {
      console.error("Erro ao atualizar árvore:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // DELETE /api/sheets/trees/:id
  app.delete("/api/sheets/trees/:id", async (req, res) => {
    try {
      const sheet = await getSheet();
      const rows = await sheet.getRows();
      const target = rows.find((r) => r["ID"] === req.params.id);
      if (target) {
        await target.deleteRow();
        res.json({ success: true, message: "Árvore removida" });
      } else {
        res.status(404).json({ error: "Árvore não encontrada" });
      }
    } catch (error: any) {
      console.error("Erro ao remover árvore:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/sheets/sync
  app.post("/api/sheets/sync", async (req, res) => {
    try {
      const { localTrees } = req.body;
      const sheet = await getSheet();
      const rows = await sheet.getRows();
      const sheetTrees = rows.map((r) => rowToTree(r));

      const localMap = new Map(localTrees.map((t: any) => [t.id, t]));
      const sheetMap = new Map(sheetTrees.map((t: any) => [t.id, t]));

      const toUpload = localTrees.filter((t: any) => !sheetMap.has(t.id));
      for (const tree of toUpload) {
        await sheet.addRow(treeToRow(tree));
      }

      const toDownload = sheetTrees.filter((t: any) => !localMap.has(t.id));
      const merged = new Map<string, any>();
      localTrees.forEach((t: any) => merged.set(t.id, t));
      toDownload.forEach((t: any) => merged.set(t.id, t));

      res.json({
        success: true,
        data: Array.from(merged.values()),
        stats: { uploaded: toUpload.length, downloaded: toDownload.length },
      });
    } catch (error: any) {
      console.error("Erro na sincronização:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development or Static server for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Andradas Arbóreo Server] Executando em http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Falha ao inicializar o servidor Express:", err);
});
