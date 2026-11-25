'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Recovered } from '../../engine/recover';
import type { AppState } from '../state';
import { buildIndex, statesFor, type ByteState } from '../hex/intervals';
import { FilePick } from './FilePick';

export const ROW_H = 22; // px, must match --row-h in shell.css
const OVERSCAN = 6;
const PER_ROW = 16;

const hex = (n: number, pad: number) => n.toString(16).toUpperCase().padStart(pad, '0');

// Decorative placeholder bytes, fixed by a seeded generator so server and client render the same text.
const placeholder = (() => {
  let s = 12345;
  return Array.from({ length: 28 }, (_, r) => ({
    off: hex(0x120 + r * 16, 6),
    bytes: Array.from({ length: PER_ROW }, () => hex(((s = (s * 1103515245 + 12345) >>> 0) >>> 16) & 255, 2)),
  }));
})();

/** Evidence ranges to an interval index. A row's status gives the state of every range that row's evidence names. */
export function indexFromRecovered(rec: Recovered | null) {
  if (!rec || rec.status !== 'ok') return [];
  const status = new Map(rec.rows.map((r) => [r.evidenceId, r.status]));
  const code: Record<string, ByteState> = { ok: 2, uncertain: 1, unexplained: 0 };
  const items = rec.evidence.flatMap((e) => e.byteRanges.map((range) => ({ range, state: code[status.get(e.elementId) ?? 'unexplained']! })));
  return buildIndex(items);
}

function HexView({ bytes, rec, name }: { bytes: Uint8Array; rec: Recovered | null; name: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ top: 0, h: 480 });
  const index = useMemo(() => indexFromRecovered(rec), [rec]);
  const raf = useRef(0);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => setView({ top: el.scrollTop, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => { ro.disconnect(); cancelAnimationFrame(raf.current); };
  }, [bytes]);

  const rows = Math.ceil(bytes.length / PER_ROW);
  const first = Math.max(0, Math.floor(view.top / ROW_H) - OVERSCAN);
  const last = Math.min(rows, Math.ceil((view.top + view.h) / ROW_H) + OVERSCAN);
  const shown = [];
  for (let r = first; r < last; r++) {
    const off = r * PER_ROW;
    const end = Math.min(off + PER_ROW, bytes.length);
    const st = statesFor(index, off, end);
    shown.push(
      <div className="hex-row" key={r} style={{ height: ROW_H }}>
        <span className="hex-off">{hex(off, 6)}</span>
        <span className="hex-bytes">
          {st.map((s, i) => <span key={i} className={`b s${s}`}>{hex(bytes[off + i]!, 2)}</span>)}
        </span>
      </div>,
    );
  }

  return (
    <div
      ref={box}
      className="hexv"
      role="region"
      tabIndex={0}
      aria-label={`Bytes of ${name}, ${bytes.length.toLocaleString('en-US')} bytes, 16 per row. Scroll with the arrow keys.`}
      data-rows={rows}
      onScroll={(e) => {
        const top = e.currentTarget.scrollTop;
        cancelAnimationFrame(raf.current);
        raf.current = requestAnimationFrame(() => setView((v) => (v.top === top ? v : { ...v, top })));
      }}
    >
      <div className="hexv-body" style={{ height: rows * ROW_H }}>
        <div className="hexv-win" style={{ transform: `translateY(${first * ROW_H}px)` }}>{shown}</div>
      </div>
    </div>
  );
}

export function BytesPanel({ state, onFile }: { state: AppState; onFile: (f: File) => void }) {
  const bytes = state.phase === 'analysing' || state.phase === 'done' ? state.bytes : null;
  const rec = state.phase === 'done' ? state.result.recovered : null;
  const label =
    bytes ? `${bytes.length.toLocaleString('en-US')} bytes` :
    state.phase === 'loading' ? 'Reading the file' :
    state.phase === 'failed' ? 'Nothing was read' : 'Dead file, nothing read yet';
  return (
    <section className="panel panel-l1" aria-labelledby="h-bytes" data-layer="L1">
      <header>
        <h2 id="h-bytes">Bytes</h2>
        <p className="meta">{label}</p>
        <FilePick label="Choose file" className="btn ghost-btn btn-sm" onFile={onFile} testId="bytes-file-input" />
      </header>
      {bytes ? (
        <HexView bytes={bytes} rec={rec} name={state.phase === 'analysing' || state.phase === 'done' ? state.name : 'file'} />
      ) : (
        <>
          <div className="hex hex-idle" aria-hidden="true">
            {placeholder.map((r) => (
              <div className="hex-row" key={r.off}>
                <span className="hex-off">{r.off}</span>
                <span className="hex-bytes">{r.bytes.map((b, i) => <span className="b s0" key={i}>{b}</span>)}</span>
              </div>
            ))}
          </div>
          <p className="drop-hint">Drop a file on this panel, or choose one. Files up to 10 MB. Nothing is uploaded.</p>
        </>
      )}
      <ul className="legend" aria-label="Legend">
        <li style={{ '--dot': 'var(--accent)' } as React.CSSProperties}><i />Explained</li>
        <li style={{ '--dot': 'var(--uncertain)' } as React.CSSProperties}><i />Uncertain</li>
        <li style={{ '--dot': 'var(--byte-idle)' } as React.CSSProperties}><i />Unexplained</li>
      </ul>
    </section>
  );
}
