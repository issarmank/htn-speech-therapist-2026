import { Platform } from 'react-native';

import { REQUEST_TIMEOUT_MS } from '@/constants/backend';
import { config } from '@/constants/config';

import {
  ApiError,
  type ApiErrorCode,
  type AuthUser,
  type SpeechAnalysisResponse,
  type SpeechReview,
  type TokenResponse,
} from './contracts';
import { fixtureClient } from './fixture-client';

/**
 * The auth layer registers itself here rather than being imported, so the
 * client stays free of a circular dependency on auth-context.
 */
let readToken: () => string | null = () => null;
let handleUnauthorized: () => void = () => {};

export function configureClient(opts: {
  readToken: () => string | null;
  onUnauthorized: () => void;
}) {
  readToken = opts.readToken;
  handleUnauthorized = opts.onUnauthorized;
}

/**
 * FastAPI's `detail` is polymorphic and the three shapes mean different things:
 *
 *   "Incorrect email or password"                      auth routes
 *   { code: "AUDIO_TOO_SHORT", message: "..." }        speech domain errors
 *   [ { loc: ["body","email"], msg: "...", ... } ]     422 validation
 */
function normalizeError(status: number, body: unknown): ApiError {
  const detail = (body as { detail?: unknown } | null)?.detail;

  if (Array.isArray(detail)) {
    const fields: Record<string, string> = {};
    for (const item of detail) {
      const loc = (item as { loc?: unknown[] }).loc ?? [];
      const field = String(loc[loc.length - 1] ?? 'form');
      fields[field] = String((item as { msg?: string }).msg ?? 'Invalid value');
    }
    const first = Object.values(fields)[0] ?? 'Please check what you entered.';
    return new ApiError('VALIDATION', first, status, fields);
  }

  if (detail && typeof detail === 'object') {
    const { code, message } = detail as { code?: string; message?: string };
    return new ApiError(
      (code as ApiErrorCode) ?? 'UNKNOWN',
      message ?? 'Something went wrong.',
      status,
    );
  }

  const text = typeof detail === 'string' ? detail : '';
  if (status === 401) {
    return new ApiError('UNAUTHORIZED', text || 'Incorrect email or password', status);
  }
  if (status === 409) {
    return new ApiError('EMAIL_TAKEN', text || 'Email is already registered', status);
  }
  return new ApiError('UNKNOWN', text || `Request failed (${status}).`, status);
}

type RequestOpts = {
  method?: 'GET' | 'POST';
  body?: BodyInit;
  headers?: Record<string, string>;
  auth?: boolean;
  timeoutMs?: number;
  /** Skip the global 401 redirect — login/register handle 401 themselves. */
  allowUnauthorized?: boolean;
};

async function request<T>(path: string, opts: RequestOpts = {}): Promise<T> {
  if (!config.apiUrl) {
    throw new ApiError('NETWORK', 'No backend URL is configured.', 0);
  }

  const headers: Record<string, string> = { Accept: 'application/json', ...opts.headers };
  if (opts.auth !== false) {
    const token = readToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${config.apiUrl}${path}`, {
      method: opts.method ?? 'GET',
      body: opts.body,
      headers,
      signal: controller.signal,
    });
  } catch (error) {
    // Hermes does not reliably expose DOMException, so check the name.
    const aborted = (error as Error)?.name === 'AbortError';
    throw new ApiError(
      aborted ? 'TIMEOUT' : 'NETWORK',
      aborted
        ? 'That took too long. Try again in a moment.'
        : "We couldn't reach the coach. Check your connection.",
      0,
    );
  } finally {
    clearTimeout(timer);
  }

  if (response.status === 204) return undefined as T;

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const error = normalizeError(response.status, body);
    // The token lives 60 minutes and there is no refresh endpoint, so an
    // expiry mid-session looks exactly like an outage unless it is caught here.
    if (response.status === 401 && !opts.allowUnauthorized) handleUnauthorized();
    throw error;
  }

  return body as T;
}

/* ------------------------------------------------------------- upload ---- */

/**
 * React Native's FormData accepts a `{ uri, name, type }` descriptor and reads
 * the file itself. The browser's does not: it stringifies the object to
 * "[object Object]", and FastAPI then rejects the part with
 * `Expected UploadFile, received: <class 'str'>`. On web the blob: URL that
 * expo-audio hands back has to be fetched and appended as a real File.
 */
async function audioPart(uri: string): Promise<Blob> {
  if (Platform.OS !== 'web') {
    return {
      uri,
      name: 'recording.m4a',
      type: 'audio/m4a',
    } as unknown as Blob;
  }

  const blob = await fetch(uri).then((res) => res.blob());
  // MediaRecorder decides the container (webm on Chrome/Firefox, mp4 on
  // Safari), so the extension has to follow the blob rather than be assumed.
  const type = blob.type || 'audio/webm';
  const ext = type.includes('mp4') ? 'mp4' : type.includes('ogg') ? 'ogg' : 'webm';
  return new File([blob], `recording.${ext}`, { type });
}

/* ----------------------------------------------------------------- api ---- */

const liveClient = {
  health: () => request<{ status: string }>('/health', { auth: false, timeoutMs: 8_000 }),

  register: (email: string, password: string) =>
    request<AuthUser>('/auth/register', {
      method: 'POST',
      auth: false,
      allowUnauthorized: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      timeoutMs: 20_000,
    }),

  /**
   * OAuth2PasswordRequestForm: this must be form-urlencoded with `username`
   * (the email) and `password`. JSON fails with a 422.
   */
  login: (email: string, password: string) =>
    request<TokenResponse>('/auth/login', {
      method: 'POST',
      auth: false,
      allowUnauthorized: true,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ username: email, password }).toString(),
      timeoutMs: 20_000,
    }),

  me: () => request<AuthUser>('/auth/me', { timeoutMs: 15_000 }),

  analyze: async (input: { uri: string; context?: string; speak: boolean }) => {
    const form = new FormData();
    form.append('audio', await audioPart(input.uri));
    if (input.context) form.append('context', input.context);

    return request<SpeechAnalysisResponse>(
      `/api/v1/speech/analyze?speak=${input.speak}`,
      // Content-Type is deliberately unset: fetch adds the multipart boundary.
      { method: 'POST', body: form },
    );
  },

  reviews: (limit = 20) =>
    request<SpeechReview[]>(`/api/v1/speech/reviews?limit=${limit}`, { timeoutMs: 20_000 }),
};

export const api = config.isDemoMode ? fixtureClient : liveClient;
export type Api = typeof liveClient;
