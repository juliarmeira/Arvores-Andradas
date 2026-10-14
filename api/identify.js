export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });
  const key = String(req.query?.key || process.env.PLANTNET_API_KEY || '').trim();
  if (!key) return res.status(400).json({ error: 'Chave do Pl@ntNet não configurada' });
  try {
    const chunks = []; let size = 0;
    for await (const chunk of req) {
      size += chunk.length;
      if (size > 25_000_000) return res.status(413).json({ error: 'As imagens ultrapassaram 25 MB' });
      chunks.push(chunk);
    }
    const body = Buffer.concat(chunks);
    const upstream = await fetch(`https://my-api.plantnet.org/v2/identify/all?api-key=${encodeURIComponent(key)}&lang=pt&nb-results=5`, {
      method: 'POST',
      headers: { 'content-type': req.headers['content-type'] || 'multipart/form-data', 'content-length': String(body.length) },
      body
    });
    const responseBody = await upstream.arrayBuffer();
    res.status(upstream.status);
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
    return res.send(Buffer.from(responseBody));
  } catch (error) {
    return res.status(502).json({ error: `Falha ao consultar o Pl@ntNet: ${error.message}` });
  }
}
