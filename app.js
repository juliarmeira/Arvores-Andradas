const DB_KEY = 'arbore_andradas_v4';
const SHEETS_URL = '';

const TREE_ICONS_POOL = [
    'tree-pine',
    'tree-deciduous',
    'tree-palm',
    'flower-2',
    'leaf',
    'sprout',
    'trees'
];

function getTreeIcon(id) {
    var idx = parseInt(id) % TREE_ICONS_POOL.length;
    return TREE_ICONS_POOL[idx];
}

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
    'Croton floribundus','Cupania vernalis','Cyathea delgadii',
    'Cymbopogon citratus','Daphnopsis fasciculata','Dendrocalamus asper','Dipteryx alata',
    'Dyssochroma viridiflorum','Eriobotrya japonica','Erythrina speciosa','Eschweilera ovata',
    'Eugenia uniflora','Eugenia pyriformis','Eugenia involucrata','Eugenia javanica',
    'Ficus benjamina','Ficus elastica','Ficus microcarpa','Ficus obtusifolia',
    'Fraxinus uhdei','Garcinia gardneriana','Gleditsia amorphoides','Gochnatia polymorpha',
    'Guarea trichilioides','Guarea guidonia','Guazuma ulmifolia',
    'Handroanthus chrysotrichus','Handroanthus impetiginosus','Handroanthus albus','Hymenaea courbaril',
    'Inga vera','Jacaranda mimosifolia','Lafoensia glyptocarpa','Lagerstroemia indica',
    'Libidibia ferrea','Ligustrum lucidum',
    'Lithraea molleoides','Luehea candicans','Maackia amurensis','Mangifera indica',
    'Maytenus evonymoides','Melia azedarach','Metrodorea nigra','Mimosa bimucronata',
    'Mimusops communis','Mollinedia schottiana','Monteverdia gonoclada','Myracrodruon urundeuva',
    'Nectandra megapotamica','Nectandra oppositifolia',
    'Ocimum gratissimum','Ocotea pulchella','Ocotea puberula','Olea europaea',
    'Parapiptadenia rigida','Peltogyne paivaeana','Peltophorum dubium','Pera glabrata',
    'Phoenix canariensis','Phyllanthus tenellus','Piper aduncum','Plathymenia reticulata',
    'Platanus hispanica','Poincianella pluviosa','Pontidendron pinnatum',
    'Pouteria torta','Psidium cattleyanum','Psidium guajava','Psidium guineense',
    'Pterocarpus macrocarpus','Pterogyne nitens','Qualea grandiflora',
    'Rauvolfia sellowii','Retiniphyllum concolor','Rhamnidium elaeocarpum',
    'Richeria grandis','Ricinus communis','Robinia pseudoacacia','Rollinia mucosa',
    'Ruprechtia laxiflora','Salix humboldtiana','Schinus terebinthifolia',
    'Schizolobium parahyba','Senna multijuga','Sideroxylon obtusifolium','Simarouba amara',
    'Solanum lycocarpum','Spathodea campanulata','Syagrus romanzoffiana',
    'Tabebuia alba','Tabebuia roseoalba','Tabebuia vellosoi','Tabernaemontana catharinensis',
    'Tipuana tipu','Tibouchina granulosa','Trema micrantha','Trichilia elegans','Trichilia pallida',
    'Trophis racemosa','Urera baccifera',
    'Vernonia ferruginea','Viburnum nudum','Vitex polyneura',
    'Vochysia magnifica','Vochysia tucanorum','Xylosma ciliatifolia',
    'Zanthoxylum rhoifolium','Zeyheria tuberculosa','Zingiber officinale','Zollernia ilicifolia'
];

const COMMON_NAMES = {
    'Tipuana tipu': 'Ipê-amarelo / Tipuana',
    'Mangifera indica': 'Mangueira',
    'Handroanthus albus': 'Ipê-amarelo',
    'Handroanthus impetiginosus': 'Ipê-roxo',
    'Handroanthus chrysotrichus': 'Ipê-amarelo',
    'Jacaranda mimosifolia': 'Jacarandá',
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
    'Croton floribundus': 'Sangue-de-dragão',
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
    'Albizia lebbek': 'Sicomoro'
};

let trees = JSON.parse(localStorage.getItem(DB_KEY)) || [];
let map = null;
let markers = {};
let currentStep = 1;
let editingId = null;
let mapFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initMap();
    initGPS();
    initSpeciesSearch();
    initPhotoInputs();
    initCatalogSearch();
    initFilters();
    initMapFilters();
    initFormSubmit();
    loadMockData();
    trees = JSON.parse(localStorage.getItem(DB_KEY)) || [];
    renderAll();
    lucide.createIcons();
});

function initNavigation() {
    document.querySelectorAll('.bnav-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const pageId = btn.dataset.page;
            if (pageId) navigateTo(pageId);
        });
    });
}

function navigateTo(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(pageId);
    if (target) target.classList.add('active');

    document.querySelectorAll('.bnav-item').forEach(b => {
        b.classList.remove('active');
        b.querySelectorAll('i, span').forEach(el => el.style.color = '');
    });

    const activeBtn = document.querySelector(`.bnav-item[data-page="${pageId}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
        activeBtn.querySelectorAll('i, span').forEach(el => el.style.color = '');
        const icon = activeBtn.querySelector('i');
        if (icon && !activeBtn.classList.contains('bnav-center')) icon.style.color = '#4E6B2E';
        const span = activeBtn.querySelector('span');
        if (span && !activeBtn.classList.contains('bnav-center')) span.style.color = '#4E6B2E';
    }

    if (pageId === 'pageDashboard' && map) setTimeout(() => map.invalidateSize(), 150);
    if (pageId === 'pageCatalog') renderCatalog();
    if (pageId === 'pageForm') {
        if (!editingId) { currentStep = 1; }
        showStep(currentStep);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => lucide.createIcons(), 50);
}

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

function createTreeIcon(color) {
    return L.divIcon({
        className: '',
        html: '<div style="width:10px;height:10px;background:' + color + ';border-radius:50%;border:1.5px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.2);"></div>',
        iconSize: [10, 10],
        iconAnchor: [5, 5],
        popupAnchor: [0, -8]
    });
}

function renderMapMarkers() {
    if (!map) return;
    Object.values(markers).forEach(m => map.removeLayer(m));
    markers = {};

    trees.forEach(t => {
        if (!t.latitude || !t.longitude) return;

        if (mapFilter !== 'all' && t.status !== mapFilter) return;

        var colors = { saudavel: '#7A9444', atencao: '#C0693A', critico: '#B84433' };
        var color = colors[t.status] || '#7A9444';
        var icon = createTreeIcon(color);

        var marker = L.marker([parseFloat(t.latitude), parseFloat(t.longitude)], { icon: icon }).addTo(map);

        var photo = (t.fotos && t.fotos[0]) ? t.fotos[0] : '';
        var photoHtml = photo
            ? '<img src="' + photo + '" style="width:100%;height:80px;object-fit:cover;border-radius:10px;" alt="">'
            : '';

        var statusLabels = { saudavel: 'Saudavel', atencao: 'Atencao', critico: 'Critico' };

        marker.bindPopup(
            '<div style="padding:12px;display:flex;flex-direction:column;gap:8px;min-width:200px;">' +
            photoHtml +
            '<div><strong style="font-family:Playfair Display,serif;font-style:italic;font-size:0.9rem;color:#1A2215;">' + (t.especie || 'Arvore') + '</strong><br>' +
            '<small style="font-size:0.72rem;color:#6B7560;">' + (t.logradouro || t.referencia || 'Sem endereco') + '</small></div>' +
            '<div style="display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:50px;font-size:0.65rem;font-weight:700;background:' + color + '15;color:' + color + ';width:fit-content;">' + (statusLabels[t.status] || '-') + '</div>' +
            '<button onclick="closePopups();openModal(' + t.id + ')" style="width:100%;padding:8px;border:none;border-radius:10px;background:#4E6B2E;color:white;font-family:Nunito,sans-serif;font-size:0.75rem;font-weight:700;cursor:pointer;">Ver detalhes</button>' +
            '</div>',
            { closeButton: false, maxWidth: 260 }
        );

        markers[t.id] = marker;
    });
}

function closePopups() { if (map) map.closePopup(); }

function initGPS() {
    var btn = document.getElementById('captureGps');
    if (!btn) return;

    btn.addEventListener('click', function() {
        if (!navigator.geolocation) {
            document.getElementById('gpsStatus').textContent = 'GPS nao disponivel';
            return;
        }
        btn.style.borderColor = '#4E6B2E';
        btn.style.borderStyle = 'solid';
        document.getElementById('gpsStatus').textContent = 'Obtendo localizacao...';

        navigator.geolocation.getCurrentPosition(
            function(pos) {
                var lat = pos.coords.latitude;
                var lng = pos.coords.longitude;
                document.getElementById('latitude').value = lat.toFixed(6);
                document.getElementById('longitude').value = lng.toFixed(6);
                document.getElementById('gpsStatus').textContent = lat.toFixed(5) + ', ' + lng.toFixed(5);
                btn.style.borderColor = '#7A9444';
                btn.style.background = 'rgba(122,148,68,0.06)';

                fetch('https://nominatim.openstreetmap.org/reverse?lat=' + lat + '&lon=' + lng + '&format=json&addressdetails=1&accept-language=pt')
                    .then(function(r) { return r.json(); })
                    .then(function(d) {
                        if (d.address) {
                            var a = d.address;
                            var parts = [a.road, a.neighbourhood, a.suburb, a.city || a.town, a.state].filter(Boolean);
                            document.getElementById('logradouro').value = parts.join(', ');
                        }
                    })
                    .catch(function() {});

                if (map) map.setView([lat, lng], 16);
            },
            function() {
                document.getElementById('gpsStatus').textContent = 'Erro ao obter localizacao';
                btn.style.borderColor = '#C0693A';
            },
            { enableHighAccuracy: true, timeout: 15000 }
        );
    });
}

function initSpeciesSearch() {
    var input = document.getElementById('especieSearch');
    var results = document.getElementById('especieResults');
    var hidden = document.getElementById('especie');
    if (!input || !results) return;

    input.addEventListener('input', function() {
        var val = input.value.trim().toLowerCase();
        if (val.length < 2) { results.classList.remove('show'); results.innerHTML = ''; return; }

        var matches = SPECIES_DB.filter(function(s) {
            var cn = COMMON_NAMES[s] || '';
            return s.toLowerCase().indexOf(val) !== -1 || cn.toLowerCase().indexOf(val) !== -1;
        }).slice(0, 6);

        var html = '';
        if (matches.length === 0 && val.length >= 3) {
            html = '<div class="sdo" data-val="' + esc(input.value.trim()) + '"><strong>' + esc(input.value.trim()) + '</strong> <small>cadastrar nova especie</small></div>';
        } else {
            html = matches.map(function(m) {
                var cn = COMMON_NAMES[m];
                return '<div class="sdo" data-val="' + esc(m) + '"><strong>' + esc(cn || m) + '</strong>' + (cn ? ' <small>' + m + '</small>' : '') + '</div>';
            }).join('');
        }

        results.innerHTML = html;
        results.classList.add('show');

        results.querySelectorAll('.sdo').forEach(function(d) {
            d.addEventListener('click', function() {
                var v = d.dataset.val;
                input.value = COMMON_NAMES[v] || v;
                hidden.value = v;
                results.classList.remove('show');
    });
});

function openModal(id) {
    var t = trees.find(function(x) { return x.id === id; });
    if (!t) return;

    var statusLabels = { saudavel: 'Saudavel', atencao: 'Atencao', critico: 'Critico' };
    var statusColors = { saudavel: '#4E6B2E', atencao: '#C0693A', critico: '#B84433' };
    var color = statusColors[t.status] || '#4E6B2E';
    var localLabels = { calcada: 'Calcada', praca: 'Praca/Parque', canteiro: 'Canteiro Central', privada: 'Propriedade Privada', verde: 'Area Verde' };
    var porteLabels = { pequeno: 'Pequeno (P)', medio: 'Medio (M)', grande: 'Grande (G)' };
    var troncoLabels = { fino: 'Fino (F)', medio: 'Medio (M)', grosso: 'Grosso (G)' };
    var intervLabels = { nenhuma: 'Nenhuma', limpeza: 'Poda de Limpeza', adequacao: 'Poda de Adequacao', urgente: 'Risco de Queda' };
    var mesLabels = { '1': 'Janeiro', '2': 'Fevereiro', '3': 'Marco', '4': 'Abril', '5': 'Maio', '6': 'Junho', '7': 'Julho', '8': 'Agosto', '9': 'Setembro', '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro' };
    var probLabels = { inclinacao: 'Inclinacao', rachaduras: 'Rachaduras', fungos: 'Fungos', pragas: 'Pragas', broca: 'Broca', galhos_secos: 'Galhos secos', galhos_quebrados: 'Galhos quebrados', ervas: 'Erva-de-passarinho', calcada: 'Danos a calcada', estrangulamento: 'Estrangulamento' };
    var interfLabels = { eletrica: 'Rede eletrica', iluminacao: 'Iluminacao', muros: 'Muros/telhados', acessibilidade: 'Acessibilidade' };

    var date = new Date(t.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

    var photos = t.fotos || [];
    var photosHtml = '';
    if (photos.some(function(p) { return p; })) {
        var labels = ['Arvore inteira', 'Tronco', 'Folhas', 'Flores', 'Danos'];
        photosHtml = '<div style="background:white;border-radius:14px;padding:14px 16px;margin-bottom:10px;box-shadow:0 4px 24px rgba(26,34,21,0.06);">' +
            '<div style="font-size:0.66rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#7A9444;margin-bottom:8px;">Fotos</div>' +
            '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">' +
            photos.map(function(p, i) {
                if (!p) return '';
                return '<div style="display:flex;flex-direction:column;align-items:center;gap:4px;">' +
                    '<img src="' + p + '" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:10px;border:1.5px solid rgba(122,148,68,0.1);" alt="">' +
                    '<span style="font-size:0.58rem;font-weight:600;color:#6B7560;text-transform:uppercase;">' + (labels[i] || '') + '</span></div>';
            }).join('') +
            '</div></div>';
    }

    var html = '<div style="font-family:Playfair Display,serif;font-style:italic;font-size:1.3rem;color:#4E6B2E;font-weight:700;margin-bottom:4px;padding-right:40px;">' + (t.especie || 'Arvore sem nome') + '</div>' +
        '<div style="font-size:0.76rem;color:#6B7560;margin-bottom:14px;">' + (t.logradouro || t.referencia || 'Sem endereco') + ' &middot; ' + date + '</div>' +
        '<div style="display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:50px;font-size:0.68rem;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:16px;background:' + color + '15;color:' + color + ';">' + (statusLabels[t.status] || t.status) + '</div>';

    html += '<div style="background:white;border-radius:14px;padding:14px 16px;margin-bottom:10px;box-shadow:0 4px 24px rgba(26,34,21,0.06);">' +
        '<div style="font-size:0.66rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#7A9444;margin-bottom:8px;">Localizacao</div>' +
        '<div style="display:flex;justify-content:space-between;padding:5px 0;font-size:0.78rem;border-bottom:1px solid rgba(158,171,87,0.06);"><span style="color:#6B7560;">Logradouro</span><span style="font-weight:700;text-align:right;">' + (t.logradouro || '-') + '</span></div>' +
        '<div style="display:flex;justify-content:space-between;padding:5px 0;font-size:0.78rem;border-bottom:1px solid rgba(158,171,87,0.06);"><span style="color:#6B7560;">Referencia</span><span style="font-weight:700;text-align:right;">' + (t.referencia || '-') + '</span></div>' +
        '<div style="display:flex;justify-content:space-between;padding:5px 0;font-size:0.78rem;border-bottom:1px solid rgba(158,171,87,0.06);"><span style="color:#6B7560;">Local</span><span style="font-weight:700;text-align:right;">' + (localLabels[t.localPlantio] || '-') + '</span></div>' +
        '<div style="display:flex;justify-content:space-between;padding:5px 0;font-size:0.78rem;"><span style="color:#6B7560;">GPS</span><span style="font-weight:700;text-align:right;">' + (t.latitude ? parseFloat(t.latitude).toFixed(4) + ', ' + parseFloat(t.longitude).toFixed(4) : 'Nao capturado') + '</span></div>' +
        '</div>';

    html += '<div style="background:white;border-radius:14px;padding:14px 16px;margin-bottom:10px;box-shadow:0 4px 24px rgba(26,34,21,0.06);">' +
        '<div style="font-size:0.66rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#7A9444;margin-bottom:8px;">Especie</div>' +
        '<div style="display:flex;justify-content:space-between;padding:5px 0;font-size:0.78rem;border-bottom:1px solid rgba(158,171,87,0.06);"><span style="color:#6B7560;">Nome</span><span style="font-weight:700;text-align:right;">' + (t.especie || 'Nao identificada') + '</span></div>' +
        '<div style="display:flex;justify-content:space-between;padding:5px 0;font-size:0.78rem;border-bottom:1px solid rgba(158,171,87,0.06);"><span style="color:#6B7560;">Porte</span><span style="font-weight:700;text-align:right;">' + (porteLabels[t.porte] || '-') + '</span></div>' +
        '<div style="display:flex;justify-content:space-between;padding:5px 0;font-size:0.78rem;"><span style="color:#6B7560;">Tronco</span><span style="font-weight:700;text-align:right;">' + (troncoLabels[t.tronco] || '-') + '</span></div>' +
        '</div>';

    html += photosHtml;

    html += '<div style="background:white;border-radius:14px;padding:14px 16px;margin-bottom:10px;box-shadow:0 4px 24px rgba(26,34,21,0.06);">' +
        '<div style="font-size:0.66rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#7A9444;margin-bottom:8px;">Condicao</div>' +
        '<div style="display:flex;justify-content:space-between;padding:5px 0;font-size:0.78rem;border-bottom:1px solid rgba(158,171,87,0.06);"><span style="color:#6B7560;">Problemas</span><span style="font-weight:700;text-align:right;">' + (t.problemas && t.problemas.length ? t.problemas.map(function(p) { return probLabels[p] || p; }).join(', ') : 'Nenhum') + '</span></div>' +
        '<div style="display:flex;justify-content:space-between;padding:5px 0;font-size:0.78rem;border-bottom:1px solid rgba(158,171,87,0.06);"><span style="color:#6B7560;">Interferencias</span><span style="font-weight:700;text-align:right;">' + (t.interferencia && t.interferencia.length ? t.interferencia.map(function(i) { return interfLabels[i] || i; }).join(', ') : 'Nenhuma') + '</span></div>' +
        '<div style="display:flex;justify-content:space-between;padding:5px 0;font-size:0.78rem;border-bottom:1px solid rgba(158,171,87,0.06);"><span style="color:#6B7560;">Intervencao</span><span style="font-weight:700;text-align:right;">' + (intervLabels[t.intervencao] || '-') + '</span></div>' +
        '<div style="display:flex;justify-content:space-between;padding:5px 0;font-size:0.78rem;border-bottom:1px solid rgba(158,171,87,0.06);"><span style="color:#6B7560;">Proxima Poda</span><span style="font-weight:700;text-align:right;">' + (mesLabels[t.mesPoda] || '-') + '</span></div>' +
        '<div style="display:flex;justify-content:space-between;padding:5px 0;font-size:0.78rem;"><span style="color:#6B7560;">Ultima Poda</span><span style="font-weight:700;text-align:right;">' + (t.dataUltimaPoda || '-') + '</span></div>' +
        '</div>';

    if (t.observacoes) {
        html += '<div style="background:white;border-radius:14px;padding:14px 16px;margin-bottom:10px;box-shadow:0 4px 24px rgba(26,34,21,0.06);"><div style="font-size:0.66rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#7A9444;margin-bottom:8px;">Observacoes</div><div style="font-size:0.82rem;color:#3D4A35;line-height:1.6;">' + t.observacoes + '</div></div>';
    }

    html += '<div style="display:flex;gap:10px;margin-top:16px;">' +
        '<button onclick="editTree(' + t.id + ')" style="flex:1;padding:14px 24px;border:1.5px solid rgba(158,171,87,0.2);border-radius:50px;background:white;color:#4E6B2E;font-family:Nunito,sans-serif;font-size:0.88rem;font-weight:700;cursor:pointer;">Editar</button>' +
        '<button onclick="deleteTree(' + t.id + ')" style="flex:0 0 auto;padding:14px 20px;background:rgba(192,74,58,0.06);color:#B84433;border:1.5px solid rgba(192,74,58,0.15);border-radius:50px;font-family:Nunito,sans-serif;font-size:0.88rem;font-weight:700;cursor:pointer;">Excluir</button>' +
        '</div>';

    document.getElementById('modalBody').innerHTML = html;
    var modal = document.getElementById('treeModal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeModal() {
    var modal = document.getElementById('treeModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

var treeModal = document.getElementById('treeModal');
if (treeModal) {
    treeModal.addEventListener('click', function(e) {
        if (e.target.id === 'treeModal') closeModal();
    });
}

function editTree(id) {
    var t = trees.find(function(x) { return x.id === id; });
    if (!t) return;
    closeModal();
    editingId = id;

    document.getElementById('latitude').value = t.latitude || '';
    document.getElementById('longitude').value = t.longitude || '';
    document.getElementById('logradouro').value = t.logradouro || '';
    document.getElementById('referencia').value = t.referencia || '';

    if (t.localPlantio) { var r = document.querySelector('input[name="localPlantio"][value="' + t.localPlantio + '"]'); if (r) r.checked = true; }
    document.getElementById('especieSearch').value = t.especie || '';
    document.getElementById('especie').value = t.especie || '';
    if (t.certeza) { var r2 = document.querySelector('input[name="certeza"][value="' + t.certeza + '"]'); if (r2) r2.checked = true; }
    if (t.porte) { var r3 = document.querySelector('input[name="porte"][value="' + t.porte + '"]'); if (r3) r3.checked = true; }
    if (t.tronco) { var r4 = document.querySelector('input[name="tronco"][value="' + t.tronco + '"]'); if (r4) r4.checked = true; }
    if (t.problemas) t.problemas.forEach(function(p) { var r5 = document.querySelector('input[name="problemas"][value="' + p + '"]'); if (r5) r5.checked = true; });
    if (t.interferencia) t.interferencia.forEach(function(i) { var r6 = document.querySelector('input[name="interferencia"][value="' + i + '"]'); if (r6) r6.checked = true; });
    if (t.intervencao) { var r7 = document.querySelector('input[name="intervencao"][value="' + t.intervencao + '"]'); if (r7) r7.checked = true; }
    if (t.mesPoda) { var r8 = document.querySelector('input[name="mesPoda"][value="' + t.mesPoda + '"]'); if (r8) r8.checked = true; }
    document.getElementById('dataUltimaPoda').value = t.dataUltimaPoda || '';
    document.getElementById('observacoes').value = t.observacoes || '';

    var fotos = t.fotos || [];
    for (var i = 1; i <= 5; i++) {
        var p = document.getElementById('preview' + i);
        if (p && fotos[i - 1]) { p.src = fotos[i - 1]; p.classList.remove('hidden'); p.classList.add('block'); }
    }

    if (t.latitude && t.longitude) {
        var gps = document.getElementById('captureGps');
        if (gps) { gps.style.borderColor = '#7A9444'; gps.style.borderStyle = 'solid'; }
        document.getElementById('gpsStatus').textContent = parseFloat(t.latitude).toFixed(5) + ', ' + parseFloat(t.longitude).toFixed(5);
    }

    navigateTo('pageForm');
    showStep(1);
}

function deleteTree(id) {
    if (!confirm('Tem certeza que deseja excluir este registro?')) return;
    var tree = trees.find(function(t) { return t.id === id; });
    trees = trees.filter(function(t) { return t.id !== id; });
    saveData();
    if (tree) syncToSheets(tree, 'delete');
    closeModal();
    renderAll();
    showToast('Registro excluido');
}

function saveData() {
    localStorage.setItem(DB_KEY, JSON.stringify(trees));
}

function syncToSheets(data, action) {
    if (!SHEETS_URL) return;
    var payload = {
        action: action,
        id: data.id,
        data: Object.assign({}, data, {
            foto1: (data.fotos && data.fotos[0]) || '',
            foto2: (data.fotos && data.fotos[1]) || '',
            foto3: (data.fotos && data.fotos[2]) || '',
            foto4: (data.fotos && data.fotos[3]) || '',
            foto5: (data.fotos && data.fotos[4]) || '',
            fotos: undefined
        })
    };
    fetch(SHEETS_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    }).catch(function() {});
}

function showToast(msg) {
    var t = document.getElementById('toast');
    var m = document.getElementById('toastMsg');
    if (!t || !m) return;
    m.textContent = msg;
    t.classList.remove('hidden');
    t.classList.add('block');
    setTimeout(function() {
        t.classList.add('hidden');
        t.classList.remove('block');
    }, 2800);
}
    });

    input.addEventListener('blur', function() {
        setTimeout(function() { results.classList.remove('show'); }, 250);
        hidden.value = input.value.trim();
    });
}

function selectSpecies(name) {
    var searchInput = document.getElementById('especieSearch');
    var hiddenInput = document.getElementById('especie');
    if (searchInput) searchInput.value = COMMON_NAMES[name] || name;
    if (hiddenInput) hiddenInput.value = name;
}

function esc(s) {
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
}

function initPhotoInputs() {
    document.querySelectorAll('input[type="file"][id^="photo"]').forEach(function(input) {
        input.addEventListener('change', function(e) {
            var file = e.target.files[0];
            if (!file) return;
            var n = input.id.replace('photo', '');
            var preview = document.getElementById('preview' + n);

            var reader = new FileReader();
            reader.onload = function(ev) {
                var img = new Image();
                img.onload = function() {
                    var canvas = document.createElement('canvas');
                    var max = 600;
                    var w = img.width, h = img.height;
                    if (w > max || h > max) {
                        if (w > h) { h = Math.round(h * max / w); w = max; }
                        else { w = Math.round(w * max / h); h = max; }
                    }
                    canvas.width = w;
                    canvas.height = h;
                    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                    var resized = canvas.toDataURL('image/jpeg', 0.7);
                    if (preview) {
                        preview.src = resized;
                        preview.classList.remove('hidden');
                        preview.classList.add('block');
                    }
                };
                img.src = ev.target.result;
            };
            reader.readAsDataURL(file);
        });
    });
}

function upPhoto(n) {
    var input = document.getElementById('photo' + n);
    if (input) input.click();
}

function showStep(n) {
    document.querySelectorAll('.fs').forEach(function(s) { s.classList.remove('active'); });
    var step = document.getElementById('step' + n);
    if (step) step.classList.add('active');

    var fill = document.getElementById('progFill');
    if (fill) fill.style.width = ((n / 5) * 100) + '%';

    document.querySelectorAll('[data-s]').forEach(function(el) {
        var sn = parseInt(el.dataset.s);
        if (sn === n) {
            el.style.color = '#4E6B2E';
            el.style.fontWeight = '700';
        } else if (sn < n) {
            el.style.color = '#7A9444';
            el.style.fontWeight = '600';
        } else {
            el.style.color = 'rgba(26,34,21,0.3)';
            el.style.fontWeight = '700';
        }
    });

    currentStep = n;
}

function goStep(n) { showStep(n); }

function getFormData() {
    var d = {};
    d.id = editingId || Date.now();
    d.latitude = document.getElementById('latitude') ? document.getElementById('latitude').value : '';
    d.longitude = document.getElementById('longitude') ? document.getElementById('longitude').value : '';
    d.logradouro = document.getElementById('logradouro') ? document.getElementById('logradouro').value : '';
    d.referencia = document.getElementById('referencia') ? document.getElementById('referencia').value : '';
    d.localPlantio = (document.querySelector('input[name="localPlantio"]:checked') || {}).value || '';
    d.especie = (document.getElementById('especie') ? document.getElementById('especie').value : '') || (document.getElementById('especieSearch') ? document.getElementById('especieSearch').value : '');
    d.certeza = (document.querySelector('input[name="certeza"]:checked') || {}).value || '';
    d.porte = (document.querySelector('input[name="porte"]:checked') || {}).value || '';
    d.tronco = (document.querySelector('input[name="tronco"]:checked') || {}).value || '';

    d.fotos = [];
    for (var i = 1; i <= 5; i++) {
        var p = document.getElementById('preview' + i);
        d.fotos.push((p && !p.classList.contains('hidden') && p.src) ? p.src : '');
    }
    d.fotoCount = d.fotos.filter(function(f) { return f; }).length;

    d.problemas = Array.from(document.querySelectorAll('input[name="problemas"]:checked')).map(function(c) { return c.value; });
    d.interferencia = Array.from(document.querySelectorAll('input[name="interferencia"]:checked')).map(function(c) { return c.value; });
    d.intervencao = (document.querySelector('input[name="intervencao"]:checked') || {}).value || '';
    d.mesPoda = (document.querySelector('input[name="mesPoda"]:checked') || {}).value || '';
    d.dataUltimaPoda = document.getElementById('dataUltimaPoda') ? document.getElementById('dataUltimaPoda').value : '';
    d.observacoes = document.getElementById('observacoes') ? document.getElementById('observacoes').value : '';
    d.timestamp = editingId ? (trees.find(function(t) { return t.id === editingId; }) || {}).timestamp || Date.now() : Date.now();
    d.dataAtualizacao = Date.now();

    var prob = d.problemas.length;
    var inter = d.interferencia.length;
    if (d.intervencao === 'urgente' || prob >= 3 || d.problemas.indexOf('fungos') !== -1) d.status = 'critico';
    else if (prob >= 1 || inter >= 1 || d.intervencao === 'limpeza' || d.intervencao === 'adequacao') d.status = 'atencao';
    else d.status = 'saudavel';

    return d;
}

function initFormSubmit() {
    var form = document.getElementById('treeForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            submitForm();
        });
    }
}

function submitForm() {
    var data = getFormData();

    if (editingId) {
        var idx = trees.findIndex(function(t) { return t.id === editingId; });
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
    showToast('Arvore cadastrada com sucesso!');
}

function resetForm() {
    var form = document.getElementById('treeForm');
    if (form) form.reset();
    var es = document.getElementById('especieSearch');
    if (es) es.value = '';
    var esp = document.getElementById('especie');
    if (esp) esp.value = '';
    var lat = document.getElementById('latitude');
    if (lat) lat.value = '';
    var lng = document.getElementById('longitude');
    if (lng) lng.value = '';
    var gps = document.getElementById('captureGps');
    if (gps) { gps.style.borderColor = ''; gps.style.borderStyle = ''; gps.style.background = ''; }
    var status = document.getElementById('gpsStatus');
    if (status) status.textContent = 'Toque para localizar';
    for (var i = 1; i <= 5; i++) {
        var p = document.getElementById('preview' + i);
        if (p) { p.src = ''; p.classList.add('hidden'); p.classList.remove('block'); }
    }
    editingId = null;
    currentStep = 1;
    showStep(1);
}

function renderAll() {
    renderStats();
    renderAlerts();
    renderMapMarkers();
    renderRecent();
}

function renderStats() {
    var total = trees.length;
    var risco = trees.filter(function(t) { return t.intervencao === 'urgente' || t.status === 'critico'; }).length;
    var poda = trees.filter(function(t) {
        if (t.mesPoda) {
            var now = new Date();
            var mesAtual = now.getMonth() + 1;
            var mesPoda = parseInt(t.mesPoda);
            return mesPoda === mesAtual || mesPoda === mesAtual + 1 || mesPoda === mesAtual - 1;
        }
        return t.intervencao === 'limpeza' || t.intervencao === 'adequacao';
    }).length;

    var el1 = document.getElementById('totalTrees');
    if (el1) el1.textContent = total;
    var el2 = document.getElementById('statRisco');
    if (el2) el2.textContent = risco;
    var el3 = document.getElementById('statPoda');
    if (el3) el3.textContent = poda;
}

function renderAlerts() {
    var el = document.getElementById('alertArea');
    if (!el) return;

    var now = new Date();
    var mesAtual = now.getMonth() + 1;
    var podaProxima = trees.filter(function(t) {
        if (!t.mesPoda) return false;
        var mesPoda = parseInt(t.mesPoda);
        return mesPoda === mesAtual || mesPoda === mesAtual + 1;
    });

    if (podaProxima.length === 0) {
        el.innerHTML = '';
        return;
    }

    var mesLabels = { '1': 'Janeiro', '2': 'Fevereiro', '3': 'Marco', '4': 'Abril', '5': 'Maio', '6': 'Junho', '7': 'Julho', '8': 'Agosto', '9': 'Setembro', '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro' };
    var mesNome = mesLabels[String(mesAtual)] || 'atual';

    el.innerHTML = '<div style="border-radius:18px;padding:14px 16px;margin-bottom:10px;display:flex;align-items:center;gap:12px;background:linear-gradient(135deg,rgba(192,105,58,0.08),rgba(192,105,58,0.03));border:1.5px solid rgba(192,105,58,0.15);box-shadow:0 4px 24px rgba(26,34,21,0.06);">' +
        '<div style="width:38px;height:38px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;background:rgba(192,105,58,0.1);">' +
        '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke-linecap="round" stroke-linejoin="round">' +
        '<rect x="4" y="5" width="16" height="15" rx="3" stroke="#A0522D" stroke-width="1.5" fill="none"/>' +
        '<path d="M4 10h16" stroke="#A0522D" stroke-width="1.2"/>' +
        '<path d="M9 3v4M15 3v4" stroke="#A0522D" stroke-width="1.5"/>' +
        '<path d="M12 14v3" stroke="#C0693A" stroke-width="1.2"/>' +
        '<path d="M10.5 15.5h3" stroke="#C0693A" stroke-width="1"/>' +
        '</svg></div>' +
        '<div style="flex:1;">' +
        '<div style="font-size:0.82rem;font-weight:700;color:#1A2215;">Periodo de poda: ' + mesNome + '</div>' +
        '<div style="font-size:0.72rem;color:#6B7560;margin-top:2px;">' + podaProxima.length + ' arvore(s) com poda prevista</div>' +
        '</div></div>';
}

function renderRecent() {
    var el = document.getElementById('recentList');
    if (!el) return;

    var sorted = trees.slice().sort(function(a, b) { return b.timestamp - a.timestamp; }).slice(0, 5);

    if (sorted.length === 0) {
        el.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;padding:40px 20px;text-align:center;">' +
            '<div style="width:48px;height:48px;border-radius:50%;background:rgba(122,148,68,0.06);display:flex;align-items:center;justify-content:center;margin-bottom:12px;"><div style="width:14px;height:14px;background:rgba(122,148,68,0.2);border-radius:50%;"></div></div>' +
            '<p style="font-family:Cormorant Garamond,serif;font-style:italic;font-size:0.95rem;color:rgba(26,34,21,0.35);">Nenhum cadastro ainda</p>' +
            '<p style="font-size:0.7rem;color:rgba(26,34,21,0.2);margin-top:4px;">Toque em cadastrar para comecar</p>' +
            '</div>';
        return;
    }

    var statusColors = { saudavel: '#7A9444', atencao: '#C0693A', critico: '#B84433' };

    el.innerHTML = sorted.map(function(t) {
        var color = statusColors[t.status] || '#7A9444';
        var photo = (t.fotos && t.fotos[0]) ? t.fotos[0] : '';
        var iconName = getTreeIcon(t.id);

        var iconHtml;
        if (photo) {
            iconHtml = '<img src="' + photo + '" style="width:44px;height:44px;border-radius:14px;object-fit:cover;" alt="">';
        } else {
            iconHtml = '<i data-lucide="' + iconName + '" class="w-6 h-6" style="color:' + color + ';"></i>';
        }

        return '<div class="list-card rc" data-id="' + t.id + '">' +
            '<div class="list-card-icon" style="background:' + color + '10;display:flex;align-items:center;justify-content:center;">' + iconHtml + '</div>' +
            '<div style="flex:1;min-width:0;">' +
            '<div style="font-weight:700;font-size:0.88rem;color:#1A2215;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + (t.especie || 'Arvore sem nome') + '</div>' +
            '<div style="font-size:0.72rem;color:#6B7560;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + (t.logradouro || t.referencia || 'Sem endereco') + '</div>' +
            '</div>' +
            '<svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="#EDE5D8" stroke-width="1.5" stroke-linecap="round"><path d="M7 5l5 5-5 5"/></svg>' +
            '</div>';
    }).join('');

    lucide.createIcons();
    el.querySelectorAll('.list-card').forEach(function(c) {
        c.addEventListener('click', function() { openModal(parseInt(c.dataset.id)); });
    });
}

function renderCatalog() {
    var el = document.getElementById('catalogList');
    if (!el) return;

    var search = (document.getElementById('catalogSearch') || {}).value || '';
    search = search.toLowerCase();
    var filter = (document.querySelector('.filter.active') || {}).dataset || {};
    filter = filter.filter || 'all';

    var filtered = trees;
    if (search) {
        filtered = filtered.filter(function(t) {
            return (t.especie || '').toLowerCase().indexOf(search) !== -1 || (t.logradouro || '').toLowerCase().indexOf(search) !== -1;
        });
    }
    if (filter !== 'all') {
        filtered = filtered.filter(function(t) { return t.status === filter; });
    }

    if (filtered.length === 0) {
        el.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;padding:32px 20px;text-align:center;">' +
            '<div style="width:52px;height:52px;border-radius:50%;background:rgba(122,148,68,0.06);display:flex;align-items:center;justify-content:center;margin-bottom:12px;"><div style="width:15px;height:15px;background:rgba(122,148,68,0.18);border-radius:50%;"></div></div>' +
            '<p style="font-family:Cormorant Garamond,serif;font-style:italic;font-size:0.95rem;color:rgba(26,34,21,0.35);">' + (search ? 'Nenhum resultado' : 'Nenhuma arvore ainda') + '</p>' +
            '<p style="font-size:0.7rem;color:rgba(26,34,21,0.2);margin-top:4px;">' + (search ? 'Tente outro termo' : 'Cadastre a primeira arvore') + '</p>' +
            '</div>';
        return;
    }

    var statusColors = { saudavel: '#7A9444', atencao: '#C0693A', critico: '#B84433' };

    el.innerHTML = filtered.map(function(t) {
        var color = statusColors[t.status] || '#7A9444';
        var photo = (t.fotos && t.fotos[0]) ? t.fotos[0] : '';
        var iconName = getTreeIcon(t.id);

        var iconHtml;
        if (photo) {
            iconHtml = '<img src="' + photo + '" style="width:46px;height:46px;border-radius:var(--organic);object-fit:cover;" alt="">';
        } else {
            iconHtml = '<i data-lucide="' + iconName + '" class="w-6 h-6" style="color:' + color + ';"></i>';
        }

        return '<div class="list-card cc" data-id="' + t.id + '">' +
            '<div class="list-card-icon" style="background:' + color + '10;display:flex;align-items:center;justify-content:center;">' + iconHtml + '</div>' +
            '<div style="flex:1;min-width:0;">' +
            '<div style="font-weight:700;font-size:0.88rem;color:#1A2215;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + (t.especie || 'Arvore sem nome') + '</div>' +
            '<div style="font-size:0.72rem;color:#6B7560;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + (t.logradouro || t.referencia || 'Sem endereco') + '</div>' +
            '</div>' +
            '<svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="#EDE5D8" stroke-width="1.5" stroke-linecap="round"><path d="M7 5l5 5-5 5"/></svg>' +
            '</div>';
    }).join('');

    lucide.createIcons();

    el.querySelectorAll('.list-card').forEach(function(c) {
        c.addEventListener('click', function() { openModal(parseInt(c.dataset.id)); });
    });
}

function initCatalogSearch() {
    var el = document.getElementById('catalogSearch');
    if (el) el.addEventListener('input', renderCatalog);
}

function initFilters() {
    document.querySelectorAll('.filter').forEach(function(f) {
        f.addEventListener('click', function() {
            document.querySelectorAll('.filter').forEach(function(x) {
                x.classList.remove('active');
                x.style.background = '';
                x.style.color = '';
                x.style.borderColor = '';
            });
            f.classList.add('active');
            f.style.background = '#4E6B2E';
            f.style.color = 'white';
            f.style.borderColor = '#4E6B2E';
            renderCatalog();
        });
    });
}

function initMapFilters() {
    document.querySelectorAll('.map-filter').forEach(function(f) {
        f.addEventListener('click', function() {
            document.querySelectorAll('.map-filter').forEach(function(x) {
                x.classList.remove('active');
                x.style.background = '';
                x.style.color = '';
                x.style.borderColor = '';
            });
            f.classList.add('active');
            f.style.background = '#4E6B2E';
            f.style.color = 'white';
            f.style.borderColor = '#4E6B2E';
            mapFilter = f.dataset.mapFilter || 'all';
            renderMapMarkers();
        });
    });
}
