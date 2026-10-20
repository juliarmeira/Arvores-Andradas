import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const readProjectFile = name => readFile(new URL(`../${name}`, import.meta.url), 'utf8');

test('offline process recovery is callable outside the single-save function', async () => {
  const source = await readProjectFile('index.js');
  assert.match(source, /return \{ processSynced: false, inventoryErrors, processError: error\.message \}/);
  assert.match(source, /function syncPendingProcesses/);
  assert.match(source, /window\.addEventListener\('online',[^\n]*syncPendingProcesses/);
  assert.match(source, /fotos: \(tree\.fotos \|\| \[\]\)\.filter\(photo => photo && !String\(photo\)\.startsWith\('data:'\)\)/);
});

test('large embedded photos are kept out of localStorage', async () => {
  const source = await readProjectFile('index.js');
  assert.match(source, /const compactRecords = JSON\.stringify\(snapshot\.map\(remoteProcessCopy\)\)/);
  assert.doesNotMatch(source, /localStorage\.setItem\('arbo_processos', JSON\.stringify\(processos\)\)/);
  assert.ok(source.indexOf('await writeProcessBackup(snapshot, savedAt)') < source.indexOf("localStorage.removeItem('arbo_processos')"));
  assert.match(source, /function compactLegacyInventoryCache/);
  assert.match(source, /releaseReconstructibleStorage\(\)/);
  assert.doesNotMatch(source, /localStorage\.clear\(/);
  assert.match(source, /st\['DAP'\].*st\['Tronco'\]/);
  assert.match(source, /st\['Altura'\].*st\['Porte'\]/);
});

test('the installed app exposes a manual pending-copy sync action', async () => {
  const html = await readProjectFile('index.html');
  assert.match(html, /id="btn-sync-processos"/);
  assert.match(html, /index\.js\?v=25/);
});

test('process form advertises automatic saving without stage save buttons', async () => {
  const html = await readProjectFile('index.html');
  const source = await readProjectFile('index.js');
  assert.match(html, /id="autosave-status"/);
  assert.doesNotMatch(html, /id="btn-save-etapa[12]"/);
  assert.match(source, /function scheduleProcessAutosave/);
  assert.match(source, /syncNewProcessoVistoria\(snapshot, \{ silent: true \}\)/);
});


test('inventory sync excludes multi-megabyte photo columns from preflight reads', async () => {
  const source = await readProjectFile('api/inventory.js');
  assert.match(source, /range=A:AB/);
});
