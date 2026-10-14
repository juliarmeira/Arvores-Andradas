const SPREADSHEET_ID = '1f03SZqhFe4AbSd-Z4kg_MgBzDxg9ES-nzgLAiZfLDNU';
const SHEET_NAME = 'Página1';
const DETAILS_SHEET_NAME = 'Detalhes da Vistoria';
const API_VERSION = 7;
const WATER_SPREADSHEET_ID = '1BDuNmB5umdQLre8bDE-Ltuk0WCnl9pLT5kYYmFmzW6Y';
const WATER_SHEET_NAME = 'Todos';
const PROCESS_STATUSES = [
  'Aguardando Vistoria', 'Parecer em Elaboração', 'Enviado para Deliberação do CODEMA',
  'Encaminhado para Corte pela Secretaria de Obras', 'Aguardando Compensação',
  'Encaminhado para a Secretaria de Planejamento',
  'Compensado', 'Indeferido / Arquivado'
];

function ensureProcessStatusValidation(sheet) {
  const rows = Math.max(sheet.getMaxRows() - 1, 1);
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(PROCESS_STATUSES, true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, 15, rows, 1).setDataValidation(rule);
}

function ensureProcessDataColumns(sheet) {
  const headers = ['Dados da Vistoria 1', 'Dados da Vistoria 2', 'Dados da Vistoria 3', 'Dados da Vistoria 4', 'Atualizado em', 'Forma de Compensação'];
  if (sheet.getMaxColumns() < 22) sheet.insertColumnsAfter(sheet.getMaxColumns(), 22 - sheet.getMaxColumns());
  // A coluna P já pertence à planilha original e guarda o Fiscal.
  sheet.getRange(1, 17, 1, headers.length).setValues([headers]);
}

function ensureInspectionDetailsSheet(spreadsheet) {
  const headers = [
    'Número do Processo', 'Fiscal Responsável', 'Matrícula', 'Cargo',
    'Data de Cadastro', 'Data da Vistoria', 'Data de Atualização / Encaminhamento',
    'Data da Autorização', 'Data da Compensação', 'Solicitação do Requerente',
    'Intervenção', 'Finalidade', 'Quantidade de Árvores', 'Enquadramento da Área',
    'Árvore de Grande Porte', 'Valor Paisagístico / Histórico', 'Impacto Ambiental',
    'Alternativa ao Corte', 'Hipótese Especial', 'Conclusão Técnica', 'Executor',
    'Diagnóstico / Justificativa', 'Destino do Documento', 'Número do Ofício',
    'Destinatário', 'Parecer Completo', 'IDs no Inventário', 'Atualizado em'
  ];
  let sheet = spreadsheet.getSheetByName(DETAILS_SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(DETAILS_SHEET_NAME);
  if (sheet.getMaxColumns() < headers.length) sheet.insertColumnsAfter(sheet.getMaxColumns(), headers.length - sheet.getMaxColumns());
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.setFrozenRows(1);
  return sheet;
}

function configurarPlanilhas() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error('Aba Página1 não encontrada');
  ensureProcessStatusValidation(sheet);
  ensureProcessDataColumns(sheet);
  const detailsSheet = ensureInspectionDetailsSheet(spreadsheet);
  SpreadsheetApp.flush();
  return {
    ok: true,
    apiVersion: API_VERSION,
    processSheet: sheet.getName(),
    detailsSheet: detailsSheet.getName()
  };
}

function upsertInspectionDetails(spreadsheet, process) {
  const protocolo = String(process.protocolo || '').trim();
  if (!protocolo) return 0;
  const sheet = ensureInspectionDetailsSheet(spreadsheet);
  const lastRow = sheet.getLastRow();
  const protocolos = lastRow > 1 ? sheet.getRange(2, 1, lastRow - 1, 1).getDisplayValues() : [];
  let targetRow = 0;
  for (let i = protocolos.length - 1; i >= 0; i--) {
    if (String(protocolos[i][0]).trim() === protocolo) { targetRow = i + 2; break; }
  }
  if (!targetRow) targetRow = Math.max(lastRow + 1, 2);
  const inventoryIds = (process.trees || []).map(function(tree) { return tree.inventoryId; }).filter(Boolean).join(', ');
  const row = [
    protocolo, process.fiscalNome || (process.fiscal && process.fiscal.nome) || '',
    String(process.fiscalMatricula || (process.fiscal && process.fiscal.matricula) || '0') || '0',
    process.fiscalCargo || (process.fiscal && process.fiscal.cargo) || '',
    parseSheetDate(process.dataCadastro || process.data), parseSheetDate(process.dataVistoria),
    parseSheetDate(process.dataEncaminhamento), parseSheetDate(process.dataAutorizacao),
    parseSheetDate(process.dataCompensacao), process.solicitacaoRequerente || '',
    process.intervencaoLabel || process.intervencao || '', process.finalidade || '', process.quantidade || 0,
    process.areaLabel || process.area || '', process.grandeLabel || process.grande || '',
    process.valorLabel || process.valor || '', process.impactoLabel || process.impacto || '',
    process.alternativaLabel || process.alternativa || '', process.especialLabel || process.especial || '',
    process.conclusaoLabel || process.conclusao || '', process.executorLabel || process.executor || '',
    process.diagnostico || '', process.destinacaoLabel || process.destinacaoTipo || '',
    process.numeroOficio || '', process.destinatarioFormal || '', process.parecerTexto || '',
    inventoryIds || process.arvoreInventarioId || '', new Date()
  ];
  sheet.getRange(targetRow, 1, 1, row.length).setValues([row]);
  return targetRow;
}

function parseSheetDate(value) {
  if (!value) return '';
  if (Object.prototype.toString.call(value) === '[object Date]') return value;
  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return Utilities.parseDate(text, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(text)) return Utilities.parseDate(text, Session.getScriptTimeZone(), 'dd/MM/yyyy');
  return '';
}

function splitCellText(text, size) {
  const chunks = [];
  for (let i = 0; i < text.length; i += size) chunks.push(text.slice(i, i + size));
  while (chunks.length < 4) chunks.push('');
  if (chunks.length > 4) throw new Error('A vistoria excedeu o limite de armazenamento da planilha');
  return chunks;
}

// ─── doPost: grava uma nova linha na planilha ──────────────────────────────────────────
function doPost(e) {
  try {
    const p = JSON.parse(e.postData.contents);
    if (p.action === 'saveWaterPoint') {
      const pointsSheet = SpreadsheetApp.openById(WATER_SPREADSHEET_ID).getSheetByName('Pontos');
      if (!pointsSheet) throw new Error('Aba Pontos não encontrada');
      ['district', 'type', 'location', 'coordinates'].forEach(function(key) { if (!String(p[key] || '').trim()) throw new Error('Campo obrigatório ausente: ' + key); });
      const lock = LockService.getScriptLock(); lock.waitLock(15000);
      try {
        const lastRow = pointsSheet.getLastRow();
        const ids = lastRow > 1 ? pointsSheet.getRange(2, 1, lastRow - 1, 1).getDisplayValues() : [];
        let row = 0;
        if (p.id) for (let i = 0; i < ids.length; i++) if (String(ids[i][0]).trim() === String(p.id).trim()) { row = i + 2; break; }
        if (p.id && !row) throw new Error('Ponto não encontrado: ' + p.id);
        if (!row) {
          const nextId = ids.reduce(function(max, item) { const n = Number(item[0]); return isNaN(n) ? max : Math.max(max, n); }, 0) + 1;
          pointsSheet.appendRow([nextId, p.district, '', p.type, p.location, p.coordinates, p.source || '']);
          row = pointsSheet.getLastRow();
        } else {
          pointsSheet.getRange(row, 2).setValue(p.district);
          pointsSheet.getRange(row, 4, 1, 4).setValues([[p.type, p.location, p.coordinates, p.source || '']]);
        }
        SpreadsheetApp.flush();
        return ContentService.createTextOutput(JSON.stringify({ ok: true, apiVersion: API_VERSION, row: row, id: pointsSheet.getRange(row, 1).getDisplayValue() })).setMimeType(ContentService.MimeType.JSON);
      } finally { lock.releaseLock(); }
    }
    if (p.action === 'addWaterRecord' || p.module === 'water') {
      const required = ['clientId', 'date', 'district', 'pointType', 'location'];
      required.forEach(function(key) { if (!String(p[key] || '').trim()) throw new Error('Campo obrigatório ausente: ' + key); });
      const properties = PropertiesService.getScriptProperties();
      const propertyKey = 'water_' + String(p.clientId).replace(/[^a-zA-Z0-9_-]/g, '');
      const existingRow = properties.getProperty(propertyKey);
      if (existingRow) return ContentService.createTextOutput(JSON.stringify({ ok: true, apiVersion: API_VERSION, row: Number(existingRow), duplicate: true })).setMimeType(ContentService.MimeType.JSON);
      const waterSheet = SpreadsheetApp.openById(WATER_SPREADSHEET_ID).getSheetByName(WATER_SHEET_NAME);
      if (!waterSheet) throw new Error('Aba Todos não encontrada na planilha de água');
      const lock = LockService.getScriptLock(); lock.waitLock(15000);
      try {
        const lastRow = waterSheet.getLastRow();
        const ids = lastRow > 1 ? waterSheet.getRange(2, 1, lastRow - 1, 1).getValues() : [];
        const nextId = ids.reduce(function(max, row) { const n = Number(row[0]); return isNaN(n) ? max : Math.max(max, n); }, 0) + 1;
        const date = Utilities.parseDate(String(p.date), Session.getScriptTimeZone(), 'yyyy-MM-dd');
        waterSheet.appendRow([nextId, date, p.district, p.pointType, p.location, p.chlorinator || '', p.turbidity === null ? '' : p.turbidity, p.color === null ? '' : p.color, p.chlorine === null ? '' : p.chlorine, p.ph === null ? '' : p.ph, p.sdt === null ? '' : p.sdt, p.temperature === null ? '' : p.temperature]);
        const row = waterSheet.getLastRow(); properties.setProperty(propertyKey, String(row)); SpreadsheetApp.flush();
        return ContentService.createTextOutput(JSON.stringify({ ok: true, apiVersion: API_VERSION, row: row, id: nextId })).setMimeType(ContentService.MimeType.JSON);
      } finally { lock.releaseLock(); }
    }
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);
    if (!sheet) throw new Error('Aba Página1 não encontrada');
    if (p.action === 'upsertProcess') {
      const process = p.process || {};
      const protocolo = String(process.protocolo || p.protocolo || '').trim();
      if (!protocolo) throw new Error('Protocolo obrigatório para sincronizar a vistoria');
      const lock = LockService.getScriptLock(); lock.waitLock(15000);
      try {
        ensureProcessStatusValidation(sheet);
        ensureProcessDataColumns(sheet);
        const lastRow = sheet.getLastRow();
        const protocolos = lastRow > 1 ? sheet.getRange(2, 2, lastRow - 1, 1).getDisplayValues() : [];
        let targetRow = 0;
        for (let i = protocolos.length - 1; i >= 0; i--) {
          if (String(protocolos[i][0]).trim() === protocolo) { targetRow = i + 2; break; }
        }
        if (!targetRow) targetRow = Math.max(lastRow + 1, 2);
        const json = JSON.stringify(process);
        const chunks = splitCellText(json, 45000);
        const coords = process.coordenadas || {};
        const row = [
          parseSheetDate(process.data || p.data), protocolo, process.requerente || p.solicitante || '',
          process.endereco || p.endereco || '', process.solicitacaoRequerente || p.solicitacao || process.intervencaoLabel || process.intervencao || '',
          coords.lat || p.coordCorte1 || '', coords.lng || p.coordCorte2 || '',
          process.responsavelCorte || p.responsavelCorte || '', process.autorizacao || p.autorizacao || '',
          parseSheetDate(process.dataAutorizacao || p.dataAutorizacao), process.compensacao || p.compensacao || '',
          parseSheetDate(process.prazo || p.prazo), process.coordComp1 || p.coordComp1 || '',
          process.coordComp2 || p.coordComp2 || '', process.situacao || p.situacao || 'Aguardando Vistoria',
          process.fiscalNome || (process.fiscal && process.fiscal.nome) || p.fiscalNome || '',
          chunks[0], chunks[1], chunks[2], chunks[3], new Date(), process.formaCompensacaoLabel || process.formaCompensacao || p.formaCompensacaoLabel || p.formaCompensacao || ''
        ];
        sheet.getRange(targetRow, 1, 1, row.length).setValues([row]);
        const detailsRow = upsertInspectionDetails(spreadsheet, process);
        SpreadsheetApp.flush();
        return ContentService.createTextOutput(JSON.stringify({ ok: true, apiVersion: API_VERSION, row: targetRow, detailsRow: detailsRow, protocolo: protocolo, updated: targetRow <= lastRow })).setMimeType(ContentService.MimeType.JSON);
      } finally { lock.releaseLock(); }
    }
    if (p.action === 'updateStatus') {
      const protocolo = String(p.protocolo || '').trim();
      const situacao = String(p.situacao || '').trim();
      if (!protocolo || !situacao) throw new Error('Protocolo e situação são obrigatórios');

      const lastRow = sheet.getLastRow();
      const protocolos = lastRow > 1 ? sheet.getRange(2, 2, lastRow - 1, 1).getDisplayValues() : [];
      let targetRow = 0;
      for (let i = protocolos.length - 1; i >= 0; i--) {
        if (String(protocolos[i][0]).trim() === protocolo) {
          targetRow = i + 2;
          break;
        }
      }
      if (!targetRow) throw new Error('Processo não encontrado: ' + protocolo);

      ensureProcessStatusValidation(sheet);
      ensureProcessDataColumns(sheet);
      sheet.getRange(targetRow, 15).setValue(situacao);
      if (p.compensacao) sheet.getRange(targetRow, 11).setValue(String(p.compensacao));
      if (p.formaCompensacaoLabel || p.formaCompensacao) sheet.getRange(targetRow, 22).setValue(String(p.formaCompensacaoLabel || p.formaCompensacao));
      sheet.getRange(targetRow, 21).setValue(new Date());
      if (p.process) {
        p.process.situacao = situacao;
        p.process.compensacao = p.compensacao || p.process.compensacao || '';
        p.process.formaCompensacao = p.formaCompensacao || p.process.formaCompensacao || '';
        p.process.dataCompensacao = p.dataCompensacao || p.process.dataCompensacao || '';
        p.process.dataEncaminhamento = p.dataEncaminhamento || p.process.dataEncaminhamento || '';
        p.process.updatedAt = new Date().toISOString();
        const processChunks = splitCellText(JSON.stringify(p.process), 45000);
        sheet.getRange(targetRow, 16).setValue(String(p.process.fiscalNome || (p.process.fiscal && p.process.fiscal.nome) || ''));
        sheet.getRange(targetRow, 17, 1, 4).setValues([processChunks]);
        upsertInspectionDetails(spreadsheet, p.process);
      }
      SpreadsheetApp.flush();
      return ContentService
        .createTextOutput(JSON.stringify({ ok: true, apiVersion: API_VERSION, row: targetRow, protocolo: protocolo, situacao: situacao }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    const brDate = value => value ? Utilities.parseDate(value, Session.getScriptTimeZone(), 'dd/MM/yyyy') : '';
    ensureProcessStatusValidation(sheet);
    sheet.appendRow([
      brDate(p.data), p.protocolo || '', p.solicitante || '', p.endereco || '', p.solicitacao || '',
      p.coordCorte1 || '', p.coordCorte2 || '', p.responsavelCorte || '', p.autorizacao || '',
      brDate(p.dataAutorizacao), p.compensacao || '', brDate(p.prazo), p.coordComp1 || '',
      p.coordComp2 || '', p.situacao || 'Aguardando Compensação', p.fiscalNome || '', '', '', '', '', new Date(), p.formaCompensacaoLabel || p.formaCompensacao || ''
    ]);
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, apiVersion: API_VERSION, row: sheet.getLastRow() }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ─── doGet: retorna todos os registros como JSON para o Mapa de Árvores ──────
function doGet(e) {
  if (e && e.parameter && e.parameter.action === 'capabilities') {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, apiVersion: API_VERSION }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    if (!sheet) throw new Error('Aba não encontrada');

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return ContentService
        .createTextOutput(JSON.stringify({ ok: true, apiVersion: API_VERSION, trees: [], processes: [] }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Colunas (0-based):
    // 0=data, 1=protocolo, 2=solicitante, 3=endereco, 4=solicitacao,
    // 5=coordCorte1(lat), 6=coordCorte2(lng), 7=responsavelCorte, 8=autorizacao,
    // 9=dataAutorizacao, 10=compensacao, 11=prazo, 12=coordComp1, 13=coordComp2,
    // 14=situacao, 15=fiscal, 16..19=dados JSON, 20=atualizado em, 21=forma de compensacao
    const trees = [];
    const processes = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const protocolo = String(row[1] || '').trim();
      if (!protocolo) continue;

      const formatDate = value => value
        ? Utilities.formatDate(new Date(value), Session.getScriptTimeZone(), 'yyyy-MM-dd')
        : '';

      // Todos os registros pertencem ao painel de processos da Vistoria.
      // Coordenadas não são obrigatórias para um processo aparecer na lista.
      let details = {};
      try { details = JSON.parse(row.slice(16, 20).join('') || '{}'); } catch (ignore) {}
      const baseProcess = {
        id: 'SHEET-' + (i + 1) + '-' + protocolo,
        protocolo: protocolo,
        data: formatDate(row[0]),
        requerente: String(row[2] || ''),
        endereco: String(row[3] || ''),
        solicitacaoRequerente: String(row[4] || ''),
        intervencao: String(row[4] || ''),
        intervencaoLabel: String(row[4] || ''),
        situacao: String(row[14] || 'Em Análise'),
        coordenadas: {
          lat: String(row[5] || ''),
          lng: String(row[6] || '')
        },
        responsavelCorte: String(row[7] || ''),
        autorizacao: String(row[8] || ''),
        dataAutorizacao: formatDate(row[9]),
        compensacao: String(row[10] || ''),
        fiscalNome: String(row[15] || ''),
        formaCompensacaoLabel: String(row[21] || ''),
        prazo: formatDate(row[11]),
        coordComp1: String(row[12] || ''),
        coordComp2: String(row[13] || ''),
        parecerTexto: ''
      };
      processes.push(Object.assign({}, baseProcess, details, {
        id: details.id || baseProcess.id,
        protocolo: protocolo,
        situacao: baseProcess.situacao,
        coordenadas: details.coordenadas || baseProcess.coordenadas
      }));

      const lat = parseFloat(String(row[5]).replace(',', '.'));
      const lng = parseFloat(String(row[6]).replace(',', '.'));
      if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) continue;

      trees.push({
        protocolo:   protocolo,
        fiscalNome:  String(details.fiscalNome || row[15] || ''),
        fiscalMatricula: String(details.fiscalMatricula || '0'),
        solicitante: String(row[2] || ''),
        endereco:    String(row[3] || ''),
        solicitacao: String(row[4] || ''),
        lat:         lat,
        lng:         lng,
        autorizacao: String(row[8] || ''),
        compensacao: String(row[10] || ''),
        situacao:    String(row[14] || 'Aguardando'),
        data:        row[0] ? Utilities.formatDate(new Date(row[0]), Session.getScriptTimeZone(), 'dd/MM/yyyy') : ''
      });
    }

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, apiVersion: API_VERSION, trees: trees, processes: processes }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
