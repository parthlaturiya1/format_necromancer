import { analyze } from './analyze';
import { defaultConfig, type EngineConfig } from './config';
import { recover, type Recovered } from './recover';
import type { AnalysisResult } from './types';

export type PipelineResult = { analysis: AnalysisResult; recovered: Recovered };

/**
 * Guard -> analyze -> recover. No reference is in scope here (R-R8); comparing with one is the verifier's job (T-09).
 * Never throws: every step returns unrecovered with a reason.
 */
export function runPipeline(bytes: Uint8Array, config: EngineConfig = defaultConfig): PipelineResult {
  const stop = (reason: string): PipelineResult => ({ analysis: { status: 'unrecovered', reason }, recovered: { status: 'unrecovered', reason } });
  if (!(bytes instanceof Uint8Array)) return stop('The input is not a byte array.');
  if (bytes.length === 0) return stop('The input is empty.');
  if (bytes.length < config.minInputBytes) return stop(`The input has ${bytes.length} bytes, fewer than the ${config.minInputBytes} needed to look for a layout.`);
  if (bytes.length > config.maxInputBytes) return stop(`The input has ${bytes.length} bytes, more than the ${config.maxInputBytes} byte limit.`);
  const analysis = analyze(bytes, config);
  return { analysis, recovered: recover(bytes, analysis, config) };
}
