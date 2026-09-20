import type { PracticeContext } from './contexts';

/**
 * Prompts exist only to cure blank-page anxiety. They are never sent to the
 * backend — it coaches how you spoke, not what you said.
 */
const PROMPTS: Record<string, string[]> = {
  interview: [
    "Tell me about a project you're proud of.",
    'Describe a time you disagreed with a teammate.',
    'What would you want to be doing in three years?',
    'Walk me through something you got wrong and fixed.',
  ],
  presentation: [
    'Give the one-minute version of what you work on.',
    'Explain your favourite tool to someone who has never used it.',
    'Open a talk with the reason the audience should care.',
    'Summarise a decision and the trade-off behind it.',
  ],
  everyday: [
    'Tell me about your weekend.',
    'Describe the last good meal you had.',
    'Recommend something you watched or read recently.',
    'Explain how you get to work in the morning.',
  ],
  free: [
    'Say whatever is on your mind for thirty seconds.',
    'Describe the room you are sitting in.',
    'Talk through what you plan to do tomorrow.',
    'Explain something you know well to an eight-year-old.',
  ],
};

export function promptsFor(context: PracticeContext): string[] {
  return PROMPTS[context.id] ?? PROMPTS.free;
}
