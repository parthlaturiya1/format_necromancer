'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { AppState } from '../state';
import { statesFor } from '../hex/intervals';
import { indexFromRegions, type Region } from '../regions';
import type { Sel } from '../selection';
import type { ByteRange } from '../../engine/types';
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
/** beat: ritual beat on screen (0 = none). Bytes are grey until beat 4. hover: a hypothesis card's ranges. */
type Ritual = { beat: number; hover: ReadonlyArray<ByteRange> | null };

function HexView({ bytes, name, regions, sel, selected, onPickByte, beat, hover }: Pick & Ritual & { bytes: Uint8Array; name: string }) {
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

  // Hovering a hypothesis card brings its first range into view.
  useEffect(() => {
    const q = hover?.[0];
    const el = box.current;
    if (q && el) el.scrollTop = Math.max(0, (q.start / PER_ROW) * ROW_H - ROW_H);
  }, [hover]);

  const dim = beat > 0 && beat < 4;
  const lit = (o: number) => (hover ? hover.some((q) => o >= q.start && o < q.end) : !dim && (selected?.ranges.some((q) => o >= q.start && o < q.end) ?? false));
  const rows = Math.ceil(bytes.length / PER_ROW);
  const first = Math.max(0, Math.floor(view.top / ROW_H) - OVERSCAN);
  const last = Math.min(rows, Math.ceil((view.top + view.h) / ROW_H) + OVERSCAN);
  const shown = [];
  for (let r = first; r < last; r++) {
    const off = r * PER_ROW;
    const end = Math.min(off + PER_ROW, bytes.length);
    const st = dim ? statesFor(index, off, end).map(() => 0 as const) : statesFor(index, off, end);
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
    <div className="hexwrap">
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
    {beat === 2 ? <div className="scan" aria-hidden="true" /> : null}
    </div>
  );
}

export type SampleOpt = { id: string; label?: string };

export function BytesPanel({ state, onFile, samples, onSample, failed, beat, hover, ...pick }: Pick & Ritual & { state: AppState; onFile: (f: File) => void; samples: SampleOpt[]; onSample: (id: string) => void; failed: boolean }) {
  const blind = samples.find((s) => s.id.startsWith('blind-'));
  const bytes = state.phase === 'analysing' || state.phase === 'done' ? state.bytes : null;
  const label =
    bytes ? `${bytes.length.toLocaleString('en-US')} bytes` :
    state.phase === 'loading' ? 'Reading the file' :
    state.phase === 'failed' ? 'Nothing was read' : 'Dead file, nothing read yet';
  return (
    <section className="panel panel-l1" aria-labelledby="h-bytes" data-layer="L1" data-failed={failed ? '' : undefined}>
      <header>
        <h2 id="h-bytes">Bytes</h2>
        <p className="meta">{label}</p>
        <FilePick label="Choose file" className="btn ghost-btn btn-sm" onFile={onFile} testId="bytes-file-input" />
      </header>
      {samples.length > 1 ? (
        <div className="sample-row">
          <label className="sample-pick">
            <span>Try a sample</span>
            <select data-testid="sample-pick" aria-label="Try a sample" value="" onChange={(e) => e.target.value && onSample(e.target.value)}>
              <option value="">Choose a sample</option>
              {samples.map((s) => <option key={s.id} value={s.id}>{s.label ? `${s.id} (${s.label})` : s.id}</option>)}
            </select>
          </label>
          {blind ? <button type="button" className="btn ghost-btn btn-sm" data-testid="load-blind" onClick={() => onSample(blind.id)}>Load the blind test</button> : null}
        </div>
      ) : null}
      {bytes ? (
        <HexView bytes={bytes} beat={beat} hover={hover} {...pick} name={state.phase === 'analysing' || state.phase === 'done' ? state.name : 'file'} />
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
