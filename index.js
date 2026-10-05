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

const val = id => $(id)?.value?.trim?.() ?? $(id)?.value ?? "";
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
  condicao: 'viva',
  doenca: 'ausente',
  conflito: 'nenhum',
  risco: 'nao',
  observacao: ''
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

function photoSlots(t, i) {
  return organs.map(([key, title]) => `
    <label class="photo-slot" title="Adicionar foto: ${title}">
      <input type="file" data-tree="${i}" data-organ="${key}" accept="image/jpeg,image/png,image/webp" capture="environment">
      <div>
        ${t.photos[key] ? `<img src="${t.photos[key]}" alt="${title}">` : `<span>+<br>${title}</span>`}
      </div>
    </label>
  `).join('');
}

function speciesTemplate(t, i) {
  const hasPhotos = Object.keys(t.photos).length > 0;
  return `
    <article class="tree-card" data-tree="${i}" id="species-card-${i}">
      <header class="tree-card-head">
        <div>
          <small>Exemplar Arbóreo nº ${i + 1}</small>
          <strong>${esc(t.popular || t.cientifico || 'Espécie não informada')}</strong>
        </div>
        <span class="badge ${t.flora ? 'badge-ok' : ''}">${t.flora ? 'Flora consultada' : 'Aguardando dados'}</span>
      </header>
      <div class="tree-body">
        <div class="subhead">
          <h3>Registro fotográfico para identificação</h3>
          <p>Tire ou anexe fotos de diferentes partes do mesmo exemplar para maior precisão.</p>
        </div>
        <div class="photo-slots">${photoSlots(t, i)}</div>
        <div class="identify-row">
          <button type="button" class="primary identify" ${hasPhotos ? '' : 'disabled'}>
            Identificar com Pl@ntNet
          </button>
          <small class="identify-status">
            ${hasPhotos ? `${Object.keys(t.photos).length} foto(s) anexada(s). Clique para enviar.` : 'Adicione pelo menos uma foto para identificação.'}
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
        <div class="grid three">
          <label>Nome popular
            <input class="popular" value="${esc(t.popular)}" placeholder="Ex.: Ipê-amarelo">
          </label>
          <div class="input-with-button">
            <label>Nome científico
              <div class="input-group">
                <input class="cientifico" value="${esc(t.cientifico)}" placeholder="Ex.: Handroanthus albus">
                <button type="button" class="lookup">Consultar Flora</button>
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
      </div>
    </article>
  `;
}

function assessmentTemplate(t, i) {
  return `
    <article class="tree-card assessment" data-tree="${i}" id="assessment-card-${i}">
      <header class="tree-card-head">
        <div>
          <small>Vistoria nº ${i + 1}</small>
          <strong>${esc(t.popular || t.cientifico || 'Exemplar sem identificação')}</strong>
        </div>
        <span class="badge">${t.condicao === 'semvida' ? 'Sem vida biológica' : t.risco === 'sim' ? 'Risco iminente' : 'Normal'}</span>
      </header>
      <div class="tree-body">
        <div class="grid three">
          <label>DAP - Diâmetro à Altura do Peito (cm)
            <input class="dap" type="number" min="0" max="500" step="0.5" value="${t.dap || ''}" placeholder="Ex.: 25">
          </label>
          <label>Altura total estimada (m)
            <input class="altura" type="number" min="0" max="100" step="0.5" value="${t.altura || ''}" placeholder="Ex.: 8">
          </label>
          <label>Condição biológica (Art. 2º VI e Art. 9º)
            <select class="condicao">
              <option value="viva" ${t.condicao === 'viva' ? 'selected' : ''}>Viva e viável</option>
              <option value="declinio" ${t.condicao === 'declinio' ? 'selected' : ''}>Em declínio severo</option>
              <option value="semvida" ${t.condicao === 'semvida' ? 'selected' : ''}>Sem vida (morta / inviável)</option>
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
          <label>Conflito urbano constatado
            <select class="conflito">
              <option value="nenhum" ${t.conflito === 'nenhum' ? 'selected' : ''}>Nenhum conflito relevante</option>
              <option value="fiacao" ${t.conflito === 'fiacao' ? 'selected' : ''}>Fiação / rede aérea</option>
              <option value="edificacao" ${t.conflito === 'edificacao' ? 'selected' : ''}>Edificação / muro / telhado</option>
              <option value="calcada" ${t.conflito === 'calcada' ? 'selected' : ''}>Passeio público / encanamento</option>
              <option value="viario" ${t.conflito === 'viario' ? 'selected' : ''}>Tráfego viário / sinalização</option>
              <option value="obra" ${t.conflito === 'obra' ? 'selected' : ''}>Interferência com obra autorizada</option>
            </select>
          </label>
          <label>Risco de queda (Art. 2º VII e Art. 10º)
            <select class="risco">
              <option value="nao" ${t.risco === 'nao' ? 'selected' : ''}>Sem risco aparente de queda</option>
              <option value="monitorar" ${t.risco === 'monitorar' ? 'selected' : ''}>Risco potencial (monitorar)</option>
              <option value="sim" ${t.risco === 'sim' ? 'selected' : ''}>Risco atual ou iminente (urgência)</option>
              <option value="duvida" ${t.risco === 'duvida' ? 'selected' : ''}>Inconclusivo / requer laudo</option>
            </select>
          </label>
          <label class="full">Observações específicas deste exemplar
            <textarea class="observacao" rows="2" placeholder="Descreva particularidades do exemplar, tais como inclinação do fuste, necroses, interferências ou medidas prévias adotadas.">${esc(t.observacao)}</textarea>
          </label>
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
    for (const k of ['popular', 'cientifico', 'familia', 'certeza', 'origem', 'protegida']) {
      const el = c.querySelector('.' + k);
      if (el) t[k] = el.value;
    }
  });
}

// Sincroniza dados da Etapa 3 lendo os inputs da tela para o objeto trees
function syncAssessment() {
  document.querySelectorAll('#assessment-container .assessment').forEach((c, i) => {
    if (!trees[i]) return;
    const t = trees[i];
    for (const k of ['condicao', 'doenca', 'conflito', 'risco', 'observacao']) {
      const el = c.querySelector('.' + k);
      if (el) t[k] = el.value;
    }
    const dapEl = c.querySelector('.dap');
    if (dapEl) t.dap = Math.max(0, Number(dapEl.value) || 0);
    const altEl = c.querySelector('.altura');
    if (altEl) t.altura = Math.max(0, Number(altEl.value) || 0);
  });
}

// Sincroniza um card específico sem re-renderizar todo o DOM
function syncCard(i) {
  const sc = document.getElementById(`species-card-${i}`);
  if (sc && trees[i]) {
    for (const k of ['popular', 'cientifico', 'familia', 'certeza', 'origem', 'protegida']) {
      const el = sc.querySelector('.' + k);
      if (el) trees[i][k] = el.value;
    }
  }
  const ac = document.getElementById(`assessment-card-${i}`);
  if (ac && trees[i]) {
    for (const k of ['condicao', 'doenca', 'conflito', 'risco', 'observacao']) {
      const el = ac.querySelector('.' + k);
      if (el) trees[i][k] = el.value;
    }
    const dapEl = ac.querySelector('.dap');
    if (dapEl) trees[i].dap = Math.max(0, Number(dapEl.value) || 0);
    const altEl = ac.querySelector('.altura');
    if (altEl) trees[i].altura = Math.max(0, Number(altEl.value) || 0);
  }
}

// Renderiza todos os cards (usado na inicialização e ao mudar a quantidade de árvores)
function renderAll(capture = true) {
  if (capture) {
    syncSpecies();
    syncAssessment();
  }
  const q = Math.max(1, Math.min(100, Math.floor(Number(val('quantidade')) || 1)));
  trees = Array.from({ length: q }, (_, i) => trees[i] || defaultTree(i));

  const tc = $('trees-container');
  const ac = $('assessment-container');
  if (tc) tc.innerHTML = trees.map(speciesTemplate).join('');
  if (ac) ac.innerHTML = trees.map(assessmentTemplate).join('');

  bindSpecies();
  bindAssessment();
  update();
}

function bindSpecies() {
  document.querySelectorAll('#trees-container .tree-card').forEach((card, i) => {
    // Carregamento de imagens
    card.querySelectorAll('.photo-slot input').forEach(inp => {
      inp.addEventListener('change', e => {
        const file = e.target.files?.[0];
        if (!file) return;
        loadPhoto(file, src => {
          trees[i].photos[e.target.dataset.organ] = src;
          // Atualiza o slot visualmente sem perder os outros campos
          const slot = inp.closest('.photo-slot');
          if (slot) {
            slot.querySelector('div').innerHTML = `<img src="${src}" alt="Foto">`;
          }
          const idBtn = card.querySelector('.identify');
          if (idBtn) idBtn.disabled = false;
          const status = card.querySelector('.identify-status');
          if (status) status.textContent = `${Object.keys(trees[i].photos).length} foto(s) anexada(s). Clique para identificar.`;
        });
      });
    });

    // Identificação via Pl@ntNet
    const idBtn = card.querySelector('.identify');
    if (idBtn) {
      idBtn.addEventListener('click', () => identifyTree(i, card));
    }

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

    // Atualização reativa de digitação
    card.addEventListener('input', () => {
      syncCard(i);
      const title = card.querySelector('.tree-card-head strong');
      if (title) title.textContent = trees[i].popular || trees[i].cientifico || 'Espécie não informada';
      // Sincroniza o cabeçalho correspondente na etapa de avaliação
      const acHead = document.querySelector(`#assessment-card-${i} .tree-card-head strong`);
      if (acHead) acHead.textContent = trees[i].popular || trees[i].cientifico || 'Exemplar sem identificação';
      update();
    });
  });
}

function bindAssessment() {
  document.querySelectorAll('#assessment-container .assessment').forEach((card, i) => {
    card.addEventListener('input', () => {
      syncCard(i);
      const badge = card.querySelector('.tree-card-head .badge');
      if (badge) {
        badge.textContent = trees[i].condicao === 'semvida' ? 'Sem vida biológica' : trees[i].risco === 'sim' ? 'Risco iminente' : 'Normal';
      }
      update();
    });
  });
}

// Comprime imagem usando Canvas para manter a requisição rápida e leve
function loadPhoto(file, done) {
  if (!file) return;
  const r = new FileReader();
  r.onload = () => {
    const img = new Image();
    img.onload = () => {
      const max = 1200;
      const s = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * s);
      c.height = Math.round(img.height * s);
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0, c.width, c.height);
      done(c.toDataURL('image/jpeg', 0.82));
    };
    img.src = r.result;
  };
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

// Cálculo da compensação ambiental conforme Deliberação Normativa CODEMA 09/2026
function calculateCompensation() {
  const conc = val('conclusao');
  if (conc !== 'deferir') {
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
  if (especial === 'obra' || val('executor') === 'municipio') {
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
      detalhes.push(`Árvore ${t.numero}: DAP < 5cm (exemplar jovem/arvoreta, sem exigência de tabela do Art. 7º; recomenda-se reposição 1:1).`);
      totalMudas += 1;
      totalUfm += (t.origem === 'nativa' ? 80 : 40);
      return;
    }

    if (!band) {
      pendencias.push(`Árvore ${t.numero} (DAP não informado)`);
      return;
    }

    const row = table[t.origem]?.[band];
    if (!row) {
      pendencias.push(`Árvore ${t.numero} (faixa não identificada)`);
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
    detalhes.push(`Árvore ${t.numero} (${t.origem}, DAP ${t.dap}cm): ${m} mudas ou ${u} UFM${motivoAgravante}.`);
  });

  const baseText = `${totalMudas} muda(s) nativa(s) ou ${totalUfm} UFM`;
  const pendText = pendencias.length ? ` [Pendente de aferição para: ${pendencias.join(', ')}]` : '';

  return {
    text: `${baseText}${pendText}`,
    mudas: totalMudas,
    ufm: totalUfm,
    pendencias,
    detalhes
  };
}

function model(e) {
  if (e.conclusao === 'diligencia' || e.doubts) {
    return 'Parecer de Diligência Técnica / Complementação';
  }
  if (e.conclusao === 'indeferir') {
    return 'Parecer Técnico de Indeferimento';
  }
  if (e.urgent) {
    return 'Autorização Ambiental de Urgência (Risco Iminente - Art. 10º)';
  }
  if (e.codema) {
    return 'Parecer Técnico para Deliberação do CODEMA (Art. 3º § 2º)';
  }
  return 'Parecer Técnico de Deferimento Direto pela SPUMA (Art. 3º § 1º)';
}

function route(e) {
  if (e.urgent) {
    return 'Autorização imediata de urgência com formalização da compensação em até 15 dias (Art. 10º da DN 09/2026).';
  }
  if (e.codema) {
    return 'Submissão obrigatória à Plenária do CODEMA para deliberação colegiada (Art. 3º § 2º da DN 09/2026).';
  }
  return 'Decisão administrativa direta pela Secretaria de Planejamento Urbano e Meio Ambiente - SPUMA (Art. 3º § 1º).';
}

function update() {
  if (!trees.length) return;
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

// Gera o Parecer Técnico Ambiental oficial
function generate() {
  const e = evaluate();
  const comp = calculateCompensation();
  const proc = val('processo') || '[NÚMERO NÃO INFORMADO]';
  const req = val('requerente') || '[REQUERENTE NÃO INFORMADO]';
  const endereco = val('local') || '[ENDEREÇO NÃO INFORMADO]';
  const dataHoje = new Date().toLocaleDateString('pt-BR');

  const inventory = trees.map(t => {
    const pop = t.popular ? `"${t.popular}"` : 'nome popular não informado';
    const sci = t.cientifico ? `${t.cientifico}` : 'espécie não identificada';
    const fam = t.familia ? `família ${t.familia}` : 'família não informada';
    const orig = t.origem === 'nativa' ? 'Nativa' : t.origem === 'exotica' ? 'Exótica' : 'Origem em apuração';
    const dap = t.dap > 0 ? `${t.dap} cm` : 'DAP não medido';
    const alt = t.altura > 0 ? `${t.altura} m` : 'altura não estimada';
    const cond = t.condicao === 'viva' ? 'Viva' : t.condicao === 'semvida' ? 'Sem vida biológica (morta/inviável)' : t.condicao;
    const risco = t.risco === 'sim' ? 'SIM (Risco atual/iminente)' : t.risco === 'monitorar' ? 'Potencial (monitorar)' : 'Sem risco aparente';
    const specs = specialFor(t).join('; ');

    return `  • Exemplar nº ${t.numero}: ${pop} (${sci}), ${fam}.
    - Origem: ${orig} | DAP: ${dap} | Altura: ${alt}
    - Sanidade: ${cond} | Sinais de pragas/podridão: ${t.doenca}
    - Conflitos urbanos: ${t.conflito} | Risco de queda: ${risco}
    ${specs ? `    - Enquadramento especial: ${specs}\n` : ''}    ${t.observacao ? `    - Observações: ${t.observacao}\n` : ''}`;
  }).join('\n');

  const compDetails = comp.detalhes.length
    ? comp.detalhes.map(d => `  - ${d}`).join('\n')
    : `  - ${comp.text}`;

  const ptrfText = e.ptrf
    ? `EXIGÊNCIA DE PTRF:
Nos termos do Art. 15º da Deliberação Normativa CODEMA nº 09/2026, faz-se OBRIGATÓRIA a elaboração e apresentação de Projeto Técnico de Reconstituição da Flora (PTRF) por profissional legalmente habilitado com a devida Anotação de Responsabilidade Técnica (ART/TRT).\n\n`
    : '';

  const doc = `================================================================================
PREFEITURA MUNICIPAL DE ANDRADAS
SECRETARIA MUNICIPAL DE PLANEJAMENTO URBANO E MEIO AMBIENTE - SPUMA
CONSELHO MUNICIPAL DE CONSERVAÇÃO E DEFESA DO MEIO AMBIENTE - CODEMA
================================================================================

PARECER TÉCNICO DE VISTORIA AMBIENTAL
Deliberação Normativa CODEMA nº 09/2026 | Lei Complementar Municipal nº 163/2015

1. IDENTIFICAÇÃO DO PROCESSO
--------------------------------------------------------------------------------
Processo / Protocolo: ${proc}
Data da Vistoria:     ${dataHoje}
Requerente:           ${req}
Local da Vistoria:    ${endereco}
Intervenção Proposta: ${label('intervencao')} de ${trees.length} exemplar(es) arbóreo(s)
Finalidade do Pedido: ${label('finalidade')}
Enquadramento da Área: ${label('area')}

2. RELATÓRIO E MOTIVAÇÃO
--------------------------------------------------------------------------------
Trata-se de procedimento administrativo de vistoria para avaliação técnica de pedido
de ${label('intervencao').toLowerCase()} de ${trees.length} espécime(s) arbóreo(s) no endereço supracitado,
motivado por razões de ${label('finalidade').toLowerCase()}.

3. INVENTÁRIO TÉCNICO DOS EXEMPLARES
--------------------------------------------------------------------------------
${inventory}

4. DIAGNÓSTICO CIRCUNSTANCIADO
--------------------------------------------------------------------------------
${val('diagnostico') || '[Sem diagnóstico específico inserido na vistoria preliminar.]'}

Análise de Alternativas Técnicas:
Foi verificada a hipótese de manejo conservacionista, constatando-se: ${label('alternativa')}.

5. ENQUADRAMENTO NORMATIVO E COMPETÊNCIA
--------------------------------------------------------------------------------
A intervenção foi submetida aos critérios da Deliberação Normativa CODEMA nº 09/2026:
- Competência Administrativa: ${route(e)}
${e.triggers.length ? `- Fatores Determinantes: ${e.triggers.join('; ')}.\n` : '- Casos ordinários decididos diretamente pela SPUMA conforme Art. 3º, § 1º.\n'}
${ptrfText}6. CONCLUSÃO TÉCNICA
--------------------------------------------------------------------------------
Diante dos elementos vistoriados e das diretrizes ambientais vigentes, o parecer da equipe técnica é:
>> ${label('conclusao').toUpperCase()} <<

${e.conclusao === 'deferir'
  ? 'O deferimento fica estritamente condicionado ao cumprimento das obrigações compensatórias e condicionantes técnicas fixadas neste parecer e no respectivo alvará de autorização.'
  : e.conclusao === 'indeferir'
  ? 'O indeferimento fundamenta-se na viabilidade de preservação do exemplar, ausência de risco iminente ou insuficiência de justificativa técnica admissível.'
  : 'Fica determinada a realização de diligência técnica ou juntada de laudo complementar para saneamento das pendências apontadas.'}

7. OBRIGAÇÃO COMPENSATÓRIA AMBIENTAL (Art. 6º e 7º da DN 09/2026)
--------------------------------------------------------------------------------
Memória de Cálculo:
${compDetails}

Parâmetro Total Fixado:
${comp.text}

Modalidade Escolhida: ${label('forma')}
Plantio no Próprio Imóvel: ${label('proprio')}
Responsável pela Execução do Corte: ${label('executor')}

${val('forma') === 'direta'
  ? `Requisitos de Execução Direta (Art. 8º da DN 09/2026):
  a) Altura mínima das mudas: 1,5 metros;
  b) Espécies nativas adequadas ao ambiente urbano e aprovadas pela SPUMA;
  c) Monitoramento obrigatório mínimo de 24 (vinte e quatro) meses;
  d) Comprovação semestral via relatórios técnicos com registros fotográficos atualizados;
  e) Substituição obrigatória de mudas que venham a perecer durante o período.`
  : val('forma') === 'pecuniaria'
  ? `Requisitos de Execução Indireta Pecuniária (Art. 6º § 4º a § 8º da DN 09/2026):
  O recolhimento do valor correspondente em Unidades Fiscais Municipais (UFM) deverá ocorrer
  PREVIAMENTE à emissão da autorização, sendo a receita obrigatoriamente vinculada ao Fundo
  Municipal de Meio Ambiente (FMMA) para ações estruturadas de arborização e recuperação urbana.`
  : ''}

8. PRAZOS DE VALIDADE
--------------------------------------------------------------------------------
- Prazo de Validade da Autorização: 60 (sessenta) dias contados da ciência formal (Art. 5º).
${e.urgent ? '- Prazo para formalização da compensação de urgência: até 15 (quinze) dias (Art. 10º).\n' : ''}
================================================================================
Andradas/MG, ${dataHoje}.


____________________________________________________________
Equipe Técnica / Fiscal de Meio Ambiente
Secretaria de Planejamento Urbano e Meio Ambiente - SPUMA
`;

  const saidaEl = $('saida');
  if (saidaEl) saidaEl.value = doc;

  const titEl = $('titulo-modelo');
  if (titEl) titEl.textContent = model(e);

  const badgeEl = $('rota-badge');
  if (badgeEl) {
    badgeEl.textContent = e.urgent ? 'URGÊNCIA' : e.codema ? 'CODEMA' : 'SPUMA';
    badgeEl.className = e.urgent ? 'badge-urgent' : e.codema ? 'badge-codema' : 'badge-spuma';
  }

  const docEl = $('documento');
  if (docEl) {
    docEl.hidden = false;
    docEl.scrollIntoView({ behavior: 'smooth' });
  }
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

  if (name === 'parecer') {
    update();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function isoToBr(s) {
  if (!s) return '';
  const parts = s.split('-');
  if (parts.length !== 3) return s;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

// Gravação dos dados na planilha do Google Sheets via backend proxy
async function saveSheet() {
  const status = $('sheet-status');
  const url = val('sheet-webhook') || localStorage.getItem('sheetWebhook') || '';

  if (!url) {
    if (status) {
      status.textContent = 'Informe a URL do aplicativo Google Apps Script para habilitar a gravação.';
      status.className = 'sheet-status text-danger';
    }
    const whInp = $('sheet-webhook');
    if (whInp) whInp.focus();
    return;
  }

  localStorage.setItem('sheetWebhook', url);
  const comp = calculateCompensation();

  const payload = {
    data: isoToBr(val('sheet-data')),
    protocolo: val('processo'),
    solicitante: val('requerente'),
    endereco: val('local'),
    solicitacao: `${label('intervencao')} de ${trees.length} árvore(s)`,
    coordCorte1: val('coord-corte-1'),
    coordCorte2: val('coord-corte-2'),
    responsavelCorte: val('responsavel-corte'),
    autorizacao: val('autorizacao'),
    dataAutorizacao: isoToBr(val('data-autorizacao')),
    compensacao: comp.text,
    prazo: isoToBr(val('prazo')),
    coordComp1: val('coord-comp-1'),
    coordComp2: val('coord-comp-2'),
    situacao: val('situacao')
  };

  if (status) {
    status.textContent = 'Conectando e registrando na planilha…';
    status.className = 'sheet-status text-muted';
  }

  try {
    const r = await fetch('/api/sheet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, payload })
    });
    const d = await r.json();

    if (!r.ok || !d.ok) {
      throw new Error(d.error || 'Falha na resposta do Google Apps Script');
    }

    if (status) {
      status.textContent = `✓ Sucesso! Registro nº ${d.row || ''} adicionado à planilha com sucesso.`;
      status.className = 'sheet-status text-success';
    }
  } catch (e) {
    if (status) {
      status.textContent = 'Não foi possível salvar na planilha: ' + e.message;
      status.className = 'sheet-status text-danger';
    }
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

// Inicialização dos eventos da aplicação
function init() {
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

  const watchIds = [
    'area', 'grande', 'valor', 'impacto', 'alternativa',
    'especial', 'conclusao', 'forma', 'proprio', 'executor',
    'intervencao', 'finalidade'
  ];
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
  if (imprimirBtn) imprimirBtn.addEventListener('click', () => window.print());

  const saveSheetBtn = $('save-sheet');
  if (saveSheetBtn) saveSheetBtn.addEventListener('click', saveSheet);

  const saveKeyBtn = $('save-key');
  if (saveKeyBtn) {
    saveKeyBtn.addEventListener('click', () => {
      localStorage.setItem('plantnetApiKey', val('plantnet-key'));
      saveKeyBtn.textContent = '✓ Chave salva no navegador';
      setTimeout(() => { saveKeyBtn.textContent = 'Salvar chave'; }, 2500);
    });
  }

  // Preenche dados padrão
  const pk = $('plantnet-key');
  if (pk) pk.value = localStorage.getItem('plantnetApiKey') || '';

  const sw = $('sheet-webhook');
  if (sw) sw.value = localStorage.getItem('sheetWebhook') || '';

  const todayIso = new Date().toISOString().slice(0, 10);
  const sheetData = $('sheet-data');
  if (sheetData) sheetData.value = todayIso;

  const dataAut = $('data-autorizacao');
  if (dataAut) dataAut.value = todayIso;

  // Prazo padrão de 60 dias (Art. 5º da DN 09/2026)
  const defaultPrazo = new Date();
  defaultPrazo.setDate(defaultPrazo.getDate() + 60);
  const prazoEl = $('prazo');
  if (prazoEl) prazoEl.value = defaultPrazo.toISOString().slice(0, 10);

  // Consulta configuração de chave no servidor local
  fetch('/api/config')
    .then(r => r.json())
    .then(c => {
      if (c.plantnetConfigured && pk) {
        pk.value = '';
        pk.placeholder = 'Chave ativa no servidor local (.env)';
        if (saveKeyBtn) saveKeyBtn.textContent = 'Chave no servidor local';
      }
    })
    .catch(() => {});

  renderAll(false);
}

document.addEventListener('DOMContentLoaded', init);