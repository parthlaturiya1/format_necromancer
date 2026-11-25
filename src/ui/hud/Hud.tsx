'use client';
import { useMemo, useRef, useState } from 'react';
import type { PipelineResult } from '../../engine/pipeline';
import { browserDeflate, encodePng } from '../../engine/png';
import { buildEvidenceReport } from '../../engine/report';
import type { VerificationReport } from '../../engine/verify';
import { announce, type Region } from '../regions';
import { coverage, mean, mismatchesByRow, rgbText, rowConfidences } from './stats';

const DOTS = 14 * 5;
// Empty state: a few rings pulse in turn so the grid looks alive. Opacity only.
const PULSING = new Set([6, 21, 38, 52]);
const PITCH = 16; // px per dot cell: a 12 px dot with room for its glow and a target to hit
const MAX_COLS = 16;

export type GridLight = { mode: 'off' } | { mode: 'play'; ms: number } | { mode: 'part'; share: number } | { mode: 'on' };
/** How the picture was checked. none: the user's own file, nothing to check against. */
export type Check = { k: 'none' } | { k: 'pending' } | { k: 'missing' } | { k: 'done'; report: VerificationReport };

const f2 = (n: number) => n.toFixed(2);
const num = (n: number) => n.toLocaleString('en-US');

/** Columns for n dots: wide enough to stay compact, never above the cap, and the last row at least half full when possible. */
export function gridCols(n: number): number {
  if (n <= 0) return 1;
  let best = Math.min(MAX_COLS, n);
  for (let c = Math.min(MAX_COLS, n); c >= Math.max(4, Math.min(MAX_COLS, n) - 4); c--) {
    if (n % c === 0 || n % c >= c / 2) { best = c; break; }
  }
  return best;
}

/** Hover and keyboard focus show one line, drawn where the pointer or focus is. `n` items, `text(i)` is the line. */
function useScrub(n: number) {
  const [at, setAt] = useState<number | null>(null);
  const [live, setLive] = useState('');
  return { at: at !== null && at < n ? at : null, live, set: (i: number | null, say?: string) => { setAt(i); if (say !== undefined) setLive(say); } };
}

const clamp = (i: number, n: number) => Math.max(0, Math.min(n - 1, i));

function Dots({ regions, status, light, onPick, selectedId }: { regions: Region[]; status: string[]; light: GridLight; onPick: (row: number, key: boolean) => void; selectedId: string | null }) {
  const byRow = useMemo(() => new Map(regions.filter((r) => r.kind === 'row').map((r) => [r.rows[0]!, r])), [regions]);
  const n = status.length;
  const cols = gridCols(n);
  const [rove, setRove] = useState(0);
  const [tip, setTip] = useState<number | null>(null);
  const [list, setList] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const text = (i: number) => { const r = byRow.get(i); return r ? announce(r) : `Row ${i}, no evidence`; };
  const move = (e: React.KeyboardEvent, i: number) => {
    const to: Record<string, number> = { ArrowRight: i + 1, ArrowLeft: i - 1, ArrowDown: i + cols, ArrowUp: i - cols, Home: 0, End: n - 1 };
    if (e.key in to) {
      e.preventDefault();
      const j = clamp(to[e.key]!, n);
      setRove(j);
      box.current?.querySelector<HTMLElement>(`[data-row="${j}"]`)?.focus();
    }
  };
  const count = (s: string) => status.filter((x) => x === s).length;
  return (
    <>
      <div
        ref={box}
        className="dots"
        role="group"
        aria-label={`Confidence grid, ${n} rows. ${count('ok')} confident, ${count('uncertain')} uncertain, ${count('unexplained')} unexplained. Arrow keys move, Enter jumps to the bytes.`}
        data-light={light.mode}
        data-testid="grid"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, ${PITCH}px))`, maxWidth: cols * PITCH }}
        hidden={list}
        onPointerLeave={() => setTip(null)}
      >
        {status.map((s, i) => (
          <button
            key={i}
            type="button"
            className="dot"
            data-row={i}
            data-sel={byRow.get(i)?.id === selectedId ? '' : undefined}
            tabIndex={i === rove ? 0 : -1}
            aria-label={text(i)}
            onFocus={() => { setRove(i); setTip(i); }}
            onBlur={() => setTip(null)}
            onPointerEnter={() => setTip(i)}
            onKeyDown={(e) => move(e, i)}
            onClick={(e) => onPick(i, e.detail === 0)}
          >
            <i data-s={s} className={light.mode === 'off' || (light.mode === 'part' && i >= light.share * n) ? 'dark' : 'lit'} style={light.mode === 'play' ? ({ '--d': `${(i / n) * light.ms}ms` } as React.CSSProperties) : undefined} />
          </button>
        ))}
      </div>
      {list ? (
        <ol className="grid-list" aria-label="Rows as a list">
          {status.map((s, i) => (
            <li key={i}><button type="button" onClick={(e) => onPick(i, e.detail === 0)}><span>{byRow.get(i)?.label ?? `Row ${i}`}</span><span className="mono">{s} {f2(byRow.get(i)?.confidence ?? 0)}</span></button></li>
          ))}
        </ol>
      ) : null}
      <div className="grid-foot">
        <p className="hint grid-tip" data-testid="grid-tip">{tip !== null && !list ? text(tip) : 'Hover or focus a dot to inspect it.'}</p>
        <button type="button" className="link-btn" aria-pressed={list} onClick={() => setList(!list)}>List view</button>
      </div>
    </>
  );
}

/** A chart box that reads one value per position. Pointer and arrow keys pick the position; the line is both shown and announced. */
function Scrub({ n, label, text, children, ticks }: { n: number; label: string; text: (i: number) => string; children: React.ReactNode; ticks?: React.ReactNode }) {
  const s = useScrub(n);
  const at = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = (e.currentTarget.querySelector('.plot') ?? e.currentTarget).getBoundingClientRect();
    return clamp(Math.round(((e.clientX - r.left) / Math.max(1, r.width)) * (n - 1)), n);
  };
  return (
    <div
      className="scrub"
      role="group"
      tabIndex={0}
      aria-label={`${label}. Left and right arrows read each one.`}
      onPointerMove={(e) => { const i = at(e); s.set(i); }}
      onPointerLeave={() => s.set(null)}
      onBlur={() => s.set(null)}
      onKeyDown={(e) => {
        const to: Record<string, number> = { ArrowRight: (s.at ?? -1) + 1, ArrowLeft: (s.at ?? n) - 1, Home: 0, End: n - 1 };
        if (e.key in to) { e.preventDefault(); const i = clamp(to[e.key]!, n); s.set(i, text(i)); }
      }}
    >
      {ticks}
      <div className="plot">
      {children}
      {s.at !== null ? (
        <>
          <i className="scrub-rule" style={{ left: `${n > 1 ? (s.at / (n - 1)) * 100 : 50}%` }} />
          <p className="tip" style={{ left: `${n > 1 ? (s.at / (n - 1)) * 100 : 50}%` }} data-testid="tip">{text(s.at)}</p>
        </>
      ) : null}
      </div>
      <span className="sr-only" role="status">{s.live}</span>
    </div>
  );
}

const VW = 100;
const VH = 40;
const yOf = (v: number, top = 3, bottom = 37) => bottom - Math.max(0, Math.min(1, v)) * (bottom - top);

function RowChart({ conf }: { conf: number[] }) {
  const n = conf.length;
  const m = mean(conf);
  const pts = conf.map((c, i) => `${(n > 1 ? (i / (n - 1)) * VW : VW / 2).toFixed(2)},${yOf(c).toFixed(2)}`);
  const line = `M${pts.join(' L')}`;
  return (
    <Scrub n={n} label={`Confidence by row chart, ${n} rows, mean ${f2(m)}`} text={(i) => `Row ${i}: confidence ${f2(conf[i]!)}`}
      ticks={<><span className="tick" style={{ top: `${(yOf(1) / VH) * 100}%` }}>1.0</span><span className="tick" style={{ top: `${(yOf(0.5) / VH) * 100}%` }}>0.5</span><span className="tick" style={{ top: `${(yOf(0) / VH) * 100}%` }}>0</span><span className="mean" style={{ top: `${(yOf(m) / VH) * 100}%` }} data-testid="mean">mean {f2(m)}</span></>}>
      <svg className="chart chart-draw" viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id="fill-rows" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--accent)" stopOpacity="0.45" /><stop offset="1" stopColor="var(--accent)" stopOpacity="0" /></linearGradient>
        </defs>
        {[1, 0.5, 0].map((v) => <line key={v} className="gl" x1="0" x2={VW} y1={yOf(v)} y2={yOf(v)} vectorEffect="non-scaling-stroke" />)}
        <path d={`${line} L${VW},${yOf(0)} L0,${yOf(0)} Z`} fill="url(#fill-rows)" />
        <line className="mean-line" x1="0" x2={VW} y1={yOf(m)} y2={yOf(m)} vectorEffect="non-scaling-stroke" />
        <path className="glow-line" d={line} vectorEffect="non-scaling-stroke" />
        <path className="main-line" d={line} vectorEffect="non-scaling-stroke" />
      </svg>
    </Scrub>
  );
}

function CoverageBar({ cov, total }: { cov: { explained: number; uncertain: number; unexplained: number }; total: number }) {
  const parts = [
    { k: 'explained', label: 'Explained', n: cov.explained },
    { k: 'uncertain', label: 'Uncertain', n: cov.uncertain },
    { k: 'unexplained', label: 'Unexplained', n: cov.unexplained },
  ] as const;
  const [tip, setTip] = useState<string | null>(null);
  const say = (p: (typeof parts)[number]) => `${p.label}: ${num(p.n)} of ${num(total)} bytes, ${total ? ((p.n / total) * 100).toFixed(1) : '0'}%`;
  return (
    <div className="cov">
      <p className="chart-label" aria-hidden="true">Byte coverage <span className="mono">{tip ?? `${num(total)} bytes`}</span></p>
      <div className="cov-bar chart-draw" onPointerLeave={() => setTip(null)}>
        {parts.filter((p) => p.n > 0).map((p) => (
          <button key={p.k} type="button" className="seg" data-k={p.k} style={{ flexGrow: p.n }} aria-label={say(p)} onFocus={() => setTip(say(p))} onBlur={() => setTip(null)} onPointerEnter={() => setTip(say(p))} />
        ))}
      </div>
      <p className="cov-labels mono" data-testid="coverage">
        {parts.map((p) => <span key={p.k} data-k={p.k}><i />{p.label} {num(p.n)}</span>)}
      </p>
    </div>
  );
}

function Spark({ byRow }: { byRow: number[] }) {
  const n = byRow.length;
  const max = Math.max(1, ...byRow);
  const pts = byRow.map((c, i) => `${(n > 1 ? (i / (n - 1)) * VW : VW / 2).toFixed(2)},${(34 - (c / max) * 28).toFixed(2)}`);
  return (
    <Scrub n={n} label={`Mismatches by row chart, ${n} rows`} text={(i) => `Row ${i}: ${byRow[i]} ${byRow[i] === 1 ? 'mismatch' : 'mismatches'}`}>
      <svg className="chart spark chart-draw" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <line className="gl" x1="0" x2={VW} y1="34" y2="34" vectorEffect="non-scaling-stroke" />
        <path className={`glow-line${byRow.some((c) => c > 0) ? ' bad' : ''}`} d={`M${pts.join(' L')}`} vectorEffect="non-scaling-stroke" />
        <path className={`main-line${byRow.some((c) => c > 0) ? ' bad' : ''}`} d={`M${pts.join(' L')}`} vectorEffect="non-scaling-stroke" />
      </svg>
    </Scrub>
  );
}

function save(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function Verification({ result, name, check, blind, total }: { result: PipelineResult; name: string; check: Check; blind: string | null; total: number }) {
  const rec = result.recovered;
  const base = name.replace(/\.[^.]*$/, '') || 'file';
  const report: VerificationReport = check.k === 'done' ? check.report : { mode: 'no-reference', note: 'no reference available' };
  const [err, setErr] = useState('');
  const png = async () => {
    if (rec.status !== 'ok') return;
    try {
      setErr('');
      save(new Blob([(await encodePng(rec.width, rec.height, rec.rgb, browserDeflate)) as BlobPart], { type: 'image/png' }), `${base}-recovered.png`);
    } catch { setErr('The image could not be written.'); }
  };
  const json = () => {
    const out = buildEvidenceReport(result.analysis, rec, report);
    save(new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' }), `${base}-evidence.json`);
  };

  let v: 'exact' | 'bad' | 'none' | 'pending' = 'none';
  let badge = 'No reference available';
  if (check.k === 'pending') { v = 'pending'; badge = 'Checking'; }
  else if (check.k === 'missing') { badge = 'Reference not loaded'; }
  else if (check.k === 'done' && check.report.mode === 'reference') { v = check.report.exact ? 'exact' : 'bad'; badge = check.report.exact ? 'Exact match' : 'Not exact'; }
  const rep = check.k === 'done' && check.report.mode === 'reference' ? check.report : null;
  const compared = rep !== null && (rep.exact || rep.mismatchCount > 0);
  const matched = rep && compared ? total - rep.mismatchCount : 0;

  return (
    <div className="v-body" data-v={v}>
      <div className="v-top">
        <span className="badge" data-v={v} data-testid="badge"><i />{badge}</span>
        {compared && rep ? <p className="v-num"><span className="big-num" data-testid="mismatch-count">{num(rep.mismatchCount)}</span><small>{rep.mismatchCount === 1 ? 'mismatch' : 'mismatches'}</small></p> : null}
      </div>
      {blind ? <p className="blind" data-testid="blind-label">{blind}</p> : null}
      {compared && rep ? (
        <>
          <div className="v-bar" role="img" aria-label={`${num(matched)} of ${num(total)} pixels match the reference`}><i style={{ '--s': total ? matched / total : 0 } as React.CSSProperties} /></div>
          {rep.exact ? null : <p className="hint">{`${num(matched)} of ${num(total)} pixels match the reference.`}</p>}
        </>
      ) : rep ? (
        <p className="hint" data-testid="v-reason">{rep.reason ?? 'The picture could not be compared.'}</p>
      ) : (
        <p className="hint" data-testid="v-note">
          {check.k === 'pending' ? 'Comparing with the reference picture.' : check.k === 'missing' ? 'The reference picture could not be loaded, so nothing was checked.' : rec.status === 'ok' ? 'Your own file has no reference picture. Nothing here says it is correct.' : 'Nothing was recovered, so there is nothing to check.'}
        </p>
      )}
      {rep && !rep.exact && rep.mismatches.length > 0 ? (
        <ul className="mm" aria-label="First mismatches">
          {rep.mismatches.slice(0, 4).map((m, i) => <li key={i} className="mono">row {m.row}, col {m.col}: {rgbText(m.expected)} expected, {rgbText(m.actual)} found</li>)}
        </ul>
      ) : null}
      {rep && rec.status === 'ok' ? (
        <div className="spark-box">
          <p className="chart-label">Mismatches by row <span className="mono">{rep.mismatchCount === 0 ? 'flat at 0' : num(rep.mismatchCount)}</span></p>
          <Spark byRow={mismatchesByRow(rep, rec.height)} />
        </div>
      ) : null}
      {rec.status === 'ok' ? (
        <div className="downloads">
          <button type="button" className="btn btn-sm" onClick={() => void png()}>Download image</button>
          <button type="button" className="btn btn-sm ghost-btn" onClick={json}>Download evidence report</button>
          {err ? <p className="hint">{err}</p> : null}
        </div>
      ) : null}
    </div>
  );
}

export type HudProps = {
  result: PipelineResult | null;
  name: string;
  regions: Region[];
  light: GridLight;
  /** True from beat 6: charts and the verification result are shown and draw in. */
  proof: boolean;
  check: Check;
  blind: string | null;
  fileBytes: number;
  selectedId: string | null;
  onPickRow: (row: number, key: boolean) => void;
};

/** L4 HUD: Confidence grid, Confidence by row (with byte coverage), Verification. */
export function Hud({ result, name, regions, light, proof, check, blind, fileBytes, selectedId, onPickRow }: HudProps) {
  const rec = result && result.recovered.status === 'ok' ? result.recovered : null;
  const status = rec ? rec.rows.reduce<string[]>((a, r) => { a[r.index] = r.status; return a; }, []) : null;
  const conf = useMemo(() => (rec ? rowConfidences(regions, rec.height) : []), [rec, regions]);
  const cov = useMemo(() => coverage(regions, fileBytes), [regions, fileBytes]);
  const empty = !rec;
  return (
    <div className="col col-hud" data-layer="L4" data-empty={empty ? '' : undefined}>
      <section className="panel p-grid" aria-labelledby="h-grid">
        <header>
          <h2 id="h-grid">Confidence grid</h2>
          <p className="meta">{rec ? `${rec.height} rows` : 'Waiting for a file'}</p>
        </header>
        {rec && status && status.length > 0 ? (
          <Dots regions={regions} status={status} light={light} onPick={onPickRow} selectedId={selectedId} />
        ) : (
          <>
            <div className="dots" aria-hidden="true">
              {Array.from({ length: DOTS }, (_, i) => <i key={i} className={PULSING.has(i) ? 'pulse' : undefined} style={PULSING.has(i) ? { animationDelay: `${[...PULSING].indexOf(i) * 120}ms` } : undefined} />)}
            </div>
            <p className="hint">Each dot is one row. Hover or focus a dot to inspect it.</p>
          </>
        )}
      </section>
      <section className="panel p-rows" aria-labelledby="h-rows">
        <header>
          <h2 id="h-rows">Confidence by row</h2>
          <p className="meta mono">{rec && proof ? `${conf.length} rows` : 'no data'}</p>
        </header>
        {rec && proof ? (
          <>
            <RowChart conf={conf} />
            <CoverageBar cov={cov} total={fileBytes} />
          </>
        ) : (
          <>
            <div className="scrub skeleton" aria-hidden="true"><svg className="chart" viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="none"><line className="gl" x1="0" x2={VW} y1={yOf(1)} y2={yOf(1)} vectorEffect="non-scaling-stroke" /><line className="gl" x1="0" x2={VW} y1={yOf(0.5)} y2={yOf(0.5)} vectorEffect="non-scaling-stroke" /><line className="gl" x1="0" x2={VW} y1={yOf(0)} y2={yOf(0)} vectorEffect="non-scaling-stroke" /></svg></div>
            <p className="hint">{rec ? 'Appears at the last step.' : 'Appears after Resurrection.'}</p>
          </>
        )}
      </section>
      <section className="panel verify p-verify" aria-labelledby="h-verify">
        <header><h2 id="h-verify">Verification</h2></header>
        {rec && proof && result ? (
          <Verification result={result} name={name} check={check} blind={blind} total={rec.width * rec.height} />
        ) : (
          <p className="hint">{rec ? 'The check appears at the last step.' : 'Waiting for a recovered image to check.'}</p>
        )}
      </section>
    </div>
  );
}
