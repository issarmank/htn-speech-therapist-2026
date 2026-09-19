import type { AttemptInput, DrillAttemptResult, FlowAttemptResult } from './contracts';

let drillCount = 0;

export async function assessDemoAttempt(_input: AttemptInput): Promise<DrillAttemptResult> {
  await new Promise((resolve) => setTimeout(resolve, 700));
  drillCount += 1;
  const improved = drillCount > 1;
  return {
    attempt_id: `demo-drill-${drillCount}`,
    mode: 'clear_speak',
    transcript: 'Red robin runs rapidly.',
    clear_speak: { overall: improved ? 84 : 61, fluency: improved ? 81 : 74, label: 'Practice feedback' },
    word_feedback: [{ word: 'rapidly', word_index: 3, status: improved ? 'nailed_it' : 'retry', accuracy: improved ? 84 : 61 }],
    focus: { word: 'rapidly', reason: 'A rounder R start will make the word land clearly.' },
    coach: {
      encouragement: improved ? 'That was clearer. Keep that smooth R sound.' : 'Strong start—you have the rhythm already.',
      one_coaching_cue: improved ? 'Let that R release smoothly.' : 'Round the start of rapidly, then release it smoothly.',
      next_prompt: 'Red robin runs rapidly.',
      fallback_used: true,
    },
  };
}

export async function assessDemoFlow(input: AttemptInput, busy: boolean): Promise<FlowAttemptResult> {
  await new Promise((resolve) => setTimeout(resolve, 700));
  return {
    attempt_id: `demo-flow-${input.idempotencyKey}`,
    mode: 'scenario_sprint',
    transcript: 'Could I get a medium oat milk latte, please?',
    conversation_flow: busy ? 74 : 82,
    signals: { wpm: busy ? 154 : 132, filler_count: busy ? 1 : 0, long_pause_count: 0 },
    next_intent: busy ? 'coach_clarification' : 'confirm_order',
    coach: {
      encouragement: busy ? 'You stayed understandable under pressure.' : 'Your order was clear and easy to follow.',
      one_coaching_cue: busy ? 'Keep that pace—then pause once before the milk choice.' : 'Keep that calm, comfortable pace.',
      next_prompt: busy ? 'Sorry—was that oat milk or whole milk?' : 'Great. Anything else today?',
      fallback_used: true,
    },
  };
}
