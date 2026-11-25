import type { Layout } from '../engine/types';

/** The recovery rule in plain words, built only from the layout facts the engine reported. */
export function describeLayout(l: Layout): string {
  const parts: string[] = [];
  if (l.headerLength !== undefined) parts.push(`a ${l.headerLength}-byte header`);
  if (l.boxNumbers && l.boxNumbers.length >= 2) parts.push(`a picture ${l.boxNumbers[0]} wide and ${l.boxNumbers[1]} tall`);
  if (l.rowStride !== undefined) parts.push(`rows of ${l.rowStride} values`);
  if (l.runMarkerMask !== undefined) parts.push(`repeat runs marked by mask ${l.runMarkerMask}`);
  if (l.tableTailLength) parts.push(`a ${l.tableTailLength}-byte colour table at the end`);
  return parts.length ? `The file holds ${parts.join(', ')}.` : 'The engine named no layout facts.';
}

/** One short line for the headline: only reported facts, at most three. */
export function describeShort(l: Layout): string {
  const parts: string[] = [];
  if (l.headerLength !== undefined) parts.push(`${l.headerLength}-byte header`);
  if (l.boxNumbers && l.boxNumbers.length >= 2) parts.push(`${l.boxNumbers[0]} by ${l.boxNumbers[1]} picture`);
  if (l.runMarkerMask !== undefined) parts.push('repeat runs');
  return parts.length ? `${parts.join(', ')}.` : 'no layout facts named.';
}
const DANGLING = /^(a|an|the|of|to|and|or|in|on|for|with|by|is|as|that|which|gives|give|are|was|from|into|at|then|but)$/i;
/** The rule text cut where a thought ends: at a sentence end, else at a clause end, else at a word with no dangling article or verb (R-4 F10). */
export function shortRule(s: string, max = 110): string {
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const sentence = cut.lastIndexOf('. ');
  if (sentence > 30) return cut.slice(0, sentence + 1);
  const clause = Math.max(cut.lastIndexOf('; '), cut.lastIndexOf(', '), cut.lastIndexOf(' ('));
  if (clause > 40) return `${cut.slice(0, clause).replace(/[,;:\s]+$/, '')}\u2026`;
  const words = cut.replace(/\s+\S*$/, '').split(/\s+/);
  while (words.length > 3 && DANGLING.test(words[words.length - 1]!)) words.pop();
  return `${words.join(' ').replace(/[,;:(]+$/, '')}\u2026`;
}
