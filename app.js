const DB_KEY = 'arbore_andradas_v4';
const SHEETS_URL = 'https://script.google.com/macros/s/AKfycbzas_Z2hDLxFxfXEA8JEQEY9UTC-HKZWv_W5c2b3hUrkZ5ZFE8Y6EWWCFgj3nzsNiHX/exec';

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
    'Citrus limon','Citharexylum myrianthum','Clitoria ternatea','Cochlospermum regium',
    'Commersonia fraseri','Croton floribundus','Cupania vernalis','Cyathea delgadii',
    'Cymbopogon citratus','Daphnopsis fasciculata','Dendrocalamus asper','Delonix regia',
    'Dipteryx alata','Dyssochroma viridiflorum','Eriobotrya japonica','Erythrina speciosa',
    'Eschweilera ovata','Eugenia uniflora','Eugenia pyriformis','Eugenia involucrata',
    'Eugenia javanica','Ficus benjamina','Ficus elastica','Ficus microcarpa',
    'Ficus obtusifolia','Fraxinus uhdei','Garcinia gardneriana','Gleditsia amorphoides',
    'Gochnatia polymorpha','Guarea trichilioides','Guarea guidonia','Guazuma ulmifolia',
    'Handroanthus chrysotrichus','Handroanthus impetiginosus','Handroanthus albus',
    'Hymenaea courbaril','Inga vera','Jacaranda mimosifolia','Lafoensia glyptocarpa',
    'Lagerstroemia indica','Libidibia ferrea','Ligustrum lucidum',
    'Lithraea molleoides','Luehea candicans','Maackia amurensis','Mangifera indica',
    'Maytenus evonymoides','Melia azedarach','Metrodorea nigra','Mimosa bimucronata',
    'Mimusops communis','Mollinedia schottiana','Monteverdia gonoclada','Myracrodruon urundeuva',
    'Nectandra megapotamica','Nectandra oppositifolia',
    'Ocimum gratissimum','Ocotea pulchella','Ocotea puberula','Olea europaea',
    'Parapiptadenia rigida','Peltogyne paivaeana','Peltophorum dubium','Pera glabrata',
    'Phoenix canariensis','Phyllanthus tenellus','Pinus elliotis','Piper aduncum',
    'Plathymenia reticulata','Platanus hispanica','Plumeria rubra','Poincianella pluviosa',
    'Pontidendron pinnatum','Pouteria torta','Psidium cattleyanum','Psidium guajava',
    'Psidium guineense','Pterocarpus macrocarpus','Pterogyne nitens','Qualea grandiflora',
    'Rauvolfia sellowii','Retiniphyllum concolor','Rhamnidium elaeocarpum',
    'Richeria grandis','Ricinus communis','Robinia pseudoacacia','Rollinia mucosa',
    'Ruprechtia laxiflora','Salix humboldtiana','Schinus molle','Schinus terebinthifolia',
    'Schizolobium parahyba','Senna multijuga','Sideroxylon obtusifolium','Simarouba amara',
    'Solanum lycocarpum','Spathodea campanulata','Syagrus romanzoffiana',
    'Syzygium jambos','Tabebuia alba','Tabebuia roseoalba','Tabebuia vellosoi',
    'Tabernaemontana catharinensis','Terminalia catappa','Tipuana tipu',
    'Tibouchina granulosa','Trema micrantha','Trichilia elegans','Trichilia pallida',
    'Trophis racemosa','Urera baccifera',
    'Vernonia ferruginea','Viburnum nudum','Vitex polyneura',
    'Vochysia magnifica','Vochysia tucanorum','Xylosma ciliatifolia',
    'Zanthoxylum rhoifolium','Zeyheria tuberculosa','Zingiber officinale','Zollernia ilicifolia',
    'Araucaria angustifolia'
];

const COMMON_NAMES = {
    'Erythrina speciosa': 'Ora-pro-nóbis / Mulungu',
    'Mangifera indica': 'Mangueira',
    'Citrus limon': 'Limão',
    'Tipuana tipu': 'Tipuana / Ipê-amarelo',
    'Handroanthus albus': 'Ipê-amarelo',
    'Handroanthus impetiginosus': 'Ipê-roxo',
    'Handroanthus chrysotrichus': 'Ipê-amarelo-do-cerrado',
    'Jacaranda mimosifolia': 'Jacarandá',
    'Syagrus romanzoffiana': 'Coqueiro-queen',
    'Ficus benjamina': 'Ficus',
    'Ficus microcarpa': 'Ficus',
    'Ficus elastica': 'Ficus-elástico',
    'Eugenia uniflora': 'Pitangueira',
    'Eugenia pyriformis': 'Uvaia',
    'Psidium guajava': 'Goiabeira',
    'Psidium cattleyanum': 'Araçázeiro',
    'Casuarina equisetifolia': 'Casuarina',
    'Phoenix canariensis': 'Palmeira-reis',
    'Chorisia speciosa': 'Paineira',
    'Platanus hispanica': 'Plátano',
    'Ligustrum lucidum': 'Loureiro',
    'Melia azedarach': 'Cinamomo',
    'Schinus terebinthifolia': 'Aroeira',
    'Schinus molle': 'Aroeira-falsa',
    'Cedrela fissilis': 'Cedro',
    'Aspidosperma polyneuron': 'Peroba-rosa',
    'Hymenaea courbaril': 'Jatobá',
    'Bauhinia forficata': 'Pata-de-vaca',
    'Caesalpinia pluviosa': 'Sibipiruna',
    'Celtis iguanaea': 'Juá',
    'Citharexylum myrianthum': 'Murta',
    'Croton floribundus': 'Sangue-de-dragão',
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
    'Eriobotrya japonica': 'Macieira-japonesa / Nespereira',
    'Albizia lebbek': 'Sicomoro',
    'Delonix regia': 'Flamboyant',
    'Plumeria rubra': 'Leiteiro / Jasmim-manga',
    'Terminalia catappa': 'Amendoeira / Castanheiro',
    'Syzygium jambos': 'Jambeiro',
    'Lagerstroemia indica': 'Resedá / Extremosa',
    'Pinus elliotis': 'Pinheiro',
    'Cinnamomum glaucescens': 'Canela',
    'Gleditsia amorphoides': 'Espinheiro',
    'Libidibia ferrea': 'Jucá',
    'Parapiptadenia rigida': 'Angico',
    'Peltophorum dubium': 'Canafístula-amarela',
    'Senna multijuga': 'Cássia',
    'Acacia mangium': 'Acácia-nova',
    'Robinia pseudoacacia': 'Acácia-negra',
    'Campomanesia xanthocarpa': 'Gabirobeira',
    'Cariniana legalis': 'Jequitibá',
    'Dipteryx alata': 'Baruú',
    'Eschweilera ovata': 'Castanheira',
    'Fraxinus uhdei': 'Freijó',
    'Garcinia gardneriana': 'Bacupari',
    'Guazuma ulmifolia': 'Mutambo',
    'Lafoensia glyptocarpa': 'Resedá-verdadeiro',
    'Nectandra megapotamica': 'Canelão',
    'Ocotea puberula': 'Canela-amarela',
    'Olea europaea': 'Oliveira',
    'Pera glabrata': 'Perao',
    'Phyllanthus tenellus': 'Araçá-do-mato',
    'Piper aduncum': 'Capoeira',
    'Plathymenia reticulata': 'Catinga-de-mulher',
    'Poincianella pluviosa': 'Barbatimão',
    'Pouteria torta': 'Curupita',
    'Qualea grandiflora': 'Pau-terra',
    'Ricinus communis': 'Mamona',
    'Rollinia mucosa': 'Araticum',
    'Salix humboldtiana': 'Salgueiro',
    'Sideroxylon obtusifolium': 'Quina',
    'Simarouba amara': 'Marupá',
    'Solanum lycocarpum': 'Lobeira',
    'Spathodea campanulata': 'Tulipana-africano',
    'Tabebuia alba': 'Ipê-branco-de-bahia',
    'Tabebuia vellosoi': 'Ipê-rosa',
    'Tabernaemontana catharinensis': 'Jasmim-manga',
    'Trichilia pallida': 'Catiguá-branco',
    'Trophis racemosa': 'Amendoeira-brava',
    'Urera baccifera': 'Urtigão',
    'Viburnum nudum': 'Veludinho',
    'Vochysia magnifica': 'Vózia',
    'Xylosma ciliatifolia': 'Canelinha',
    'Zeyheria tuberculosa': 'Tarumã',
    'Zingiber officinale': 'Gengibre',
    'Zollernia ilicifolia': 'Capitão-do-mato',
    'Araucaria angustifolia': 'Araucária / Pinheiro-do Paraná'
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
    initLocationFilters();
    initMapFilters();
    initFormSubmit();
    /* Limpeza de dados mock (uma vez) */
    if (!localStorage.getItem('arbore_mock_cleaned')) {
        const before = trees.length;
        trees = trees.filter(t => !t.id || !String(t.id).startsWith('m'));
        if (trees.length !== before) {
            localStorage.setItem(DB_KEY, JSON.stringify(trees));
        }
        localStorage.setItem('arbore_mock_cleaned', '1');
    }

    if (!localStorage.getItem('arbore_location_migrated')) {
        var migrated = false;
        trees.forEach(function(t) {
            if (!t.bairro && t.logradouro) {
                var parts = t.logradouro.split(',').map(function(s) { return s.trim(); }).filter(Boolean);
                if (parts.length >= 2) {
                    t.rua = t.rua || parts[0];
                    t.bairro = t.bairro || parts[1];
                    migrated = true;
                } else if (parts.length === 1) {
                    var sub = parts[0].split(/\s*[-–—]\s*/);
                    if (sub.length >= 2) {
                        t.rua = t.rua || sub[0].trim();
                        t.bairro = t.bairro || sub[1].trim();
                        migrated = true;
                    }
                }
            }
        });
        if (migrated) {
            localStorage.setItem(DB_KEY, JSON.stringify(trees));
        }
        localStorage.setItem('arbore_location_migrated', '1');
    }

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

    if (pageId === 'pageDashboard') { renderAll(); if (map) setTimeout(() => map.invalidateSize(), 150); }
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

        var popupName = esc(COMMON_NAMES[t.especie] || t.especie || 'Arvore');
        var popupSci = COMMON_NAMES[t.especie] ? esc(t.especie || '') : '';
        var popupAddr = esc(t.logradouro || t.referencia || 'Sem endereco');

        marker.bindPopup(
            '<div style="padding:12px;display:flex;flex-direction:column;gap:8px;min-width:200px;">' +
            photoHtml +
            '<div><strong style="font-size:0.9rem;color:#1A2215;">' + popupName + '</strong><br>' +
            (popupSci ? '<small style="font-size:0.72rem;color:#6B7560;font-style:italic;">' + popupSci + '</small>' : '') +
            '<small style="font-size:0.72rem;color:#6B7560;display:block;">' + popupAddr + '</small></div>' +
            '<div style="display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:50px;font-size:0.65rem;font-weight:700;background:' + color + '15;color:' + color + ';width:fit-content;">' + (statusLabels[t.status] || '-') + '</div>' +
            '<button onclick="closePopups();openModal(' + t.id + ')" style="width:100%;padding:8px;border:none;border-radius:10px;background:#4E6B2E;color:white;font-family:Nunito,sans-serif;font-size:0.75rem;font-weight:700;cursor:pointer;">Ver detalhes</button>' +
            '</div>',
            { closeButton: false, maxWidth: 260 }
        );

        markers[t.id] = marker;
    });
}

function closePopups() { if (map) map.closePopup(); }

function reverseGeocode(lat, lng) {
    document.getElementById('gpsStatus').textContent = 'Obtendo endereco...';
    var script = document.createElement('script');
    var callbackName = 'nominatimCB_' + Date.now();
    window[callbackName] = function(d) {
        delete window[callbackName];
        document.body.removeChild(script);
        if (d.address) {
            var a = d.address;
            var road = a.road || a.pedestrian || a.path || '';
            var number = a.house_number || '';
            var fullRoad = road + (number ? ', ' + number : '');
            var neighbourhood = a.neighbourhood || a.suburb || a.quarter || '';
            var city = a.city || a.town || a.village || '';
            var state = a.state || '';
            document.getElementById('logradouro').value = [fullRoad, neighbourhood, city, state].filter(Boolean).join(', ');
            document.getElementById('rua').value = road;
            document.getElementById('bairro').value = neighbourhood;
            document.getElementById('gpsStatus').textContent = lat.toFixed(5) + ', ' + lng.toFixed(5) + ' - ' + (road || neighbourhood || 'Endereco encontrado');
        } else if (d.display_name) {
            document.getElementById('logradouro').value = d.display_name;
            var parts = d.display_name.split(',').map(function(s) { return s.trim(); });
            document.getElementById('rua').value = parts[0] || '';
            document.getElementById('bairro').value = parts[1] || '';
            document.getElementById('gpsStatus').textContent = 'Endereco: ' + parts.slice(0, 2).join(', ');
        }
    };
    script.src = 'https://nominatim.openstreetmap.org/reverse?lat=' + lat + '&lon=' + lng + '&format=json&addressdetails=1&accept-language=pt&json_callback=' + callbackName;
    document.body.appendChild(script);
    setTimeout(function() {
        if (window[callbackName]) {
            delete window[callbackName];
            document.body.removeChild(script);
            document.getElementById('gpsStatus').textContent = lat.toFixed(5) + ', ' + lng.toFixed(5);
        }
    }, 10000);
}

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
                btn.style.borderColor = '#7A9444';
                btn.style.background = 'rgba(122,148,68,0.06)';
                reverseGeocode(lat, lng);
                if (map) map.setView([lat, lng], 16);
            },
            function() {
                document.getElementById('gpsStatus').textContent = 'Erro ao obter localizacao';
                btn.style.borderColor = '#C0693A';
            },
            { enableHighAccuracy: true, timeout: 15000 }
        );
    });

    var latInput = document.getElementById('latitude');
    var lngInput = document.getElementById('longitude');
    if (latInput && lngInput) {
        function onCoordChange() {
            var lat = latInput.value;
            var lng = lngInput.value;
            if (lat && lng) {
                reverseGeocode(parseFloat(lat), parseFloat(lng));
            }
        }
        latInput.addEventListener('change', onCoordChange);
        lngInput.addEventListener('change', onCoordChange);
    }
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
        }).slice(0, 8);

        var html = '';
        if (matches.length === 0 && val.length >= 3) {
            html = '<div class="sdo" data-val="' + esc(input.value.trim()) + '">' +
                '<span class="sdo-nova">+ Cadastrar "' + esc(input.value.trim()) + '" como nova espécie</span></div>';
        } else {
            html = matches.map(function(m) {
                var cn = COMMON_NAMES[m];
                if (cn) {
                    return '<div class="sdo" data-val="' + esc(m) + '">' +
                        '<span class="sdo-popular">' + esc(cn) + '</span>' +
                        '<span class="sdo-cientifico">' + esc(m) + '</span></div>';
                } else {
                    return '<div class="sdo" data-val="' + esc(m) + '">' +
                        '<span class="sdo-popular">' + esc(m) + '</span></div>';
                }
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
    });

    input.addEventListener('blur', function() {
        setTimeout(function() {
            results.classList.remove('show');
            var val = input.value.trim().toLowerCase();
            var match = SPECIES_DB.find(function(s) {
                var cn = COMMON_NAMES[s] || '';
                return s.toLowerCase() === val || cn.toLowerCase() === val;
            });
            if (match) {
                input.value = COMMON_NAMES[match] || match;
                hidden.value = match;
            } else if (!hidden.value || hidden.value === input.value.trim()) {
                hidden.value = input.value.trim();
            }
        }, 250);
    });
}

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

    var date = t.timestamp ? new Date(t.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Data nao informada';

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

    var nomePopularModal = COMMON_NAMES[t.especie] || '';
    var nomeCientificoModal = t.especie || '';
    var nomeExibicaoModal = nomePopularModal || nomeCientificoModal || 'Arvore sem nome';

    var html = '<div style="font-family:Playfair Display,serif;font-size:1.3rem;color:#4E6B2E;font-weight:700;margin-bottom:2px;padding-right:40px;">' + esc(nomeExibicaoModal) + '</div>' +
        (nomePopularModal ? '<div style="font-family:Playfair Display,serif;font-style:italic;font-size:0.82rem;color:#7A9444;margin-bottom:6px;">' + esc(nomeCientificoModal) + '</div>' : '') +
        '<div style="font-size:0.76rem;color:#6B7560;margin-bottom:14px;">' + esc(t.logradouro || t.referencia || 'Sem endereco') + ' &middot; ' + date + '</div>' +
        '<div style="display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:50px;font-size:0.68rem;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:16px;background:' + color + '15;color:' + color + ';">' + (statusLabels[t.status] || t.status) + '</div>';

    html += '<div style="background:white;border-radius:14px;padding:14px 16px;margin-bottom:10px;box-shadow:0 4px 24px rgba(26,34,21,0.06);">' +
        '<div style="font-size:0.66rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#7A9444;margin-bottom:8px;">Localizacao</div>' +
        '<div style="display:flex;justify-content:space-between;padding:5px 0;font-size:0.78rem;border-bottom:1px solid rgba(158,171,87,0.06);"><span style="color:#6B7560;">Logradouro</span><span style="font-weight:700;text-align:right;">' + esc(t.logradouro || '-') + '</span></div>' +
        '<div style="display:flex;justify-content:space-between;padding:5px 0;font-size:0.78rem;border-bottom:1px solid rgba(158,171,87,0.06);"><span style="color:#6B7560;">Rua</span><span style="font-weight:700;text-align:right;">' + esc(t.rua || '-') + '</span></div>' +
        '<div style="display:flex;justify-content:space-between;padding:5px 0;font-size:0.78rem;border-bottom:1px solid rgba(158,171,87,0.06);"><span style="color:#6B7560;">Bairro</span><span style="font-weight:700;text-align:right;">' + esc(t.bairro || '-') + '</span></div>' +
        '<div style="display:flex;justify-content:space-between;padding:5px 0;font-size:0.78rem;border-bottom:1px solid rgba(158,171,87,0.06);"><span style="color:#6B7560;">Referencia</span><span style="font-weight:700;text-align:right;">' + esc(t.referencia || '-') + '</span></div>' +
        '<div style="display:flex;justify-content:space-between;padding:5px 0;font-size:0.78rem;border-bottom:1px solid rgba(158,171,87,0.06);"><span style="color:#6B7560;">Local</span><span style="font-weight:700;text-align:right;">' + esc(localLabels[t.localPlantio] || '-') + '</span></div>' +
        '<div style="display:flex;justify-content:space-between;padding:5px 0;font-size:0.78rem;"><span style="color:#6B7560;">GPS</span><span style="font-weight:700;text-align:right;">' + (t.latitude ? parseFloat(t.latitude).toFixed(4) + ', ' + parseFloat(t.longitude).toFixed(4) : 'Nao capturado') + '</span></div>' +
        '</div>';

    html += '<div style="background:white;border-radius:14px;padding:14px 16px;margin-bottom:10px;box-shadow:0 4px 24px rgba(26,34,21,0.06);">' +
        '<div style="font-size:0.66rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#7A9444;margin-bottom:8px;">Especie</div>' +
        '<div style="display:flex;justify-content:space-between;padding:5px 0;font-size:0.78rem;border-bottom:1px solid rgba(158,171,87,0.06);"><span style="color:#6B7560;">Nome Popular</span><span style="font-weight:700;text-align:right;">' + esc(nomePopularModal || 'Nao identificado') + '</span></div>' +
        '<div style="display:flex;justify-content:space-between;padding:5px 0;font-size:0.78rem;border-bottom:1px solid rgba(158,171,87,0.06);"><span style="color:#6B7560;">Nome Cientifico</span><span style="font-weight:700;font-style:italic;text-align:right;">' + esc(nomeCientificoModal || 'Nao identificado') + '</span></div>' +
        '<div style="display:flex;justify-content:space-between;padding:5px 0;font-size:0.78rem;border-bottom:1px solid rgba(158,171,87,0.06);"><span style="color:#6B7560;">Porte</span><span style="font-weight:700;text-align:right;">' + esc(porteLabels[t.porte] || '-') + '</span></div>' +
        '<div style="display:flex;justify-content:space-between;padding:5px 0;font-size:0.78rem;"><span style="color:#6B7560;">Tronco</span><span style="font-weight:700;text-align:right;">' + esc(troncoLabels[t.tronco] || '-') + '</span></div>' +
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
        html += '<div style="background:white;border-radius:14px;padding:14px 16px;margin-bottom:10px;box-shadow:0 4px 24px rgba(26,34,21,0.06);"><div style="font-size:0.66rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#7A9444;margin-bottom:8px;">Observacoes</div><div style="font-size:0.82rem;color:#3D4A35;line-height:1.6;">' + esc(t.observacoes) + '</div></div>';
    }

    html += '<div style="display:flex;gap:10px;margin-top:16px;">' +
        '<button onclick="editTree(' + t.id + ')" style="flex:1;padding:14px 24px;border:1.5px solid rgba(158,171,87,0.2);border-radius:50px;background:white;color:#4E6B2E;font-family:Nunito,sans-serif;font-size:0.88rem;font-weight:700;cursor:pointer;">Editar</button>' +
        '<button onclick="deleteTree(' + t.id + ')" style="flex:0 0 auto;padding:14px 20px;background:rgba(192,74,58,0.06);color:#B84433;border:1.5px solid rgba(192,74,58,0.15);border-radius:50px;font-family:Nunito,sans-serif;font-size:0.88rem;font-weight:700;cursor:pointer;">Excluir</button>' +
        '</div>';

    document.getElementById('modalBody').innerHTML = html;
    var modal = document.getElementById('treeModal');
    modal.classList.add('show');
    lucide.createIcons();
}

function closeModal() {
    var modal = document.getElementById('treeModal');
    modal.classList.remove('show');
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
    document.getElementById('rua').value = t.rua || '';
    document.getElementById('bairro').value = t.bairro || '';
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
    showToast('Arvore excluida');
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
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
    }).then(function(res) {
        return res.json();
    }).then(function(result) {
        if (result && (result.success || result.status === 'ok')) {
            showToast('Salvo com sucesso na planilha!');
        } else {
            showToast('Nao foi possivel salvar na planilha');
        }
    }).catch(function(err) {
        showToast('Nao foi possivel conectar na planilha');
    });
}

function showToast(msg) {
    var t = document.getElementById('toast');
    var m = document.getElementById('toastMsg');
    if (!t || !m) return;
    m.textContent = msg;
    t.classList.remove('hidden');
    t.classList.add('show');
    setTimeout(function() {
        t.classList.remove('show');
    }, 3500);
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
    // Photo inputs are now handled by the photo chooser modal
    // This function is kept for compatibility
}

function upPhoto(n) {
    var photoNum = n;
    var chooser = document.getElementById('photoChooser');
    var cameraInput = document.getElementById('photoCamera');
    var galleryInput = document.getElementById('photoGallery');
    var btnCamera = document.getElementById('btnCamera');
    var btnGallery = document.getElementById('btnGallery');

    chooser.classList.add('show');

    function onCamera() {
        cleanup();
        closePhotoChooser();
        cameraInput.onchange = function(e) { handlePhotoSelect(e, photoNum); };
        cameraInput.click();
    }

    function onGallery() {
        cleanup();
        closePhotoChooser();
        galleryInput.onchange = function(e) { handlePhotoSelect(e, photoNum); };
        galleryInput.click();
    }

    function cleanup() {
        btnCamera.removeEventListener('click', onCamera);
        btnGallery.removeEventListener('click', onGallery);
    }

    btnCamera.addEventListener('click', onCamera);
    btnGallery.addEventListener('click', onGallery);
}

function handlePhotoSelect(e, n) {
    var file = e.target.files[0];
    if (!file) return;
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
    e.target.value = '';
}

function closePhotoChooser() {
    var chooser = document.getElementById('photoChooser');
    if (chooser) chooser.classList.remove('show');
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

function goStep(n) {
    showStep(n);
    var formPage = document.getElementById('pageForm');
    if (formPage) {
        formPage.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function getFormData() {
    var d = {};
    d.id = editingId || Date.now();
    d.latitude = document.getElementById('latitude') ? document.getElementById('latitude').value : '';
    d.longitude = document.getElementById('longitude') ? document.getElementById('longitude').value : '';
    d.logradouro = document.getElementById('logradouro') ? document.getElementById('logradouro').value : '';
    d.rua = document.getElementById('rua') ? document.getElementById('rua').value : '';
    d.bairro = document.getElementById('bairro') ? document.getElementById('bairro').value : '';
    if (!d.rua && !d.bairro && d.logradouro) {
        var parts = d.logradouro.split(',').map(function(s) { return s.trim(); }).filter(Boolean);
        if (parts.length >= 2) {
            d.rua = parts[0];
            d.bairro = parts[1];
        }
    }
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
    var action = editingId ? 'update' : 'create';

    if (editingId) {
        var idx = trees.findIndex(function(t) { return t.id === editingId; });
        if (idx !== -1) trees[idx] = data;
        editingId = null;
    } else {
        trees.push(data);
    }

    saveData();
    resetForm();
    navigateTo('pageDashboard');
    showToast('Arvore salva!');
    syncToSheets(data, action);
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
    var rua = document.getElementById('rua');
    if (rua) rua.value = '';
    var bairro = document.getElementById('bairro');
    if (bairro) bairro.value = '';
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
    populateLocationFilters();
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

    var sorted = trees.slice().sort(function(a, b) {
        var ta = a.dataAtualizacao || a.timestamp || 0;
        var tb = b.dataAtualizacao || b.timestamp || 0;
        return tb - ta;
    }).slice(0, 5);

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
        var nomePopular = COMMON_NAMES[t.especie] || '';
        var nomeCientifico = t.especie || '';
        var nomeExibicao = nomePopular || nomeCientifico || 'Arvore sem nome';
        var subtitulo = nomePopular ? nomeCientifico : (t.logradouro || t.referencia || 'Sem endereco');

        var iconHtml;
        if (photo) {
            iconHtml = '<img src="' + photo + '" style="width:44px;height:44px;border-radius:14px;object-fit:cover;" alt="">';
        } else {
            iconHtml = '<i data-lucide="' + iconName + '" class="w-6 h-6" style="color:' + color + ';"></i>';
        }

        return '<div class="list-card rc" data-id="' + t.id + '">' +
            '<div class="list-card-icon" style="background:' + color + '10;display:flex;align-items:center;justify-content:center;">' + iconHtml + '</div>' +
            '<div style="flex:1;min-width:0;">' +
            '<div style="font-weight:700;font-size:0.88rem;color:#1A2215;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + esc(nomeExibicao) + '</div>' +
            '<div style="font-size:0.72rem;color:#6B7560;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-style:italic;">' + esc(subtitulo) + '</div>' +
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
    var bairroFilter = (document.getElementById('filterBairro') || {}).value || '';
    var ruaFilter = (document.getElementById('filterRua') || {}).value || '';

    var filtered = trees;
    if (search) {
        filtered = filtered.filter(function(t) {
            var nomePopular = (COMMON_NAMES[t.especie] || '').toLowerCase();
            var especie = (t.especie || '').toLowerCase();
            var logradouro = (t.logradouro || '').toLowerCase();
            var bairro = (t.bairro || '').toLowerCase();
            var rua = (t.rua || '').toLowerCase();
            return nomePopular.indexOf(search) !== -1 || especie.indexOf(search) !== -1 || logradouro.indexOf(search) !== -1 || bairro.indexOf(search) !== -1 || rua.indexOf(search) !== -1;
        });
    }
    if (filter !== 'all') {
        filtered = filtered.filter(function(t) { return t.status === filter; });
    }
    if (bairroFilter) {
        filtered = filtered.filter(function(t) { return t.bairro === bairroFilter; });
    }
    if (ruaFilter) {
        filtered = filtered.filter(function(t) { return t.rua === ruaFilter; });
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

        var nomePopular = COMMON_NAMES[t.especie] || '';
        var nomeCientifico = t.especie || '';
        var nomeExibicao = nomePopular || nomeCientifico || 'Arvore sem nome';
        var locationStr = [t.rua, t.bairro].filter(Boolean).join(', ') || t.logradouro || t.referencia || 'Sem endereco';
        var subtitulo = nomePopular ? nomeCientifico : locationStr;

        return '<div class="list-card cc" data-id="' + t.id + '">' +
            '<div class="list-card-icon" style="background:' + color + '10;display:flex;align-items:center;justify-content:center;">' + iconHtml + '</div>' +
            '<div style="flex:1;min-width:0;">' +
            '<div style="font-weight:700;font-size:0.88rem;color:#1A2215;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + esc(nomeExibicao) + '</div>' +
            '<div style="font-size:0.72rem;color:#6B7560;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-style:italic;">' + esc(subtitulo) + '</div>' +
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

function populateLocationFilters() {
    var bairros = [];
    var ruas = [];
    trees.forEach(function(t) {
        if (t.bairro && bairros.indexOf(t.bairro) === -1) bairros.push(t.bairro);
        if (t.rua && ruas.indexOf(t.rua) === -1) ruas.push(t.rua);
    });
    bairros.sort();
    ruas.sort();

    var bairroSelect = document.getElementById('filterBairro');
    if (bairroSelect) {
        var currentBairro = bairroSelect.value;
        bairroSelect.innerHTML = '<option value="">Todos os bairros</option>' +
            bairros.map(function(b) { return '<option value="' + esc(b) + '"' + (b === currentBairro ? ' selected' : '') + '>' + esc(b) + '</option>'; }).join('');
    }

    var ruaSelect = document.getElementById('filterRua');
    if (ruaSelect) {
        var currentRua = ruaSelect.value;
        ruaSelect.innerHTML = '<option value="">Todas as ruas</option>' +
            ruas.map(function(r) { return '<option value="' + esc(r) + '"' + (r === currentRua ? ' selected' : '') + '>' + esc(r) + '</option>'; }).join('');
    }
}

function initLocationFilters() {
    var bairroSelect = document.getElementById('filterBairro');
    var ruaSelect = document.getElementById('filterRua');
    if (bairroSelect) bairroSelect.addEventListener('change', renderCatalog);
    if (ruaSelect) ruaSelect.addEventListener('change', renderCatalog);
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
