'use client';
import { useEffect, useRef } from 'react';
import { L3Evidence } from '../layers/L3Evidence';
import { describeLayout } from '../describe';
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

/** Draws the real recovered RGB. Whole-number scaling, nearest neighbour, backing store sized for DPR (capped at 2). */
function RecoveredCanvas({ width, height, rgb }: { width: number; height: number; rgb: Uint8Array }) {
  const wrap = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const box = wrap.current;
    const canvas = cv.current;
    if (!box || !canvas) return;
    const src = document.createElement('canvas');
    src.width = width;
    src.height = height;
    const sctx = src.getContext('2d');
    if (!sctx) return;
    const img = sctx.createImageData(width, height);
    for (let i = 0, p = 0; i < width * height; i++, p += 4) {
      img.data[p] = rgb[i * 3]!;
      img.data[p + 1] = rgb[i * 3 + 1]!;
      img.data[p + 2] = rgb[i * 3 + 2]!;
      img.data[p + 3] = 255;
    }
    sctx.putImageData(img, 0, 0);

    const paint = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      const k = Math.max(1, Math.min(64, Math.floor(Math.min((box.clientWidth * dpr) / width, (box.clientHeight * dpr) / height))));
      canvas.width = width * k;
      canvas.height = height * k;
      canvas.style.width = `${(width * k) / dpr}px`;
      canvas.style.height = `${(height * k) / dpr}px`;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(src, 0, 0, canvas.width, canvas.height);
    };
    paint();
    const ro = new ResizeObserver(paint);
    ro.observe(box);
    return () => ro.disconnect();
  }, [width, height, rgb]);

  return (
    <div ref={wrap} className="canvas-wrap">
      <canvas ref={cv} className="recovered" role="img" aria-label={`Recovered picture, ${width} by ${height} pixels, rebuilt from the file's bytes`} />
    </div>
  );
}

export function ImagePanel({ state, forcedLoading, onSample, onFile }: { state: AppState; forcedLoading: boolean; onSample: () => void; onFile: (f: File) => void }) {
  const busy = state.phase === 'loading' || state.phase === 'analysing' || forcedLoading;
  const rec = state.phase === 'done' ? state.result.recovered : null;
  const ok = rec && rec.status === 'ok' ? rec : null;
  const analysis = state.phase === 'done' ? state.result.analysis : null;
  const hyp = ok && analysis && analysis.status === 'ok' ? analysis.hypotheses.find((h) => h.id === ok.hypothesisId) : undefined;
  const total = analysis && analysis.status === 'ok' ? analysis.hypotheses.length : 0;
  const view = busy ? 'loading' : ok ? 'done' : state.phase === 'idle' ? 'empty' : 'failed';
  const meta = busy ? 'Reading the file' : ok ? `Recovered ${ok.width} by ${ok.height}` : state.phase === 'idle' ? 'Waiting for a file' : 'Not recovered';
  const noImage = state.phase === 'failed' ? state.reason : rec && rec.status === 'unrecovered' ? rec.reason : '';

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
        <div className="image-stage" data-state={view}>
          {view === 'done' && ok ? (
            <RecoveredCanvas width={ok.width} height={ok.height} rgb={ok.rgb} />
          ) : view === 'loading' ? (
            <>
              <div className="pulse"><Ghost /></div>
              <p className="empty-title" role="status">Reading the bytes<em>.</em></p>
            </>
          ) : view === 'failed' ? (
            <>
              <Ghost />
              <p className="empty-title" role="alert">{state.phase === 'failed' ? 'That file could not be opened' : 'No picture could be rebuilt'}</p>
              <p className="empty-sub">{noImage}</p>
              {buttons}
            </>
          ) : (
            <>
              <Ghost />
              <p className="empty-title">Drop a file nothing can open, or <em>resurrect a sample</em></p>
              <p className="empty-sub">The file is read here, in your browser. The format is worked out from the bytes alone.</p>
              {buttons}
            </>
          )}
        </div>
        {ok ? (
          <p className="hyp">
            <strong>Hypothesis 1 of {total}:</strong> {hyp ? describeLayout(hyp.layout) : 'rule not named by the engine.'}
          </p>
        ) : null}
        <div className="progress">
          <div>
            <span>{ok ? `Rows rebuilt ${ok.height} of ${ok.height}` : 'Rows rebuilt 0 of unknown'}</span>
            <span className="mono">{ok ? '100%' : '0%'}</span>
          </div>
          <div className="bar" role="presentation"><i style={{ '--w': ok ? '100%' : '0%' } as React.CSSProperties} /></div>
        </div>
        <L3Evidence />
      </section>
      <section className="panel panel-inspector" aria-labelledby="h-inspector">
        <h2 id="h-inspector">No region selected</h2>
        <p>Pick bytes or a row to see the region, its rule, its byte range and its confidence.</p>
      </section>
    </div>
  );
}
