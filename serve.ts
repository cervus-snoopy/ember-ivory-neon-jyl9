/* Vice Cover Studio — local static server for trying the app.
 *
 * Serves app/ at http://localhost:8080 with no network requests of its own:
 *
 *   node serve.ts
 *
 * Standard library only, no install. The port can be changed with PORT.
 * Only files under app/ are served; anything else is a 404.
 */

import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Content types for the files the app serves. */
const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
};

/** The port to listen on: PORT, else 8080. */
const PORT = Number(process.env.PORT || 8080);

/** The directory served: app/ beside this file. */
const APP_DIR = join(dirname(fileURLToPath(import.meta.url)), 'app');

/** Serve one request from app/, mapping / to index.html. */
function serveFile(reqUrl: string, res: import('node:http').ServerResponse): void {
  const path = decodeURIComponent(reqUrl.split('?')[0] || '/');
  const target = resolve(APP_DIR, `.${sep}${normalize(path).replace(/^(\.\.[/\\])+/, '')}`);
  const file = target.endsWith(sep) || path === '/' ? join(target, 'index.html') : target;
  if (!file.startsWith(APP_DIR)) {
    res.writeHead(403, { 'content-type': 'text/plain' });
    res.end('403: outside app/');
    return;
  }
  if (!existsSync(file) || !statSync(file).isFile()) {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('404: not found');
    return;
  }
  res.writeHead(200, { 'content-type': MIME_TYPES[extname(file)] || 'application/octet-stream' });
  createReadStream(file).pipe(res);
}

const server = createServer((req, res) => {
  serveFile(req.url || '/', res);
});

server.listen(PORT, () => {
  console.log(`vice-cover-studio: serving app/ at http://localhost:${PORT}`);
});
