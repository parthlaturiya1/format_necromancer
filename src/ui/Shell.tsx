'use client';
import { useEffect, useState } from 'react';
import { L0Field } from './layers/L0Field';
import { BytesPanel } from './panels/BytesPanel';
import { ImagePanel, type ViewState } from './panels/ImagePanel';
import { Hud } from './hud/Hud';
import { probeEngine, type EngineStatus } from './worker/client';

const STEPS = ['Dead file', 'Listening', 'Hypotheses', 'Evidence', 'Resurrection', 'Proof'];

type Hash = ViewState | 'crash';
// Dev hooks so every state is reachable: #loading, #crash (shows error.tsx). Default is the empty state.
const readHash = (): Hash => {
  const h = window.location.hash.slice(1);
  return h === 'loading' || h === 'crash' ? h : 'empty';
};

export function Shell() {
  const [view, setView] = useState<Hash>('empty');
  const [engine, setEngine] = useState<EngineStatus>('starting');

  useEffect(() => {
    const sync = () => setView(readHash());
    sync();
    window.addEventListener('hashchange', sync);
    let live = true;
    void probeEngine().then((s) => live && setEngine(s));
    return () => { live = false; window.removeEventListener('hashchange', sync); };
  }, []);

  if (view === 'crash') throw new Error('Demo crash requested with #crash');

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
              <p className="fileline">No file yet, format unknown</p>
            </div>
          </div>
          <ol className="timeline" aria-label="Six steps">
            {STEPS.map((s) => <li key={s}><span>{s}</span></li>)}
          </ol>
          <button type="button" className="speed" disabled aria-label="Speed 1x, available once a file is loaded">Speed 1x</button>
        </header>
        <main className="stage">
          <div className="col"><BytesPanel label="Dead file, nothing read yet" /></div>
          <ImagePanel view={view} />
          <Hud />
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
