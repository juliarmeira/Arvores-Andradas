const SPREADSHEET_ID = '1f03SZqhFe4AbSd-Z4kg_MgBzDxg9ES-nzgLAiZfLDNU';
const SHEET_NAME = 'Página1';
const API_VERSION = 3;
const WATER_SPREADSHEET_ID = '1BDuNmB5umdQLre8bDE-Ltuk0WCnl9pLT5kYYmFmzW6Y';
const WATER_SHEET_NAME = 'Todos';

// ─── doPost: grava uma nova linha na planilha ──────────────────────────────────────────
function doPost(e) {
  try {
    const p = JSON.parse(e.postData.contents);
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
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    if (!sheet) throw new Error('Aba Página1 não encontrada');
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

      sheet.getRange(targetRow, 15).setValue(situacao);
      if (p.compensacao) sheet.getRange(targetRow, 11).setValue(String(p.compensacao));
      SpreadsheetApp.flush();
      return ContentService
        .createTextOutput(JSON.stringify({ ok: true, apiVersion: API_VERSION, row: targetRow, protocolo: protocolo, situacao: situacao }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    const brDate = value => value ? Utilities.parseDate(value, Session.getScriptTimeZone(), 'dd/MM/yyyy') : '';
    sheet.appendRow([
      brDate(p.data), p.protocolo || '', p.solicitante || '', p.endereco || '', p.solicitacao || '',
      p.coordCorte1 || '', p.coordCorte2 || '', p.responsavelCorte || '', p.autorizacao || '',
      brDate(p.dataAutorizacao), p.compensacao || '', brDate(p.prazo), p.coordComp1 || '',
      p.coordComp2 || '', p.situacao || 'Aguardando Compensação'
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
    // 9=dataAutorizacao, 10=compensacao, 11=prazo, 12=coordComp1, 13=coordComp2, 14=situacao
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
      processes.push({
        id: 'SHEET-' + (i + 1) + '-' + protocolo,
        protocolo: protocolo,
        data: formatDate(row[0]),
        requerente: String(row[2] || ''),
        endereco: String(row[3] || ''),
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
        prazo: formatDate(row[11]),
        coordComp1: String(row[12] || ''),
        coordComp2: String(row[13] || ''),
        parecerTexto: ''
      });

      const lat = parseFloat(String(row[5]).replace(',', '.'));
      const lng = parseFloat(String(row[6]).replace(',', '.'));
      if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) continue;

      trees.push({
        protocolo:   protocolo,
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
