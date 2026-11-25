'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { AppState } from '../state';
import { statesFor } from '../hex/intervals';
import { indexFromRegions, type Region } from '../regions';
import type { Sel } from '../selection';
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

type Pick = { regions: Region[]; sel: Sel | null; selected: Region | null; onPickByte: (offset: number) => void };

function HexView({ bytes, name, regions, sel, selected, onPickByte }: Pick & { bytes: Uint8Array; name: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ top: 0, h: 480 });
  const index = useMemo(() => indexFromRegions(regions), [regions]);
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

  // Selecting a row or a region scrolls the bytes it uses into the middle. A byte click does not move the view.
  useEffect(() => {
    const q = selected?.ranges[0];
    const el = box.current;
    if (!sel || sel.from === 'byte' || !q || !el) return;
    el.scrollTop = Math.max(0, ((q.start + q.end - 1) / 2 / PER_ROW) * ROW_H - el.clientHeight / 2);
  }, [sel, selected]);

  const lit = (o: number) => selected?.ranges.some((q) => o >= q.start && o < q.end) ?? false;
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
          {st.map((s, i) => <span key={i} data-o={off + i} className={`b s${s}${lit(off + i) ? ' sel' : ''}${sel?.offset === off + i ? ' cur' : ''}`}>{hex(bytes[off + i]!, 2)}</span>)}
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
      onClick={(e) => {
        const o = (e.target as HTMLElement).closest('[data-o]')?.getAttribute('data-o');
        if (o) onPickByte(Number(o));
      }}
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

export function BytesPanel({ state, onFile, ...pick }: Pick & { state: AppState; onFile: (f: File) => void }) {
  const bytes = state.phase === 'analysing' || state.phase === 'done' ? state.bytes : null;
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
        <HexView bytes={bytes} {...pick} name={state.phase === 'analysing' || state.phase === 'done' ? state.name : 'file'} />
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
