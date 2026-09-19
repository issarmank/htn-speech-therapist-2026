import { config } from '@/constants/config';

import { AssessmentError, type AttemptInput, type DrillAttemptResult, type FlowAttemptResult } from './contracts';
import { assessDemoAttempt, assessDemoFlow } from './fixture-client';

async function postAudio<T>(path: string, input: AttemptInput): Promise<T> {
  if (!config.apiUrl) throw new AssessmentError('API_UNAVAILABLE', 'No backend URL is configured.');
  const formData = new FormData();
  formData.append('audio', { uri: input.clipUri, name: 'attempt.m4a', type: 'audio/m4a' } as never);
  formData.append('session_id', input.sessionId);
  formData.append('prompt_id', input.promptId);
  formData.append('idempotency_key', input.idempotencyKey);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  try {
    const response = await fetch(`${config.apiUrl}${path}`, { method: 'POST', body: formData, signal: controller.signal });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new AssessmentError(body.code ?? 'ASSESSMENT_UNAVAILABLE', body.message ?? 'The coach is taking a breath. Try again.');
    return body as T;
  } catch (error) {
    if (error instanceof AssessmentError) throw error;
    const code = error instanceof DOMException && error.name === 'AbortError' ? 'TIMEOUT' : 'NETWORK_ERROR';
    throw new AssessmentError(code, 'We could not reach your coach. Try again when you are ready.');
  } finally {
    clearTimeout(timeout);
  }
}

export const assessmentClient = {
  assessDrill: (input: AttemptInput) => config.isDemoMode ? assessDemoAttempt(input) : postAudio<DrillAttemptResult>('/api/v1/attempts/assess', input),
  assessFlow: (input: AttemptInput, busy: boolean) => config.isDemoMode ? assessDemoFlow(input, busy) : postAudio<FlowAttemptResult>('/api/v1/attempts/flow', input),
};
