/* ============================================================
   INVENTÁRIO ARBÓREO — ANDRADAS, MG
   App JavaScript v3
   ============================================================ */

const DB_KEY = 'arbore_andradas_v3';

// Google Sheets Web App URL — cole a URL do seu Apps Script publicado
const SHEETS_URL = '';

const SPECIES_DB = [
    'Abarema idiopoda','Abutilon fruticosum','Acacia mangium','Acnistus arborescens',
    'Adenanthera pavonina','Aglaia odorata','Albizia lebbek','Alchornea triplinervia',
    'Alibertia edulis','Annona reticulata','Annona squamosa','Aphanes microcarpa',
    'Aspidosperma polyneuron','Bambusa oldhamii','Bauhinia forficata','Bixa orellana',
    'Blankinia rosea','Brosimum gaubertianum','Caesalpinia pluviosa','Calliandra brevipes',
    'Callistemon sieberi','Calycophyllum spruceanum','Campomanesia xanthocarpa',
    'Cariniana legalis','Casuarina equisetifolia','Cedrela fissilis','Celtis iguanaea',
    'Chaetachme aristata','Chorisia speciosa','Cinnamomum glaucescens','Citrus sinensis',
    'Citharexylum myrianthum','Clitoria ternatea','Cochlospermum regium','Commersonia fraseri',
    'Cosonimum camphor','Croton floribundus','Cupania vernalis','Cyathea delgadii',
    'Cymbopogon citratus','Daphnopsis fasciculata','Dendrocalamus asper','Dipteryx alata',
    'Dyssochroma viridiflorum','Eriobotrya japonica','Erythrina speciosa','Eschweilera ovata',
    'Eugenia uniflora','Eugenia pyriformis','Eugenia involucrata','Eugenia javanica',
    'Ficus benjamina','Ficus elastica','Ficus microcarpa','Ficus obtusifolia',
    'Fraxinus uhdei','Garcinia gardneriana','Gleditsia amorphoides','Gochnatia polymorpha',
    'Grevea mexicana','Guarea trichilioides','Guarea guidonia','Guazuma ulmifolia',
    'Handroanthus chrysotrichus','Handroanthus impetiginosus','Hymenaea courbaril',
    'Inga vera','Jacaranda mimosifolia','Lafoensia glyptocarpa','Lagerstroemia indica',
    'Leonotis leonurus','Libidibia ferrea','Ligustrum lucidum',
    'Lithraea molleoides','Luehea candicans','Maackia amurensis','Mangifera indica',
    'Maytenus evonymoides','Melia azedarach','Metrodorea nigra','Mimosa bimucronata',
    'Mimusops communis','Mollinedia schottiana','Monteverdia gonoclada','Myracrodruon urundeuva',
    'Myrciaria dubia','Nectandra megapotamica','Nectandra oppositifolia','Nephrolepis exaltata',
    'Ocimum gratissimum','Ocotea pulchella','Ocotea puberula','Olea europaea',
    'Parapiptadenia rigida','Peltogyne paivaeana','Peltophorum dubium','Pera glabrata',
    'Phoenix canariensis','Phyllanthus tenellus','Piper aduncum','Plathymenia reticulata',
    'Platanus hispanica','Poincianella pluviosa','Pontidendron pinnatum','Portea karlasinskyana',
    'Pouteria torta','Psidium cattleyanum','Psidium guajava','Psidium guineense',
    'Psiguria pedata','Pterocarpus macrocarpus','Pterogyne nitens','Qualea grandiflora',
    'Quercus robur','Rauvolfia sellowii','Retiniphyllum concolor','Rhamnidium elaeocarpum',
    'Richeria grandis','Ricinus communis','Robinia pseudoacacia','Rollinia mucosa',
    'Rosmarinus officinalis','Ruprechtia laxiflora','Salix humboldtiana','Schinus terebinthifolia',
    'Schizolobium parahyba','Senna multijuga','Sideroxylon obtusifolium','Simarouba amara',
    'Solanum lycocarpum','Spathodea campanulata','Stenocalyx surinamensis','Syagrus romanzoffiana',
    'Tabebuia alba','Tabebuia roseoalba','Tabebuia vellosoi','Tabernaemontana catharinensis',
    'Tibouchina granulosa','Trema micrantha','Trichilia elegans','Trichilia pallida',
    'Triplochiton scleroxylon','Trophis racemosa','Uapaca kirkiana','Urera baccifera',
    'Uruana glomerata','Vernonia ferruginea','Viburnum nudum','Vitex polyneura',
    'Vochysia magnifica','Vochysia tucanorum','Xylosma ciliatifolia',
    'Zanthoxylum rhoifolium','Zeyheria tuberculosa','Zingiber officinale','Zollernia ilicifolia'
];

const COMMON_NAMES = {
    'Tipuana tipu': 'Ipê-amarelo / Tipuana',
    'Mangifera indica': 'Mangueira',
    'Handroanthus albus': 'Ipê-amarelo',
    'Handroanthus impetiginosus': 'Ipê-roxo',
    'Handroanthus chrysotrichus': 'Ipê-amarelo',
    'Jacaranda mimosifolia': 'Jacaranda',
    'Syagrus romanzoffiana': 'Coqueiro-queen',
    'Ficus benjamina': 'Ficus',
    'Ficus microcarpa': 'Ficus',
    'Eugenia uniflora': 'Pitangueira',
    'Psidium guajava': 'Goiabeira',
    'Casuarina equisetifolia': 'Casuarina',
    'Phoenix canariensis': 'Palmeira-reis',
    'Chorisia speciosa': 'Paineira',
    'Platanus hispanica': 'Plátano',
    'Ligustrum lucidum': 'Loureiro',
    'Melia azedarach': 'Cinamomo',
    'Schinus terebinthifolia': 'Aroeira',
    'Cedrela fissilis': 'Cedro',
    'Aspidosperma polyneuron': 'Peroba-rosa',
    'Hymenaea courbaril': 'Jatobá',
    'Bauhinia forficata': 'Pata-de-vaca',
    'Caesalpinia pluviosa': 'Sibipiruna',
    'Celtis iguanaea': 'Juá',
    'Citharexylum myrianthum': 'Murta',
    'Croton floribundus': 'Sangue-de-drago',
    'Erythrina speciosa': 'Mulungu',
    'Inga vera': 'Ingá',
    'Luehea candicans': 'Açoita-cavalo',
    'Myracrodruon urundeuva': 'Aroeira-do-sertão',
    'Pterogyne nitens': 'Canafístula',
    'Tabebuia roseoalba': 'Ipê-branco',
    'Tibouchina granulosa': 'Quaresmeira',
    'Trema micrantha': 'Capororoca',
    'Trichilia elegans': 'Catiguá',
    'Zanthoxylum rhoifolium': 'Marinheiro',
    'Annona squamosa': 'Pinha',
    'Annona reticulata': 'Ata',
    'Citrus sinensis': 'Laranjeira',
    'Eriobotrya japonica': 'Macieira-japonesa',
    'Mangifera indica': 'Mangueira'
};

let trees = JSON.parse(localStorage.getItem(DB_KEY)) || [];
let map = null;
let markers = {};
let currentStep = 1;
let editingId = null;

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initMap();
    initGPS();
    initSpeciesSearch();
    initCatalogSearch();
    initFilters();
    renderAll();
});

// ============================================================
// NAVIGATION
// ============================================================
function initNavigation() {
    document.querySelectorAll('.bnav-item').forEach(btn => {
        btn.addEventListener('click', () => navigateTo(btn.dataset.page));
    });
}

function navigateTo(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId)?.classList.add('active');

    document.querySelectorAll('.bnav-item').forEach(b => b.classList.remove('active'));
    document.querySelector(`.bnav-item[data-page="${pageId}"]`)?.classList.add('active');

    if (pageId === 'pageDashboard' && map) setTimeout(() => map.invalidateSize(), 120);
    if (pageId === 'pageCatalog') renderCatalog();
    if (pageId === 'pageForm') { currentStep = 1; showStep(1); }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================================
// MAP
// ============================================================
function initMap() {
    map = L.map('map', { zoomControl: false }).setView([-22.0683, -46.5733], 14);
    L.control.zoom({ position: 'topright' }).addTo(map);
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Esri World Imagery',
        maxZoom: 19
    }).addTo(map);
    setTimeout(() => map.invalidateSize(), 300);
    renderMapMarkers();
}

function renderMapMarkers() {
    if (!map) return;
    Object.values(markers).forEach(m => map.removeLayer(m));
    markers = {};

    trees.forEach(t => {
        if (!t.latitude || !t.longitude) return;

        const colors = { saudavel: '#7A9444', atencao: '#C0693A', critico: '#B84433' };
        const color = colors[t.status] || '#7A9444';

        const icon = L.divIcon({
            className: 'tree-marker',
            html: `<div class="tree-marker-pin" style="--c:${color}">
                <svg viewBox="0 0 24 36" width="22" height="33" fill="none" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 34V22" stroke="${color}" stroke-width="2"/>
                    <path d="M12 22C12 17 8.5 12 5 13C8.5 13 12 8 12 4C12 8 15.5 13 19 13C15.5 12 12 17 12 22Z" fill="${color}" fill-opacity="0.3" stroke="${color}" stroke-width="1.5"/>
                    <path d="M5 13C3 10.5 2 11 1 12" stroke="${color}" stroke-width="1" opacity="0.5"/>
                    <path d="M19 13C21 10.5 22 11 23 12" stroke="${color}" stroke-width="1" opacity="0.5"/>
                    <path d="M9 26c-1.2-0.6-2.5-0.2-3 0.3" stroke="${color}" stroke-width="0.8" opacity="0.5"/>
                    <path d="M15 28c1.2-0.6 2.5-0.2 3 0.3" stroke="${color}" stroke-width="0.8" opacity="0.5"/>
                    <circle cx="12" cy="4" r="1.2" fill="${color}" fill-opacity="0.4"/>
                </svg>
            </div>`,
            iconSize: [22, 33],
            iconAnchor: [11, 33],
            popupAnchor: [0, -31]
        });

        const marker = L.marker([t.latitude, t.longitude], { icon }).addTo(map);

        const photo = t.fotos?.[0] || t.foto1 || '';
        const photoHtml = photo
            ? `<img src="${photo}" class="popup-photo" alt="${t.especie || ''}">`
            : `<div class="popup-photo popup-photo-placeholder"><svg viewBox="0 0 28 36" width="22" height="28" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M14 34V22" stroke="#7A9444" stroke-width="1.5"/><path d="M14 22C14 17 10.5 12 7 13C10.5 13 14 8 14 4C14 8 17.5 13 21 13C17.5 12 14 17 14 22Z" fill="#7A9444" fill-opacity="0.2" stroke="#7A9444" stroke-width="1.2"/><path d="M7 13C5 10.5 4 11 3 12" stroke="#7A9444" stroke-width="0.8" opacity="0.5"/><path d="M21 13C23 10.5 24 11 25 12" stroke="#7A9444" stroke-width="0.8" opacity="0.5"/><circle cx="14" cy="4" r="1" fill="#7A9444" fill-opacity="0.4"/></svg></div>`;

        marker.bindPopup(`
            <div class="map-popup">
                ${photoHtml}
                <div class="popup-info">
                    <strong>${t.especie || 'Árvore'}</strong>
                    <small>${t.logradouro || t.referencia || 'Sem endereço'}</small>
                </div>
                <button class="popup-btn" onclick="closePopups();openModal(${t.id})">Ver detalhes</button>
            </div>
        `, { closeButton: false, className: 'tree-popup', maxWidth: 240 });

        markers[t.id] = marker;
    });
}

function closePopups() { if (map) map.closePopup(); }

// ============================================================
// GPS
// ============================================================
function initGPS() {
    const btn = document.getElementById('captureGps');
    if (!btn) return;

    btn.addEventListener('click', () => {
        if (!navigator.geolocation) {
            document.getElementById('gpsStatus').textContent = 'GPS não disponível';
            return;
        }
        btn.classList.add('active');
        document.getElementById('gpsStatus').textContent = 'Obtendo localização...';

        navigator.geolocation.getCurrentPosition(
            async pos => {
                const lat = pos.coords.latitude, lng = pos.coords.longitude;
                document.getElementById('latitude').value = lat.toFixed(6);
                document.getElementById('longitude').value = lng.toFixed(6);
                document.getElementById('gpsStatus').textContent = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
                btn.classList.remove('active');
                btn.classList.add('done');

                try {
                    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&accept-language=pt`);
                    const d = await r.json();
                    if (d.address) {
                        const a = d.address;
                        document.getElementById('logradouro').value = [a.road, a.neighbourhood, a.suburb, a.city || a.town, a.state].filter(Boolean).join(', ');
                    }
                } catch (e) { /* ignore */ }

                if (map) map.setView([lat, lng], 16);
            },
            () => {
                document.getElementById('gpsStatus').textContent = 'Erro ao obter localização';
                btn.classList.remove('active');
            },
            { enableHighAccuracy: true, timeout: 15000 }
        );
    });
}

// ============================================================
// SPECIES SEARCH
// ============================================================
function initSpeciesSearch() {
    const input = document.getElementById('especieSearch');
    const results = document.getElementById('especieResults');
    const hidden = document.getElementById('especie');
    if (!input) return;

    input.addEventListener('input', () => {
        const val = input.value.trim().toLowerCase();
        if (val.length < 2) { results.classList.remove('show'); return; }

        const matches = SPECIES_DB.filter(s => {
            const cn = COMMON_NAMES[s] || '';
            return s.toLowerCase().includes(val) || cn.toLowerCase().includes(val);
        }).slice(0, 6);

        let html = matches.length === 0 && val.length >= 3
            ? `<div class="sdo" data-val="${esc(input.value.trim())}"><strong>"${esc(input.value.trim())}"</strong><small> — cadastrar nova espécie</small></div>`
            : matches.map(m => {
                const cn = COMMON_NAMES[m];
                return `<div class="sdo" data-val="${esc(m)}"><strong>${esc(cn || m)}</strong>${cn ? `<small> ${m}</small>` : ''}</div>`;
            }).join('');

        results.innerHTML = html;
        results.classList.add('show');

        results.querySelectorAll('.sdo').forEach(d => {
            d.addEventListener('click', () => {
                const v = d.dataset.val;
                input.value = COMMON_NAMES[v] || v;
                hidden.value = v;
                results.classList.remove('show');
            });
        });
    });

    input.addEventListener('blur', () => {
        setTimeout(() => results.classList.remove('show'), 250);
        hidden.value = input.value.trim();
    });
}

function selectSpecies(name) {
    document.getElementById('especieSearch').value = COMMON_NAMES[name] || name;
    document.getElementById('especie').value = name;
}

function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

// ============================================================
// PHOTOS
// ============================================================
function upPhoto(n) { document.getElementById('photo' + n).click(); }

document.querySelectorAll('.photo-slot input[type="file"]').forEach(input => {
    input.addEventListener('change', e => {
        const file = e.target.files[0];
        if (!file) return;
        const n = input.id.replace('photo', '');
        const preview = document.getElementById('preview' + n);

        // Resize to max 600px to save localStorage space
        const reader = new FileReader();
        reader.onload = ev => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const max = 600;
                let w = img.width, h = img.height;
                if (w > max || h > max) {
                    if (w > h) { h = Math.round(h * max / w); w = max; }
                    else { w = Math.round(w * max / h); h = max; }
                }
                canvas.width = w;
                canvas.height = h;
                canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                const resized = canvas.toDataURL('image/jpeg', 0.7);
                preview.src = resized;
                preview.classList.add('show');
            };
            img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
    });
});

// ============================================================
// FORM STEPS
// ============================================================
function showStep(n) {
    document.querySelectorAll('.fs').forEach(s => s.classList.remove('active'));
    document.getElementById('step' + n)?.classList.add('active');

    document.querySelectorAll('.pdot').forEach(d => {
        const sn = parseInt(d.dataset.s);
        d.classList.remove('active', 'done');
        if (sn === n) d.classList.add('active');
        else if (sn < n) d.classList.add('done');
    });

    document.querySelectorAll('.plbl').forEach(l => {
        l.classList.toggle('active', parseInt(l.dataset.s) === n);
    });

    const fill = document.getElementById('progFill');
    if (fill) fill.style.width = `${(n / 6) * 100}%`;

    currentStep = n;
    if (n === 6) buildSummary();
}

function goStep(n) { showStep(n); }

document.querySelectorAll('.pdot').forEach(d => {
    d.addEventListener('click', () => showStep(parseInt(d.dataset.s)));
});

// ============================================================
// FORM DATA
// ============================================================
function getFormData() {
    const d = {};
    d.id = editingId || Date.now();
    d.latitude = document.getElementById('latitude')?.value || '';
    d.longitude = document.getElementById('longitude')?.value || '';
    d.logradouro = document.getElementById('logradouro')?.value || '';
    d.referencia = document.getElementById('referencia')?.value || '';
    d.localPlantio = document.querySelector('input[name="localPlantio"]:checked')?.value || '';
    d.especie = document.getElementById('especie')?.value || document.getElementById('especieSearch')?.value || '';
    d.certeza = document.querySelector('input[name="certeza"]:checked')?.value || '';
    d.porte = document.querySelector('input[name="porte"]:checked')?.value || '';
    d.tronco = document.querySelector('input[name="tronco"]:checked')?.value || '';
    d.porte2 = document.querySelector('input[name="porte2"]:checked')?.value || '';
    d.tronco2 = document.querySelector('input[name="tronco2"]:checked')?.value || '';

    // Photos
    d.fotos = [];
    for (let i = 1; i <= 5; i++) {
        const p = document.getElementById('preview' + i);
        d.fotos.push((p && p.classList.contains('show')) ? p.src : '');
    }
    d.fotoCount = d.fotos.filter(f => f).length;

    d.problemas = [...document.querySelectorAll('input[name="problemas"]:checked')].map(c => c.value);
    d.interferencia = [...document.querySelectorAll('input[name="interferencia"]:checked')].map(c => c.value);
    d.intervencao = document.querySelector('input[name="intervencao"]:checked')?.value || '';
    d.mesPoda = document.getElementById('mesPoda')?.value || '';
    d.dataUltimaPoda = document.getElementById('dataUltimaPoda')?.value || '';
    d.historicoPoda = document.getElementById('historicoPoda')?.value || '';
    d.observacoes = document.getElementById('observacoes')?.value || '';
    d.timestamp = editingId ? (trees.find(t => t.id === editingId)?.timestamp || Date.now()) : Date.now();
    d.dataAtualizacao = Date.now();

    const prob = d.problemas.length, inter = d.interferencia.length;
    if (d.intervencao === 'urgente' || prob >= 3 || d.problemas.includes('fungos')) d.status = 'critico';
    else if (prob >= 1 || inter >= 1 || d.intervencao === 'limpeza' || d.intervencao === 'adequacao') d.status = 'atencao';
    else d.status = 'saudavel';

    return d;
}

// ============================================================
// SUMMARY
// ============================================================
function buildSummary() {
    const d = getFormData();
    const labels = {
        local: { calcada: 'Calçada', praca: 'Praça/Parque', canteiro: 'Canteiro Central', privada: 'Propriedade Privada', verde: 'Área Verde' },
        porte: { pequeno: 'Pequeno (P)', medio: 'Médio (M)', grande: 'Grande (G)' },
        tronco: { fino: 'Fino (F)', medio: 'Médio (M)', grosso: 'Grosso (G)' },
        interv: { nenhuma: 'Nenhuma', limpeza: 'Poda de Limpeza', adequacao: 'Poda de Adequação', urgente: 'Risco de Queda' },
        mes: { jan:'Janeiro',fev:'Fevereiro',mar:'Marco',abr:'Abril',mai:'Maio',jun:'Junho',jul:'Julho',ago:'Agosto',set:'Setembro',out:'Outubro',nov:'Novembro',dez:'Dezembro' }
    };

    const rows = [
        ['Espécie', d.especie || 'Não identificada'],
        ['Local', labels.local[d.localPlantio] || '-'],
        ['Porte', labels.porte[d.porte] || labels.porte[d.porte2] || '-'],
        ['Tronco', labels.tronco[d.tronco] || labels.tronco[d.tronco2] || '-'],
        ['Fotos', `${d.fotoCount} registrada(s)`],
        ['Problemas', d.problemas.length ? `${d.problemas.length} item(s)` : 'Nenhum'],
        ['Intervenções', d.interferencia.length ? `${d.interferencia.length} item(s)` : 'Nenhuma'],
        ['Intervenção', labels.interv[d.intervencao] || '-'],
        ['Próxima Poda', labels.mes[d.mesPoda] || '-'],
        ['Última Poda', d.dataUltimaPoda || '-'],
        ['GPS', d.latitude ? `${parseFloat(d.latitude).toFixed(4)}, ${parseFloat(d.longitude).toFixed(4)}` : 'Não capturado']
    ];

    const el = document.getElementById('summaryContent');
    if (el) el.innerHTML = rows.map(([l, v]) =>
        `<div class="sum-row"><span class="sum-l">${l}</span><span class="sum-v">${v}</span></div>`
    ).join('');
}

// ============================================================
// SUBMIT
// ============================================================
function submitForm() {
    const data = getFormData();

    if (editingId) {
        const idx = trees.findIndex(t => t.id === editingId);
        if (idx !== -1) trees[idx] = data;
        editingId = null;
        syncToSheets(data, 'update');
    } else {
        trees.push(data);
        syncToSheets(data, 'create');
    }

    saveData();
    resetForm();
    navigateTo('pageDashboard');
    showToast('Árvore cadastrada com sucesso!');
}

function resetForm() {
    document.getElementById('treeForm')?.reset();
    document.getElementById('especieSearch').value = '';
    document.getElementById('especie').value = '';
    document.getElementById('latitude').value = '';
    document.getElementById('longitude').value = '';
    document.getElementById('captureGps')?.classList.remove('active', 'done');
    document.getElementById('gpsStatus').textContent = 'Toque para localizar';
    document.getElementById('dataUltimaPoda').value = '';
    for (let i = 1; i <= 5; i++) {
        const p = document.getElementById('preview' + i);
        if (p) { p.src = ''; p.classList.remove('show'); }
    }
    editingId = null;
    showStep(1);
}

// ============================================================
// RENDER ALL
// ============================================================
function renderAll() {
    renderStats();
    renderAlerts();
    renderMapMarkers();
    renderRecent();
}

// ============================================================
// STATS
// ============================================================
function renderStats() {
    const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
    set('totalTrees', trees.length);
    set('statSaudavel', trees.filter(t => t.status === 'saudavel').length);
    set('statAtencao', trees.filter(t => t.status === 'atencao').length);
    set('statCritico', trees.filter(t => t.status === 'critico').length);
}

// ============================================================
// ALERTS
// ============================================================
function renderAlerts() {
    const el = document.getElementById('alertArea');
    if (!el) return;

    const criticos = trees.filter(t => t.status === 'critico');
    const podas = trees.filter(t => t.intervencao === 'limpeza' || t.intervencao === 'adequacao');

    if (criticos.length === 0 && podas.length === 0) {
        el.innerHTML = '';
        return;
    }

    let html = '';
    if (criticos.length > 0) {
        html += `<div class="alert-card alert-red">
            <div class="alert-ico alert-ico-red">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 2L2 20h20L12 2z" fill="#C04A3A" fill-opacity="0.1" stroke="#C04A3A" stroke-width="1.5"/>
                    <path d="M12 9v5" stroke="#C04A3A" stroke-width="1.5"/>
                    <circle cx="12" cy="16.5" r="1" fill="#C04A3A"/>
                    <path d="M8 6l-1.5-2M16 6l1.5-2" stroke="#C04A3A" stroke-width="1" opacity="0.5"/>
                </svg>
            </div>
            <div class="alert-body">
                <div class="alert-title">Atenção: ${criticos.length} árvore(s) com risco</div>
                <div class="alert-desc">${criticos.length === 1 ? '1 árvore precisa de intervenção urgente' : `${criticos.length} árvores precisam de intervenção urgente`}</div>
            </div>
        </div>`;
    }
    if (podas.length > 0) {
        html += `<div class="alert-card alert-warm">
            <div class="alert-ico alert-ico-warm">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="4" y="5" width="16" height="15" rx="3" stroke="#A0522D" stroke-width="1.5" fill="none"/>
                    <path d="M4 10h16" stroke="#A0522D" stroke-width="1.2"/>
                    <path d="M9 3v4M15 3v4" stroke="#A0522D" stroke-width="1.5"/>
                    <path d="M12 14v3" stroke="#C0693A" stroke-width="1.2"/>
                    <path d="M10.5 15.5h3" stroke="#C0693A" stroke-width="1"/>
                    <circle cx="12" cy="13" r="0.8" fill="#C0693A" fill-opacity="0.5"/>
                </svg>
            </div>
            <div class="alert-body">
                <div class="alert-title">Podas do mês: ${podas.length} árvore(s)</div>
                <div class="alert-desc">${podas.length === 1 ? '1 árvore com poda agendada' : `${podas.length} árvores com poda agendada`}</div>
            </div>
        </div>`;
    }

    el.innerHTML = html;
}

// ============================================================
// RECENT
// ============================================================
function renderRecent() {
    const el = document.getElementById('recentList');
    if (!el) return;

    const sorted = [...trees].sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);

    if (sorted.length === 0) {
        el.innerHTML = `<div class="empty-state">
            <svg viewBox="0 0 60 80" width="48" height="64" fill="none">
                <path d="M30 72V38" stroke="#7A9444" stroke-width="1.5" stroke-linecap="round" opacity="0.3"/>
                <path d="M30 38C30 28 20 18 12 22C20 22 30 12 30 4C30 12 40 22 48 22C40 18 30 28 30 38Z" fill="#7A9444" fill-opacity="0.06" stroke="#7A9444" stroke-width="1" opacity="0.3"/>
                <ellipse cx="18" cy="62" rx="8" ry="4" fill="#C0693A" fill-opacity="0.05" stroke="#C0693A" stroke-width="0.7" opacity="0.2"/>
                <ellipse cx="42" cy="66" rx="6" ry="3" fill="#C0693A" fill-opacity="0.05" stroke="#C0693A" stroke-width="0.7" opacity="0.2"/>
            </svg>
            <p class="empty-title">Nenhum cadastro ainda</p>
            <p class="empty-desc">Toque em + para cadastrar a primeira árvore</p>
        </div>`;
        return;
    }

    el.innerHTML = sorted.map(t => {
        const statusClass = `st-${t.status}`;
        const photo = t.fotos?.[0] || '';
        const photoHtml = photo
            ? `<img src="${photo}" class="rc-photo" alt="${t.especie || ''}">`
            : `<svg viewBox="0 0 28 36" width="24" height="30" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 34V22" stroke="#7A9444" stroke-width="1.5" stroke-linecap="round"/>
                <path d="M14 22C14 17 10.5 12 7 13C10.5 13 14 8 14 4C14 8 17.5 13 21 13C17.5 12 14 17 14 22Z" fill="#7A9444" fill-opacity="0.2" stroke="#7A9444" stroke-width="1.2"/>
                <path d="M7 13C5 10.5 4 11 3 12" stroke="#7A9444" stroke-width="0.8" opacity="0.5"/>
                <path d="M21 13C23 10.5 24 11 25 12" stroke="#7A9444" stroke-width="0.8" opacity="0.5"/>
                <path d="M11 26c-1-0.5-2.2-0.1-2.7 0.3" stroke="#7A9444" stroke-width="0.7" opacity="0.4"/>
                <path d="M17 28c1-0.5 2.2-0.1 2.7 0.3" stroke="#7A9444" stroke-width="0.7" opacity="0.4"/>
                <circle cx="14" cy="4" r="1" fill="#7A9444" fill-opacity="0.4"/>
            </svg>`;

        return `<div class="rc" data-id="${t.id}">
            <div class="rc-ico ${statusClass}">${photoHtml}</div>
            <div class="rc-body">
                <div class="rc-name">${t.especie || 'Árvore sem nome'}</div>
                <div class="rc-addr">${t.logradouro || t.referencia || 'Sem endereço'}</div>
            </div>
            <div class="rc-arrow"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M7 5l5 5-5 5"/></svg></div>
        </div>`;
    }).join('');

    el.querySelectorAll('.rc').forEach(c => c.addEventListener('click', () => openModal(parseInt(c.dataset.id))));
}

// ============================================================
// CATALOG
// ============================================================
function renderCatalog() {
    const el = document.getElementById('catalogList');
    if (!el) return;

    const search = document.getElementById('catalogSearch')?.value?.toLowerCase() || '';
    const filter = document.querySelector('.filter.active')?.dataset?.filter || 'all';
    let filtered = trees;
    if (search) filtered = filtered.filter(t => (t.especie || '').toLowerCase().includes(search) || (t.logradouro || '').toLowerCase().includes(search));
    if (filter !== 'all') filtered = filtered.filter(t => t.status === filter);

    if (filtered.length === 0) {
        el.innerHTML = `<div class="empty-state">
            <svg viewBox="0 0 60 80" width="48" height="64" fill="none">
                <path d="M30 72V38" stroke="#7A9444" stroke-width="1.2" stroke-linecap="round" opacity="0.25"/>
                <path d="M30 38C30 28 20 18 12 22C20 22 30 12 30 4C30 12 40 22 48 22C40 18 30 28 30 38Z" fill="#7A9444" fill-opacity="0.05" stroke="#7A9444" stroke-width="0.8" opacity="0.25"/>
            </svg>
            <p class="empty-title">${search ? 'Nenhum resultado' : 'Nenhuma árvore ainda'}</p>
            <p class="empty-desc">${search ? 'Tente outro termo' : 'Cadastre a primeira árvore'}</p>
        </div>`;
        return;
    }

    el.innerHTML = filtered.map(t => {
        const statusClass = `st-${t.status}`;
        const photo = t.fotos?.[0] || '';
        const photoHtml = photo
            ? `<img src="${photo}" class="cc-photo" alt="${t.especie || ''}">`
            : `<svg viewBox="0 0 28 36" width="24" height="30" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 34V22" stroke="#7A9444" stroke-width="1.5"/>
                <path d="M14 22C14 17 10.5 12 7 13C10.5 13 14 8 14 4C14 8 17.5 13 21 13C17.5 12 14 17 14 22Z" fill="#7A9444" fill-opacity="0.2" stroke="#7A9444" stroke-width="1.2"/>
                <path d="M7 13C5 10.5 4 11 3 12" stroke="#7A9444" stroke-width="0.8" opacity="0.5"/>
                <path d="M21 13C23 10.5 24 11 25 12" stroke="#7A9444" stroke-width="0.8" opacity="0.5"/>
                <path d="M11 26c-1-0.5-2.2-0.1-2.7 0.3" stroke="#7A9444" stroke-width="0.7" opacity="0.4"/>
                <path d="M17 28c1-0.5 2.2-0.1 2.7 0.3" stroke="#7A9444" stroke-width="0.7" opacity="0.4"/>
                <circle cx="14" cy="4" r="1" fill="#7A9444" fill-opacity="0.4"/>
            </svg>`;

        return `<div class="cc" data-id="${t.id}">
            <div class="cc-ico ${statusClass}">${photoHtml}</div>
            <div class="cc-body">
                <div class="cc-name">${t.especie || 'Árvore sem nome'}</div>
                <div class="cc-addr">${t.logradouro || t.referencia || 'Sem endereço'}</div>
            </div>
            <div class="cc-arrow"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M7 5l5 5-5 5"/></svg></div>
        </div>`;
    }).join('');

    el.querySelectorAll('.cc').forEach(c => c.addEventListener('click', () => openModal(parseInt(c.dataset.id))));
}

function initCatalogSearch() { document.getElementById('catalogSearch')?.addEventListener('input', renderCatalog); }
function initFilters() {
    document.querySelectorAll('.filter').forEach(f => f.addEventListener('click', () => {
        document.querySelectorAll('.filter').forEach(x => x.classList.remove('active'));
        f.classList.add('active');
        renderCatalog();
    }));
}

// ============================================================
// MODAL
// ============================================================
function openModal(id) {
    const t = trees.find(x => x.id === id);
    if (!t) return;

    const statusLabels = { saudavel: 'Saudável', atencao: 'Atenção', crítico: 'Crítico', critico: 'Crítico' };
    const statusClass = `st-${t.status}`;
    const localLabels = { calcada:'Calçada', praca:'Praça/Parque', canteiro:'Canteiro Central', privada:'Propriedade Privada', verde:'Área Verde' };
    const porteLabels = { pequeno:'Pequeno (P)', medio:'Médio (M)', grande:'Grande (G)' };
    const troncoLabels = { fino:'Fino (F)', medio:'Médio (M)', grosso:'Grosso (G)' };
    const intervLabels = { nenhuma:'Nenhuma', limpeza:'Poda de Limpeza', adequacao:'Poda de Adequação', urgente:'Risco de Queda' };
    const mesLabels = { jan:'Janeiro',fev:'Fevereiro',mar:'Março',abr:'Abril',mai:'Maio',jun:'Junho',jul:'Julho',ago:'Agosto',set:'Setembro',out:'Outubro',nov:'Novembro',dez:'Dezembro' };
    const probLabels = { inclinacao:'Inclinação', rachaduras:'Rachaduras', fungos:'Fungos', pragas:'Pragas', broca:'Broca', galhos_secos:'Galhos secos', galhos_quebrados:'Galhos quebrados', ervas:'Erva-de-passarinho', calcada:'Danos à calçada', estrangulamento:'Estrangulamento' };
    const interfLabels = { eletrica:'Rede elétrica', iluminacao:'Iluminação', muros:'Muros/telhados', acessibilidade:'Acessibilidade' };

    const date = new Date(t.timestamp).toLocaleDateString('pt-BR', { day:'2-digit', month:'long', year:'numeric' });

    // Photos
    const photos = t.fotos || [];
    let photosHtml = '';
    if (photos.some(p => p)) {
        photosHtml = `<div class="modal-section">
            <div class="modal-section-title">Fotos</div>
            <div class="modal-photos">
                ${photos.map((p, i) => p ? `<div class="modal-photo-slot"><img src="${p}" class="modal-photo" alt="Foto ${i+1}"><span class="modal-photo-label">${['Árvore inteira','Tronco','Folhas','Flores','Danos'][i] || ''}</span></div>` : '').join('')}
            </div>
        </div>`;
    }

    let html = `
        <div class="modal-title">${t.especie || 'Árvore sem nome'}</div>
        <div class="modal-sub">${t.logradouro || t.referencia || 'Sem endereço'} · ${date}</div>
        <div class="modal-status ${statusClass}">
            <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke-linecap="round" stroke-linejoin="round">
                ${t.status === 'saudavel' 
                    ? '<circle cx="8" cy="8" r="6" stroke="#4E6B2E" stroke-width="1.2" fill="none"/><path d="M5 8l2 2 4-4" stroke="#4E6B2E" stroke-width="1.2"/>' 
                    : t.status === 'atencao' 
                        ? '<circle cx="8" cy="8" r="6" stroke="#C0693A" stroke-width="1.2" fill="none"/><path d="M8 5v3.5" stroke="#C0693A" stroke-width="1.2"/><circle cx="8" cy="11" r="0.7" fill="#C0693A"/>' 
                        : '<circle cx="8" cy="8" r="6" stroke="#B84433" stroke-width="1.2" fill="none"/><path d="M8 5v3.5" stroke="#B84433" stroke-width="1.2"/><circle cx="8" cy="11" r="0.7" fill="#B84433"/>'}
            </svg>
            ${statusLabels[t.status] || t.status}
        </div>

        <div class="modal-section">
            <div class="modal-section-title">Localização</div>
            <div class="modal-row"><span class="ml">Logradouro</span><span class="mv">${t.logradouro || '-'}</span></div>
            <div class="modal-row"><span class="ml">Referência</span><span class="mv">${t.referencia || '-'}</span></div>
            <div class="modal-row"><span class="ml">Local</span><span class="mv">${localLabels[t.localPlantio] || '-'}</span></div>
            <div class="modal-row"><span class="ml">GPS</span><span class="mv">${t.latitude ? `${parseFloat(t.latitude).toFixed(4)}, ${parseFloat(t.longitude).toFixed(4)}` : 'Não capturado'}</span></div>
        </div>

        <div class="modal-section">
            <div class="modal-section-title">Espécie</div>
            <div class="modal-row"><span class="ml">Nome</span><span class="mv">${t.especie || 'Não identificada'}</span></div>
            <div class="modal-row"><span class="ml">Certeza</span><span class="mv">${t.certeza === 'certeza' ? 'Tenho certeza' : t.certeza === 'palpite' ? 'Palpite' : t.certeza === 'nao_sei' ? 'Não sei' : '-'}</span></div>
            <div class="modal-row"><span class="ml">Porte</span><span class="mv">${porteLabels[t.porte] || porteLabels[t.porte2] || '-'}</span></div>
            <div class="modal-row"><span class="ml">Tronco</span><span class="mv">${troncoLabels[t.tronco] || troncoLabels[t.tronco2] || '-'}</span></div>
        </div>

        ${photosHtml}

        <div class="modal-section">
            <div class="modal-section-title">Condição</div>
            <div class="modal-row"><span class="ml">Problemas</span><span class="mv">${t.problemas?.length ? t.problemas.map(p => probLabels[p] || p).join(', ') : 'Nenhum'}</span></div>
            <div class="modal-row"><span class="ml">Intervenções</span><span class="mv">${t.interferencia?.length ? t.interferencia.map(i => interfLabels[i] || i).join(', ') : 'Nenhuma'}</span></div>
            <div class="modal-row"><span class="ml">Intervenção</span><span class="mv">${intervLabels[t.intervencao] || '-'}</span></div>
            <div class="modal-row"><span class="ml">Próxima Poda</span><span class="mv">${mesLabels[t.mesPoda] || '-'}</span></div>
            <div class="modal-row"><span class="ml">Última Poda</span><span class="mv">${t.dataUltimaPoda || '-'}</span></div>
        </div>
    `;

    if (t.observacoes) {
        html += `<div class="modal-section"><div class="modal-section-title">Observações</div><div style="font-size:0.82rem;color:#3D4A35;line-height:1.6">${t.observacoes}</div></div>`;
    }

    html += `<div class="modal-actions">
        <button class="btn-secondary" onclick="editTree(${t.id})">
            <svg viewBox="0 0 18 18" width="14" height="14" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <path d="M13 2l3 3-10 10H3v-3L13 2z" stroke="#4E6B2E" stroke-width="1.3"/>
                <path d="M11 4l3 3" stroke="#4E6B2E" stroke-width="1"/>
                <path d="M3 15h12" stroke="#7A9444" stroke-width="0.8" opacity="0.5"/>
            </svg>
            Editar
        </button>
        <button class="btn-danger" onclick="deleteTree(${t.id})">
            <svg viewBox="0 0 18 18" width="14" height="14" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 5h10" stroke="#C04A3A" stroke-width="1.3"/>
                <path d="M7 5V3.5h4V5" stroke="#C04A3A" stroke-width="1.2"/>
                <path d="M5 5v10h8V5" stroke="#C04A3A" stroke-width="1.2"/>
                <path d="M8 8v5M10 8v5" stroke="#C04A3A" stroke-width="0.8" opacity="0.7"/>
            </svg>
            Excluir
        </button>
    </div>`;

    document.getElementById('modalBody').innerHTML = html;
    document.getElementById('treeModal').classList.add('show');
}

function closeModal() { document.getElementById('treeModal').classList.remove('show'); }
document.getElementById('treeModal')?.addEventListener('click', e => { if (e.target.id === 'treeModal') closeModal(); });

// ============================================================
// EDIT
// ============================================================
function editTree(id) {
    const t = trees.find(x => x.id === id);
    if (!t) return;
    closeModal();
    editingId = id;

    document.getElementById('latitude').value = t.latitude || '';
    document.getElementById('longitude').value = t.longitude || '';
    document.getElementById('logradouro').value = t.logradouro || '';
    document.getElementById('referencia').value = t.referencia || '';

    if (t.localPlantio) { const r = document.querySelector(`input[name="localPlantio"][value="${t.localPlantio}"]`); if (r) r.checked = true; }
    document.getElementById('especieSearch').value = t.especie || '';
    document.getElementById('especie').value = t.especie || '';
    if (t.certeza) { const r = document.querySelector(`input[name="certeza"][value="${t.certeza}"]`); if (r) r.checked = true; }
    if (t.porte) { const r = document.querySelector(`input[name="porte"][value="${t.porte}"]`); if (r) r.checked = true; }
    if (t.tronco) { const r = document.querySelector(`input[name="tronco"][value="${t.tronco}"]`); if (r) r.checked = true; }
    if (t.porte2) { const r = document.querySelector(`input[name="porte2"][value="${t.porte2}"]`); if (r) r.checked = true; }
    if (t.tronco2) { const r = document.querySelector(`input[name="tronco2"][value="${t.tronco2}"]`); if (r) r.checked = true; }
    if (t.problemas) t.problemas.forEach(p => { const r = document.querySelector(`input[name="problemas"][value="${p}"]`); if (r) r.checked = true; });
    if (t.interferencia) t.interferencia.forEach(i => { const r = document.querySelector(`input[name="interferencia"][value="${i}"]`); if (r) r.checked = true; });
    if (t.intervencao) { const r = document.querySelector(`input[name="intervencao"][value="${t.intervencao}"]`); if (r) r.checked = true; }
    document.getElementById('mesPoda').value = t.mesPoda || '';
    document.getElementById('dataUltimaPoda').value = t.dataUltimaPoda || '';
    document.getElementById('historicoPoda').value = t.historicoPoda || '';
    document.getElementById('observacoes').value = t.observacoes || '';

    // Restore photos
    const fotos = t.fotos || [];
    for (let i = 1; i <= 5; i++) {
        const p = document.getElementById('preview' + i);
        if (p && fotos[i-1]) { p.src = fotos[i-1]; p.classList.add('show'); }
    }

    if (t.latitude && t.longitude) {
        document.getElementById('captureGps')?.classList.add('done');
        document.getElementById('gpsStatus').textContent = `${parseFloat(t.latitude).toFixed(5)}, ${parseFloat(t.longitude).toFixed(5)}`;
    }

    navigateTo('pageForm');
    showStep(1);
}

// ============================================================
// DELETE
// ============================================================
function deleteTree(id) {
    if (!confirm('Tem certeza que deseja excluir este registro?')) return;
    const tree = trees.find(t => t.id === id);
    trees = trees.filter(t => t.id !== id);
    saveData();
    if (tree) syncToSheets(tree, 'delete');
    closeModal();
    renderAll();
    showToast('Registro excluído');
}

// ============================================================
// STORAGE
// ============================================================
function saveData() { localStorage.setItem(DB_KEY, JSON.stringify(trees)); }

// ============================================================
// GOOGLE SHEETS SYNC
// ============================================================
async function syncToSheets(data, action) {
    if (!SHEETS_URL) return;
    const payload = {
        action,
        id: data.id,
        data: {
            ...data,
            foto1: data.fotos?.[0] || '',
            foto2: data.fotos?.[1] || '',
            foto3: data.fotos?.[2] || '',
            foto4: data.fotos?.[3] || '',
            foto5: data.fotos?.[4] || '',
            fotos: undefined
        }
    };
    try {
        await fetch(SHEETS_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    } catch (e) { /* ok */ }
}

// ============================================================
// TOAST
// ============================================================
function showToast(msg) {
    const t = document.getElementById('toast'), m = document.getElementById('toastMsg');
    if (!t || !m) return;
    m.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2800);
}

document.getElementById('fabAdd')?.addEventListener('click', () => navigateTo('pageForm'));
