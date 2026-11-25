const DOTS = 14 * 5;
// Empty state: a few rings pulse in turn so the grid looks alive. Opacity only.
const PULSING = new Set([6, 21, 38, 52]);

/** L4 HUD: Confidence grid, Confidence by row, Verification. Glass skeletons until T-17. */
export type GridLight = { mode: 'off' } | { mode: 'play'; ms: number } | { mode: 'part'; share: number } | { mode: 'on' };
/** status: the engine's status for each recovered row (null when nothing is recovered). The dots light in sequence in beat 5. */
export function Hud({ note, rows, status, light }: { note: string; rows: number; status: string[] | null; light: GridLight }) {
  const real = status && status.length > 0 ? status : null;
  return (
    <div className="col col-hud" data-layer="L4">
      <section className="panel" aria-labelledby="h-grid">
        <header>
          <h2 id="h-grid">Confidence grid</h2>
          <p className="meta">{rows ? `${rows} rows` : 'Waiting for a file'}</p>
        </header>
        {real ? (
          <div className="dots" role="img" aria-label={`Confidence grid, ${real.length} rows. ${real.filter((s) => s === 'ok').length} confident, ${real.filter((s) => s === 'uncertain').length} uncertain, ${real.filter((s) => s === 'unexplained').length} unexplained.`} data-light={light.mode}>
            {real.map((s, i) => <i key={i} data-s={s} className={light.mode === 'off' || (light.mode === 'part' && i >= light.share * real.length) ? 'dark' : 'lit'} style={light.mode === 'play' ? ({ '--d': `${(i / real.length) * light.ms}ms` } as React.CSSProperties) : undefined} />)}
          </div>
        ) : (
          <div className="dots" aria-hidden="true">
            {Array.from({ length: DOTS }, (_, i) => <i key={i} className={PULSING.has(i) ? 'pulse' : undefined} style={PULSING.has(i) ? { animationDelay: `${[...PULSING].indexOf(i) * 120}ms` } : undefined} />)}
          </div>
        )}
        <p className="hint">Each dot is one region. Hover to inspect.</p>
      </section>
      <section className="panel" aria-labelledby="h-rows">
        <header>
          <h2 id="h-rows">Confidence by row</h2>
          <p className="meta mono">no data</p>
        </header>
        <svg className="chart" viewBox="0 0 200 84" role="img" aria-label="Chart of confidence by row. Empty until a file is recovered.">
          <line x1="24" x2="196" y1="8" y2="8" />
          <line x1="24" x2="196" y1="38" y2="38" />
          <line x1="24" x2="196" y1="68" y2="68" />
          <text x="0" y="12">1.0</text>
          <text x="0" y="42">0.5</text>
          <text x="0" y="72">0</text>
        </svg>
        <p className="hint">{real ? 'The row chart fills in at the Proof step.' : 'Appears after Resurrection.'}</p>
      </section>
      <section className="panel verify" aria-labelledby="h-verify">
        <header><h2 id="h-verify">Verification</h2></header>
        <p className="hint">{note}</p>
      </section>
    </div>
  );
}
