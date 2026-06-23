import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Servidor estático mínimo para el E2E: sirve el export web de Expo (`dist/`) y
 * **proxea** al backend real (`:3000`) cualquier petición que no sea un fichero
 * estático (las llamadas a la API). Así la app y la API comparten origen
 * (`:4173`) y no hay CORS. La SPA no usa rutas por URL, de modo que todo lo que
 * no resuelve a un fichero es una llamada de API.
 */
const DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const PORT = 4173;
const BACKEND_PORT = 3100;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function proxyToBackend(req, res) {
  const upstream = http.request(
    {
      hostname: '127.0.0.1',
      port: BACKEND_PORT,
      path: req.url,
      method: req.method,
      headers: req.headers,
    },
    (pres) => {
      res.writeHead(pres.statusCode ?? 502, pres.headers);
      pres.pipe(res);
    },
  );
  upstream.on('error', () => {
    res.writeHead(502, { 'content-type': 'text/plain' });
    res.end('backend no disponible');
  });
  req.pipe(upstream);
}

const server = http.createServer((req, res) => {
  void (async () => {
    const urlPath = decodeURIComponent((req.url ?? '/').split('?')[0]);
    let filePath = path.join(DIST, urlPath === '/' ? 'index.html' : urlPath);
    if (!filePath.startsWith(DIST)) {
      res.writeHead(403);
      res.end();
      return;
    }
    try {
      const info = await stat(filePath);
      if (info.isDirectory()) filePath = path.join(filePath, 'index.html');
      const data = await readFile(filePath);
      res.writeHead(200, {
        'content-type': TYPES[path.extname(filePath)] ?? 'application/octet-stream',
      });
      res.end(data);
    } catch {
      // No es un fichero del bundle → es una llamada a la API: proxy al backend.
      proxyToBackend(req, res);
    }
  })();
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[e2e] web servida en http://127.0.0.1:${PORT} (proxy API → :${BACKEND_PORT})`);
});
