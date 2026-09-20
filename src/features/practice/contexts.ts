/**
 * The chip the user picks maps to the backend's free-text `context` form
 * field. It is the only thing about the prompt the server ever sees.
 */
export type PracticeContext = {
  id: string;
  label: string;
  /** Sent as the `context` field. `null` omits it entirely. */
  value: string | null;
};

export const PRACTICE_CONTEXTS: PracticeContext[] = [
  { id: 'interview', label: 'Job interview', value: 'practising a job interview answer' },
  { id: 'presentation', label: 'Presentation', value: 'rehearsing a short presentation' },
  { id: 'everyday', label: 'Everyday chat', value: 'everyday conversation' },
  { id: 'free', label: 'Free talk', value: null },
];

export const DEFAULT_CONTEXT = PRACTICE_CONTEXTS[0];

export function contextById(id: string | undefined): PracticeContext {
  return PRACTICE_CONTEXTS.find((entry) => entry.id === id) ?? DEFAULT_CONTEXT;
}

/** Reverse lookup for history rows, which store the sent value, not the id. */
export function labelForContextValue(value: string | null): string {
  if (!value) return 'Free talk';
  return PRACTICE_CONTEXTS.find((entry) => entry.value === value)?.label ?? value;
}
