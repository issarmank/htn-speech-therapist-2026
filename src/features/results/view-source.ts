import type {
  CoachFeedback,
  SpeechAnalysisResponse,
  SpeechMetrics,
  SpeechReview,
} from '@/features/api/contracts';

/**
 * Results render from two places: a run that just finished, and a row pulled
 * back out of history. Both carry the same metrics and feedback; they differ
 * only in which audio is available.
 */
export type ResultView = {
  transcript: string;
  metrics: SpeechMetrics;
  feedback: CoachFeedback;
  contextValue: string | null;
  /** Coach cue as base64 mp3. Fresh runs with speak=true only. */
  cueBase64: string | null;
  /** Presigned S3 URL for the original recording. History rows only. */
  clipUrl: string | null;
  createdAt: string | null;
  fresh: boolean;
};

export function fromAnalysis(
  response: SpeechAnalysisResponse,
  contextValue: string | null,
): ResultView {
  return {
    transcript: response.transcript,
    metrics: response.metrics,
    feedback: response.feedback,
    contextValue,
    cueBase64: response.audio_base64,
    // /analyze returns no S3 URL — the key is only learned later via /reviews.
    clipUrl: null,
    createdAt: null,
    fresh: true,
  };
}

export function fromReview(review: SpeechReview): ResultView {
  return {
    transcript: review.transcript,
    metrics: review.metrics,
    feedback: review.feedback,
    contextValue: review.context,
    // The cue mp3 is never stored; it cannot be recovered without re-analyzing.
    cueBase64: null,
    clipUrl: review.audio_url ?? null,
    createdAt: review.created_at,
    fresh: false,
  };
}

/** Set by the History tab before pushing the results modal. */
let selected: ResultView | null = null;

export const selectedReview = {
  set(view: ResultView) {
    selected = view;
  },
  take(): ResultView | null {
    const value = selected;
    selected = null;
    return value;
  },
};
