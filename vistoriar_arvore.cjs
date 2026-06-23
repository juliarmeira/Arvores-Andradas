const { readFile, writeFile, access, constants } = require("fs/promises");
const { resolve, basename, extname } = require("path");
const { createInterface } = require("readline");

const FS = require("fs");
let API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
if (!API_KEY) {
  try {
    const cfg = FS.readFileSync(resolve(__dirname, ".env"), "utf-8");
    const m = cfg.match(/GEMINI_API_KEY\s*=\s*(.+)/);
    if (m) API_KEY = m[1].trim();
  } catch {}
}

function perguntar(prompt) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((r) => rl.question(prompt, (a) => { rl.close(); r(a); }));
}

function dataHora() {
  return new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

function dataISO() {
  const d = new Date();
  const dia = String(d.getDate()).padStart(2, "0");
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const ano = d.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

function stamp() {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}_${String(d.getHours()).padStart(2,"0")}${String(d.getMinutes()).padStart(2,"0")}`;
}

async function imagemParaBase64(caminho) {
  const data = await readFile(caminho);
  const ext = extname(caminho).slice(1).toLowerCase();
  const mime = ext === "jpg" ? "jpeg" : ["jpeg", "png", "webp"].includes(ext) ? ext : "jpeg";
  return { inlineData: { data: data.toString("base64"), mimeType: `image/${mime}` } };
}

const PROMPT_VISTORIA = `Você é um botânico forense e fiscal ambiental especializado em vistorias técnicas para avaliação de corte de árvores. Analise a foto com rigor técnico e gere um LAUDO TÉCNICO no formato abaixo:

---
LAUDO DE VISTORIA TÉCNICA – IDENTIFICAÇÃO E AVALIAÇÃO FITOSSANITÁRIA
---

1. IDENTIFICAÇÃO DA ESPÉCIE
   Nome científico:
   Nomes populares:
   Família:
   Origem (nativa/exótica):

2. CARACTERÍSTICAS DA ÁRVORE
   Porte estimado (altura, diâmetro de tronco, copa):
   Estádio de desenvolvimento (jovem/adulto/senil):

3. AVALIAÇÃO FITOSSANITÁRIA (examine a imagem em busca de):
   - Sinais de pragas e doenças (cupins, fungos, brocas, cancros)
   - Danos mecânicos (rachaduras, podas inadequadas, lesões)
   - Deformidades no tronco ou copa
   - Inclinação/perigo de queda
   - Afloramento radicular e danos a calçadas/muros
   - Estado geral da casca e folhagem
   - Presença de matacão, ocos ou apodrecimento
   Nível de risco: (Baixo / Médio / Alto)

4. CONFLITO COM ESTRUTURAS URBANAS
   (Baseie-se apenas no que é visível: calçada, muro, fiação, construção)

5. RECOMENDAÇÃO TÉCNICA
   - Parecer para corte: (FAVORÁVEL / DESFAVORÁVEL / NECESSITA AVALIAÇÃO PRESENCIAL)
   - Justificativa técnica:
   - Condicionantes (se aplicável):
   - Medidas mitigatórias sugeridas (ex: plantio compensatório):

6. GRAU DE CONFIANÇA DA IDENTIFICAÇÃO
   (Alto / Médio / Baixo - justifique)
---

IMPORTANTE: Seja conservador. Se não for possível avaliar algo pela foto, indique "Não é possível avaliar pela imagem disponível".`;

async function analisarComGemini(caminhoImagem) {
  const imagem = await imagemParaBase64(caminhoImagem);
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: PROMPT_VISTORIA }, imagem] }],
        generationConfig: { temperature: 0.15, maxOutputTokens: 8192 },
      }),
    }
  );
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const texto = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!texto) throw new Error("Resposta vazia da API");
  return texto.trim();
}

function extrairParecer(laudo) {
  const match = laudo.match(/Parecer para corte:\s*(FAVORÁVEL|DESFAVORÁVEL|NECESSITA AVALIAÇÃO PRESENCIAL)/i);
  return match ? match[1].toUpperCase() : "NÃO IDENTIFICADO";
}

function extrairEspecie(laudo) {
  const match = laudo.match(/Nome científico:\s*(.+)/i);
  return match ? match[1].trim() : "Não identificada";
}

function gerarHTML(dados) {
  const parecerClass = {
    "FAVORÁVEL": "parecer-favoravel",
    "DESFAVORÁVEL": "parecer-desfavoravel",
    "NECESSITA AVALIAÇÃO PRESENCIAL": "parecer-presencial",
  }[dados.parecer] || "parecer-presencial";

  const justHtml = dados.justificativa
    ? `<div class="secao"><h3>JUSTIFICATIVA COMPLEMENTAR</h3><pre>${dados.justificativa}</pre></div>`
    : "";
  const condHtml = dados.condicionantes
    ? `<div class="secao"><h3>CONDICIONANTES / RECOMENDAÇÕES</h3><pre>${dados.condicionantes}</pre></div>`
    : "";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Parecer Técnico - ${dados.numero}</title>
<style>
  @page { size: A4; margin: 2cm 2.5cm; }
  @media print {
    body { margin: 0; padding: 0; }
    .nao-imprimir { display: none !important; }
    .assinatura { page-break-inside: avoid; }
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Times New Roman', Times, serif;
    font-size: 12pt;
    line-height: 1.6;
    color: #1a1a1a;
    background: #fff;
    padding: 2.5cm;
  }

  /* CABEÇALHO */
  .cabecalho {
    text-align: center;
    border-bottom: 3px double #000;
    padding-bottom: 15px;
    margin-bottom: 25px;
  }
  .cabecalho .prefeitura {
    font-size: 11pt;
    color: #333;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 5px;
  }
  .cabecalho .departamento {
    font-size: 10pt;
    color: #555;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  /* TÍTULO */
  .titulo {
    text-align: center;
    font-size: 15pt;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin: 25px 0;
    padding: 10px 0;
    border-top: 1px solid #000;
    border-bottom: 1px solid #000;
  }

  /* CAMPOS DO DOCUMENTO */
  .campo {
    display: flex;
    padding: 6px 0;
    border-bottom: 1px dotted #ccc;
  }
  .campo .rotulo {
    font-weight: bold;
    min-width: 180px;
    color: #333;
  }
  .campo .valor {
    flex: 1;
  }

  /* TABELA DE DADOS */
  .tabela-dados {
    width: 100%;
    border-collapse: collapse;
    margin: 15px 0;
    border: 1px solid #000;
  }
  .tabela-dados th {
    background: #f0f0f0;
    text-align: left;
    padding: 8px 10px;
    font-weight: bold;
    border: 1px solid #000;
    font-size: 10pt;
    text-transform: uppercase;
  }
  .tabela-dados td {
    padding: 6px 10px;
    border: 1px solid #000;
    vertical-align: top;
  }

  /* SEÇÕES */
  .secao {
    margin: 20px 0;
    page-break-inside: avoid;
  }
  .secao h3 {
    font-size: 12pt;
    font-weight: bold;
    text-transform: uppercase;
    border-bottom: 1px solid #000;
    padding-bottom: 5px;
    margin-bottom: 10px;
  }
  .secao pre {
    white-space: pre-wrap;
    font-family: 'Times New Roman', Times, serif;
    font-size: 12pt;
    line-height: 1.6;
    text-align: justify;
  }

  /* PARECER */
  .bloco-parecer {
    margin: 25px 0;
    padding: 15px 20px;
    border: 2px solid #000;
    text-align: center;
    page-break-inside: avoid;
  }
  .bloco-parecer .label {
    font-size: 10pt;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 8px;
    color: #555;
  }
  .bloco-parecer .resultado {
    font-size: 16pt;
    font-weight: bold;
    text-transform: uppercase;
  }
  .parecer-favoravel { background: #e8f5e9; color: #1b5e20; }
  .parecer-favoravel .resultado { color: #1b5e20; }
  .parecer-desfavoravel { background: #ffebee; color: #b71c1c; }
  .parecer-desfavoravel .resultado { color: #b71c1c; }
  .parecer-presencial { background: #fff8e1; color: #f57f17; }
  .parecer-presencial .resultado { color: #f57f17; }

  /* ASSINATURA */
  .assinatura {
    margin-top: 60px;
    text-align: center;
    page-break-inside: avoid;
  }
  .assinatura .linha-assinatura {
    width: 300px;
    border-top: 1px solid #000;
    margin: 0 auto 8px;
    padding-top: 5px;
  }
  .assinatura .nome {
    font-weight: bold;
    font-size: 12pt;
  }
  .assinatura .cargo {
    font-size: 11pt;
    color: #333;
  }
  .assinatura .matricula {
    font-size: 10pt;
    color: #666;
  }

  /* RODAPÉ */
  .rodape {
    margin-top: 40px;
    padding-top: 10px;
    border-top: 1px solid #999;
    font-size: 9pt;
    color: #666;
    text-align: center;
    line-height: 1.4;
  }

  /* FOTO */
  .foto-container {
    text-align: center;
    margin: 15px 0;
    page-break-inside: avoid;
  }
  .foto-container img {
    max-width: 100%;
    max-height: 400px;
    border: 1px solid #ccc;
  }
  .foto-caption {
    font-size: 9pt;
    color: #666;
    margin-top: 5px;
    font-style: italic;
  }
</style>
</head>
<body>

<!-- CABEÇALHO -->
<div class="cabecalho">
  <div class="prefeitura">Prefeitura Municipal</div>
  <div class="departamento">Divisão de Meio Ambiente</div>
</div>

<!-- TÍTULO -->
<div class="titulo">Parecer Técnico de Vistoria Ambiental</div>

<!-- DADOS DO PARECER -->
<div class="campo">
  <span class="rotulo">Nº do Parecer:</span>
  <span class="valor">${dados.numero}</span>
</div>
<div class="campo">
  <span class="rotulo">Data da Vistoria:</span>
  <span class="valor">${dados.dataVistoria}</span>
</div>

<!-- TABELA DE IDENTIFICAÇÃO -->
<table class="tabela-dados">
  <tr>
    <th colspan="2">Dados de Identificação</th>
  </tr>
  <tr>
    <td style="width:180px"><strong>Fiscal Responsável:</strong></td>
    <td>${dados.fiscal}</td>
  </tr>
  <tr>
    <td><strong>Matrícula:</strong></td>
    <td>${dados.matricula}</td>
  </tr>
  <tr>
    <td><strong>Solicitante:</strong></td>
    <td>${dados.solicitante}</td>
  </tr>
  <tr>
    <td><strong>Endereço:</strong></td>
    <td>${dados.endereco}, ${dados.bairro} - ${dados.cidade}</td>
  </tr>
  <tr>
    <td><strong>Coordenadas GPS:</strong></td>
    <td>${dados.coordenadas}</td>
  </tr>
</table>

<!-- FOTO -->
<div class="foto-container">
  <img src="file:///${dados.foto}" alt="Foto da árvore vistoriada">
  <div class="foto-caption">Foto registrada durante a vistoria</div>
</div>

<!-- LAUDO TÉCNICO -->
<div class="secao">
  <h3>Laudo Técnico</h3>
  <pre>${dados.laudo}</pre>
</div>

<!-- PARECER -->
<div class="bloco-parecer ${parecerClass}">
  <div class="label">Parecer para Corte</div>
  <div class="resultado">${dados.parecer}</div>
</div>

<!-- JUSTIFICATIVA -->
${justHtml}

<!-- CONDICIONANTES -->
${condHtml}

<!-- ASSINATURA -->
<div class="assinatura">
  <div class="linha-assinatura"></div>
  <div class="nome">${dados.fiscal}</div>
  <div class="cargo">Fiscal de Meio Ambiente</div>
  <div class="matricula">Matrícula nº ${dados.matricula}</div>
</div>

<!-- RODAPÉ -->
<div class="rodape">
  <p>Documento gerado com auxílio de ferramenta de Inteligência Artificial.</p>
  <p>O fiscal responsável deve validar todas as informações antes da emissão oficial.</p>
  <p>${dados.dataParecer}</p>
</div>

</body>
</html>`;
}

async function main() {
  console.log("\n" + "=".repeat(64));
  console.log("  SISTEMA DE VISTORIA AMBIENTAL - PARECER DE CORTE DE ÁRVORE");
  console.log("=".repeat(64) + "\n");

  if (!API_KEY) {
    console.error("Erro: defina a variavel GEMINI_API_KEY");
    console.error("  set GEMINI_API_KEY=sua_chave_aqui");
    console.error("  Chave gratuita em: https://aistudio.google.com/apikey\n");
    process.exit(1);
  }

  const foto = process.argv[2];
  if (!foto) {
    console.log("Uso: node vistoriar_arvore.cjs caminho/da/foto.jpg");
    console.log("     ou arraste a foto sobre o .exe\n");
    process.exit(1);
  }

  const caminhoFoto = resolve(foto);
  try { await access(caminhoFoto, constants.R_OK); }
  catch { console.error(`Erro: arquivo nao encontrado: ${caminhoFoto}`); process.exit(1); }

  console.log("--- DADOS DA VISTORIA ---\n");
  const dados = {
    foto: caminhoFoto,
    numero: await perguntar("  Numero do parecer / protocolo: ") || `PEA-${stamp()}`,
    dataVistoria: await perguntar("  Data da vistoria (Enter = hoje): ") || dataISO(),
    fiscal: await perguntar("  Nome do fiscal responsavel: "),
    matricula: await perguntar("  Matricula / RF: "),
    solicitante: await perguntar("  Solicitante (nome do requerente): "),
    endereco: await perguntar("  Logradouro: "),
    bairro: await perguntar("  Bairro: "),
    cidade: await perguntar("  Cidade / UF: "),
    coordenadas: await perguntar("  Coordenadas GPS (opcional): ") || "Nao informado",
  };

  console.log("\n--- ANALISANDO FOTO COM IA ---");
  console.log("  Identificando especie e avaliando saude...\n");

  let laudo;
  try {
    laudo = await analisarComGemini(caminhoFoto);
  } catch (err) {
    console.error(`\nErro na analise: ${err.message}`);
    process.exit(1);
  }

  dados.parecer = extrairParecer(laudo);
  dados.especie = extrairEspecie(laudo);
  dados.laudo = laudo;

  console.log("=".repeat(64));
  console.log(laudo);
  console.log("=".repeat(64));
  console.log(`\n>>> PARECER: ${dados.parecer} <<<\n`);

  dados.justificativa = await perguntar("Justificativa complementar do fiscal (opcional, Enter para pular):\n  ");
  dados.condicionantes = await perguntar("Condicionantes / recomendacoes (opcional, Enter para pular):\n  ");
  dados.dataParecer = dataHora();

  console.log("\n--- GERANDO RELATORIOS ---");

  const baseNome = basename(foto, extname(foto)).replace(/[^a-zA-Z0-9_-]/g, "_");
  const ts = stamp();
  const txtPath = resolve(`parecer_${baseNome}_${ts}.txt`);
  const htmlPath = resolve(`parecer_${baseNome}_${ts}.html`);

  let txt = [
    "=".repeat(70),
    "  PARECER TECNICO DE VISTORIA AMBIENTAL",
    "=".repeat(70),
    "",
    `Numero do Parecer:     ${dados.numero}`,
    `Data da Vistoria:      ${dados.dataVistoria}`,
    `Fiscal Responsavel:    ${dados.fiscal}`,
    `Matricula:             ${dados.matricula}`,
    `Solicitante:           ${dados.solicitante}`,
    `Logradouro:            ${dados.endereco}`,
    `Bairro:                ${dados.bairro}`,
    `Cidade/UF:             ${dados.cidade}`,
    `Coordenadas:           ${dados.coordenadas}`,
    `Foto:                  ${dados.foto}`,
    "",
    "-".repeat(70),
    "ESPECIE IDENTIFICADA: " + dados.especie,
    "PARECER PARA CORTE:   " + dados.parecer,
    "-".repeat(70),
    "",
    "LAUDO TECNICO:",
    "",
    laudo,
    "",
  ].join("\n");

  if (dados.justificativa) {
    txt += "\n\nJUSTIFICATIVA COMPLEMENTAR DO FISCAL:\n" + dados.justificativa + "\n";
  }
  if (dados.condicionantes) {
    txt += "\nCONDICIONANTES / RECOMENDACOES:\n" + dados.condicionantes + "\n";
  }

  txt += [
    "",
    "-".repeat(70),
    `Parecer emitido em: ${dados.dataParecer}`,
    `Fiscal: ${dados.fiscal} - Matr. ${dados.matricula}`,
    "",
    "Nota: Este parecer foi elaborado com auxilio de ferramenta de IA.",
    "O fiscal responsavel deve validar todas as informacoes antes da emissao oficial.",
    "",
  ].join("\n");

  await writeFile(txtPath, txt, "utf-8");
  console.log(`  TXT:  ${txtPath}`);

  await writeFile(htmlPath, gerarHTML(dados), "utf-8");
  console.log(`  HTML: ${htmlPath}`);

  console.log("\n=== RELATORIOS GERADOS COM SUCESSO ===");
  console.log(`  Especie: ${dados.especie}`);
  console.log(`  Parecer: ${dados.parecer}`);
  console.log(`  Proximo passo: abra o .html no navegador para imprimir em PDF\n`);
}

main();
