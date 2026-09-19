# Remaining VocalFlow Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete the frontend stories with production-shaped audio, API, navigation, scenario, persistence, and recovery paths.

**Architecture:** Replace the single prototype route with typed feature modules and Expo Router routes. Audio and API adapters expose a local fixture fallback while the backend is unavailable; screens consume one stable result contract.

**Tech Stack:** Expo SDK 57, Expo Router, `expo-audio`, TypeScript, React Native, AsyncStorage/SecureStore only if Expo-supported dependencies are installed.

**Spec:** `docs/frontend-specification.md`

## Global Constraints

- Backend owns all scoring and provider credentials.
- Record one utterance at a time, max 20 seconds.
- Keep coach text usable when playback/API fails.
- Flow is never labelled pronunciation or diagnosis.
- All controls include accessibility labels and disabled state.

## Review Focus

- Denied microphone permission must leave the current prompt intact.
- Timeout or server failure must offer retry without duplicate attempt submission.
- API result with unavailable word feedback must not show a zero/failing grade.
- Restoring a saved in-progress session must not replay completed coaching automatically.
- Coffee Shop Busy transition must only occur after a valid user turn.

---

### Task 1: Install and wrap Expo Audio

**Files:** `package.json`, `src/features/audio/use-practice-recorder.ts`, `src/features/audio/types.ts`.

- [ ] Add Expo-supported `expo-audio` with `npx expo install expo-audio`.
- [ ] Create `usePracticeRecorder()` returning `requestPermission`, `start`, `stop`, `status`, and an `AudioClip` URI/duration.
- [ ] Guard 20-second recordings and surface `permission_denied`, `too_short`, and `recording_failed` states.
- [ ] Verify with `npx tsc --noEmit`, `npm run lint`, and an Expo Go device recording.

### Task 2: Add typed assessment API and fixture fallback

**Files:** `src/features/api/contracts.ts`, `src/features/api/client.ts`, `src/features/api/fixture-client.ts`, `src/constants/config.ts`.

- [ ] Define `DrillAttemptResult`, `FlowAttemptResult`, and typed API errors from the frontend spec.
- [ ] Implement multipart upload with an idempotency key and an abort timeout.
- [ ] Select API client only when `EXPO_PUBLIC_API_URL` exists; otherwise use explicit local demo fixtures.
- [ ] Return a retryable error shape for network/timeout/non-2xx responses.
- [ ] Verify TypeScript and web fixture flow.

### Task 3: Split the Speech Mirror into feature components and routes

**Files:** `src/app/index.tsx`, `src/app/practice/[sessionId].tsx`, `src/features/drill/*`.

- [ ] Move record/session reducer, prompt phrase, waveform, word detail, coach card, and achievement pairing into focused components/hooks.
- [ ] Route Home → drill intro → active practice → reveal; preserve session and attempt sequence in route/state.
- [ ] Render backend word feedback, unavailable status, loading, retry, and coach-text-only states.
- [ ] Verify narrow web and Expo Go navigation.

### Task 4: Build Scenario Sprint as a dedicated route

**Files:** `src/app/scenario/[sessionId].tsx`, `src/features/scenario/*`.

- [ ] Implement Calm/Busy selection, finite Coffee Shop intent state, recording/upload, Flow card, and Barista response.
- [ ] Allow replay/retry but block intent progression while a turn is submitting.
- [ ] Show WPM/fillers/long pauses as raw signals under Conversation Flow.
- [ ] Verify both Calm and Busy sequences using fixture results.

### Task 5: Add local session persistence and recoverable states

**Files:** `src/features/session/session-store.ts`, `src/features/session/use-session-restore.ts`.

- [ ] Persist only mission, prompt/intent, attempt IDs, result summaries, and latest reveal data.
- [ ] Clear an abandoned recording URI and never persist raw audio locally.
- [ ] Resume a nonterminal session at the current prompt with coach playback stopped.
- [ ] Verify reload and retry recovery in web/device testing.

### Task 6: Final quality pass

**Files:** component and route files above.

- [ ] Add loading, empty, permission, timeout, offline, and coach-audio-unavailable states.
- [ ] Apply large-text/narrow-layout checks and screen-reader labels.
- [ ] Verify `npx tsc --noEmit`, `npm run lint`, Expo web, and Expo Go device journey.
- [ ] Commit each independently reviewable task and request whole-branch review.

## Self-review

Tasks 1–6 map directly to every unfinished frontend story: real audio, backend contract, routing/components, Coffee Shop, persistence, and failure/accessibility UX. The only dependency outside the frontend is a running backend URL; explicit fixture mode keeps all UI stories demoable until then.
