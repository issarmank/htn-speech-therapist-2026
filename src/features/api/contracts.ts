/**
 * Types for the backend at ../htn-speech-therapist-2026-backend.
 *
 * Mirrors speech/schemas.py and routes/schemas.py. `npm run check:api` diffs
 * the live OpenAPI document against these.
 */

/* ---------------------------------------------------------------- auth ---- */

export type AuthUser = { id: string; email: string; is_active: boolean };

export type TokenResponse = { access_token: string; token_type: string };

/* -------------------------------------------------------------- speech ---- */

export type PrimaryFocus =
  | 'fillers'
  | 'pacing'
  | 'pauses'
  | 'repetition'
  | 'sentence_length'
  | 'confidence';

export type FillerHit = { text: string; start: number | null };

export type PauseHit = { after_word: string; start: number; duration: number };

export type SpeechMetrics = {
  duration_s: number;
  word_count: number;
  /** null when fewer than 2 timed words or duration < 1 s. Never render 0. */
  wpm: number | null;
  articulation_rate: number | null;
  speech_ratio: number | null;
  hard_fillers: FillerHit[];
  soft_fillers: FillerHit[];
  long_pauses: PauseHit[];
  mid_pauses: number;
  repetitions: string[];
  longest_fluent_run_s: number | null;
  avg_words_per_sentence: number | null;
  audio_events: string[];
};

export type Observation = {
  pattern: string;
  evidence: string;
  why_it_matters: string;
};

export type CoachFeedback = {
  encouragement: string;
  primary_focus: PrimaryFocus;
  coaching_cue: string;
  observations: Observation[];
  try_this_next: string;
};

export type StageTimings = {
  stt?: number;
  metrics?: number;
  coach?: number;
  /** Present only when the request used ?speak=true. */
  tts?: number;
};

export type SpeechAnalysisResponse = {
  transcript: string;
  metrics: SpeechMetrics;
  feedback: CoachFeedback;
  /** base64 mp3. Only when ?speak=true and TTS succeeded. */
  audio_base64: string | null;
  timings_ms: StageTimings;
};

/* ------------------------------------------------------------- history ---- */

/** database/models.py:25-43 — the S3 pointer kept in Mongo. */
export type AudioRef = {
  bucket: string;
  key: string;
  content_type: string;
  size_bytes: number;
  duration_s: number | null;
};

/**
 * One row of GET /api/v1/speech/reviews.
 *
 * The route declares no `response_model`, so this shape is not in the OpenAPI
 * document and drift here can only surface at runtime.
 */
export type SpeechReview = {
  _id: string;
  user_id: string;
  transcript: string;
  metrics: SpeechMetrics;
  feedback: CoachFeedback;
  context: string | null;
  /** null when S3 is unconfigured or the upload failed. The review still saves. */
  audio: AudioRef | null;
  /** ISO-8601, UTC. */
  created_at: string;
  /**
   * Presigned S3 GET, valid 3600 s. Absent from the JSON entirely when there
   * is no stored clip — never persist it, re-fetch the list instead.
   */
  audio_url?: string | null;
};

/* -------------------------------------------------------------- errors ---- */

export type ApiErrorCode =
  | 'AUDIO_TOO_SHORT'
  | 'AUDIO_TOO_LONG'
  | 'AUDIO_UNRECOGNIZED'
  | 'ASSESSMENT_UNAVAILABLE'
  | 'UNAUTHORIZED'
  | 'EMAIL_TAKEN'
  | 'VALIDATION'
  | 'TIMEOUT'
  | 'NETWORK'
  | 'UNKNOWN';

export class ApiError extends Error {
  constructor(
    readonly code: ApiErrorCode,
    message: string,
    readonly status = 0,
    /** For 422 validation errors: field name -> message. */
    readonly fields?: Record<string, string>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
