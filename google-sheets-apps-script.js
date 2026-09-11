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
 * ID | Data Cadastro | Latitude | Longitude | Logradouro | Referencia | Local Plantio | Especie | Nome Certeza | Porte | Tronco | Fotos | Problemas | Interferencias | Intervencao | Ultima Poda | Historico Poda | Observacoes | Status | Data Atualizacao
 */

// ============================
// CONFIGURAÇÃO
// ============================
const SHEET_NAME = 'Arvores'; // Nome oficial da aba na planilha

// ============================
// WEB APP — GET (listar)
// ============================
function doGet(e) {
  const params = e ? (e.parameter || {}) : {};
  const action = params.action;

  if (action === 'list') {
    return listTrees();
  }

  return jsonResponse({ status: 'ok', message: 'Inventário Arbóreo API - Andradas MG' });
}

// ============================
// WEB APP — POST (criar/atualizar/deletar)
// ============================
function doPost(e) {
  try {
    let body = {};
    if (e && e.postData && e.postData.contents) {
      try {
        body = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        body = e.parameter || {};
      }
    } else if (e && e.parameter) {
      body = e.parameter;
    }

    const action = body.action || (e && e.parameter && e.parameter.action);

    if (action === 'create') {
      return createTree(body.data);
    } else if (action === 'update') {
      return updateTree(body.id, body.data);
    } else if (action === 'delete') {
      return deleteTree(body.id);
    }

    return jsonResponse({ status: 'error', message: 'Ação desconhecida: ' + action });
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

  // Se não encontrar pelo nome exato, busca por variações ou pelo ID 1119417971
  if (!sheet) {
    const allSheets = ss.getSheets();
    for (let i = 0; i < allSheets.length; i++) {
      const s = allSheets[i];
      if (s.getSheetId() === 1119417971 || s.getName().toLowerCase().indexOf('arvore') !== -1) {
        sheet = s;
        break;
      }
    }
    if (!sheet && allSheets.length > 0) {
      sheet = allSheets[0];
    }
  }

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    // Cabeçalho conforme especificação da Prefeitura
    sheet.appendRow([
      'ID', 'Data Cadastro', 'Latitude', 'Longitude', 'Logradouro', 'Rua', 'Bairro',
      'Referencia', 'Local Plantio', 'Especie', 'Nome Cientifico', 'Familia', 'Origem', 'Data Coleta',
      'Amostra Coletada', 'Certeza', 'Porte', 'Tronco',
      'Foto 1', 'Foto 2', 'Foto 3', 'Foto 4', 'Foto 5',
      'Problemas', 'Interferencias', 'Intervencao', 'Mes Poda', 'Ultima Poda',
      'Observacoes', 'Status', 'Data Atualizacao'
    ]);
    // Formata cabecalho
    const headerRange = sheet.getRange(1, 1, 1, 31);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#059669');
    headerRange.setFontColor('#FFFFFF');
    sheet.setFrozenRows(1);
    // Largura das colunas
    sheet.setColumnWidth(1, 120); // ID
    sheet.setColumnWidth(2, 140); // Data
    sheet.setColumnWidth(5, 160); // Logradouro
    sheet.setColumnWidth(6, 140); // Rua
    sheet.setColumnWidth(7, 140); // Bairro
    sheet.setColumnWidth(10, 160); // Especie
    sheet.setColumnWidth(11, 180); // Nome Cientifico
    sheet.setColumnWidth(12, 140); // Familia
    sheet.setColumnWidth(13, 100); // Origem
    sheet.setColumnWidth(14, 100); // Data Coleta
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
    data.logradouro || '',
    data.rua || '',
    data.bairro || '',
    data.referencia || '',
    data.localPlantio || '',
    data.especie || '',
    data.nomeCientifico || data.especie || '',
    data.familia || '',
    data.origem || '',
    data.dataColeta || '',
    data.amostra || '',
    data.certeza || '',
    data.porte || data.porte2 || '',
    data.tronco || data.tronco2 || '',
    data.foto1 || '',
    data.foto2 || '',
    data.foto3 || '',
    data.foto4 || '',
    data.foto5 || '',
    (data.problemas || []).join(', '),
    (data.interferencia || []).join(', '),
    data.intervencao || '',
    data.mesPoda || '',
    data.dataUltimaPoda || '',
    data.observacoes || '',
    data.status || '',
    formatDate(new Date(data.dataAtualizacao))
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
      sheet.getRange(rowNum, 5).setValue(data.logradouro || '');
      sheet.getRange(rowNum, 6).setValue(data.rua || '');
      sheet.getRange(rowNum, 7).setValue(data.bairro || '');
      sheet.getRange(rowNum, 8).setValue(data.referencia || '');
      sheet.getRange(rowNum, 9).setValue(data.localPlantio || '');
      sheet.getRange(rowNum, 10).setValue(data.especie || '');
      sheet.getRange(rowNum, 11).setValue(data.nomeCientifico || data.especie || '');
      sheet.getRange(rowNum, 12).setValue(data.familia || '');
      sheet.getRange(rowNum, 13).setValue(data.origem || '');
      sheet.getRange(rowNum, 14).setValue(data.dataColeta || '');
      sheet.getRange(rowNum, 15).setValue(data.amostra || '');
      sheet.getRange(rowNum, 16).setValue(data.certeza || '');
      sheet.getRange(rowNum, 17).setValue(data.porte || data.porte2 || '');
      sheet.getRange(rowNum, 18).setValue(data.tronco || data.tronco2 || '');
      sheet.getRange(rowNum, 19).setValue(data.foto1 || '');
      sheet.getRange(rowNum, 20).setValue(data.foto2 || '');
      sheet.getRange(rowNum, 21).setValue(data.foto3 || '');
      sheet.getRange(rowNum, 22).setValue(data.foto4 || '');
      sheet.getRange(rowNum, 23).setValue(data.foto5 || '');
      sheet.getRange(rowNum, 24).setValue((data.problemas || []).join(', '));
      sheet.getRange(rowNum, 25).setValue((data.interferencia || []).join(', '));
      sheet.getRange(rowNum, 26).setValue(data.intervencao || '');
      sheet.getRange(rowNum, 27).setValue(data.mesPoda || '');
      sheet.getRange(rowNum, 28).setValue(data.dataUltimaPoda || '');
      sheet.getRange(rowNum, 29).setValue(data.observacoes || '');
      sheet.getRange(rowNum, 30).setValue(data.status || '');
      sheet.getRange(rowNum, 31).setValue(formatDate(new Date(data.dataAtualizacao)));

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
