/**
 * Values mirrored from the backend so the UI can label and pre-validate
 * without guessing. Each one names its source file — if the backend changes,
 * `npm run check:api` will not catch these (they are not in the OpenAPI
 * schema), so they have to be re-read by hand.
 */

/** speech/metrics.py:29 — a gap this long or longer reads as a stall. */
export const LONG_PAUSE_S = 1.5;

/** speech/metrics.py:30 — counted, not listed. Good rhythm, not a problem. */
export const MID_PAUSE_S = 0.5;

/**
 * Comfortable conversational pace. This band exists only as prose in the
 * Gemini system prompt (speech/coach.py:40-42), never as a backend constant,
 * so the app is the only place it is written down as numbers.
 */
export const PACE_BAND = [120, 160] as const;

/** database/config.py:31 — checked against measured duration, post-transcription. */
export const MAX_AUDIO_SECONDS = 120;

/** UI cap. Must stay <= MAX_AUDIO_SECONDS. */
export const MAX_RECORD_SECONDS = 60;

/** Ring turns amber here, auto-stop at MAX_RECORD_SECONDS. */
export const WARN_RECORD_SECONDS = 50;

/** Stop becomes available here — below it the backend rejects the clip. */
export const MIN_RECORD_SECONDS = 2;

/** speech/pipeline.py:13-14 — rejected below either of these. */
export const MIN_DURATION_S = 1.0;
export const MIN_WORDS = 3;

/** routes/speech.py:24 — hard 25 MB cap on the upload itself. */
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

/** speech/metrics.py:12 — pure hesitation sounds, always surfaced. */
export const HARD_FILLERS = [
  'um', 'umm', 'uh', 'uhh', 'er', 'erm', 'ah', 'mm', 'hmm',
] as const;

/** speech/metrics.py:16-27 — real words acting as fillers, weighted by rate. */
export const SOFT_FILLERS = [
  'like', 'so', 'right', 'basically', 'actually', 'literally',
  'you know', 'i mean', 'sort of', 'kind of',
] as const;

/**
 * speech/coach.py — the exact `pattern` string the fallback observation uses.
 * It is the only signal that Gemini was unavailable; the response still 200s.
 */
export const COACH_FALLBACK_PATTERN = 'Coaching unavailable';

/**
 * STT + Gemini (30 s timeout x 3 retries + fallback model) + optional TTS, all
 * sequential. 60 s is not enough headroom.
 */
export const REQUEST_TIMEOUT_MS = 90_000;

export function paceLabel(wpm: number): 'Unhurried' | 'Comfortable' | 'Quick' {
  if (wpm < PACE_BAND[0]) return 'Unhurried';
  if (wpm > PACE_BAND[1]) return 'Quick';
  return 'Comfortable';
}
