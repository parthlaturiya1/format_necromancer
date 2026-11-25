// Validates corpus/manifest.json by hand (no deps): shape, hashes, counts, source+license.
// This is the only script allowed to name the held-out folder: it hashes the file, never decodes it.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';

const errors = [];
const err = (m) => errors.push(m);
const HEX = /^[0-9a-f]{64}$/;
const isStr = (v) => typeof v === 'string' && v.length > 0;
const isPosInt = (v) => Number.isInteger(v) && v >= 1;
const sha = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');
const keysOk = (o, allowed, where) => {
  for (const k of Object.keys(o)) if (!allowed.includes(k)) err(`${where}: unexpected key ${k}`);
  for (const k of allowed) if (!(k in o)) err(`${where}: missing key ${k}`);
};
const checkFile = (path, hash, where, re) => {
  if (!isStr(path) || !re.test(path)) return err(`${where}: bad path ${path}`);
  if (!HEX.test(hash ?? '')) return err(`${where}: bad sha256`);
  if (!existsSync(path)) return err(`${where}: file missing ${path}`);
  if (sha(path) !== hash) err(`${where}: hash mismatch ${path}`);
};

export function validate(manifestPath = 'corpus/manifest.json') {
  errors.length = 0;
  const m = JSON.parse(readFileSync(manifestPath, 'utf8'));
  keysOk(m, ['version', 'samples', 'heldOut'], 'manifest');
  if (m.version !== 1) err('manifest: version must be 1');
  if (!Array.isArray(m.samples) || !Array.isArray(m.heldOut)) {
    err('manifest: samples and heldOut must be arrays');
    return errors;
  }
  if (m.samples.length < 10) err(`manifest: need at least 10 samples, found ${m.samples.length}`);
  if (m.heldOut.length < 1) err('manifest: need at least 1 held-out sample');
  const ids = new Set();
  for (const s of m.samples) {
    const w = `sample ${s.id}`;
    keysOk(s, ['id', 'path', 'sha256', 'bytes', 'width', 'height', 'source', 'license', 'reference', 'heldOut'], w);
    if (!isStr(s.id) || ids.has(s.id)) err(`${w}: id empty or duplicate`);
    ids.add(s.id);
    if (!isStr(s.source)) err(`${w}: source missing`);
    if (!isStr(s.license)) err(`${w}: license missing`);
    if (s.heldOut !== false) err(`${w}: heldOut must be false`);
    if (!isPosInt(s.width) || !isPosInt(s.height)) err(`${w}: bad size`);
    checkFile(s.path, s.sha256, w, /^corpus\/samples\/[^/]+\.pcx$/);
    if (existsSync(s.path) && statSync(s.path).size !== s.bytes) err(`${w}: byte size mismatch`);
    const r = s.reference ?? {};
    keysOk(r, ['path', 'sha256', 'tool'], `${w} reference`);
    if (!isStr(r.tool)) err(`${w}: reference tool missing`);
    checkFile(r.path, r.sha256, `${w} reference`, /^corpus\/reference\/[^/]+\.png$/);
  }
  for (const h of m.heldOut) {
    keysOk(h, ['path', 'sha256', 'heldOut'], 'held-out entry'); // no tuning metadata allowed
    if (h.heldOut !== true) err('held-out entry: heldOut must be true');
    checkFile(h.path, h.sha256, 'held-out entry', /^corpus\/heldout\/[^/]+\.pcx$/);
  }
  return errors;
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  const errs = validate();
  if (errs.length) {
    for (const e of errs) console.log(`FAIL ${e}`);
    process.exit(1);
  }
  console.log('corpus: manifest valid, all hashes match');
}
