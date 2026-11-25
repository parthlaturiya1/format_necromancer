// Budget (b-1, b-3): gzipped JS each exported page loads, from out/. Fails if any page is over the limit.
// Method: every <script src> and <link rel=preload as=script> in the page HTML, each file gzipped once (node zlib, level 9), summed.
// noModule polyfill scripts are counted too (the stricter reading). Lazy chunks not named in the HTML are not counted.
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';

export const LIMIT = 250_000; // D-10: initial JS under 250 KB gzipped. Never loosen.
export const ROUTES = [
  ['/ (landing)', 'index.html'],
  ['/404', '404.html'],
  ['/_not-found', '_not-found.html'],
];

export function measure(out = 'out') {
  const rows = [];
  for (const [route, file] of ROUTES) {
    const p = join(out, file);
    if (!existsSync(p)) { rows.push({ route, file, missing: true, files: 0, bytes: 0 }); continue; }
    const html = readFileSync(p, 'utf8');
    const urls = new Set();
    for (const m of html.matchAll(/<script[^>]*\ssrc="([^"]+\.js)[^"]*"/g)) urls.add(m[1]);
    for (const m of html.matchAll(/<link[^>]*rel="(?:module)?preload"[^>]*as="script"[^>]*href="([^"]+\.js)"/g)) urls.add(m[1]);
    let bytes = 0;
    for (const u of urls) bytes += gzipSync(readFileSync(join(out, u.replace(/^\//, ''))), { level: 9 }).length;
    rows.push({ route, file, files: urls.size, bytes });
  }
  return rows;
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}` || process.argv[1]?.endsWith('js-size.mjs')) {
  const rows = measure();
  let bad = 0;
  for (const r of rows) {
    const over = r.missing || r.bytes >= LIMIT;
    if (over) bad++;
    console.log(`js ${r.route}: ${r.missing ? 'MISSING' : `${r.files} files, ${r.bytes} bytes gzipped`} (limit ${LIMIT}) ${over ? 'FAIL' : 'ok'}`);
  }
  mkdirSync('test-results', { recursive: true });
  writeFileSync('test-results/budgets-js.json', JSON.stringify({ limit: LIMIT, rows }, null, 2));
  process.exit(bad ? 1 : 0);
}
