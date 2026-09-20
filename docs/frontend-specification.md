> **OUTDATED — do not build against this.**
> It describes an earlier product (Azure pronunciation scoring, `/api/v1/attempts/*`,
> Supabase, ClearSpeak drills). None of it is implemented. The live API is
> `/auth/*`, `POST /api/v1/speech/analyze`, `GET /api/v1/speech/reviews` and
> `/health`. See `DESIGN_SPEC` for the design and
> `src/features/api/contracts.ts` for the current response shapes.

# VocalCraft AI — Frontend Specification

**Repository:** `htn-speech-therapist-2026`  
**Backend contract:** `htn-speech-therapist-2026-backend/docs/backend-specification.md`  
**Product source:** `agent_stuff/prd_speech_therapy_app.md`

## 1. Frontend mission

The frontend makes the product’s value obvious in seconds:

```text
Say a phrase → see the weak word → hear one coach cue → retry → see improvement.
```

It owns the **Speech Mirror** experience, recording/playback, local interaction state, and rendering backend-owned scoring results. It must never calculate or label pronunciation accuracy itself.

## 2. Frontend-owned scope

| Own | Do not own |
| --- | --- |
| Navigation, mission selection, progress state, waveform, record control, word highlighting, coach playback, Before → After reveal | Azure configuration, transcription, VAD, score calculation, LLM prompting, ElevenLabs credentials, provider retries, database persistence |
| Display contract validation and retry UX | Converting transcript confidence into a pronunciation grade |
| Local audio capture, device permissions, upload lifecycle | Storing provider secrets or raw assessment payloads |

## 3. Demo routes

| Route | Purpose | Primary action |
| --- | --- | --- |
| `/` | Today’s mission, last achievement, quick continuation | `Start today’s mission` |
| `/mission/clear-speak-r` | `/r/` drill intro and attempt rail | `Begin warm-up` |
| `/practice/:sessionId` | Speech Mirror active state | Hold/release microphone, retry, advance |
| `/scenario/coffee-shop/:sessionId` | Scenario Sprint and Calm/Busy switch | Speak a roleplay turn |
| `/reveal/:sessionId` | Before → After payoff | Replay, next challenge, home |

For the hackathon, a single-stack navigator is sufficient. Do not build a persistent desktop sidebar, a clinician dashboard, or generic analytics navigation before the primary journey is polished.

## 4. Speech Mirror

### 4.1 Component tree

```text
PracticeScreen
├─ MissionHeader             // “Make your R sound land clearly”
├─ AttemptProgressRail       // 1 of 3
├─ PromptPhrase
│  └─ FeedbackWord[]         // neutral | nailed_it | try_again | unavailable
├─ WaveformMeter
├─ RecordControl
├─ AnalysisStatus
├─ CoachCard
│  ├─ CoachCaption
│  ├─ ReplayCoachAudio
│  └─ RetryCTA
└─ WordDetailSheet           // opened by a FeedbackWord tap
```

### 4.2 State machine

```text
loading_session → prompting → recording → uploading → analysing → feedback
                                                   ↘ failed_retryable
feedback → recording          (retry)
feedback → prompting          (next drill prompt)
feedback → reveal             (mission completed)
```

Rules:

- Disable the record control during upload and analysis.
- Keep the phrase on screen while analysis runs; do not replace it with a generic spinner.
- Record-control release finalizes a turn. Do not send partial live audio in MVP.
- A failed attempt preserves the current prompt and offers `Try again`.
- The client must include an idempotency key on every attempt upload.

### 4.3 Prompt phrase and word status

The client renders `word_feedback` in display order. Status mapping:

| API status | Visual treatment | Accessible text |
| --- | --- | --- |
| `nailed_it` | Blue/green underline plus check icon | “{word}, nailed it.” |
| `retry` | Amber emphasis plus retry icon | “{word}, try again. Practice feedback {score}.” |
| `unavailable` | Neutral dotted underline | “{word}, not enough audio to score.” |
| absent | Neutral phrase styling | `{word}` |

Only the API-selected `focus` word automatically opens emphasis. Tapping any marked word opens `WordDetailSheet` with the backend-provided cue, a score, optional phoneme label, and **Hear it** / **Try again** actions.

### 4.4 Recording and playback

- Request microphone access only when the user begins a practice attempt.
- Capture one mono utterance in a backend-supported format; the backend accepts `m4a`, `wav`, or `webm` after validation.
- Limit UI recording at 20 seconds. Warn at 18 seconds; stop at 20.
- The waveform is a local amplitude visualization, not a score or clinical measurement.
- On response, display the coach caption immediately and start audio playback when `audio_stream_url` is ready.
- The replay action must remain available after automatic playback ends.

## 5. ClearSpeak drill behaviour

Prompts: `red`, `rain`, `road`, then `Red robin runs rapidly.`

For every successful drill attempt:

1. Render the returned transcript beneath the prompt only when it differs materially from the expected phrase.
2. Apply `word_feedback` statuses to the displayed phrase.
3. Show one compact metric row: `Practice feedback 84 · Flow 81`.
4. Render `coach.encouragement` and `coach.one_coaching_cue` in the coach card.
5. Keep `coach.next_prompt` behind the main **Try again** or **Continue** CTA.
6. After attempt three or an explicit skip, request/route to the session reveal.

Do not show five score dials. The focus word and one top-level practice score are the hero; detailed components belong behind an optional “See details” control.

## 6. Coffee Shop Scenario Sprint

### 6.1 Controls and narrative

- Start screen presents a stress selector: `Calm` or `Busy`.
- A prominent coach bubble speaks/shows the scenario prompt.
- The user records one response at a time.
- A compact Flow card shows: `Conversation Flow`, WPM, fillers, long pauses.
- Busy mode visually changes the order pace and uses one clarification prompt; it does not require a different visual system.

### 6.2 Flow display

`conversation_flow` is never called pronunciation, articulation, or a diagnosis. Show the raw signals beside it:

```text
Conversation Flow 78
142 WPM   ·   1 filler   ·   0 long pauses
```

The app displays a single backend-provided cue, such as “Keep that pace—your order was clear.” It does not infer why the score changed.

## 7. Before → After reveal

The reveal requires backend-provided comparable attempts. It is not generated solely from local state.

```text
Your R clarity improved
61  →  84
“You found a clearer start to rapidly.”
[Hear first attempt]  [Hear best attempt]
[Take on Coffee Shop]
```

Use a full-screen transition and one animated numeric delta. Never compare unrelated prompts or different stress levels. If no valid pair exists, show a best-attempt celebration rather than manufacturing a change.

## 8. Client API contract

The frontend calls the backend through a typed API client. Provider URLs and secrets are never exposed to the mobile app.

### `POST /api/v1/attempts/assess`

Form data:

```text
audio             recorded clip
session_id        UUID
prompt_id         server-issued ID
idempotency_key   UUID
```

Required response shape:

```ts
type DrillAttemptResult = {
  attempt_id: string;
  mode: "clear_speak";
  transcript: string;
  clear_speak: {
    overall: number;
    accuracy?: number;
    fluency?: number;
    completeness?: number;
    prosody?: number;
    label: "Practice feedback";
  } | null;
  word_feedback: Array<{
    word: string;
    word_index: number;
    status: "nailed_it" | "retry" | "unavailable";
    accuracy?: number;
    error_type?: string;
    phonemes?: Array<{ symbol: string; accuracy?: number }>;
  }>;
  focus: { word: string; reason: string } | null;
  coach: CoachTurn;
};

type CoachTurn = {
  encouragement: string;
  one_coaching_cue: string;
  next_prompt: string;
  audio_stream_url?: string;
  fallback_used?: boolean;
};
```

### `POST /api/v1/attempts/flow`

```ts
type FlowAttemptResult = {
  attempt_id: string;
  mode: "scenario_sprint";
  transcript: string;
  conversation_flow: number | null;
  signals: {
    wpm?: number;
    filler_count?: number;
    long_pause_count?: number;
    pitch_range_hz?: number;
  };
  next_intent: "place_order" | "coach_clarification" | "confirm_order" | "success";
  coach: CoachTurn;
};
```

## 9. Error handling

| Backend code | UI message | Action |
| --- | --- | --- |
| `AUDIO_TOO_SHORT` | “We didn’t catch enough speech. Try a full phrase.” | Retry |
| `AUDIO_TOO_LONG` | “Keep each attempt under 20 seconds.” | Retry |
| `AUDIO_UNRECOGNIZED` | “We couldn’t score that one. Try somewhere quieter.” | Retry |
| `ASSESSMENT_UNAVAILABLE` | “The coach is taking a breath.” | Retry or continue |
| `TTS_UNAVAILABLE` | Keep the coach text visible with muted playback | Retry playback |
| Device permission denied | “VocalCraft needs your microphone to listen.” | Open Settings / dismiss |

## 10. Frontend acceptance tests

- Starting the `/r/` mission progresses through prompt, record, analysis, feedback, retry, and reveal without losing session state.
- A `retry` target word is tappable and exposes its detail sheet and coach replay.
- `unavailable` never renders as a zero score or an error color.
- The app sends a single request per finalized recording, even after a reconnect/tap race.
- Coach text is usable when audio playback fails.
- A Before → After card only renders when the backend supplies comparable attempt IDs.
- Coffee Shop displays Flow signals and never labels them as a pronunciation score.
- Record controls, word status, and coach playback have accessible labels.

## 11. Implementation order

1. Typed API client plus fixture responses.
2. Speech Mirror static screen and state machine.
3. Device recording, upload lifecycle, and response rendering.
4. Word detail sheet and coach playback.
5. Retry pairing and Before → After reveal.
6. Coffee Shop Flow card and stress selector.
7. Motion, visual polish, and error-state rehearsal.
