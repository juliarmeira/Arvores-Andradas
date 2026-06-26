/**
 * INVENTÁRIO ARBÓREO — ANDRADAS, MG
 * Google Apps Script para receber dados do app mobile
 *
 * COMO USAR:
 * 1. Crie uma nova Google Planilha
 * 2. Vá em Extensões > Apps Script
 * 3. Cole este código
 * 4. Crie uma coluna cabeçalho na planilha (abaixo)
 * 5. Deploy > Nova implantação > App da Web > Todo mundo
 * 6. Copie a URL e cole no SHEETS_URL do app.js
 *
 * CABEÇALHO da planilha (linha 1):
 * ID | Data Cadastro | Latitude | Longitude | Logradouro | Referencia | Local Plantio | Especie | Nome Certeza | Porte | Tronco | Fotos | Problemas | Interferencias | Intervencao | Mes Poda | Ultima Poda | Historico Poda | Observacoes | Status | Data Atualizacao
 */

// ============================
// CONFIGURAÇÃO
// ============================
const SHEET_NAME = 'Arvores'; // Nome da aba na planilha

// ============================
// WEB APP — GET (listar)
// ============================
function doGet(e) {
  const action = e.parameter.action;

  if (action === 'list') {
    return listTrees();
  }

  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: 'Inventário Arbóreo API' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================
// WEB APP — POST (criar/atualizar/deletar)
// ============================
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action;

    if (action === 'create') {
      return createTree(body.data);
    } else if (action === 'update') {
      return updateTree(body.id, body.data);
    } else if (action === 'delete') {
      return deleteTree(body.id);
    }

    return jsonResponse({ status: 'error', message: 'Ação desconhecida' });
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  }
}

// ============================
// HELPERS
// ============================
function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    // Cabeçalho
    sheet.appendRow([
      'ID', 'Data Cadastro', 'Latitude', 'Longitude', 'Rua', 'Bairro', 'Logradouro',
      'Referencia', 'Local Plantio', 'Especie', 'Certeza', 'Porte',
      'Tronco', 'Fotos (qtd)', 'Problemas', 'Interferencias',
      'Intervencao', 'Mes Poda', 'Ultima Poda', 'Historico Poda',
      'Observacoes', 'Status', 'Data Atualizacao',
      'Foto 1', 'Foto 2', 'Foto 3', 'Foto 4', 'Foto 5'
    ]);
    // Formata cabeçalho
    const headerRange = sheet.getRange(1, 1, 1, 28);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#4E6B2E');
    headerRange.setFontColor('#FFFFFF');
    sheet.setFrozenRows(1);
    // Largura das colunas
    sheet.setColumnWidth(1, 120); // ID
    sheet.setColumnWidth(2, 140); // Data
    sheet.setColumnWidth(5, 160); // Rua
    sheet.setColumnWidth(6, 140); // Bairro
    sheet.setColumnWidth(10, 160); // Especie
  }

  return sheet;
}

function formatDate(d) {
  const date = d || new Date();
  return Utilities.formatDate(date, 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm:ss');
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================
// CRUD
// ============================
function createTree(data) {
  const sheet = getSheet();
  const id = data.id || new Date().getTime();

  const row = [
    id,
    formatDate(new Date(data.timestamp)),
    data.latitude || '',
    data.longitude || '',
    data.rua || '',
    data.bairro || '',
    data.logradouro || '',
    data.referencia || '',
    data.localPlantio || '',
    data.especie || '',
    data.certeza || '',
    data.porte || data.porte2 || '',
    data.tronco || data.tronco2 || '',
    data.fotos || 0,
    (data.problemas || []).join(', '),
    (data.interferencia || []).join(', '),
    data.intervencao || '',
    data.mesPoda || '',
    data.dataUltimaPoda || '',
    data.historicoPoda || '',
    data.observacoes || '',
    data.status || '',
    formatDate(new Date(data.dataAtualizacao)),
    data.foto1 || '',
    data.foto2 || '',
    data.foto3 || '',
    data.foto4 || '',
    data.foto5 || ''
  ];

  sheet.appendRow(row);

  return jsonResponse({
    status: 'ok',
    message: 'Árvore cadastrada com sucesso',
    id: id
  });
}

function updateTree(id, data) {
  const sheet = getSheet();
  const allData = sheet.getDataRange().getValues();

  for (let i = 1; i < allData.length; i++) {
    if (String(allData[i][0]) === String(id)) {
      const rowNum = i + 1;
      sheet.getRange(rowNum, 3).setValue(data.latitude || '');
      sheet.getRange(rowNum, 4).setValue(data.longitude || '');
      sheet.getRange(rowNum, 5).setValue(data.rua || '');
      sheet.getRange(rowNum, 6).setValue(data.bairro || '');
      sheet.getRange(rowNum, 7).setValue(data.logradouro || '');
      sheet.getRange(rowNum, 8).setValue(data.referencia || '');
      sheet.getRange(rowNum, 9).setValue(data.localPlantio || '');
      sheet.getRange(rowNum, 10).setValue(data.especie || '');
      sheet.getRange(rowNum, 11).setValue(data.certeza || '');
      sheet.getRange(rowNum, 12).setValue(data.porte || data.porte2 || '');
      sheet.getRange(rowNum, 13).setValue(data.tronco || data.tronco2 || '');
      sheet.getRange(rowNum, 14).setValue(data.fotos || 0);
      sheet.getRange(rowNum, 15).setValue((data.problemas || []).join(', '));
      sheet.getRange(rowNum, 16).setValue((data.interferencia || []).join(', '));
      sheet.getRange(rowNum, 17).setValue(data.intervencao || '');
      sheet.getRange(rowNum, 18).setValue(data.mesPoda || '');
      sheet.getRange(rowNum, 19).setValue(data.dataUltimaPoda || '');
      sheet.getRange(rowNum, 20).setValue(data.historicoPoda || '');
      sheet.getRange(rowNum, 21).setValue(data.observacoes || '');
      sheet.getRange(rowNum, 22).setValue(data.status || '');
      sheet.getRange(rowNum, 23).setValue(formatDate(new Date(data.dataAtualizacao)));
      if (data.foto1) sheet.getRange(rowNum, 24).setValue(data.foto1);
      if (data.foto2) sheet.getRange(rowNum, 25).setValue(data.foto2);
      if (data.foto3) sheet.getRange(rowNum, 26).setValue(data.foto3);
      if (data.foto4) sheet.getRange(rowNum, 27).setValue(data.foto4);
      if (data.foto5) sheet.getRange(rowNum, 28).setValue(data.foto5);

      return jsonResponse({
        status: 'ok',
        message: 'Árvore atualizada com sucesso',
        id: id
      });
    }
  }

  return jsonResponse({ status: 'error', message: 'Árvore não encontrada' });
}

function deleteTree(id) {
  const sheet = getSheet();
  const allData = sheet.getDataRange().getValues();

  for (let i = 1; i < allData.length; i++) {
    if (String(allData[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return jsonResponse({
        status: 'ok',
        message: 'Árvore excluída com sucesso',
        id: id
      });
    }
  }

  return jsonResponse({ status: 'error', message: 'Árvore não encontrada' });
}

function listTrees() {
  const sheet = getSheet();
  const allData = sheet.getDataRange().getValues();
  const headers = allData[0];
  const trees = [];

  for (let i = 1; i < allData.length; i++) {
    const tree = {};
    for (let j = 0; j < headers.length; j++) {
      tree[headers[j]] = allData[i][j];
    }
    trees.push(tree);
  }

  return jsonResponse({ status: 'ok', trees: trees });
}
