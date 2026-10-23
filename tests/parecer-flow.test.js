import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = file => readFile(new URL(`../${file}`, import.meta.url), 'utf8');

test('parecer uses the compact four-result decision flow', async () => {
  const html = await read('index.html');
  assert.match(html, /<option value="deferir">Autorizado<\/option>/);
  assert.match(html, /<option value="indeferir">Não autorizado<\/option>/);
  assert.match(html, /<option value="diligencia">Necessária diligência<\/option>/);
  assert.match(html, /<option value="condicionado">Aprovado com condicionante<\/option>/);
  assert.match(html, /id="intervencao-autorizada"/);
  assert.match(html, /class="encaminhamento-compacto"/);
  assert.doesNotMatch(html, /name="destinacao-tipo"/);
});

test('poda and Não se aplica never wait for compensation', async () => {
  const source = await read('index.js');
  assert.match(source, /intervencaoAutorizada\(\) !== 'poda' && val\('forma'\) !== 'naoaplica'/);
  assert.match(source, /Poda autorizada\. Não se aplica compensação ambiental\./);
  assert.match(source, /return exigeCompensacao\(\) \? 'Aguardando Compensação' : 'Parecer em Elaboração'/);
});

test('CODEMA status matches the exact spreadsheet validation value', async () => {
  const [html, source, api, server] = await Promise.all([
    read('index.html'), read('index.js'), read('api/process-status.js'), read('server.js')
  ]);
  for (const contents of [html, source]) {
    assert.match(contents, /Enviado para Deliberação CODEMA/);
    assert.doesNotMatch(contents, /Enviado para Deliberação do CODEMA/);
  }
  assert.match(api, /requestedStatus === "Enviado para Deliberação do CODEMA"/);
  assert.match(server, /requestedStatus === "Enviado para Deliberação do CODEMA"/);
});

test('status-only update does not rewrite the stale fiscal column', async () => {
  const [api, gas] = await Promise.all([read('api/process-status.js'), read('google-apps-script.gs')]);
  assert.match(api, /process: null/);
  const statusStart = gas.indexOf("if (p.action === 'updateStatus')");
  const statusBlock = gas.slice(statusStart, gas.indexOf('const targetRow = Math.max', statusStart));
  assert.match(statusBlock, /const savedProcess = processDetailsFromValues/);
  assert.match(statusBlock, /updatedProcess\.situacao = situacao/);
  assert.doesNotMatch(statusBlock, /'Fiscal':/);
});

test('phone and address are mapped to their named spreadsheet columns', async () => {
  const [html, source, gas] = await Promise.all([read('index.html'), read('index.js'), read('google-apps-script.gs')]);
  assert.match(html, /id="telefone"[^>]*type="tel"/);
  assert.match(source, /telefone: val\('telefone'\) \|\| existing\.telefone \|\| ''/);
  assert.match(source, /\$\('telefone'\)\.value = p\.telefone \|\| ''/);
  assert.match(gas, /'Telefone': process\.telefone \|\| p\.telefone \|\| ''/);
  assert.match(gas, /'Endereço': process\.endereco \|\| p\.endereco \|\| ''/);
  assert.match(gas, /function processHeaderMap\(sheet\)/);
});

test('Apps Script reads process data by header instead of fixed positions', async () => {
  const gas = await read('google-apps-script.gs');
  const doGet = gas.slice(gas.indexOf('function doGet'));
  assert.match(doGet, /processCell\(row, columns, 'Protocolo'\)/);
  assert.match(doGet, /processDetailsFromValues\(row, columns\)/);
  assert.match(doGet, /processCell\(row, columns, 'Telefone'\)/);
  assert.doesNotMatch(doGet, /row\.slice\(16, 20\)/);
  assert.doesNotMatch(doGet, /situacao:\s*String\(row\[14\]/);
});

test('spreadsheet setup never changes the existing process headers', async () => {
  const gas = await read('google-apps-script.gs');
  const setup = gas.slice(gas.indexOf('function ensureProcessDataColumns'), gas.indexOf('function processColumn'));
  assert.match(setup, /Cabeçalhos obrigatórios ausentes/);
  assert.doesNotMatch(setup, /insertColumn|setValue|appendRow|deleteColumn|moveColumn/);
  assert.doesNotMatch(gas, /repairDuplicateProcessHeaders|migrateProcessData/);
});

test('spreadsheet validation can be run directly without an undefined sheet', async () => {
  const gas = await read('google-apps-script.gs');
  const headerMap = gas.slice(gas.indexOf('function processHeaderMap'), gas.indexOf('function ensureProcessDataColumns'));
  assert.match(headerMap, /if \(!sheet\)/);
  assert.match(headerMap, /SpreadsheetApp\.openById\(SPREADSHEET_ID\)/);
});
