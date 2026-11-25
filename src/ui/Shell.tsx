'use client';
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import type { ByteRange } from '../engine/types';
import { L0Field } from './layers/L0Field';
import { BytesPanel } from './panels/BytesPanel';
import { ImagePanel, type Compare } from './panels/ImagePanel';
import { Hud, type Check, type GridLight } from './hud/Hud';
import { browserInflate, decodePng } from '../engine/png';
import { probeEngine, runEngine, runVerify, type EngineStatus } from './worker/client';
import { initialState, reducer } from './state';
import { L3Evidence, type Draw } from './layers/L3Evidence';
import { Inspector } from './panels/Inspector';
import { buildFailureRegions, buildRegions, regionAt, type Region } from './regions';
import { BEATS, SPEEDS, nextSpeed, useRitual, type Hold, type Speed } from './ritual/ritual';
import type { Sel } from './selection';

const REPO = 'https://github.com/parthlaturiya1/format_necromancer'; // the public README, section "The honest claim"
export const MAX_FILE_BYTES = 10 * 1024 * 1024; // same as the engine limit (maxInputBytes)

type SampleEntry = { id: string; path: string; bytes: number; reference?: string; label?: string; real?: boolean; refusal?: string; refusalSource?: string };
type Note = { badge?: string; text: string; href?: string; compare?: Compare };
const ABUSE_PAGE = 'https://opengameart.org/content/abuse-art'; // a link only: the app never fetches it
type SampleIndex = { default: string; samples: SampleEntry[] };

// Dev hooks so every state is reachable: #loading, #crash (shows error.tsx). Default is the empty state.
const readHash = (): string => window.location.hash.slice(1);

const mb = (n: number) => `${(n / (1024 * 1024)).toFixed(1)} MB`;
const store = {
  get: (k: string) => { try { return window.sessionStorage.getItem(k); } catch { return null; } },
  set: (k: string, v: string) => { try { window.sessionStorage.setItem(k, v); } catch { /* private mode: the choice just does not persist */ } },
};
const TRAIL_BYTES = 280; // the ritual's lines start only from bytes that are on screen when the hex panel is at the top

/** Up to three confident rows whose bytes are in the first screen of the hex panel, spread out. Same result every run. */
function trailOf(regions: Region[]): Region[] {
  const near = regions.filter((r) => r.kind === 'row' && r.status === 'ok' && (r.ranges[0]?.start ?? Infinity) < TRAIL_BYTES);
  return [near[0], near[Math.floor(near.length / 2)], near[near.length - 1]].filter((r, i, a): r is Region => !!r && a.indexOf(r) === i);
}

export function Shell() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [hash, setHash] = useState('');
  const [engine, setEngine] = useState<EngineStatus>('starting');
  const [dragging, setDragging] = useState(false);
  const [cursor, setCursor] = useState<number | null>(null);
  const [speed, setSpeedState] = useState<Speed>(2); // P-1: the first run finishes in about 8 s; 1x stays one press away (4, 0.5, 1)
  const [osReduced, setOsReduced] = useState(false);
  const [reducedPref, setReducedPref] = useState<boolean | null>(null);
  const [hold, setHold] = useState<Hold>(null);
  const [hover, setHover] = useState<ReadonlyArray<ByteRange> | null>(null);
  const [check, setCheck] = useState<Check>({ k: 'none' });
  const [blind, setBlind] = useState<Note | null>(null);
  const [samples, setSamples] = useState<SampleIndex | null>(null);
  const run = useRef(0); // a newer load makes older ones stop reporting
  const reduced = reducedPref ?? osReduced;

  const setSpeed = useCallback((s: Speed) => { setSpeedState(s); store.set('fn.speed', String(s)); }, []);
  const setReduced = useCallback((v: boolean) => { setReducedPref(v); store.set('fn.reduced', v ? '1' : '0'); }, []);

  useEffect(() => {
    // Read the hash from the event, not the address bar: on a cold load the router's first replaceState can wipe the
    // hash between the change and this handler, which made the #crash hook miss about one load in four.
    const sync = (e?: HashChangeEvent) => setHash(e ? new URL(e.newURL).hash.slice(1) : readHash());
    sync();
    window.addEventListener('hashchange', sync);
    let live = true;
    void probeEngine().then((s) => live && setEngine(s));
    void fetch('/samples/index.json').then((r) => r.json() as Promise<SampleIndex>).then((i) => live && setSamples(i), () => undefined);
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onMq = () => setOsReduced(mq.matches);
    onMq();
    mq.addEventListener('change', onMq);
    // Session choices first, then the address (it wins): ?speed=2, ?beat=3&p=0.5
    const init = () => {
    const q = new URLSearchParams(window.location.search);
    const saved = Number(store.get('fn.speed'));
    const want = Number(q.get('speed') ?? saved);
    if ((SPEEDS as readonly number[]).includes(want)) setSpeedState(want as Speed);
    const r = store.get('fn.reduced');
    if (r) setReducedPref(r === '1');
    if (q.get('motion') === 'reduced') setReducedPref(true);
    const beat = Number(q.get('beat'));
    if (beat >= 1 && beat <= 6) setHold({ beat, p: q.has('p') ? Math.min(1, Math.max(0, Number(q.get('p')))) : 1 });
    };
    init();
    return () => { live = false; window.removeEventListener('hashchange', sync); mq.removeEventListener('change', onMq); };
  }, []);

  useEffect(() => { document.documentElement.dataset.motion = reduced ? 'reduced' : 'full'; }, [reduced]);

  const result = state.phase === 'done' ? state.result : null;
  // R-U23: failure red is used only when nothing was recovered. The analysis evidence that did exist keeps its bytes lit.
  const failed = state.phase === 'failed' || (result !== null && result.recovered.status !== 'ok');
  const regions = useMemo(() => (result ? (result.recovered.status === 'ok' ? buildRegions(result) : buildFailureRegions(result)) : []), [result]);
  const imageHeight = result && result.recovered.status === 'ok' ? result.recovered.height : 0;
  const ritual = useRitual(result && result.recovered.status === 'ok' && result.analysis.status === 'ok' ? result : null, imageHeight, speed, reduced, hold);
  const rb = ritual.beat;
  const playing = rb >= 1 && rb <= 5 && !ritual.finished; // beats the picked region stays out of

  // The best region is picked when a run ends, so the card is never empty beside a finished picture (N7). Ties go to a row, which has a line to draw.
  const auto = useMemo<Sel | null>(() => {
    const best = regions.filter((r) => !r.umbrella).reduce<(typeof regions)[number] | null>((b, r) => (!b || r.confidence > b.confidence || (r.confidence === b.confidence && b.kind !== 'row' && r.kind === 'row') ? r : b), null);
    return best ? { id: best.id, offset: null, from: 'auto', focus: false } : null;
  }, [regions]);
  const [picked, setPicked] = useState<{ regions: typeof regions; sel: Sel | null } | null>(null);
  const sel = picked && picked.regions === regions ? picked.sel : auto;
  const setSel = useCallback((s: Sel | null) => setPicked({ regions, sel: s }), [regions]);
  const found = (sel?.id && regions.find((r) => r.id === sel.id)) || null;
  const selected = playing ? null : found;
  const shownSel = playing ? null : sel;
  const pickRegion = useCallback((id: string, key: boolean, from: Sel['from'] = 'list') => setSel({ id, offset: null, from, focus: key }), [setSel]);
  const pickRow = useCallback((row: number, key: boolean) => {
    const r = regions.find((x) => x.kind === 'row' && x.rows[0] === row);
    if (r) pickRegion(r.id, key, 'row');
  }, [regions, pickRegion]);
  const pickByte = useCallback((offset: number) => setSel({ id: regionAt(regions, offset)?.id ?? null, offset, from: 'byte', focus: false }), [regions, setSel]);

  // Lines on the stage. Ritual beats 4 and 5: a few confident rows. After: the picked region, plus one of the other status when there is one (R-3 F1).
  const draws = useMemo<Draw[]>(() => {
    if (failed || (rb >= 1 && rb <= 3 && !ritual.finished)) return [];
    if (playing) return trailOf(regions).map((region) => ({ region, role: 'trail' as const }));
    if (!found) return [];
    const rows = regions.filter((r) => r.kind === 'row');
    const other = found.status === 'ok' ? rows.find((r) => r.status !== 'ok') : rows.filter((r) => r.status === 'ok').reduce<Region | undefined>((b, r) => (!b || r.confidence > b.confidence ? r : b), undefined);
    return [{ region: found, role: 'main' }, ...(other && other.id !== found.id ? [{ region: other, role: 'alt' as const }] : [])];
  }, [failed, rb, ritual.finished, playing, regions, found]);

  const start = useCallback(async (name: string, read: () => Promise<ArrayBuffer>, referenceUrl?: string, note?: Note) => {
    const mine = ++run.current;
    setCheck({ k: 'none' });
    setBlind(note ?? null);
    dispatch({ type: 'load', name });
    try {
      const buf = await read();
      if (mine !== run.current) return;
      dispatch({ type: 'read', bytes: new Uint8Array(buf) });
      const result = await runEngine(buf.slice(0));
      if (mine !== run.current) return;
      dispatch({ type: 'result', result });
      // R-U7: the reference is fetched only after recovery, and only for bundled samples. Every bundled sample has one.
      if (referenceUrl && result.recovered.status === 'ok') {
        setCheck({ k: 'pending' });
        try {
          const r = await fetch(referenceUrl);
          if (!r.ok) throw new Error('reference missing');
          const ref = await decodePng(new Uint8Array(await r.arrayBuffer()), browserInflate);
          const report = await runVerify(ref);
          if (mine === run.current) setCheck({ k: 'done', report });
        } catch {
          if (mine === run.current) setCheck({ k: 'missing' });
        }
      }
    } catch (e) {
      if (mine === run.current) dispatch({ type: 'fail', name, reason: e instanceof Error ? e.message : 'The file could not be read.' });
    }
  }, []);

  const loadFile = useCallback((file: File) => {
    if (file.size > MAX_FILE_BYTES) {
      run.current++;
      dispatch({ type: 'fail', name: file.name, reason: `That file is ${mb(file.size)}. The limit is 10 MB. Nothing was read.` });
      return;
    }
    void start(file.name, () => file.arrayBuffer());
  }, [start]);

  const loadSample = useCallback((id?: string) => {
    void (async () => {
      try {
        const index = (await (await fetch('/samples/index.json')).json()) as SampleIndex;
        const s = index.samples.find((x) => x.id === (id ?? index.default)) ?? index.samples[0];
        if (!s) throw new Error('No bundled sample was found.');
        await start(`${s.id}.pcx`, async () => {
          const r = await fetch(s.path);
          if (!r.ok) throw new Error('The sample could not be loaded.');
          return r.arrayBuffer();
        }, s.reference, s.id.startsWith('blind-') ? { badge: 'Blind test', text: 'Held-out file, never used for tuning.' } : s.real ? { badge: 'Real game art (CC0)', text: 'From the game Abuse by Crack dot Com, CC0, via OpenGameArt', href: ABUSE_PAGE } : s.label ? { text: s.label, compare: s.refusal ? { refusal: s.refusal, source: s.refusalSource ?? '' } : undefined } : undefined);
      } catch (e) {
        dispatch({ type: 'fail', name: 'sample', reason: e instanceof Error ? e.message : 'The sample could not be loaded.' });
      }
    })();
  }, [start]);

  // ?demo=1 (or any ?beat=) starts the default sample once the page has loaded. The same bytes and the same engine give the same run.
  const auto1 = useRef(false);
  useEffect(() => {
    if (auto1.current) return;
    const q = new URLSearchParams(window.location.search);
    if (q.get('demo') === '1' || q.has('beat')) { auto1.current = true; loadSample(q.get('sample') ?? undefined); }
  }, [loadSample]);

  if (hash === 'crash') throw new Error('Demo crash requested with #crash');

  const forcedLoading = state.phase === 'idle' && hash === 'loading';
  // The timeline stops at the beat where the run failed: reading (file unreadable), listening (no layout found), resurrection (a layout, but no picture).
  const failBeat = state.phase === 'failed' ? 0 : result && result.analysis.status !== 'ok' ? 1 : 4;
  const current = failed ? failBeat : rb > 0 ? (ritual.finished ? 5 : rb - 1) : state.phase === 'done' ? 4 : state.phase === 'analysing' || forcedLoading ? 1 : 0;
  const fileline =
    state.phase === 'idle' ? 'No file yet, format unknown'
    : state.phase === 'loading' ? `Reading ${state.name}`
    : state.phase === 'failed' ? `${state.name}, could not be opened`
    : state.phase === 'analysing' ? `${state.name}, ${state.bytes.length.toLocaleString('en-US')} bytes, format unknown`
    : `${state.name}, ${state.bytes.length.toLocaleString('en-US')} bytes${failed ? ', nothing recovered' : ''}`;

  const rowStatus = result && result.recovered.status === 'ok' ? result.recovered.rows.reduce<string[]>((a, r) => { a[r.index] = r.status; return a; }, []) : null;
  const light: GridLight = rb === 0 ? { mode: rowStatus ? 'on' : 'off' } : rb < 5 ? { mode: 'off' } : rb === 5 && ritual.fixed === null ? { mode: 'play', ms: ritual.ms } : rb === 5 && ritual.fixed !== null && ritual.fixed < 1 ? { mode: 'part', share: ritual.fixed } : { mode: 'on' };
  const phase = rb === 0 ? 'none' : ritual.finished ? 'done' : 'playing';

  return (
    <>
      <L0Field still={reduced} />
      <div className="app" data-failed={failed ? '' : undefined} data-beat={rb || undefined} data-ritual={phase} data-speed={speed} style={{ '--speed': speed } as React.CSSProperties}>
        <header className="topbar">
          <div className="brand">
            <span className="logo" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3.2" fill="currentColor" stroke="none" /></svg>
            </span>
            <div style={{ minWidth: 0 }}>
              <h1>Format Necromancer</h1>
              <p className="promise" data-testid="promise">Recovers a dead file from its bytes alone. No specification. Nothing uploaded.</p>
              <p className="fileline">{fileline}</p>
            </div>
          </div>
          <div className="timeline-wrap">
            <ol className="timeline" aria-label="Six steps" style={{ '--p': current / (BEATS.length - 1) } as React.CSSProperties}>
              {BEATS.map((s, i) => (
                <li key={s} data-state={i < current ? 'done' : i === current ? (failed ? 'failed' : 'current') : 'todo'} aria-current={i === current ? 'step' : undefined}><span>{s}</span></li>
              ))}
            </ol>
            <p className="timeline-now" aria-hidden="true">{BEATS[current]}{failed ? ', stopped' : '' }</p>
          </div>
          <button type="button" className="speed" data-testid="speed" onClick={() => setSpeed(nextSpeed(speed))} aria-label={`Speed ${speed}x. Press to change: 0.5x, 1x, 2x, 4x.`}>Speed {speed}x</button>
        </header>
        <main
          className={`stage${dragging ? ' dragging' : ''}`}
          onKeyDown={(e) => e.key === 'Escape' && setSel(null)}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false); }}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const f = e.dataTransfer.files[0];
            if (f) loadFile(f);
          }}
        >
          <div className="col col-bytes"><BytesPanel state={state} onFile={loadFile} samples={samples?.samples ?? []} onSample={loadSample} failed={failed} regions={regions} sel={shownSel} selected={failed ? null : selected} onPickByte={pickByte} beat={rb} hover={hover ?? (rb === 3 && result && result.analysis.status === 'ok' ? (result.analysis.hypotheses[0]?.ranges ?? null) : null)} />
            <Inspector regions={regions} selected={selected} sel={shownSel} onPick={pickRegion} />
          </div>
          <ImagePanel source={blind?.href ? blind : null} compare={blind?.compare ?? null} state={state} forcedLoading={forcedLoading} onSample={() => loadSample()} onFile={loadFile} regions={regions} selectedId={selected?.id ?? null} cursor={cursor} onCursor={setCursor} onPickRow={pickRow} ritual={{ ...ritual, speed, reduced, onHover: setHover }} />
          <L3Evidence draws={draws} cursor={cursor} imageHeight={imageHeight} />
          <Hud failed={failed} result={result} name={state.phase === 'done' ? state.name : ''} regions={regions} light={light} proof={rb === 6} check={check} blind={blind} fileBytes={state.phase === 'done' ? state.bytes.length : 0} selectedId={selected?.id ?? null} onPickRow={pickRow} />
        </main>
        <footer className="foot">
          <div className="foot-l">
            <p className="lock">Runs in your browser. Nothing is uploaded.</p>
            {phase === 'done' ? <p className="recovered-line" data-testid="recovered-line">Recovered without the format specification.</p> : null}
            {phase === 'done' ? (
              <p className="disclosure" data-testid="disclosure">
                Layout inferred by generic detectors; pixels by a format-aware decoder for this layout family (disclosed).{' '}
                <a href={`${REPO}#the-honest-claim`} target="_blank" rel="noopener noreferrer">The honest claim<span className="sr-only"> (opens the README)</span></a>
              </p>
            ) : null}
          </div>
          <div className="foot-r">
            <button type="button" className="toggle" aria-pressed={reduced} data-testid="reduce-motion" onClick={() => setReduced(!reduced)}>Reduce motion: {reduced ? 'on' : 'off'}</button>
            <p className="credit">Created by Parth Radheshyam Laturiya. Direction, product decisions and review by the owner; code written by Kiro.</p>
          </div>
        </footer>
      </div>
      <output hidden data-engine-status={engine}>{engine}</output>
    </>
  );
}
