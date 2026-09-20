/**
 * The real pipeline, in order. Provider names live here only — never inline in
 * copy, where they go stale.
 */
export type PipelineStage = {
  key: 'stt' | 'metrics' | 'coach' | 'tts';
  index: number;
  title: string;
  summary: string;
  detail: string;
  provider: string;
  kind: 'ai' | 'code';
  optional?: boolean;
};

export const PIPELINE_STAGES: PipelineStage[] = [
  {
    key: 'stt',
    index: 1,
    title: 'Transcribe',
    summary: 'Your voice → words with timestamps.',
    detail:
      'Every later measurement depends on those timestamps. Without them there is no pace, no pause length and no filler position.',
    provider: 'ElevenLabs Scribe',
    kind: 'ai',
  },
  {
    key: 'metrics',
    index: 2,
    title: 'Measure',
    summary: 'Counts pace, pauses, fillers, repeats. No AI, no guessing.',
    detail:
      'Pure Python over the timestamps. Same clip in, same numbers out, every time. This is why the numbers are reproducible.',
    provider: 'Plain code',
    kind: 'code',
  },
  {
    key: 'coach',
    index: 3,
    title: 'Coach',
    summary: 'Explains those numbers. Picks one thing to work on.',
    detail:
      'Handed the measurements and asked to explain them. It cannot see the audio, so it cannot invent a statistic it was not given.',
    provider: 'Gemini',
    kind: 'ai',
  },
  {
    key: 'tts',
    index: 4,
    title: 'Speak',
    summary: 'Reads the cue aloud.',
    detail: 'Optional. Runs only when "Coach speaks" is on, and never fails the request.',
    provider: 'ElevenLabs',
    kind: 'ai',
    optional: true,
  },
];

export const GLOSSARY: { term: string; meaning: string }[] = [
  { term: 'Pace', meaning: '120–160 words per minute is a comfortable conversational range.' },
  { term: 'Long pause', meaning: 'A gap of 1.5 s or more. Shorter gaps are good rhythm.' },
  { term: 'Mid pause', meaning: 'A gap between 0.5 s and 1.5 s. Counted, not listed.' },
  { term: 'Hard filler', meaning: 'um, uh, er, ah, mm — pure hesitation sounds, always counted.' },
  {
    term: 'Soft filler',
    meaning: 'like, so, basically, you know — real words, weighted by rate rather than raw count.',
  },
  { term: 'Repeat', meaning: 'The same word said twice in a row.' },
  { term: 'Smoothest stretch', meaning: 'Your longest run of speech with no long pause in it.' },
];

export const GUARDRAILS: string[] = [
  'Coaches how you speak, not what you say.',
  'Never diagnoses. Suggests a speech-language professional only as a positive next step.',
  'If the AI coach is down, you still get your measurements.',
];
