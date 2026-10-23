import test from 'node:test';
import assert from 'node:assert/strict';
import inventoryHandler from '../api/inventory.js';
import processSyncHandler from '../api/process-sync.js';
import processStatusHandler from '../api/process-status.js';
import { processFromRow } from '../api/processes.js';

function responseCapture() {
  return {
    statusCode: 200,
    body: null,
    headers: {},
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
    setHeader(name, value) { this.headers[name] = value; }
  };
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' }
  });
}

test('process sync accepts the deployed API v8', async () => {
  const originalFetch = global.fetch;
  const calls = [];
  global.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    if (String(url).includes('docs.google.com')) return new Response('Data,Protocolo\n');
    if (!options.method) return jsonResponse({ ok: true, apiVersion: 8 });
    return jsonResponse({ ok: true, row: 12, protocolo: 'TESTE-1' });
  };
  try {
    const res = responseCapture();
    await processSyncHandler({
      method: 'POST',
      body: { action: 'upsertProcess', process: { protocolo: 'TESTE-1' } }
    }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.ok, true);
    assert.equal(calls.length, 3);
    assert.equal(calls[2].options.method, 'POST');
  } finally {
    global.fetch = originalFetch;
  }
});

test('process status normalizes the legacy CODEMA label before forwarding', async () => {
  const originalFetch = global.fetch;
  const calls = [];
  global.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    if (!options.method) return jsonResponse({ ok: true, apiVersion: 8 });
    return jsonResponse({ ok: true, row: 8, protocolo: 'TESTE-2' });
  };
  try {
    const res = responseCapture();
    await processStatusHandler({
      method: 'POST',
      body: { protocolo: 'TESTE-2', situacao: 'Enviado para Deliberação do CODEMA' }
    }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.ok, true);
    assert.equal(calls.length, 2);
    assert.equal(JSON.parse(calls[1].options.body).situacao, 'Enviado para Deliberação CODEMA');
  } finally {
    global.fetch = originalFetch;
  }
});

test('process status confirms the sheet after the legacy script fails post-write', async () => {
  const originalFetch = global.fetch;
  const calls = [];
  global.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    if (String(url).includes('docs.google.com')) {
      return new Response('Protocolo,Situação\n11171/2026,Aguardando Vistoria\n');
    }
    if (!options.method) return jsonResponse({ ok: true, apiVersion: 8 });
    return jsonResponse({ ok: false, error: 'Os dados inseridos na célula P279 violam as regras de validação' });
  };
  try {
    const res = responseCapture();
    await processStatusHandler({
      method: 'POST',
      body: { protocolo: '11171/2026', situacao: 'Aguardando Vistoria' }
    }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.ok, true);
    assert.equal(res.body.verified, true);
    assert.equal(res.body.recoveredFromPostWriteError, true);
    assert.equal(calls.length, 3);
  } finally {
    global.fetch = originalFetch;
  }
});

test('process status keeps the real error when the sheet did not change', async () => {
  const originalFetch = global.fetch;
  global.fetch = async (url, options = {}) => {
    if (String(url).includes('docs.google.com')) {
      return new Response('Protocolo,Situação\n11171/2026,Parecer em Elaboração\n');
    }
    if (!options.method) return jsonResponse({ ok: true, apiVersion: 8 });
    return jsonResponse({ ok: false, error: 'Falha antes da gravação' });
  };
  try {
    const res = responseCapture();
    await processStatusHandler({
      method: 'POST',
      body: { protocolo: '11171/2026', situacao: 'Aguardando Vistoria' }
    }, res);
    assert.equal(res.statusCode, 502);
    assert.equal(res.body.ok, false);
  } finally {
    global.fetch = originalFetch;
  }
});

test('inventory legacy capability response no longer blocks a valid write', async () => {
  const originalFetch = global.fetch;
  const calls = [];
  global.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    if (String(url).includes('docs.google.com')) {
      return new Response('ID,Tronco,Porte,Observacoes\n42,DAP 50 cm,158 m,Nota de campo\n');
    }
    if (!options.method) {
      return jsonResponse({ status: 'ok', message: 'Inventario Arboreo API' });
    }
    return jsonResponse({ status: 'ok', id: 42 });
  };
  try {
    const res = responseCapture();
    await inventoryHandler({
      method: 'POST',
      body: { action: 'create', data: { latitude: -22, longitude: -46 } }
    }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.status, 'ok');
    assert.equal(res.body.id, 42);
    assert.equal(calls.length, 3);
  } finally {
    global.fetch = originalFetch;
  }
});

test('process sync continues to reject genuinely incompatible APIs', async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => jsonResponse({ ok: true, apiVersion: 7 });
  try {
    const res = responseCapture();
    await processSyncHandler({ method: 'POST', body: {} }, res);
    assert.equal(res.statusCode, 409);
    assert.equal(res.body.ok, false);
  } finally {
    global.fetch = originalFetch;
  }
});

test('process reader follows named headers including the Telephone column', () => {
  const headers = ['Data', 'Protocolo', 'Solicitante', 'Telefone', 'Solicita\u00e7\u00e3o', 'Endere\u00e7o', 'Coordenada 1 Corte', 'Coordenada 2 Corte', 'Respons\u00e1vel Corte', 'Autoriza\u00e7\u00e3o', 'Data da Autoriza\u00e7\u00e3o', 'Compensa\u00e7\u00e3o', 'Prazo', 'Coordenada 1 Comp.', 'Coordenada 2 Comp.', 'Dados da Vistoria 1', 'Dados da Vistoria 2', 'Dados da Vistoria 3', 'Dados da Vistoria 4', 'Atualizado em', 'Forma de Compensa\u00e7\u00e3o', 'Forma de Compensa\u00e7\u00e3o'];
  const row = Array(22).fill('');
  row[1] = '11641/2026';
  row[3] = '35-0000-0000';
  row[5] = 'Rua correta';
  row[6] = '-22.068.123';
  row[7] = '-46.569.123';
  row[15] = JSON.stringify({ vistoriaInLoco: true, trees: [{ cientifico: 'Hymenaea courbaril' }], fiscalNome: 'Fiscal', situacao: 'Parecer em Elabora\u00e7\u00e3o' });
  const process = processFromRow(row, 0, headers);
  assert.equal(process.vistoriaInLoco, true);
  assert.equal(process.trees[0].cientifico, 'Hymenaea courbaril');
  assert.equal(process.fiscalNome, 'Fiscal');
  assert.equal(process.telefone, '35-0000-0000');
  assert.equal(process.endereco, 'Rua correta');
  assert.deepEqual(process.coordenadas, { lat: '-22.068123', lng: '-46.569123' });
  assert.equal(process.situacao, 'Parecer em Elabora\u00e7\u00e3o');
});

test('process reader supports reordered columns and falls back to saved JSON fields', () => {
  const headers = ['Telefone', 'Dados da Vistoria 1', 'Endere\u00e7o', 'Protocolo', 'Solicitante', 'Situa\u00e7\u00e3o'];
  const row = [
    '',
    JSON.stringify({ telefone: '35-1111-2222', endereco: 'Rua recuperada', requerente: 'Maria' }),
    '',
    '900/2026',
    '',
    'Aguardando Vistoria'
  ];
  const process = processFromRow(row, 3, headers);
  assert.equal(process.protocolo, '900/2026');
  assert.equal(process.telefone, '35-1111-2222');
  assert.equal(process.endereco, 'Rua recuperada');
  assert.equal(process.requerente, 'Maria');
});

test('stale stage-one process cannot overwrite a completed field inspection', async () => {
  const originalFetch = global.fetch;
  const headers = ['Data', 'Protocolo', '', '', '', '', '', '', '', '', '', '', '', '', 'Situação', 'Dados da Vistoria 1', 'Dados da Vistoria 2', 'Dados da Vistoria 3', 'Dados da Vistoria 4'];
  const details = JSON.stringify({ protocolo: '11641/2026', vistoriaInLoco: true, updatedAt: '2026-10-16T12:00:00.000Z', trees: [{ cientifico: 'Hymenaea courbaril' }] });
  const cells = Array(19).fill('');
  cells[1] = '11641/2026';
  cells[14] = 'Parecer em Elaboração';
  cells[15] = '"' + details.replaceAll('"', '""') + '"';
  const csv = headers.join(',') + '\n' + cells.join(',');
  const calls = [];
  global.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    return new Response(csv, { status: 200 });
  };
  try {
    const res = responseCapture();
    await processSyncHandler({
      method: 'POST',
      body: { action: 'upsertProcess', process: { protocolo: '11641/2026', vistoriaInLoco: false, updatedAt: '2026-10-14T12:00:00.000Z', trees: [] } }
    }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.skipped, true);
    assert.equal(res.body.reason, 'remote-stage-newer');
    assert.equal(calls.length, 1);
  } finally {
    global.fetch = originalFetch;
  }
});
