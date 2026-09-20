/**
 * Demo mode: the whole app, no backend. Active whenever EXPO_PUBLIC_API_URL
 * is unset. Shapes match the live responses exactly — see contracts.ts.
 *
 * Three analyses rotate so a demo covers the cases that are easy to get wrong:
 * a clean run, a filler-heavy run, and the coach-unavailable fallback.
 */

import { COACH_FALLBACK_PATTERN } from '@/constants/backend';

import {
  ApiError,
  type AuthUser,
  type CoachFeedback,
  type SpeechAnalysisResponse,
  type SpeechMetrics,
  type SpeechReview,
  type TokenResponse,
} from './contracts';

const DEMO_USER: AuthUser = {
  id: '000000000000000000000001',
  email: 'demo@vocalflow.app',
  is_active: true,
};

const clean: { metrics: SpeechMetrics; feedback: CoachFeedback; transcript: string } = {
  transcript:
    "I'd say the project I'm proudest of is the scheduling tool we built last spring. " +
    'It started as a small internal fix and ended up saving the team about six hours a week.',
  metrics: {
    duration_s: 21.4,
    word_count: 38,
    wpm: 138.2,
    articulation_rate: 152.6,
    speech_ratio: 0.906,
    hard_fillers: [],
    soft_fillers: [{ text: 'so', start: 9.2 }],
    long_pauses: [],
    mid_pauses: 4,
    repetitions: [],
    longest_fluent_run_s: 11.8,
    avg_words_per_sentence: 19,
    audio_events: [],
  },
  feedback: {
    encouragement: 'Nice steady start.',
    primary_focus: 'confidence',
    coaching_cue: 'Keep that pace. Let the last word of each sentence land before you move on.',
    observations: [
      {
        pattern: 'Even pace throughout',
        evidence: '138 words per minute across 21 seconds, with no pause over 1.5 s.',
        why_it_matters: 'A listener can follow you without working for it.',
      },
    ],
    try_this_next: 'Say the same answer again, but end on a full stop rather than trailing off.',
  },
};

const fillerHeavy: typeof clean = {
  transcript:
    'Um, so basically the thing I wanted to talk about is, uh, the way we handle onboarding, ' +
    'because it, um, it takes way too long right now and people kind of get lost.',
  metrics: {
    duration_s: 19.8,
    word_count: 34,
    wpm: 103.0,
    articulation_rate: 128.4,
    speech_ratio: 0.802,
    hard_fillers: [
      { text: 'um', start: 0.4 },
      { text: 'uh', start: 6.1 },
      { text: 'um', start: 11.3 },
    ],
    soft_fillers: [
      { text: 'so', start: 1.1 },
      { text: 'basically', start: 1.9 },
      { text: 'kind of', start: 17.2 },
    ],
    long_pauses: [{ after_word: 'because', start: 9.6, duration: 1.9 }],
    mid_pauses: 7,
    repetitions: ['it'],
    longest_fluent_run_s: 4.2,
    avg_words_per_sentence: 34,
    audio_events: [],
  },
  feedback: {
    encouragement: 'Your point came through clearly.',
    primary_focus: 'fillers',
    coaching_cue: 'When you feel an "um" coming, close your mouth and let the silence sit instead.',
    observations: [
      {
        pattern: 'Hesitation sounds at the start of clauses',
        evidence: 'Three hard fillers — "um" twice and "uh" once — all before a new idea.',
        why_it_matters: 'They signal you are still deciding, which reads as less certain than you are.',
      },
      {
        pattern: 'One long pause after "because"',
        evidence: 'A 1.9 s gap mid-sentence.',
        why_it_matters: 'A pause after a connector leaves the listener waiting on the payoff.',
      },
    ],
    try_this_next: 'Try the same answer and replace every "um" with a closed-mouth beat.',
  },
};

const fallback: typeof clean = {
  transcript:
    'I think the hardest part was getting everyone to agree on what done actually meant for the release.',
  metrics: {
    duration_s: 12.1,
    word_count: 19,
    wpm: null,
    articulation_rate: null,
    speech_ratio: null,
    hard_fillers: [],
    soft_fillers: [],
    long_pauses: [{ after_word: 'done', start: 6.4, duration: 1.7 }],
    mid_pauses: 2,
    repetitions: [],
    longest_fluent_run_s: null,
    avg_words_per_sentence: 19,
    audio_events: [],
  },
  feedback: {
    encouragement: 'Nice work.',
    primary_focus: 'confidence',
    coaching_cue: "Nice work. Let's try that once more at a comfortable pace.",
    observations: [
      {
        pattern: COACH_FALLBACK_PATTERN,
        evidence: 'The coaching model could not be reached for this attempt.',
        why_it_matters: 'Your measurements below are still accurate.',
      },
    ],
    try_this_next: 'Record another clip and the coach should be back.',
  },
};

const ROTATION = [clean, fillerHeavy, fallback];
let nextIndex = 0;

/** Demo history accumulates in memory so the History tab has something to show. */
const reviews: SpeechReview[] = [];

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function demoObjectId(): string {
  return Date.now().toString(16).padStart(24, '0').slice(-24);
}

export const fixtureClient = {
  health: async () => {
    await wait(120);
    return { status: 'ok' };
  },

  register: async (email: string): Promise<AuthUser> => {
    await wait(400);
    if (email.startsWith('taken@')) {
      throw new ApiError('EMAIL_TAKEN', 'Email is already registered', 409);
    }
    return { ...DEMO_USER, email };
  },

  login: async (email: string, password: string): Promise<TokenResponse> => {
    await wait(400);
    if (!password) {
      throw new ApiError('UNAUTHORIZED', 'Incorrect email or password', 401);
    }
    return { access_token: `demo.${encodeURIComponent(email)}`, token_type: 'bearer' };
  },

  me: async (): Promise<AuthUser> => {
    await wait(200);
    return DEMO_USER;
  },

  analyze: async (input: {
    uri: string;
    context?: string;
    speak: boolean;
  }): Promise<SpeechAnalysisResponse> => {
    await wait(2_600);
    const source = ROTATION[nextIndex % ROTATION.length];
    nextIndex += 1;

    const response: SpeechAnalysisResponse = {
      transcript: source.transcript,
      metrics: source.metrics,
      feedback: source.feedback,
      // No real mp3 in demo mode; the "Hear it" button stays hidden, which is
      // the same branch a live run with speak=false takes.
      audio_base64: null,
      timings_ms: {
        stt: 1_240,
        metrics: 4,
        coach: source === fallback ? 8_120 : 1_890,
        ...(input.speak && source !== fallback ? { tts: 620 } : {}),
      },
    };

    reviews.unshift({
      _id: demoObjectId(),
      user_id: DEMO_USER.id,
      transcript: response.transcript,
      metrics: response.metrics,
      feedback: response.feedback,
      context: input.context ?? null,
      // Demo mode has no S3, so this is the same shape a live run takes when
      // the bucket is unset or the upload failed.
      audio: null,
      created_at: new Date().toISOString(),
    });

    return response;
  },

  reviews: async (limit = 20): Promise<SpeechReview[]> => {
    await wait(300);
    return reviews.slice(0, limit);
  },
};
