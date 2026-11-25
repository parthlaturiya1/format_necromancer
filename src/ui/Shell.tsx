'use client';
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { L0Field } from './layers/L0Field';
import { BytesPanel } from './panels/BytesPanel';
import { ImagePanel } from './panels/ImagePanel';
import { Hud } from './hud/Hud';
import { probeEngine, runEngine, type EngineStatus } from './worker/client';
import { initialState, reducer } from './state';
import { L3Evidence } from './layers/L3Evidence';
import { Inspector } from './panels/Inspector';
import { buildRegions, regionAt } from './regions';
import type { Sel } from './selection';

const STEPS = ['Dead file', 'Listening', 'Hypotheses', 'Evidence', 'Resurrection', 'Proof'];
export const MAX_FILE_BYTES = 10 * 1024 * 1024; // same as the engine limit (maxInputBytes)

type SampleIndex = { default: string; samples: { id: string; path: string; bytes: number; reference: string }[] };

// Dev hooks so every state is reachable: #loading, #crash (shows error.tsx). Default is the empty state.
const readHash = (): string => window.location.hash.slice(1);

const mb = (n: number) => `${(n / (1024 * 1024)).toFixed(1)} MB`;

export function Shell() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [hash, setHash] = useState('');
  const [engine, setEngine] = useState<EngineStatus>('starting');
  const [dragging, setDragging] = useState(false);
  const [cursor, setCursor] = useState<number | null>(null);
  const run = useRef(0); // a newer load makes older ones stop reporting

  useEffect(() => {
    const sync = () => setHash(readHash());
    sync();
    window.addEventListener('hashchange', sync);
    let live = true;
    void probeEngine().then((s) => live && setEngine(s));
    return () => { live = false; window.removeEventListener('hashchange', sync); };
  }, []);

  const result = state.phase === 'done' ? state.result : null;
  const regions = useMemo(() => (result ? buildRegions(result) : []), [result]);
  const imageHeight = result && result.recovered.status === 'ok' ? result.recovered.height : 0;

  // The best region is picked when a run ends, so the card is never empty beside a finished picture (N7). Ties go to a row, which has a line to draw.
  const auto = useMemo<Sel | null>(() => {
    const best = regions.filter((r) => !r.umbrella).reduce<(typeof regions)[number] | null>((b, r) => (!b || r.confidence > b.confidence || (r.confidence === b.confidence && b.kind !== 'row' && r.kind === 'row') ? r : b), null);
    return best ? { id: best.id, offset: null, from: 'auto', focus: false } : null;
  }, [regions]);
  const [picked, setPicked] = useState<{ regions: typeof regions; sel: Sel | null } | null>(null);
  const sel = picked && picked.regions === regions ? picked.sel : auto;
  const setSel = useCallback((s: Sel | null) => setPicked({ regions, sel: s }), [regions]);
  const selected = (sel?.id && regions.find((r) => r.id === sel.id)) || null;
  const pickRegion = useCallback((id: string, key: boolean, from: Sel['from'] = 'list') => setSel({ id, offset: null, from, focus: key }), [setSel]);
  const pickRow = useCallback((row: number, key: boolean) => {
    const r = regions.find((x) => x.kind === 'row' && x.rows[0] === row);
    if (r) pickRegion(r.id, key, 'row');
  }, [regions, pickRegion]);
  const pickByte = useCallback((offset: number) => setSel({ id: regionAt(regions, offset)?.id ?? null, offset, from: 'byte', focus: false }), [regions, setSel]);

  const start = useCallback(async (name: string, read: () => Promise<ArrayBuffer>, referenceUrl?: string) => {
    const mine = ++run.current;
    dispatch({ type: 'load', name });
    try {
      const buf = await read();
      if (mine !== run.current) return;
      dispatch({ type: 'read', bytes: new Uint8Array(buf) });
      const result = await runEngine(buf.slice(0));
      if (mine !== run.current) return;
      dispatch({ type: 'result', result });
      // R-U7: the reference is fetched only after recovery, and only for bundled samples. Its check arrives in T-17.
      if (referenceUrl && result.recovered.status === 'ok') {
        const ok = await fetch(referenceUrl).then((r) => (r.ok ? r.arrayBuffer().then(() => true) : false), () => false);
        if (mine === run.current) dispatch({ type: 'reference', status: ok ? 'loaded' : 'missing' });
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

  const loadSample = useCallback(() => {
    void (async () => {
      try {
        const index = (await (await fetch('/samples/index.json')).json()) as SampleIndex;
        const s = index.samples.find((x) => x.id === index.default) ?? index.samples[0];
        if (!s) throw new Error('No bundled sample was found.');
        await start(`${s.id}.pcx`, async () => {
          const r = await fetch(s.path);
          if (!r.ok) throw new Error('The sample could not be loaded.');
          return r.arrayBuffer();
        }, s.reference);
      } catch (e) {
        dispatch({ type: 'fail', name: 'sample', reason: e instanceof Error ? e.message : 'The sample could not be loaded.' });
      }
    })();
  }, [start]);

  if (hash === 'crash') throw new Error('Demo crash requested with #crash');

  const forcedLoading = state.phase === 'idle' && hash === 'loading';
  const current = state.phase === 'done' ? 4 : state.phase === 'analysing' || forcedLoading ? 1 : 0;
  const fileline =
    state.phase === 'idle' ? 'No file yet, format unknown'
    : state.phase === 'loading' ? `Reading ${state.name}`
    : state.phase === 'failed' ? `${state.name}, could not be opened`
    : state.phase === 'analysing' ? `${state.name}, ${state.bytes.length.toLocaleString('en-US')} bytes, format unknown`
    : `${state.name}, ${state.bytes.length.toLocaleString('en-US')} bytes`;

  const hasSample = state.phase === 'done' && state.reference !== 'none';
  const verifyNote =
    state.phase !== 'done' ? 'Waiting for a recovered image to check.'
    : state.reference === 'loaded' ? 'Reference picture loaded after recovery. The check itself runs in a later step.'
    : state.reference === 'missing' ? 'The reference picture could not be loaded.'
    : hasSample ? 'Waiting for a recovered image to check.'
    : state.result.recovered.status === 'ok' ? 'Your own file has no reference picture, so there is nothing to check against.'
    : 'Nothing was recovered, so there is nothing to check.';

  return (
    <>
      <L0Field />
      <div className="app">
        <header className="topbar">
          <div className="brand">
            <span className="logo" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3.2" fill="currentColor" stroke="none" /></svg>
            </span>
            <div style={{ minWidth: 0 }}>
              <h1>Format Necromancer</h1>
              <p className="fileline">{fileline}</p>
            </div>
          </div>
          <div className="timeline-wrap">
            <ol className="timeline" aria-label="Six steps" style={{ '--p': current / (STEPS.length - 1) } as React.CSSProperties}>
              {STEPS.map((s, i) => (
                <li key={s} data-state={i < current ? 'done' : i === current ? 'current' : 'todo'} aria-current={i === current ? 'step' : undefined}><span>{s}</span></li>
              ))}
            </ol>
            <p className="timeline-now" aria-hidden="true">{STEPS[current]}</p>
          </div>
          <button type="button" className="speed" disabled aria-label="Speed 1x, available once the ritual plays">Speed 1x</button>
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
          <div className="col col-bytes"><BytesPanel state={state} onFile={loadFile} regions={regions} sel={sel} selected={selected} onPickByte={pickByte} />
            <Inspector regions={regions} selected={selected} sel={sel} onPick={pickRegion} />
          </div>
          <ImagePanel state={state} forcedLoading={forcedLoading} onSample={loadSample} onFile={loadFile} regions={regions} selectedId={selected?.id ?? null} cursor={cursor} onCursor={setCursor} onPickRow={pickRow} />
          <L3Evidence region={selected} cursor={cursor} imageHeight={imageHeight} />
          <Hud note={verifyNote} rows={imageHeight} />
        </main>
        <footer className="foot">
          <p className="lock">Runs in your browser. Nothing is uploaded.</p>
          <p>Created by Parth Radheshyam Laturiya. Direction, product decisions and review by the owner; code written by Kiro.</p>
        </footer>
      </div>
      <output hidden data-engine-status={engine}>{engine}</output>
    </>
  );
}
