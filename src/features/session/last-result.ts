import type { SpeechAnalysisResponse } from '@/features/api/contracts';

/**
 * Results move between screens through this module, not route params — the
 * payload is far too large for a URL.
 *
 * In-memory only. History is the durable copy and it lives on the server.
 */
export type LastRun = {
  response: SpeechAnalysisResponse;
  context: string | null;
  /** The newest review id seen before this run, for the storage check. */
  previousReviewId: string | null;
  receivedAt: number;
};

let lastRun: LastRun | null = null;

export const lastResult = {
  set(run: LastRun) {
    lastRun = run;
  },
  get(): LastRun | null {
    return lastRun;
  },
  clear() {
    lastRun = null;
  },
};
