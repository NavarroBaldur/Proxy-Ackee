import { createServer } from 'http';
import fetch from 'node-fetch';
import UAParser from 'ua-parser-js';

const PORT = process.env.PORT || 3000;

const server = createServer(async (req, res) => {
  const { method, headers, url } = req;

  // Manejo de CORS dinámico
  const origin = headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  if (method !== 'POST' || url !== '/track') {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    return res.end('Not Found');
  }

  // Procesar el body JSON manualmente
  let body = '';
  req.on('data', chunk => (body += chunk));
  req.on('end', async () => {
    try {
      const data = JSON.parse(body);
      const userAgent = headers['user-agent'] || '';
      const parser = new UAParser(userAgent);
      const ua = parser.getResult();

      const geo = await fetch('https://ipapi.co/json')
        .then(r => r.ok ? r.json() : {})
        .catch(() => ({}));

      // Reenviar a Ackee
      await fetch('https://ackee-69yp.onrender.com/api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': userAgent
        },
        body
      });

      // Duplicar en Supabase
      await fetch('https://ehtwuxuwinsoyrsusuyu.supabase.co/rest/v1/visitas', {
        method: 'POST',
        headers: {
          apikey: 'TU_API_KEY',
          Authorization: 'Bearer TU_API_KEY',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          domain_id: data.domainId,
          referrer: headers.referer || '',
          user_agent: userAgent,
          screen_width: data.screenWidth,
          screen_height: data.screenHeight,
          language: data.language || '',
          pathname: data.pathname || '',
          duration: data.duration || 0,
          device_type: ua.device.type || 'desktop',
          browser: ua.browser.name,
          os: ua.os.name,
          country: geo.country_name,
          region: geo.region
        })
      });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    } catch (err) {
      console.error('Error en proxy:', err.message);
      res.writeHead(500);
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
  });
});

server.listen(PORT, () => {
  console.log(`🛰 Proxy ultra ligero escuchando en http://localhost:${PORT}`);
});