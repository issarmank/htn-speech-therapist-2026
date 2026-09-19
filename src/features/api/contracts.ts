export type CoachTurn = {
  encouragement: string;
  one_coaching_cue: string;
  next_prompt: string;
  audio_stream_url?: string;
  fallback_used?: boolean;
};

export type WordFeedback = {
  word: string;
  word_index: number;
  status: 'nailed_it' | 'retry' | 'unavailable';
  accuracy?: number;
  error_type?: string;
  phonemes?: Array<{ symbol: string; accuracy?: number }>;
};

export type DrillAttemptResult = {
  attempt_id: string;
  mode: 'clear_speak';
  transcript: string;
  clear_speak: { overall: number; accuracy?: number; fluency?: number; completeness?: number; prosody?: number; label: 'Practice feedback' } | null;
  word_feedback: WordFeedback[];
  focus: { word: string; reason: string } | null;
  coach: CoachTurn;
};

export type FlowAttemptResult = {
  attempt_id: string;
  mode: 'scenario_sprint';
  transcript: string;
  conversation_flow: number | null;
  signals: { wpm?: number; filler_count?: number; long_pause_count?: number; pitch_range_hz?: number };
  next_intent: 'place_order' | 'coach_clarification' | 'confirm_order' | 'success';
  coach: CoachTurn;
};

export class AssessmentError extends Error {
  constructor(public code: string, message: string, public retryable = true) {
    super(message);
  }
}

export type AttemptInput = { clipUri: string; sessionId: string; promptId: string; idempotencyKey: string };
