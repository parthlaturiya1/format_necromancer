// Static server for out/ that sends the CSP from vercel.json. For the H5 test: node scripts/budgets/serve-with-csp.mjs [port] [--no-worker-blob]
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';

const root = resolve('out');
const port = Number(process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 4174);
const headers = JSON.parse(readFileSync('vercel.json', 'utf8')).headers[0].headers;
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.txt': 'text/plain', '.woff2': 'font/woff2', '.png': 'image/png' };
const h = Object.fromEntries(headers.map(({ key, value }) => [key, value]));
if (process.argv.includes('--no-worker-blob')) h['Content-Security-Policy'] = h['Content-Security-Policy'].replace("worker-src 'self' blob:", "worker-src 'self'");
if (process.argv.includes('--control-no-worker')) h['Content-Security-Policy'] = h['Content-Security-Policy'].replace("worker-src 'self' blob:", "worker-src 'none'");
console.log(`CSP: ${h['Content-Security-Policy']}`);

createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname);
  let file = normalize(join(root, path));
  if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
  if (path.endsWith('/')) file = join(file, 'index.html');
  try {
    const body = await readFile(file);
    res.writeHead(200, { ...h, 'content-type': types[extname(file)] ?? 'application/octet-stream' }).end(body);
  } catch {
    res.writeHead(404, { ...h, 'content-type': 'text/plain' }).end('not found');
  }
}).listen(port, '127.0.0.1');

