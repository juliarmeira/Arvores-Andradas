function setupPendingInspectionsMap() {
  const modal = $('vistoria-map-modal');
  const statusEl = $('vistoria-map-status');
  const statsEl = $('vistoria-map-stats');
  if (!modal || !statusEl || !statsEl || typeof L === 'undefined') {
    btn-mapa-vistorias?.addEventListener('click', () => alert('O mapa não pôde ser carregado. Verifique a conexão e atualize a página.'));
    return;
  }
  let map = null;
  let markers = null;
  const showStatus = (message, type = 'loading') => { statusEl.hidden = !message; statusEl.textContent = message; statusEl.className = `mapa-status ${type}`; };
  const cacheKey = address => `vistoria_geo_${normalizeText(address)}`;
  async function geocode(address) {
    try { const cached = JSON.parse(localStorage.getItem(cacheKey(address)) || 'null'); if (cached?.lat && cached?.lng) return cached; } catch {}
    const response = await fetch(`/api/geocode?address=${encodeURIComponent(address)}`);
    const result = await response.json();
    if (!response.ok || !result.ok) throw new Error(result.error || 'Endereço não localizado');
    localStorage.setItem(cacheKey(address), JSON.stringify(result.location));
    return result.location;
  }
  async function render() {
    const pending = processos.filter(isPendingInspection);
    statsEl.textContent = `${pending.length} pendente${pending.length === 1 ? '' : 's'}`;
    markers.clearLayers();
    if (!pending.length) { showStatus('Não há processos aguardando vistoria.'); map.setView([-22.0670, -46.5686], 14); return; }
    showStatus('Localizando os endereços das vistorias pendentes...');
    const points = [], missing = [];
    for (const process of pending) {
      let lat = Number(String(process.coordenadas?.lat || '').replace(',', '.'));
      let lng = Number(String(process.coordenadas?.lng || '').replace(',', '.'));
      try {
        if (!Number.isFinite(lat) || !Number.isFinite(lng) || !lat || !lng) { const location = await geocode(`${process.endereco}, Andradas, Minas Gerais, Brasil`); lat = Number(location.lat); lng = Number(location.lng); }
        const route = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
        L.marker([lat, lng]).bindPopup(`<div class="tree-popup"><div class="popup-head"><strong>Proc. nº ${esc(process.protocolo)}</strong><span class="popup-status badge-aguardando">Aguardando vistoria</span></div><div class="popup-body"><div class="popup-row"><strong>Requerente</strong>${esc(process.requerente || 'Não informado')}</div><div class="popup-row"><strong>Endereço</strong>${esc(process.endereco)}</div><a class="popup-route-link" href="${route}" target="_blank" rel="noopener">Abrir rota no Google Maps</a></div></div>`).addTo(markers);
        points.push([lat, lng]);
      } catch { missing.push(process.endereco || process.protocolo); }
    }
    if (points.length === 1) map.setView(points[0], 17); else if (points.length > 1) map.fitBounds(points, { padding: [40, 40] }); else map.setView([-22.0670, -46.5686], 14);
    showStatus(missing.length ? `Não foi possível localizar: ${missing.join('; ')}.` : '', missing.length ? 'error' : 'loading');
  }
  async function open() {
    modal.hidden = false; document.body.style.overflow = 'hidden';
    if (!map) { map = L.map('vistoria-map', { center: [-22.0670, -46.5686], zoom: 14 }); L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(map); markers = L.layerGroup().addTo(map); }
    setTimeout(() => map.invalidateSize(), 100); await render();
  }
  const close = () => { modal.hidden = true; document.body.style.overflow = ''; };
  $('btn-mapa-vistorias')?.addEventListener('click', open);
  $('vistoria-map-close')?.addEventListener('click', close);
  modal?.addEventListener('click', event => { if (event.target === modal) close(); });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setupPendingInspectionsMap);
else setupPendingInspectionsMap();