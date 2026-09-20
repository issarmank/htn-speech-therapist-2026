#!/usr/bin/env node
/**
 * Contract drift check against the live backend.
 *
 * The backend is a separate repo under active development. This fetches its
 * OpenAPI document and asserts that everything the app reads still exists, so
 * a renamed field surfaces as one line of output instead of a blank screen.
 *
 *   npm run check:api
 *
 * Reads EXPO_PUBLIC_API_URL from .env (or the environment).
 */

import { readFileSync, existsSync } from 'node:fs';

const REQUIRED_ROUTES = [
  ['/auth/register', 'post'],
  ['/auth/login', 'post'],
  ['/auth/me', 'get'],
  ['/api/v1/speech/analyze', 'post'],
  ['/api/v1/speech/reviews', 'get'],
  ['/health', 'get'],
];

/** Schema name -> the properties the app actually reads. */
const REQUIRED_FIELDS = {
  SpeechAnalysisResponse: ['transcript', 'metrics', 'feedback', 'audio_base64', 'timings_ms'],
  SpeechMetrics: [
    'duration_s', 'word_count', 'wpm', 'articulation_rate', 'speech_ratio',
    'hard_fillers', 'soft_fillers', 'long_pauses', 'mid_pauses', 'repetitions',
    'longest_fluent_run_s', 'avg_words_per_sentence', 'audio_events',
  ],
  CoachFeedback: [
    'encouragement', 'primary_focus', 'coaching_cue', 'observations', 'try_this_next',
  ],
  Observation: ['pattern', 'evidence', 'why_it_matters'],
  FillerHit: ['text', 'start'],
  PauseHit: ['after_word', 'start', 'duration'],
  UserResponse: ['id', 'email', 'is_active'],
  TokenResponse: ['access_token', 'token_type'],
};

const PRIMARY_FOCUS = [
  'fillers', 'pacing', 'pauses', 'repetition', 'sentence_length', 'confidence',
];

function apiUrl() {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  if (existsSync('.env')) {
    const match = readFileSync('.env', 'utf8').match(/^EXPO_PUBLIC_API_URL=(.+)$/m);
    if (match?.[1]?.trim()) return match[1].trim();
  }
  return null;
}

const problems = [];
const notes = [];

function check(condition, message) {
  if (!condition) problems.push(message);
}

const base = apiUrl()?.replace(/\/$/, '');
if (!base) {
  console.error('EXPO_PUBLIC_API_URL is not set — nothing to check against.');
  console.error('Set it in .env, e.g. EXPO_PUBLIC_API_URL=http://<ec2-host>:8000');
  process.exit(2);
}

console.log(`Checking ${base}/openapi.json\n`);

let doc;
try {
  const response = await fetch(`${base}/openapi.json`, { signal: AbortSignal.timeout(15_000) });
  if (!response.ok) {
    console.error(`Could not fetch the OpenAPI document: HTTP ${response.status}`);
    process.exit(2);
  }
  doc = await response.json();
} catch (error) {
  console.error(`Could not reach ${base}: ${error.message}`);
  process.exit(2);
}

// --- routes ---------------------------------------------------------------
for (const [path, method] of REQUIRED_ROUTES) {
  check(doc.paths?.[path]?.[method], `Missing route: ${method.toUpperCase()} ${path}`);
}

// --- login must stay form-encoded ------------------------------------------
// The app sends URLSearchParams. If this ever becomes JSON the login silently
// starts 422-ing.
const loginBody = doc.paths?.['/auth/login']?.post?.requestBody?.content ?? {};
check(
  'application/x-www-form-urlencoded' in loginBody,
  `POST /auth/login no longer accepts form-urlencoded (now: ${
    Object.keys(loginBody).join(', ') || 'nothing'
  }). The client sends URLSearchParams and will start failing with 422.`,
);

// --- analyze request shape --------------------------------------------------
const analyze = doc.paths?.['/api/v1/speech/analyze']?.post;
check(
  'multipart/form-data' in (analyze?.requestBody?.content ?? {}),
  'POST /api/v1/speech/analyze no longer accepts multipart/form-data.',
);
check(
  (analyze?.parameters ?? []).some((p) => p.name === 'speak'),
  'The `speak` query parameter is gone from /api/v1/speech/analyze.',
);

// --- schema fields ----------------------------------------------------------
const schemas = doc.components?.schemas ?? {};
for (const [name, fields] of Object.entries(REQUIRED_FIELDS)) {
  const schema = schemas[name];
  if (!schema) {
    problems.push(`Missing schema: ${name}`);
    continue;
  }
  const present = Object.keys(schema.properties ?? {});
  for (const field of fields) {
    check(present.includes(field), `${name}.${field} is gone from the response.`);
  }
  const extra = present.filter((field) => !fields.includes(field));
  if (extra.length) notes.push(`${name} has new fields the app ignores: ${extra.join(', ')}`);
}

// --- primary_focus values ---------------------------------------------------
// The app maps each value to a label, glyph and emphasised tile; an unmapped
// value falls through to a generic badge.
const focusSchema = schemas.CoachFeedback?.properties?.primary_focus;
const focusValues =
  focusSchema?.enum ??
  focusSchema?.allOf?.map((ref) => schemas[ref.$ref?.split('/').pop()]?.enum).find(Boolean) ??
  (focusSchema?.$ref ? schemas[focusSchema.$ref.split('/').pop()]?.enum : null);

if (Array.isArray(focusValues)) {
  for (const value of focusValues) {
    check(PRIMARY_FOCUS.includes(value), `Unmapped primary_focus value: "${value}".`);
  }
} else {
  notes.push('Could not read the primary_focus enum from the schema.');
}

// --- known blind spot -------------------------------------------------------
notes.push(
  'GET /api/v1/speech/reviews declares no response_model, so OpenAPI describes ' +
    'the route but not the row shape. Drift in a review field can only be caught at runtime.',
);

// --- report -----------------------------------------------------------------
if (notes.length) {
  console.log('Notes:');
  for (const note of notes) console.log(`  · ${note}`);
  console.log('');
}

if (problems.length) {
  console.error(`✕ ${problems.length} contract problem${problems.length === 1 ? '' : 's'}:`);
  for (const problem of problems) console.error(`  ✕ ${problem}`);
  console.error('\nUpdate src/features/api/contracts.ts and whatever reads those fields.');
  process.exit(1);
}

console.log('✓ The backend contract still matches src/features/api/contracts.ts');
