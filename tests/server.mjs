// Minimal static server for tests and local preview. Serves the repo under /CELL/ exactly like GitHub Pages does.
// Test-only hook (never deployed): a `swv` cookie rewrites the VERSION constant served in sw.js,
// so a test can simulate a release and check that old caches are deleted (per browser context, safe in parallel).
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PORT = +(process.env.PORT || 4173);
const BASE = '/CELL/';
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.css': 'text/css; charset=utf-8', '.webmanifest': 'application/manifest+json' };

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/' || url.pathname === '/CELL') { res.writeHead(302, { Location: BASE }); res.end(); return; }
  if (!url.pathname.startsWith(BASE)) { res.writeHead(404); res.end('not found'); return; }
  let rel = decodeURIComponent(url.pathname.slice(BASE.length)) || 'index.html';
  if (rel.endsWith('/')) rel += 'index.html';
  const file = normalize(join(ROOT, rel));
  if (!file.startsWith(ROOT) || /(^|\/)(node_modules|tests|\.git)(\/|$)/.test(rel)) { res.writeHead(404); res.end('not found'); return; }
  try {
    if (!(await stat(file)).isFile()) throw 0;
    let body = await readFile(file);
    const swVersion = /(?:^|;\s*)swv=([\w.-]+)/.exec(req.headers.cookie || '')?.[1];
    if (rel === 'sw.js' && swVersion) body = Buffer.from(body.toString().replace(/const VERSION = '[^']*'/, `const VERSION = '${swVersion}'`));
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(body);
  } catch { res.writeHead(404); res.end('not found'); }
}).listen(PORT, () => console.log(`CELL: http://localhost:${PORT}${BASE}`));
