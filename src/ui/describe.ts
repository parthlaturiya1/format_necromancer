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