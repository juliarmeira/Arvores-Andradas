const cache = new Map();
export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ ok: false, error: "Método não permitido" });
  const address = String(req.query.address || "").trim();
  if (!address || address.length > 300) return res.status(400).json({ ok: false, error: "Endereço inválido" });
  const key = address.toLowerCase();
  if (cache.has(key)) return res.status(200).json({ ok: true, location: cache.get(key), cached: true });
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=br&q=${encodeURIComponent(address)}`;
    const upstream = await fetch(url, { headers: { "User-Agent": "GestaoAmbientalAndradas/1.0 (Prefeitura Municipal de Andradas)" } });
    let places = await upstream.json();
    if ((!upstream.ok || !Array.isArray(places) || !places.length) && address.includes(",")) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const street = address.split(",")[0].replace(/^Av\.?\s+/i, "Avenida ").trim();
      const fallbackUrl = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=br&q=${encodeURIComponent(`${street}, Andradas, MG, Brasil`)}`;
      const fallback = await fetch(fallbackUrl, { headers: { "User-Agent": "GestaoAmbientalAndradas/1.0 (Prefeitura Municipal de Andradas)" } });
      places = await fallback.json();
    }
    if (!Array.isArray(places) || !places.length) return res.status(404).json({ ok: false, error: "Endereço não localizado no mapa" });
    const location = { lat: Number(places[0].lat), lng: Number(places[0].lon), displayName: String(places[0].display_name || address) };
    cache.set(key, location);
    res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=604800");
    return res.status(200).json({ ok: true, location });
  } catch (error) { return res.status(502).json({ ok: false, error: `Falha ao localizar endereço: ${error.message}` }); }
}