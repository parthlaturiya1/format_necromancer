const DOTS = 14 * 9;

/** L4 HUD: Confidence grid, Confidence by row, Verification. Glass skeletons until T-17. */
export function Hud() {
  return (
    <div className="col col-hud" data-layer="L4">
      <section className="panel" aria-labelledby="h-grid">
        <header>
          <h2 id="h-grid">Confidence grid</h2>
          <p className="meta">0 regions</p>
        </header>
        <div className="dots" aria-hidden="true">
          {Array.from({ length: DOTS }, (_, i) => <i key={i} />)}
        </div>
        <p className="hint">Each dot is one region. Hover to inspect.</p>
      </section>
      <section className="panel" aria-labelledby="h-rows">
        <header>
          <h2 id="h-rows">Confidence by row</h2>
          <p className="meta mono">no data</p>
        </header>
        <svg className="chart" viewBox="0 0 220 84" role="img" aria-label="Chart of confidence by row. Empty until a file is recovered.">
          <line x1="24" x2="216" y1="8" y2="8" />
          <line x1="24" x2="216" y1="38" y2="38" />
          <line x1="24" x2="216" y1="68" y2="68" />
          <line className="flat" x1="24" x2="216" y1="68" y2="68" />
          <text x="0" y="11">1.0</text>
          <text x="0" y="41">0.5</text>
          <text x="0" y="71">0</text>
          <text x="24" y="82">Row 1</text>
        </svg>
      </section>
      <section className="panel verify" aria-labelledby="h-verify">
        <header><h2 id="h-verify">Verification</h2></header>
        <p className="hint">Waiting for a recovered image to check.</p>
        <p className="big-num">0<small>mismatches so far</small></p>
        <div className="progress">
          <div><span>Rows checked 0 of unknown</span></div>
          <div className="bar" role="presentation"><i /></div>
        </div>
      </section>
    </div>
  );
}
