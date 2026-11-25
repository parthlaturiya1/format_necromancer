// Decorative placeholder bytes, fixed by a seeded generator so server and client render the same text.
const ROWS = 28;
const hex = (n: number, pad: number) => n.toString(16).toUpperCase().padStart(pad, '0');
const rows = (() => {
  let s = 12345;
  return Array.from({ length: ROWS }, (_, r) => ({
    off: hex(0x120 + r * 16, 6),
    bytes: Array.from({ length: 16 }, () => hex(((s = (s * 1103515245 + 12345) >>> 0) >>> 16) & 255, 2)),
  }));
})();

export function BytesPanel({ label }: { label: string }) {
  return (
    <section className="panel panel-l1" aria-labelledby="h-bytes" data-layer="L1">
      <header>
        <h2 id="h-bytes">Bytes</h2>
        <p className="meta">{label}</p>
      </header>
      <div className="hex" aria-hidden="true">
        {rows.map((r) => (
          <div className="hex-row" key={r.off}>
            <span className="hex-off">{r.off}</span>
            <span className="hex-bytes">{r.bytes.map((b, i) => <span key={i}>{b}</span>)}</span>
          </div>
        ))}
      </div>
      <p className="sr-only">Bytes appear here once a file is loaded. The grid shown is a placeholder.</p>
      <ul className="legend" aria-label="Legend">
        <li style={{ '--dot': 'var(--accent)' } as React.CSSProperties}><i />Explained</li>
        <li style={{ '--dot': 'var(--uncertain)' } as React.CSSProperties}><i />Uncertain</li>
        <li style={{ '--dot': 'var(--unexplained)' } as React.CSSProperties}><i />Unexplained</li>
      </ul>
    </section>
  );
}
