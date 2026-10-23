const SPREADSHEET_ID = '1f03SZqhFe4AbSd-Z4kg_MgBzDxg9ES-nzgLAiZfLDNU';
const SHEET_NAME = 'Página1';
const DETAILS_SHEET_NAME = 'Detalhes da Vistoria';
const API_VERSION = 8;
const WATER_SPREADSHEET_ID = '1BDuNmB5umdQLre8bDE-Ltuk0WCnl9pLT5kYYmFmzW6Y';
const WATER_SHEET_NAME = 'Todos';
function normalizeProcessHeader(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
}

function processHeaderMap(sheet) {
  if (!sheet) {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    sheet = spreadsheet.getSheetByName(SHEET_NAME);
    if (!sheet) throw new Error('Aba Página1 não encontrada');
  }
  const lastColumn = Math.max(sheet.getLastColumn(), 1);
  const headers = sheet.getRange(1, 1, 1, lastColumn).getDisplayValues()[0];
  const map = {};
  headers.forEach(function(header, index) {
    const key = normalizeProcessHeader(header);
    if (key && !map[key]) map[key] = index + 1;
  });
  return map;
}

function ensureProcessDataColumns(sheet) {
  // A Página1 é uma base já existente. Nunca inserir, excluir, mover ou renomear
  // colunas automaticamente: apenas validar e usar os cabeçalhos atuais.
  const required = [
    'Data', 'Protocolo', 'Solicitante', 'Telefone', 'Solicitação', 'Endereço',
    'Coordenada 1 Corte', 'Coordenada 2 Corte', 'Responsável Corte', 'Autorização',
    'Data da Autorização', 'Compensação', 'Prazo', 'Coordenada 1 Comp.', 'Coordenada 2 Comp.',
    'Dados da Vistoria 1', 'Dados da Vistoria 2', 'Dados da Vistoria 3',
    'Dados da Vistoria 4', 'Atualizado em', 'Forma de Compensação'
  ];
  const map = processHeaderMap(sheet);
  const missing = required.filter(function(header) {
    return !processColumn(map, header);
  });
  if (missing.length) throw new Error('Cabeçalhos obrigatórios ausentes na Página1: ' + missing.join(', '));
  // Remove any lingering data validation on inspection data columns (P‑U) to allow JSON storage.
  const inspectionCols = ['Dados da Vistoria 1', 'Dados da Vistoria 2', 'Dados da Vistoria 3', 'Dados da Vistoria 4', 'Atualizado em', 'Forma de Compensação'];
  inspectionCols.forEach(function(header) {
    const col = processColumn(map, header);
    if (col) {
      try {
        sheet.getRange(2, col, Math.max(sheet.getMaxRows() - 1, 1)).clearDataValidations();
      } catch (e) {}
    }
  });
  return map;
}

function processColumn(map, header) {
  return map[normalizeProcessHeader(header)] || 0;
}

function setProcessValues(sheet, row, map, values) {
  Object.keys(values).forEach(function(header) {
    const column = processColumn(map, header);
    if (column) {
      const cell = sheet.getRange(row, column);
      try {
        cell.setValue(values[header]);
      } catch (err) {
        // Se a célula tiver regra de validação conflitante (ex: P274 antiga coluna de Situação),
        // limpa a validação da célula e grava novamente:
        try {
          cell.clearDataValidations();
          cell.setValue(values[header]);
        } catch (innerErr) {
          throw err;
        }
      }
    }
  });
}

function processCell(row, map, header) {
  const column = processColumn(map, header);
  return column ? row[column - 1] : '';
}

function processDetailsFromValues(row, map) {
  const raw = ['Dados da Vistoria 1', 'Dados da Vistoria 2', 'Dados da Vistoria 3', 'Dados da Vistoria 4']
    .map(function(header) { return String(processCell(row, map, header) || ''); })
    .join('');
  if (!raw.trim()) return {};
  try {
    return JSON.parse(raw);
  } catch (ignore) {
    return {};
  }
}

function normalizedCoordinate(value, maxAbsolute) {
  const original = String(value == null ? '' : value).trim();
  if (!original) return '';
  let candidate = original.replace(/\s+/g, '');
  if (candidate.indexOf(',') !== -1) {
    candidate = candidate.indexOf('.') !== -1
      ? candidate.replace(/\./g, '').replace(',', '.')
      : candidate.replace(',', '.');
  } else if ((candidate.match(/\./g) || []).length > 1) {
    const parts = candidate.split('.');
    candidate = parts.shift() + '.' + parts.join('');
  }
  let number = Number(candidate);
  if (!isFinite(number)) return original;
  while (Math.abs(number) > maxAbsolute && Math.abs(number) >= 10) number /= 10;
  return Math.abs(number) <= maxAbsolute ? String(number) : original;
}

function coordinateForSheet(value, maxAbsolute) {
  const normalized = normalizedCoordinate(value, maxAbsolute);
  if (!normalized) return '';
  const number = Number(normalized);
  return isFinite(number) && Math.abs(number) <= maxAbsolute ? number : normalized;
}

function ensureProcessStatusValidation(sheet) {
  return ensureProcessDataColumns(sheet);
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
        const processColumns = ensureProcessStatusValidation(sheet);
        const lastRow = sheet.getLastRow();
        const protocolColumn = processColumn(processColumns, 'Protocolo');
        const protocolos = lastRow > 1 ? sheet.getRange(2, protocolColumn, lastRow - 1, 1).getDisplayValues() : [];
        let targetRow = 0;
        for (let i = protocolos.length - 1; i >= 0; i--) {
          if (String(protocolos[i][0]).trim() === protocolo) { targetRow = i + 2; break; }
        }
        if (!targetRow) targetRow = Math.max(lastRow + 1, 2);
        const chunks = splitCellText(JSON.stringify(process), 45000);
        const coords = process.coordenadas || {};
        setProcessValues(sheet, targetRow, processColumns, {
          'Data': parseSheetDate(process.data || p.data),
          'Protocolo': protocolo,
          'Solicitante': process.requerente || p.solicitante || '',
          'Telefone': process.telefone || p.telefone || '',
          'Solicitação': process.solicitacaoRequerente || p.solicitacao || process.intervencaoLabel || process.intervencao || '',
          'Endereço': process.endereco || p.endereco || '',
          'Coordenada 1 Corte': coordinateForSheet(coords.lat || p.coordCorte1, 90),
          'Coordenada 2 Corte': coordinateForSheet(coords.lng || p.coordCorte2, 180),
          'Responsável Corte': process.responsavelCorte || p.responsavelCorte || '',
          'Autorização': process.autorizacao || p.autorizacao || '',
          'Data da Autorização': parseSheetDate(process.dataAutorizacao || p.dataAutorizacao),
          'Compensação': process.compensacao || p.compensacao || '',
          'Prazo': parseSheetDate(process.prazo || p.prazo),
          'Coordenada 1 Comp.': coordinateForSheet(process.coordComp1 || p.coordComp1, 90),
          'Coordenada 2 Comp.': coordinateForSheet(process.coordComp2 || p.coordComp2, 180),
          'Situação': process.situacao || p.situacao || 'Aguardando Vistoria',
          'Fiscal': process.fiscalNome || (process.fiscal && process.fiscal.nome) || p.fiscalNome || '',
          'Dados da Vistoria 1': chunks[0],
          'Dados da Vistoria 2': chunks[1],
          'Dados da Vistoria 3': chunks[2],
          'Dados da Vistoria 4': chunks[3],
          'Atualizado em': new Date(),
          'Forma de Compensação': process.formaCompensacaoLabel || process.formaCompensacao || p.formaCompensacaoLabel || p.formaCompensacao || ''
        });
        const detailsRow = upsertInspectionDetails(spreadsheet, process);
        SpreadsheetApp.flush();
        return ContentService.createTextOutput(JSON.stringify({ ok: true, apiVersion: API_VERSION, row: targetRow, detailsRow: detailsRow, protocolo: protocolo, updated: targetRow <= lastRow })).setMimeType(ContentService.MimeType.JSON);
      } finally { lock.releaseLock(); }
    }
    if (p.action === 'updateStatus') {
      const protocolo = String(p.protocolo || '').trim();
      const situacao = String(p.situacao || '').trim();
      if (!protocolo || !situacao) throw new Error('Protocolo e situação são obrigatórios');

      const processColumns = ensureProcessStatusValidation(sheet);
      const lastRow = sheet.getLastRow();
      const protocolColumn = processColumn(processColumns, 'Protocolo');
      const protocolos = lastRow > 1 ? sheet.getRange(2, protocolColumn, lastRow - 1, 1).getDisplayValues() : [];
      let targetRow = 0;
      for (let i = protocolos.length - 1; i >= 0; i--) {
        if (String(protocolos[i][0]).trim() === protocolo) { targetRow = i + 2; break; }
      }
      if (!targetRow) throw new Error('Processo não encontrado: ' + protocolo);

      const statusValues = {
        'Situação': situacao,
        'Atualizado em': new Date()
      };
      if (p.compensacao) statusValues['Compensação'] = String(p.compensacao);
      if (p.formaCompensacaoLabel || p.formaCompensacao) statusValues['Forma de Compensação'] = String(p.formaCompensacaoLabel || p.formaCompensacao);
      setProcessValues(sheet, targetRow, processColumns, statusValues);
      // Alterar o andamento não deve regravar P:S. Essas colunas guardam o JSON
      // completo da vistoria e podem ter validações legadas independentes. O
      // endpoint de status envia process=null justamente para manter operações
      // administrativas isoladas dos dados técnicos.
      if (p.process) {
        const savedRow = sheet.getRange(targetRow, 1, 1, sheet.getLastColumn()).getValues()[0];
        const savedProcess = processDetailsFromValues(savedRow, processColumns);
        const updatedProcess = Object.assign({}, savedProcess, p.process);
        updatedProcess.protocolo = protocolo;
        updatedProcess.situacao = situacao;
        updatedProcess.compensacao = p.compensacao || updatedProcess.compensacao || '';
        updatedProcess.formaCompensacao = p.formaCompensacao || updatedProcess.formaCompensacao || '';
        updatedProcess.formaCompensacaoLabel = p.formaCompensacaoLabel || updatedProcess.formaCompensacaoLabel || '';
        updatedProcess.dataCompensacao = p.dataCompensacao || updatedProcess.dataCompensacao || '';
        updatedProcess.dataEncaminhamento = p.dataEncaminhamento || updatedProcess.dataEncaminhamento || '';
        updatedProcess.updatedAt = new Date().toISOString();
        const processChunks = splitCellText(JSON.stringify(updatedProcess), 45000);
        setProcessValues(sheet, targetRow, processColumns, {
          'Dados da Vistoria 1': processChunks[0],
          'Dados da Vistoria 2': processChunks[1],
          'Dados da Vistoria 3': processChunks[2],
          'Dados da Vistoria 4': processChunks[3]
        });
        upsertInspectionDetails(spreadsheet, updatedProcess);
      }
      SpreadsheetApp.flush();
      return ContentService
        .createTextOutput(JSON.stringify({ ok: true, apiVersion: API_VERSION, row: targetRow, protocolo: protocolo, situacao: situacao }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    const processColumns = ensureProcessStatusValidation(sheet);
    const targetRow = Math.max(sheet.getLastRow() + 1, 2);
    setProcessValues(sheet, targetRow, processColumns, {
      'Data': parseSheetDate(p.data),
      'Protocolo': p.protocolo || '',
      'Solicitante': p.solicitante || '',
      'Telefone': p.telefone || '',
      'Solicitação': p.solicitacao || '',
      'Endereço': p.endereco || '',
      'Coordenada 1 Corte': coordinateForSheet(p.coordCorte1, 90),
      'Coordenada 2 Corte': coordinateForSheet(p.coordCorte2, 180),
      'Responsável Corte': p.responsavelCorte || '',
      'Autorização': p.autorizacao || '',
      'Data da Autorização': parseSheetDate(p.dataAutorizacao),
      'Compensação': p.compensacao || '',
      'Prazo': parseSheetDate(p.prazo),
      'Coordenada 1 Comp.': coordinateForSheet(p.coordComp1, 90),
      'Coordenada 2 Comp.': coordinateForSheet(p.coordComp2, 180),
      'Situação': p.situacao || 'Aguardando Compensação',
      'Fiscal': p.fiscalNome || '',
      'Atualizado em': new Date(),
      'Forma de Compensação': p.formaCompensacaoLabel || p.formaCompensacao || ''
    });
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

    const columns = processHeaderMap(sheet);
    const trees = [];
    const processes = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const protocolo = String(processCell(row, columns, 'Protocolo') || '').trim();
      if (!protocolo) continue;

      const formatDate = function(value, pattern) {
        if (!value) return '';
        const date = value instanceof Date ? value : new Date(value);
        return isNaN(date.getTime())
          ? String(value)
          : Utilities.formatDate(date, Session.getScriptTimeZone(), pattern || 'yyyy-MM-dd');
      };

      // Todos os registros pertencem ao painel de processos da Vistoria.
      // Coordenadas não são obrigatórias para um processo aparecer na lista.
      const details = processDetailsFromValues(row, columns);
      const namedCoordinates = {
        lat: normalizedCoordinate(processCell(row, columns, 'Coordenada 1 Corte'), 90),
        lng: normalizedCoordinate(processCell(row, columns, 'Coordenada 2 Corte'), 180)
      };
      const baseProcess = {
        id: 'SHEET-' + (i + 1) + '-' + protocolo,
        protocolo: protocolo,
        data: formatDate(processCell(row, columns, 'Data')),
        requerente: String(processCell(row, columns, 'Solicitante') || ''),
        telefone: String(processCell(row, columns, 'Telefone') || ''),
        endereco: String(processCell(row, columns, 'Endereço') || ''),
        solicitacaoRequerente: String(processCell(row, columns, 'Solicitação') || ''),
        intervencao: String(processCell(row, columns, 'Solicitação') || ''),
        intervencaoLabel: String(processCell(row, columns, 'Solicitação') || ''),
        situacao: String(processCell(row, columns, 'Situação') || details.situacao || 'Aguardando Vistoria'),
        coordenadas: namedCoordinates.lat || namedCoordinates.lng ? namedCoordinates : (details.coordenadas || namedCoordinates),
        responsavelCorte: String(processCell(row, columns, 'Responsável Corte') || ''),
        autorizacao: String(processCell(row, columns, 'Autorização') || ''),
        dataAutorizacao: formatDate(processCell(row, columns, 'Data da Autorização')),
        compensacao: String(processCell(row, columns, 'Compensação') || ''),
        fiscalNome: String(processCell(row, columns, 'Fiscal') || details.fiscalNome || ''),
        formaCompensacaoLabel: String(processCell(row, columns, 'Forma de Compensação') || details.formaCompensacaoLabel || ''),
        prazo: formatDate(processCell(row, columns, 'Prazo')),
        coordComp1: String(processCell(row, columns, 'Coordenada 1 Comp.') || ''),
        coordComp2: String(processCell(row, columns, 'Coordenada 2 Comp.') || ''),
        parecerTexto: ''
      };
      const process = Object.assign({}, baseProcess, details, {
        id: details.id || baseProcess.id,
        protocolo: protocolo,
        requerente: baseProcess.requerente || details.requerente || '',
        telefone: baseProcess.telefone || details.telefone || '',
        endereco: baseProcess.endereco || details.endereco || '',
        solicitacaoRequerente: baseProcess.solicitacaoRequerente || details.solicitacaoRequerente || '',
        situacao: baseProcess.situacao,
        coordenadas: baseProcess.coordenadas
      });
      processes.push(process);

      const lat = parseFloat(String(process.coordenadas && process.coordenadas.lat || '').replace(',', '.'));
      const lng = parseFloat(String(process.coordenadas && process.coordenadas.lng || '').replace(',', '.'));
      if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) continue;

      trees.push({
        protocolo:   protocolo,
        fiscalNome:  String(process.fiscalNome || ''),
        fiscalMatricula: String(details.fiscalMatricula || '0'),
        solicitante: String(process.requerente || ''),
        endereco:    String(process.endereco || ''),
        solicitacao: String(process.solicitacaoRequerente || ''),
        lat:         lat,
        lng:         lng,
        autorizacao: String(process.autorizacao || ''),
        compensacao: String(process.compensacao || ''),
        situacao:    String(process.situacao || 'Aguardando Vistoria'),
        data:        formatDate(processCell(row, columns, 'Data'), 'dd/MM/yyyy')
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
