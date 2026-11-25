'use client';
import { useEffect, useMemo, useRef } from 'react';
import type { ByteRange } from '../../engine/types';
import { describeLayout, describeShort } from '../describe';
import { announce, type Region } from '../regions';
import type { RitualView } from '../ritual/ritual';
import type { AppState } from '../state';
import { FilePick } from './FilePick';

// Pixel ghost, 13 wide. '#' is a cell, 'o' is an eye.
const GHOST = [
  '....#####....',
  '..#########..',
  '.###########.',
  '.###########.',
  '####o###o####',
  '####o###o####',
  '#############',
  '#############',
  '#############',
  '#############',
  '##.###.###.##',
  '#...#...#...#',
];
const CELL = 10;
const MAX_DPR = 2;
const FRAME = 36; // px kept free around the picture for the frame and its glow
const SETTLE_MS = 700; // an uncertain row flickers amber this long after it appears, at 1x
const rowRegion = (regions: Region[], row: number) => regions.find((r) => r.kind === 'row' && r.rows[0] === row);

/** Writes into the text node React owns, so React's own later update still lands. */
const setText = (el: HTMLElement | null, s: string) => { if (el?.firstChild) el.firstChild.nodeValue = s; };

function Ghost() {
  return (
    <svg className="ghost" viewBox={`0 0 ${13 * CELL} ${GHOST.length * CELL}`} aria-hidden="true" focusable="false" shapeRendering="crispEdges">
      {GHOST.flatMap((row, y) =>
        [...row].map((c, x) =>
          c === '.' ? null : <rect key={`${x}-${y}`} x={x * CELL + 0.75} y={y * CELL + 0.75} width={CELL - 1.5} height={CELL - 1.5} rx="1.5" fill="currentColor" className={c === 'o' ? 'eye' : undefined} />,
        ),
      )}
    </svg>
  );
}

/** How much of the picture is shown: 0 grey (beat 4), a share of beat 5, or all of it. */
export type Reveal = { mode: 'grey' } | { mode: 'play'; token: number; ms: number; speed: number } | { mode: 'fixed'; p: number };
type Bars = { count: React.RefObject<HTMLSpanElement | null>; pct: React.RefObject<HTMLSpanElement | null>; bar: React.RefObject<HTMLElement | null> };

/**
 * Draws the real recovered RGB. Whole-number scaling, nearest neighbour, backing store sized for DPR (capped at 2).
 * Before the reveal, every row is a dimmed grey of that row's own pixels; beat 5 swaps rows to colour top to bottom.
 * Uncertain rows flicker amber, then settle. All of it is a function of time only, so it is the same every run.
 */
type RowPick = { regions: Region[]; selectedId: string | null; cursor: number | null; onCursor: (row: number | null) => void; onPickRow: (row: number, key: boolean) => void };

function RecoveredCanvas({ width, height, rgb, status, reveal, bars, regions, selectedId, cursor, onCursor, onPickRow }: { width: number; height: number; rgb: Uint8Array; status: string[]; reveal: Reveal; bars: Bars } & RowPick) {
  const wrap = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const paintAt = useRef<(f: number, elapsed: number, speed: number) => void>(() => {});
  const last = useRef({ f: 1, elapsed: 0, speed: 1 });

  useEffect(() => {
    const box = wrap.current;
    const canvas = cv.current;
    if (!box || !canvas) return;
    const src = document.createElement('canvas');
    src.width = width;
    src.height = height;
    const sctx = src.getContext('2d');
    const grey = document.createElement('canvas');
    grey.width = width;
    grey.height = height;
    const gctx = grey.getContext('2d');
    if (!sctx || !gctx) return;
    const img = sctx.createImageData(width, height);
    const gimg = gctx.createImageData(width, height);
    for (let i = 0, p = 0; i < width * height; i++, p += 4) {
      const r = rgb[i * 3]!;
      const g = rgb[i * 3 + 1]!;
      const b = rgb[i * 3 + 2]!;
      img.data[p] = r;
      img.data[p + 1] = g;
      img.data[p + 2] = b;
      img.data[p + 3] = 255;
      const v = 24 + (0.299 * r + 0.587 * g + 0.114 * b) * 0.26;
      gimg.data[p] = gimg.data[p + 1] = gimg.data[p + 2] = v;
      gimg.data[p + 3] = 255;
    }
    sctx.putImageData(img, 0, 0);
    gctx.putImageData(gimg, 0, 0);
    const amber = getComputedStyle(document.documentElement).getPropertyValue('--uncertain').trim();
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();

    let k = 1;
    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      k = Math.max(1, Math.min(64, Math.floor(Math.min(((box.clientWidth - FRAME) * dpr) / width, ((box.clientHeight - FRAME) * dpr) / height))));
      canvas.width = width * k;
      canvas.height = height * k;
      canvas.style.width = `${(width * k) / dpr}px`;
      canvas.style.height = `${(height * k) / dpr}px`;
    };
    paintAt.current = (f, elapsed, speed) => {
      last.current = { f, elapsed, speed };
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const n = Math.min(height, Math.floor(f * height));
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(grey, 0, 0, canvas.width, canvas.height);
      if (n > 0) ctx.drawImage(src, 0, 0, width, n, 0, 0, canvas.width, n * k);
      if (f < 1) {
        // The scan edge: one row of accent where colour meets grey.
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = accent;
        ctx.fillRect(0, Math.min(n, height - 1) * k, canvas.width, k);
        ctx.globalAlpha = 1;
        // Uncertain rows flicker amber for a moment after they appear. A fixed sine of the row's age: no randomness.
        const dur = (elapsed / Math.max(f, 1e-6));
        const settle = SETTLE_MS / speed;
        ctx.fillStyle = amber;
        for (let r = Math.max(0, n - Math.ceil((settle / dur) * height)); r < n; r++) {
          if (status[r] === 'ok') continue;
          const age = elapsed - (r / height) * dur;
          if (age < 0 || age > settle) continue;
          ctx.globalAlpha = 0.6 * (1 - age / settle) * (0.55 + 0.45 * Math.sin((age * speed) / 22));
          ctx.fillRect(0, r * k, canvas.width, k);
        }
        ctx.globalAlpha = 1;
      }
      setText(bars.count.current, `Rows rebuilt ${n} of ${height}`);
      setText(bars.pct.current, `${Math.round((n / height) * 100)}%`);
      if (bars.bar.current) bars.bar.current.style.setProperty('--s', String(n / height));
      canvas.dataset.shown = String(n);
    };
    size();
    paintAt.current(last.current.f, last.current.elapsed, last.current.speed);
    const ro = new ResizeObserver(() => {
      size();
      paintAt.current(last.current.f, last.current.elapsed, last.current.speed);
    });
    ro.observe(box);
    return () => ro.disconnect();
  }, [width, height, rgb, status, bars]);

  useEffect(() => {
    if (reveal.mode === 'grey') return paintAt.current(0, 0, 1);
    if (reveal.mode === 'fixed') return paintAt.current(reveal.p, 0, 1);
    let raf = 0;
    const t0 = performance.now();
    const tick = () => {
      const elapsed = performance.now() - t0;
      const f = Math.min(1, Math.max(0, elapsed / reveal.ms));
      paintAt.current(f, elapsed, reveal.speed);
      if (f < 1) raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [reveal]);

  const rowAt = (clientY: number, el: HTMLElement) => {
    const r = (el.parentElement?.querySelector('canvas') ?? el).getBoundingClientRect();
    return Math.max(0, Math.min(height - 1, Math.floor(((clientY - r.top) / r.height) * height)));
  };
  const step = (e: React.KeyboardEvent) => {
    const at = cursor ?? 0;
    const move: Record<string, number> = { ArrowDown: at + 1, ArrowUp: at - 1, PageDown: at + 10, PageUp: at - 10, Home: 0, End: height - 1 };
    if (e.key in move) {
      e.preventDefault();
      onCursor(Math.max(0, Math.min(height - 1, move[e.key]!)));
    } else if ((e.key === 'Enter' || e.key === ' ') && cursor !== null) {
      e.preventDefault();
      onPickRow(cursor, true);
    }
  };

  return (
    <div ref={wrap} className="canvas-wrap">
      <div className="frame">
        <canvas ref={cv} className="recovered" role="img" aria-label={`Recovered picture, ${width} by ${height} pixels, rebuilt from the file's bytes`} />
        <div
          className="row-hit"
          role="listbox"
          tabIndex={0}
          aria-label={`Recovered rows, ${height}. Up and down arrows move, Enter picks a row.`}
          aria-activedescendant={cursor !== null ? `row-opt-${cursor}` : undefined}
          data-testid="row-list"
          onFocus={() => cursor === null && onCursor(0)}
          onBlur={() => onCursor(null)}
          onKeyDown={step}
          // Pick on pointer down: focusing the list can scroll the page before a click would land, and the row would shift.
          onPointerDown={(e) => {
            const row = rowAt(e.clientY, e.currentTarget);
            onCursor(row);
            onPickRow(row, false);
          }}
        >
          {Array.from({ length: height }, (_, r) => {
            const reg = rowRegion(regions, r);
            return (
              <div key={r} id={`row-opt-${r}`} role="option" aria-selected={reg?.id === selectedId} className="sr-only">
                {reg ? announce(reg) : `Row ${r}, no evidence`}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export type RitualProps = RitualView & { speed: number; reduced: boolean; onHover: (r: ReadonlyArray<ByteRange> | null) => void };

export type Compare = { refusal: string; source: string };

export function ImagePanel({ state, forcedLoading, onSample, onFile, ritual, source, compare, ...pick }: RowPick & { source: { text: string; href?: string } | null; compare?: Compare | null; state: AppState; forcedLoading: boolean; onSample: () => void; onFile: (f: File) => void; ritual: RitualProps }) {
  const busy = state.phase === 'loading' || state.phase === 'analysing' || forcedLoading;
  const rec = state.phase === 'done' ? state.result.recovered : null;
  const ok = rec && rec.status === 'ok' ? rec : null;
  const analysis = state.phase === 'done' ? state.result.analysis : null;
  const hyps = analysis && analysis.status === 'ok' ? analysis.hypotheses : [];
  const hyp = ok ? hyps.find((h) => h.id === ok.hypothesisId) : undefined;
  const total = hyps.length;
  // R-4 F5: show distinct guesses only. A loser that reads exactly like one already shown goes into "more behind these".
  const top = hyps.filter((h, i, a) => a.findIndex((x) => describeShort(x.layout) === describeShort(h.layout) && x.confidence === h.confidence && (x.lostBecause ?? '') === (h.lostBecause ?? '')) === i).slice(0, 3);
  // T-20: the failure list shows guesses that read differently only; the rest are counted.
  const distinct = hyps.filter((h, i, a) => a.findIndex((x) => describeShort(x.layout) === describeShort(h.layout) && (x.lostBecause ?? '') === (h.lostBecause ?? '')) === i).slice(0, 3);
  const rb = ok ? ritual.beat : 0;
  const bytesN = state.phase === 'done' ? state.bytes.length : 0;
  const view = busy ? 'loading' : ok ? (rb >= 1 && rb <= 3 ? 'ritual' : 'done') : state.phase === 'idle' ? 'empty' : 'failed';
  const meta = busy ? 'Reading the file' : ok ? `Recovered ${ok.width} by ${ok.height}` : state.phase === 'idle' ? 'Waiting for a file' : 'Not recovered';
  const noImage = state.phase === 'failed' ? state.reason : rec && rec.status === 'unrecovered' ? rec.reason : '';
  const count = useRef<HTMLSpanElement>(null);
  const pct = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLElement | null>(null);
  const bars = useMemo<Bars>(() => ({ count, pct, bar }), []);
  const rowStatus = ok ? ok.rows.reduce<string[]>((a, r) => { a[r.index] = r.status; return a; }, []) : [];

  const { fixed, token, ms, speed } = ritual;
  const reveal = useMemo<Reveal>(() => {
    if (rb === 4) return { mode: 'grey' };
    if (rb === 5 && fixed === null) return { mode: 'play', token, ms, speed };
    if (rb === 5) return { mode: 'fixed', p: fixed ?? 1 };
    return { mode: 'fixed', p: 1 };
  }, [rb, fixed, token, ms, speed]);
  const shown = ok ? (rb === 4 ? 0 : rb === 5 && ritual.fixed !== null ? Math.floor(ritual.fixed * ok.height) : rb === 5 ? 0 : ok.height) : 0;

  const note = !ok ? '' : [
    '',
    `${bytesN.toLocaleString('en-US')} bytes. Nothing in them has a name yet.`,
    `Listening to the bytes for ${analysis && analysis.status === 'ok' ? analysis.evidence.filter((e) => e.hypothesisId === ok.hypothesisId).length : 0} kinds of structure.`,
    `${total} layout guesses, ranked. ${total > top.length ? `${total - top.length} more behind these.` : ''}`,
    `Tying ${ok.height} rows to the bytes that make them.`,
    `Rebuilding ${ok.height} rows.`,
    `Rebuilt ${ok.width} by ${ok.height} from ${bytesN.toLocaleString('en-US')} bytes.`,
  ][rb] ?? '';

  const buttons = (
    <div className="actions">
      <button type="button" className="btn" onClick={onSample}>Resurrect a sample</button>
      <FilePick label="Choose a file" className="btn ghost-btn" onFile={onFile} testId="image-file-input" />
    </div>
  );

  return (
    <div className="col col-image">
      <section className="panel panel-l2 stage-wrap" aria-labelledby="h-image" data-layer="L2">
        <header>
          <h2 id="h-image">Recovered image</h2>
          <p className={`meta${busy || ok ? ' live' : ''}`}>{meta}</p>
        </header>
        <div className="image-stage" data-state={view} style={ok ? ({ '--pic-h': `${ok.height + FRAME + 4}px` } as React.CSSProperties) : undefined}>
          {view === 'done' && ok ? (
            <RecoveredCanvas width={ok.width} height={ok.height} rgb={ok.rgb} status={rowStatus} reveal={reveal} bars={bars} {...pick} />
          ) : view === 'ritual' && ok ? (
            <div className="ritual-stage" data-beat={rb}>
              {rb === 3 ? null : <div className={rb === 2 ? 'scan-ghost' : undefined}><Ghost /></div>}
              {rb === 1 ? <p className="empty-title">Dead file</p> : null}
              {rb === 2 ? (
                <ul className="detectors" aria-label="What the engine is listening for">
                  {(analysis && analysis.status === 'ok' ? analysis.evidence.filter((e) => e.hypothesisId === ok.hypothesisId) : []).map((e, i) => (
                    <li key={e.elementId} style={{ animationDelay: `calc(${i * 180}ms / var(--speed, 1))` }}>{e.elementId.replace(/[-_]+/g, ' ')}</li>
                  ))}
                </ul>
              ) : null}
              {rb === 3 ? (
                <ol className="hcards" aria-label="Layout guesses, best first">
                  {top.map((h, i) => (
                    <li key={h.id} className={`hcard${i === 0 ? ' win' : ' lost'}`} style={{ '--c': h.confidence, '--i': i } as React.CSSProperties}>
                      <button
                        type="button"
                        onMouseEnter={() => ritual.onHover(h.ranges)}
                        onMouseLeave={() => ritual.onHover(null)}
                        onFocus={() => ritual.onHover(h.ranges)}
                        onBlur={() => ritual.onHover(null)}
                      >
                        <span className="hc-top"><strong>Guess {h.rank}</strong><span className="mono">{h.confidence.toFixed(2)}</span></span>
                        <span className="hc-bar" aria-hidden="true"><i /></span>
                        <span className="hc-what">{describeShort(h.layout)}</span>
                        <span className="hc-why">{i === 0 ? 'Best fit. Every byte is used.' : (h.lostBecause ?? 'Ranked lower.')}</span>
                      </button>
                    </li>
                  ))}
                </ol>
              ) : null}
            </div>
          ) : view === 'loading' ? (
            <>
              <div className="pulse"><Ghost /></div>
              <p className="empty-title" role="status">Reading the bytes<em>.</em></p>
            </>
          ) : view === 'failed' ? (
            <div className="failure" data-testid="failure">
              <p className="failure-title">{state.phase === 'failed' ? 'That file could not be opened' : 'No picture was rebuilt'}</p>
              <div className="failure-frame" data-testid="failure-frame">
                <div className="failure-ghost" aria-hidden="true"><Ghost /></div>
                <p className="failure-reason" role="alert" data-testid="failure-reason">{noImage}</p>
              </div>
              {distinct.length > 0 ? (
                <div className="found" data-testid="found">
                  <h3>Found before it failed</h3>
                  <ol>
                    {distinct.map((h) => (
                      <li key={h.id}>
                        <span className="found-what"><strong>Guess {h.rank}</strong> {describeShort(h.layout)} <span className="mono">{h.confidence.toFixed(2)}</span></span>
                        {h.lostBecause ? <span className="found-why">{h.lostBecause}</span> : null}
                      </li>
                    ))}
                  </ol>
                  {total > distinct.length ? <p className="found-more" data-testid="found-more">{total - distinct.length} more like these</p> : null}
                </div>
              ) : null}
              {buttons}
            </div>
          ) : (
            <>
              <Ghost />
              <p className="empty-title">Drop a file nothing can open, or <em>resurrect a sample</em></p>
              <p className="empty-sub">The file is read here, in your browser. The format is worked out from the bytes alone.</p>
              {buttons}
            </>
          )}
        </div>
        {ok && source ? (
          <p className="source-line" data-testid="source-line">{source.text}. <a href={source.href} target="_blank" rel="noopener noreferrer" data-testid="source-link">Abuse art on OpenGameArt<span className="sr-only"> (opens in a new tab)</span></a></p>
        ) : null}
        {ok ? (
          <p className="beat-note" role="status" aria-live="polite" data-testid="beat-note">{note}</p>
        ) : null}
        {ok && rb > 0 && !ritual.finished ? (
          <div className="ritual-ctl">
            {ritual.reduced ? <button type="button" className="btn ghost-btn btn-sm" onClick={ritual.next}>Next beat</button> : null}
            <button type="button" className="btn btn-sm skip-btn" onClick={ritual.skip}>Skip to result</button>
          </div>
        ) : null}
        {ok && compare && ritual.finished ? (
          <div className="versus" data-testid="versus">
            <div className="vs-side" data-side="standard">
              <p className="vs-title">A standard decoder</p>
              <p className="vs-verdict">refuses this file</p>
              <p className="vs-msg mono" data-testid="vs-refusal">{compare.refusal}</p>
              <p className="vs-src">{compare.source}</p>
            </div>
            <div className="vs-side" data-side="necro">
              <p className="vs-title">Format Necromancer</p>
              <p className="vs-verdict">recovered, exact</p>
              <p className="vs-src">Compared with the reference picture, pixel by pixel.</p>
            </div>
          </div>
        ) : null}
        {ok ? (
          <div className="hyp">
            <p><strong>Hypothesis 1 of {total}</strong> {hyp ? describeShort(hyp.layout) : ''}</p>
            <details>
              <summary>Show the full reading</summary>
              <p>{hyp ? describeLayout(hyp.layout) : 'The engine named no rule.'}</p>
            </details>
          </div>
        ) : null}
        {ok ? (
          <div className="progress">
            <div>
              <span ref={count}>{`Rows rebuilt ${shown} of ${ok.height}`}</span>
              <span className="mono" ref={pct}>{`${Math.round((shown / ok.height) * 100)}%`}</span>
            </div>
            <div className="bar" role="presentation"><i ref={bar} style={{ '--s': shown / ok.height } as React.CSSProperties} /></div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
