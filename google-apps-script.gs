const SPREADSHEET_ID = '1f03SZqhFe4AbSd-Z4kg_MgBzDxg9ES-nzgLAiZfLDNU';
const SHEET_NAME = 'Página1';

function doPost(e) {
  try {
    const p = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    if (!sheet) throw new Error('Aba Página1 não encontrada');
    const brDate = value => value ? Utilities.parseDate(value, Session.getScriptTimeZone(), 'dd/MM/yyyy') : '';
    sheet.appendRow([
      brDate(p.data), p.protocolo || '', p.solicitante || '', p.endereco || '', p.solicitacao || '',
      p.coordCorte1 || '', p.coordCorte2 || '', p.responsavelCorte || '', p.autorizacao || '',
      brDate(p.dataAutorizacao), p.compensacao || '', brDate(p.prazo), p.coordComp1 || '',
      p.coordComp2 || '', p.situacao || 'Aguardando Compensação'
    ]);
    return ContentService.createTextOutput(JSON.stringify({ok:true,row:sheet.getLastRow()})).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ok:false,error:error.message})).setMimeType(ContentService.MimeType.JSON);
  }
}