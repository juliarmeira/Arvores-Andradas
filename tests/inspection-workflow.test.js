import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const readSource = () => readFile(new URL('../index.js', import.meta.url), 'utf8');

function functionBlock(source, startName, nextMarker) {
  const start = source.indexOf(startName);
  const end = source.indexOf(nextMarker, start);
  assert.ok(start >= 0 && end > start, `Bloco ${startName} não encontrado`);
  return source.slice(start, end);
}

test('blank coordinates and incomplete inspection cannot produce parecer status', async () => {
  const source = await readSource();
  const coordinateSource = source.match(/const validCoordinatePair = \(lat, lng\) => \{[\s\S]*?\n\};/)?.[0];
  assert.ok(coordinateSource);
  const validCoordinates = Function(`${coordinateSource}; return validCoordinatePair;`)();
  assert.equal(validCoordinates('', ''), false);
  assert.equal(validCoordinates('-22.000000', '-46.000000'), true);

  const statusSource = functionBlock(source, 'function processStatusFromForm', 'function collectProcessForAutosave');
  const statusForForm = Function(
    'statusForSheet', 'val', 'decisaoAutoriza', 'exigeCompensacao', 'situacaoDoParecer', 'getDestinacaoTipo',
    `${statusSource}; return processStatusFromForm;`
  )(
    value => value || 'Aguardando Vistoria', () => '', () => false, () => false,
    () => 'Parecer em Elaboração', () => 'requerente'
  );
  assert.equal(statusForForm({}, 'vistoria', false), 'Aguardando Vistoria');
  assert.equal(statusForForm({ situacao: 'Parecer em Elaboração' }, 'vistoria', false), 'Aguardando Vistoria');
  assert.equal(statusForForm({ situacao: 'Aguardando Vistoria' }, 'vistoria', true), 'Parecer em Elaboração');
});

test('autosave only marks a completed field inspection', async () => {
  const source = await readSource();
  const collect = functionBlock(source, 'function collectProcessForAutosave', 'function scheduleProcessAutoSync');
  assert.match(source, /Boolean\(val\('data-vistoria'\)\)/);
  assert.match(source, /validCoordinatePair\(tree\.latitude, tree\.longitude\) && treeHasInspectionData\(tree\)/);
  assert.match(collect, /situacao: processStatusFromForm\(existing, stage, inspectionComplete\)/);
  assert.match(collect, /conclusao: inspectionComplete \|\| preserveAdministrativeData \? val\('conclusao'\) : ''/);
  assert.match(collect, /vistoriaInLoco: inspectionComplete/);
  assert.doesNotMatch(collect, /vistoriaInLoco: existing\.vistoriaInLoco \|\|/);
});

test('parecer navigation is blocked while inspection is incomplete', async () => {
  const source = await readSource();
  const navigation = functionBlock(source, 'function navigateToProcessStage', 'function processStatusFromForm');
  assert.match(navigation, /\['parecer', 'compensacao'\]\.includes\(stage\) && !inspectionIsComplete\(\)/);
  assert.match(navigation, /showTab\('vistoria'\)/);
  assert.match(source, /navigateToProcessStage\(b\.dataset\.go\)/);
});
