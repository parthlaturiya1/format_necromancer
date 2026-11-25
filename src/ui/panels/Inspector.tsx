'use client';
import { useEffect, useRef } from 'react';
import { announce, hex, rangeText, ruleName, type Region } from '../regions';
import type { Sel } from '../selection';

const STATUS = { ok: 'confident', uncertain: 'uncertain', unexplained: 'unexplained' } as const;

const RULE_MAX = 90;
/** One line: the engine's rule text cut at a word, with the rest behind "Show the full rule" (R-3 F2). */
const short = (s: string) => (s.length <= RULE_MAX ? s : `${s.slice(0, RULE_MAX).replace(/\s+\S*$/, '')}…`);

/** The region card (F-07). Shows the picked region, or says which bytes nothing explains. */
export function Inspector({ regions, selected, sel, onPick }: { regions: Region[]; selected: Region | null; sel: Sel | null; onPick: (id: string, key: boolean) => void }) {
  const card = useRef<HTMLElement>(null);
  useEffect(() => {
    if (sel?.focus) card.current?.focus();
  }, [sel]);

  const analysis = regions.filter((r) => r.kind === 'analysis');
  const said = selected ? announce(selected) : sel && sel.offset !== null ? `Unexplained bytes at offset ${hex(sel.offset)}` : '';
  const rowsText = !selected ? '' : selected.rows.length ? 'Drawn as this picture row' : selected.umbrella ? 'All rows' : 'Part of the layout, not one row';

  return (
    <section ref={card} className="panel panel-inspector" aria-labelledby="h-inspector" tabIndex={-1} data-testid="inspector">
      {selected ? (
        <>
          <h2 id="h-inspector">{selected.label}</h2>
          {selected.kind === 'row' ? null : <p className="insp-rows">{rowsText}</p>}
          <p className="insp-rule"><strong>Rule: {ruleName(selected)}.</strong> {short(selected.rule)}</p>
          {selected.rule.length > RULE_MAX ? (
            <details className="insp-full">
              <summary>Show the full rule</summary>
              <p>{selected.rule}</p>
            </details>
          ) : null}
          <p className="insp-bytes mono" data-status={selected.status}>
            <span>Bytes {selected.ranges.map(rangeText).join(', and ')}.</span>{' '}
            <span className="pill" data-status={selected.status}>Confidence {selected.confidence.toFixed(2)}, {STATUS[selected.status]}</span>
          </p>
        </>
      ) : sel && sel.offset !== null ? (
        <>
          <h2 id="h-inspector">Unexplained bytes</h2>
          <p className="insp-rule">No rule explains the byte at offset <span className="mono">{hex(sel.offset)}</span>.</p>
        </>
      ) : (
        <>
          <h2 id="h-inspector">No region selected</h2>
          <p>Pick bytes or a row to see the region, its rule, its byte range and its confidence.</p>
        </>
      )}
      {analysis.length ? (
        <ul className="region-list" aria-label="Layout regions">
          {analysis.map((r) => (
            <li key={r.id}>
              <button type="button" className="chip" aria-pressed={selected?.id === r.id} onClick={(e) => onPick(r.id, e.detail === 0)}>{r.label}</button>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="sr-only" role="status" aria-live="polite" data-testid="announce">{said}</p>
    </section>
  );
}
