// =============================================================================
// PARECER AMBIENTAL - VISTORIA ARBÓREA (DN CODEMA Nº 09/2026 - ANDRADAS/MG)
// =============================================================================

const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
}[c]));

const safeImageSource = value => {
  const source = String(value || '').trim();
  return /^(https?:\/\/|data:image\/(?:jpeg|png|webp|gif);base64,|blob:)/i.test(source) ? esc(source) : '';
};

const val = id => $(id)?.value?.trim?.() ?? $(id)?.value ?? "";
const KNOWN_ACRONYMS = ['APP', 'ART', 'CAU', 'CEMIG', 'CEP', 'CNPJ', 'CODEMA', 'CPF', 'CREA', 'DN', 'EPP', 'FMMA', 'IPTU', 'LTDA', 'ME', 'MG', 'RRT', 'SPUMA', 'UFM'];
const NAME_PARTICLES = new Set(['a', 'as', 'da', 'das', 'de', 'do', 'dos', 'e']);

function hasPredominantlyUppercaseLetters(text) {
  const letters = String(text || '').match(/\p{L}/gu) || [];
  if (letters.length < 2) return false;
  const upper = letters.filter(letter => letter === letter.toLocaleUpperCase('pt-BR') && letter !== letter.toLocaleLowerCase('pt-BR')).length;
  return upper / letters.length >= 0.8;
}

function restoreKnownAcronyms(text) {
  let result = text;
  KNOWN_ACRONYMS.forEach(acronym => {
    result = result.replace(new RegExp(`\\b${acronym}\\b`, 'gi'), acronym);
  });
  return result;
}

function capitalizeWord(word) {
  return word.replace(/(^|[-'’])([\p{L}])/gu, (_, prefix, letter) => `${prefix}${letter.toLocaleUpperCase('pt-BR')}`);
}

function normalizeNameCase(text) {
  const lowered = String(text || '').toLocaleLowerCase('pt-BR');
  const words = lowered.split(/(\s+)/);
  let wordIndex = 0;
  const normalized = words.map(part => {
    if (/^\s+$/.test(part) || !part) return part;
    const clean = part.replace(/^[^\p{L}]+|[^\p{L}.]+$/gu, '');
    const acronym = KNOWN_ACRONYMS.find(item => item.toLocaleLowerCase('pt-BR') === clean.replace(/\./g, '').toLocaleLowerCase('pt-BR'));
    const isParticle = wordIndex > 0 && NAME_PARTICLES.has(clean.toLocaleLowerCase('pt-BR'));
    wordIndex += 1;
    if (acronym) return part.replace(clean, `${acronym}${clean.endsWith('.') ? '.' : ''}`);
    if (isParticle) return part;
    return capitalizeWord(part);
  }).join('');
  return restoreKnownAcronyms(normalized);
}

function capitalizeSentences(text) {
  const lowered = String(text || '').toLocaleLowerCase('pt-BR');
  let shouldCapitalize = true;
  let result = '';
  for (const char of lowered) {
    if (shouldCapitalize && /\p{L}/u.test(char)) {
      result += char.toLocaleUpperCase('pt-BR');
      shouldCapitalize = false;
    } else {
      result += char;
    }
    if (/[.!?]/.test(char) || char === '\n') shouldCapitalize = true;
  }
  result = restoreKnownAcronyms(result);
  const properPhrases = [val('requerente'), val('local'), 'Andradas', 'Minas Gerais', 'Prefeitura Municipal de Andradas'];
  properPhrases.filter(Boolean).forEach(phrase => {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    result = result.replace(new RegExp(escaped, 'gi'), phrase);
  });
  return result;
}

function normalizeUppercaseField(element) {
  if (!element || !hasPredominantlyUppercaseLetters(element.value)) return;
  const mode = element.dataset.caseNormalize || 'sentence';
  const normalized = mode === 'name' ? normalizeNameCase(element.value) : capitalizeSentences(element.value);
  if (normalized !== element.value) {
    element.value = normalized;
    element.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

function setupCaseNormalization() {
  document.addEventListener('paste', event => {
    const element = event.target.closest?.('[data-case-normalize]');
    if (element) setTimeout(() => normalizeUppercaseField(element), 0);
  });
  document.addEventListener('blur', event => {
    const element = event.target.closest?.('[data-case-normalize]');
    if (element) normalizeUppercaseField(element);
  }, true);
}

function normalizeAllUppercaseFields() {
  document.querySelectorAll('[data-case-normalize]').forEach(normalizeUppercaseField);
}
const normalizeCoordinateValue = value => {
  const text = String(value || '').trim().replace(',', '.');
  const number = Number(text);
  return Number.isFinite(number) ? number.toFixed(6) : text;
};
const validCoordinatePair = (lat, lng) => {
  const latitude = Number(String(lat || '').replace(',', '.'));
  const longitude = Number(String(lng || '').replace(',', '.'));
  return Number.isFinite(latitude) && Number.isFinite(longitude) && latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
};
const label = id => {
  const e = $(id);
  return e?.options ? e.options[e.selectedIndex]?.text || "" : e?.value || "";
};

const organs = [
  ['inteira', 'Árvore inteira'],
  ['copa', 'Copa'],
  ['folha', 'Folha'],
  ['flor', 'Flor'],
  ['fruto', 'Fruto']
];

const URBAN_CONFLICTS = [
  ['fiacao', 'Fiação / rede aérea'],
  ['edificacao', 'Danos ou interferência em edificação, muro ou telhado'],
  ['calcada', 'Danos ou interferência em calçada / passeio público'],
  ['encanamento', 'Danos ou interferência em encanamento / rede subterrânea'],
  ['viario', 'Tráfego viário / sinalização'],
  ['obra', 'Interferência com obra autorizada']
];

function selectedConflicts(t) {
  if (Array.isArray(t.conflitos)) return t.conflitos.filter(Boolean);
  return t.conflito && t.conflito !== 'nenhum' ? [t.conflito] : [];
}

function conflictText(t) {
  const selected = selectedConflicts(t);
  if (!selected.length) return 'Nenhum conflito relevante';
  return selected.map(value => URBAN_CONFLICTS.find(([key]) => key === value)?.[1] || value).join('; ');
}
const INVENTORY_API_URL = 'https://script.google.com/macros/s/AKfycbzYaVf1-1iWrUVNZZkvNwPH1TvNqEqS7EYqu2goz-gNTO7tw5ZvKVPXz-HIZB6jrHiB/exec';
let inventoryTrees = [];
let linkedTree = null;
let processos = [];
let activeProcessFilter = 'todos';
let activeProcessSearch = '';
let fiscalProfiles = [];
let selectedProcessFiscalFilter = '';
let currentViewingProcessId = null;
let parecerNeedsRegeneration = true;
let pendingProcessSyncPromise = null;
const processSyncByProtocol = new Map();
let currentEditingProcessId = null;
let processAutosaveTimer = null;
let processAutoSyncTimer = null;
let processAutosaveChain = Promise.resolve();

const FISCAL_PROFILES_KEY = 'vistoria_fiscais';
const SELECTED_FISCAL_KEY = 'vistoria_fiscal_selecionado';
const PROCESS_FISCAL_FILTER_KEY = 'vistoria_filtro_fiscal';

let trees = [];

const defaultTree = i => ({
  numero: i + 1,
  popular: '',
  cientifico: '',
  familia: '',
  certeza: 'duvida',
  origem: 'duvida',
  protegida: 'duvida',
  flora: null,
  photos: {},
  predictions: [],
  dap: 0,
  altura: 0,
  latitude: '',
  longitude: '',
  gpsAccuracy: null,
  inventorySync: 'pending',
  condicao: 'viva',
  doenca: 'ausente',
  conflito: 'nenhum',
  conflitos: [],
  risco: 'nao',
  observacao: '',
  inventoryId: null
});

// Normaliza nome científico para os 2 primeiros termos (gênero + epíteto)
function canonical(n) {
  return String(n || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z\s]/g, '')
    .split(/\s+/)
    .slice(0, 2)
    .join(' ');
}

// Extrai gênero + epíteto limpo para consulta na API do JBRJ
function cleanBinomial(n) {
  const parts = String(n || '')
    .replace(/[\(\)\[\]]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]} ${parts[1]}`;
  }
  return parts[0] || '';
}

// Consulta no cadastro oficial da Portaria MMA nº 148/2022
function threatFor(name) {
  const k = canonical(name);
  if (!k) return null;
  const list = window.FLORA_AMEACADA?.especies || [];
  return list.find(x => canonical(x.nome) === k || canonical(x.nomeBase) === k) || null;
}

// Verifica regimes jurídicos e proteções especiais em Minas Gerais e Andradas
function specialFor(t) {
  const n = canonical(t.cientifico);
  const p = String(t.popular || '').toLowerCase();
  const out = [];

  if (t.flora?.ameaca) {
    out.push(`Lista Oficial da Flora Brasileira Ameaçada - Categoria ${t.flora.ameaca} (Portaria MMA nº 148/2022)`);
  }

  // Pequizeiro
  if (n === 'caryocar brasiliense' || /pequi|pequizeiro/.test(p)) {
    out.push('Pequizeiro (Caryocar brasiliense) — Espécie Imune de Corte em Minas Gerais (Leis Estaduais 10.883/1992 e 20.308/2012)');
  }

  // Buriti
  if (n.startsWith('mauritia') || /buriti/.test(p)) {
    out.push('Buriti (Mauritia spp.) — Espécie Imune de Corte em Minas Gerais (Lei Estadual 13.635/2000)');
  }

  // Ipê-amarelo
  const ipes = [
    'handroanthus albus', 'handroanthus chrysotrichus', 'handroanthus ochraceus',
    'handroanthus serratifolius', 'tabebuia chrysotricha', 'tabebuia alba',
    'tabebuia serratifolia', 'tabebuia ochracea'
  ];
  if (ipes.includes(n) || /ip[eê]-amarelo|pau-d['\s]?arco-amarelo/.test(p)) {
    out.push('Ipê-Amarelo — Espécie sob Proteção Especial no Estado de Minas Gerais (Leis Estaduais 9.743/1988 e 20.308/2012)');
  }

  // Araucária
  if (n === 'araucaria angustifolia' || /arauc[aá]ria|pinheiro-do-paran[aá]/.test(p)) {
    out.push('Araucária (Araucaria angustifolia) — Espécie Ameaçada de Extinção (EN - Portaria MMA 148/2022)');
  }

  // Cedro-rosa
  if (n === 'cedrela fissilis' || /cedro-rosa|cedro/.test(p)) {
    out.push('Cedro-rosa (Cedrela fissilis) — Espécie sob Ameaça (VU - Portaria MMA 148/2022)');
  }

  // Palmito-juçara
  if (n === 'euterpe edulis' || /palmito-ju[cç]ara|ju[cç]ara/.test(p)) {
    out.push('Palmito-juçara (Euterpe edulis) — Espécie sob Ameaça (VU - Portaria MMA 148/2022)');
  }

  // Jacarandá-da-bahia
  if (n === 'dalbergia nigra' || /jacarand[aá]-da-bahia/.test(p)) {
    out.push('Jacarandá-da-bahia (Dalbergia nigra) — Espécie sob Ameaça (VU - Portaria MMA 148/2022)');
  }

  // Pau-brasil
  if (n === 'paubrasilia echinata' || n === 'caesalpinia echinata' || /pau-brasil/.test(p)) {
    out.push('Pau-brasil (Paubrasilia echinata) — Espécie sob Ameaça (EN - Portaria MMA 148/2022)');
  }

  return [...new Set(out)];
}

// Monta o resumo da consulta taxonômica e ecológica
function floraBox(t) {
  if (!t.flora) {
    return '<span class="text-muted">Aguardando identificação e validação na Flora e Funga do Brasil.</span>';
  }
  const f = t.flora;
  const tags = [
    f.origem,
    f.mg ? 'Ocorrência em MG' : 'Sem ocorrência nativa em MG',
    f.endemismo ? `Endêmica: ${f.endemismo}` : '',
    ...(f.formas || []),
    ...(f.biomas || [])
  ].filter(Boolean);
  const special = specialFor(t);

  return `
    <div>
      <strong>${esc(f.nome)}</strong> · <span class="text-muted">${esc(f.familia || 'Família botânica não informada')}</span>
      <div class="flora-tags">
        ${tags.map(x => `<span class="tag">${esc(x)}</span>`).join('')}
      </div>
      <div class="${f.ameaca ? 'legal-alert' : 'legal-ok'}">
        ${f.ameaca ? `⚠ Enquadrada na Lista Oficial Federal: Categoria ${esc(f.ameaca)}` : '✓ Não localizada no Anexo I da Portaria MMA nº 148/2022.'}
      </div>
      ${special.map(x => `<div class="legal-alert">⚖ ${esc(x)}</div>`).join('')}
    </div>
  `;
}

const COMMON_TREES = [
  // Espécies nativas recomendadas e urbanas comuns em Andradas e região
  { popular: 'Ipê-amarelo', cientifico: 'Handroanthus chrysotrichus', familia: 'Bignoniaceae', origem: 'nativa', protegida: 'sim' },
  { popular: 'Ipê-amarelo-do-brejo', cientifico: 'Handroanthus albus', familia: 'Bignoniaceae', origem: 'nativa', protegida: 'sim' },
  { popular: 'Ipê-amarelo-cascudo', cientifico: 'Handroanthus serratifolius', familia: 'Bignoniaceae', origem: 'nativa', protegida: 'sim' },
  { popular: 'Ipê-branco', cientifico: 'Tabebuia roseoalba', familia: 'Bignoniaceae', origem: 'nativa', protegida: 'nao' },
  { popular: 'Ipê-roxo', cientifico: 'Handroanthus impetiginosus', familia: 'Bignoniaceae', origem: 'nativa', protegida: 'nao' },
  { popular: 'Ipê-rosa', cientifico: 'Handroanthus heptaphyllus', familia: 'Bignoniaceae', origem: 'nativa', protegida: 'nao' },
  { popular: 'Quaresmeira', cientifico: 'Pleroma granulosum', familia: 'Melastomataceae', origem: 'nativa', protegida: 'nao' },
  { popular: 'Quaresmeira-roxa', cientifico: 'Tibouchina granulosa', familia: 'Melastomataceae', origem: 'nativa', protegida: 'nao' },
  { popular: 'Sibipiruna', cientifico: 'Poincianella pluviosa', familia: 'Fabaceae', origem: 'nativa', protegida: 'nao' },
  { popular: 'Pata-de-vaca nativa', cientifico: 'Bauhinia forficata', familia: 'Fabaceae', origem: 'nativa', protegida: 'nao' },
  { popular: 'Pata-de-vaca (flor branca)', cientifico: 'Bauhinia variegata var. candida', familia: 'Fabaceae', origem: 'exotica', protegida: 'nao' },
  { popular: 'Pata-de-vaca (flor lilás/roxa)', cientifico: 'Bauhinia variegata', familia: 'Fabaceae', origem: 'exotica', protegida: 'nao' },
  { popular: 'Pitanga (Pitangueira)', cientifico: 'Eugenia uniflora', familia: 'Myrtaceae', origem: 'nativa', protegida: 'nao' },
  { popular: 'Jabuticaba (Jabuticabeira)', cientifico: 'Plinia cauliflora', familia: 'Myrtaceae', origem: 'nativa', protegida: 'nao' },
  { popular: 'Cambuci', cientifico: 'Campomanesia phaea', familia: 'Myrtaceae', origem: 'nativa', protegida: 'nao' },
  { popular: 'Cereja-do-mato', cientifico: 'Eugenia involucrata', familia: 'Myrtaceae', origem: 'nativa', protegida: 'nao' },
  { popular: 'Grumixama', cientifico: 'Eugenia brasiliensis', familia: 'Myrtaceae', origem: 'nativa', protegida: 'nao' },
  { popular: 'Goiaba (Goiabeira)', cientifico: 'Psidium guajava', familia: 'Myrtaceae', origem: 'nativa', protegida: 'nao' },
  { popular: 'Araçá', cientifico: 'Psidium cattleianum', familia: 'Myrtaceae', origem: 'nativa', protegida: 'nao' },
  { popular: 'Aroeira-salsa', cientifico: 'Schinus molle', familia: 'Anacardiaceae', origem: 'nativa', protegida: 'nao' },
  { popular: 'Aroeira-pimenteira', cientifico: 'Schinus terebinthifolia', familia: 'Anacardiaceae', origem: 'nativa', protegida: 'nao' },
  { popular: 'Manacá-da-serra', cientifico: 'Pleroma mutabile', familia: 'Melastomataceae', origem: 'nativa', protegida: 'nao' },
  { popular: 'Jacarandá-mimoso', cientifico: 'Jacaranda mimosifolia', familia: 'Bignoniaceae', origem: 'nativa', protegida: 'nao' },
  { popular: 'Jacarandá-da-bahia', cientifico: 'Dalbergia nigra', familia: 'Fabaceae', origem: 'nativa', protegida: 'sim' },
  { popular: 'Pau-ferro', cientifico: 'Libidibia ferrea', familia: 'Fabaceae', origem: 'nativa', protegida: 'nao' },
  { popular: 'Pau-brasil', cientifico: 'Paubrasilia echinata', familia: 'Fabaceae', origem: 'nativa', protegida: 'sim' },
  { popular: 'Cedro-rosa', cientifico: 'Cedrela fissilis', familia: 'Meliaceae', origem: 'nativa', protegida: 'sim' },
  { popular: 'Araucária (Pinheiro-do-paraná)', cientifico: 'Araucaria angustifolia', familia: 'Araucariaceae', origem: 'nativa', protegida: 'sim' },
  { popular: 'Pequi (Pequizeiro)', cientifico: 'Caryocar brasiliense', familia: 'Caryocaraceae', origem: 'nativa', protegida: 'sim' },
  { popular: 'Buriti', cientifico: 'Mauritia flexuosa', familia: 'Arecaceae', origem: 'nativa', protegida: 'sim' },
  { popular: 'Palmito-juçara', cientifico: 'Euterpe edulis', familia: 'Arecaceae', origem: 'nativa', protegida: 'sim' },
  { popular: 'Canafístula', cientifico: 'Peltophorum dubium', familia: 'Fabaceae', origem: 'nativa', protegida: 'nao' },
  { popular: 'Paineira-rosa', cientifico: 'Ceiba speciosa', familia: 'Malvaceae', origem: 'nativa', protegida: 'nao' },
  { popular: 'Jerivá (Coqueiro-jerivá)', cientifico: 'Syagrus romanzoffiana', familia: 'Arecaceae', origem: 'nativa', protegida: 'nao' },
  { popular: 'Macaúba', cientifico: 'Acrocomia aculeata', familia: 'Arecaceae', origem: 'nativa', protegida: 'nao' },
  { popular: 'Oiti', cientifico: 'Licania tomentosa', familia: 'Chrysobalanaceae', origem: 'nativa', protegida: 'nao' },
  { popular: 'Ingá', cientifico: 'Inga edulis', familia: 'Fabaceae', origem: 'nativa', protegida: 'nao' },
  { popular: 'Sombreiro (Clitória)', cientifico: 'Clitoria fairchildiana', familia: 'Fabaceae', origem: 'nativa', protegida: 'nao' },
  // Espécies exóticas frequentes em calçadas/jardins
  { popular: 'Acerola', cientifico: 'Malpighia emarginata', familia: 'Malpighiaceae', origem: 'exotica', protegida: 'nao' },
  { popular: 'Amora (Amoreira)', cientifico: 'Morus nigra', familia: 'Moraceae', origem: 'exotica', protegida: 'nao' },
  { popular: 'Resedá (Extremosa)', cientifico: 'Lagerstroemia indica', familia: 'Lythraceae', origem: 'exotica', protegida: 'nao' },
  { popular: 'Resedá-gigante', cientifico: 'Lagerstroemia speciosa', familia: 'Lythraceae', origem: 'exotica', protegida: 'nao' },
  { popular: 'Fícus (Benjamina)', cientifico: 'Ficus benjamina', familia: 'Moraceae', origem: 'exotica', protegida: 'nao' },
  { popular: 'Ficus microcarpa', cientifico: 'Ficus microcarpa', familia: 'Moraceae', origem: 'exotica', protegida: 'nao' },
  { popular: 'Ligustro (Alfeneiro)', cientifico: 'Ligustrum lucidum', familia: 'Oleaceae', origem: 'exotica', protegida: 'nao' },
  { popular: 'Ligustro-arbustivo', cientifico: 'Ligustrum sinense', familia: 'Oleaceae', origem: 'exotica', protegida: 'nao' },
  { popular: 'Flamboyant', cientifico: 'Delonix regia', familia: 'Fabaceae', origem: 'exotica', protegida: 'nao' },
  { popular: 'Chapéu-de-sol (Amendoeira)', cientifico: 'Terminalia catappa', familia: 'Combretaceae', origem: 'exotica', protegida: 'nao' },
  { popular: 'Tipuana', cientifico: 'Tipuana tipu', familia: 'Fabaceae', origem: 'exotica', protegida: 'nao' },
  { popular: 'Mangueira', cientifico: 'Mangifera indica', familia: 'Anacardiaceae', origem: 'exotica', protegida: 'nao' },
  { popular: 'Abacateiro', cientifico: 'Persea americana', familia: 'Lauraceae', origem: 'exotica', protegida: 'nao' },
  { popular: 'Grevílea', cientifico: 'Grevillea robusta', familia: 'Proteaceae', origem: 'exotica', protegida: 'nao' },
  { popular: 'Pinus (Pinheiro-americano)', cientifico: 'Pinus elliottii', familia: 'Pinaceae', origem: 'exotica', protegida: 'nao' },
  { popular: 'Eucalipto', cientifico: 'Eucalyptus spp.', familia: 'Myrtaceae', origem: 'exotica', protegida: 'nao' },
  { popular: 'Palmeira-imperial', cientifico: 'Roystonea oleracea', familia: 'Arecaceae', origem: 'exotica', protegida: 'nao' },
  { popular: 'Palmeira-seafórtia', cientifico: 'Archontophoenix cunninghamiana', familia: 'Arecaceae', origem: 'exotica', protegida: 'nao' },
  { popular: 'Espatódia (Bisnagueira)', cientifico: 'Spathodea campanulata', familia: 'Bignoniaceae', origem: 'exotica', protegida: 'nao' },
  { popular: 'Magnólia-amarela', cientifico: 'Magnolia champaca', familia: 'Magnoliaceae', origem: 'exotica', protegida: 'nao' },
  { popular: 'Chuva-de-ouro', cientifico: 'Cassia fistula', familia: 'Fabaceae', origem: 'exotica', protegida: 'nao' },
  { popular: 'Casuarina', cientifico: 'Casuarina equisetifolia', familia: 'Casuarinaceae', origem: 'exotica', protegida: 'nao' },
  { popular: 'Chorão (Salgueiro-chorão)', cientifico: 'Salix babylonica', familia: 'Salicaceae', origem: 'exotica', protegida: 'nao' },
  { popular: 'Leucena', cientifico: 'Leucaena leucocephala', familia: 'Fabaceae', origem: 'exotica', protegida: 'nao' },
  { popular: 'Sansão-do-campo', cientifico: 'Mimosa caesalpiniifolia', familia: 'Fabaceae', origem: 'nativa', protegida: 'nao' }
];

// Relação oficial do município de Andradas extraída do modelo de ofício do CODEMA
const MUNICIPAL_RECOMMENDED_TREES = [
  { nome: 'Ipê branco', cientifico: 'Tabebuia roseoalba', desc: 'Nativa, floração exuberante' },
  { nome: 'Pitanga', cientifico: 'Eugenia uniflora', desc: 'Nativa, frutífera atrativa da avifauna' },
  { nome: 'Quaresmeira', cientifico: 'Pleroma granulosum / Tibouchina granulosa', desc: 'Nativa, floração roxa/rosa' },
  { nome: 'Cambuci', cientifico: 'Campomanesia phaea', desc: 'Nativa, fruto tradicional da Mata Atlântica' },
  { nome: 'Cereja-do-mato', cientifico: 'Eugenia involucrata', desc: 'Nativa, excelente para calçadas e quintais' },
  { nome: 'Grumixama', cientifico: 'Eugenia brasiliensis', desc: 'Nativa, porte nobre e frutos saborosos' },
  { nome: 'Goiaba', cientifico: 'Psidium guajava', desc: 'Frutífera rústica e adaptada' },
  { nome: 'Acerola', cientifico: 'Malpighia emarginata', desc: 'Pequeno porte, ideal para calçadas estreitas' },
  { nome: 'Amora', cientifico: 'Morus nigra', desc: 'Frutífera de rápido crescimento' },
  { nome: 'Araçá', cientifico: 'Psidium cattleianum', desc: 'Nativa, alta rusticidade e frutos' },
  { nome: 'Aroeira salsa', cientifico: 'Schinus molle', desc: 'Nativa, copa graciosa, raízes não agressivas' }
];

function photoSlots(t, i) {
  return organs.map(([key, title]) => {
    const photo = safeImageSource(t.photos[key]);
    return `
    <div class="photo-slot-wrap">
      <label class="photo-slot" title="Escolher da galeria: ${title}">
        <input type="file" data-tree="${i}" data-organ="${key}" data-photo-source="gallery" accept="image/*">
        <div>
          ${photo ? `<img src="${photo}" width="900" height="675" loading="lazy" alt="${title}">` : `<span>+<br>${title}</span>`}
        </div>
      </label>
      <label class="photo-camera-action" title="Tirar foto de ${title}">
        <input type="file" data-tree="${i}" data-organ="${key}" data-photo-source="camera" accept="image/*" capture="environment">
        <span>📷 Câmera</span>
      </label>
    </div>
  `;
  }).join('');
}

// Template unificado de cada exemplar para a Etapa 2 (Vistoria a Campo)
function speciesTemplate(t, i) {
  const hasPhotos = Object.keys(t.photos).length > 0;
  return `
    <article class="tree-card" data-tree="${i}" id="species-card-${i}">
      <header class="tree-card-head">
        <div>
          <small>Exemplar Arbóreo nº ${i + 1}</small>
          <strong>${esc(t.popular || t.cientifico || 'Exemplar sem identificação')}</strong>
        </div>
        <div style="display:flex; gap:8px; align-items:center;">
          <span class="badge ${t.condicao === 'semvida' ? 'badge-urgent' : t.risco === 'sim' ? 'badge-urgent' : ''}">
            ${t.condicao === 'semvida' ? 'Sem vida biológica' : t.risco === 'sim' ? 'Risco iminente' : 'Normal'}
          </span>
          <span class="badge ${t.flora ? 'badge-ok' : ''}">${t.flora ? 'Flora consultada' : 'Aguardando dados'}</span>
        </div>
      </header>

      <div class="tree-body">
        <!-- BLOCO 1: REGISTRO FOTOGRÁFICO & PLANTNET -->
        <div class="subhead">
          <h3>Identificação Botânica do Exemplar</h3>
          <p>Tire fotos para o Pl@ntNet ou digite o <b>Nome Popular</b> para obter sugestões automáticas com nome científico.</p>
        </div>

        <div class="photo-slots">${photoSlots(t, i)}</div>

        <div class="identify-row">
          <button type="button" class="primary identify" ${hasPhotos ? '' : 'disabled'}>
            Identificar com Pl@ntNet
          </button>
          <small class="identify-status">
            ${hasPhotos ? `${Object.keys(t.photos).length} foto(s) anexada(s). Clique para enviar.` : 'Adicione pelo menos uma foto para identificação por IA.'}
          </small>
        </div>

        <div class="results" id="results-${i}">
          ${(t.predictions || []).map((r, n) => `
            <button type="button" class="result-option" data-tree="${i}" data-result="${n}">
              <span>
                <strong>${esc(r.scientific)}</strong>
                <small>${esc(r.common ? `${r.common} · ${r.family}` : r.family)}</small>
              </span>
              <span class="confidence">${Math.round(r.score * 100)}%</span>
            </button>
          `).join('')}
        </div>

        <!-- BLOCO 2: CAMPOS BOTÂNICOS COM AUTOCOMPLETE ÁGIL -->
        <div class="grid three" style="margin-top: 14px;">
          <div class="input-with-autocomplete">
            <label>Nome popular (digite para autocompletar)
              <input class="popular" value="${esc(t.popular)}" placeholder="Ex.: Ipê, Quaresmeira, Sibipiruna..." autocomplete="off">
            </label>
            <div class="popular-suggestions" id="pop-sugg-${i}" hidden></div>
          </div>

          <div class="input-with-button">
            <label>Nome científico
              <div class="input-group">
                <input class="cientifico" value="${esc(t.cientifico)}" placeholder="Ex.: Handroanthus albus">
                <button type="button" class="lookup" title="Validar na base oficial da Flora e Funga do Brasil">Consultar Flora</button>
              </div>
            </label>
          </div>

          <label>Família botânica
            <input class="familia" value="${esc(t.familia)}" placeholder="Ex.: Bignoniaceae">
          </label>

          <label>Origem da espécie
            <select class="origem">
              <option value="duvida" ${t.origem === 'duvida' ? 'selected' : ''}>Não determinada</option>
              <option value="nativa" ${t.origem === 'nativa' ? 'selected' : ''}>Nativa do Brasil</option>
              <option value="exotica" ${t.origem === 'exotica' ? 'selected' : ''}>Exótica (introduzida)</option>
            </select>
          </label>

          <label>Grau de confirmação
            <select class="certeza">
              <option value="duvida" ${t.certeza === 'duvida' ? 'selected' : ''}>Dúvida / Em conferência</option>
              <option value="provavel" ${t.certeza === 'provavel' ? 'selected' : ''}>Provável</option>
              <option value="confirmada" ${t.certeza === 'confirmada' ? 'selected' : ''}>Confirmada pelo fiscal</option>
            </select>
          </label>

          <label>Enquadramento legal
            <select class="protegida">
              <option value="duvida" ${t.protegida === 'duvida' ? 'selected' : ''}>Aguardando consulta</option>
              <option value="sim" ${t.protegida === 'sim' ? 'selected' : ''}>Protegida / Ameaçada / Caso Especial</option>
              <option value="nao" ${t.protegida === 'nao' ? 'selected' : ''}>Sem proteção especial</option>
            </select>
          </label>

          <div class="flora-box" id="flora-box-${i}">
            ${floraBox(t)}
          </div>
        </div>

        <!-- BLOCO 3: AVALIAÇÃO DE CAMPO, BIOMETRIA E RISCOS -->
        <div style="margin-top: 20px; padding-top: 16px; border-top: 1px dashed var(--line);">
          <div class="subhead" style="margin-bottom: 12px;">
            <h3 style="font-size: 0.98rem; display:flex; align-items:center; gap:6px;">
              <span>🩺</span> Avaliação Fitossanitária e Biometria de Campo
            </h3>
            <p>Registre a sanidade e conflitos. As medidas biométricas são utilizadas para o cálculo compensatório da DN 09/2026 e não aparecem no parecer emitido.</p>
          </div>

          <div class="grid three">
            <div class="tree-coordinate-panel full" data-tree-coordinate="${i}">
              <div class="tree-coordinate-head">
                <div><strong>Coordenada do exemplar nº ${i + 1}</strong><small>Cada árvore recebe seu próprio ponto no Inventário Arbóreo.</small></div>
                <button type="button" class="button-outline capture-tree-gps">Capturar GPS desta árvore</button>
              </div>
              <div class="grid two">
                <label>Latitude
                  <input class="tree-lat" inputmode="decimal" value="${esc(t.latitude || '')}" placeholder="-22.067420">
                </label>
                <label>Longitude
                  <input class="tree-lng" inputmode="decimal" value="${esc(t.longitude || '')}" placeholder="-46.568910">
                </label>
              </div>
              <small class="tree-gps-status">${t.latitude && t.longitude ? `Ponto registrado${t.gpsAccuracy ? ` (precisão ±${t.gpsAccuracy} m)` : ''}.` : 'Ponto ainda não registrado.'}</small>
            </div>

            <label>Condição biológica (Art. 2º VI e Art. 9º)
              <select class="condicao">
                <option value="viva" ${t.condicao === 'viva' ? 'selected' : ''}>Viva e viável</option>
                <option value="declinio" ${t.condicao === 'declinio' ? 'selected' : ''}>Em declínio severo</option>
                <option value="semvida" ${t.condicao === 'semvida' ? 'selected' : ''}>Sem vida biológica (morta / inviável)</option>
                <option value="duvida" ${t.condicao === 'duvida' ? 'selected' : ''}>Inconclusiva</option>
              </select>
            </label>

            <label>Sinais de pragas ou podridão
              <select class="doenca">
                <option value="ausente" ${t.doenca === 'ausente' ? 'selected' : ''}>Sem sinais aparentes</option>
                <option value="leve" ${t.doenca === 'leve' ? 'selected' : ''}>Sinais leves (tratável)</option>
                <option value="ativa" ${t.doenca === 'ativa' ? 'selected' : ''}>Infestação ativa / ocos</option>
                <option value="severa" ${t.doenca === 'severa' ? 'selected' : ''}>Podridão basal / brocas severas</option>
                <option value="duvida" ${t.doenca === 'duvida' ? 'selected' : ''}>Não avaliada</option>
              </select>
            </label>

            <fieldset class="urban-conflicts">
              <legend>Conflito urbano constatado</legend>
              <div class="conflict-checklist">
                ${URBAN_CONFLICTS.map(([value, text]) => `
                  <label>
                    <input class="conflito-option" type="checkbox" value="${value}" ${selectedConflicts(t).includes(value) ? 'checked' : ''}>
                    <span>${text}</span>
                  </label>
                `).join('')}
              </div>
              <small>Marque todos os conflitos observados. Deixe desmarcado quando não houver conflito relevante.</small>
            </fieldset>

            <label>Risco de queda (Art. 2º VII e Art. 10º)
              <select class="risco">
                <option value="nao" ${t.risco === 'nao' ? 'selected' : ''}>Sem risco aparente de queda</option>
                <option value="monitorar" ${t.risco === 'monitorar' ? 'selected' : ''}>Risco potencial (monitorar)</option>
                <option value="sim" ${t.risco === 'sim' ? 'selected' : ''}>Risco atual ou iminente (urgência)</option>
                <option value="duvida" ${t.risco === 'duvida' ? 'selected' : ''}>Inconclusivo / requer laudo</option>
              </select>
            </label>

            <label>DAP - Diâmetro à Altura do Peito (cm)
              <input class="dap" type="number" min="0" max="500" step="0.5" value="${t.dap || ''}" placeholder="Ex.: 25">
              <small class="text-muted" style="display:block; font-size:0.75rem; margin-top:2px;">*Cálculo compensatório interno. Não sai no parecer.</small>
            </label>

            <label>Altura total estimada (m)
              <input class="altura" type="number" min="0" max="100" step="0.5" value="${t.altura || ''}" placeholder="Ex.: 8">
              <small class="text-muted" style="display:block; font-size:0.75rem; margin-top:2px;">*Registro de campo. Não sai no parecer.</small>
            </label>

            <label class="full">Observações específicas deste exemplar
              <textarea class="observacao" data-case-normalize="sentence" rows="2" placeholder="Descreva particularidades do exemplar, tais como inclinação do fuste, necroses, podridão do colo ou proximidade com rede.">${esc(t.observacao)}</textarea>
            </label>
          </div>
        </div>
      </div>
    </article>
  `;
}

// Sincroniza dados da Etapa 2 lendo os inputs da tela para o objeto trees
function syncSpecies() {
  document.querySelectorAll('#trees-container .tree-card').forEach((c, i) => {
    if (!trees[i]) return;
    const t = trees[i];
    for (const k of ['popular', 'cientifico', 'familia', 'certeza', 'origem', 'protegida', 'condicao', 'doenca', 'risco', 'observacao']) {
      const el = c.querySelector('.' + k);
      if (el) t[k] = el.value;
    }
    t.conflitos = [...c.querySelectorAll('.conflito-option:checked')].map(el => el.value);
    t.conflito = t.conflitos[0] || 'nenhum';
    const dapEl = c.querySelector('.dap');
    if (dapEl) t.dap = Math.max(0, Number(dapEl.value) || 0);
    const altEl = c.querySelector('.altura');
    if (altEl) t.altura = Math.max(0, Number(altEl.value) || 0);
    const latEl = c.querySelector('.tree-lat');
    const lngEl = c.querySelector('.tree-lng');
    if (latEl) t.latitude = normalizeCoordinateValue(latEl.value);
    if (lngEl) t.longitude = normalizeCoordinateValue(lngEl.value);
  });
}

function syncAssessment() {
  syncSpecies();
}

// Sincroniza um card específico sem re-renderizar todo o DOM
function syncCard(i) {
  const sc = document.getElementById(`species-card-${i}`);
  if (sc && trees[i]) {
    for (const k of ['popular', 'cientifico', 'familia', 'certeza', 'origem', 'protegida', 'condicao', 'doenca', 'risco', 'observacao']) {
      const el = sc.querySelector('.' + k);
      if (el) trees[i][k] = el.value;
    }
    trees[i].conflitos = [...sc.querySelectorAll('.conflito-option:checked')].map(el => el.value);
    trees[i].conflito = trees[i].conflitos[0] || 'nenhum';
    const dapEl = sc.querySelector('.dap');
    if (dapEl) trees[i].dap = Math.max(0, Number(dapEl.value) || 0);
    const altEl = sc.querySelector('.altura');
    if (altEl) trees[i].altura = Math.max(0, Number(altEl.value) || 0);
    const latEl = sc.querySelector('.tree-lat');
    const lngEl = sc.querySelector('.tree-lng');
    if (latEl) trees[i].latitude = normalizeCoordinateValue(latEl.value);
    if (lngEl) trees[i].longitude = normalizeCoordinateValue(lngEl.value);
  }
}

// Renderiza todos os cards (usado na inicialização e ao mudar a quantidade de árvores)
function renderAll(capture = true) {
  if (capture) {
    syncSpecies();
  }
  const q = Math.max(1, Math.min(100, Math.floor(Number(val('quantidade')) || 1)));
  trees = Array.from({ length: q }, (_, i) => trees[i] || defaultTree(i));

  const tc = $('trees-container');
  if (tc) tc.innerHTML = trees.map(speciesTemplate).join('');

  bindSpecies();
  update();
}

function bindSpecies() {
  document.querySelectorAll('#trees-container .tree-card').forEach((card, i) => {
    // Carregamento de imagens
    card.querySelectorAll('.photo-slot-wrap input[type="file"]').forEach(inp => {
      inp.addEventListener('change', e => {
        const file = e.target.files?.[0];
        if (!file) return;
        loadPhoto(file, src => {
          trees[i].photos[e.target.dataset.organ] = src;
          const slot = inp.closest('.photo-slot-wrap')?.querySelector('.photo-slot');
          if (slot) {
            slot.querySelector('div').innerHTML = `<img src="${safeImageSource(src)}" width="900" height="675" loading="lazy" alt="Foto adicionada">`;
          }
          const idBtn = card.querySelector('.identify');
          if (idBtn) idBtn.disabled = false;
          const status = card.querySelector('.identify-status');
          if (status) status.textContent = `${Object.keys(trees[i].photos).length} foto(s) anexada(s). Clique para identificar.`;
          scheduleProcessAutosave();
        });
      });
    });

    // Identificação via Pl@ntNet
    const idBtn = card.querySelector('.identify');
    if (idBtn) {
      idBtn.addEventListener('click', () => identifyTree(i, card));
    }
    card.querySelector('.capture-tree-gps')?.addEventListener('click', () => captureTreeGPS(i, card));

    // Consulta na Flora do Brasil
    const lookBtn = card.querySelector('.lookup');
    if (lookBtn) {
      lookBtn.addEventListener('click', () => {
        syncCard(i);
        lookupFlora(i, card);
      });
    }

    // Clique nas opções sugeridas pelo Pl@ntNet
    card.querySelectorAll('.result-option').forEach(b => {
      b.addEventListener('click', () => {
        const n = Number(b.dataset.result);
        choosePrediction(i, n);
      });
    });

    // AUTOCOMPLETE ÁGIL DO NOME POPULAR
    const popInput = card.querySelector('.popular');
    const suggBox = card.querySelector(`#pop-sugg-${i}`);
    if (popInput && suggBox) {
      popInput.addEventListener('input', () => {
        const query = popInput.value.trim().toLowerCase();
        if (query.length < 2) {
          suggBox.hidden = true;
          suggBox.innerHTML = '';
          return;
        }

        const matches = COMMON_TREES.filter(t => {
          return t.popular.toLowerCase().includes(query) ||
                 t.cientifico.toLowerCase().includes(query);
        }).slice(0, 8);

        if (!matches.length) {
          suggBox.hidden = true;
          suggBox.innerHTML = '';
          return;
        }

        suggBox.innerHTML = matches.map((m, idx) => `
          <div class="pop-sugg-item" data-idx="${idx}">
            <div class="sugg-top">
              <strong>🌳 ${esc(m.popular)}</strong>
              <span class="tag-origin ${m.origem}">${m.origem === 'nativa' ? 'Nativa' : 'Exótica'}</span>
            </div>
            <div class="sugg-bot">
              <em>${esc(m.cientifico)}</em> · <small>${esc(m.familia)}</small>
            </div>
          </div>
        `).join('');
        suggBox.hidden = false;

        // Clique em uma sugestão
        suggBox.querySelectorAll('.pop-sugg-item').forEach(item => {
          item.addEventListener('click', () => {
            const idx = Number(item.dataset.idx);
            const chosen = matches[idx];
            if (!chosen) return;

            // Preenche o objeto da árvore
            trees[i].popular = chosen.popular;
            trees[i].cientifico = chosen.cientifico;
            trees[i].familia = chosen.familia;
            trees[i].origem = chosen.origem;
            trees[i].protegida = chosen.protegida || 'nao';
            trees[i].certeza = 'confirmada';

            // Preenche os campos do card no DOM
            popInput.value = chosen.popular;
            const sciInp = card.querySelector('.cientifico');
            if (sciInp) sciInp.value = chosen.cientifico;
            const famInp = card.querySelector('.familia');
            if (famInp) famInp.value = chosen.familia;
            const origSel = card.querySelector('.origem');
            if (origSel) origSel.value = chosen.origem;
            const protSel = card.querySelector('.protegida');
            if (protSel) protSel.value = chosen.protegida;
            const certSel = card.querySelector('.certeza');
            if (certSel) certSel.value = 'confirmada';

            const cardTitle = card.querySelector('.tree-card-head strong');
            if (cardTitle) cardTitle.textContent = chosen.popular;

            suggBox.hidden = true;
            suggBox.innerHTML = '';

            // Dispara validação taxonômica oficial na Flora do Brasil
            lookupFlora(i, card);
            update();
          });
        });
      });

      // Fecha o menu de sugestões se clicar fora
      document.addEventListener('click', e => {
        if (!popInput.contains(e.target) && !suggBox.contains(e.target)) {
          suggBox.hidden = true;
        }
      });
    }

    // Atualização reativa de digitação e selects
    card.addEventListener('input', () => {
      syncCard(i);
      const title = card.querySelector('.tree-card-head strong');
      if (title) title.textContent = trees[i].popular || trees[i].cientifico || 'Exemplar sem identificação';
      const badge = card.querySelector('.tree-card-head .badge');
      if (badge) {
        badge.textContent = trees[i].condicao === 'semvida' ? 'Sem vida biológica' : trees[i].risco === 'sim' ? 'Risco iminente' : 'Normal';
        badge.className = 'badge ' + (trees[i].condicao === 'semvida' || trees[i].risco === 'sim' ? 'badge-urgent' : '');
      }
      update();
    });

    card.addEventListener('change', () => {
      syncCard(i);
      update();
    });
  });
}

function bindAssessment() {
  // Integrado no bindSpecies
}

// Comprime imagem usando Canvas para manter a requisição rápida e leve
function loadPhoto(file, done) {
  if (!file) return;
  if (!String(file.type || '').startsWith('image/')) {
    alert('Selecione um arquivo de imagem da câmera ou da galeria.');
    return;
  }
  const r = new FileReader();
  r.onload = () => {
    const img = new Image();
    img.onload = () => {
      const max = 900;
      const s = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * s);
      c.height = Math.round(img.height * s);
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0, c.width, c.height);
      done(c.toDataURL('image/jpeg', 0.76));
    };
    img.onerror = () => alert('Não foi possível abrir esta imagem. Se ela estiver em HEIC, escolha a versão JPG/PNG da galeria.');
    img.src = r.result;
  };
  r.onerror = () => alert('Não foi possível ler a imagem selecionada.');
  r.readAsDataURL(file);
}

// Identifica via API do Pl@ntNet
async function identifyTree(i, card) {
  syncCard(i);
  const key = val('plantnet-key') || localStorage.getItem('plantnetApiKey') || '';
  const status = card.querySelector('.identify-status');
  const button = card.querySelector('.identify');

  if (button) button.disabled = true;
  if (status) status.textContent = 'Enviando fotos para o Pl@ntNet…';

  try {
    const form = new FormData();
    let photoCount = 0;
    for (const [organ] of organs) {
      const src = trees[i].photos[organ];
      if (!src) continue;
      const blob = await (await fetch(src)).blob();
      form.append('images', blob, `${organ}.jpg`);
      photoCount++;
    }

    if (!photoCount) {
      throw new Error('Nenhuma foto foi selecionada.');
    }

    const endpoint = '/api/identify' + (key ? '?key=' + encodeURIComponent(key) : '');
    const response = await fetch(endpoint, { method: 'POST', body: form });
    const raw = await response.text();
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      throw new Error(`Servidor respondeu HTTP ${response.status}`);
    }

    if (!response.ok) {
      throw new Error(data.message || data.error || `Erro HTTP ${response.status}`);
    }

    trees[i].predictions = (data.results || []).slice(0, 5).map(x => ({
      score: x.score || 0,
      scientific: x.species?.scientificNameWithoutAuthor || x.species?.scientificName || '',
      family: x.species?.family?.scientificNameWithoutAuthor || '',
      common: (x.species?.commonNames || [])[0] || ''
    }));

    if (!trees[i].predictions.length) {
      if (status) status.textContent = 'Nenhuma espécie compatível foi encontrada.';
      return;
    }

    // Renderiza a lista de opções sugeridas no card sem reconstruir o formulário inteiro
    const resultsContainer = card.querySelector('.results');
    if (resultsContainer) {
      resultsContainer.innerHTML = trees[i].predictions.map((r, n) => `
        <button type="button" class="result-option" data-tree="${i}" data-result="${n}">
          <span>
            <strong>${esc(r.scientific)}</strong>
            <small>${esc(r.common ? `${r.common} · ${r.family}` : r.family)}</small>
          </span>
          <span class="confidence">${Math.round(r.score * 100)}%</span>
        </button>
      `).join('');

      resultsContainer.querySelectorAll('.result-option').forEach(b => {
        b.addEventListener('click', () => choosePrediction(i, Number(b.dataset.result)));
      });
    }

    const top = trees[i].predictions[0];
    trees[i].cientifico = top.scientific;
    trees[i].familia = top.family;
    if (top.common) trees[i].popular = top.common;
    trees[i].certeza = top.score >= 0.65 ? 'provavel' : 'duvida';

    // Atualiza os inputs do card
    const popInp = card.querySelector('.popular');
    if (popInp && top.common) popInp.value = top.common;
    const sciInp = card.querySelector('.cientifico');
    if (sciInp) sciInp.value = top.scientific;
    const famInp = card.querySelector('.familia');
    if (famInp) famInp.value = top.family;
    const certInp = card.querySelector('.certeza');
    if (certInp) certInp.value = trees[i].certeza;

    const cardHead = card.querySelector('.tree-card-head strong');
    if (cardHead) cardHead.textContent = trees[i].popular || trees[i].cientifico;

    if (status) {
      status.textContent = `Sugestão selecionada: ${top.scientific} (${Math.round(top.score * 100)}%). Validando na Flora do Brasil…`;
    }

    await lookupFlora(i, card);
  } catch (e) {
    if (status) status.textContent = 'Falha na identificação: ' + e.message;
  } finally {
    if (button) button.disabled = false;
  }
}

// Seleciona uma das opções de identificação
async function choosePrediction(i, n) {
  syncCard(i);
  const p = trees[i].predictions[n];
  if (!p) return;
  trees[i].cientifico = p.scientific;
  trees[i].familia = p.family;
  if (!trees[i].popular && p.common) trees[i].popular = p.common;
  trees[i].certeza = p.score >= 0.65 ? 'provavel' : 'duvida';

  const card = document.getElementById(`species-card-${i}`);
  if (card) {
    const popInp = card.querySelector('.popular');
    if (popInp && trees[i].popular) popInp.value = trees[i].popular;
    const sciInp = card.querySelector('.cientifico');
    if (sciInp) sciInp.value = trees[i].cientifico;
    const famInp = card.querySelector('.familia');
    if (famInp) famInp.value = trees[i].familia;
    const certInp = card.querySelector('.certeza');
    if (certInp) certInp.value = trees[i].certeza;
    const cardHead = card.querySelector('.tree-card-head strong');
    if (cardHead) cardHead.textContent = trees[i].popular || trees[i].cientifico;

    await lookupFlora(i, card);
  }
}

// Consulta taxonômica e ecológica oficial (JBRJ - Flora e Funga do Brasil)
async function lookupFlora(i, card) {
  syncCard(i);
  const rawQ = trees[i].cientifico.trim();
  const box = card.querySelector('.flora-box') || document.getElementById(`flora-box-${i}`);
  if (!rawQ) {
    if (box) box.innerHTML = '<span class="text-muted">Informe o nome científico para validação na Flora do Brasil.</span>';
    return;
  }

  const queryBinomial = cleanBinomial(rawQ);
  if (box) box.innerHTML = `<em>Consultando "${esc(queryBinomial)}" na Flora e Funga do Brasil…</em>`;

  try {
    const r = await fetch(`https://servicos.jbrj.gov.br/v2/flora/taxon/${encodeURIComponent(queryBinomial)}`);
    const list = await r.json();

    if (!r.ok || !Array.isArray(list) || !list.length) {
      throw new Error(`Táxon "${queryBinomial}" não encontrado na base oficial.`);
    }

    const accepted = list.find(v => v.taxon?.taxonomicstatus === 'NOME_ACEITO') || list[0];
    const tax = accepted.taxon || {};
    const dist = accepted.distribuition || [];
    const profile = accepted.specie_profile || {};
    const threat = threatFor(tax.scientificname || queryBinomial);
    const origins = [...new Set(dist.map(d => d.establishmentmeans).filter(Boolean))];

    trees[i].cientifico = tax.scientificname || rawQ;
    if (tax.family) trees[i].familia = tax.family;

    // Determina nativa / exótica
    if (origins.some(x => /nativa/i.test(x))) {
      trees[i].origem = 'nativa';
    } else if (origins.some(x => /cultivada|naturalizada|ex[oó]tica/i.test(x))) {
      trees[i].origem = 'exotica';
    } else {
      trees[i].origem = 'duvida';
    }

    trees[i].flora = {
      nome: tax.scientificname || rawQ,
      familia: tax.family || trees[i].familia,
      origem: origins.join(', ') || (trees[i].origem === 'nativa' ? 'Nativa do Brasil' : 'Não informada'),
      mg: dist.some(d => d.locationid === 'BR-MG'),
      endemismo: dist.map(d => d.occurrenceremarks?.endemism).find(Boolean) || '',
      formas: profile.lifeForm || [],
      biomas: [...new Set(dist.flatMap(d => d.occurrenceremarks?.phytogeographicDomain || []))],
      ameaca: threat?.categoria || ''
    };

    // Caso de proteção especial
    const specials = specialFor(trees[i]);
    trees[i].protegida = specials.length > 0 || !!threat ? 'sim' : 'nao';

    // Se o nome popular estiver vazio, tenta extrair do vernáculo oficial
    if (!trees[i].popular) {
      const v = (accepted.vernacular_name || []).find(vn => vn.language_vernacularname === 'PORTUGUES');
      if (v?.vernacularname) {
        trees[i].popular = v.vernacularname;
        const popInp = card.querySelector('.popular');
        if (popInp) popInp.value = trees[i].popular;
      }
    }

    // Atualiza os selects do card
    const origSel = card.querySelector('.origem');
    if (origSel) origSel.value = trees[i].origem;
    const protSel = card.querySelector('.protegida');
    if (protSel) protSel.value = trees[i].protegida;
    const famInp = card.querySelector('.familia');
    if (famInp && trees[i].familia) famInp.value = trees[i].familia;
    const sciInp = card.querySelector('.cientifico');
    if (sciInp) sciInp.value = trees[i].cientifico;

    // Atualiza o quadro da Flora
    if (box) box.innerHTML = floraBox(trees[i]);
    const badge = card.querySelector('.badge');
    if (badge) {
      badge.textContent = 'Flora consultada';
      badge.classList.add('badge-ok');
    }

    update();
  } catch (e) {
    if (box) {
      box.innerHTML = `
        <span class="text-danger">Aviso: ${esc(e.message)}</span><br>
        <small class="text-muted">A espécie pode ser pesquisada manualmente ou inserida diretamente.</small>
      `;
    }
  }
}

// Faixas de DAP conforme Art. 7º da DN CODEMA 09/2026
function dapBand(d) {
  if (d < 5) return 'jovem'; // < 5cm: exemplar jovem / arvoreta
  if (d <= 15) return 5;     // 05 a 15 cm
  if (d <= 30) return 16;    // 16 a 30 cm
  if (d <= 49) return 31;    // 31 a 49 cm
  if (d <= 70) return 50;    // 50 a 70 cm
  if (d <= 90) return 71;    // 71 a 90 cm
  return 91;                 // > 90 cm
}

// Avaliação técnico-jurídica conforme DN CODEMA 09/2026
function evaluate() {
  syncSpecies();
  syncAssessment();

  const triggers = [];
  const area = val('area');
  const intervencao = val('intervencao');
  const especial = val('especial');
  const conclusao = val('conclusao');

  // Hipóteses de deliberação obrigatória da Plenária do CODEMA (Art. 3º § 2º)
  if (trees.some(t => t.protegida === 'sim' || specialFor(t).length > 0)) {
    triggers.push('espécie protegida, ameaçada de extinção ou caso especial (Art. 3º § 2º I)');
  }
  if (area === 'app') {
    triggers.push('localização em Área de Preservação Permanente - APP (Art. 3º § 2º II)');
  }
  if (['publica', 'verde'].includes(area)) {
    triggers.push('localização em área pública ou área verde (Art. 3º § 2º III)');
  }
  if (val('grande') === 'sim') {
    triggers.push('árvore de grande porte (Art. 3º § 2º IV)');
  }
  if (val('valor') === 'sim') {
    triggers.push('relevante valor paisagístico, histórico ou cultural (Art. 3º § 2º V)');
  }
  if (val('impacto') === 'sim') {
    triggers.push('intervenção com impacto ambiental significativo (Art. 3º § 2º VI)');
  }
  if (val('impacto') === 'duvida' || especial === 'sensivel') {
    triggers.push('caso tecnicamente controverso ou área sensível (Art. 3º § 2º VII)');
  }
  if (intervencao === 'transplante') {
    triggers.push('transplante de árvore (Art. 14º - deliberação obrigatória do CODEMA)');
  }

  // Risco de queda atual / iminente (Art. 2º VII e Art. 10º)
  const urgent = trees.some(t => t.risco === 'sim');

  // Dúvidas ou pendências técnicas
  const doubts = trees.some(t =>
    t.certeza === 'duvida' ||
    t.origem === 'duvida' ||
    t.risco === 'duvida' ||
    t.dap <= 0
  ) || ['grande', 'valor', 'impacto'].some(x => val(x) === 'duvida');

  // Exigência de PTRF (Art. 15º da DN 09/2026)
  // I - corte superior a 15 árvores (>15); II - áreas sensíveis; III - espécies de relevante valor ambiental
  const ptrf = trees.length > 15 ||
    ['app', 'verde'].includes(area) ||
    especial === 'sensivel' ||
    trees.some(t => t.protegida === 'sim');

  return {
    triggers,
    codema: triggers.length > 0,
    urgent,
    doubts,
    ptrf,
    conclusao
  };
}

function getDestinacaoTipo() {
  return val('destinacao-tipo') || document.querySelector('input[name="destinacao-tipo"]:checked')?.value || 'requerente';
}

function decisaoAutoriza(conclusao = val('conclusao')) {
  return conclusao === 'deferir' || conclusao === 'condicionado';
}

function intervencaoAutorizada() {
  const escolhida = val('intervencao-autorizada');
  if (escolhida) return escolhida;
  return ['poda', 'podadrastica'].includes(val('intervencao')) ? 'poda' : 'corte';
}

function textoIntervencaoAutorizada() {
  return ({ corte: 'corte ou supressão', poda: 'poda', corte_poda: 'corte e poda' })[intervencaoAutorizada()] || label('intervencao').toLowerCase();
}

function exigeCompensacao() {
  return decisaoAutoriza() && intervencaoAutorizada() !== 'poda' && val('forma') !== 'naoaplica';
}

function situacaoDoParecer(destinacao = getDestinacaoTipo()) {
  const conclusao = val('conclusao');
  if (conclusao === 'indeferir') return 'Indeferido';
  if (conclusao === 'diligencia') return 'Parecer em Elaboração';
  if (destinacao === 'codema') return 'Enviado para Deliberação do CODEMA';
  if (destinacao === 'obras') return 'Encaminhado para Corte pela Secretaria de Obras';
  if (destinacao === 'planejamento') return 'Encaminhado para a Secretaria de Planejamento';
  return exigeCompensacao() ? 'Aguardando Compensação' : 'Parecer em Elaboração';
}

function syncDecisionControls() {
  const autorizada = $('intervencao-autorizada');
  const forma = $('forma');
  const positiva = decisaoAutoriza();
  if (autorizada) {
    if (!autorizada.dataset.initialized) {
      autorizada.value = ['poda', 'podadrastica'].includes(val('intervencao')) ? 'poda' : 'corte';
      autorizada.dataset.initialized = 'true';
    }
    if (!positiva) autorizada.value = 'naoaplica';
    else if (autorizada.value === 'naoaplica') autorizada.value = ['poda', 'podadrastica'].includes(val('intervencao')) ? 'poda' : 'corte';
    autorizada.disabled = !positiva;
  }
  if (forma) {
    const semCompensacao = !positiva || intervencaoAutorizada() === 'poda';
    if (semCompensacao) {
      if (forma.value !== 'naoaplica') forma.dataset.valorAnterior = forma.value;
      forma.dataset.forcadaSemCompensacao = 'true';
      forma.value = 'naoaplica';
    } else if (forma.dataset.forcadaSemCompensacao === 'true') {
      forma.value = forma.dataset.valorAnterior || 'direta';
      delete forma.dataset.forcadaSemCompensacao;
    }
    forma.disabled = semCompensacao;
  }
  const botaoCompensacao = $('btn-ir-compensacao');
  if (botaoCompensacao) botaoCompensacao.hidden = !exigeCompensacao();
}

// Cálculo da compensação ambiental conforme Deliberação Normativa CODEMA 09/2026
function calculateCompensation() {
  const conc = val('conclusao');
  if (!decisaoAutoriza(conc)) {
    return {
      text: conc === 'indeferir'
        ? 'Intervenção indeferida. Não há fixação de compensação ambiental.'
        : 'Aguardando diligência técnica ou laudo complementar para fixação da compensação.',
      mudas: 0,
      ufm: 0,
      detalhes: []
    };
  }

  const interv = val('intervencao');
  const especial = val('especial');
  const forma = val('forma');

  if (intervencaoAutorizada() === 'poda') {
    return { text: 'Poda autorizada. Não se aplica compensação ambiental.', mudas: 0, ufm: 0, detalhes: [] };
  }
  if (forma === 'naoaplica') {
    return { text: 'Não se aplica compensação ambiental.', mudas: 0, ufm: 0, detalhes: [] };
  }

  // Caso: Cerca-viva (Art. 11º)
  if (especial === 'cercaviva') {
    return {
      text: 'Compensação de Cerca-Viva (Art. 11º): 1 muda de no mínimo 1,5m ou 40 UFM para cada 10 metros lineares vistoriados.',
      mudas: 0,
      ufm: 0,
      detalhes: ['Cerca-viva: calcular proporção de 1 muda ou 40 UFM a cada 10m lineares conforme vistoria.']
    };
  }

  // Caso: Transplante (Art. 14º)
  if (interv === 'transplante') {
    const qtd = trees.length;
    return {
      text: `Transplante (Art. 14º): Reposição de ${qtd} árvore(s) no local na proporção 1:1, conforme proposta ao CODEMA.`,
      mudas: qtd,
      ufm: 0,
      detalhes: [`Reposição no local de ${qtd} árvore(s) transplantada(s) (proporção 1:1).`]
    };
  }

  // Caso: Obra pública municipal (Art. 16º)
  if (especial === 'obra' || val('executor') === 'obras') {
    const qtd = trees.length;
    const mudas = qtd * 1;
    const ufm = qtd * 80;
    return {
      text: `Obra Pública Municipal (Art. 16º): ${mudas} muda(s) nativa(s) ou ${ufm} UFM depositadas no FMMA.`,
      mudas,
      ufm,
      detalhes: [`Art. 16º: 1 muda nativa por árvore suprimida ou 80 UFM/muda ao Fundo Municipal de Meio Ambiente.`]
    };
  }

  // Tabela Geral - Art. 7º DN CODEMA 09/2026:
  // DAP: [mudas, ufm]
  const table = {
    exotica: {
      5: [1, 40],
      16: [2, 80],
      31: [3, 120],
      50: [4, 160],
      71: [5, 200],
      91: [6, 240]
    },
    nativa: {
      5: [2, 80],
      16: [4, 160],
      31: [6, 240],
      50: [8, 320],
      71: [10, 400],
      91: [12, 480]
    }
  };

  let totalMudas = 0;
  let totalUfm = 0;
  const pendencias = [];
  const detalhes = [];

  trees.forEach(t => {
    // Dispensa para exótica sem vida biológica (Art. 9º § 2º)
    if (t.condicao === 'semvida' && t.origem === 'exotica' && forma === 'dispensa') {
      detalhes.push(`Árvore ${t.numero} (${t.popular || t.cientifico || 'Exótica'}): Dispensada de compensação nos termos do Art. 9º § 2º da DN 09/2026 (exótica sem vida biológica).`);
      return;
    }

    if (t.origem === 'duvida') {
      pendencias.push(`Árvore ${t.numero} (origem nativa/exótica não determinada)`);
      return;
    }

    const band = dapBand(t.dap);
    if (band === 'jovem') {
      detalhes.push(`Árvore nº ${t.numero} (${t.popular || t.cientifico || 'Exemplar'}, exemplar jovem): Reposição 1:1 recomendada.`);
      totalMudas += 1;
      totalUfm += (t.origem === 'nativa' ? 80 : 40);
      return;
    }

    if (!band) {
      pendencias.push(`Árvore nº ${t.numero} (porte biométrico não informado)`);
      return;
    }

    const row = table[t.origem]?.[band];
    if (!row) {
      pendencias.push(`Árvore nº ${t.numero} (faixa não identificada)`);
      return;
    }

    let [m, u] = row;
    let motivoAgravante = '';

    // Agravante: Espécie ameaçada ou protegida (+100% conforme Art. 7º § 1º I)
    if (t.protegida === 'sim' || specialFor(t).length > 0) {
      m *= 2;
      u *= 2;
      motivoAgravante = ' (+100% agravante por espécie protegida/ameaçada - Art. 7º § 1º I)';
    }

    totalMudas += m;
    totalUfm += u;
    const nomeIdent = t.popular ? `${t.popular} (${t.cientifico || 'espécie identificada'})` : (t.cientifico || 'Exemplar vistoriado');
    detalhes.push(`Árvore nº ${t.numero} [${nomeIdent}, ${t.origem === 'nativa' ? 'Nativa' : 'Exótica'}]: ${m} muda(s) nativa(s) ou ${u} UFM${motivoAgravante}.`);
  });

  const baseText = `${totalMudas} muda(s) nativa(s) ou ${totalUfm} UFM`;
  const pendText = pendencias.length ? ` [Pendente de validação para: ${pendencias.join(', ')}]` : '';

  return {
    text: `${baseText}${pendText}`,
    mudas: totalMudas,
    ufm: totalUfm,
    pendencias,
    detalhes
  };
}

function model(e) {
  const destinacao = getDestinacaoTipo();
  if (destinacao === 'codema') {
    return 'Ofício de Encaminhamento ao CODEMA (Deliberação Plenária)';
  }
  if (destinacao === 'obras') {
    return 'Ofício à Secretaria de Obras (Execução com Maquinário Público)';
  }
  if (destinacao === 'planejamento') {
    return 'Encaminhamento à Secretaria de Planejamento Urbano';
  }
  if (e.conclusao === 'diligencia' || e.doubts) {
    return 'Parecer de Diligência Técnica / Complementação';
  }
  if (e.conclusao === 'indeferir') {
    return 'Parecer Técnico de Indeferimento';
  }
  if (e.urgent) {
    return 'Autorização Ambiental de Urgência (Risco Iminente - Art. 10º)';
  }
  return 'Parecer Técnico de Vistoria Ambiental / Autorização';
}

function route(e) {
  if (e.urgent) {
    return 'Autorização imediata de urgência com formalização da compensação em até 15 dias (Art. 10º da DN 09/2026).';
  }
  if (e.codema) {
    return 'Submissão obrigatória à Plenária do CODEMA para deliberação colegiada (Art. 3º § 2º da DN 09/2026).';
  }
  return 'Decisão administrativa direta pela Divisão de Meio Ambiente / SPUMA (Art. 3º § 1º).';
}

function update() {
  if (!trees.length) return;
  syncDecisionControls();
  const e = evaluate();
  const comp = calculateCompensation();

  const rotaEl = $('rota');
  if (rotaEl) {
    rotaEl.querySelector('strong').textContent = route(e);
    rotaEl.className = e.urgent ? 'urgente' : e.codema ? 'codema' : '';
  }

  const modeloEl = $('modelo');
  if (modeloEl) {
    modeloEl.querySelector('strong').textContent = model(e);
  }

  const compEl = $('compensacao');
  if (compEl) {
    compEl.querySelector('strong').textContent = comp.text;
  }

  const w = [];
  if (e.doubts) {
    w.push('Existem dados biométricos, de origem ou de sanidade pendentes de validação.');
  }
  if (e.ptrf) {
    w.push('Exigência obrigatória de Projeto Técnico de Reconstituição da Flora - PTRF (Art. 15 da DN 09/2026).');
  }
  for (const t of trees) {
    for (const x of specialFor(t)) {
      w.push(`Árvore ${t.numero}: ${x}.`);
    }
  }

  const alertasEl = $('alertas');
  if (alertasEl) {
    alertasEl.hidden = !w.length;
    alertasEl.innerHTML = w.length
      ? `<strong>Atenção técnica e jurídica:</strong><ul>${[...new Set(w)].map(item => `<li>${esc(item)}</li>`).join('')}</ul>`
      : '';
  }
}

// Gera o Parecer Técnico Ambiental ou Ofício oficial
function generate() {
  normalizeAllUppercaseFields();
  const e = evaluate();
  const comp = calculateCompensation();
  const proc = val('processo') || '[NÚMERO NÃO INFORMADO]';
  const req = val('requerente') || '[REQUERENTE NÃO INFORMADO]';
  const endereco = val('local') || '[ENDEREÇO NÃO INFORMADO]';
  const solicitacaoRequerente = val('requerente-solicita');
  const dataHoje = new Date().toLocaleDateString('pt-BR');
  const latCoord = val('geo-lat') || val('coord-corte-1') || '-';
  const lngCoord = val('geo-lng') || val('coord-corte-2') || '-';

  // Identificação do Fiscal
  const fiscalAtual = selectedFiscal();
  const fiscalNome = fiscalAtual.nome || 'Fiscal não informado';
  const fiscalMatricula = fiscalAtual.matricula || '0';
  const fiscalCargo = fiscalAtual.cargo || 'Fiscal de Meio Ambiente';

  // Destinação do documento
  const destinacaoTipo = getDestinacaoTipo();
  const numOficio = val('num-oficio') || `___/${new Date().getFullYear()} - DMA/SPUMA`;

  // Motivo com suporte ao campo detalhado de "Outro"
  let motivoSolicitacao = label('finalidade');
  if (val('finalidade') === 'outro') {
    const outroTxt = val('finalidade-outro-detalhe');
    motivoSolicitacao = outroTxt ? `Outro motivo tecnicamente justificado: ${outroTxt}` : 'Outro motivo tecnicamente justificado';
  }

  const conditionLabels = { viva: 'vivo e aparentemente viável', declinio: 'em declínio severo', semvida: 'sem vida biológica ou inviável', duvida: 'com condição biológica inconclusiva' };
  const diseaseLabels = { ausente: 'sem sinais aparentes de pragas ou podridão', leve: 'com sinais leves passíveis de tratamento', ativa: 'com infestação ativa ou presença de cavidades', severa: 'com sinais de podridão basal ou ataque severo de brocas', duvida: 'sem avaliação conclusiva quanto a pragas ou podridão' };
  const riskLabels = { sim: 'com risco atual ou iminente de queda', monitorar: 'com condição que recomenda monitoramento', nao: 'sem risco aparente de queda', duvida: 'sem conclusão quanto ao risco de queda' };
  const quantityText = trees.length === 1 ? '01 (um) exemplar arbóreo' : `${String(trees.length).padStart(2, '0')} (${trees.length}) exemplares arbóreos`;
  const requestedInterventionText = label('intervencao').toLowerCase();
  const interventionText = decisaoAutoriza(e.conclusao) ? textoIntervencaoAutorizada() : requestedInterventionText;
  const subjectText = `${decisaoAutoriza(e.conclusao) ? textoIntervencaoAutorizada() : label('intervencao')} de ${quantityText} - ${endereco}`;
  const diagnostic = String(val('diagnostico') || '').trim();

  const inspectionNarrative = trees.map((t, index) => {
    const common = t.popular || 'espécie de nome popular não informado';
    const scientific = t.cientifico ? ` (${t.cientifico})` : '';
    const origin = t.origem === 'nativa' ? 'de origem nativa' : t.origem === 'exotica' ? 'de origem exótica' : 'com origem ainda não determinada';
    const conflicts = selectedConflicts(t);
    const conflictSentence = conflicts.length ? ` Foram constatados os seguintes conflitos urbanos: ${conflictText(t).toLowerCase()}.` : ' Não foram registrados conflitos urbanos relevantes no formulário de vistoria.';
    const note = String(t.observacao || '').trim();
    const treeLocation = t.latitude && t.longitude ? ` Coordenadas individuais: ${t.latitude}, ${t.longitude}.${t.inventoryId ? ` Inventário Arbóreo ID nº ${t.inventoryId}.` : ''}` : '';
    return `O exemplar nº ${index + 1} foi identificado como ${common}${scientific}, ${origin}, ${conditionLabels[t.condicao] || 'com condição não informada'}, ${diseaseLabels[t.doenca] || 'sem informação fitossanitária'} e ${riskLabels[t.risco] || 'sem informação de risco'}.${treeLocation}${conflictSentence}${note ? ` Observações de campo: ${note}.` : ''}`;
  }).join('\n\n');

  const technicalFindings = [inspectionNarrative, diagnostic ? `Síntese técnica da fiscalização: ${diagnostic}` : ''].filter(Boolean).join('\n\n');
  const protocolNarrative = solicitacaoRequerente
    ? `Solicitação do requerente registrada no protocolo: ${solicitacaoRequerente}`
    : '';
  const photoReference = trees.some(t => Object.keys(t.photos || {}).length) ? 'O registro fotográfico apresentado ao final deste documento integra a vistoria e demonstra as condições observadas no local.' : '';
  const identificationLine = linkedTree ? `O exemplar está vinculado ao Inventário Arbóreo Municipal sob o ID nº ${linkedTree.id}${linkedTree.especie ? `, identificado como ${linkedTree.especie}` : ''}.` : '';
  const coordinatesLine = latCoord !== '-' && lngCoord !== '-' ? `A vistoria foi registrada nas coordenadas ${latCoord}, ${lngCoord}.` : '';
  const compensationText = exigeCompensacao() ? `A intervenção fica condicionada ao cumprimento da compensação ambiental indicada no processo: ${comp.text}. Modalidade registrada: ${label('forma').toLowerCase()}.` : '';
  const signature = `Atenciosamente.\n\n\nAndradas-MG, ${dataHoje}.\n\n\n________________________________\n${fiscalNome}\n${fiscalCargo}\nMatrícula: ${fiscalMatricula}`;

  let doc = '';

  if (destinacaoTipo === 'requerente') {
    let decisionParagraph = '';
    if (decisaoAutoriza(e.conclusao)) decisionParagraph = `Diante das condições constatadas, fica o(a) requerente autorizado(a) a realizar ${interventionText} de ${quantityText}, observadas as condições descritas neste documento e as demais exigências aplicáveis.`;
    else if (e.conclusao === 'indeferir') decisionParagraph = `Diante das condições constatadas e da justificativa técnica acima registrada, o pedido de ${interventionText} não é autorizado.`;
    else decisionParagraph = 'Diante dos elementos disponíveis, não é possível concluir o pedido neste momento. O processo deverá permanecer em diligência até a apresentação ou obtenção das informações técnicas complementares indicadas pela fiscalização.';

    doc = `Processo nº: ${proc}\n\nOfício nº: ${numOficio}\nAssunto: ${subjectText}\n\nIlmo.(a) Sr.(a)\n${req}\n\nEm atenção ao processo acima citado, referente à solicitação de ${interventionText} de ${quantityText}, localizado(s) em ${endereco}, informo que foi realizada vistoria técnica no local. O pedido foi apresentado com a finalidade de ${motivoSolicitacao.toLowerCase()}.${protocolNarrative ? `\n\n${protocolNarrative}` : ''}\n\n${technicalFindings}\n\n${[coordinatesLine, identificationLine, photoReference].filter(Boolean).join(' ')}\n\n${decisionParagraph}${compensationText ? `\n\n${compensationText}` : ''}\n\nOs resíduos resultantes da intervenção deverão receber destinação adequada e não poderão permanecer em vias, calçadas ou demais áreas públicas, de modo a evitar obstáculos à circulação e riscos à coletividade.\n\n${signature}`;
  } else if (destinacaoTipo === 'codema') {
    const triggerText = e.triggers.length ? `O encaminhamento ao Conselho decorre do seguinte enquadramento: ${e.triggers.join('; ')}.` : 'O processo é encaminhado ao Conselho para análise e deliberação quanto à intervenção pretendida.';
    doc = `Processo nº: ${proc}\n\nOfício nº: ${numOficio}\nAssunto: ${subjectText}\n\nAo Conselho Municipal de Defesa e Conservação do Meio Ambiente - CODEMA\n\nEm atenção ao processo acima citado, referente à solicitação de ${requestedInterventionText} de ${quantityText}, localizado(s) em ${endereco}, informo que foi realizada vistoria técnica no local. Segundo o requerimento, a intervenção é pretendida em razão de ${motivoSolicitacao.toLowerCase()}.${protocolNarrative ? `\n\n${protocolNarrative}` : ''}\n\n${technicalFindings}\n\n${[coordinatesLine, identificationLine, photoReference].filter(Boolean).join(' ')}\n\n${triggerText}\n\nDiante do exposto, encaminho o presente processo para análise e deliberação do CODEMA quanto ao pedido de ${interventionText}${exigeCompensacao() ? `, bem como para apreciação da compensação ambiental calculada em ${comp.text}` : ''}. O posicionamento técnico registrado pela fiscalização é ${label('conclusao').toLowerCase()}.\n\n${signature}`;
  } else if (destinacaoTipo === 'obras') {
    const serviceName = textoIntervencaoAutorizada().toUpperCase();
    doc = `Processo nº: ${proc}\n\nOfício nº: ${numOficio}\nAssunto: ${subjectText}\n\nÀ Secretaria Municipal de Serviços Públicos e Transporte Interno\n\nEm atenção ao processo acima citado, referente à solicitação de ${interventionText} de ${quantityText}, localizado(s) em ${endereco}, informo que foi realizada vistoria técnica no local.${protocolNarrative ? `\n\n${protocolNarrative}` : ''}\n\n${technicalFindings}\n\n${[coordinatesLine, identificationLine, photoReference].filter(Boolean).join(' ')}\n\nDiante do exposto, encaminho o presente processo para inclusão no Cronograma de Execução e realização do serviço de ${serviceName} indicado no parecer técnico.\n\nCaso, no momento da execução, seja constatado impedimento relacionado à rede elétrica que demande atuação da concessionária, deverá ser realizado contato prévio com a CEMIG. Durante o serviço, deverão ser adotadas as medidas necessárias para sinalização e isolamento da área.\n\nOs resíduos gerados deverão receber destinação adequada e não poderão permanecer em vias, calçadas ou demais áreas públicas, de modo a evitar obstáculos à circulação e riscos à coletividade.${compensationText ? `\n\n${compensationText}` : ''}\n\n${signature}`;
  } else if (destinacaoTipo === 'planejamento') {
    doc = `Processo nº: ${proc}\n\nMemorando nº: ${numOficio}\nAssunto: ${subjectText}\n\nÀ Secretaria Municipal de Planejamento Urbano e Meio Ambiente\n\nEncaminho, separadamente da Secretaria de Obras, o resultado da vistoria in loco referente à solicitação de ${interventionText} de ${quantityText}, localizado(s) em ${endereco}, para as providências administrativas e urbanísticas cabíveis.${protocolNarrative ? `\n\n${protocolNarrative}` : ''}\n\n${technicalFindings}\n\n${[coordinatesLine, identificationLine, photoReference].filter(Boolean).join(' ')}\n\nO posicionamento técnico registrado pela fiscalização é ${label('conclusao').toLowerCase()}.${compensationText ? `\n\n${compensationText}` : ''}\n\n${signature}`;
  }
  const saidaEl = $('saida');
  if (saidaEl) saidaEl.value = doc;
  renderOfficialDocument(doc);

  const titEl = $('titulo-modelo');
  if (titEl) titEl.textContent = model(e);

  const badgeEl = $('rota-badge');
  if (badgeEl) {
    badgeEl.textContent = destinacaoTipo === 'codema' ? 'CODEMA' : destinacaoTipo === 'obras' ? 'OBRAS' : destinacaoTipo === 'planejamento' ? 'PLANEJAMENTO' : (e.urgent ? 'URGÊNCIA' : 'DEFERIDO');
    badgeEl.className = destinacaoTipo === 'codema' ? 'badge-codema' : destinacaoTipo === 'obras' ? 'badge-urgent' : 'badge-spuma';
  }

  const docEl = $('documento');
  if (docEl) {
    docEl.hidden = false;
    docEl.scrollIntoView({ behavior: 'smooth' });
  }
  parecerNeedsRegeneration = false;
  scheduleProcessAutosave();
}

function renderOfficialDocument(text = val('saida')) {
  const preview = $('documento-impressao');
  if (!preview) return;

  const bodyText = String(text || '').replace(/^={20,}\s*\nPREFEITURA MUNICIPAL DE ANDRADAS\s*\nSECRETARIA MUNICIPAL DE PLANEJAMENTO URBANO E MEIO AMBIENTE\s*\nDIVISÃO DE MEIO AMBIENTE\s*\n={20,}\s*\n?/i, '');
  const galleries = trees.map((tree, index) => {
    const photos = organs
      .filter(([key]) => safeImageSource(tree.photos?.[key]))
      .map(([key, title]) => `<figure><img src="${safeImageSource(tree.photos[key])}" width="900" height="675" loading="lazy" alt="${esc(title)} do exemplar ${index + 1}"><figcaption>${esc(title)}</figcaption></figure>`)
      .join('');
    if (!photos) return '';
    const name = tree.popular || tree.cientifico || `Exemplar nº ${index + 1}`;
    return `<section class="official-photo-section"><h2>Registro fotográfico - Exemplar nº ${index + 1}: ${esc(name)}</h2><div class="official-photo-grid">${photos}</div></section>`;
  }).join('');

  preview.innerHTML = `
    <header class="official-letterhead">
      <img src="app-icon.svg" width="52" height="52" alt="Identidade visual da Prefeitura Municipal de Andradas">
      <div><strong>PREFEITURA MUNICIPAL DE ANDRADAS</strong><span>Secretaria Municipal de Planejamento Urbano e Meio Ambiente</span><span>Divisão de Meio Ambiente</span></div>
    </header>
    <div class="official-document-text">${esc(bodyText)}</div>
    ${galleries}
  `;
}
// Navegação entre etapas (tabs)
function showTab(name) {
  syncSpecies();
  syncAssessment();

  document.querySelectorAll('.tab').forEach(x => {
    const isActive = x.id === `tab-${name}`;
    x.classList.toggle('active', isActive);
    x.hidden = !isActive;
  });

  document.querySelectorAll('.step').forEach(x => {
    const isActive = x.dataset.tab === name;
    x.classList.toggle('active', isActive);
    x.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });

  if (name === 'avaliacao') {
    // Garante sincronia entre espécies e avaliação
    trees.forEach((t, i) => {
      const acHead = document.querySelector(`#assessment-card-${i} .tree-card-head strong`);
      if (acHead) acHead.textContent = t.popular || t.cientifico || 'Exemplar sem identificação';
    });
  }

  if (name === 'parecer' || name === 'compensacao') {
    update();
  }

  scheduleProcessAutosave();

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function isoToBr(s) {
  if (!s) return '';
  const match = String(s).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return String(s);
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? String(s) : new Intl.DateTimeFormat('pt-BR').format(date);
}

function brDateToIsoLocal(value) {
  const match = String(value || '').trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  return match ? `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}` : String(value || '').slice(0, 10);
}

// Gravação dos dados na planilha do Google Sheets via backend proxy
async function saveSheet() {
  normalizeAllUppercaseFields();
  const status = $('sheet-status');
  syncSpecies();
  const comp = calculateCompensation();
  const protocolo = val('processo') || `PROC-${Date.now()}`;
  const existing = processos.find(item => item.protocolo === protocolo) || {};
  const destinacaoTipo = getDestinacaoTipo() || existing.destinacaoTipo || 'requerente';
  const proc = {
    ...existing,
    id: existing.id || `PROC-${Date.now()}`,
    data: val('data-cadastro') || existing.dataCadastro || existing.data || new Date().toISOString().slice(0, 10),
    protocolo,
    requerente: val('requerente'),
    telefone: val('telefone') || existing.telefone || '',
    solicitacaoRequerente: val('requerente-solicita'),
    endereco: val('local'),
    intervencao: val('intervencao'),
    intervencaoLabel: label('intervencao'),
    quantidade: trees.length,
    finalidade: val('finalidade') === 'outro' ? val('finalidade-outro-detalhe') : label('finalidade'),
    finalidadeVal: val('finalidade'),
    finalidadeOutroDetalhe: val('finalidade-outro-detalhe'),
    diagnostico: val('diagnostico'),
    conclusao: val('conclusao'),
    destinacaoTipo,
    parecerTexto: val('saida') || existing.parecerTexto || '',
    coordenadas: { lat: trees[0]?.latitude || val('coord-corte-1'), lng: trees[0]?.longitude || val('coord-corte-2') },
    responsavelCorte: val('responsavel-corte'),
    autorizacao: val('autorizacao'),
    dataAutorizacao: val('data-autorizacao'),
    formaCompensacao: val('forma'),
    compensacao: comp.text,
    prazo: val('prazo'),
    coordComp1: val('coord-comp-1'),
    coordComp2: val('coord-comp-2'),
    situacao: statusForSheet(val('situacao')),
    trees: JSON.parse(JSON.stringify(trees)),
    vistoriaInLoco: existing.vistoriaInLoco || false,
    vistoriaRealizadaEm: existing.vistoriaRealizadaEm || '',
    updatedAt: new Date().toISOString(),
    ...processTrackingFields(existing)
  };

  if (status) {
    status.textContent = 'Sincronizando o processo completo…';
    status.className = 'sheet-status text-muted';
  }
  upsertLocalProcess(proc);
  await saveProcessos();
  const syncResult = await syncNewProcessoVistoria(proc);
  upsertLocalProcess(proc);
  await saveProcessos();
  if (status) {
    const inventoryOk = syncResult.inventoryErrors.length === 0;
    status.textContent = syncResult.processSynced && inventoryOk
      ? '✓ Processo e árvores sincronizados nas respectivas planilhas.'
      : syncResult.processSynced
        ? 'Processo sincronizado; há árvores pendentes na planilha do Inventário.'
        : 'Sincronização pendente; o processo continua salvo neste aparelho.';
    status.className = syncResult.processSynced && inventoryOk ? 'sheet-status text-success' : 'sheet-status text-danger';
  }
}

// Download do texto do parecer como arquivo .txt
function downloadTxt() {
  const content = val('saida');
  if (!content) return;
  const num = (val('processo') || 'parecer').replace(/[^a-zA-Z0-9_-]/g, '_');
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `parecer_ambiental_${num}.txt`;
  a.click();
  URL.revokeObjectURL(a.href);
}

// =============================================================================
// INTEGRAÇÃO COM INVENTÁRIO ARBÓREO & CONTROLE DE PROCESSOS EM ANDAMENTO
// =============================================================================

// Cálculo de distância geográfica em metros (Fórmula de Haversine)
function haversineMeters(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return Infinity;
  const R = 6371000;
  const toRad = deg => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Normalização de texto para cruzamento de logradouros
function normalizeText(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\b(rua|avenida|av|praca|praça|travessa|alameda|rodovia|estrada|dr|doutor|cel|coronel|prof|professor)\b/gi, '')
    .replace(/[^a-z0-9]/g, ' ')
    .trim();
}

// Carregamento do catálogo de árvores do Inventário Municipal
const INVENTORY_CACHE_KEY = 'arbo_inventory_trees';

function compactLegacyInventoryCache() {
  const cached = localStorage.getItem(INVENTORY_CACHE_KEY);
  if (!cached) return;
  try {
    const records = JSON.parse(cached);
    if (!Array.isArray(records)) throw new Error('cache inválido');
    const compact = records.map(tree => ({
      ...tree,
      fotos: Array.isArray(tree?.fotos)
        ? tree.fotos.filter(photo => photo && !String(photo).startsWith('data:'))
        : [],
      photos: tree?.photos && typeof tree.photos === 'object'
        ? Object.fromEntries(Object.entries(tree.photos).filter(([, photo]) => photo && !String(photo).startsWith('data:')))
        : tree?.photos
    }));
    const serialized = JSON.stringify(compact);
    if (serialized !== cached) {
      localStorage.removeItem(INVENTORY_CACHE_KEY);
      localStorage.setItem(INVENTORY_CACHE_KEY, serialized);
    }
  } catch (error) {
    localStorage.removeItem(INVENTORY_CACHE_KEY);
    console.warn('[inventário] Cache antigo removido para liberar espaço:', error.message);
  }
}

function releaseReconstructibleStorage() {
  compactLegacyInventoryCache();
  localStorage.removeItem(INVENTORY_CACHE_KEY);
}

async function loadInventoryTrees() {
  try {
    const cached = localStorage.getItem(INVENTORY_CACHE_KEY);
    if (cached) {
      inventoryTrees = JSON.parse(cached);
    }
  } catch {}

  try {
    let res;
    try {
      res = await fetch('/api/inventory');
      if (!res.ok) throw new Error(`API do inventário respondeu HTTP ${res.status}`);
    } catch {
      res = await fetch(`${INVENTORY_API_URL}?action=list`);
    }

    if (res && res.ok) {
      const data = await res.json();
      if (data && data.status === 'ok' && Array.isArray(data.trees)) {
        inventoryTrees = data.trees.map(st => {
          const rawId = st.ID || st.id;
          const lat = parseFloat(String(st['Latitude'] || '').replace(',', '.'));
          const lng = parseFloat(String(st['Longitude'] || '').replace(',', '.'));
          return {
            id: parseInt(rawId, 10) || rawId,
            latitude: isNaN(lat) ? null : lat,
            longitude: isNaN(lng) ? null : lng,
            rua: st['Rua'] || '',
            bairro: st['Bairro'] || '',
            logradouro: st['Logradouro'] || [st['Rua'], st['Bairro']].filter(Boolean).join(', '),
            referencia: st['Referencia'] || '',
            especie: st['Especie'] || '',
            porte: st['Porte'] || '',
            tronco: st['Tronco'] || '',
            fotos: [st['Foto 1'], st['Foto 2'], st['Foto 3'], st['Foto 4'], st['Foto 5']].filter(Boolean),
            dap: st['DAP'] || String(st['Tronco'] || '').match(/-?\d+(?:[.,]\d+)?/)?.[0]?.replace(',', '.') || '',
            altura: st['Altura'] || String(st['Porte'] || '').match(/-?\d+(?:[.,]\d+)?/)?.[0]?.replace(',', '.') || '',
            protocoloVistoria: st['Protocolo Vistoria'] || String(st['Referencia'] || '').match(/Vistoria\s+(.+?)\s+·/i)?.[1] || '',
            observacao: st['Observacoes'] || st['Observações'] || '',
            problemas: st['Problemas'] || '',
            interferencias: st['Interferencias'] || '',
            status: st['Status'] || 'Cadastrada',
            dataCadastro: st['Data Cadastro'] || ''
          };
        }).filter(t => t.id);

        // Base64 photos from the spreadsheet can fill the browser's small
        // localStorage quota. Full photos stay in Google Sheets/Drive.
        const compactInventory = inventoryTrees.map(tree => ({
          ...tree,
          fotos: (tree.fotos || []).filter(photo => photo && !String(photo).startsWith('data:'))
        }));
        try {
          localStorage.setItem(INVENTORY_CACHE_KEY, JSON.stringify(compactInventory));
        } catch (error) {
          localStorage.removeItem(INVENTORY_CACHE_KEY);
          console.warn('[inventário] Catálogo não mantido em cache por falta de espaço:', error.message);
        }
      }
    }
  } catch (err) {
    console.warn('[inventário] Usando base em cache local:', err.message);
  }
}

// Detecção inteligente por coordenadas GPS + logradouro + espécie
function detectInventoryMatch() {
  const container = $('inventory-match-container');
  if (!container) return;

  if (linkedTree) {
    container.hidden = false;
    container.innerHTML = `
      <div class="matched-confirmed-box">
        <div>
          <strong style="color: var(--green);">✓ Árvore Vinculada ao Inventário Municipal</strong>
          <div style="font-size:0.95rem; margin-top:2px;"><b>ID #${esc(linkedTree.id)}</b> — ${esc(linkedTree.especie || 'Espécime catalogado')}</div>
          <small class="text-muted">${esc(linkedTree.logradouro || '')}</small>
        </div>
        <button type="button" class="btn-sm button-outline" id="btn-unlink-tree">Desvincular</button>
      </div>
    `;
    $('btn-unlink-tree')?.addEventListener('click', unlinkInventoryTree);
    return;
  }

  const rawLat = parseFloat(val('geo-lat').replace(',', '.'));
  const rawLng = parseFloat(val('geo-lng').replace(',', '.'));
  const hasCoords = !isNaN(rawLat) && !isNaN(rawLng);
  const inputRuaNorm = normalizeText(val('local'));

  if (!hasCoords && inputRuaNorm.length < 3) {
    container.hidden = true;
    container.innerHTML = '';
    return;
  }

  const candidates = [];
  for (const tree of inventoryTrees) {
    let distance = Infinity;
    if (hasCoords && tree.latitude != null && tree.longitude != null) {
      distance = haversineMeters(rawLat, rawLng, tree.latitude, tree.longitude);
    }

    const treeRuaNorm = normalizeText(tree.logradouro || tree.rua);
    let streetMatch = false;
    if (inputRuaNorm.length >= 3 && treeRuaNorm.length >= 3) {
      if (treeRuaNorm.includes(inputRuaNorm) || inputRuaNorm.includes(treeRuaNorm)) {
        streetMatch = true;
      } else {
        const words = inputRuaNorm.split(/\s+/).filter(w => w.length > 3);
        streetMatch = words.some(w => treeRuaNorm.includes(w));
      }
    }

    if (distance <= 40 || (distance <= 120 && streetMatch) || (distance === Infinity && streetMatch)) {
      candidates.push({
        tree,
        distance,
        streetMatch,
        score: (distance <= 15 ? 100 : distance <= 40 ? 80 : 50) + (streetMatch ? 40 : 0)
      });
    }
  }

  candidates.sort((a, b) => b.score - a.score || a.distance - b.distance);

  if (!candidates.length) {
    container.hidden = true;
    container.innerHTML = '';
    return;
  }

  const best = candidates[0];
  const t = best.tree;
  const distText = isFinite(best.distance)
    ? `🎯 Distância: a cerca de ${Math.round(best.distance)} metros do ponto informado`
    : `📍 Mesma rua encontrada no Inventário Arbóreo`;

  container.hidden = false;
  container.innerHTML = `
    <div class="inventory-match-card">
      <div class="match-head">
        <span class="match-title">
          <span>🌳</span> Árvore Encontrada no Inventário Municipal!
        </span>
        <span class="match-pill">ID #${esc(t.id)}</span>
      </div>
      <div class="match-details">
        <div class="match-thumb-placeholder">🌳</div>
        <div class="match-data">
          <h4>${esc(t.especie || 'Espécime catalogado')}</h4>
          <p><strong>Logradouro:</strong> ${esc(t.logradouro || t.rua || 'Andradas/MG')}</p>
          ${t.porte ? `<p><strong>Porte:</strong> ${esc(t.porte)} ${t.status ? `· <strong>Status:</strong> ${esc(t.status)}` : ''}</p>` : ''}
          <span class="match-distance">${distText}</span>
        </div>
      </div>
      <div class="match-actions-row">
        <button type="button" class="primary btn-sm" id="btn-confirm-match">
          ✓ Vincular a esta Árvore
        </button>
        ${candidates.length > 1 ? `
          <button type="button" class="btn-sm" id="btn-see-others">
            Ver outras ${candidates.length - 1} árvores próximas
          </button>
        ` : ''}
        <button type="button" class="btn-sm button-outline" id="btn-dismiss-match">
          Não vincular (árvore nova)
        </button>
      </div>
      ${candidates.length > 1 ? `
        <div id="other-matches-list" style="margin-top: 12px; display: none; border-top: 1px dashed var(--line); padding-top: 10px;">
          <small class="text-muted" style="display:block; margin-bottom: 6px;">Outras árvores no mesmo local:</small>
          ${candidates.slice(1, 5).map(c => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0; font-size: 0.82rem;">
              <span><b>ID #${esc(c.tree.id)}</b> - ${esc(c.tree.especie || 'Sem espécie')} (${isFinite(c.distance) ? Math.round(c.distance) + 'm' : 'rua'})</span>
              <button type="button" class="btn-sm primary pick-other-btn" data-tree-id="${esc(c.tree.id)}">Vincular</button>
            </div>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `;

  $('btn-confirm-match')?.addEventListener('click', () => linkInventoryTree(t, best.distance));
  $('btn-dismiss-match')?.addEventListener('click', () => {
    container.hidden = true;
    container.innerHTML = '';
  });

  const seeOthersBtn = $('btn-see-others');
  if (seeOthersBtn) {
    seeOthersBtn.addEventListener('click', () => {
      const otherList = $('other-matches-list');
      if (otherList) {
        otherList.style.display = otherList.style.display === 'none' ? 'block' : 'none';
      }
    });
  }

  container.querySelectorAll('.pick-other-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tr = inventoryTrees.find(x => String(x.id) === btn.dataset.treeId);
      if (tr) linkInventoryTree(tr);
    });
  });
}

// Vincula a árvore selecionada do inventário
function linkInventoryTree(tree, distance) {
  linkedTree = tree;

  if (tree.latitude != null && !val('geo-lat')) {
    $('geo-lat').value = tree.latitude.toFixed(6);
  }
  if (tree.longitude != null && !val('geo-lng')) {
    $('geo-lng').value = tree.longitude.toFixed(6);
  }

  if (tree.logradouro && !val('local')) {
    $('local').value = tree.logradouro;
  }

  const c1 = $('coord-corte-1');
  const c2 = $('coord-corte-2');
  if (c1 && tree.latitude != null) c1.value = tree.latitude.toFixed(6);
  if (c2 && tree.longitude != null) c2.value = tree.longitude.toFixed(6);

  if (trees.length > 0) {
    if (tree.especie) {
      trees[0].popular = tree.especie;
      trees[0].cientifico = tree.especie;
      trees[0].certeza = 'confirmada';
    }
    trees[0].inventoryId = tree.id;
    if (tree.latitude != null) trees[0].latitude = tree.latitude.toFixed(6);
    if (tree.longitude != null) trees[0].longitude = tree.longitude.toFixed(6);
    if (tree.porte) {
      const p = tree.porte.toLowerCase();
      if (p.includes('grande')) $('grande').value = 'sim';
      else if (p.includes('pequeno') || p.includes('medio')) $('grande').value = 'nao';
    }
  }

  detectInventoryMatch();
  renderAll(false);
  scheduleProcessAutosave();
}

// Desvincula árvore
function unlinkInventoryTree() {
  linkedTree = null;
  if (trees.length > 0) {
    trees[0].inventoryId = null;
  }
  detectInventoryMatch();
  scheduleProcessAutosave();
}

// Captura GPS do dispositivo do usuário/fiscal
function captureGPS() {
  const statusEl = $('gps-status');
  if (!navigator.geolocation) {
    if (statusEl) {
      statusEl.hidden = false;
      statusEl.textContent = 'Geolocalização não suportada neste dispositivo.';
      statusEl.className = 'gps-status text-danger';
    }
    return;
  }

  if (statusEl) {
    statusEl.hidden = false;
    statusEl.textContent = 'Buscando coordenadas GPS de alta precisão...';
    statusEl.className = 'gps-status text-muted';
  }

  navigator.geolocation.getCurrentPosition(
    pos => {
      const lat = pos.coords.latitude.toFixed(6);
      const lng = pos.coords.longitude.toFixed(6);
      const acc = Math.round(pos.coords.accuracy);

      $('geo-lat').value = lat;
      $('geo-lng').value = lng;
      if ($('location-source')) $('location-source').textContent = 'GPS capturado';

      const c1 = $('coord-corte-1');
      const c2 = $('coord-corte-2');
      if (c1) c1.value = lat;
      if (c2) c2.value = lng;

      if (trees[0] && !trees[0].latitude && !trees[0].longitude) {
        trees[0].latitude = lat;
        trees[0].longitude = lng;
        trees[0].gpsAccuracy = acc;
        const firstCard = document.getElementById('species-card-0');
        if (firstCard) {
          const treeLat = firstCard.querySelector('.tree-lat');
          const treeLng = firstCard.querySelector('.tree-lng');
          const treeStatus = firstCard.querySelector('.tree-gps-status');
          if (treeLat) treeLat.value = lat;
          if (treeLng) treeLng.value = lng;
          if (treeStatus) treeStatus.textContent = `Ponto registrado (precisão ±${acc} m).`;
        }
      }

      if (statusEl) {
        statusEl.textContent = `✓ Coordenadas obtidas: ${lat}, ${lng} (Precisão: ±${acc}m)`;
        statusEl.className = 'gps-status text-success';
      }

      detectInventoryMatch();
      scheduleProcessAutosave();
    },
    err => {
      if (statusEl) {
        statusEl.textContent = `GPS indisponível: ${err.message}. Digite as coordenadas manualmente.`;
        statusEl.className = 'gps-status text-danger';
      }
    },
    { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
  );
}

function captureTreeGPS(index, card) {
  const status = card?.querySelector('.tree-gps-status');
  if (!navigator.geolocation) {
    if (status) status.textContent = 'Este aparelho não oferece geolocalização.';
    return;
  }
  if (status) status.textContent = 'Buscando o ponto desta árvore…';
  navigator.geolocation.getCurrentPosition(pos => {
    const lat = pos.coords.latitude.toFixed(6);
    const lng = pos.coords.longitude.toFixed(6);
    const accuracy = Math.round(pos.coords.accuracy);
    trees[index].latitude = lat;
    trees[index].longitude = lng;
    trees[index].gpsAccuracy = accuracy;
    trees[index].inventorySync = 'pending';
    const latInput = card.querySelector('.tree-lat');
    const lngInput = card.querySelector('.tree-lng');
    if (latInput) latInput.value = lat;
    if (lngInput) lngInput.value = lng;
    if (status) status.textContent = `Ponto registrado (precisão ±${accuracy} m).`;
    if (index === 0) {
      if ($('geo-lat')) $('geo-lat').value = lat;
      if ($('geo-lng')) $('geo-lng').value = lng;
      if ($('coord-corte-1')) $('coord-corte-1').value = lat;
      if ($('coord-corte-2')) $('coord-corte-2').value = lng;
      initOrUpdateMiniMap(lat, lng, val('local') || 'Árvore em vistoria');
    }
    scheduleProcessAutosave();
  }, error => {
    if (status) status.textContent = `Não foi possível obter o GPS: ${error.message}`;
  }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
}

// Modal de Busca Manual no Inventário
function openInventorySearchModal() {
  const modal = $('modal-inventory-search');
  if (!modal) return;
  modal.showModal();
  renderInventorySearchResults(inventoryTrees);
  $('inventory-search-input')?.focus();
}

function closeInventorySearchModal() {
  $('modal-inventory-search')?.close();
}

function renderInventorySearchResults(list) {
  const res = $('inventory-search-results');
  if (!res) return;

  if (!list || !list.length) {
    res.innerHTML = '<div class="empty-desc" style="text-align:center; padding: 20px;">Nenhuma árvore encontrada no catálogo com este critério.</div>';
    return;
  }

  res.innerHTML = list.slice(0, 30).map(t => `
    <div class="inv-item" data-id="${esc(t.id)}">
      <div>
        <strong style="color: var(--forest);">ID #${esc(t.id)} · ${esc(t.especie || 'Espécime')}</strong>
        <div style="font-size: 0.8rem; color: var(--muted);">${esc(t.logradouro || 'Andradas/MG')}</div>
        ${t.status ? `<span class="badge" style="margin-top: 4px; display: inline-block;">${esc(t.status)}</span>` : ''}
      </div>
      <button type="button" class="btn-sm primary select-inv-btn" data-id="${esc(t.id)}">Selecionar</button>
    </div>
  `).join('');

  res.querySelectorAll('.select-inv-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const tr = inventoryTrees.find(x => String(x.id) === String(id));
      if (tr) {
        linkInventoryTree(tr);
        closeInventorySearchModal();
      }
    });
  });
}

function filterInventoryCatalog(query) {
  const q = normalizeText(query);
  if (!q) {
    renderInventorySearchResults(inventoryTrees);
    return;
  }
  const filtered = inventoryTrees.filter(t => {
    const idMatch = String(t.id) === query.trim();
    const espMatch = normalizeText(t.especie).includes(q);
    const ruaMatch = normalizeText(t.logradouro || t.rua).includes(q);
    return idMatch || espMatch || ruaMatch;
  });
  renderInventorySearchResults(filtered);
}

// =============================================================================
// GESTÃO DE PROCESSOS EM ANDAMENTO
// =============================================================================

const PROCESS_BACKUP_DB = 'ambiental-andradas-processos';
const PROCESS_BACKUP_STORE = 'state';
let processStorageWarningShown = false;

function openProcessBackupDb() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) return reject(new Error('IndexedDB indisponível'));
    const request = indexedDB.open(PROCESS_BACKUP_DB, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(PROCESS_BACKUP_STORE)) {
        request.result.createObjectStore(PROCESS_BACKUP_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Falha ao abrir o armazenamento de segurança'));
  });
}

async function readProcessBackup() {
  const db = await openProcessBackupDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(PROCESS_BACKUP_STORE, 'readonly');
    const request = transaction.objectStore(PROCESS_BACKUP_STORE).get('processes');
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => db.close();
  });
}

async function writeProcessBackup(records, savedAt) {
  const db = await openProcessBackupDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(PROCESS_BACKUP_STORE, 'readwrite');
    transaction.objectStore(PROCESS_BACKUP_STORE).put({ records, savedAt }, 'processes');
    transaction.oncomplete = () => { db.close(); resolve(); };
    transaction.onerror = () => { db.close(); reject(transaction.error); };
    transaction.onabort = () => { db.close(); reject(transaction.error || new Error('Gravação interrompida')); };
  });
}

function processDataRank(process = {}) {
  const meaningfulTree = (process.trees || []).some(tree =>
    tree?.popular || tree?.cientifico || tree?.dap || tree?.altura ||
    Object.values(tree?.photos || {}).some(Boolean) ||
    (Number(tree?.latitude) && Number(tree?.longitude))
  );
  if (process.parecerTexto || process.diagnostico || process.conclusao) return 3;
  if (process.vistoriaInLoco || process.dataVistoria || meaningfulTree) return 2;
  return 1;
}

function processEditTime(process = {}) {
  const parsed = Date.parse(process.updatedAt || '');
  return Number.isFinite(parsed) ? parsed : 0;
}

function mergeProcessCopies(local, remote) {
  if (!local) return remote;
  const localRank = processDataRank(local);
  const remoteRank = processDataRank(remote);
  const localIsNewer = processEditTime(local) > processEditTime(remote);

  if (localRank > remoteRank || (localRank === remoteRank && local.syncStatus === 'pending' && localIsNewer)) {
    return { ...remote, ...local, id: local.id || remote.id, syncStatus: 'pending' };
  }
  if (remoteRank > localRank || (remoteRank === localRank && processEditTime(remote) >= processEditTime(local))) {
    return { ...local, ...remote, id: local.id || remote.id, syncStatus: 'synced' };
  }
  return { ...remote, ...local, id: local.id || remote.id };
}

async function loadProcessos() {
  let localSavedAt = 0;
  try {
    const raw = localStorage.getItem('arbo_processos');
    processos = raw ? JSON.parse(raw) : [];
    localSavedAt = Number(localStorage.getItem('arbo_processos_saved_at') || 0);
  } catch {
    processos = [];
  }
  try {
    const backup = await readProcessBackup();
    if (Array.isArray(backup?.records) && (!processos.length || Number(backup.savedAt || 0) >= localSavedAt)) {
      processos = backup.records;
    }
  } catch (error) {
    console.warn('[vistoria] Backup local avançado indisponível:', error.message);
  }
  // Recover records created by older versions without a sync marker.
  // Local records must return to the queue instead of looking synchronized.
  processos = processos.map(process => process.syncStatus
    ? process
    : { ...process, syncStatus: String(process.id || '').startsWith('SHEET-') ? 'synced' : 'pending' });
  updateProcessosBadge();
  renderProcessos();

  // Os processos da Vistoria vêm da planilha configurada em SHEETS_WEBHOOK_URL.
  // A API do Inventário é usada somente para vincular exemplares arbóreos.
  try {
    const response = await fetch('/api/processes');
    const data = await response.json();
    if (!response.ok || !data.ok) {
      throw new Error(data.error || 'Não foi possível consultar a planilha da Vistoria.');
    }

    if (Array.isArray(data.processes)) {
      const localByProtocol = new Map(processos.map(p => [String(p.protocolo || ''), p]));
      const remoteProtocols = new Set(data.processes.map(remote => String(remote.protocolo || '')));
      const mergedRemote = data.processes.map(remote => {
        const local = localByProtocol.get(String(remote.protocolo || ''));
        if (!local) return remote;
        return mergeProcessCopies(local, remote);
      });
      const localOnly = processos
        .filter(local => !remoteProtocols.has(String(local.protocolo || '')))
        .map(local => local.syncStatus === 'synced' ? local : { ...local, syncStatus: 'pending' });
      processos = [...localOnly, ...mergedRemote];
      includeProcessFiscalProfiles();
  await saveProcessos();
    }
    if (navigator.onLine) void syncPendingProcesses();
    return true;
  } catch (error) {
    console.warn('[vistoria] Falha ao carregar processos da planilha:', error.message);
    return false;
  }
}

async function saveProcessos() {
  const savedAt = Date.now();
  const snapshot = JSON.parse(JSON.stringify(processos));
  updateProcessosBadge();
  renderProcessos();

  try {
    // Confirm the complete backup (including photos) before touching the old compact index.
    await writeProcessBackup(snapshot, savedAt);
  } catch (error) {
    console.error('[vistoria] Falha no backup local avançado:', error.message);
    if (!processStorageWarningShown) {
      processStorageWarningShown = true;
      alert('Não foi possível confirmar a cópia de segurança local. Não limpe os dados do aplicativo e mantenha esta tela aberta.');
    }
    return false;
  }

  const compactRecords = JSON.stringify(snapshot.map(remoteProcessCopy));
  const writeCompactIndex = () => {
    localStorage.setItem('arbo_processos', compactRecords);
    localStorage.setItem('arbo_processos_saved_at', String(savedAt));
  };
  try {
    writeCompactIndex();
  } catch (firstError) {
    try {
      // The legacy value may contain megabytes of embedded photos. The full
      // copy is already safe in IndexedDB, so it is now safe to replace it.
      localStorage.removeItem('arbo_processos');
      localStorage.removeItem('arbo_processos_saved_at');
      releaseReconstructibleStorage();
      writeCompactIndex();
    } catch (error) {
      console.error('[vistoria] Não foi possível criar o índice local compacto:', error.message);
      if (!processStorageWarningShown) {
        processStorageWarningShown = true;
        alert('A cópia completa está preservada, mas o índice rápido não pôde ser atualizado. Não limpe os dados do aplicativo.');
      }
      return false;
    }
  }
  return true;
}

function upsertLocalProcess(proc) {
  if (!['pending', 'synced'].includes(proc.syncStatus)) proc.syncStatus = 'pending';
  const index = processos.findIndex(item =>
    (proc.id && String(item.id || '') === String(proc.id)) ||
    String(item.protocolo || '') === String(proc.protocolo || '')
  );
  if (index >= 0) {
    const stableId = processos[index].id || proc.id;
    processos[index] = { ...processos[index], ...proc, id: stableId };
    proc.id = stableId;
    return processos[index];
  }
  processos.unshift(proc);
  return proc;
}

function updateProcessosBadge() {
  const badge = $('badge-total-processos');
  if (badge) {
    const activeCount = processos.filter(p => processMatchesSelectedFiscal(p) && !['Compensado', 'Indeferido', 'Arquivado'].includes(statusForProcess(p))).length;
    badge.textContent = String(activeCount);
  }
}

const SHEET_PROCESS_STATUSES = [
  'Aguardando Vistoria', 'Parecer em Elaboração', 'Enviado para Deliberação do CODEMA',
  'Encaminhado para Corte pela Secretaria de Obras', 'Encaminhado para a Secretaria de Planejamento', 'Aguardando Compensação',
  'Compensado', 'Indeferido', 'Arquivado'
];

function statusForSheet(status) {
  const normalized = normalizeText(status || '');
  if (normalized.includes('indeferido')) return 'Indeferido';
  if (normalized.includes('arquivado')) return 'Arquivado';
  if (normalized.includes('compensado') || normalized.includes('concluido')) return 'Compensado';
  if (normalized.includes('codema')) return 'Enviado para Deliberação do CODEMA';
  if (normalized.includes('obras')) return 'Encaminhado para Corte pela Secretaria de Obras';
  if (normalized.includes('planejamento')) return 'Encaminhado para a Secretaria de Planejamento';
  if (normalized.includes('compensacao')) return 'Aguardando Compensação';
  if (normalized.includes('parecer') || normalized.includes('vistoriado') || normalized.includes('diligencia') || normalized.includes('autorizado')) return 'Parecer em Elaboração';
  return 'Aguardando Vistoria';
}
function statusForProcess(process) {
  const current = statusForSheet(process?.situacao);
  if (current !== 'Aguardando Compensação') return current;
  const autorizada = process?.intervencaoAutorizada || (['poda', 'podadrastica'].includes(process?.intervencao) ? 'poda' : 'corte');
  const semCompensacao = autorizada === 'poda' || process?.formaCompensacao === 'naoaplica' || normalizeText(process?.compensacao).includes('nao se aplica');
  if (!semCompensacao) return current;
  if (process?.destinacaoTipo === 'codema') return 'Enviado para Deliberação do CODEMA';
  if (process?.destinacaoTipo === 'obras') return 'Encaminhado para Corte pela Secretaria de Obras';
  if (process?.destinacaoTipo === 'planejamento') return 'Encaminhado para a Secretaria de Planejamento';
  return 'Parecer em Elaboração';
}
function isPendingInspection(process) {
  return statusForProcess(process) === 'Aguardando Vistoria';
}

function renderProcessos() {
  updatePendingProcessSyncUi();
  const listEl = $('processos-list');
  if (!listEl) return;

  const scopedProcesses = processos.filter(processMatchesSelectedFiscal);
  const total = scopedProcesses.length;
  const analise = scopedProcesses.filter(p => statusForProcess(p) === 'Aguardando Vistoria').length;
  const autorizados = scopedProcesses.filter(p => ['Parecer em Elaboração', 'Enviado para Deliberação do CODEMA', 'Encaminhado para Corte pela Secretaria de Obras', 'Encaminhado para a Secretaria de Planejamento'].includes(statusForProcess(p))).length;
  const concluidos = scopedProcesses.filter(p => ['Compensado', 'Indeferido', 'Arquivado'].includes(statusForProcess(p))).length;

  if ($('stat-total')) $('stat-total').textContent = String(total);
  if ($('stat-analise')) $('stat-analise').textContent = String(analise);
  if ($('stat-autorizados')) $('stat-autorizados').textContent = String(autorizados);
  if ($('stat-concluidos')) $('stat-concluidos').textContent = String(concluidos);

  const s = normalizeText(activeProcessSearch);
  const filtered = scopedProcesses.filter(p => {
    const processStatus = statusForProcess(p);
    if (activeProcessFilter === 'vistoria' && processStatus !== 'Aguardando Vistoria') return false;
    if (activeProcessFilter === 'parecer' && processStatus !== 'Parecer em Elaboração') return false;
    if (activeProcessFilter === 'codema' && processStatus !== 'Enviado para Deliberação do CODEMA') return false;
    if (activeProcessFilter === 'obras' && processStatus !== 'Encaminhado para Corte pela Secretaria de Obras') return false;
    if (activeProcessFilter === 'planejamento' && processStatus !== 'Encaminhado para a Secretaria de Planejamento') return false;
    if (activeProcessFilter === 'compensacao' && processStatus !== 'Aguardando Compensação') return false;
    if (activeProcessFilter === 'concluido' && !['Compensado', 'Indeferido', 'Arquivado'].includes(processStatus)) return false;
    if (s) {
      const matchProt = normalizeText(p.protocolo).includes(s);
      const matchReq = normalizeText(p.requerente).includes(s);
      const matchEnd = normalizeText(p.endereco).includes(s);
      const matchTree = p.arvoreInventarioId && String(p.arvoreInventarioId).includes(s);
      return matchProt || matchReq || matchEnd || matchTree;
    }
    return true;
  }).sort((a, b) => {
    const pendingOrder = Number(isPendingInspection(b)) - Number(isPendingInspection(a));
    return pendingOrder || String(b.data || '').localeCompare(String(a.data || ''));
  });

  if (!filtered.length) {
    listEl.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">📋</span>
        <h3 class="empty-title">Nenhum processo encontrado</h3>
        <p class="empty-desc">Não há processos com o filtro ou busca selecionados.</p>
        <button type="button" class="primary" id="btn-empty-novo">➕ Iniciar Nova Solicitação</button>
      </div>
    `;
    $('btn-empty-novo')?.addEventListener('click', () => switchMainView('novo'));
    return;
  }

  listEl.innerHTML = filtered.map(p => {
    const sheetStatus = statusForProcess(p);
    const badgeClass = sheetStatus === 'Compensado' ? 'concluido'
      : ['Indeferido', 'Arquivado'].includes(sheetStatus) ? 'indeferido'
      : sheetStatus === 'Aguardando Compensação' ? 'compensacao'
      : sheetStatus.includes('CODEMA') || sheetStatus.includes('Obras') || sheetStatus.includes('Planejamento') ? 'autorizado' : 'analise';
    const canConfirmCompensation = sheetStatus === 'Aguardando Compensação';
    return `
      <article class="processo-card">
        <header class="processo-header">
          <div class="proc-id-wrap">
            <span class="proc-num">Proc. nº ${esc(p.protocolo || 'S/N')}</span>
            <span class="status-badge ${badgeClass}">${esc(sheetStatus)}</span>
          </div>
          <span class="proc-date">📅 ${isoToBr(p.data)}</span>
        </header>

        <div class="processo-body">
          <div>
            <div class="proc-info-row">
              <span class="proc-label">Requerente:</span> ${esc(p.requerente || 'Não informado')}
            </div>
            <div class="proc-info-row">
              <span class="proc-label">Local:</span> ${esc(p.endereco || 'Andradas/MG')}
            </div>
            <div class="proc-info-row">
              <span class="proc-label">Objeto:</span> ${esc(p.intervencaoLabel || p.intervencao)} (${p.quantidade || 1} árvore(s))
            </div>
            <div class="proc-info-row">
              <span class="proc-label">Vistoria in loco:</span> ${p.vistoriaInLoco ? `✓ realizada${p.vistoriaRealizadaEm ? ` em ${new Date(p.vistoriaRealizadaEm).toLocaleDateString('pt-BR')}` : ''}` : 'ainda não registrada'}
            </div>
            <div class="proc-info-row">
              <span class="proc-label">Fiscal:</span> ${esc(processFiscal(p).nome || 'Não atribuído')} · matrícula ${esc(processFiscal(p).matricula || '0')}
            </div>
          </div>
          <div>
            ${p.arvoreInventarioId ? `
              <div class="tree-badge-link" title="Árvore vinculada ao Inventário Municipal">
                <span>🌳</span>
                <div>
                  <strong>Árvore ID #${esc(p.arvoreInventarioId)}</strong>
                  <div style="font-size: 0.72rem; opacity: 0.85;">${esc(p.arvoreInventarioNome || 'Inventário')}</div>
                </div>
              </div>
            ` : `
              <span class="badge" style="opacity: 0.7;">Árvore não inventariada</span>
            `}
          </div>
        </div>

        <footer class="processo-actions">
          ${canConfirmCompensation ? `
            <button type="button" class="btn-sm btn-confirm-compensacao" data-id="${esc(p.id)}">
              ✓ Confirmar compensação
            </button>
          ` : ''}
          <button type="button" class="btn-sm primary btn-view-parecer" data-id="${esc(p.id)}">
            Ver detalhes
          </button>
          <details class="process-more">
            <summary title="Mais ações" aria-label="Mais ações"><span aria-hidden="true">⋮</span></summary>
            <div class="process-more-menu">
              <button type="button" class="btn-sm button-outline btn-resume-proc" data-id="${esc(p.id)}">Continuar ou editar</button>
              <button type="button" class="btn-sm button-outline btn-change-status" data-id="${esc(p.id)}">Atualizar andamento</button>
              <button type="button" class="btn-sm button-outline btn-delete-proc danger-action" data-id="${esc(p.id)}">Excluir processo</button>
            </div>
          </details>
        </footer>
      </article>
    `;
  }).join('');

  listEl.querySelectorAll('.btn-confirm-compensacao').forEach(btn => {
    btn.addEventListener('click', () => confirmCompensacao(btn.dataset.id));
  });

  listEl.querySelectorAll('.btn-resume-proc').forEach(btn => {
    btn.addEventListener('click', () => resumeProcesso(btn.dataset.id));
  });

  listEl.querySelectorAll('.btn-view-parecer').forEach(btn => {
    btn.addEventListener('click', () => viewProcessoParecer(btn.dataset.id));
  });

  listEl.querySelectorAll('.btn-change-status').forEach(btn => {
    btn.addEventListener('click', () => openStatusModal(btn.dataset.id));
  });

  listEl.querySelectorAll('.btn-delete-proc').forEach(btn => {
    btn.addEventListener('click', () => deleteProcesso(btn.dataset.id));
  });
}

function remoteProcessCopy(proc) {
  const copy = JSON.parse(JSON.stringify(proc));
  copy.trees = (copy.trees || []).map(tree => ({
    ...tree,
    photos: Object.fromEntries(Object.entries(tree.photos || {}).filter(([, photo]) => photo && !String(photo).startsWith('data:')))
  }));
  return copy;
}

function inspectionInventoryReference(proc, index) {
  return 'Vistoria ' + proc.protocolo + ' · exemplar ' + (index + 1);
}

function deterministicInventoryId(proc, index) {
  return 'VIST-' + String(proc.protocolo || '').replace(/[^a-zA-Z0-9]/g, '-') + '-' + (index + 1);
}

function inventoryPayload(tree, index, proc) {
  const ownPhotos = Object.values(tree.photos || {}).filter(Boolean);
  const catalogTree = tree.inventoryId
    ? inventoryTrees.find(item => String(item.id) === String(tree.inventoryId))
    : null;
  const photos = ownPhotos.length ? ownPhotos : (catalogTree?.fotos || []);
  return {
    id: tree.inventoryId || deterministicInventoryId(proc, index), latitude: tree.latitude || '', longitude: tree.longitude || '',
    rua: proc.endereco || '', bairro: '', logradouro: proc.endereco || '',
    referencia: inspectionInventoryReference(proc, index), localPlantio: 'Vistoria in loco',
    especie: tree.cientifico || tree.popular || 'Não identificada', nomePopular: tree.popular || '',
    nomeCientifico: tree.cientifico || '', familia: tree.familia || '', origem: tree.origem || '',
    certeza: tree.certeza || '', porte: tree.altura ? `${tree.altura} m` : '',
    tronco: tree.dap ? `DAP ${tree.dap} cm` : '', dap: tree.dap || '', altura: tree.altura || '',
    protocoloVistoria: proc.protocolo || '', problemas: [tree.doenca, tree.condicao].filter(Boolean),
    interferencia: selectedConflicts(tree), intervencao: proc.intervencaoLabel || proc.intervencao || '',
    observacoes: tree.observacao || '',
    status: tree.risco === 'sim' ? 'critico' : tree.risco === 'monitorar' ? 'atencao' : 'vistoriada',
    timestamp: Date.now(), dataAtualizacao: Date.now(),
    foto1: photos[0] || '', foto2: photos[1] || '', foto3: photos[2] || '', foto4: photos[3] || '', foto5: photos[4] || ''
  };
}

async function syncTreesToInventory(proc) {
  if (!proc.vistoriaInLoco || !Array.isArray(proc.trees)) return [];
  const errors = [];
  if (proc.trees.some(tree => !tree.inventoryId)) await loadInventoryTrees();
  for (let index = 0; index < proc.trees.length; index++) {
    const tree = proc.trees[index];
    try {
      const reference = inspectionInventoryReference(proc, index);
      if (!tree.inventoryId) {
        const existing = inventoryTrees.find(item => String(item.referencia || '').trim() === reference);
        if (existing?.id) tree.inventoryId = existing.id;
      }
      const data = inventoryPayload(tree, index, proc);
      const response = await fetch('/api/inventory', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: tree.inventoryId ? 'update' : 'create', id: tree.inventoryId || '', data })
      });
      const result = await response.json();
      if (!response.ok || !(result.ok || result.status === 'ok' || result.success)) throw new Error(result.error || result.message || 'Inventário não respondeu');
      tree.inventoryId = result.id || tree.inventoryId || data.id;
      tree.inventorySync = 'synced';
      const savedPhotos = result.data?.fotos || result.photos;
      if (Array.isArray(savedPhotos)) {
        const keys = Object.keys(tree.photos || {});
        keys.forEach((key, photoIndex) => { if (savedPhotos[photoIndex]) tree.photos[key] = savedPhotos[photoIndex]; });
      }
      if (trees[index]) trees[index] = JSON.parse(JSON.stringify(tree));
    } catch (error) {
      tree.inventorySync = 'pending';
      errors.push(`Árvore ${index + 1}: ${error.message}`);
    }
  }
  proc.trees = JSON.parse(JSON.stringify(proc.trees));
  proc.arvoreInventarioId = proc.trees[0]?.inventoryId || proc.arvoreInventarioId || null;
  proc.arvoreInventarioNome = proc.trees[0]?.popular || proc.arvoreInventarioNome || '';
  return errors;
}

async function verifyProcessSheet(proc) {
  const response = await fetch('/api/processes?verify=' + Date.now(), { cache: 'no-store' });
  const data = await response.json();
  if (!response.ok || !data.ok) throw new Error(data.error || 'A planilha não confirmou a gravação');
  const remote = (data.processes || []).find(item => String(item.protocolo || '') === String(proc.protocolo || ''));
  if (!remote) throw new Error('O processo não apareceu na planilha após o envio');
  const normalizedField = value => String(value || '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('pt-BR');
  if (proc.telefone && normalizedField(remote.telefone) !== normalizedField(proc.telefone)) {
    throw new Error('A planilha não confirmou o telefone na coluna Telefone');
  }
  if (proc.endereco && normalizedField(remote.endereco) !== normalizedField(proc.endereco)) {
    throw new Error('A planilha não confirmou o endereço na coluna Endereço');
  }
  if (processDataRank(remote) < processDataRank(proc)) {
    throw new Error('A planilha respondeu sem os dados completos da vistoria');
  }
  return remote;
}

async function performProcessSync(proc, { silent = false } = {}) {
  const inventoryErrors = await syncTreesToInventory(proc);
  const toBr = value => /^\d{4}-\d{2}-\d{2}$/.test(String(value || '')) ? isoToBr(value) : (value || '');
  const coords = proc.coordenadas || {};
  const syncTimestamp = new Date().toISOString();
  const payload = {
    action: 'upsertProcess',
    process: remoteProcessCopy({ ...proc, syncStatus: 'synced', syncedAt: syncTimestamp }),
    data: toBr(proc.data),
    protocolo: proc.protocolo || '',
    solicitante: proc.requerente || '',
    telefone: proc.telefone || '',
    endereco: proc.endereco || '',
    solicitacao: proc.solicitacaoRequerente || proc.intervencaoLabel || proc.intervencao || '',
    coordCorte1: coords.lat || '',
    coordCorte2: coords.lng || '',
    responsavelCorte: proc.responsavelCorte || '',
    autorizacao: proc.autorizacao || '',
    dataAutorizacao: toBr(proc.dataAutorizacao),
    dataVistoria: toBr(proc.dataVistoria),
    dataEncaminhamento: toBr(proc.dataEncaminhamento),
    dataCompensacao: toBr(proc.dataCompensacao),
    fiscalNome: proc.fiscalNome || '',
    fiscalMatricula: proc.fiscalMatricula || '0',
    fiscalCargo: proc.fiscalCargo || '',
    formaCompensacao: proc.formaCompensacao || '',
    formaCompensacaoLabel: proc.formaCompensacaoLabel || '',
    compensacao: proc.compensacao || '',
    prazo: toBr(proc.prazo),
    coordComp1: proc.coordComp1 || '',
    coordComp2: proc.coordComp2 || '',
    situacao: statusForSheet(proc.situacao)
  };

  try {
    const response = await fetch('/api/process-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || 'Resposta inválida do Google');
    if (data.skipped && data.process) {
      Object.assign(proc, mergeProcessCopies(proc, data.process), { syncStatus: 'synced' });
    } else {
      await verifyProcessSheet(proc);
    }
    proc.syncStatus = inventoryErrors.length ? 'pending' : 'synced';
    proc.syncedAt = syncTimestamp;
    if (silent && inventoryErrors.length) return { processSynced: true, inventoryErrors };
    if (inventoryErrors.length) alert(`O processo foi sincronizado, mas há itens pendentes no Inventário:\n${inventoryErrors.join('\n')}`);
    return { processSynced: true, inventoryErrors };
  } catch (error) {
    if (silent) return { processSynced: false, inventoryErrors, processError: error.message };
    proc.syncStatus = 'pending';
    alert(`O processo ficou salvo neste aparelho, mas a sincronização compartilhada falhou: ${error.message}${inventoryErrors.length ? `\n\nInventário pendente:\n${inventoryErrors.join('\n')}` : ''}`);
    return { processSynced: false, inventoryErrors, processError: error.message };
  }
}

function syncNewProcessoVistoria(proc, options = {}) {
  const key = String(proc?.protocolo || proc?.id || '');
  if (processSyncByProtocol.has(key)) return processSyncByProtocol.get(key);
  const request = performProcessSync(proc, options)
    .finally(() => processSyncByProtocol.delete(key));
  processSyncByProtocol.set(key, request);
  return request;
}

function updatePendingProcessSyncUi() {
  const button = $('btn-sync-processos');
  if (!button) return;
  const count = processos.filter(process => process.syncStatus === 'pending').length;
  button.hidden = count === 0;
  button.textContent = count === 1 ? 'Enviar 1 c\u00f3pia pendente' : `Enviar ${count} c\u00f3pias pendentes`;
}

async function runPendingProcessSync({ feedback = false } = {}) {
  const pending = processos.filter(process => process.syncStatus === 'pending');
  const status = $('process-refresh-status');
  const button = $('btn-sync-processos');
  if (!pending.length) {
    updatePendingProcessSyncUi();
    if (feedback && status) status.textContent = 'N\u00e3o h\u00e1 c\u00f3pias pendentes neste aparelho.';
    return { synced: 0, remaining: 0 };
  }
  if (!navigator.onLine) {
    if (status) status.textContent = 'Sem internet. A c\u00f3pia continua preservada neste aparelho.';
    return { synced: 0, remaining: pending.length };
  }
  if (button) button.disabled = true;
  if (feedback && status) status.textContent = `Enviando ${pending.length} registro${pending.length === 1 ? '' : 's'} para as planilhas...`;
  let synced = 0;
  for (const process of pending) {
    const result = await syncNewProcessoVistoria(process, { silent: true });
    upsertLocalProcess(process);
  await saveProcessos();
    if (result.processSynced) synced++;
    if (!result.processSynced) break;
  }
  const remaining = processos.filter(process => process.syncStatus === 'pending').length;
  if (button) button.disabled = false;
  updatePendingProcessSyncUi();
  if (status && (feedback || synced)) {
    status.textContent = remaining === 0
      ? `\u2713 ${synced} c\u00f3pia${synced === 1 ? '' : 's'} enviada${synced === 1 ? '' : 's'} \u00e0s planilhas.`
      : `${synced ? `${synced} processo${synced === 1 ? '' : 's'} enviado${synced === 1 ? '' : 's'}; ` : ''}${remaining} registro${remaining === 1 ? '' : 's'} ainda aguardando envio.`;
  }
  return { synced, remaining };
}
function syncPendingProcesses(options = {}) {
  if (pendingProcessSyncPromise) return pendingProcessSyncPromise;
  pendingProcessSyncPromise = runPendingProcessSync(options)
    .finally(() => { pendingProcessSyncPromise = null; });
  return pendingProcessSyncPromise;
}
// Salva processo atual
async function saveCurrentProcesso() {
  normalizeAllUppercaseFields();
  syncSpecies();
  const prot = val('processo') || `PROC-${new Date().getFullYear()}-${String(processos.length + 1).padStart(4, '0')}`;
  const existing = processos.find(p => p.protocolo === prot) || {};
  const req = val('requerente') || 'Não informado';
  const end = val('local') || 'Andradas/MG';
  const inter = val('intervencao');
  const sit = statusForSheet(val('situacao'));
  const parecerText = val('saida') || '';
  const destinacaoTipo = getDestinacaoTipo() || existing.destinacaoTipo || 'requerente';

  const proc = {
    id: `PROC-${Date.now()}`,
    protocolo: prot,
    data: val('data-cadastro') || existing.dataCadastro || existing.data || new Date().toISOString().slice(0, 10),
    requerente: req,
    telefone: val('telefone') || existing.telefone || '',
    solicitacaoRequerente: val('requerente-solicita'),
    endereco: end,
    intervencao: inter,
    intervencaoLabel: label('intervencao'),
    quantidade: trees.length,
    finalidade: val('finalidade') === 'outro' ? val('finalidade-outro-detalhe') : label('finalidade'),
    finalidadeVal: val('finalidade'),
    finalidadeOutroDetalhe: val('finalidade-outro-detalhe'),
    situacao: sit,
    destinacaoTipo,
    conclusao: val('conclusao'),
    diagnostico: val('diagnostico'),
    arvoreInventarioId: linkedTree ? linkedTree.id : (trees[0]?.inventoryId || null),
    arvoreInventarioNome: linkedTree ? (linkedTree.especie || '') : (trees[0]?.popular || ''),
    coordenadas: {
      lat: trees[0]?.latitude || val('geo-lat') || val('coord-corte-1'),
      lng: trees[0]?.longitude || val('geo-lng') || val('coord-corte-2')
    },
    trees: JSON.parse(JSON.stringify(trees)),
    vistoriaInLoco: existing.vistoriaInLoco || false,
    vistoriaRealizadaEm: existing.vistoriaRealizadaEm || '',
    responsavelCorte: val('responsavel-corte'),
    autorizacao: val('autorizacao'),
    dataAutorizacao: val('data-autorizacao'),
    formaCompensacao: val('forma'),
    compensacao: calculateCompensation().text,
    prazo: val('prazo'),
    coordComp1: val('coord-comp-1'),
    coordComp2: val('coord-comp-2'),
    parecerTexto: parecerText,
    updatedAt: new Date().toISOString(),
    ...processTrackingFields(existing)
  };

  upsertLocalProcess(proc);
  await saveProcessos();
  const syncResult = await syncNewProcessoVistoria(proc);
  const synced = syncResult.processSynced && syncResult.inventoryErrors.length === 0;
  upsertLocalProcess(proc);
  await saveProcessos();
  if (synced) setProcessAutosaveStatus('Tudo salvo e sincronizado.', 'saved');
  switchMainView('processos');
}

// ── Salvamento da Etapa 1: Requerimento Administrativo ───────────────────────
async function saveEtapa1() {
  normalizeAllUppercaseFields();
  const prot = val('processo') || `PROV-${Date.now().toString().slice(-5)}`;
  const existing = processos.find(p => p.protocolo === prot) || {};
  const req = val('requerente') || 'Requerente não informado';
  const end = val('local') || 'Endereço não informado';
  const inter = val('intervencao');
  const finalidadeVal = val('finalidade');
  let finalidadeTxt = label('finalidade');
  const outroDetalhe = val('finalidade-outro-detalhe');
  if (finalidadeVal === 'outro') {
    finalidadeTxt = outroDetalhe ? `Outro: ${outroDetalhe}` : 'Outro motivo tecnicamente justificado';
  }

  syncSpecies();

  const proc = {
    id: 'PROC-' + Date.now(),
    protocolo: prot,
    data: val('data-cadastro') || existing.dataCadastro || existing.data || new Date().toISOString().slice(0, 10),
    requerente: req,
    telefone: val('telefone') || existing.telefone || '',
    solicitacaoRequerente: val('requerente-solicita'),
    endereco: end,
    intervencao: inter,
    intervencaoLabel: label('intervencao'),
    quantidade: trees.length,
    finalidade: finalidadeTxt,
    finalidadeVal: finalidadeVal,
    finalidadeOutroDetalhe: outroDetalhe,
    situacao: 'Aguardando Vistoria',
    arvoreInventarioId: linkedTree ? linkedTree.id : (trees[0]?.inventoryId || null),
    arvoreInventarioNome: linkedTree ? (linkedTree.especie || '') : (trees[0]?.popular || ''),
    coordenadas: {
      lat: trees[0]?.latitude || val('geo-lat') || val('coord-corte-1'),
      lng: trees[0]?.longitude || val('geo-lng') || val('coord-corte-2')
    },
    trees: JSON.parse(JSON.stringify(trees)),
    vistoriaInLoco: false,
    compensacao: 'Aguardando vistoria técnica a campo',
    parecerTexto: 'Requerimento administrativo registrado. Aguardando coleta de dados e vistoria técnica in loco.',
    updatedAt: new Date().toISOString(),
    ...processTrackingFields(existing)
  };

  upsertLocalProcess(proc);
  await saveProcessos();
  const syncResult = await syncNewProcessoVistoria(proc);
  const synced = syncResult.processSynced;
  upsertLocalProcess(proc);
  await saveProcessos();
  if (synced) setProcessAutosaveStatus('Requerimento salvo e sincronizado.', 'saved');
}

// ── Salvamento da Etapa 2: Vistoria Técnica a Campo ─────────────────────────
async function saveEtapa2() {
  normalizeAllUppercaseFields();
  syncSpecies();
  const invalidCoordinates = trees.map((tree, index) => !validCoordinatePair(tree.latitude, tree.longitude) ? index + 1 : null).filter(Boolean);
  if (invalidCoordinates.length) {
    alert(`Registre uma latitude e uma longitude válidas para cada árvore antes de salvar. Verifique o(s) exemplar(es) ${invalidCoordinates.join(', ')}.`);
    return;
  }
  const prot = val('processo') || `PROV-${Date.now().toString().slice(-5)}`;
  const existing = processos.find(p => p.protocolo === prot) || {};
  const req = val('requerente') || 'Requerente não informado';
  const end = val('local') || 'Endereço não informado';
  const inter = val('intervencao');
  const finalidadeVal = val('finalidade');
  let finalidadeTxt = label('finalidade');
  const outroDetalhe = val('finalidade-outro-detalhe');
  if (finalidadeVal === 'outro') {
    finalidadeTxt = outroDetalhe ? `Outro: ${outroDetalhe}` : 'Outro motivo tecnicamente justificado';
  }

  const comp = calculateCompensation();

  const proc = {
    id: 'PROC-' + Date.now(),
    protocolo: prot,
    data: val('data-cadastro') || existing.dataCadastro || existing.data || new Date().toISOString().slice(0, 10),
    requerente: req,
    telefone: val('telefone') || existing.telefone || '',
    solicitacaoRequerente: val('requerente-solicita'),
    endereco: end,
    intervencao: inter,
    intervencaoLabel: label('intervencao'),
    quantidade: trees.length,
    finalidade: finalidadeTxt,
    finalidadeVal: finalidadeVal,
    finalidadeOutroDetalhe: outroDetalhe,
    situacao: 'Parecer em Elaboração',
    arvoreInventarioId: linkedTree ? linkedTree.id : (trees[0]?.inventoryId || null),
    arvoreInventarioNome: linkedTree ? (linkedTree.especie || '') : (trees[0]?.popular || ''),
    coordenadas: {
      lat: trees[0]?.latitude || val('geo-lat') || val('coord-corte-1'),
      lng: trees[0]?.longitude || val('geo-lng') || val('coord-corte-2')
    },
    trees: JSON.parse(JSON.stringify(trees)),
    vistoriaInLoco: true,
    vistoriaRealizadaEm: new Date().toISOString(),
    formaCompensacao: val('forma'),
    compensacao: comp.text,
    diagnostico: val('diagnostico'),
    parecerTexto: 'Vistoria a campo realizada e registrada pela equipe técnica. Aguardando emissão do parecer/ofício.',
    updatedAt: new Date().toISOString(),
    ...processTrackingFields(existing),
    dataVistoria: val('data-vistoria') || new Date().toISOString().slice(0, 10)
  };

  upsertLocalProcess(proc);
  await saveProcessos();
  const syncResult = await syncNewProcessoVistoria(proc);
  const synced = syncResult.processSynced && syncResult.inventoryErrors.length === 0;
  upsertLocalProcess(proc);
  await saveProcessos();
  if (synced) setProcessAutosaveStatus('Vistoria salva e sincronizada.', 'saved');
}

// ── Salvamento da Etapa 3 / Conclusão: Parecer e Expedição ──────────────────
async function saveFinalProcesso() {
  normalizeAllUppercaseFields();
  syncSpecies();
  const invalidCoordinates = trees.map((tree, index) => !validCoordinatePair(tree.latitude, tree.longitude) ? index + 1 : null).filter(Boolean);
  if (invalidCoordinates.length) {
    alert(`Registre uma latitude e uma longitude válidas para cada árvore antes de concluir o parecer. Verifique o(s) exemplar(es) ${invalidCoordinates.join(', ')}.`);
    showTab('vistoria');
    return;
  }
  if (!val('saida') || parecerNeedsRegeneration) {
    generate();
  }

  const destinacaoTipo = getDestinacaoTipo();
  const concl = val('conclusao');
  const sit = situacaoDoParecer(destinacaoTipo);

  const prot = val('processo') || `PROC-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
  const existing = processos.find(p => p.protocolo === prot) || {};
  const req = val('requerente') || 'Requerente não informado';
  const end = val('local') || 'Endereço não informado';
  const inter = val('intervencao');
  const finalidadeVal = val('finalidade');
  let finalidadeTxt = label('finalidade');
  const outroDetalhe = val('finalidade-outro-detalhe');
  if (finalidadeVal === 'outro') {
    finalidadeTxt = outroDetalhe ? `Outro: ${outroDetalhe}` : 'Outro motivo tecnicamente justificado';
  }

  const proc = {
    id: 'PROC-' + Date.now(),
    protocolo: prot,
    data: val('data-cadastro') || existing.dataCadastro || existing.data || new Date().toISOString().slice(0, 10),
    requerente: req,
    telefone: val('telefone') || existing.telefone || '',
    solicitacaoRequerente: val('requerente-solicita'),
    endereco: end,
    intervencao: inter,
    intervencaoLabel: label('intervencao'),
    quantidade: trees.length,
    finalidade: finalidadeTxt,
    finalidadeVal: finalidadeVal,
    finalidadeOutroDetalhe: outroDetalhe,
    situacao: sit,
    destinacaoTipo: destinacaoTipo,
    conclusao: concl,
    arvoreInventarioId: linkedTree ? linkedTree.id : (trees[0]?.inventoryId || null),
    arvoreInventarioNome: linkedTree ? (linkedTree.especie || '') : (trees[0]?.popular || ''),
    coordenadas: {
      lat: trees[0]?.latitude || val('geo-lat') || val('coord-corte-1'),
      lng: trees[0]?.longitude || val('geo-lng') || val('coord-corte-2')
    },
    trees: JSON.parse(JSON.stringify(trees)),
    vistoriaInLoco: true,
    vistoriaRealizadaEm: existing.vistoriaRealizadaEm || new Date().toISOString(),
    formaCompensacao: val('forma'),
    compensacao: calculateCompensation().text,
    diagnostico: val('diagnostico'),
    parecerTexto: val('saida'),
    updatedAt: new Date().toISOString(),
    ...processTrackingFields(existing),
    dataEncaminhamento: val('data-encaminhamento') || new Date().toISOString().slice(0, 10)
  };

  upsertLocalProcess(proc);
  await saveProcessos();
  const syncResult = await syncNewProcessoVistoria(proc);
  const synced = syncResult.processSynced && syncResult.inventoryErrors.length === 0;
  upsertLocalProcess(proc);
  await saveProcessos();
  if (synced) setProcessAutosaveStatus('Parecer e andamento salvos.', 'saved');
  switchMainView('processos');
}

// ── Retomada / Edição de Processo no Wizard ─────────────────────────────────
function resumeProcesso(id) {
  const p = processos.find(x => x.id === id);
  if (!p) {
    alert('Processo não encontrado.');
    return;
  }
  currentEditingProcessId = p.id;
  setProcessAutosaveStatus('Processo carregado. As alterações serão salvas automaticamente.', 'saved');

  const chosenFiscal = selectedFiscal();
  const assignedFiscal = processFiscal(p);
  if (chosenFiscal.nome && fiscalKey(chosenFiscal) !== processFiscalKey(p)) {
    const canAssign = !assignedFiscal.nome || confirm(`Este processo está atribuído a ${assignedFiscal.nome}. Deseja assumir o processo como ${chosenFiscal.nome}?`);
    if (canAssign) {
      Object.assign(p, { fiscal: chosenFiscal, fiscalNome: chosenFiscal.nome, fiscalMatricula: chosenFiscal.matricula, fiscalCargo: chosenFiscal.cargo });
      saveProcessos();
    } else {
      if (!fiscalProfiles.some(item => fiscalKey(item) === fiscalKey(assignedFiscal))) fiscalProfiles.push(assignedFiscal);
      renderFiscalSelectors(fiscalKey(assignedFiscal));
    }
  }

  // 1. Restaura campos da Etapa 1
  if ($('processo')) $('processo').value = p.protocolo || '';
  if ($('data-cadastro')) $('data-cadastro').value = p.dataCadastro || p.data || '';
  if ($('requerente')) $('requerente').value = p.requerente || '';
  if ($('telefone')) $('telefone').value = p.telefone || '';
  if ($('requerente-solicita')) $('requerente-solicita').value = p.solicitacaoRequerente || '';
  if ($('local')) $('local').value = p.endereco || '';
  if ($('intervencao') && p.intervencao) $('intervencao').value = p.intervencao;

  // Finalidade e motivo detalhado
  if ($('finalidade')) {
    if (p.finalidadeVal) {
      $('finalidade').value = p.finalidadeVal;
    } else if (p.finalidade && p.finalidade.toLowerCase().includes('outro')) {
      $('finalidade').value = 'outro';
    }
  }
  const outroWrap = $('finalidade-outro-wrap');
  const outroInp = $('finalidade-outro-detalhe');
  if (val('finalidade') === 'outro') {
    if (outroWrap) outroWrap.hidden = false;
    if (outroInp) outroInp.value = p.finalidadeOutroDetalhe || (p.finalidade?.replace(/^Outro:\s*/, '') || '');
  } else {
    if (outroWrap) outroWrap.hidden = true;
  }

  // Coordenadas
  const lat = p.coordenadas?.lat || '';
  const lng = p.coordenadas?.lng || '';
  if ($('geo-lat')) $('geo-lat').value = lat;
  if ($('geo-lng')) $('geo-lng').value = lng;
  if ($('coord-corte-1')) $('coord-corte-1').value = lat;
  if ($('coord-corte-2')) $('coord-corte-2').value = lng;
  if (lat && lng) {
    initOrUpdateMiniMap(lat, lng, p.endereco);
  }

  // Árvore vinculada do Inventário
  if (p.arvoreInventarioId) {
    linkedTree = inventoryTrees.find(it => String(it.id) === String(p.arvoreInventarioId)) || {
      id: p.arvoreInventarioId,
      especie: p.arvoreInventarioNome || ''
    };
  } else {
    linkedTree = null;
  }

  // 2. Restaura árvores da Etapa 2
  if (Array.isArray(p.trees) && p.trees.length > 0) {
    trees = JSON.parse(JSON.stringify(p.trees));
    if ($('quantidade')) $('quantidade').value = trees.length;
    renderAll(false);
  } else {
    const q = p.quantidade || 1;
    if ($('quantidade')) $('quantidade').value = q;
    renderAll(true);
  }

  // 3. Restaura campos da Etapa 3
  const storedFiscal = processFiscal(p);
  if (storedFiscal.nome) {
    if (!fiscalProfiles.some(item => fiscalKey(item) === fiscalKey(storedFiscal))) fiscalProfiles.push(storedFiscal);
    renderFiscalSelectors(fiscalKey(storedFiscal));
  }
  ['area', 'grande', 'valor', 'impacto', 'alternativa', 'especial', 'executor'].forEach(field => {
    if ($(field) && p[field]) $(field).value = p[field];
  });
  if ($('diagnostico') && p.diagnostico) $('diagnostico').value = p.diagnostico;
  if ($('conclusao') && p.conclusao) $('conclusao').value = p.conclusao;
  if ($('destinacao-tipo') && p.destinacaoTipo) {
    $('destinacao-tipo').value = p.destinacaoTipo;
    $('destinacao-tipo').dispatchEvent(new Event('change'));
  }
  if ($('intervencao-autorizada')) {
    $('intervencao-autorizada').value = p.intervencaoAutorizada || (['poda', 'podadrastica'].includes(p.intervencao) ? 'poda' : 'corte');
  }
  if (p.parecerTexto && $('saida')) {
    $('saida').value = p.parecerTexto;
    if ($('documento')) $('documento').hidden = false;
    parecerNeedsRegeneration = false;
  } else {
    parecerNeedsRegeneration = true;
  }
  if ($('num-oficio')) $('num-oficio').value = p.numeroOficio || '';
  if ($('destinatario-formal')) $('destinatario-formal').value = p.destinatarioFormal || '';
  if ($('data-vistoria')) $('data-vistoria').value = p.dataVistoria || (p.vistoriaRealizadaEm ? String(p.vistoriaRealizadaEm).slice(0, 10) : '');
  if ($('data-encaminhamento')) $('data-encaminhamento').value = p.dataEncaminhamento || '';

  // 4. Restaura os dados administrativos da compensação
  if ($('forma') && p.formaCompensacao) $('forma').value = p.formaCompensacao;
  if ($('responsavel-corte') && p.responsavelCorte) $('responsavel-corte').value = p.responsavelCorte;
  if ($('autorizacao') && p.autorizacao) $('autorizacao').value = p.autorizacao;
  if ($('data-autorizacao') && p.dataAutorizacao) $('data-autorizacao').value = p.dataAutorizacao;
  if ($('data-compensacao')) $('data-compensacao').value = p.dataCompensacao || (p.compensacaoConfirmadaEm ? brDateToIsoLocal(p.compensacaoConfirmadaEm) : '');
  if ($('prazo') && p.prazo) $('prazo').value = p.prazo;
  if ($('coord-comp-1') && p.coordComp1) $('coord-comp-1').value = p.coordComp1;
  if ($('coord-comp-2') && p.coordComp2) $('coord-comp-2').value = p.coordComp2;
  if ($('situacao') && p.situacao) $('situacao').value = statusForProcess(p);

  // Muda para a visão do Wizard
  switchMainView('novo');

  // Abre a etapa mais relevante para continuar o trabalho
  const processStatus = statusForProcess(p);
  if (processStatus === 'Aguardando Vistoria' && !p.diagnostico && !p.parecerTexto) {
    showTab('vistoria');
  } else if (['Aguardando Compensação', 'Compensado'].includes(processStatus)) {
    showTab('compensacao');
  } else {
    showTab('parecer');
  }
}

// ── Mini-Mapa da Árvore com Leaflet ──────────────────────────────────────────
let treeMiniMap = null;
let treeMiniMarker = null;
let modalProcessMap = null;

function getProcessMapLocation(process) {
  const processLat = parseFloat(String(process?.coordenadas?.lat || '').replace(',', '.'));
  const processLng = parseFloat(String(process?.coordenadas?.lng || '').replace(',', '.'));
  const hasProcessCoords = Number.isFinite(processLat) && Number.isFinite(processLng);
  const linkedInventoryTree = process?.arvoreInventarioId
    ? inventoryTrees.find(tree => String(tree.id) === String(process.arvoreInventarioId))
    : null;

  let matchedTree = linkedInventoryTree || null;
  let matchDistance = null;
  if (!matchedTree && hasProcessCoords) {
    for (const tree of inventoryTrees) {
      if (tree.latitude == null || tree.longitude == null) continue;
      const distance = haversineMeters(processLat, processLng, tree.latitude, tree.longitude);
      if (distance <= 40 && (matchDistance == null || distance < matchDistance)) {
        matchedTree = tree;
        matchDistance = distance;
      }
    }
  }

  const inventoryLat = Number(matchedTree?.latitude);
  const inventoryLng = Number(matchedTree?.longitude);
  const lat = hasProcessCoords ? processLat : inventoryLat;
  const lng = hasProcessCoords ? processLng : inventoryLng;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return {
    lat, lng, matchedTree, matchDistance,
    isExplicitLink: Boolean(linkedInventoryTree),
    label: matchedTree
      ? `Árvore #${matchedTree.id} · ${matchedTree.especie || process.arvoreInventarioNome || 'Inventário Municipal'}`
      : `Processo ${process?.protocolo || 'sem número'}`
  };
}

function renderModalProcessMap(process) {
  const section = $('modal-process-map-section');
  const location = getProcessMapLocation(process);
  if (!section) return;
  if (modalProcessMap) {
    modalProcessMap.remove();
    modalProcessMap = null;
  }
  if (!location || typeof L === 'undefined') {
    section.hidden = true;
    return;
  }

  section.hidden = false;
  const matchDescription = location.isExplicitLink
    ? 'Correspondência confirmada no Inventário Municipal'
    : location.matchedTree
      ? `Possível correspondência com a Árvore #${location.matchedTree.id} (${Math.round(location.matchDistance)} m)`
      : 'Coordenadas registradas na vistoria';
  $('modal-process-map-title').textContent = location.matchedTree ? location.label : 'Coordenadas da vistoria';
  $('modal-process-map-caption').textContent = `${matchDescription} · ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`;
  $('modal-process-map-link').href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${location.lat},${location.lng}`)}`;

  modalProcessMap = L.map('modal-process-map', {
    center: [location.lat, location.lng], zoom: 18, scrollWheelZoom: false
  });
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap', maxZoom: 19
  }).addTo(modalProcessMap);
  L.marker([location.lat, location.lng]).addTo(modalProcessMap)
    .bindPopup(`<b>${esc(location.label)}</b><br>${esc(matchDescription)}`).openPopup();
}

function initOrUpdateMiniMap(lat, lng, labelText = 'Localização do Exemplar') {
  const box = $('mini-map-box');
  const caption = $('mini-map-caption');
  if (!box || !lat || !lng) return;

  const nLat = parseFloat(lat);
  const nLng = parseFloat(lng);
  if (isNaN(nLat) || isNaN(nLng)) return;

  box.hidden = false;
  if (caption) caption.textContent = `${labelText}: Latitude ${nLat.toFixed(6)}, Longitude ${nLng.toFixed(6)}`;

  if (typeof L !== 'undefined') {
    const container = $('mini-map-tree');
    if (!container) return;

    if (!treeMiniMap) {
      treeMiniMap = L.map('mini-map-tree', {
        center: [nLat, nLng],
        zoom: 17
      });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19
      }).addTo(treeMiniMap);
    }

    if (treeMiniMarker) {
      treeMiniMarker.setLatLng([nLat, nLng]);
    } else {
      treeMiniMarker = L.marker([nLat, nLng]).addTo(treeMiniMap);
    }
    treeMiniMarker.bindPopup(`<b>${esc(labelText)}</b><br>Coordenadas: ${nLat.toFixed(5)}, ${nLng.toFixed(5)}`).openPopup();
    treeMiniMap.setView([nLat, nLng], 17);
    setTimeout(() => treeMiniMap?.invalidateSize(), 150);
  }
}

// ── Dados do Fiscal ─────────────────────────────────────────────────────────
function fiscalKey(fiscal) {
  const nome = normalizeText(fiscal?.nome || fiscal?.fiscalNome || '');
  const matricula = String(fiscal?.matricula || fiscal?.fiscalMatricula || '0').trim() || '0';
  return nome ? `${nome}|${matricula}` : '';
}

function normalizedFiscal(fiscal = {}) {
  return {
    nome: String(fiscal.nome || fiscal.fiscalNome || '').trim(),
    matricula: String(fiscal.matricula || fiscal.fiscalMatricula || '0').trim() || '0',
    cargo: String(fiscal.cargo || fiscal.fiscalCargo || 'Fiscal de Meio Ambiente').trim() || 'Fiscal de Meio Ambiente'
  };
}

function selectedFiscal() {
  const selector = $('fiscal-selector');
  const selected = fiscalProfiles.find(item => fiscalKey(item) === selector?.value);
  if (selected) return normalizedFiscal(selected);
  const typed = normalizedFiscal({ nome: val('fiscal-nome'), matricula: val('fiscal-matricula'), cargo: val('fiscal-cargo') });
  return typed.nome ? typed : normalizedFiscal(fiscalProfiles[0] || {});
}

function processFiscal(process = {}) {
  return normalizedFiscal(process.fiscal || {
    nome: process.fiscalNome,
    matricula: process.fiscalMatricula,
    cargo: process.fiscalCargo
  });
}

function processFiscalKey(process) {
  const fiscal = processFiscal(process);
  return fiscal.nome ? fiscalKey(fiscal) : '';
}

function processMatchesSelectedFiscal(process) {
  if (!selectedProcessFiscalFilter || selectedProcessFiscalFilter === '__all__') return true;
  const key = processFiscalKey(process);
  return selectedProcessFiscalFilter === '__unassigned__' ? !key : key === selectedProcessFiscalFilter;
}

function fillFiscalFields(fiscal) {
  const normalized = normalizedFiscal(fiscal);
  if ($('fiscal-nome')) $('fiscal-nome').value = normalized.nome;
  if ($('fiscal-matricula')) $('fiscal-matricula').value = normalized.matricula;
  if ($('fiscal-cargo')) $('fiscal-cargo').value = normalized.cargo;
  if ($('fiscal-resumo')) $('fiscal-resumo').textContent = normalized.nome ? `${normalized.nome} · matrícula ${normalized.matricula}` : 'Não selecionado';
}

function renderFiscalSelectors(selectedKey) {
  const formSelector = $('fiscal-selector');
  const processFilter = $('process-fiscal-filter');
  const options = fiscalProfiles.map(fiscal => `<option value="${esc(fiscalKey(fiscal))}">${esc(fiscal.nome)} · matrícula ${esc(fiscal.matricula)}</option>`).join('');
  if (formSelector) {
    formSelector.innerHTML = options || '<option value="">Cadastre um fiscal</option>';
    const preferred = selectedKey || localStorage.getItem(SELECTED_FISCAL_KEY) || fiscalKey(fiscalProfiles[0]);
    if ([...formSelector.options].some(option => option.value === preferred)) formSelector.value = preferred;
    fillFiscalFields(fiscalProfiles.find(item => fiscalKey(item) === formSelector.value) || {});
  }
  if (processFilter) {
    processFilter.innerHTML = `<option value="__all__">Todos os fiscais</option>${options}<option value="__unassigned__">Sem fiscal atribuído</option>`;
    const preferredFilter = selectedProcessFiscalFilter || localStorage.getItem(PROCESS_FISCAL_FILTER_KEY) || formSelector?.value || '__all__';
    processFilter.value = [...processFilter.options].some(option => option.value === preferredFilter) ? preferredFilter : '__all__';
    selectedProcessFiscalFilter = processFilter.value;
  }
}

function loadFiscalData() {
  try {
    const stored = JSON.parse(localStorage.getItem(FISCAL_PROFILES_KEY) || '[]');
    fiscalProfiles = Array.isArray(stored) ? stored.map(normalizedFiscal).filter(item => item.nome) : [];
  } catch { fiscalProfiles = []; }
  if (!fiscalProfiles.length) {
    const migrated = normalizedFiscal({
      nome: localStorage.getItem('fiscal_nome') || 'Júlia R. Meira',
      matricula: localStorage.getItem('fiscal_matricula') || '0',
      cargo: localStorage.getItem('fiscal_cargo') || 'Fiscal de Meio Ambiente'
    });
    fiscalProfiles = [migrated];
    localStorage.setItem(FISCAL_PROFILES_KEY, JSON.stringify(fiscalProfiles));
  }
  renderFiscalSelectors();
}

function includeProcessFiscalProfiles() {
  let changed = false;
  processos.forEach(process => {
    const fiscal = processFiscal(process);
    if (fiscal.nome && !fiscalProfiles.some(item => fiscalKey(item) === fiscalKey(fiscal))) {
      fiscalProfiles.push(fiscal);
      changed = true;
    }
  });
  if (changed) localStorage.setItem(FISCAL_PROFILES_KEY, JSON.stringify(fiscalProfiles));
  renderFiscalSelectors($('fiscal-selector')?.value || localStorage.getItem(SELECTED_FISCAL_KEY));
}

function saveFiscalData() {
  normalizeAllUppercaseFields();
  const fiscal = normalizedFiscal({ nome: val('fiscal-nome'), matricula: val('fiscal-matricula'), cargo: val('fiscal-cargo') });
  if (!fiscal.nome) { alert('Informe o nome do fiscal.'); return; }
  const selector = $('fiscal-selector');
  const previousKey = selector?.value || '';
  const existingIndex = fiscalProfiles.findIndex(item => fiscalKey(item) === previousKey || fiscalKey(item) === fiscalKey(fiscal));
  if (existingIndex >= 0) fiscalProfiles[existingIndex] = fiscal; else fiscalProfiles.push(fiscal);
  localStorage.setItem(FISCAL_PROFILES_KEY, JSON.stringify(fiscalProfiles));
  localStorage.setItem(SELECTED_FISCAL_KEY, fiscalKey(fiscal));
  localStorage.setItem('fiscal_nome', fiscal.nome);
  localStorage.setItem('fiscal_matricula', fiscal.matricula);
  localStorage.setItem('fiscal_cargo', fiscal.cargo);
  selectedProcessFiscalFilter = fiscalKey(fiscal);
  localStorage.setItem(PROCESS_FISCAL_FILTER_KEY, selectedProcessFiscalFilter);
  renderFiscalSelectors(fiscalKey(fiscal));
  renderProcessos();
  const btn = $('btn-save-fiscal');
  if (btn) {
    btn.textContent = '✓ Fiscal salvo';
    setTimeout(() => { btn.textContent = '💾 Salvar fiscal'; }, 2500);
  }
}

function startNewFiscal() {
  if ($('fiscal-selector')) $('fiscal-selector').value = '';
  fillFiscalFields({ nome: '', matricula: '0', cargo: 'Fiscal de Meio Ambiente' });
  $('fiscal-nome')?.focus();
}

function fiscalProcessFields(existing = {}) {
  const fiscal = selectedFiscal();
  return {
    fiscal,
    fiscalNome: fiscal.nome || existing.fiscalNome || '',
    fiscalMatricula: fiscal.nome ? fiscal.matricula : (existing.fiscalMatricula || '0'),
    fiscalCargo: fiscal.nome ? fiscal.cargo : (existing.fiscalCargo || '')
  };
}

function processTrackingFields(existing = {}) {
  return {
    ...fiscalProcessFields(existing),
    dataCadastro: val('data-cadastro') || existing.dataCadastro || existing.data || new Date().toISOString().slice(0, 10),
    dataVistoria: val('data-vistoria') || existing.dataVistoria || '',
    dataEncaminhamento: val('data-encaminhamento') || existing.dataEncaminhamento || '',
    dataCompensacao: val('data-compensacao') || existing.dataCompensacao || '',
    formaCompensacaoLabel: label('forma'),
    area: val('area'), areaLabel: label('area'), grande: val('grande'), grandeLabel: label('grande'),
    valor: val('valor'), valorLabel: label('valor'), impacto: val('impacto'), impactoLabel: label('impacto'),
    alternativa: val('alternativa'), alternativaLabel: label('alternativa'), especial: val('especial'), especialLabel: label('especial'),
    conclusaoLabel: label('conclusao'), executor: val('executor'), executorLabel: label('executor'),
    intervencaoAutorizada: intervencaoAutorizada(), intervencaoAutorizadaLabel: label('intervencao-autorizada'),
    destinacaoLabel: ({ requerente: 'Requerente', codema: 'CODEMA', obras: 'Secretaria de Obras', planejamento: 'Secretaria de Planejamento' })[getDestinacaoTipo() || existing.destinacaoTipo] || '',
    numeroOficio: val('num-oficio'), destinatarioFormal: val('destinatario-formal')
  };
}

function setProcessAutosaveStatus(message, state = '') {
  const status = $('autosave-status');
  if (!status) return;
  status.textContent = message;
  const bar = status.closest('.autosave-bar');
  if (bar) bar.className = `autosave-bar${state ? ` is-${state}` : ''}`;
}

function activeProcessFormStage() {
  return document.querySelector('.step.active')?.dataset.tab || 'requerimento';
}

function processStatusFromForm(existing, stage, validInspection) {
  const current = statusForSheet(existing.situacao || '');
  if (val('saida') && decisaoAutoriza() && !exigeCompensacao()) return situacaoDoParecer();
  if (stage === 'compensacao') return statusForSheet(val('situacao') || current || 'Aguardando Compensação');
  if ((stage === 'parecer' || stage === 'compensacao') && val('saida')) {
    return situacaoDoParecer(getDestinacaoTipo());
  }
  if (current && current !== 'Aguardando Vistoria') return current;
  if (validInspection && stage !== 'requerimento') return 'Parecer em Elaboração';
  return current || 'Aguardando Vistoria';
}

function collectProcessForAutosave() {
  const protocolo = val('processo').trim();
  if (!protocolo) return null;
  syncSpecies();
  const existing = processos.find(process =>
    (currentEditingProcessId && process.id === currentEditingProcessId) || process.protocolo === protocolo
  ) || {};
  const stage = activeProcessFormStage();
  const validInspection = trees.length > 0 && trees.every(tree => validCoordinatePair(tree.latitude, tree.longitude));
  const destination = getDestinacaoTipo() || existing.destinacaoTipo || 'requerente';
  const compensation = calculateCompensation();
  const now = new Date().toISOString();
  return {
    ...existing,
    id: existing.id || currentEditingProcessId || `PROC-${Date.now()}`,
    protocolo,
    data: val('data-cadastro') || existing.dataCadastro || existing.data || now.slice(0, 10),
    requerente: val('requerente'),
    telefone: val('telefone') || existing.telefone || '',
    solicitacaoRequerente: val('requerente-solicita'),
    endereco: val('local'),
    intervencao: val('intervencao'),
    intervencaoLabel: label('intervencao'),
    quantidade: trees.length,
    finalidade: val('finalidade') === 'outro' ? val('finalidade-outro-detalhe') : label('finalidade'),
    finalidadeVal: val('finalidade'),
    finalidadeOutroDetalhe: val('finalidade-outro-detalhe'),
    situacao: processStatusFromForm(existing, stage, validInspection),
    destinacaoTipo: destination,
    conclusao: val('conclusao'),
    diagnostico: val('diagnostico'),
    coordenadas: {
      lat: trees[0]?.latitude || val('geo-lat') || val('coord-corte-1'),
      lng: trees[0]?.longitude || val('geo-lng') || val('coord-corte-2')
    },
    trees: JSON.parse(JSON.stringify(trees)),
    vistoriaInLoco: existing.vistoriaInLoco || (stage !== 'requerimento' && validInspection),
    vistoriaRealizadaEm: existing.vistoriaRealizadaEm || (stage !== 'requerimento' && validInspection ? now : ''),
    responsavelCorte: val('responsavel-corte'),
    autorizacao: val('autorizacao'),
    dataAutorizacao: val('data-autorizacao'),
    formaCompensacao: val('forma'),
    compensacao: compensation.text,
    prazo: val('prazo'),
    coordComp1: val('coord-comp-1'),
    coordComp2: val('coord-comp-2'),
    parecerTexto: val('saida') || existing.parecerTexto || '',
    updatedAt: now,
    ...processTrackingFields(existing),
    syncStatus: 'pending'
  };
}

function scheduleProcessAutoSync(snapshot) {
  clearTimeout(processAutoSyncTimer);
  if (!navigator.onLine) {
    setProcessAutosaveStatus('Salvo neste aparelho; envio pendente por falta de internet.', 'pending');
    return;
  }
  processAutoSyncTimer = setTimeout(async () => {
    try {
      setProcessAutosaveStatus('Salvo neste aparelho · sincronizando planilhas…', 'saving');
      const syncKey = String(snapshot.protocolo || snapshot.id || '');
      while (processSyncByProtocol.has(syncKey)) await processSyncByProtocol.get(syncKey);
      const currentBeforeSync = processos.find(process => process.id === snapshot.id);
      if (!currentBeforeSync || currentBeforeSync.updatedAt !== snapshot.updatedAt) return;
      const result = await syncNewProcessoVistoria(snapshot, { silent: true });
      const current = processos.find(process => process.id === snapshot.id);
      if (!current || current.updatedAt !== snapshot.updatedAt) return;
      Object.assign(current, snapshot);
      await saveProcessos();
      if (result.processSynced && result.inventoryErrors.length === 0) {
        setProcessAutosaveStatus('Tudo salvo e sincronizado.', 'saved');
      } else {
        const detail = result.inventoryErrors?.length
          ? result.inventoryErrors.join(' · ')
          : (result.processError || 'a planilha não confirmou o envio');
        setProcessAutosaveStatus(`Salvo neste aparelho; pendente: ${detail}`, 'pending');
      }
    } catch (error) {
      console.warn('[vistoria] Sincronização automática:', error.message);
      setProcessAutosaveStatus(`Salvo neste aparelho; pendente: ${error.message}`, 'pending');
    }
  }, 2500);
}

async function performProcessAutosave() {
  const process = collectProcessForAutosave();
  if (!process) {
    setProcessAutosaveStatus('Informe o número do processo para começar.');
    return;
  }
  setProcessAutosaveStatus('Salvando alterações…', 'saving');
  const saved = upsertLocalProcess(process);
  currentEditingProcessId = saved.id;
  const stored = await saveProcessos();
  if (!stored) {
    setProcessAutosaveStatus('Não foi possível salvar neste aparelho.', 'error');
    return;
  }
  setProcessAutosaveStatus('Salvo neste aparelho.', 'saved');
  scheduleProcessAutoSync(JSON.parse(JSON.stringify(saved)));
}

function scheduleProcessAutosave() {
  clearTimeout(processAutosaveTimer);
  clearTimeout(processAutoSyncTimer);
  if (!val('processo').trim()) {
    setProcessAutosaveStatus('Informe o número do processo para começar.');
    return;
  }
  setProcessAutosaveStatus('Alterações pendentes…', 'pending');
  processAutosaveTimer = setTimeout(() => {
    processAutosaveChain = processAutosaveChain
      .then(performProcessAutosave)
      .catch(error => {
        console.error('[vistoria] Salvamento automático:', error);
        setProcessAutosaveStatus('Não foi possível salvar automaticamente.', 'error');
      });
  }, 600);
}

// ── Configuração do Seletor de Destinação (Parecer vs Ofício) ────────────────
function setupDestinacaoEvents() {
  const select = $('destinacao-tipo');
  const numOficioWrap = $('num-oficio-wrap');
  const destFormal = $('destinatario-formal');
  const numOficio = $('num-oficio');

  function updateDestUI() {
    const chosen = getDestinacaoTipo();
    if (chosen === 'requerente') {
      if (numOficioWrap) numOficioWrap.hidden = true;
      if (destFormal) destFormal.value = val('requerente');
    } else if (chosen === 'codema') {
      if (numOficioWrap) numOficioWrap.hidden = false;
      if (destFormal) destFormal.value = 'Ao Conselho Municipal de Conservação e Defesa do Meio Ambiente - CODEMA';
      if (numOficio && !numOficio.value) numOficio.value = `___/${new Date().getFullYear()} - DMA/SPUMA`;
    } else if (chosen === 'obras') {
      if (numOficioWrap) numOficioWrap.hidden = false;
      if (destFormal) destFormal.value = 'À Secretaria Municipal de Obras e Serviços Públicos';
      if (numOficio && !numOficio.value) numOficio.value = `___/${new Date().getFullYear()} - DMA/SPUMA`;
    } else if (chosen === 'planejamento') {
      if (numOficioWrap) numOficioWrap.hidden = false;
      if (destFormal) destFormal.value = 'À Secretaria Municipal de Planejamento Urbano e Meio Ambiente';
      if (numOficio && !numOficio.value) numOficio.value = `___/${new Date().getFullYear()} - DMA`;
    }
    const docEl = $('documento');
    if (docEl && !docEl.hidden) {
      generate();
    }
  }

  select?.addEventListener('change', updateDestUI);
  updateDestUI();
}

// ── Controle do Motivo "Outro" ──────────────────────────────────────────────
function setupMotivoEvents() {
  const finSelect = $('finalidade');
  const outroWrap = $('finalidade-outro-wrap');
  if (finSelect && outroWrap) {
    const checkOutro = () => {
      outroWrap.hidden = (finSelect.value !== 'outro');
    };
    finSelect.addEventListener('change', checkOutro);
    checkOutro();
  }
}

// ── Persistência Permanente da Chave Pl@ntNet ───────────────────────────────
async function savePlantNetKey() {
  const key = val('plantnet-key');
  const btn = $('save-key');
  if (!key) {
    alert('Digite a chave da API do Pl@ntNet para salvá-la.');
    return;
  }
  localStorage.setItem('plantnetApiKey', key);
  try {
    const res = await fetch('/api/config/save-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key })
    });
    const d = await res.json();
    if (d.ok) {
      if (btn) {
        btn.textContent = '✓ Chave salva permanentemente!';
        btn.classList.add('btn-ok');
      }
    }
  } catch {
    if (btn) btn.textContent = '✓ Salva no navegador';
  }
  setTimeout(() => {
    if (btn) {
      btn.textContent = 'Salvar chave';
      btn.classList.remove('btn-ok');
    }
  }, 2500);
}

async function syncProcessStatus(processo, situacao, compensacao) {
  const response = await fetch('/api/process-status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      protocolo: processo.protocolo,
      situacao,
      compensacao: compensacao || processo.compensacao || '',
      formaCompensacao: processo.formaCompensacao || '',
      formaCompensacaoLabel: processo.formaCompensacaoLabel || '',
      dataCompensacao: processo.dataCompensacao || '',
      dataEncaminhamento: processo.dataEncaminhamento || '',
      process: remoteProcessCopy(processo)
    })
  });
  const data = await response.json();
  if (!response.ok || !data.ok) throw new Error(data.error || 'Não foi possível atualizar a planilha');
  return data;
}

async function confirmCompensacao(procId) {
  const p = processos.find(x => x.id === procId);
  if (!p) return;
  if (!confirm(`Confirmar que a compensação do processo nº ${p.protocolo} foi cumprida?`)) return;

  const dataConfirmacaoIso = new Date().toISOString().slice(0, 10);
  const dataConfirmacao = isoToBr(dataConfirmacaoIso);
  const compensacao = p.compensacao
    ? `${p.compensacao} — Cumprimento confirmado em ${dataConfirmacao}`
    : `Compensação cumprida em ${dataConfirmacao}`;
  try {
    const updatedProcess = { ...p, situacao: 'Compensado', compensacao, dataCompensacao: dataConfirmacaoIso, compensacaoConfirmadaEm: dataConfirmacao, updatedAt: new Date().toISOString() };
    await syncProcessStatus(updatedProcess, 'Compensado', compensacao);
    Object.assign(p, updatedProcess);
  await saveProcessos();
    alert(`✓ Compensação do processo nº ${p.protocolo} confirmada na planilha.`);
  } catch (error) {
    alert(`Não foi possível confirmar a compensação: ${error.message}`);
  }
}
function viewProcessoParecer(procId) {
  const p = processos.find(x => x.id === procId);
  if (!p) return;
  currentViewingProcessId = procId;

  const modal = $('modal-processo');
  if (!modal) return;

  const hasParecer = Boolean(String(p.parecerTexto || '').trim());
  const sheetStatus = statusForProcess(p);
  $('modal-processo-badge').textContent = `Proc. nº ${p.protocolo}`;
  $('modal-processo-titulo').textContent = 'Detalhes do processo';
  const modalFiscal = processFiscal(p);
  $('modal-processo-sub').textContent = `${p.requerente || 'Requerente não informado'} · ${p.endereco || 'Endereço não informado'} · Fiscal: ${modalFiscal.nome || 'não atribuído'} (matrícula ${modalFiscal.matricula || '0'})`;
  $('modal-resumo-situacao').textContent = sheetStatus;
  $('modal-resumo-objeto').textContent = p.intervencaoLabel || p.intervencao || 'Não informado';
  const resultLabels = { deferir: 'Autorizado', indeferir: 'Não autorizado', diligencia: 'Diligência necessária', condicionado: 'Aprovado com condicionante' };
  $('modal-resumo-conclusao').textContent = resultLabels[p.conclusao] || 'Ainda não definido';
  $('modal-resumo-compensacao').textContent = p.compensacao || 'Não informada';
  const compCard = $('modal-resumo-compensacao-card');
  const intervencaoDecidida = p.intervencaoAutorizada || (['poda', 'podadrastica'].includes(p.intervencao) ? 'poda' : 'corte');
  if (compCard) compCard.hidden = !decisaoAutoriza(p.conclusao) || intervencaoDecidida === 'poda' || p.formaCompensacao === 'naoaplica';
  $('modal-parecer-aviso').textContent = hasParecer ? 'Documento técnico salvo.' : 'Documento técnico pendente.';
  $('modal-parecer-texto').value = hasParecer ? p.parecerTexto : '';
  $('modal-parecer-texto').hidden = !hasParecer;
  $('modal-parecer-vazio').hidden = hasParecer;
  $('modal-btn-copiar').disabled = !hasParecer;
  $('modal-btn-imprimir').disabled = !hasParecer;
  $('modal-status-select').value = sheetStatus;
  $('modal-status-feedback').textContent = '';

  const treeInfo = $('modal-tree-info');
  if (treeInfo) {
    if (p.arvoreInventarioId) {
      treeInfo.hidden = false;
      treeInfo.innerHTML = `
        <div class="tree-badge-link" style="margin-bottom: 12px;">
          <span>🌳</span>
          <span>Vinculado à <b>Árvore #${esc(p.arvoreInventarioId)}</b> (${esc(p.arvoreInventarioNome || 'sem identificação')}) do Inventário Municipal</span>
        </div>
      `;
    } else {
      treeInfo.hidden = true;
    }
  }

  modal.showModal();
  const mapDetails = $('modal-process-map-section');
  if (mapDetails) mapDetails.open = false;
  const parecerDetails = modal.querySelector('.parecer-viewer');
  if (parecerDetails) parecerDetails.open = false;
  renderModalProcessMap(p);
  setTimeout(() => modalProcessMap?.invalidateSize(), 120);
}

function openStatusModal(procId) {
  viewProcessoParecer(procId);
  setTimeout(() => $('modal-status-select')?.focus(), 80);
}

function continueViewingProcess() {
  const id = currentViewingProcessId;
  $('modal-processo')?.close();
  if (id) resumeProcesso(id);
}

async function updateViewingProcessStatus() {
  if (!currentViewingProcessId) return;
  const p = processos.find(x => x.id === currentViewingProcessId);
  if (!p) return;

  const newStatus = val('modal-status-select');
  const feedback = $('modal-status-feedback');
  const button = $('modal-status-save');
  if (!SHEET_PROCESS_STATUSES.includes(newStatus)) {
    if (feedback) feedback.textContent = 'Selecione um andamento válido.';
    return;
  }

  if (button) button.disabled = true;
  if (feedback) {
    feedback.textContent = 'Salvando na planilha...';
    feedback.className = 'status-feedback text-muted';
  }
  try {
    const sentStatuses = ['Enviado para Deliberação do CODEMA', 'Encaminhado para Corte pela Secretaria de Obras', 'Encaminhado para a Secretaria de Planejamento'];
    const updatedProcess = { ...p, situacao: newStatus, updatedAt: new Date().toISOString() };
    if (sentStatuses.includes(newStatus) && !updatedProcess.dataEncaminhamento) updatedProcess.dataEncaminhamento = new Date().toISOString().slice(0, 10);
    await syncProcessStatus(updatedProcess, newStatus, p.compensacao);
    Object.assign(p, updatedProcess);
  await saveProcessos();
    $('modal-resumo-situacao').textContent = newStatus;
    if (feedback) {
      feedback.textContent = 'Andamento salvo na planilha.';
      feedback.className = 'status-feedback text-success';
    }
  } catch (error) {
    if (feedback) {
      feedback.textContent = `Não foi possível salvar: ${error.message}`;
      feedback.className = 'status-feedback text-danger';
    }
  } finally {
    if (button) button.disabled = false;
  }
}
function deleteProcesso(procId) {
  const p = processos.find(x => x.id === procId);
  if (!p) return;
  if (confirm(`Tem certeza que deseja excluir o processo nº ${p.protocolo}?`)) {
    processos = processos.filter(x => x.id !== procId);
    saveProcessos();
  }
}

// Alternância entre visão de Processos e Nova Solicitação
function switchMainView(viewName) {
  const tabProc = $('view-tab-processos');
  const tabNovo = $('view-tab-novo');
  const viewProc = $('view-processos');
  const viewNovo = $('view-novo');

  if (viewName === 'processos') {
    tabProc?.classList.add('active');
    tabProc?.setAttribute('aria-selected', 'true');
    tabNovo?.classList.remove('active');
    tabNovo?.setAttribute('aria-selected', 'false');

    if (viewProc) viewProc.hidden = false;
    if (viewNovo) viewNovo.hidden = true;
    renderProcessos();
  } else {
    tabNovo?.classList.add('active');
    tabNovo?.setAttribute('aria-selected', 'true');
    tabProc?.classList.remove('active');
    tabProc?.setAttribute('aria-selected', 'false');

    if (viewProc) viewProc.hidden = true;
    if (viewNovo) viewNovo.hidden = false;
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Parâmetros de URL (Deep Linking)
function checkUrlDeepLink() {
  const params = new URLSearchParams(window.location.search);
  const treeId = params.get('tree_id') || params.get('arvore_id');
  const lat = params.get('lat');
  const lng = params.get('lng');
  const view = params.get('view');

  if (view === 'novo' || treeId || lat) {
    switchMainView('novo');
  }

  if (lat && lng) {
    if ($('geo-lat')) $('geo-lat').value = lat;
    if ($('geo-lng')) $('geo-lng').value = lng;
    initOrUpdateMiniMap(lat, lng, 'Local informado por link');
  }

  if (treeId && inventoryTrees.length) {
    const tr = inventoryTrees.find(x => String(x.id) === String(treeId));
    if (tr) linkInventoryTree(tr);
  }
}

// Inicialização dos eventos da aplicação
function init() {
  compactLegacyInventoryCache();
  setupCaseNormalization();
  $('view-novo')?.addEventListener('input', event => {
    if (event.target?.id !== 'saida') parecerNeedsRegeneration = true;
    scheduleProcessAutosave();
  }, true);
  $('view-novo')?.addEventListener('change', event => {
    if (event.target?.id !== 'saida') parecerNeedsRegeneration = true;
    scheduleProcessAutosave();
  }, true);
  const qtdInput = $('quantidade');
  if (qtdInput) {
    qtdInput.addEventListener('change', () => renderAll(true));
  }

  document.querySelectorAll('.step').forEach(b => {
    b.addEventListener('click', () => showTab(b.dataset.tab));
  });

  document.querySelectorAll('[data-go]').forEach(b => {
    b.addEventListener('click', () => showTab(b.dataset.go));
  });

  // Alternância de visão principal
  $('view-tab-processos')?.addEventListener('click', () => switchMainView('processos'));
  $('view-tab-novo')?.addEventListener('click', () => switchMainView('novo'));
  $('btn-novo-processo')?.addEventListener('click', () => {
    currentEditingProcessId = null;
    setProcessAutosaveStatus('Informe o número do processo para começar.');
    switchMainView('novo');
  });
  $('btn-sync-processos')?.addEventListener('click', () => syncPendingProcesses({ feedback: true }));

  // Fiscal e Configurações
  $('btn-save-fiscal')?.addEventListener('click', saveFiscalData);
  $('btn-new-fiscal')?.addEventListener('click', startNewFiscal);
  loadFiscalData();
  $('fiscal-selector')?.addEventListener('change', event => {
    const fiscal = fiscalProfiles.find(item => fiscalKey(item) === event.target.value);
    if (!fiscal) return;
    fillFiscalFields(fiscal);
    localStorage.setItem(SELECTED_FISCAL_KEY, event.target.value);
    selectedProcessFiscalFilter = event.target.value;
    localStorage.setItem(PROCESS_FISCAL_FILTER_KEY, selectedProcessFiscalFilter);
    if ($('process-fiscal-filter')) $('process-fiscal-filter').value = selectedProcessFiscalFilter;
    updateProcessosBadge();
    renderProcessos();
  });
  $('process-fiscal-filter')?.addEventListener('change', event => {
    selectedProcessFiscalFilter = event.target.value;
    localStorage.setItem(PROCESS_FISCAL_FILTER_KEY, selectedProcessFiscalFilter);
    if (!['__all__', '__unassigned__'].includes(selectedProcessFiscalFilter)) {
      const fiscal = fiscalProfiles.find(item => fiscalKey(item) === selectedProcessFiscalFilter);
      if (fiscal && $('fiscal-selector')) {
        $('fiscal-selector').value = selectedProcessFiscalFilter;
        fillFiscalFields(fiscal);
        localStorage.setItem(SELECTED_FISCAL_KEY, selectedProcessFiscalFilter);
      }
    }
    updateProcessosBadge();
    renderProcessos();
  });
  setupDestinacaoEvents();
  setupMotivoEvents();
  syncDecisionControls();

  // GPS & Inventário
  $('btn-get-gps')?.addEventListener('click', captureGPS);
  $('btn-search-inventory')?.addEventListener('click', openInventorySearchModal);
  $('modal-inventory-close')?.addEventListener('click', closeInventorySearchModal);
  $('inventory-search-input')?.addEventListener('input', e => filterInventoryCatalog(e.target.value));

  // Disparadores dinâmicos do Match Inteligente e do Mini Mapa
  const onCoordChange = () => {
    if ($('location-source')) $('location-source').textContent = 'Entrada manual';
    detectInventoryMatch();
    const lat = val('geo-lat');
    const lng = val('geo-lng');
    if (lat && lng) {
      initOrUpdateMiniMap(lat, lng, val('local') || 'Árvore em vistoria');
    }
  };

  $('geo-lat')?.addEventListener('input', onCoordChange);
  $('geo-lng')?.addEventListener('input', onCoordChange);
  $('local')?.addEventListener('input', detectInventoryMatch);

  // Botão recentralizar mini mapa
  $('btn-recenter-mini-map')?.addEventListener('click', () => {
    const lat = val('geo-lat');
    const lng = val('geo-lng');
    if (lat && lng) {
      initOrUpdateMiniMap(lat, lng, val('local') || 'Árvore em vistoria');
    }
  });

  // Filtros de processos
  $('btn-refresh-processos')?.addEventListener('click', async event => {
    const button = event.currentTarget;
    const status = $('process-refresh-status');
    button.disabled = true;
    button.textContent = 'Atualizando...';
    if (status) status.textContent = 'Buscando os processos mais recentes.';
    try {
      const updated = await loadProcessos();
      if (!updated) throw new Error('a planilha não respondeu');
      const pending = processos.filter(isPendingInspection).length;
      if (status) status.textContent = `${processos.length} processos carregados. ${pending} aguardando vistoria.`;
    } catch (error) {
      if (status) status.textContent = `Não foi possível atualizar: ${error.message}`;
    } finally {
      button.disabled = false;
      button.textContent = 'Atualizar planilha';
    }
  });
  $('processos-search')?.addEventListener('input', e => {
    activeProcessSearch = e.target.value;
    renderProcessos();
  });

  document.querySelectorAll('.filter-pill').forEach(btn => {
    btn.setAttribute('aria-pressed', btn.classList.contains('active') ? 'true' : 'false');
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-pill').forEach(p => {
        p.classList.remove('active');
        p.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
      activeProcessFilter = btn.dataset.filter;
      renderProcessos();
    });
  });

  // Modais de parecer e status
  $('modal-processo-close')?.addEventListener('click', () => $('modal-processo')?.close());
  $('modal-process-map-section')?.addEventListener('toggle', event => {
    if (event.currentTarget.open) setTimeout(() => modalProcessMap?.invalidateSize(), 0);
  });
  $('modal-status-save')?.addEventListener('click', updateViewingProcessStatus);
  $('modal-btn-copiar')?.addEventListener('click', async () => {
    const txt = $('modal-parecer-texto')?.value;
    if (txt) {
      await navigator.clipboard.writeText(txt);
      alert('✓ Parecer copiado para a área de transferência!');
    }
  });
  $('modal-btn-imprimir')?.addEventListener('click', () => window.print());

  const watchIds = [
    'area', 'grande', 'valor', 'impacto', 'alternativa',
    'especial', 'conclusao', 'forma', 'proprio', 'executor',
    'intervencao', 'intervencao-autorizada', 'finalidade'
  ];
  $('intervencao')?.addEventListener('change', () => {
    const autorizada = $('intervencao-autorizada');
    if (autorizada && decisaoAutoriza()) autorizada.value = ['poda', 'podadrastica'].includes(val('intervencao')) ? 'poda' : 'corte';
  });
  const today = new Date().toISOString().slice(0, 10);
  if ($('data-cadastro') && !$('data-cadastro').value) $('data-cadastro').value = today;
  watchIds.forEach(id => {
    const el = $(id);
    if (el) el.addEventListener('change', update);
  });

  const gerarBtn = $('gerar');
  if (gerarBtn) gerarBtn.addEventListener('click', generate);

  const copiarBtn = $('copiar');
  if (copiarBtn) {
    copiarBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(val('saida'));
        copiarBtn.textContent = '✓ Texto copiado!';
        setTimeout(() => { copiarBtn.textContent = 'Copiar texto'; }, 2500);
      } catch {
        copiarBtn.textContent = 'Selecione e copie manualmente';
      }
    });
  }

  const baixarBtn = $('baixar');
  if (baixarBtn) baixarBtn.addEventListener('click', downloadTxt);

  const imprimirBtn = $('imprimir');
  if (imprimirBtn) imprimirBtn.addEventListener('click', () => {
    renderOfficialDocument();
    window.print();
  });
  saida?.addEventListener('input', e => renderOfficialDocument(e.target.value));

  const saveKeyBtn = $('save-key');
  if (saveKeyBtn) saveKeyBtn.addEventListener('click', savePlantNetKey);

  // Preenche dados padrão
  const pk = $('plantnet-key');
  const storedKey = localStorage.getItem('plantnetApiKey') || '';
  if (pk && storedKey) pk.value = storedKey;

  const sw = $('sheet-webhook');
  if (sw) sw.value = localStorage.getItem('sheetWebhook') || '';

  const todayIso = new Date().toISOString().slice(0, 10);
  const sheetData = $('sheet-data');
  if (sheetData) sheetData.value = todayIso;

  const dataAut = $('data-autorizacao');
  if (dataAut) dataAut.value = todayIso;

  const defaultPrazo = new Date();
  defaultPrazo.setDate(defaultPrazo.getDate() + 60);
  const prazoEl = $('prazo');
  if (prazoEl) prazoEl.value = defaultPrazo.toISOString().slice(0, 10);

  // Consulta configuração de chave no servidor local (mantém chave salva sem limpar o campo)
  fetch('/api/config')
    .then(r => r.json())
    .then(c => {
      if (c.plantnetConfigured && pk) {
        if (!pk.value && c.key) pk.value = c.key;
        pk.placeholder = 'Chave ativa no servidor local (.env)';
        if (saveKeyBtn) saveKeyBtn.title = 'Chave salva e ativa no servidor';
      }
      if (c.sheetsWebhookUrl) {
        if (sw && !sw.value) sw.value = c.sheetsWebhookUrl;
        if (!localStorage.getItem('sheetWebhook')) {
          localStorage.setItem('sheetWebhook', c.sheetsWebhookUrl);
        }
        if (!localStorage.getItem('mapaWebhookUrl')) {
          localStorage.setItem('mapaWebhookUrl', c.sheetsWebhookUrl);
        }
      }
    })
    .catch(() => {});

  renderAll(false);
  loadProcessos();
  loadInventoryTrees().then(checkUrlDeepLink);
}



const WATER_STORAGE_KEY = 'ambiental_water_records';
let WATER_POINTS = [
  {id:1,district:'Andradas',type:'Água Bruta',location:'UBS',coordinates:'-22.070994, -46.573896'},
  {id:2,district:'Campestrinho',type:'Água Bruta',location:'Reservatório 01',coordinates:'-22.134108, -46.449506'},
  {id:3,district:'Gramínea',type:'Rede de Distribuição',location:'UBS',coordinates:'-22.168785, -46.624831'},
  {id:4,district:'Gramínea',type:'Água Bruta',location:'Poço 1',coordinates:'-22.171733, -46.628283'},
  {id:5,district:'Gramínea',type:'Água Bruta',location:'Reservatório 01',coordinates:'-22.171567, -46.628311'},
  {id:6,district:'Campestrinho',type:'Água Bruta',location:'Reservatório 01',coordinates:'-22.143812, -46.452566'},
  {id:7,district:'Gramínea',type:'Água Bruta',location:'Nascente 01',coordinates:'-22.171586, -46.628294'},
  {id:8,district:'Campestrinho',type:'Água Bruta',location:'Reservatório 01',coordinates:'-22.143745, -46.452553'},
  {id:9,district:'Campestrinho',type:'Água Bruta',location:'Reservatório 02',coordinates:'-22.143561, -46.452507'},
  {id:800,district:'Gramínea',type:'Água Bruta',location:'Poço 2 , Reservatório 02',coordinates:'-22.172614, -46.624240'},
  {id:10,district:'Campestrinho',type:'Rede de Distribuição',location:'UBS',coordinates:'-22.143395, -46.452899'},
  {id:11,district:'Campestrinho',type:'Rede de Distribuição',location:'Escola',coordinates:'-22.143530, -46.452326'},
  {id:12,district:'Gramínea',type:'Rede de Distribuição',location:'Escola',coordinates:'-22.169769, -46.626959'},
  {id:99,district:'Campestrinho',type:'Rede de Distribuição',location:'Casa',coordinates:'-22.141824, -46.453999'},
  {id:88,district:'Campestrinho',type:'Rede de Distribuição',location:'Casa',coordinates:'-22.142111, -46.450890'},
  {id:996,district:'Campestrinho',type:'Rede de Distribuição',location:'Casa 2',coordinates:'-22.142112, -46.450921'},
  {id:8558,district:'Campestrinho',type:'Rede de Distribuição',location:'Casa 3',coordinates:'-22.141921, -46.453875'}
];
function getWaterRecords(){try{return JSON.parse(localStorage.getItem(WATER_STORAGE_KEY)||'[]')}catch{return []}}
function legacy_openWaterModule(){if($('view-home'))$('view-home').hidden=true;if($('environment-module'))$('environment-module').hidden=true;if($('view-water'))$('view-water').hidden=false;renderWaterRecords();window.scrollTo({top:0,behavior:'smooth'})}
function closeWaterModule(){if($('view-water'))$('view-water').hidden=true;showMunicipalHome()}
function refreshWaterLocations(){const district=val('water-district'),type=val('water-point-type'),select=$('water-location');if(!select)return;const points=WATER_POINTS.filter(p=>(!district||p.district===district)&&(!type||p.type===type));select.innerHTML='<option value="">Selecione</option>'+points.map(p=>`<option value="${p.id}">${esc(p.location)} · #${p.id}</option>`).join('');if($('water-coordinates'))$('water-coordinates').value=''}
function waterNumber(id){const raw=val(id).replace(',','.');return raw===''?null:Number(raw)}
function legacy_saveWaterRecord(event){event.preventDefault();const point=WATER_POINTS.find(p=>String(p.id)===val('water-location'));if(!point){alert('Selecione um ponto de coleta cadastrado.');return}const records=getWaterRecords();const record={localId:`water-${Date.now()}`,sheetId:null,syncStatus:'local',date:val('water-date'),district:val('water-district'),pointType:val('water-point-type'),location:point.location,pointId:point.id,coordinates:point.coordinates,chlorinator:val('water-chlorinator'),turbidity:waterNumber('water-turbidity'),color:waterNumber('water-color'),chlorine:waterNumber('water-chlorine'),ph:waterNumber('water-ph'),sdt:waterNumber('water-sdt'),temperature:waterNumber('water-temperature'),createdAt:new Date().toISOString()};records.unshift(record);localStorage.setItem(WATER_STORAGE_KEY,JSON.stringify(records));event.target.reset();$('water-date').value=new Date().toISOString().slice(0,10);refreshWaterLocations();$('water-save-status').textContent='Coleta salva neste aparelho.';renderWaterRecords();setTimeout(()=>{if($('water-save-status'))$('water-save-status').textContent=''},3500)}
function formatWaterValue(value,unit){return value==null?'—':`${Number(value).toLocaleString('pt-BR')} ${unit}`}
function legacy_renderWaterRecords(){const records=getWaterRecords(),box=$('water-records');if($('water-pending-count'))$('water-pending-count').textContent=`${records.length} registro${records.length===1?'':'s'} local${records.length===1?'':'is'}`;if(!box)return;if(!records.length){box.innerHTML='<div class="water-empty">Nenhuma coleta salva neste aparelho.</div>';return}box.innerHTML=records.map(r=>`<article class="water-record"><div><strong>${new Date(r.date+'T12:00:00').toLocaleDateString('pt-BR')}</strong><small>#${esc(r.pointId)}</small></div><div><strong>${esc(r.district)} · ${esc(r.location)}</strong><small>${esc(r.pointType)}${r.chlorinator?' · '+esc(r.chlorinator):''}</small></div><div class="water-values">Turbidez ${formatWaterValue(r.turbidity,'uT')} · Cor ${formatWaterValue(r.color,'uC')} · Cloro ${formatWaterValue(r.chlorine,'mg/L')}</div><button type="button" data-water-delete="${esc(r.localId)}" aria-label="Excluir registro">Excluir</button></article>`).join('');box.querySelectorAll('[data-water-delete]').forEach(button=>button.addEventListener('click',()=>deleteWaterRecord(button.dataset.waterDelete)))}
function deleteWaterRecord(id){if(!confirm('Excluir esta coleta salva no aparelho?'))return;localStorage.setItem(WATER_STORAGE_KEY,JSON.stringify(getWaterRecords().filter(r=>r.localId!==id)));renderWaterRecords()}
function legacy_exportWaterCsv(){const records=getWaterRecords();if(!records.length){alert('Não há registros locais para exportar.');return}const headers=['ID','Data','Distrito','Ponto','Local da Coleta','Clorador','Turbidez (uT)','Cor (uC)','Cloro Residual (mg/L)','pH','SDT (mV)','Temperatura (°C)'];const rows=records.map((r,i)=>[r.sheetId||i+1,r.date,r.district,r.pointType,r.location,r.chlorinator,r.turbidity,r.color,r.chlorine,r.ph,r.sdt,r.temperature]);const csv=[headers,...rows].map(row=>row.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(';')).join('\r\n');const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`analises-agua-${new Date().toISOString().slice(0,10)}.csv`;a.click();URL.revokeObjectURL(url)}
function setupWaterModule(){$('water-back')?.addEventListener('click',closeWaterModule);$('water-form')?.addEventListener('submit',saveWaterRecord);$('water-district')?.addEventListener('change',refreshWaterLocations);$('water-point-type')?.addEventListener('change',refreshWaterLocations);$('water-location')?.addEventListener('change',()=>{const point=WATER_POINTS.find(p=>String(p.id)===val('water-location'));if($('water-coordinates'))$('water-coordinates').value=point?.coordinates||''});$('water-refresh')?.addEventListener('click',()=>loadWaterSheet(true));$('water-export')?.addEventListener('click',exportWaterCsv);$('water-dashboard-range')?.addEventListener('change',renderWaterDashboard);$('water-dashboard-district')?.addEventListener('change',renderWaterDashboard);if($('water-date'))$('water-date').value=new Date().toISOString().slice(0,10);renderWaterRecords()}

// Integracao online da planilha Controle de agua
const WATER_REMOTE_CACHE_KEY = 'ambiental_water_remote_cache';
let waterRemoteRecords = (() => { try { return JSON.parse(localStorage.getItem(WATER_REMOTE_CACHE_KEY) || '[]'); } catch { return []; } })();
function allWaterRecords(){
  return [...getWaterRecords(), ...waterRemoteRecords].sort((a, b) => {
    const dateDiff = String(b.date || '').localeCompare(String(a.date || ''));
    if (dateDiff) return dateDiff;
    return Number(b.sheetId || 0) - Number(a.sheetId || 0);
  });
}
async function loadWaterSheet(showFeedback = true){
  if (!navigator.onLine) { renderWaterRecords(); return; }
  if (showFeedback && $('water-save-status')) $('water-save-status').textContent = 'Consultando a planilha…';
  try {
    const response = await fetch('/api/water?refresh=' + Date.now(), { cache: 'no-store' });
    const result = await response.json();
    if (!response.ok || !result.ok) throw new Error(result.error || 'Falha ao consultar a planilha');
    waterRemoteRecords = Array.isArray(result.records) ? result.records : [];
    localStorage.setItem(WATER_REMOTE_CACHE_KEY, JSON.stringify(waterRemoteRecords));
    if (showFeedback && $('water-save-status')) $('water-save-status').textContent = `${waterRemoteRecords.length} registros carregados da planilha.`;
    renderWaterRecords();
  } catch (error) {
    if (showFeedback && $('water-save-status')) $('water-save-status').textContent = `Usando histórico offline: ${error.message}`;
    renderWaterRecords();
  }
}
async function sendWaterRecord(record){
  const response = await fetch('/api/water', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ ...record, clientId: record.clientId || record.localId }) });
  const result = await response.json();
  if (!response.ok || !result.ok) throw new Error(result.error || 'Não foi possível gravar na planilha');
  return result;
}
async function syncPendingWaterRecords(){
  if (!navigator.onLine) return;
  const pending = getWaterRecords();
  if (!pending.length) { await loadWaterSheet(false); return; }
  let remaining = [...pending], synced = 0;
  for (const record of pending) {
    try { await sendWaterRecord(record); remaining = remaining.filter(item => item.localId !== record.localId); localStorage.setItem(WATER_STORAGE_KEY, JSON.stringify(remaining)); synced++; }
    catch (error) { console.warn('[agua] Registro pendente:', error.message); break; }
  }
  await loadWaterSheet(false);
  if ($('water-save-status')) $('water-save-status').textContent = synced ? `${synced} coleta${synced===1?' sincronizada':'s sincronizadas'} com a planilha.` : 'Há registros aguardando sincronização.';
}
function openWaterModule(){
  if($('view-home'))$('view-home').hidden=true;if($('environment-module'))$('environment-module').hidden=true;if($('view-water'))$('view-water').hidden=false;
  renderWaterRecords(); loadWaterSheet(); if(navigator.onLine) syncPendingWaterRecords(); window.scrollTo({top:0,behavior:'smooth'});
}
async function saveWaterRecord(event){
  event.preventDefault(); const point=WATER_POINTS.find(p=>String(p.id)===val('water-location')); if(!point){alert('Selecione um ponto de coleta cadastrado.');return}
  const localId=`water-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
  const record={localId,clientId:localId,syncStatus:'pending',date:val('water-date'),district:val('water-district'),pointType:val('water-point-type'),location:point.location,pointId:point.id,coordinates:point.coordinates,chlorinator:val('water-chlorinator'),turbidity:waterNumber('water-turbidity'),color:waterNumber('water-color'),chlorine:waterNumber('water-chlorine'),ph:waterNumber('water-ph'),sdt:waterNumber('water-sdt'),temperature:waterNumber('water-temperature'),createdAt:new Date().toISOString()};
  const records=getWaterRecords(); records.unshift(record); localStorage.setItem(WATER_STORAGE_KEY,JSON.stringify(records));
  event.target.reset(); $('water-date').value=new Date().toISOString().slice(0,10); refreshWaterLocations(); renderWaterRecords();
  if(!navigator.onLine){$('water-save-status').textContent='Sem internet: coleta salva e aguardando sincronização.';return}
  $('water-save-status').textContent='Enviando para a planilha…'; await syncPendingWaterRecords();
}
const WATER_DASHBOARD_PARAMETERS = [
  { key:'turbidity', label:'Turbidez', unit:'uT', color:'#0ea5e9' },
  { key:'color', label:'Cor', unit:'uC', color:'#8b5cf6' },
  { key:'chlorine', label:'Cloro residual', unit:'mg/L', color:'#14b8a6' },
  { key:'ph', label:'pH', unit:'', color:'#f59e0b' },
  { key:'sdt', label:'SDT', unit:'mV', color:'#6366f1' },
  { key:'temperature', label:'Temperatura', unit:'°C', color:'#f97316' }
];
function waterDashboardRecords(){
  const range=$('water-dashboard-range')?.value||'90', district=$('water-dashboard-district')?.value||'all';
  const cutoff=range==='all'?null:new Date(Date.now()-Number(range)*86400000);
  return allWaterRecords().filter(record=>{
    const date=record.date?new Date(record.date+'T12:00:00'):null;
    return (!cutoff||(date&&!Number.isNaN(date.getTime())&&date>=cutoff))&&(district==='all'||record.district===district);
  }).sort((a,b)=>String(a.date||'').localeCompare(String(b.date||'')));
}
function formatDashboardNumber(value, digits=2){return new Intl.NumberFormat('pt-BR',{maximumFractionDigits:digits}).format(value)}
function dashboardSparkline(values,color,label){
  if(!values.length)return '<div class="water-chart-no-data">Sem medições no período</div>';
  const series=values.slice(-60), width=520, height=150, pad=12;
  let min=Math.min(...series),max=Math.max(...series);if(min===max){min-=.5;max+=.5}
  const points=series.map((value,index)=>{const x=pad+(index*(width-pad*2)/Math.max(series.length-1,1));const y=height-pad-((value-min)/(max-min))*(height-pad*2);return `${x.toFixed(1)},${y.toFixed(1)}`}).join(' ');
  const area=`${pad},${height-pad} ${points} ${width-pad},${height-pad}`;
  return `<svg class="water-sparkline" viewBox="0 0 ${width} ${height}" role="img" aria-label="Variação de ${esc(label)}"><line x1="${pad}" y1="${height-pad}" x2="${width-pad}" y2="${height-pad}" class="water-chart-axis"/><polygon points="${area}" fill="${color}" opacity=".09"/><polyline points="${points}" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>`;
}
function populateWaterDashboardDistricts(records){
  const select=$('water-dashboard-district');if(!select)return;const current=select.value;
  const districts=[...new Set(records.map(r=>String(r.district||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
  select.innerHTML='<option value="all">Todos os distritos</option>'+districts.map(d=>`<option value="${esc(d)}">${esc(d)}</option>`).join('');
  select.value=districts.includes(current)?current:'all';
}
function renderWaterDashboard(){
  const all=allWaterRecords();populateWaterDashboardDistricts(all);const records=waterDashboardRecords();
  const kpis=$('water-dashboard-kpis'),charts=$('water-dashboard-charts'),empty=$('water-dashboard-empty');if(!kpis||!charts||!empty)return;
  empty.hidden=records.length>0;kpis.hidden=!records.length;charts.hidden=!records.length;
  const rangeLabel=$('water-dashboard-range')?.selectedOptions[0]?.textContent||'Período';
  const districtLabel=$('water-dashboard-district')?.value==='all'?'todos os distritos':$('water-dashboard-district')?.selectedOptions[0]?.textContent;
  if($('water-dashboard-period'))$('water-dashboard-period').textContent=`${rangeLabel} · ${districtLabel}`;
  if(!records.length){kpis.innerHTML='';charts.innerHTML='';return}
  const latest=records[records.length-1],locations=new Set(records.map(r=>`${r.district}|${r.location}`)).size;
  const measured=records.reduce((sum,r)=>sum+WATER_DASHBOARD_PARAMETERS.filter(p=>r[p.key]!==null&&r[p.key]!==''&&Number.isFinite(Number(r[p.key]))).length,0);
  const completeness=Math.round(measured/(records.length*WATER_DASHBOARD_PARAMETERS.length)*100);
  kpis.innerHTML=`<article><small>Coletas</small><strong>${records.length}</strong><span>No período selecionado</span></article><article><small>Pontos monitorados</small><strong>${locations}</strong><span>Locais com registro</span></article><article><small>Última coleta</small><strong>${latest.date?new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short'}).format(new Date(latest.date+'T12:00:00')):'—'}</strong><span>${esc(latest.location||'Local não informado')}</span></article><article><small>Dados preenchidos</small><strong>${completeness}%</strong><span>Dos 6 parâmetros</span></article>`;
  charts.innerHTML=WATER_DASHBOARD_PARAMETERS.map(param=>{
    const samples=records.filter(r=>r[param.key]!==null&&r[param.key]!==''&&Number.isFinite(Number(r[param.key]))).map(r=>({date:r.date,value:Number(r[param.key])}));
    const values=samples.map(item=>item.value),first=values[0],last=values[values.length-1];
    const average=values.length?values.reduce((sum,value)=>sum+value,0)/values.length:null,delta=values.length>1?last-first:null;
    const trend=delta===null?'Sem comparação':Math.abs(delta)<.0001?'Estável':`${delta>0?'↑':'↓'} ${formatDashboardNumber(Math.abs(delta))} ${param.unit}`.trim();
    const trendClass=delta===null||Math.abs(delta)<.0001?'neutral':delta>0?'up':'down';
    const firstDate=samples[0]?.date?new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short'}).format(new Date(samples[0].date+'T12:00:00')):'—';
    const lastDate=samples.at(-1)?.date?new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short'}).format(new Date(samples.at(-1).date+'T12:00:00')):'—';
    return `<article class="water-chart-card"><header><div><small>${param.label}</small><strong>${last===undefined?'—':formatDashboardNumber(last)} <em>${param.unit}</em></strong></div><span class="water-trend ${trendClass}">${trend}</span></header>${dashboardSparkline(values,param.color,param.label)}<footer><span>${firstDate}</span><span>${values.length?`Média ${formatDashboardNumber(average)} ${param.unit}`:'Sem dados'}</span><span>${lastDate}</span></footer></article>`;
  }).join('');
}
function renderWaterRecords(){
  renderWaterDashboard();
  const pending=getWaterRecords(), records=allWaterRecords(), box=$('water-records');
  if($('water-pending-count'))$('water-pending-count').textContent=pending.length?`${pending.length} aguardando envio`:`${waterRemoteRecords.length} na planilha`;
  if(!box)return;if(!records.length){box.innerHTML='<div class="water-empty">Nenhuma coleta disponível neste aparelho.</div>';return}
  box.innerHTML=records.map(r=>`<article class="water-record"><div><strong>${r.date?new Date(r.date+'T12:00:00').toLocaleDateString('pt-BR'):'—'}</strong><small>#${esc(r.sheetId||r.pointId||'local')}</small></div><div><strong>${esc(r.district)} · ${esc(r.location)}</strong><small>${esc(r.pointType)}${r.chlorinator?' · '+esc(r.chlorinator):''} · ${r.syncStatus==='pending'?'Aguardando envio':'Na planilha'}</small></div><div class="water-values">Turbidez ${formatWaterValue(r.turbidity,'uT')} · Cor ${formatWaterValue(r.color,'uC')} · Cloro ${formatWaterValue(r.chlorine,'mg/L')}</div>${r.syncStatus==='pending'?`<button type="button" data-water-delete="${esc(r.localId)}" aria-label="Excluir registro">Excluir</button>`:'<span aria-hidden="true">✓</span>'}</article>`).join('');
  box.querySelectorAll('[data-water-delete]').forEach(button=>button.addEventListener('click',()=>deleteWaterRecord(button.dataset.waterDelete)));
}
function exportWaterCsv(){const records=allWaterRecords();if(!records.length){alert('Não há registros para exportar.');return}const headers=['ID','Data','Distrito','Ponto','Local da Coleta','Clorador','Turbidez (uT)','Cor (uC)','Cloro Residual (mg/L)','pH','SDT (mV)','Temperatura (°C)'];const rows=records.map((r,i)=>[r.sheetId||`LOCAL-${i+1}`,r.date,r.district,r.pointType,r.location,r.chlorinator,r.turbidity,r.color,r.chlorine,r.ph,r.sdt,r.temperature]);const csv=[headers,...rows].map(row=>row.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(';')).join('\r\n');const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`analises-agua-${new Date().toISOString().slice(0,10)}.csv`;a.click();URL.revokeObjectURL(url)}

// Consulta e manutencao da aba Pontos
const WATER_POINTS_CACHE_KEY = 'ambiental_water_points_cache';
async function loadWaterPoints(showFeedback = false){
  try{
    const response=await fetch('/api/water?resource=points&refresh='+Date.now(),{cache:'no-store'});const result=await response.json();if(!response.ok||!result.ok)throw new Error(result.error||'Falha ao consultar pontos');
    WATER_POINTS.splice(0,WATER_POINTS.length,...result.points);localStorage.setItem(WATER_POINTS_CACHE_KEY,JSON.stringify(result.points));refreshWaterLocations();renderWaterPoints();if(showFeedback&&$('water-point-status'))$('water-point-status').textContent=`${result.points.length} pontos carregados da planilha.`;
  }catch(error){try{const cached=JSON.parse(localStorage.getItem(WATER_POINTS_CACHE_KEY)||'[]');if(cached.length)WATER_POINTS.splice(0,WATER_POINTS.length,...cached)}catch{}renderWaterPoints();if(showFeedback&&$('water-point-status'))$('water-point-status').textContent='Usando cadastro offline: '+error.message;}
}
function renderWaterPoints(){const box=$('water-points-list');if(!box)return;const sorted=[...WATER_POINTS].sort((a,b)=>`${a.district} ${a.location}`.localeCompare(`${b.district} ${b.location}`,'pt-BR'));box.innerHTML=sorted.map(point=>`<article class="water-point-item"><div><strong>#${esc(point.id)} · ${esc(point.district)} · ${esc(point.location)}</strong><small>${esc(point.type)} · ${esc(point.coordinates||'Sem coordenadas')}${point.source?' · '+esc(point.source):''}</small></div><button type="button" data-edit-water-point="${esc(point.id)}">Editar</button></article>`).join('');box.querySelectorAll('[data-edit-water-point]').forEach(button=>button.addEventListener('click',()=>editWaterPoint(button.dataset.editWaterPoint)))}
function editWaterPoint(id){const point=WATER_POINTS.find(item=>String(item.id)===String(id));if(!point)return;$('water-point-id').value=point.id;$('water-point-district').value=point.district;$('water-point-kind').value=point.type;$('water-point-location').value=point.location;$('water-point-coordinates').value=point.coordinates;$('water-point-source').value=point.source||'';$('water-point-cancel').hidden=false;$('water-point-location').focus();}
function resetWaterPointForm(){$('water-point-form')?.reset();if($('water-point-id'))$('water-point-id').value='';if($('water-point-cancel'))$('water-point-cancel').hidden=true;}
async function saveWaterPoint(event){event.preventDefault();if(!navigator.onLine){$('water-point-status').textContent='É necessário estar online para alterar o cadastro de pontos.';return}const payload={action:'saveWaterPoint',id:val('water-point-id'),district:val('water-point-district'),type:val('water-point-kind'),location:val('water-point-location'),coordinates:val('water-point-coordinates'),source:val('water-point-source')};$('water-point-status').textContent='Salvando na planilha…';try{const response=await fetch('/api/water',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});const result=await response.json();if(!response.ok||!result.ok)throw new Error(result.error||'Não foi possível salvar');resetWaterPointForm();$('water-point-status').textContent=payload.id?'Ponto atualizado na planilha.':'Novo ponto cadastrado na planilha.';await loadWaterPoints(false)}catch(error){$('water-point-status').textContent='Erro: '+error.message}}
function setupWaterPointManager(){$('water-manage-points')?.addEventListener('click',()=>{$('water-points-panel').hidden=false;loadWaterPoints(true);$('water-points-panel').scrollIntoView({behavior:'smooth'})});$('water-points-close')?.addEventListener('click',()=>{$('water-points-panel').hidden=true;resetWaterPointForm()});$('water-point-cancel')?.addEventListener('click',resetWaterPointForm);$('water-point-form')?.addEventListener('submit',saveWaterPoint);loadWaterPoints(false)}
// Home municipal, conectividade e instalacao como aplicativo
let deferredInstallPrompt = null;
function showMunicipalHome() {
  const homeView = $('view-home');
  const moduleView = $('environment-module');
  if (homeView) homeView.hidden = false;
  if (moduleView) moduleView.hidden = true;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function openMunicipalModule(moduleName) {
  if (moduleName === 'agua') { openWaterModule(); return; }
  if (moduleName === 'vistoria') {
    if ($('view-home')) $('view-home').hidden = true;
    if ($('environment-module')) $('environment-module').hidden = false;
    switchMainView('processos');
    return;
  }
  if (moduleName === 'inventario') {
    if (!navigator.onLine) { alert('O catálogo disponível no aparelho será incorporado aqui na próxima etapa. No momento, o acesso completo ao Inventário precisa de internet.'); return; }
    window.location.assign('https://arvores-andradas.vercel.app');
    return;
  }
  alert('O módulo de Análise de Água está preparado na nova central e será a próxima planilha a ser transformada em formulário offline.');
}
function updateConnectionState() {
  const online = navigator.onLine;
  document.body.classList.toggle('offline', !online);
  $('connection-dot')?.classList.toggle('online', online);
  if ($('connection-label')) $('connection-label').textContent = online ? 'Conectado' : 'Modo offline ativo';
  if ($('connection-help')) $('connection-help').textContent = online ? 'Sincronização disponível' : 'Seus registros ficam neste aparelho';
}
function setupOfflineApp() {
  document.querySelectorAll('[data-module]').forEach(button => button.addEventListener('click', () => openMunicipalModule(button.dataset.module)));
  $('view-tab-home')?.addEventListener('click', showMunicipalHome);
  window.addEventListener('online', () => { updateConnectionState(); syncPendingProcesses({ feedback: true }); syncPendingWaterRecords(); });
  window.addEventListener('offline', updateConnectionState);
  updateConnectionState();
  window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); deferredInstallPrompt = event; if ($('btn-install-app')) $('btn-install-app').hidden = false; });
  $('btn-install-app')?.addEventListener('click', async () => { if (!deferredInstallPrompt) return; deferredInstallPrompt.prompt(); await deferredInstallPrompt.userChoice; deferredInstallPrompt = null; $('btn-install-app').hidden = true; });
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(error => console.warn('[offline] Service worker:', error.message));
}
document.addEventListener('DOMContentLoaded', () => { init(); setupOfflineApp(); setupWaterModule(); setupWaterPointManager(); });

/* ══════════════════════════════════════════════════════════════
   MAPA DE ÁRVORES - Lógica de UI e integração com Leaflet
══════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  // Andradas/MG – centro padrão do mapa
  const DEFAULT_CENTER = [-22.0670, -46.5686];
  const DEFAULT_ZOOM   = 14;

  // Chave de armazenamento local para a URL do webhook
  const WEBHOOK_STORAGE_KEY = "mapaWebhookUrl";

  let leafletMap   = null;
  let markersLayer = null;
  let isOpen       = false;
  let previousMapFocus = null;

  // Elementos do DOM
  const modal        = document.getElementById("mapa-modal");
  const closeBtn     = document.getElementById("mapa-close");
  const openBtn      = document.getElementById("btn-mapa");
  const statsEl      = document.getElementById("mapa-stats");
  const statusEl     = document.getElementById("mapa-status");
  const loadBtn      = document.getElementById("mapa-load-btn");
  const webhookInput = document.getElementById("mapa-webhook-input");

  // Restaurar URL salva
  webhookInput.value = localStorage.getItem(WEBHOOK_STORAGE_KEY) || "";
  // Se o campo está vazio, tenta ler do campo de registro do formulário principal
  if (!webhookInput.value) {
    const mainWebhook = document.getElementById("sheet-webhook");
    if (mainWebhook && mainWebhook.value) webhookInput.value = mainWebhook.value;
  }

  // ── Abrir / Fechar ──────────────────────────────────────────────────────────
  function openMapa() {
    previousMapFocus = document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    isOpen = true;
    setTimeout(() => closeBtn?.focus(), 0);
    if (!leafletMap) {
      initLeafletMap();
    } else {
      setTimeout(() => leafletMap.invalidateSize(), 100);
    }
    // Buscar dados automaticamente se tiver URL
    if (webhookInput.value.trim()) {
      loadTrees(webhookInput.value.trim());
    } else {
      showStatus("Cole a URL do seu Google Apps Script e clique em Carregar.", "loading");
    }
  }

  function closeMapa() {
    modal.hidden = true;
    document.body.style.overflow = "";
    isOpen = false;
    previousMapFocus?.focus?.();
  }

  if (openBtn)  openBtn.addEventListener("click", openMapa);
  if (closeBtn) closeBtn.addEventListener("click", closeMapa);
  modal.addEventListener("click", (e) => { if (e.target === modal) closeMapa(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && isOpen) closeMapa(); });

  // ── Inicializar Leaflet ─────────────────────────────────────────────────────
  function initLeafletMap() {
    if (typeof L === "undefined") {
      showStatus("Erro: biblioteca Leaflet não carregada. Verifique sua conexão com a internet.", "error");
      return;
    }

    leafletMap = L.map("arvores-map", {
      center: DEFAULT_CENTER,
      zoom:   DEFAULT_ZOOM,
      zoomControl: true,
      attributionControl: true
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19
    }).addTo(leafletMap);

    markersLayer = L.layerGroup().addTo(leafletMap);

    setTimeout(() => leafletMap.invalidateSize(), 200);
  }

  // ── Botão Carregar ──────────────────────────────────────────────────────────
  loadBtn.addEventListener("click", () => {
    const url = webhookInput.value.trim();
    if (!url) {
      showStatus("Cole a URL do Google Apps Script para carregar os dados.", "error");
      return;
    }
    localStorage.setItem(WEBHOOK_STORAGE_KEY, url);
    loadTrees(url);
  });

  webhookInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") loadBtn.click();
  });

  // ── Carregar árvores via proxy local ────────────────────────────────────────
  async function loadTrees(webhookUrl) {
    showStatus("Buscando registros na planilha...", "loading");
    statsEl.textContent = "Carregando…";

    if (!leafletMap) initLeafletMap();
    if (markersLayer) markersLayer.clearLayers();

    try {
      const encoded = encodeURIComponent(webhookUrl);
      const res = await fetch(`/api/get-trees?url=${encoded}`);
      const data = await res.json();

      if (!data.ok) {
        showStatus("Erro ao buscar dados: " + (data.error || "Resposta inválida"), "error");
        statsEl.textContent = "Erro";
        return;
      }

      const trees = data.trees || [];
      if (trees.length === 0) {
        showStatus("Nenhum registro com coordenadas encontrado na planilha. Verifique se as colunas de latitude/longitude estão preenchidas.", "loading");
        statsEl.textContent = "0 registros";
        return;
      }

      renderMarkers(trees);
      hideStatus();

      // Contadores por situação
      const counts = { total: trees.length };
      trees.forEach(t => {
        const s = normalizeSituacao(t.situacao);
        counts[s] = (counts[s] || 0) + 1;
      });
      statsEl.textContent = `${counts.total} registro${counts.total !== 1 ? "s" : ""}  ·  ✅ ${counts.compensado || 0}  ·  ⏳ ${counts.aguardando || 0}  ·  🔵 ${counts.analise || 0}  ·  ❌ ${counts.indeferido || 0}`;

    } catch (err) {
      showStatus("Erro de conexão: " + err.message, "error");
      statsEl.textContent = "Erro";
    }
  }

  // ── Renderizar marcadores ───────────────────────────────────────────────────
  function renderMarkers(trees) {
    const bounds = [];

    trees.forEach(tree => {
      const s = normalizeSituacao(tree.situacao);
      const color = situacaoColor(s);

      // Ícone SVG colorido
      const iconHtml = `
        <div style="
          width:28px;height:28px;border-radius:50% 50% 50% 0;
          background:${color};
          border:2.5px solid rgba(255,255,255,.85);
          box-shadow:0 3px 10px rgba(0,0,0,.4);
          transform:rotate(-45deg);
          transition:transform .2s;
        "></div>`;

      const icon = L.divIcon({
        html: iconHtml,
        className: "",
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -30]
      });

      const mapsUrl = `https://www.google.com/maps?q=${tree.lat},${tree.lng}`;

      const popupHtml = `
        <div class="arvore-popup">
          <h4>${esc(tree.endereco || "Local não informado")}</h4>
          <div class="popup-proto">Protocolo: ${esc(tree.protocolo || "–")}</div>
          <div class="popup-row"><strong>Solicitante</strong>${esc(tree.solicitante || "–")}</div>
          <div class="popup-row"><strong>Intervenção</strong>${esc(tree.solicitacao || "–")}</div>
          <div class="popup-row"><strong>Autorização</strong>${esc(tree.autorizacao || "–")}</div>
          <div class="popup-row"><strong>Compensação</strong>${esc(tree.compensacao || "–")}</div>
          <div class="popup-row"><strong>Data</strong>${esc(tree.data || "–")}</div>
          <div>
            <span class="popup-badge badge-${s}">${esc(tree.situacao || "Aguardando")}</span>
          </div>
          <a class="popup-maps" href="${mapsUrl}" target="_blank" rel="noopener">
            📍 Ver no Google Maps
          </a>
        </div>`;

      const marker = L.marker([tree.lat, tree.lng], { icon })
        .bindPopup(popupHtml, { maxWidth: 300 });

      markersLayer.addLayer(marker);
      bounds.push([tree.lat, tree.lng]);
    });

    if (bounds.length > 0) {
      if (bounds.length === 1) {
        leafletMap.setView(bounds[0], 16);
      } else {
        leafletMap.fitBounds(bounds, { padding: [40, 40] });
      }
    }
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────
  function normalizeSituacao(s) {
    if (!s) return "aguardando";
    const l = s.toLowerCase();
    if (l.includes("compensado")) return "compensado";
    if (l.includes("an")) return "analise";          // "Em Análise"
    if (l.includes("indeferido")) return "indeferido";
    return "aguardando";
  }

  function situacaoColor(s) {
    const map = {
      aguardando: "#f59e0b",
      compensado:  "#22c55e",
      analise:     "#3b82f6",
      indeferido:  "#ef4444"
    };
    return map[s] || "#94a3b8";
  }

  function esc(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function showStatus(msg, type) {
    statusEl.textContent = msg;
    statusEl.className = "mapa-status " + (type || "loading");
    statusEl.hidden = false;
  }

  function hideStatus() {
    statusEl.hidden = true;
  }
})();
