'use client';
import { useEffect, useRef, useState } from 'react';
import { ROW_H } from '../panels/BytesPanel';
import type { Region } from '../regions';

const PER_ROW = 16;
const PHONE = '(max-width: 759.98px)';
const CAP_INSET = 8; // the curve ends this far inside the row's left edge (R-3 F1)

type Box = { x: number; y: number; w: number; h: number };
type Line = { d: string; x0: number; y0: number; x1: number; y1: number };
type Geo = { rows: Box[]; cursor: Box | null; line: Line | null };
/** main: the picked region. alt: one of the other status, so a confident and an uncertain line can sit together. trail: the few lines of the ritual. */
export type Draw = { region: Region; role: 'main' | 'alt' | 'trail' };

/** Pixel geometry of one region, measured from the DOM relative to the stage. Null parts are not on screen. */
function measure(stage: HTMLElement, region: Region | null, cursor: number | null, imageHeight: number): Geo {
  const st = stage.getBoundingClientRect();
  const cv = stage.querySelector('canvas.recovered')?.getBoundingClientRect();
  const hexv = stage.querySelector('.hexv');
  const rowBox = (r: number): Box | null =>
    cv && cv.height > 0 ? { x: cv.left - st.left, y: cv.top - st.top + (r * cv.height) / imageHeight, w: cv.width, h: cv.height / imageHeight } : null;
  const rows = region ? region.rows.map(rowBox).filter((b): b is Box => b !== null) : [];
  const cur = cursor === null || region?.rows[0] === cursor ? null : rowBox(cursor);
  let line: Line | null = null;
  const q = region?.ranges[0];
  if (region && q && rows.length && hexv && !window.matchMedia(PHONE).matches) {
    const hr = hexv.getBoundingClientRect();
    const l0 = Math.floor(q.start / PER_ROW);
    const l1 = Math.floor((q.end - 1) / PER_ROW);
    const top = hr.top + ((l0 + l1 + 1) / 2) * ROW_H - hexv.scrollTop;
    if (top > hr.top && top < hr.bottom) {
      const last = l0 === l1 ? hexv.querySelector(`[data-o="${q.end - 1}"]`) : hexv.querySelector('.hex-bytes');
      const x0 = (last ? last.getBoundingClientRect().right : hr.right - 8) - st.left + 4;
      const y0 = top - st.top;
      const t = rows[0]!;
      const x1 = t.x + CAP_INSET;
      const y1 = t.y + t.h / 2;
      const dx = Math.max(24, (x1 - x0) / 2);
      line = { d: `M${x0},${y0} C${x0 + dx},${y0} ${x1 - dx},${y1} ${x1},${y1}`, x0, y0, x1, y1 };
    }
  }
  return { rows, cursor: cur, line };
}

/**
 * L3: SVG over the stage. Outlines each drawn row on the picture, and (not on a phone) draws one curve per region
 * from its byte range to the row. Follows scroll and resize, one measure per animation frame.
 */
export function L3Evidence({ draws, cursor, imageHeight }: { draws: Draw[]; cursor: number | null; imageHeight: number }) {
  const svg = useRef<SVGSVGElement>(null);
  const [geos, setGeos] = useState<Geo[]>([]);

  useEffect(() => {
    const stage = svg.current?.parentElement;
    if (!stage) return;
    let raf = 0;
    const run = () => {
      raf = 0;
      setGeos(draws.length ? draws.map((d, i) => measure(stage, d.region, i === 0 ? cursor : null, imageHeight)) : [measure(stage, null, cursor, imageHeight)]);
    };
    const soon = () => {
      if (!raf) raf = requestAnimationFrame(run);
    };
    soon();
    const ro = new ResizeObserver(soon);
    ro.observe(stage);
    stage.querySelectorAll('.hexv, canvas.recovered').forEach((el) => ro.observe(el));
    stage.addEventListener('scroll', soon, true);
    window.addEventListener('resize', soon);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      stage.removeEventListener('scroll', soon, true);
      window.removeEventListener('resize', soon);
    };
  }, [draws, cursor, imageHeight]);

  return (
    <svg ref={svg} className="l3" aria-hidden="true" data-layer="L3" focusable="false">
      {geos.map((g, i) => {
        const d = draws[i];
        const tone = d && d.region.status === 'ok' ? 'ok' : 'warn';
        const sfx = !d || d.role === 'main' ? '' : '-x';
        const delay = { animationDelay: `calc(${i * 220}ms / var(--speed, 1))` };
        return (
          <g key={d ? `${d.region.id}-${d.role}` : 'none'} data-tone={tone} className="l3-g">
            {g.rows.map((b, j) => <rect key={j} className={`l3-row${sfx}`} x={b.x} y={b.y - 3} width={b.w} height={Math.max(b.h, 3) + 6} rx="3" style={delay} />)}
            {g.cursor ? <rect className="l3-cursor" x={g.cursor.x - 2} y={g.cursor.y - 1} width={g.cursor.w + 4} height={Math.max(g.cursor.h, 3) + 2} rx="2" /> : null}
            {g.line && d ? (
              <g data-testid={d.role === 'main' ? 'evidence-line' : 'evidence-line-alt'} data-d={g.line.d}>
                <defs>
                  <linearGradient id={`lg-${i}`} gradientUnits="userSpaceOnUse" x1={g.line.x0} y1="0" x2={g.line.x1 + 1} y2="0">
                    <stop offset="0" stopColor="var(--tone)" />
                    <stop offset="1" stopColor="var(--tone)" stopOpacity="0.7" />
                  </linearGradient>
                </defs>
                <path className={`l3-glow${sfx}`} d={g.line.d} pathLength={1} style={delay} />
                <path className={`l3-line${sfx}`} d={g.line.d} pathLength={1} stroke={`url(#lg-${i})`} style={delay} />
                <circle className="l3-halo" cx={g.line.x0} cy={g.line.y0} r="6" style={delay} />
                <circle className="l3-halo" cx={g.line.x1} cy={g.line.y1} r="6" style={delay} />
                <circle className="l3-dot" cx={g.line.x0} cy={g.line.y0} r="3" style={delay} />
                <circle className="l3-dot" cx={g.line.x1} cy={g.line.y1} r="3" style={delay} />
              </g>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}
