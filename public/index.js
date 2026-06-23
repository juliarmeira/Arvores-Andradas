/* ═══════════════════════════════════════════════════════════
   ArboAndradas — Inventário Arbóreo Urbano
   index.js — Lógica de Front-End Otimizada
════════════════════════════════════════════════════════════════ */

// ── LISTA BASE DE ESPÉCIES ────────────────────────────────────
let SPECIES_LIST = JSON.parse(localStorage.getItem("speciesList") || "null") || [
  "Ipê Amarelo", "Ipê Roxo", "Ipê Branco", "Ipê Rosa",
  "Sibipiruna", "Flamboyant", "Jacarandá-Mimoso", "Amendoim Bravo",
  "Oiti", "Ficus", "Mangueira", "Jambolão", "Eucalipto",
  "Aroeira Pimenteira", "Aroeira Salso", "Pitanga", "Goiabeira",
  "Abacateiro", "Coqueiro", "Palmeira Imperial", "Jerivá",
  "Pata-de-Vaca", "Resedá", "Tipuana", "Nim", "Teca",
  "Leucena", "Acácia", "Canafístula", "Embaúba",
  "Cedro", "Jatobá", "Angico", "Baru", "Pequi",
  "Tamarindo", "Saboneteira", "Olmo-Siberiano", "Cinamomo"
];

// ── STATE ─────────────────────────────────────────────────────
const state = {
  photos: [null, null, null, null, null],
  latitude: null,
  longitude: null,
  accuracy: null,
  map: null,
  marker: null,
  // URL fornecida pelo usuário
  sheetUrl: localStorage.getItem("sheetUrl") || "https://script.google.com/macros/s/AKfycbxbFdpsZfTO-GvSuzGXWQd8msFseWcr_Ibtq-Z5UywqFBuhF75Syz9anS2Ao0QgoQrg/exec"
};

const DEFAULT_LAT = -22.067;
const DEFAULT_LNG = -46.568;

// ── DOM REFS ──────────────────────────────────────────────────
const $  = (id) => document.getElementById(id);
const $$ = (sel) => document.querySelectorAll(sel);

// ── INIT ──────────────────────────────────────────────────────
window.addEventListener("DOMContentLoaded", () => {
  $("input-sheet-url").value = state.sheetUrl;

  initMap();
  buildSpeciesSelect();
  setupPhotoSlots();
  setupEventListeners();
  updateProgress();
  updateSubmitState();
});

// ── MAP & GEOCODING ───────────────────────────────────────────
function initMap() {
  const mapEl = $("mini-map");
  if (typeof L === "undefined") {
    mapEl.innerHTML = "<div style='padding:20px;text-align:center;'>Mapa indisponível sem internet</div>";
    return;
  }
  state.map = L.map("mini-map", { zoomControl: true, attributionControl: false })
               .setView([DEFAULT_LAT, DEFAULT_LNG], 13);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(state.map);
  
  state.marker = L.marker([DEFAULT_LAT, DEFAULT_LNG], {draggable: true}).addTo(state.map);
  
  // Ao arrastar o marcador, atualiza lat/lng e busca endereço
  state.marker.on('dragend', function (event) {
    const position = state.marker.getLatLng();
    updateLocation(position.lat, position.lng);
  });

  // Ao clicar no mapa, move o marcador e busca endereço
  state.map.on('click', function(e) {
    state.marker.setLatLng(e.latlng);
    updateLocation(e.latlng.lat, e.latlng.lng);
  });
}

function updateLocation(lat, lng, acc = null) {
  state.latitude = lat;
  state.longitude = lng;
  state.accuracy = acc;
  
  if (state.map && state.marker) {
    state.map.setView([lat, lng], 17);
    state.marker.setLatLng([lat, lng]);
  }
  
  $("gps-status-text").textContent = `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`;
  updateSubmitState();
  
  // Reverse Geocoding
  fetchAddress(lat, lng);
}

async function fetchAddress(lat, lng) {
  try {
    const addressInput = $("loc-address");
    addressInput.placeholder = "Buscando endereço...";
    
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
      headers: {
        "Accept-Language": "pt-BR",
        "User-Agent": "ArboAndradas/1.0"
      }
    });
    const data = await res.json();
    if (data && data.address) {
      const road = data.address.road || data.address.pedestrian || "";
      const suburb = data.address.suburb || data.address.neighbourhood || "";
      const city = data.address.city || data.address.town || data.address.village || "";
      
      let fullAddress = road;
      if (suburb) fullAddress += ` — ${suburb}`;
      if (city && !fullAddress.includes(city)) fullAddress += `, ${city}`;
      
      if (fullAddress) {
        addressInput.value = fullAddress;
        updateSubmitState();
        updateProgress();
        showToast("📍 Endereço preenchido automaticamente!");
      }
    }
  } catch (err) {
    console.error("Erro no Geocoding:", err);
  }
}

function startGpsTracking() {
  const btn = $("btn-refresh-gps");
  const status = $("gps-status-text");
  
  if (!navigator.geolocation) {
    status.textContent = "GPS não suportado";
    return;
  }

  btn.disabled = true;
  status.textContent = "Buscando satélites...";

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      updateLocation(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy);
      btn.disabled = false;
    },
    (err) => {
      status.textContent = "Sinal de GPS fraco ou negado. Tente clicar no mapa.";
      btn.disabled = false;
      showToast("Não foi possível obter o GPS exato.", "error");
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
  );
}

// ── SPECIES SELECT ────────────────────────────────────────────
function buildSpeciesSelect() {
  const select = $("sp-name-select");
  select.innerHTML = '<option value="">— Selecione uma espécie —</option>';
  
  SPECIES_LIST.sort().forEach((sp) => {
    const opt = document.createElement("option");
    opt.value = sp;
    opt.textContent = sp;
    select.appendChild(opt);
  });
  
  const customOpt = document.createElement("option");
  customOpt.value = "Outra";
  customOpt.textContent = "➕ Outra (Digitar nome)";
  select.appendChild(customOpt);
}

// ── PHOTO SLOTS ───────────────────────────────────────────────
function setupPhotoSlots() {
  for (let i = 0; i < 3; i++) { // Reduzimos para 3 fotos no HTML
    const fileInput = $(`file-${i}`);
    if (!fileInput) continue;
    
    fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) handlePhotoFile(file, i);
    });

    const removeBtn = document.querySelector(`.btn-remove-photo[data-slot="${i}"]`);
    if (removeBtn) removeBtn.addEventListener("click", () => clearPhoto(i));
  }
}

function handlePhotoFile(file, slot) {
  const reader = new FileReader();
  reader.onload = (e) => {
    state.photos[slot] = e.target.result;
    renderPhotoPreview(slot, e.target.result);
    updateSubmitState();
    updateProgress();
  };
  reader.readAsDataURL(file);
}

function renderPhotoPreview(slot, src) {
  const area = $(`preview-${slot}`);
  area.innerHTML = `<img src="${src}" alt="Foto ${slot + 1}">`;
  const removeBtn = document.querySelector(`.btn-remove-photo[data-slot="${slot}"]`);
  if (removeBtn) removeBtn.classList.remove("hidden");
}

function clearPhoto(slot) {
  state.photos[slot] = null;
  const area = $(`preview-${slot}`);
  area.innerHTML = `<div class="photo-placeholder"><i class="fa-regular fa-image"></i></div>`;
  const removeBtn = document.querySelector(`.btn-remove-photo[data-slot="${slot}"]`);
  if (removeBtn) removeBtn.classList.add("hidden");
  
  const fileInput = $(`file-${slot}`);
  if (fileInput) fileInput.value = "";

  updateSubmitState();
  updateProgress();
}

// ── PROGRESS BAR ──────────────────────────────────────────────
const SECTIONS = 6;

function updateProgress() {
  let filled = 0;

  // 1: Localização (Endereço + Local)
  if ($('loc-address').value.trim() && $('loc-place').value) filled++;
  
  // 2: Espécie (Select ou Input Custom)
  const spSelect = $('sp-name-select').value;
  if (spSelect && spSelect !== 'Outra') filled++;
  else if (spSelect === 'Outra' && $('sp-name-custom').value.trim()) filled++;
  
  // 3: Fotos (ao menos a 1)
  if (state.photos[0]) filled++;
  
  // 4: Dimensões
  if (document.querySelector('input[name="dim-height"]:checked') &&
      document.querySelector('input[name="dim-trunk"]:checked')) filled++;
      
  // 5: Sanitária — always considered filled once the user sees it
  filled++;
  
  // 6: Poda/Obs — always considered filled
  filled++;

  const pct = Math.round((filled / SECTIONS) * 100);
  $('progress-fill').style.width = pct + '%';
  $('progress-label').textContent = `${pct}% Concluído`;
  const sectEl = $('progress-sections');
  if (sectEl) sectEl.textContent = `Seção ${Math.min(filled, SECTIONS)} de ${SECTIONS}`;
}

// ── SUBMIT STATE ──────────────────────────────────────────────
function updateSubmitState() {
  const hasPhoto   = !!state.photos[0];
  const hasAddress = !!$('loc-address').value.trim();
  const hasSheet   = !!state.sheetUrl;

  const btn  = $('btn-submit-form');
  const info = $('submit-info');
  const note = $('submit-note');

  if (hasPhoto && hasAddress && hasSheet) {
    btn.disabled = false;
    if (info) info.classList.add('hidden');
  } else {
    btn.disabled = true;
    if (info) info.classList.remove('hidden');
    if (!hasSheet) note.textContent = 'Configure a URL do Web App nas Configurações.';
    else if (!hasPhoto) note.textContent = 'Foto 1 (Árvore Inteira) obrigatória para registrar.';
    else note.textContent = 'Preencha o logradouro para habilitar o envio.';
  }
}

// ── EVENT LISTENERS ───────────────────────────────────────────
function setupEventListeners() {
  
  $("btn-refresh-gps").addEventListener("click", startGpsTracking);

  $("sp-name-select").addEventListener("change", (e) => {
    const customGroup = $("custom-species-group");
    if (e.target.value === "Outra") {
      customGroup.classList.remove("hidden");
    } else {
      customGroup.classList.add("hidden");
    }
    updateProgress();
  });

  $("btn-toggle-config").addEventListener("click", () => $("config-section").classList.remove("hidden"));
  $("btn-close-config").addEventListener("click", () => $("config-section").classList.add("hidden"));
  
  $("btn-save-config").addEventListener("click", () => {
    const url = $("input-sheet-url").value.trim();
    state.sheetUrl = url;
    localStorage.setItem("sheetUrl", url);
    updateSubmitState();
    $("config-section").classList.add("hidden");
    showToast("⚙️ Configurações salvas!", "success");
  });

  // Events that affect progress
  ["loc-address", "loc-place", "sp-name-custom", "poda-necessidade"].forEach(id => {
    const el = $(id);
    if (el) {
      el.addEventListener("change", () => { updateSubmitState(); updateProgress(); });
      el.addEventListener("input",  () => { updateSubmitState(); updateProgress(); });
    }
  });

  $$('input[name="dim-height"], input[name="dim-trunk"]').forEach(r =>
    r.addEventListener("change", updateProgress)
  );

  $("tree-form").addEventListener("submit", submitToSheet);

  $("btn-new-registration").addEventListener("click", () => {
    $("success-modal").classList.add("hidden");
    resetForm();
  });
}

// ── COLLECT FORM DATA ─────────────────────────────────────────
function collectFormData() {
  const r = (name) => {
    const el = document.querySelector(`input[name="${name}"]:checked`);
    return el ? el.value : "";
  };

  const spSelect = $("sp-name-select").value;
  const especieFinal = spSelect === "Outra" ? $("sp-name-custom").value.trim() : spSelect;

  return {
    logradouro:   $("loc-address").value.trim(),
    referencia:   $("loc-reference").value.trim(),
    localPlantio: $("loc-place").value,
    especie:      especieFinal,
    certezaEspecie: r("sp-certainty"),
    porte:        r("dim-height"),
    tronco:       r("dim-trunk"),
    inclinacao:   r("san-inclinacao"),
    rachaduras:   r("san-rachaduras"),
    fungos:       r("san-pragas"), // simplified
    pragasBase:   r("san-pragas"),
    broca:        "Não",
    galhosSecos:  r("san-galhos"),
    galhosQuebrados: r("san-galhos"),
    parasitas:    "Não",
    raizesCalcada: r("int-calcada"),
    raizesEstrang: "Não",
    intEletrica:   r("int-eletrica"),
    intIluminacao: r("int-eletrica"),
    intMuros:      r("int-muros"),
    intAcessibilidade: r("int-muros"),
    podaNecessidade: $("poda-necessidade").value,
    podaMes:       "",
    podaUltima:    "",
    podaHistorico: "",
    obsFinais: $("obs-finais").value.trim(),
    latitude:  state.latitude || "",
    longitude: state.longitude || "",
    foto0: state.photos[0] || "",
    foto1: state.photos[1] || "",
    foto2: state.photos[2] || "",
    foto3: "",
    foto4: ""
  };
}

// ── SUBMIT TO GOOGLE SHEET ────────────────────────────────────
async function submitToSheet(e) {
  e.preventDefault();

  if (!state.sheetUrl) {
    showToast("Configure a URL do Apps Script primeiro!", "error");
    $("config-section").classList.remove("hidden");
    return;
  }

  const btn = $("btn-submit-form");
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Enviando...</span>';

  const protocolo = `ARV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
  const formData = collectFormData();
  const data = { protocolo, ...formData };

  try {
    // Para evitar bloqueio de CORS do navegador, usamos mode: 'no-cors'.
    // O Apps Script recebe o POST com sucesso, mas o fetch() retornará uma resposta 'opaque'.
    await fetch(state.sheetUrl, {
      method:  "POST",
      mode:    "no-cors",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(data),
    });

    // Salvar nova espécie se for "Outra"
    if ($("sp-name-select").value === "Outra" && formData.especie) {
      if (!SPECIES_LIST.includes(formData.especie)) {
        SPECIES_LIST.push(formData.especie);
        localStorage.setItem("speciesList", JSON.stringify(SPECIES_LIST));
        buildSpeciesSelect();
      }
    }

    // Sucesso garantido na UX
    $("success-sp").textContent   = formData.especie || "Não identificada";
    $("success-addr").textContent = formData.logradouro || "—";
    $("success-proto").textContent = protocolo;
    
    // Link direto fornecido pelo usuário para ver a planilha
    $("btn-open-spreadsheet").href = "https://docs.google.com/spreadsheets/d/1A8mIArlQiqcvnIgRGYgSiU5WDF2ClbGYe0XOHiyOciU/edit";
    
    $("success-modal").classList.remove("hidden");

  } catch (err) {
    console.error(err);
    showToast("Erro ao enviar dados. Verifique a internet.", "error");
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-leaf"></i> <span>Registrar Vistoria</span>';
    updateSubmitState();
  }
}

// ── RESET FORM ────────────────────────────────────────────────
function resetForm() {
  $("tree-form").reset();
  $("custom-species-group").classList.add("hidden");

  for (let i = 0; i < 3; i++) clearPhoto(i);
  $$('input[type="radio"][value="Não"]').forEach(r => r.checked = true);
  
  const certDefault = document.querySelector('input[name="sp-certainty"][value="Não sei identificar"]');
  if (certDefault) certDefault.checked = true;

  if (state.marker) state.marker.setLatLng([DEFAULT_LAT, DEFAULT_LNG]);
  if (state.map) state.map.setView([DEFAULT_LAT, DEFAULT_LNG], 13);
  
  $("gps-status-text").textContent = "Aguardando localização...";

  updateSubmitState();
  updateProgress();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ── TOAST ─────────────────────────────────────────────────────
function showToast(msg, type = "") {
  const container = $("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast${type ? " " + type : ""}`;

  const icon = type === "error" ? "<i class='fa-solid fa-triangle-exclamation'></i>" : "<i class='fa-solid fa-check-circle'></i>";
  toast.innerHTML = `${icon} <span>${msg}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(20px)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 320);
  }, 3000);
}
