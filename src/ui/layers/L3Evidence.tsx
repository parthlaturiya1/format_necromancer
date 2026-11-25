'use client';
import { useEffect, useRef, useState } from 'react';
import { ROW_H } from '../panels/BytesPanel';
import type { Region } from '../regions';

const PER_ROW = 16;
const PHONE = '(max-width: 759.98px)';

type Box = { x: number; y: number; w: number; h: number };
type Geo = { rows: Box[]; cursor: Box | null; line: { d: string; x0: number; y0: number; x1: number; y1: number } | null };

/** Pixel geometry of the picked region, measured from the DOM relative to the stage. Null parts are not on screen. */
function measure(stage: HTMLElement, region: Region | null, cursor: number | null, imageHeight: number): Geo {
  const st = stage.getBoundingClientRect();
  const cv = stage.querySelector('canvas.recovered')?.getBoundingClientRect();
  const hexv = stage.querySelector('.hexv');
  const rowBox = (r: number): Box | null =>
    cv && cv.height > 0 ? { x: cv.left - st.left, y: cv.top - st.top + (r * cv.height) / imageHeight, w: cv.width, h: cv.height / imageHeight } : null;
  const rows = region ? region.rows.map(rowBox).filter((b): b is Box => b !== null) : [];
  const cur = cursor === null || region?.rows[0] === cursor ? null : rowBox(cursor);
  let line: Geo['line'] = null;
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
      const x1 = t.x;
      const y1 = t.y + t.h / 2;
      const dx = Math.max(24, (x1 - x0) / 2);
      line = { d: `M${x0},${y0} C${x0 + dx},${y0} ${x1 - dx},${y1} ${x1},${y1}`, x0, y0, x1, y1 };
    }
  }
  return { rows, cursor: cur, line };
}

/**
 * L3: SVG over the stage. Outlines the picked row on the picture, and (not on a phone) draws one curve from the
 * picked byte range to it. Follows scroll and resize, one measure per animation frame.
 */
export function L3Evidence({ region, cursor, imageHeight }: { region: Region | null; cursor: number | null; imageHeight: number }) {
  const svg = useRef<SVGSVGElement>(null);
  const [geo, setGeo] = useState<Geo>({ rows: [], cursor: null, line: null });

  useEffect(() => {
    const stage = svg.current?.parentElement;
    if (!stage) return;
    let raf = 0;
    const run = () => {
      raf = 0;
      setGeo(measure(stage, region, cursor, imageHeight));
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
  }, [region, cursor, imageHeight]);

  const tone = region && region.status === 'ok' ? 'ok' : 'warn';
  return (
    <svg ref={svg} className="l3" aria-hidden="true" data-layer="L3" focusable="false" data-tone={tone}>
      {geo.rows.map((b, i) => <rect key={i} className="l3-row" x={b.x} y={b.y} width={b.w} height={Math.max(b.h, 3)} rx="1.5" />)}
      {geo.cursor ? <rect className="l3-cursor" x={geo.cursor.x - 2} y={geo.cursor.y - 1} width={geo.cursor.w + 4} height={Math.max(geo.cursor.h, 3) + 2} rx="2" /> : null}
      {geo.line && region ? (
        <g key={region.id} data-testid="evidence-line" data-d={geo.line.d}>
          <path className="l3-glow" d={geo.line.d} pathLength={1} />
          <path className="l3-line" d={geo.line.d} pathLength={1} />
          <circle className="l3-dot" cx={geo.line.x0} cy={geo.line.y0} r="3" />
          <circle className="l3-dot" cx={geo.line.x1} cy={geo.line.y1} r="3" />
        </g>
      ) : null}
    </svg>
  );
}
