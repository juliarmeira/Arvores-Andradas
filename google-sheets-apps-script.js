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
const SHEET_GID = 180119124;
const API_VERSION = 2;

// ============================
// WEB APP — GET (listar)
// ============================
function doGet(e) {
  const params = e ? (e.parameter || {}) : {};
  const action = params.action;

  if (action === 'list') {
    return listTrees();
  }

  if (action === 'capabilities') {
    return jsonResponse({ status: 'ok', ok: true, apiVersion: API_VERSION });
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
  let sheet = ss.getSheets().find(function(item) { return item.getSheetId() === SHEET_GID; }) || ss.getSheetByName(SHEET_NAME);

  // Se não encontrar pelo nome exato, busca pela aba oficial informada.
  if (!sheet) {
    const allSheets = ss.getSheets();
    for (let i = 0; i < allSheets.length; i++) {
      const s = allSheets[i];
      if (s.getSheetId() === SHEET_GID || s.getName().toLowerCase().indexOf('arvore') !== -1) {
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
      'ID', 'Data Cadastro', 'Latitude', 'Longitude', 'Rua', 'Bairro', 'Logradouro',
      'Referencia', 'Local Plantio', 'Especie', 'Nome Cientifico', 'Familia', 'Origem', 'Data Coleta',
      'Amostra Coletada', 'Certeza', 'Porte', 'Tronco',
      'Fotos (qtd)', 'Problemas', 'Interferencias', 'Intervencao', 'Mes Poda', 'Ultima Poda',
      'Historico Poda', 'Observacoes', 'Status', 'Data Atualizacao',
      'Foto 1', 'Foto 2', 'Foto 3', 'Foto 4', 'Foto 5'
    ]);
    // Formata cabecalho
    const headerRange = sheet.getRange(1, 1, 1, 33);
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

  const extraHeaders = ['DAP', 'Altura', 'Protocolo Vistoria'];
  if (sheet.getMaxColumns() < 36) sheet.insertColumnsAfter(sheet.getMaxColumns(), 36 - sheet.getMaxColumns());
  sheet.getRange(1, 34, 1, extraHeaders.length).setValues([extraHeaders]);
  return sheet;
}

function getPhotoFolder() {
  const properties = PropertiesService.getScriptProperties();
  const savedId = properties.getProperty('INVENTORY_PHOTO_FOLDER_ID');
  if (savedId) {
    try { return DriveApp.getFolderById(savedId); } catch (ignore) {}
  }
  const folder = DriveApp.createFolder('Inventário Arbóreo - Fotos');
  properties.setProperty('INVENTORY_PHOTO_FOLDER_ID', folder.getId());
  return folder;
}

function savePhotoValue(value, treeId, index) {
  const text = String(value || '');
  if (!text || text.indexOf('data:image/') !== 0) return text;
  const match = text.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) return '';
  const extension = match[1].indexOf('png') !== -1 ? 'png' : match[1].indexOf('webp') !== -1 ? 'webp' : 'jpg';
  const blob = Utilities.newBlob(Utilities.base64Decode(match[2]), match[1], 'arvore-' + treeId + '-foto-' + index + '.' + extension);
  const file = getPhotoFolder().createFile(blob);
  try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (ignore) {}
  return 'https://drive.google.com/uc?export=view&id=' + file.getId();
}

function preparePhotos(data, treeId) {
  for (let i = 1; i <= 5; i++) data['foto' + i] = savePhotoValue(data['foto' + i], treeId, i);
  return data;
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
  data = preparePhotos(data || {}, id);

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
    data.nomeCientifico || data.especie || '',
    data.familia || '',
    data.origem || '',
    data.dataColeta || '',
    data.amostra || '',
    data.certeza || '',
    data.porte || data.porte2 || '',
    data.tronco || data.tronco2 || '',
    [data.foto1, data.foto2, data.foto3, data.foto4, data.foto5].filter(Boolean).length,
    (data.problemas || []).join(', '),
    (data.interferencia || []).join(', '),
    data.intervencao || '',
    data.mesPoda || '',
    data.dataUltimaPoda || '',
    data.historicoPoda || '',
    data.observacoes || '',
    data.status || '',
    formatDate(new Date(data.dataAtualizacao)),
    data.foto1 || '', data.foto2 || '', data.foto3 || '', data.foto4 || '', data.foto5 || '',
    data.dap || '', data.altura || '', data.protocoloVistoria || ''
  ];

  sheet.appendRow(row);

  return jsonResponse({
    status: 'ok',
    message: 'Árvore cadastrada com sucesso',
    id: id,
    data: { fotos: [data.foto1, data.foto2, data.foto3, data.foto4, data.foto5].filter(Boolean) }
  });
}

function updateTree(id, data) {
  const sheet = getSheet();
  data = preparePhotos(data || {}, id);
  const allData = sheet.getDataRange().getValues();

  for (let i = 1; i < allData.length; i++) {
    if (String(allData[i][0]) === String(id)) {
      const rowNum = i + 1;
      const photos = [data.foto1, data.foto2, data.foto3, data.foto4, data.foto5];
      const row = [
        id, allData[i][1] || formatDate(new Date(data.timestamp)), data.latitude || '', data.longitude || '',
        data.rua || '', data.bairro || '', data.logradouro || '', data.referencia || '', data.localPlantio || '',
        data.especie || '', data.nomeCientifico || data.especie || '', data.familia || '', data.origem || '',
        data.dataColeta || '', data.amostra || '', data.certeza || '', data.porte || data.porte2 || '',
        data.tronco || data.tronco2 || '', photos.filter(Boolean).length, (data.problemas || []).join(', '),
        (data.interferencia || []).join(', '), data.intervencao || '', data.mesPoda || '', data.dataUltimaPoda || '',
        data.historicoPoda || allData[i][24] || '', data.observacoes || '', data.status || '',
        formatDate(new Date(data.dataAtualizacao)), photos[0] || '', photos[1] || '', photos[2] || '', photos[3] || '', photos[4] || '',
        data.dap || '', data.altura || '', data.protocoloVistoria || ''
      ];
      sheet.getRange(rowNum, 1, 1, row.length).setValues([row]);

      return jsonResponse({
        status: 'ok',
        message: 'Árvore atualizada com sucesso',
        id: id,
        data: { fotos: [data.foto1, data.foto2, data.foto3, data.foto4, data.foto5].filter(Boolean) }
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
