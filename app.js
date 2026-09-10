const DB_KEY = 'arbore_andradas_v4';
const SHEETS_URL = 'https://script.google.com/macros/s/AKfycbzYaVf1-1iWrUVNZZkvNwPH1TvNqEqS7EYqu2goz-gNTO7tw5ZvKVPXz-HIZB6jrHiB/exec';
const SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/1A8mIArlQiqcvnIgRGYgSiU5WDF2ClbGYe0XOHiyOciU/edit?gid=1119417971#gid=1119417971';
const FLORA_API_URL = 'https://servicos.jbrj.gov.br/v2/flora/taxon/';

const STATUS_COLORS = { saudavel: '#10B981', atencao: '#F59E0B', critico: '#EF4444' };
const STATUS_LABELS = { saudavel: 'Saudavel', atencao: 'Atencao', critico: 'Critico' };

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

var floraCache = {};

function parseFloraResult(data, searchTerm) {
    if (!data || !data.length) return null;
    var taxon = data[0].taxon;
    if (!taxon) return null;
    var profile = data[0].specie_profile || {};
    var vernacular = data[0].vernacular_name || [];
    return {
        scientificName: taxon.scientificname || searchTerm,
        family: taxon.family || '',
        genus: taxon.genus || '',
        species: taxon.specificepithet || '',
        status: taxon.taxonomicstatus || '',
        lifeForm: (profile.lifeForm || []).join(', '),
        habitat: (profile.habitat || []).join(', '),
        vegetationType: (profile.vegetationType || []).join(', '),
        vernacularNames: vernacular.map(function(v) { return v.vernacularname; }).filter(Boolean),
        origin: (data[0].distribuition || []).some(function(d) {
            return d.establishmentmeans === 'NATIVA';
        }) ? 'Nativa' : 'Exótica'
    };
}

var floraCacheTimes = {};

function fetchFloraData(speciesName, callback) {
    if (!speciesName || typeof callback !== 'function') return callback ? callback(null) : null;
    
    var hasCache = Object.prototype.hasOwnProperty.call(floraCache, speciesName);
    var cachedTime = floraCacheTimes[speciesName];
    var now = Date.now();
    if (hasCache && cachedTime && (now - cachedTime < 24 * 60 * 60 * 1000)) {
        return callback(floraCache[speciesName]);
    }

    var capitalized = speciesName.charAt(0).toUpperCase() + speciesName.slice(1);
    var genusUrl = FLORA_API_URL.replace('/taxon/', '/species/genus/');
    var urls = [
        FLORA_API_URL + encodeURIComponent(speciesName),
        FLORA_API_URL + encodeURIComponent(capitalized),
        genusUrl + encodeURIComponent(speciesName)
    ];
    var attempt = 0;

    function tryNext() {
        if (attempt >= urls.length) {
            floraCache[speciesName] = null;
            floraCacheTimes[speciesName] = now;
            return callback(null);
        }
        var url = urls[attempt++];
        fetchWithTimeout(url, 5000)
            .then(function(res) { return res && res.json ? res.json() : null; })
            .then(function(data) {
                if (data && data.length && data[0].taxon) {
                    var result = parseFloraResult(data, speciesName);
                    floraCache[speciesName] = result;
                    floraCacheTimes[speciesName] = now;
                    return callback(result);
                }
                tryNext();
            })
            .catch(function() {
                tryNext();
            });
    }
    tryNext();
}

function fetchWithTimeout(url, timeoutMs) {
    return new Promise(function(resolve, reject) {
        var timeout = setTimeout(function() {
            reject(new Error('Fetch timeout'));
        }, timeoutMs);
        fetch(url)
            .then(function(res) {
                clearTimeout(timeout);
                resolve(res);
            })
            .catch(function(err) {
                clearTimeout(timeout);
                reject(err);
            });
    });
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
    'Eugenia javanica','Euphorbia leucocephala','Ficus benjamina','Ficus elastica','Ficus microcarpa',
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
    'Euphorbia leucocephala': 'Neve-da-Montanha',
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

const SPECIES_DATA = {
    'Abarema idiopoda': { familia: 'Fabaceae', origem: 'Nativa' },
    'Abutilon fruticosum': { familia: 'Malvaceae', origem: 'Nativa' },
    'Acacia mangium': { familia: 'Fabaceae', origem: 'Exótica' },
    'Acnistus arborescens': { familia: 'Solanaceae', origem: 'Nativa' },
    'Adenanthera pavonina': { familia: 'Fabaceae', origem: 'Exótica' },
    'Aglaia odorata': { familia: 'Meliaceae', origem: 'Exótica' },
    'Albizia lebbek': { familia: 'Fabaceae', origem: 'Exótica' },
    'Alchornea triplinervia': { familia: 'Euphorbiaceae', origem: 'Nativa' },
    'Alibertia edulis': { familia: 'Rubiaceae', origem: 'Nativa' },
    'Annona reticulata': { familia: 'Annonaceae', origem: 'Nativa' },
    'Annona squamosa': { familia: 'Annonaceae', origem: 'Nativa' },
    'Aphanes microcarpa': { familia: 'Rosaceae', origem: 'Nativa' },
    'Aspidosperma polyneuron': { familia: 'Apocynaceae', origem: 'Nativa' },
    'Bambusa oldhamii': { familia: 'Poaceae', origem: 'Exótica' },
    'Bauhinia forficata': { familia: 'Fabaceae', origem: 'Nativa' },
    'Bixa orellana': { familia: 'Bixaceae', origem: 'Nativa' },
    'Blankinia rosea': { familia: 'Fabaceae', origem: 'Nativa' },
    'Brosimum gaubertianum': { familia: 'Moraceae', origem: 'Nativa' },
    'Caesalpinia pluviosa': { familia: 'Fabaceae', origem: 'Nativa' },
    'Calliandra brevipes': { familia: 'Fabaceae', origem: 'Nativa' },
    'Callistemon sieberi': { familia: 'Myrtaceae', origem: 'Exótica' },
    'Calycophyllum spruceanum': { familia: 'Rubiaceae', origem: 'Nativa' },
    'Campomanesia xanthocarpa': { familia: 'Myrtaceae', origem: 'Nativa' },
    'Cariniana legalis': { familia: 'Lecythidaceae', origem: 'Nativa' },
    'Casuarina equisetifolia': { familia: 'Casuarinaceae', origem: 'Exótica' },
    'Cedrela fissilis': { familia: 'Meliaceae', origem: 'Nativa' },
    'Celtis iguanaea': { familia: 'Cannabaceae', origem: 'Nativa' },
    'Chaetachme aristata': { familia: 'Cannabaceae', origem: 'Nativa' },
    'Chorisia speciosa': { familia: 'Malvaceae', origem: 'Nativa' },
    'Cinnamomum glaucescens': { familia: 'Lauraceae', origem: 'Exótica' },
    'Citrus sinensis': { familia: 'Rutaceae', origem: 'Exótica' },
    'Citrus limon': { familia: 'Rutaceae', origem: 'Exótica' },
    'Citharexylum myrianthum': { familia: 'Verbenaceae', origem: 'Nativa' },
    'Clitoria ternatea': { familia: 'Fabaceae', origem: 'Exótica' },
    'Cochlospermum regium': { familia: 'Bixaceae', origem: 'Nativa' },
    'Commersonia fraseri': { familia: 'Malvaceae', origem: 'Exótica' },
    'Croton floribundus': { familia: 'Euphorbiaceae', origem: 'Nativa' },
    'Cupania vernalis': { familia: 'Sapindaceae', origem: 'Nativa' },
    'Cyathea delgadii': { familia: 'Cyatheaceae', origem: 'Nativa' },
    'Cymbopogon citratus': { familia: 'Poaceae', origem: 'Nativa' },
    'Daphnopsis fasciculata': { familia: 'Thymelaeaceae', origem: 'Nativa' },
    'Dendrocalamus asper': { familia: 'Poaceae', origem: 'Exótica' },
    'Delonix regia': { familia: 'Fabaceae', origem: 'Exótica' },
    'Dipteryx alata': { familia: 'Fabaceae', origem: 'Nativa' },
    'Dyssochroma viridiflorum': { familia: 'Solanaceae', origem: 'Nativa' },
    'Eriobotrya japonica': { familia: 'Rosaceae', origem: 'Exótica' },
    'Erythrina speciosa': { familia: 'Fabaceae', origem: 'Nativa' },
    'Euphorbia leucocephala': { familia: 'Euphorbiaceae', origem: 'Exótica' },
    'Eschweilera ovata': { familia: 'Lecythidaceae', origem: 'Nativa' },
    'Eugenia uniflora': { familia: 'Myrtaceae', origem: 'Nativa' },
    'Eugenia pyriformis': { familia: 'Myrtaceae', origem: 'Nativa' },
    'Eugenia involucrata': { familia: 'Myrtaceae', origem: 'Nativa' },
    'Eugenia javanica': { familia: 'Myrtaceae', origem: 'Exótica' },
    'Ficus benjamina': { familia: 'Moraceae', origem: 'Exótica' },
    'Ficus elastica': { familia: 'Moraceae', origem: 'Exótica' },
    'Ficus microcarpa': { familia: 'Moraceae', origem: 'Exótica' },
    'Ficus obtusifolia': { familia: 'Moraceae', origem: 'Nativa' },
    'Fraxinus uhdei': { familia: 'Oleaceae', origem: 'Exótica' },
    'Garcinia gardneriana': { familia: 'Clusiaceae', origem: 'Nativa' },
    'Gleditsia amorphoides': { familia: 'Fabaceae', origem: 'Nativa' },
    'Gochnatia polymorpha': { familia: 'Asteraceae', origem: 'Nativa' },
    'Guarea trichilioides': { familia: 'Meliaceae', origem: 'Nativa' },
    'Guarea guidonia': { familia: 'Meliaceae', origem: 'Nativa' },
    'Guazuma ulmifolia': { familia: 'Malvaceae', origem: 'Nativa' },
    'Handroanthus chrysotrichus': { familia: 'Bignoniaceae', origem: 'Nativa' },
    'Handroanthus impetiginosus': { familia: 'Bignoniaceae', origem: 'Nativa' },
    'Handroanthus albus': { familia: 'Bignoniaceae', origem: 'Nativa' },
    'Hymenaea courbaril': { familia: 'Fabaceae', origem: 'Nativa' },
    'Inga vera': { familia: 'Fabaceae', origem: 'Nativa' },
    'Jacaranda mimosifolia': { familia: 'Bignoniaceae', origem: 'Nativa' },
    'Lafoensia glyptocarpa': { familia: 'Lythraceae', origem: 'Nativa' },
    'Lagerstroemia indica': { familia: 'Lythraceae', origem: 'Exótica' },
    'Libidibia ferrea': { familia: 'Fabaceae', origem: 'Nativa' },
    'Ligustrum lucidum': { familia: 'Oleaceae', origem: 'Exótica' },
    'Lithraea molleoides': { familia: 'Anacardiaceae', origem: 'Nativa' },
    'Luehea candicans': { familia: 'Malvaceae', origem: 'Nativa' },
    'Maackia amurensis': { familia: 'Fabaceae', origem: 'Exótica' },
    'Mangifera indica': { familia: 'Anacardiaceae', origem: 'Exótica' },
    'Maytenus evonymoides': { familia: 'Celastraceae', origem: 'Nativa' },
    'Melia azedarach': { familia: 'Meliaceae', origem: 'Exótica' },
    'Metrodorea nigra': { familia: 'Rutaceae', origem: 'Nativa' },
    'Mimosa bimucronata': { familia: 'Fabaceae', origem: 'Nativa' },
    'Mimusops communis': { familia: 'Sapotaceae', origem: 'Nativa' },
    'Mollinedia schottiana': { familia: 'Monimiaceae', origem: 'Nativa' },
    'Monteverdia gonoclada': { familia: 'Celastraceae', origem: 'Nativa' },
    'Myracrodruon urundeuva': { familia: 'Anacardiaceae', origem: 'Nativa' },
    'Nectandra megapotamica': { familia: 'Lauraceae', origem: 'Nativa' },
    'Nectandra oppositifolia': { familia: 'Lauraceae', origem: 'Nativa' },
    'Ocimum gratissimum': { familia: 'Lamiaceae', origem: 'Nativa' },
    'Ocotea pulchella': { familia: 'Lauraceae', origem: 'Nativa' },
    'Ocotea puberula': { familia: 'Lauraceae', origem: 'Nativa' },
    'Olea europaea': { familia: 'Oleaceae', origem: 'Exótica' },
    'Parapiptadenia rigida': { familia: 'Fabaceae', origem: 'Nativa' },
    'Peltogyne paivaeana': { familia: 'Fabaceae', origem: 'Nativa' },
    'Peltophorum dubium': { familia: 'Fabaceae', origem: 'Nativa' },
    'Pera glabrata': { familia: 'Euphorbiaceae', origem: 'Nativa' },
    'Phoenix canariensis': { familia: 'Arecaceae', origem: 'Exótica' },
    'Phyllanthus tenellus': { familia: 'Phyllanthaceae', origem: 'Exótica' },
    'Pinus elliotis': { familia: 'Pinaceae', origem: 'Exótica' },
    'Piper aduncum': { familia: 'Piperaceae', origem: 'Nativa' },
    'Plathymenia reticulata': { familia: 'Fabaceae', origem: 'Nativa' },
    'Platanus hispanica': { familia: 'Platanaceae', origem: 'Exótica' },
    'Plumeria rubra': { familia: 'Apocynaceae', origem: 'Exótica' },
    'Poincianella pluviosa': { familia: 'Fabaceae', origem: 'Nativa' },
    'Pontidendron pinnatum': { familia: 'Euphorbiaceae', origem: 'Nativa' },
    'Pouteria torta': { familia: 'Sapotaceae', origem: 'Nativa' },
    'Psidium cattleyanum': { familia: 'Myrtaceae', origem: 'Nativa' },
    'Psidium guajava': { familia: 'Myrtaceae', origem: 'Nativa' },
    'Psidium guineense': { familia: 'Myrtaceae', origem: 'Nativa' },
    'Pterocarpus macrocarpus': { familia: 'Fabaceae', origem: 'Exótica' },
    'Pterogyne nitens': { familia: 'Fabaceae', origem: 'Nativa' },
    'Qualea grandiflora': { familia: 'Vochysiaceae', origem: 'Nativa' },
    'Rauvolfia sellowii': { familia: 'Apocynaceae', origem: 'Nativa' },
    'Retiniphyllum concolor': { familia: 'Rubiaceae', origem: 'Nativa' },
    'Rhamnidium elaeocarpum': { familia: 'Rhamnaceae', origem: 'Nativa' },
    'Richeria grandis': { familia: 'Phyllanthaceae', origem: 'Nativa' },
    'Ricinus communis': { familia: 'Euphorbiaceae', origem: 'Exótica' },
    'Robinia pseudoacacia': { familia: 'Fabaceae', origem: 'Exótica' },
    'Rollinia mucosa': { familia: 'Annonaceae', origem: 'Nativa' },
    'Ruprechtia laxiflora': { familia: 'Polygonaceae', origem: 'Nativa' },
    'Salix humboldtiana': { familia: 'Salicaceae', origem: 'Nativa' },
    'Schinus molle': { familia: 'Anacardiaceae', origem: 'Nativa' },
    'Schinus terebinthifolia': { familia: 'Anacardiaceae', origem: 'Nativa' },
    'Schizolobium parahyba': { familia: 'Fabaceae', origem: 'Nativa' },
    'Senna multijuga': { familia: 'Fabaceae', origem: 'Nativa' },
    'Sideroxylon obtusifolium': { familia: 'Sapotaceae', origem: 'Nativa' },
    'Simarouba amara': { familia: 'Simaroubaceae', origem: 'Nativa' },
    'Solanum lycocarpum': { familia: 'Solanaceae', origem: 'Nativa' },
    'Spathodea campanulata': { familia: 'Bignoniaceae', origem: 'Exótica' },
    'Syagrus romanzoffiana': { familia: 'Arecaceae', origem: 'Nativa' },
    'Syzygium jambos': { familia: 'Myrtaceae', origem: 'Exótica' },
    'Tabebuia alba': { familia: 'Bignoniaceae', origem: 'Nativa' },
    'Tabebuia roseoalba': { familia: 'Bignoniaceae', origem: 'Nativa' },
    'Tabebuia vellosoi': { familia: 'Bignoniaceae', origem: 'Nativa' },
    'Tabernaemontana catharinensis': { familia: 'Apocynaceae', origem: 'Nativa' },
    'Terminalia catappa': { familia: 'Combretaceae', origem: 'Exótica' },
    'Tipuana tipu': { familia: 'Fabaceae', origem: 'Nativa' },
    'Tibouchina granulosa': { familia: 'Melastomataceae', origem: 'Nativa' },
    'Trema micrantha': { familia: 'Cannabaceae', origem: 'Nativa' },
    'Trichilia elegans': { familia: 'Meliaceae', origem: 'Nativa' },
    'Trichilia pallida': { familia: 'Meliaceae', origem: 'Nativa' },
    'Trophis racemosa': { familia: 'Moraceae', origem: 'Nativa' },
    'Urera baccifera': { familia: 'Urticaceae', origem: 'Nativa' },
    'Vernonia ferruginea': { familia: 'Asteraceae', origem: 'Nativa' },
    'Viburnum nudum': { familia: 'Adoxaceae', origem: 'Exótica' },
    'Vitex polyneura': { familia: 'Lamiaceae', origem: 'Nativa' },
    'Vochysia magnifica': { familia: 'Vochysiaceae', origem: 'Nativa' },
    'Vochysia tucanorum': { familia: 'Vochysiaceae', origem: 'Nativa' },
    'Xylosma ciliatifolia': { familia: 'Salicaceae', origem: 'Nativa' },
    'Zanthoxylum rhoifolium': { familia: 'Rutaceae', origem: 'Nativa' },
    'Zeyheria tuberculosa': { familia: 'Bignoniaceae', origem: 'Nativa' },
    'Zingiber officinale': { familia: 'Zingiberaceae', origem: 'Exótica' },
    'Zollernia ilicifolia': { familia: 'Fabaceae', origem: 'Nativa' },
    'Araucaria angustifolia': { familia: 'Araucariaceae', origem: 'Nativa' }
};

let trees = JSON.parse(localStorage.getItem(DB_KEY)) || [];
let map = null;
let markers = {};
let currentStep = 1;
let editingId = null;
let mapFilter = 'all';

// Camadas do Mapa
let tileLayers = {
    satellite: null,
    streets: null
};
let currentLayerName = 'satellite';

// Rastreamento GPS e Percurso de Ruas Percorridas
let currentGpsPos = null; // { lat, lng, accuracy }
let currentStreetInfo = { rua: '', bairro: '', full: '' };
let gpsWatchId = null;
let isTrackingRoute = false;
let userMarker = null;
let userAccuracyCircle = null;
let routePolyline = null;
let routeCoords = []; // [[lat, lng], ...]
let lastReverseGeocodeTime = 0;
let lastGeocodedCoord = null;

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initNavigation();
    initMap();
    initGPS();
    initSpeciesSearch();
    initCatalogSearch();
    initFilters();
    initLocationFilters();
    initMapFilters();
    initFormSubmit();
    initSheetButton();
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
    loadTreesFromSheets();
});

function initSheetButton() {
    var btn = document.getElementById('btnSheet');
    if (btn) {
        btn.addEventListener('click', function() {
            window.open(SPREADSHEET_URL, '_blank');
        });
    }
}

function loadTreesFromSheets() {
    if (!SHEETS_URL) return;
    fetch(SHEETS_URL + '?action=list')
        .then(function(res) { return res.json(); })
        .then(function(data) {
            if (data && data.status === 'ok' && Array.isArray(data.trees) && data.trees.length > 0) {
                var modified = false;
                data.trees.forEach(function(st) {
                    var rawId = st.ID || st.id;
                    if (!rawId) return;
                    var id = parseInt(rawId);
                    var existingIdx = trees.findIndex(function(t) { return t.id === id; });
                    var item = {
                        id: id,
                        timestamp: st['Data Cadastro'] ? new Date(st['Data Cadastro']).getTime() : Date.now(),
                        latitude: st['Latitude'] || '',
                        longitude: st['Longitude'] || '',
                        rua: st['Rua'] || '',
                        bairro: st['Bairro'] || '',
                        logradouro: st['Logradouro'] || [st['Rua'], st['Bairro']].filter(Boolean).join(', '),
                        referencia: st['Referencia'] || '',
                        localPlantio: st['Local Plantio'] || '',
                        especie: st['Especie'] || st['Nome Cientifico'] || '',
                        nomeCientifico: st['Nome Cientifico'] || st['Especie'] || '',
                        nomePopular: st['Nome Popular'] || COMMON_NAMES[st['Especie']] || '',
                        familia: st['Familia'] || '',
                        origem: st['Origem'] || '',
                        dataColeta: st['Data Coleta'] || '',
                        amostra: st['Amostra Coletada'] || '',
                        certeza: st['Certeza'] || '',
                        porte: st['Porte'] || '',
                        tronco: st['Tronco'] || '',
                        fotos: [st['Foto 1'], st['Foto 2'], st['Foto 3'], st['Foto 4'], st['Foto 5']].filter(Boolean),
                        problemas: st['Problemas'] ? String(st['Problemas']).split(',').map(function(s){ return s.trim(); }) : [],
                        interferencia: st['Interferencias'] ? String(st['Interferencias']).split(',').map(function(s){ return s.trim(); }) : [],
                        intervencao: st['Intervencao'] || '',
                        mesPoda: st['Mes Poda'] || '',
                        dataUltimaPoda: st['Ultima Poda'] || '',
                        observacoes: st['Observacoes'] || '',
                        status: st['Status'] || 'saudavel',
                        dataAtualizacao: st['Data Atualizacao'] ? new Date(st['Data Atualizacao']).getTime() : Date.now()
                    };
                    if (existingIdx === -1) {
                        trees.push(item);
                        modified = true;
                    }
                });
                if (modified) {
                    saveData();
                    renderAll();
                }
            }
        })
        .catch(function() {
            // Silencioso se offline, mantém cache local intacto
        });
}

function initTheme() {
    var themeToggleBtns = document.querySelectorAll('#themeToggle, #themeToggleGlobal');
    if (!themeToggleBtns.length) return;

    var activeTheme = localStorage.getItem('arbore_theme');
    
    function updateIcon() {
        var isDark = document.body.classList.contains('dark-mode');
        themeToggleBtns.forEach(function(btn) {
            btn.innerHTML = isDark 
                ? '<i data-lucide="sun" class="w-4 h-4 text-amber-300"></i>' 
                : '<i data-lucide="moon" class="w-4 h-4"></i>';
        });
        if (window.lucide) {
            lucide.createIcons();
        }
    }

    if (activeTheme === 'dark') {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
    updateIcon();

    themeToggleBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            document.body.classList.toggle('dark-mode');
            var currentIsDark = document.body.classList.contains('dark-mode');
            localStorage.setItem('arbore_theme', currentIsDark ? 'dark' : 'light');
            updateIcon();
        });
    });
}

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
    }

    if (pageId === 'pageDashboard') {
        renderAll();
        if (map) {
            setTimeout(() => {
                map.invalidateSize();
                if (currentGpsPos) {
                    map.panTo([currentGpsPos.lat, currentGpsPos.lng]);
                }
            }, 180);
        }
    }
    if (pageId === 'pageCatalog') renderCatalog();
    if (pageId === 'pageForm') {
        if (!editingId) { currentStep = 1; }
        showStep(currentStep);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => lucide.createIcons(), 50);
}

// ============================================================
// MAPA & RASTREAMENTO DE PERCURSO EM CAMPO (ANDRADAS)
// ============================================================

function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
    var R = 6371e3;
    var p1 = lat1 * Math.PI / 180;
    var p2 = lat2 * Math.PI / 180;
    var dp = (lat2 - lat1) * Math.PI / 180;
    var dl = (lon2 - lon1) * Math.PI / 180;
    var a = Math.sin(dp / 2) * Math.sin(dp / 2) +
            Math.cos(p1) * Math.cos(p2) *
            Math.sin(dl / 2) * Math.sin(dl / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function calculateTotalRouteDistance() {
    var total = 0;
    for (var i = 1; i < routeCoords.length; i++) {
        total += calculateDistanceMeters(routeCoords[i - 1][0], routeCoords[i - 1][1], routeCoords[i][0], routeCoords[i][1]);
    }
    return total;
}

function updateTrackingDistanceDisplay() {
    var el = document.getElementById('trackingDistance');
    if (!el) return;
    var d = calculateTotalRouteDistance();
    if (d >= 1000) {
        el.textContent = (d / 1000).toFixed(2) + ' km';
    } else {
        el.textContent = Math.round(d) + ' m';
    }
}

function createUserLocationIcon() {
    return L.divIcon({
        className: 'user-location-marker',
        html: '<div class="user-location-pulse"></div><div class="user-location-dot"></div>',
        iconSize: [22, 22],
        iconAnchor: [11, 11]
    });
}

function initMap() {
    // Carregar percurso salvo de ruas percorridas
    try {
        var savedRoute = localStorage.getItem('arbore_breadcrumbs');
        if (savedRoute) {
            routeCoords = JSON.parse(savedRoute) || [];
        }
    } catch(e) {
        routeCoords = [];
    }

    // Inicialização do Leaflet em tela cheia com gestos e arraste suaves
    map = L.map('map', {
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: true,
        dragging: true,
        tap: true,
        touchZoom: true
    }).setView([-22.0683, -46.5733], 15);

    L.control.zoom({ position: 'bottomleft' }).addTo(map);

    // Camada 1: Satélite (ArcGIS World Imagery)
    tileLayers.satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19
    });

    // Camada 2: Mapa de Ruas com Nomes Nítidos (CartoDB Voyager)
    tileLayers.streets = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd'
    });

    // Padrão: Satélite
    tileLayers.satellite.addTo(map);

    // Polilinha do rastro de percurso percorrido (linha verde estilizada)
    routePolyline = L.polyline(routeCoords, {
        color: '#10B981',
        weight: 5,
        opacity: 0.88,
        lineJoin: 'round',
        lineCap: 'round'
    }).addTo(map);

    updateTrackingDistanceDisplay();
    initMapControls();
    startLiveGps(false);

    window.addEventListener('resize', () => {
        if (map) map.invalidateSize();
    });

    setTimeout(() => map.invalidateSize(), 300);
    renderMapMarkers();
}

function initMapControls() {
    // Botão de expandir/recolher gaveta de ferramentas do mapa
    var btnToggleTools = document.getElementById('btnToggleMapTools');
    var toolsDrawer = document.getElementById('mapToolsDrawer');
    if (btnToggleTools && toolsDrawer) {
        btnToggleTools.addEventListener('click', function(e) {
            e.stopPropagation();
            var isOpen = toolsDrawer.classList.toggle('open');
            btnToggleTools.classList.toggle('active', isOpen);
            btnToggleTools.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });
    }

    // Fechar gaveta do mapa ao clicar/arrastar no mapa
    if (map) {
        map.on('click', function() {
            if (toolsDrawer && toolsDrawer.classList.contains('open')) {
                toolsDrawer.classList.remove('open');
                if (btnToggleTools) {
                    btnToggleTools.classList.remove('active');
                    btnToggleTools.setAttribute('aria-expanded', 'false');
                }
            }
        });
    }

    // Alternância de camadas (Satélite vs Ruas)
    var btnLayer = document.getElementById('btnLayerSwitch');
    var layerLabel = document.getElementById('layerLabel');
    if (btnLayer) {
        btnLayer.addEventListener('click', function() {
            if (currentLayerName === 'satellite') {
                map.removeLayer(tileLayers.satellite);
                tileLayers.streets.addTo(map);
                currentLayerName = 'streets';
                if (layerLabel) layerLabel.textContent = 'Ruas';
                btnLayer.classList.add('active');
            } else {
                map.removeLayer(tileLayers.streets);
                tileLayers.satellite.addTo(map);
                currentLayerName = 'satellite';
                if (layerLabel) layerLabel.textContent = 'Satélite';
                btnLayer.classList.remove('active');
            }
        });
    }

    // Botão de Rastrear Percurso (Gravação das Ruas Percorridas)
    var btnTrack = document.getElementById('btnTrackRoute');
    var trackLabel = document.getElementById('trackLabel');
    var trackingBanner = document.getElementById('trackingBanner');
    if (btnTrack) {
        btnTrack.addEventListener('click', function() {
            isTrackingRoute = !isTrackingRoute;
            if (isTrackingRoute) {
                btnTrack.classList.add('active');
                if (trackLabel) trackLabel.textContent = 'Gravando Ruas';
                if (trackingBanner) trackingBanner.classList.add('show');
                startLiveGps(true);
                showToast('Rastreamento de percurso ativado!');
            } else {
                btnTrack.classList.remove('active');
                if (trackLabel) trackLabel.textContent = 'Rastrear Percurso';
                if (trackingBanner) trackingBanner.classList.remove('show');
                showToast('Gravação de percurso pausada');
            }
        });
    }

    // Botão Limpar Rastro
    var btnClearTrack = document.getElementById('btnClearTrack');
    if (btnClearTrack) {
        btnClearTrack.addEventListener('click', function() {
            if (confirm('Deseja limpar o histórico das ruas percorridas?')) {
                routeCoords = [];
                if (routePolyline) routePolyline.setLatLngs([]);
                try {
                    localStorage.removeItem('arbore_breadcrumbs');
                } catch(e){}
                updateTrackingDistanceDisplay();
                showToast('Histórico de percurso limpo!');
            }
        });
    }

    // Botão Centralizar no GPS do Usuário
    var btnCenter = document.getElementById('btnCenterUserGps');
    if (btnCenter) {
        btnCenter.addEventListener('click', function() {
            if (currentGpsPos && currentGpsPos.lat && currentGpsPos.lng) {
                map.flyTo([currentGpsPos.lat, currentGpsPos.lng], 17, { animate: true, duration: 1 });
            } else {
                if (!navigator.geolocation) {
                    showToast('GPS não disponível');
                    return;
                }
                navigator.geolocation.getCurrentPosition(function(pos) {
                    onGpsUpdate(pos, true);
                    map.flyTo([pos.coords.latitude, pos.coords.longitude], 17, { animate: true, duration: 1 });
                }, function() {
                    showToast('Não foi possível obter sua localização');
                }, { enableHighAccuracy: true, timeout: 10000 });
            }
        });
    }

    // FAB "+ Cadastrar Árvore" flutuante sobre o mapa
    var fabCadastrar = document.getElementById('fabCadastrar');
    if (fabCadastrar) {
        fabCadastrar.addEventListener('click', function() {
            navigateTo('pageForm');
            // Pré-carregar coordenadas e endereço atual se disponíveis
            if (currentGpsPos) {
                var latInput = document.getElementById('latitude');
                var lngInput = document.getElementById('longitude');
                var ruaInput = document.getElementById('rua');
                var bairroInput = document.getElementById('bairro');
                var gpsStatus = document.getElementById('gpsStatus');

                if (latInput) latInput.value = currentGpsPos.lat.toFixed(6);
                if (lngInput) lngInput.value = currentGpsPos.lng.toFixed(6);

                if (currentStreetInfo.rua && ruaInput && !ruaInput.value) {
                    ruaInput.value = currentStreetInfo.rua;
                }
                if (currentStreetInfo.bairro && bairroInput && !bairroInput.value) {
                    bairroInput.value = currentStreetInfo.bairro;
                }

                if (gpsStatus) {
                    gpsStatus.textContent = currentGpsPos.lat.toFixed(5) + ', ' + currentGpsPos.lng.toFixed(5) + 
                        (currentStreetInfo.rua ? ' (' + currentStreetInfo.rua + ')' : '');
                }
            }
        });
    }
}

// Inicia o rastreamento GPS contínuo com alta precisão
function startLiveGps(forceCenter) {
    if (!navigator.geolocation) return;

    if (gpsWatchId !== null) {
        navigator.geolocation.clearWatch(gpsWatchId);
        gpsWatchId = null;
    }

    gpsWatchId = navigator.geolocation.watchPosition(
        function(pos) {
            onGpsUpdate(pos, forceCenter);
        },
        function(err) {
            var badge = document.getElementById('currentStreetText');
            if (badge && !currentGpsPos) {
                badge.textContent = 'Toque no GPS para obter localização';
            }
        },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
}

function onGpsUpdate(pos, centerMap) {
    var lat = pos.coords.latitude;
    var lng = pos.coords.longitude;
    var accuracy = pos.coords.accuracy || 10;
    var isFirst = !currentGpsPos;

    currentGpsPos = { lat: lat, lng: lng, accuracy: accuracy };

    // Criar ou reposicionar marcador e círculo de precisão
    if (!userMarker && map) {
        userMarker = L.marker([lat, lng], {
            icon: createUserLocationIcon(),
            zIndexOffset: 1000
        }).addTo(map);

        userAccuracyCircle = L.circle([lat, lng], {
            radius: accuracy,
            color: '#3B82F6',
            fillColor: '#3B82F6',
            fillOpacity: 0.08,
            weight: 1
        }).addTo(map);

        if (isFirst || centerMap) {
            map.setView([lat, lng], 16);
        }
    } else if (userMarker) {
        userMarker.setLatLng([lat, lng]);
        if (userAccuracyCircle) {
            userAccuracyCircle.setLatLng([lat, lng]);
            userAccuracyCircle.setRadius(accuracy);
        }
    }

    // Se estiver no modo de gravação de percurso
    if (isTrackingRoute) {
        var shouldAdd = false;
        if (routeCoords.length === 0) {
            shouldAdd = true;
        } else {
            var last = routeCoords[routeCoords.length - 1];
            var dist = calculateDistanceMeters(last[0], last[1], lat, lng);
            // Salvar novo ponto apenas se moveu ao menos 4 metros (filtro de ruído de GPS estático)
            if (dist >= 4) {
                shouldAdd = true;
            }
        }

        if (shouldAdd) {
            routeCoords.push([lat, lng]);
            if (routePolyline) {
                routePolyline.setLatLngs(routeCoords);
            }
            try {
                localStorage.setItem('arbore_breadcrumbs', JSON.stringify(routeCoords));
            } catch(e){}
            updateTrackingDistanceDisplay();
        }
    }

    // Geocodificação reversa inteligente e leve para mostrar a rua atual no topo
    var now = Date.now();
    var needGeocode = false;
    if (now - lastReverseGeocodeTime > 20000) {
        needGeocode = true;
    } else if (lastGeocodedCoord) {
        var dGeocoded = calculateDistanceMeters(lastGeocodedCoord[0], lastGeocodedCoord[1], lat, lng);
        if (dGeocoded > 35) needGeocode = true;
    }

    if (needGeocode) {
        lastReverseGeocodeTime = now;
        lastGeocodedCoord = [lat, lng];
        fetchStreetNameForLiveLocation(lat, lng);
    }
}

function fetchStreetNameForLiveLocation(lat, lng) {
    var badge = document.getElementById('currentStreetText');
    var cb = 'liveGps_' + Date.now() + Math.random().toString(36).slice(2, 6);

    window[cb] = function(d) {
        delete window[cb];
        if (d && d.address) {
            var a = d.address;
            var road = a.road || a.pedestrian || a.path || a.residential || '';
            var number = a.house_number || '';
            var neighbourhood = a.neighbourhood || a.suburb || a.quarter || a.city_district || '';
            var fullRoad = road + (number ? ', ' + number : '');

            currentStreetInfo = {
                rua: fullRoad || road,
                bairro: neighbourhood,
                full: [fullRoad || road, neighbourhood].filter(Boolean).join(' - ')
            };

            if (badge) {
                badge.textContent = currentStreetInfo.full || (lat.toFixed(5) + ', ' + lng.toFixed(5));
            }
        }
    };

    var s = document.createElement('script');
    s.src = 'https://nominatim.openstreetmap.org/reverse?lat=' + lat + '&lon=' + lng + '&format=json&addressdetails=1&accept-language=pt&json_callback=' + cb;
    s.onerror = function() {
        delete window[cb];
        if (badge) badge.textContent = lat.toFixed(5) + ', ' + lng.toFixed(5);
    };
    document.body.appendChild(s);
}

function createTreeIcon(color) {
    return L.divIcon({
        className: '',
        html: '<div style="width:12px;height:12px;background:' + color + ';border-radius:50%;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.35);"></div>',
        iconSize: [12, 12],
        iconAnchor: [6, 6],
        popupAnchor: [0, -10]
    });
}

function updateMapTreeCounts() {
    var validTrees = trees.filter(t => t.latitude && t.longitude);
    var countAll = validTrees.length;
    var countSaudavel = validTrees.filter(t => t.status === 'saudavel').length;
    var countAtencao = validTrees.filter(t => t.status === 'atencao').length;
    var countCritico = validTrees.filter(t => t.status === 'critico').length;

    var elAll = document.getElementById('mapCountAll');
    var elSaudavel = document.getElementById('mapCountSaudavel');
    var elAtencao = document.getElementById('mapCountAtencao');
    var elCritico = document.getElementById('mapCountCritico');

    if (elAll) elAll.textContent = countAll;
    if (elSaudavel) elSaudavel.textContent = countSaudavel;
    if (elAtencao) elAtencao.textContent = countAtencao;
    if (elCritico) elCritico.textContent = countCritico;
}

function renderMapMarkers() {
    if (!map) return;
    Object.values(markers).forEach(m => map.removeLayer(m));
    markers = {};

    updateMapTreeCounts();

    trees.forEach(t => {
        if (!t.latitude || !t.longitude) return;

        if (mapFilter !== 'all' && t.status !== mapFilter) return;

        var color = STATUS_COLORS[t.status] || '#10B981';
        var icon = createTreeIcon(color);

        var marker = L.marker([parseFloat(t.latitude), parseFloat(t.longitude)], { icon: icon }).addTo(map);

        var photo = (t.fotos && t.fotos[0]) ? t.fotos[0] : '';
        var photoHtml = photo
            ? '<img src="' + photo + '" style="width:100%;height:85px;object-fit:cover;border-radius:8px;" alt="">'
            : '';

        var popupName = esc(t.nomePopular || COMMON_NAMES[t.especie] || t.especie || 'Árvore');
        var popupSci = (t.nomePopular || COMMON_NAMES[t.especie]) ? esc(t.especie || '') : '';
        var popupAddr = esc([t.rua, t.bairro].filter(Boolean).join(', ') || t.logradouro || t.referencia || 'Sem endereço');

        marker.bindPopup(
            '<div style="padding:10px;display:flex;flex-direction:column;gap:8px;min-width:210px;">' +
            photoHtml +
            '<div><strong style="font-size:0.92rem;color:var(--text-main);line-height:1.2;display:block;">' + popupName + '</strong>' +
            (popupSci ? '<small style="font-size:0.72rem;color:var(--text-muted);font-style:italic;display:block;margin-top:2px;">' + popupSci + '</small>' : '') +
            '<small style="font-size:0.72rem;color:var(--palm-primary);font-weight:600;display:block;margin-top:4px;">📍 ' + popupAddr + '</small></div>' +
            '<div style="display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:999px;font-size:0.65rem;font-weight:700;background:' + color + '18;color:' + color + ';width:fit-content;border:1px solid ' + color + '30;">' + (STATUS_LABELS[t.status] || '-') + '</div>' +
            '<button onclick="closePopups();openModal(' + t.id + ')" style="width:100%;padding:8px;border:none;border-radius:8px;background:var(--palm-primary);color:white;font-family:inherit;font-size:0.78rem;font-weight:700;cursor:pointer;">Ver detalhes</button>' +
            '</div>',
            { closeButton: false, maxWidth: 260 }
        );

        markers[t.id] = marker;
    });
}

function closePopups() { if (map) map.closePopup(); }

function reverseGeocode(lat, lng) {
    var statusEl = document.getElementById('gpsStatus');
    if (statusEl) statusEl.textContent = 'Obtendo endereço...';
    var cb = 'rgc' + Date.now() + Math.random().toString(36).slice(2);

    window[cb] = function(d) {
        delete window[cb];
        var ruaInput = document.getElementById('rua');
        var bairroInput = document.getElementById('bairro');

        if (d.address) {
            var a = d.address;
            var road = a.road || a.pedestrian || a.path || a.residential || '';
            var number = a.house_number || '';
            var neighbourhood = a.neighbourhood || a.suburb || a.quarter || a.city_district || a.state_district || '';
            var city = a.city || a.town || a.village || '';
            var state = a.state || '';
            var full = [road + (number ? ', ' + number : ''), neighbourhood, city, state].filter(Boolean).join(', ');

            if (ruaInput) ruaInput.value = road + (number ? ', ' + number : '');
            if (bairroInput) bairroInput.value = neighbourhood;

            currentStreetInfo = {
                rua: ruaInput ? ruaInput.value : road,
                bairro: neighbourhood,
                full: full
            };

            var badge = document.getElementById('currentStreetText');
            if (badge) badge.textContent = currentStreetInfo.rua + (neighbourhood ? ' - ' + neighbourhood : '');

            if (statusEl) {
                statusEl.textContent = lat.toFixed(5) + ', ' + lng.toFixed(5) + ' - ' + (road || neighbourhood || 'Endereço encontrado');
            }
        } else if (d.display_name) {
            var parts = d.display_name.split(',').map(function(s) { return s.trim(); });
            if (ruaInput) ruaInput.value = parts[0] || '';
            if (bairroInput) bairroInput.value = parts[1] || '';
            if (statusEl) statusEl.textContent = 'Endereço: ' + parts.slice(0, 2).join(', ');
        } else {
            if (statusEl) statusEl.textContent = lat.toFixed(5) + ', ' + lng.toFixed(5) + ' - Sem endereço';
        }
    };

    var s = document.createElement('script');
    s.src = 'https://nominatim.openstreetmap.org/reverse?lat=' + lat + '&lon=' + lng + '&format=json&addressdetails=1&accept-language=pt&json_callback=' + cb;
    s.onerror = function() {
        delete window[cb];
        if (statusEl) statusEl.textContent = lat.toFixed(5) + ', ' + lng.toFixed(5);
    };
    document.body.appendChild(s);
}

function initGPS() {
    var btn = document.getElementById('captureGps');
    if (!btn) return;

    btn.addEventListener('click', function() {
        if (!navigator.geolocation) {
            document.getElementById('gpsStatus').textContent = 'GPS não disponível';
            return;
        }
        btn.style.borderColor = '#4E6B2E';
        btn.style.borderStyle = 'solid';
        document.getElementById('gpsStatus').textContent = 'Obtendo localização...';

        navigator.geolocation.getCurrentPosition(
            function(pos) {
                var lat = pos.coords.latitude;
                var lng = pos.coords.longitude;
                document.getElementById('latitude').value = lat.toFixed(6);
                document.getElementById('longitude').value = lng.toFixed(6);
                btn.style.borderColor = '#7A9444';
                btn.style.background = 'rgba(122,148,68,0.06)';
                reverseGeocode(lat, lng);
                onGpsUpdate(pos, false);
                if (map) map.setView([lat, lng], 16);
            },
            function() {
                document.getElementById('gpsStatus').textContent = 'Erro ao obter localização';
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

    var floraSearchTimer = null;

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
                selectSpecies(v);
            });
        });

        clearTimeout(floraSearchTimer);
        if (val.length >= 3 && matches.length <= 2) {
            var searchVal = input.value.trim();
            floraSearchTimer = setTimeout(function() {
                fetchFloraData(searchVal, function(floraData) {
                    if (!floraData) return;
                    var cn = floraData.vernacularNames[0] || '';
                    var label = cn ? (cn + ' — ' + floraData.scientificName) : floraData.scientificName;
                    var floraHtml = '<div class="sdo sdo-flora" data-val="' + esc(floraData.scientificName) + '" data-flora="1">' +
                        '<span class="sdo-popular">' + esc(label) + '</span>' +
                        '<span class="sdo-cientifico">' + esc(floraData.family) + ' · ' + esc(floraData.origin) + ' · Flora e Funga</span></div>';
                    results.innerHTML = floraHtml + results.innerHTML;
                    results.classList.add('show');

                    results.querySelectorAll('.sdo-flora').forEach(function(d) {
                        d.addEventListener('click', function() {
                            var v = d.dataset.val;
                            input.value = cn || v;
                            hidden.value = v;
                            results.classList.remove('show');
                            selectSpecies(v, floraData);
                        });
                    });
                });
            }, 600);
        }
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
                selectSpecies(match);
            } else if (!hidden.value || hidden.value === input.value.trim()) {
                hidden.value = input.value.trim();
            }
        }, 250);
    });
}

function openModal(id) {
    var t = trees.find(function(x) { return x.id === id; });
    if (!t) return;

    var color = STATUS_COLORS[t.status] || '#7A9444';
    var localLabels = { calcada: 'Calcada', praca: 'Praca/Parque', canteiro: 'Canteiro Central', privada: 'Propriedade Privada', verde: 'Area Verde' };
    var porteLabels = { pequeno: 'Pequeno (P)', medio: 'Medio (M)', grande: 'Grande (G)' };
    var troncoLabels = { fino: 'Fino (F)', medio: 'Medio (M)', grosso: 'Grosso (G)' };
    var intervLabels = { nenhuma: 'Nenhuma', limpeza: 'Poda de Limpeza', adequacao: 'Poda de Adequacao', urgente: 'Risco de Queda' };
    var probLabels = { inclinacao: 'Inclinacao', rachaduras: 'Rachaduras', fungos: 'Fungos', pragas: 'Pragas', broca: 'Broca', galhos_secos: 'Galhos secos', galhos_quebrados: 'Galhos quebrados', ervas: 'Erva-de-passarinho', calcada: 'Danos a calcada', estrangulamento: 'Estrangulamento' };
    var interfLabels = { eletrica: 'Rede eletrica', iluminacao: 'Iluminacao', muros: 'Muros/telhados', acessibilidade: 'Acessibilidade' };

    var date = t.timestamp ? new Date(t.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Data nao informada';

    var photos = t.fotos || [];
    var photosHtml = '';
    if (photos.some(function(p) { return p; })) {
        var labels = ['Árvore inteira', 'Tronco', 'Folhas', 'Flores', 'Danos'];
        photosHtml = '<div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:12px;padding:12px 14px;margin-bottom:10px;box-shadow:var(--shadow-card);">' +
            '<div style="font-size:0.68rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--palm-primary);margin-bottom:8px;">Fotos Registradas</div>' +
            '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">' +
            photos.map(function(p, i) {
                if (!p) return '';
                return '<div style="display:flex;flex-direction:column;align-items:center;gap:4px;">' +
                    '<img src="' + p + '" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:8px;border:1px solid var(--border-color);" alt="">' +
                    '<span style="font-size:0.58rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;">' + (labels[i] || '') + '</span></div>';
            }).join('') +
            '</div></div>';
    }

    var nomePopularModal = t.nomePopular || COMMON_NAMES[t.especie] || '';
    var nomeCientificoModal = t.especie || '';
    var nomeExibicaoModal = nomePopularModal || nomeCientificoModal || 'Árvore sem nome';

    var html = '<div style="font-size:1.15rem;color:var(--text-main);font-weight:700;margin-bottom:2px;padding-right:36px;letter-spacing:-0.01em;">' + esc(nomeExibicaoModal) + '</div>' +
        (nomePopularModal ? '<div style="font-style:italic;font-size:0.82rem;color:var(--palm-primary);margin-bottom:6px;font-weight:500;">' + esc(nomeCientificoModal) + '</div>' : '') +
        '<div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:12px;">' + esc(t.logradouro || t.referencia || 'Sem endereço') + ' &middot; ' + date + '</div>' +
        '<div style="display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:999px;font-size:0.68rem;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:14px;background:' + color + '15;color:' + color + ';border:1px solid ' + color + '30;">' + (STATUS_LABELS[t.status] || t.status) + '</div>';

    html += '<div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:12px;padding:12px 14px;margin-bottom:10px;box-shadow:var(--shadow-card);">' +
        '<div style="font-size:0.68rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--palm-primary);margin-bottom:8px;">Localização</div>' +
        '<div style="display:flex;justify-content:space-between;padding:5px 0;font-size:0.78rem;border-bottom:1px solid var(--border-color);"><span style="color:var(--text-muted);">Logradouro</span><span style="font-weight:600;color:var(--text-main);text-align:right;">' + esc(t.logradouro || '-') + '</span></div>' +
        '<div style="display:flex;justify-content:space-between;padding:5px 0;font-size:0.78rem;border-bottom:1px solid var(--border-color);"><span style="color:var(--text-muted);">Rua</span><span style="font-weight:600;color:var(--text-main);text-align:right;">' + esc(t.rua || '-') + '</span></div>' +
        '<div style="display:flex;justify-content:space-between;padding:5px 0;font-size:0.78rem;border-bottom:1px solid var(--border-color);"><span style="color:var(--text-muted);">Bairro</span><span style="font-weight:600;color:var(--text-main);text-align:right;">' + esc(t.bairro || '-') + '</span></div>' +
        '<div style="display:flex;justify-content:space-between;padding:5px 0;font-size:0.78rem;border-bottom:1px solid var(--border-color);"><span style="color:var(--text-muted);">Referência</span><span style="font-weight:600;color:var(--text-main);text-align:right;">' + esc(t.referencia || '-') + '</span></div>' +
        '<div style="display:flex;justify-content:space-between;padding:5px 0;font-size:0.78rem;border-bottom:1px solid var(--border-color);"><span style="color:var(--text-muted);">Local</span><span style="font-weight:600;color:var(--text-main);text-align:right;">' + esc(localLabels[t.localPlantio] || '-') + '</span></div>' +
        '<div style="display:flex;justify-content:space-between;padding:5px 0;font-size:0.78rem;"><span style="color:var(--text-muted);">GPS</span><span style="font-weight:600;font-family:var(--font-display);font-size:0.74rem;color:var(--text-main);text-align:right;">' + (t.latitude ? parseFloat(t.latitude).toFixed(4) + ', ' + parseFloat(t.longitude).toFixed(4) : 'Não capturado') + '</span></div>' +
        '</div>';

    var certLabels = { certeza: 'Certeza', palpite: 'Palpite', nao_sei: 'Não sei' };
    var certColors = { certeza: '#059669', palpite: '#D97706', nao_sei: '#EF4444' };
    var certText = certLabels[t.certeza] || '-';
    var certColor = certColors[t.certeza] || 'var(--text-muted)';
    var amostraText = t.amostra === 'sim' ? 'Coletada' : t.amostra === 'nao' ? 'Não coletada' : '-';

    html += '<div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:12px;padding:12px 14px;margin-bottom:10px;box-shadow:var(--shadow-card);">' +
        '<div style="font-size:0.68rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--palm-primary);margin-bottom:8px;">Espécie & Dados Botânicos</div>' +
        '<div style="display:flex;justify-content:space-between;padding:5px 0;font-size:0.78rem;border-bottom:1px solid var(--border-color);"><span style="color:var(--text-muted);">Nome Popular</span><span style="font-weight:600;color:var(--text-main);text-align:right;">' + esc(nomePopularModal || 'Não identificado') + '</span></div>' +
        '<div style="display:flex;justify-content:space-between;padding:5px 0;font-size:0.78rem;border-bottom:1px solid var(--border-color);"><span style="color:var(--text-muted);">Nome Científico</span><span style="font-weight:600;font-style:italic;color:var(--text-main);text-align:right;">' + esc(nomeCientificoModal || 'Não identificado') + '</span></div>' +
        (t.familia ? '<div style="display:flex;justify-content:space-between;padding:5px 0;font-size:0.78rem;border-bottom:1px solid var(--border-color);"><span style="color:var(--text-muted);">Família</span><span style="font-weight:600;color:var(--text-main);text-align:right;">' + esc(t.familia) + '</span></div>' : '') +
        (t.origem ? '<div style="display:flex;justify-content:space-between;padding:5px 0;font-size:0.78rem;border-bottom:1px solid var(--border-color);"><span style="color:var(--text-muted);">Origem</span><span style="font-weight:600;color:var(--text-main);text-align:right;">' + esc(t.origem) + '</span></div>' : '') +
        '<div style="display:flex;justify-content:space-between;padding:5px 0;font-size:0.78rem;border-bottom:1px solid var(--border-color);"><span style="color:var(--text-muted);">Porte</span><span style="font-weight:600;color:var(--text-main);text-align:right;">' + esc(porteLabels[t.porte] || '-') + '</span></div>' +
        '<div style="display:flex;justify-content:space-between;padding:5px 0;font-size:0.78rem;border-bottom:1px solid var(--border-color);"><span style="color:var(--text-muted);">Tronco</span><span style="font-weight:600;color:var(--text-main);text-align:right;">' + esc(troncoLabels[t.tronco] || '-') + '</span></div>' +
        '<div style="display:flex;justify-content:space-between;padding:5px 0;font-size:0.78rem;border-bottom:1px solid var(--border-color);"><span style="color:var(--text-muted);">Identificação</span><span style="font-weight:700;color:' + certColor + ';text-align:right;">' + esc(certText) + '</span></div>' +
        '<div style="display:flex;justify-content:space-between;padding:5px 0;font-size:0.78rem;"><span style="color:var(--text-muted);">Amostra</span><span style="font-weight:600;color:var(--text-main);text-align:right;">' + esc(amostraText) + '</span></div>' +
        '</div>';

    html += photosHtml;

    html += '<div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:12px;padding:12px 14px;margin-bottom:10px;box-shadow:var(--shadow-card);">' +
        '<div style="font-size:0.68rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--palm-primary);margin-bottom:8px;">Condição & Manejo</div>' +
        '<div style="display:flex;justify-content:space-between;padding:5px 0;font-size:0.78rem;border-bottom:1px solid var(--border-color);"><span style="color:var(--text-muted);">Problemas</span><span style="font-weight:600;color:var(--text-main);text-align:right;">' + (t.problemas && t.problemas.length ? t.problemas.map(function(p) { return probLabels[p] || p; }).join(', ') : 'Nenhum') + '</span></div>' +
        '<div style="display:flex;justify-content:space-between;padding:5px 0;font-size:0.78rem;border-bottom:1px solid var(--border-color);"><span style="color:var(--text-muted);">Interferências</span><span style="font-weight:600;color:var(--text-main);text-align:right;">' + (t.interferencia && t.interferencia.length ? t.interferencia.map(function(i) { return interfLabels[i] || i; }).join(', ') : 'Nenhuma') + '</span></div>' +
        '<div style="display:flex;justify-content:space-between;padding:5px 0;font-size:0.78rem;border-bottom:1px solid var(--border-color);"><span style="color:var(--text-muted);">Intervenção</span><span style="font-weight:600;color:var(--text-main);text-align:right;">' + (intervLabels[t.intervencao] || '-') + '</span></div>' +
        '<div style="display:flex;justify-content:space-between;padding:5px 0;font-size:0.78rem;"><span style="color:var(--text-muted);">Última Poda</span><span style="font-weight:600;color:var(--text-main);text-align:right;">' + (t.dataUltimaPoda || '-') + '</span></div>' +
        '</div>';

    if (t.observacoes) {
        html += '<div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:12px;padding:12px 14px;margin-bottom:10px;box-shadow:var(--shadow-card);"><div style="font-size:0.68rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--palm-primary);margin-bottom:6px;">Observações</div><div style="font-size:0.8rem;color:var(--text-main);line-height:1.5;">' + esc(t.observacoes) + '</div></div>';
    }

    html += '<div style="display:flex;gap:10px;margin-top:16px;">' +
        '<button onclick="editTree(' + t.id + ')" style="flex:1;padding:12px 20px;border:1px solid var(--palm-primary);border-radius:10px;background:var(--palm-primary);color:white;font-size:0.88rem;font-weight:700;cursor:pointer;">Editar Cadastro</button>' +
        '<button onclick="deleteTree(' + t.id + ')" style="flex:0 0 auto;padding:12px 18px;background:rgba(239,68,68,0.1);color:#EF4444;border:1px solid rgba(239,68,68,0.25);border-radius:10px;font-size:0.88rem;font-weight:700;cursor:pointer;">Excluir</button>' +
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
    document.getElementById('rua').value = t.rua || '';
    document.getElementById('bairro').value = t.bairro || '';
    document.getElementById('referencia').value = t.referencia || '';

    if (t.localPlantio) { var r = document.querySelector('input[name="localPlantio"][value="' + t.localPlantio + '"]'); if (r) r.checked = true; }
    document.getElementById('especieSearch').value = t.especie || '';
    document.getElementById('especie').value = t.especie || '';
    if (t.especie) selectSpecies(t.especie);
    if (t.certeza) { var r2 = document.querySelector('input[name="certeza"][value="' + t.certeza + '"]'); if (r2) r2.checked = true; }
    if (t.amostra) { var r2a = document.querySelector('input[name="amostra"][value="' + t.amostra + '"]'); if (r2a) r2a.checked = true; }
    if (t.porte) { var r3 = document.querySelector('input[name="porte"][value="' + t.porte + '"]'); if (r3) r3.checked = true; }
    if (t.tronco) { var r4 = document.querySelector('input[name="tronco"][value="' + t.tronco + '"]'); if (r4) r4.checked = true; }
    if (t.problemas) t.problemas.forEach(function(p) { var r5 = document.querySelector('input[name="problemas"][value="' + p + '"]'); if (r5) r5.checked = true; });
    if (t.interferencia) t.interferencia.forEach(function(i) { var r6 = document.querySelector('input[name="interferencia"][value="' + i + '"]'); if (r6) r6.checked = true; });
    if (t.intervencao) { var r7 = document.querySelector('input[name="intervencao"][value="' + t.intervencao + '"]'); if (r7) r7.checked = true; }
    document.getElementById('dataUltimaPoda').value = t.dataUltimaPoda || '';
    document.getElementById('observacoes').value = t.observacoes || '';

    if (t.fotos) {
        for (var i = 1; i <= 5; i++) {
            var p = document.getElementById('preview' + i);
            if (p && t.fotos[i - 1]) { p.src = t.fotos[i - 1]; p.classList.remove('hidden'); p.classList.add('block'); }
        }
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
            mesPoda: data.mesPoda || '',
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

function selectSpecies(name, floraData) {
    var searchInput = document.getElementById('especieSearch');
    var hiddenInput = document.getElementById('especie');
    if (searchInput) searchInput.value = COMMON_NAMES[name] || name;
    if (hiddenInput) hiddenInput.value = name;
    
    var infoEl = document.getElementById('speciesInfo');
    var html = '<div class="flex flex-wrap gap-2 text-[10px]">';

    var data = SPECIES_DATA[name];
    if (data) {
        html += '<span class="px-2 py-1 bg-leaf/10 text-leaf rounded-full font-semibold">' + esc(data.familia) + '</span>';
        html += '<span class="px-2 py-1 bg-terra/10 text-terra rounded-full font-semibold">' + esc(data.origem) + '</span>';
    }

    if (floraData) {
        if (!data) {
            html += '<span class="px-2 py-1 bg-leaf/10 text-leaf rounded-full font-semibold">' + esc(floraData.family) + '</span>';
            html += '<span class="px-2 py-1 bg-terra/10 text-terra rounded-full font-semibold">' + esc(floraData.origin) + '</span>';
        }
        if (floraData.lifeForm) {
            html += '<span class="px-2 py-1 bg-sky-100 text-sky-700 rounded-full font-semibold">' + esc(floraData.lifeForm) + '</span>';
        }
        if (floraData.habitat) {
            html += '<span class="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full font-semibold">' + esc(floraData.habitat) + '</span>';
        }
        html += '<span class="px-2 py-1 bg-violet-100 text-violet-700 rounded-full font-semibold">Flora e Funga</span>';
    }

    html += '</div>';
    if (infoEl) {
        infoEl.innerHTML = html;
        infoEl.classList.remove('hidden');
    }

    if (!floraData) {
        fetchFloraData(name, function(flora) {
            if (flora) selectSpecies(name, flora);
        });
    }
}

function esc(s) {
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
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
        el.classList.toggle('active', sn === n);
        el.style.color = '';
        el.style.fontWeight = '';
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
    d.latitude = (document.getElementById('latitude') || {}).value || '';
    d.longitude = (document.getElementById('longitude') || {}).value || '';
    d.rua = (document.getElementById('rua') || {}).value || '';
    d.bairro = (document.getElementById('bairro') || {}).value || '';
    d.logradouro = [d.rua, d.bairro].filter(Boolean).join(', ');
    d.referencia = (document.getElementById('referencia') || {}).value || '';
    d.localPlantio = (document.querySelector('input[name="localPlantio"]:checked') || {}).value || '';
    d.especie = (document.getElementById('especie') || {}).value || (document.getElementById('especieSearch') || {}).value || '';
    d.certeza = (document.querySelector('input[name="certeza"]:checked') || {}).value || '';
    d.amostra = (document.querySelector('input[name="amostra"]:checked') || {}).value || '';
    d.porte = (document.querySelector('input[name="porte"]:checked') || {}).value || '';
    d.tronco = (document.querySelector('input[name="tronco"]:checked') || {}).value || '';

    var especieData = SPECIES_DATA[d.especie] || {};
    var floraCached = floraCache[d.especie];
    d.nomePopular = COMMON_NAMES[d.especie] || (floraCached && floraCached.vernacularNames[0]) || '';
    d.nomeCientifico = d.especie || '';
    d.familia = especieData.familia || (floraCached && floraCached.family) || '';
    d.origem = especieData.origem || (floraCached && floraCached.origin) || '';
    d.formaVida = (floraCached && floraCached.lifeForm) || '';
    d.habitat = (floraCached && floraCached.habitat) || '';
    d.tipoVegetacao = (floraCached && floraCached.vegetationType) || '';
    d.dataColeta = new Date().toLocaleDateString('pt-BR');

    d.fotos = [];
    for (var i = 1; i <= 5; i++) {
        var p = document.getElementById('preview' + i);
        d.fotos.push((p && !p.classList.contains('hidden') && p.src) ? p.src : '');
    }
    d.fotoCount = d.fotos.filter(function(f) { return f; }).length;

    d.problemas = Array.from(document.querySelectorAll('input[name="problemas"]:checked')).map(function(c) { return c.value; });
    d.interferencia = Array.from(document.querySelectorAll('input[name="interferencia"]:checked')).map(function(c) { return c.value; });
    d.intervencao = (document.querySelector('input[name="intervencao"]:checked') || {}).value || '';
    d.dataUltimaPoda = (document.getElementById('dataUltimaPoda') || {}).value || '';
    d.mesPoda = d.dataUltimaPoda ? (new Date(d.dataUltimaPoda + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'long' })) : '';
    d.observacoes = (document.getElementById('observacoes') || {}).value || '';
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
    renderMapMarkers();
    renderRecent();
    populateLocationFilters();
}

function renderStats() {
    var total = trees.length;
    var risco = trees.filter(function(t) { return t.intervencao === 'urgente' || t.status === 'critico'; }).length;
    var poda = trees.filter(function(t) {
        return t.intervencao === 'limpeza' || t.intervencao === 'adequacao';
    }).length;

    var el1 = document.getElementById('totalTrees');
    if (el1) el1.textContent = total;
    var el2 = document.getElementById('statRisco');
    if (el2) el2.textContent = risco;
    var el3 = document.getElementById('statPoda');
    if (el3) el3.textContent = poda;
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

    el.innerHTML = sorted.map(function(t) {
        var color = STATUS_COLORS[t.status] || '#7A9444';
        var photo = (t.fotos && t.fotos[0]) ? t.fotos[0] : '';
        var iconName = getTreeIcon(t.id);
        var nomePopular = t.nomePopular || COMMON_NAMES[t.especie] || '';
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
    var certFilter = (document.querySelector('.cert-filter.active') || {}).dataset || {};
    certFilter = certFilter.cert || 'all';
    var amostraFilter = (document.querySelector('.amostra-filter.active') || {}).dataset || {};
    amostraFilter = amostraFilter.amostra || 'all';
    var bairroFilter = (document.getElementById('filterBairro') || {}).value || '';
    var ruaFilter = (document.getElementById('filterRua') || {}).value || '';

    var filtered = trees;
    if (search) {
        filtered = filtered.filter(function(t) {
            var nomePopular = (t.nomePopular || COMMON_NAMES[t.especie] || '').toLowerCase();
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
    if (certFilter !== 'all') {
        filtered = filtered.filter(function(t) { return t.certeza === certFilter; });
    }
    if (amostraFilter !== 'all') {
        filtered = filtered.filter(function(t) { return t.amostra === amostraFilter; });
    }
    if (bairroFilter) {
        filtered = filtered.filter(function(t) { return t.bairro === bairroFilter; });
    }
    if (ruaFilter) {
        filtered = filtered.filter(function(t) { return t.rua === ruaFilter; });
    }

    if (filtered.length === 0) {
        el.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;padding:32px 20px;text-align:center;">' +
            '<div style="width:52px;height:52px;border-radius:50%;background:rgba(5,150,105,0.08);display:flex;align-items:center;justify-content:center;margin-bottom:12px;"><i data-lucide="trees" class="w-6 h-6 text-palm"></i></div>' +
            '<p style="font-size:0.95rem;font-weight:600;color:var(--text-main);">' + (search ? 'Nenhum resultado' : 'Nenhuma árvore cadastrada') + '</p>' +
            '<p style="font-size:0.75rem;color:var(--text-muted);margin-top:4px;">' + (search ? 'Tente outros termos ou limpe os filtros' : 'Cadastre a primeira árvore pelo formulário') + '</p>' +
            '</div>';
        lucide.createIcons();
        updateCatalogFilterBadge();
        return;
    }

    el.innerHTML = filtered.map(function(t) {
        var color = STATUS_COLORS[t.status] || '#10B981';
        var photo = (t.fotos && t.fotos[0]) ? t.fotos[0] : '';
        var iconName = getTreeIcon(t.id);

        var iconHtml;
        if (photo) {
            iconHtml = '<img src="' + photo + '" style="width:46px;height:46px;border-radius:var(--organic);object-fit:cover;" alt="">';
        } else {
            iconHtml = '<i data-lucide="' + iconName + '" class="w-6 h-6" style="color:' + color + ';"></i>';
        }

        var nomePopular = t.nomePopular || COMMON_NAMES[t.especie] || '';
        var nomeCientifico = t.especie || '';
        var nomeExibicao = nomePopular || nomeCientifico || 'Árvore sem nome';
        var locationStr = [t.rua, t.bairro].filter(Boolean).join(', ') || t.logradouro || t.referencia || 'Sem endereço';
        var subtitulo = nomePopular ? nomeCientifico : locationStr;

        var certBadge = '';
        if (t.certeza === 'certeza') certBadge = '<span style="display:inline-flex;align-items:center;gap:3px;background:rgba(5,150,105,0.1);color:#059669;font-size:9px;font-weight:700;padding:2px 7px;border-radius:8px;margin-top:4px;"><svg viewBox="0 0 24 24" width="9" height="9" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>Certeza</span>';
        else if (t.certeza === 'palpite') certBadge = '<span style="display:inline-flex;align-items:center;gap:3px;background:rgba(245,158,11,0.1);color:#D97706;font-size:9px;font-weight:700;padding:2px 7px;border-radius:8px;margin-top:4px;"><svg viewBox="0 0 24 24" width="9" height="9" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><circle cx="12" cy="17" r=".5"/></svg>Palpite</span>';
        else if (t.certeza === 'nao_sei') certBadge = '<span style="display:inline-flex;align-items:center;gap:3px;background:rgba(239,68,68,0.1);color:#EF4444;font-size:9px;font-weight:700;padding:2px 7px;border-radius:8px;margin-top:4px;"><svg viewBox="0 0 24 24" width="9" height="9" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>Não sei</span>';

        var amostraBadge = '';
        if (t.amostra === 'sim') amostraBadge = '<span style="display:inline-flex;align-items:center;gap:3px;background:rgba(5,150,105,0.1);color:#059669;font-size:9px;font-weight:700;padding:2px 7px;border-radius:8px;margin-top:4px;margin-left:4px;"><svg viewBox="0 0 24 24" width="9" height="9" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 3v12"/><circle cx="18" cy="9" r="3"/><path d="M18 12v6"/><path d="M6 9h12"/></svg>Amostra</span>';

        return '<div class="list-card cc" data-id="' + t.id + '">' +
            '<div class="list-card-icon" style="background:' + color + '12;display:flex;align-items:center;justify-content:center;">' + iconHtml + '</div>' +
            '<div style="flex:1;min-width:0;">' +
            '<div style="font-weight:700;font-size:0.88rem;color:var(--text-main);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + esc(nomeExibicao) + '</div>' +
            '<div style="font-size:0.72rem;color:var(--text-muted);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-style:italic;">' + esc(subtitulo) + '</div>' +
            '<div style="display:flex;flex-wrap:wrap;gap:2px;">' + certBadge + amostraBadge + '</div>' +
            '</div>' +
            '<svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" style="color:var(--text-muted);opacity:0.6;" stroke-width="1.5" stroke-linecap="round"><path d="M7 5l5 5-5 5"/></svg>' +
            '</div>';
    }).join('');

    lucide.createIcons();
    updateCatalogFilterBadge();

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
    function setupFilterGroup(selector) {
        document.querySelectorAll(selector).forEach(function(f) {
            f.addEventListener('click', function() {
                document.querySelectorAll(selector).forEach(function(x) {
                    x.classList.remove('active');
                    x.style.background = '';
                    x.style.color = '';
                    x.style.borderColor = '';
                });
                f.classList.add('active');
                renderCatalog();
            });
        });
    }

    setupFilterGroup('.filter');
    setupFilterGroup('.cert-filter');
    setupFilterGroup('.amostra-filter');

    // Botão de expandir/recolher gaveta de filtros do catálogo
    var btnToggleCatalog = document.getElementById('btnToggleCatalogFilters');
    var catalogDrawer = document.getElementById('catalogFiltersDrawer');
    if (btnToggleCatalog && catalogDrawer) {
        btnToggleCatalog.addEventListener('click', function() {
            var isOpen = catalogDrawer.classList.toggle('open');
            btnToggleCatalog.classList.toggle('active', isOpen);
            btnToggleCatalog.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });
    }

    // Botão de limpar todos os filtros do catálogo
    var btnClearAll = document.getElementById('btnClearAllFilters');
    if (btnClearAll) {
        btnClearAll.addEventListener('click', function() {
            var searchInput = document.getElementById('catalogSearch');
            if (searchInput) searchInput.value = '';

            var bSelect = document.getElementById('filterBairro');
            if (bSelect) bSelect.value = '';

            var rSelect = document.getElementById('filterRua');
            if (rSelect) rSelect.value = '';

            document.querySelectorAll('.filter').forEach(function(x) {
                x.classList.toggle('active', x.dataset.filter === 'all');
                x.style.background = ''; x.style.color = ''; x.style.borderColor = '';
            });
            document.querySelectorAll('.cert-filter').forEach(function(x) {
                x.classList.toggle('active', x.dataset.cert === 'all');
                x.style.background = ''; x.style.color = ''; x.style.borderColor = '';
            });
            document.querySelectorAll('.amostra-filter').forEach(function(x) {
                x.classList.toggle('active', x.dataset.amostra === 'all');
                x.style.background = ''; x.style.color = ''; x.style.borderColor = '';
            });

            renderCatalog();
        });
    }
}

function updateCatalogFilterBadge() {
    var activeCount = 0;
    var searchInput = document.getElementById('catalogSearch');
    if (searchInput && searchInput.value.trim().length > 0) activeCount++;

    var bSelect = document.getElementById('filterBairro');
    if (bSelect && bSelect.value) activeCount++;

    var rSelect = document.getElementById('filterRua');
    if (rSelect && rSelect.value) activeCount++;

    var activeFilter = document.querySelector('.filter.active');
    if (activeFilter && activeFilter.dataset.filter && activeFilter.dataset.filter !== 'all') activeCount++;

    var activeCert = document.querySelector('.cert-filter.active');
    if (activeCert && activeCert.dataset.cert && activeCert.dataset.cert !== 'all') activeCount++;

    var activeAmostra = document.querySelector('.amostra-filter.active');
    if (activeAmostra && activeAmostra.dataset.amostra && activeAmostra.dataset.amostra !== 'all') activeCount++;

    var badge = document.getElementById('activeFilterBadge');
    if (badge) {
        if (activeCount > 0) {
            badge.textContent = activeCount;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }
}

function initMapFilters() {
    var chips = document.querySelectorAll('.map-filter, .map-filter-chip');
    chips.forEach(function(f) {
        f.addEventListener('click', function() {
            chips.forEach(function(x) {
                x.classList.remove('active');
            });
            f.classList.add('active');
            mapFilter = f.dataset.mapFilter || 'all';

            var dot = document.getElementById('mapFilterDot');
            if (dot) {
                if (mapFilter !== 'all') {
                    dot.classList.remove('hidden');
                } else {
                    dot.classList.add('hidden');
                }
            }

            renderMapMarkers();
        });
    });
}

