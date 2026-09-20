import type { SpeechMetrics, StageTimings } from '@/features/api/contracts';

/**
 * The most recent analyze call's measured stage timings, for the Under the
 * hood tab. In-memory: these describe one run, not a history.
 */
export type LastRunTimings = {
  timings: StageTimings;
  durationS: number;
  wordCount: number;
  /** `tts` is absent from timings when this was false; the stage is hidden. */
  spoke: boolean;
  at: number;
};

let current: LastRunTimings | null = null;

export function recordTimings(
  timings: StageTimings,
  metrics: SpeechMetrics,
  spoke: boolean,
): void {
  current = {
    timings,
    durationS: metrics.duration_s,
    wordCount: metrics.word_count,
    spoke,
    at: Date.now(),
  };
}

export function lastRunTimings(): LastRunTimings | null {
  return current;
}

/** Sum of the measured stages. Server time only — excludes upload and download. */
export function serverTimeMs(timings: StageTimings): number {
  return Object.values(timings).reduce((total, ms) => total + (ms ?? 0), 0);
}
