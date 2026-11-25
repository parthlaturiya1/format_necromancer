import { L3Evidence } from '../layers/L3Evidence';

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

export type ViewState = 'empty' | 'loading';

export function ImagePanel({ view }: { view: ViewState }) {
  const loading = view === 'loading';
  return (
    <div className="col col-image">
      <section className="panel panel-l2 stage-wrap" aria-labelledby="h-image" data-layer="L2">
        <header>
          <h2 id="h-image">Recovered image</h2>
          <p className={`meta${loading ? ' live' : ''}`}>{loading ? 'Reading the file' : 'Waiting for a file'}</p>
        </header>
        <div className="image-stage" data-state={view}>
          <div className={loading ? 'pulse' : undefined}><Ghost /></div>
          {loading ? (
            <p className="empty-title" role="status">Reading the bytes<em>.</em></p>
          ) : (
            <>
              <p className="empty-title">Drop a file nothing can open, or <em>resurrect a sample</em></p>
              <p className="empty-sub">The file is read here, in your browser. The format is worked out from the bytes alone.</p>
            </>
          )}
        </div>
        <div className="progress">
          <div><span>Rows rebuilt 0 of unknown</span><span className="mono">0%</span></div>
          <div className="bar" role="presentation"><i /></div>
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
