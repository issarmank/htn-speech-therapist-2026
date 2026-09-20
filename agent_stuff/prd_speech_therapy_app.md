> **OUTDATED — do not build against this.**
> It describes an earlier product (Azure pronunciation scoring, `/api/v1/attempts/*`,
> Supabase, ClearSpeak drills). None of it is implemented. The live API is
> `/auth/*`, `POST /api/v1/speech/analyze`, `GET /api/v1/speech/reviews` and
> `/health`. See `DESIGN_SPEC` for the design and
> `src/features/api/contracts.ts` for the current response shapes.

# Product Requirements Document

## VocalCraft AI — “Your Voice, Rebuilt in Real Time”

**Target event:** 24–48 hour hackathon  
**Category:** Healthcare AI, Accessibility, Low-Latency Voice  
**MVP stack:** Expo/React Native + TypeScript, FastAPI/Python, Azure Speech Pronunciation Assessment, OpenAI transcription/LLM, ElevenLabs streaming TTS, Supabase

---

## 1. Vision

VocalCraft AI is an AI speech-practice companion that turns a spoken attempt into an immediate, visible path to improvement. Instead of giving users a generic transcript or a score after they leave therapy, it creates a **Speech Mirror**: the user says a phrase, sees the specific word or sound that needs work, hears a warm coach demonstrate the adjustment, and retries while the improvement is still tangible.

The core hackathon claim is simple:

> **Speak. See what changed. Hear how to fix it. Feel the improvement—within one session.**

VocalCraft is intended to support at-home practice between sessions with a speech-language pathologist (SLP). It is not a diagnostic or treatment-replacement product.

### 1.1 The award-winning demo moment

1. Maya selects **“Order a coffee with confidence”** and starts with a short `/r/` warm-up.
2. She says: “Red robin runs rapidly.”
3. The screen becomes a live Speech Mirror: `rapidly` glows amber, the `/r/` marker reads **61**, and the coach says, “Strong start—round your tongue slightly more on _rapidly_.”
4. Maya retries. The word shifts to blue/green and the score rises to **84**.
5. She enters a coffee-shop roleplay with a **Calm → Busy** stress dial and completes an order.
6. A shareable **Before → After** card shows the improvement in clarity and conversational flow.

This flow demonstrates meaningful AI evaluation, real-time voice interaction, an emotional user payoff, and a product story judges can understand immediately.

---

## 2. Target users

### Alex — rebuilding clarity after stroke

Alex needs short, low-pressure practice that makes articulation progress concrete. He does not want to decode clinical charts.

**Story:** As a recovery patient, I want to see the exact word or sound to retry and hear a quick example, so I can make one useful correction immediately.

### Maya — practising fluency and confidence

Maya wants to rehearse everyday moments privately before facing them in public.

**Story:** As a fluency trainee, I want to practise a realistic conversation with a non-judgmental voice coach, so I can build confidence at a pace I control.

### Dr. Vance — seeing home-practice evidence

Dr. Vance wants a concise picture of completed practice, not a replacement for their clinical judgement.

**Story:** As an SLP, I want to review the words, sessions, and trends a patient practised, so I can make our next appointment more focused.

---

## 3. MVP experience

### 3.1 Speech Mirror — the hero feature

The active practice screen has one job: make a coaching loop feel magical and understandable.

- A single mission is displayed: “Make your `R` sound land clearly.”
- The prompt is shown as large, tappable words; the coach can read it aloud.
- A large press-and-hold mic control and reactive waveform make speaking feel immediate.
- After every attempt, target words are marked as **nailed**, **try again**, or **not enough audio**. Color is supported by icons and labels.
- Tapping a marked word opens a compact card with the coach’s model pronunciation, the user’s score, and one retry action.
- The coach gives one encouragement and one actionable cue—not a paragraph of criticism.
- A progress rail shows attempts `1 of 3`, allowing the user to see a near-term finish line.

### 3.2 ClearSpeak drill

ClearSpeak is a scripted exercise, starting with `/r/` phrases because it makes phoneme-level feedback visually compelling.

| Element    | MVP behaviour                                                                                           |
| ---------- | ------------------------------------------------------------------------------------------------------- |
| Prompt set | `red`, `rain`, `road`, then “Red robin runs rapidly.”                                                   |
| Assessment | Audio plus the expected phrase is sent to Azure Speech Pronunciation Assessment at phoneme granularity. |
| Feedback   | Show word/phoneme accuracy, fluency, completeness, and prosody where returned.                          |
| Correction | Select the lowest meaningful target-word signal; coach demonstrates a retry cue.                        |
| Completion | Three scored tries per phrase or user skips; final card shows best attempt.                             |

The UI must label results **practice feedback**, not diagnosis or clinical accuracy.

### 3.3 Scenario Sprint — voice roleplay

Scenario Sprint demonstrates that the product extends beyond reading a sentence.

MVP scenarios:

1. **Coffee Shop** — place an order and correct a small misunderstanding.
2. **Job Interview** — introduce yourself and describe one achievement.
3. **Emergency Call** — clearly state a location and need; presented only as a simulated communication exercise.

The user selects a stress level:

- **Calm:** coach pauses, repeats prompts, and uses short turns.
- **Busy:** coach responds more quickly and introduces one clarification request.

After each response, the app shows **Conversation Flow**, not a pronunciation grade. Flow combines pace, internal long pauses, filler words, and available prosody data. The coach responds to the strongest observed signal, for example: “Your message was clear. Take one small breath before the next sentence.”

### 3.4 Before → After reveal

At the end of any mission, a full-screen result turns raw metrics into a satisfying payoff:

- Best `R` practice score: `61 → 84`
- Pace: `174 → 142 WPM`
- Fewer long pauses: `2 → 0`
- Coach summary: one celebration and the next recommended mission
- Buttons: **Replay improvement**, **Try the next challenge**, and **Save progress**

This is the primary screenshot, demo, and social-pitch moment.

### 3.5 Lightweight progress home

The home screen is deliberately small: today’s mission, current streak, last improvement card, and one “continue practising” button. It borrows the useful continuity pattern of progress dashboards without becoming a data-heavy admin view.

---

## 4. Functional requirements

### F1. Record and analyse a spoken attempt

- User can start/stop a recording and see microphone-level feedback.
- Each attempt supports up to 20 seconds of speech.
- The app posts audio and its reference phrase (for drills) to the backend.
- The result contains the transcript, assessment scores, target-word feedback, and one coach response.
- A failed recording offers retry and never creates a fabricated score.

### F2. Generate real scoring evidence

For **scripted drills**, FastAPI calls Azure Speech Pronunciation Assessment with:

- the audio stream;
- expected phrase;
- phoneme granularity;
- comprehensive assessment and prosody enabled.

The service response is the source of truth for `AccuracyScore`, `FluencyScore`, `CompletenessScore`, `ProsodyScore` when returned, `PronScore`, word errors, and phoneme results. OpenAI transcription may provide display transcript/timestamps; it is never used as a pronunciation score.

For **roleplays**, FastAPI calculates only transparent communication signals:

- pace = recognised words ÷ active voiced seconds × 60;
- filler count = configured transcript matches (`um`, `uh`, `like`, `you know`);
- long pauses = internal voice-activity gaps ≥1.5 seconds;
- pitch range / visual energy = optional audio-signal visualization.

### F3. Deliver the AI coach response

1. FastAPI turns metrics into a compact, structured context: target phrase, weak word/phoneme, scores, pace, pauses, and user-selected scenario.
2. The LLM returns exactly `encouragement`, `one_coaching_cue`, and `next_prompt`.
3. ElevenLabs Real-time TTS streams the coach’s voice as soon as text is available.
4. The client plays streamed audio while rendering the same coach text.

The coach must be concise, warm, and never diagnose, prescribe, shame, or imply certainty beyond the returned measurement.

### F4. Show an emotionally legible result

- The user sees word-level/phoneme feedback in a drill before seeing an aggregate score.
- Only comparable attempts are used in before/after cards (same target phrase or same scenario metric family).
- Missing data appears as `Not enough audio` or `Unavailable`, never `0`.
- Results persist locally/in Supabase for the demo account and reload after relaunch.

---

## 5. System overview

```text
Expo mobile app
  └─ record spoken turn, render Speech Mirror, play coach audio
        │
        ▼
FastAPI orchestration
  ├─ validate and store turn
  ├─ Azure Pronunciation Assessment (drills)
  ├─ OpenAI transcription + structured coach prompt (roleplay / transcript)
  ├─ lightweight pace, filler, pause, pitch analysis
  └─ ElevenLabs streaming TTS
        │
        ▼
Supabase
  └─ sessions, attempts, scores, before/after snapshots
```

### Why this architecture wins the demo

- Azure provides a real phoneme-aware score, rather than an invented “AI confidence” number.
- The LLM explains a concrete score in human language.
- ElevenLabs makes the explanation feel like a real coach instead of an analytics dashboard.
- The mobile UI makes improvement visible before the user leaves the exercise.

---

## 6. API requirements

### `POST /api/v1/attempts/assess`

Creates and scores a drill attempt.

`multipart/form-data` fields:

```text
audio: <recorded m4a/wav/webm>
session_id: uuid
prompt_id: r-sentence-03
reference_text: Red robin runs rapidly.
mode: drill
```

Response:

```json
{
  "attempt_id": "uuid",
  "transcript": "Red robin runs rapidly.",
  "clear_speak": {
    "overall": 84,
    "accuracy": 86,
    "fluency": 81,
    "completeness": 100,
    "prosody": 77
  },
  "word_feedback": [
    {
      "word": "rapidly",
      "status": "retry",
      "accuracy": 61,
      "phonemes": [{ "symbol": "r", "accuracy": 61 }]
    }
  ],
  "coach": {
    "encouragement": "Your pacing was much steadier.",
    "one_coaching_cue": "Round the start of rapidly, then release it smoothly.",
    "next_prompt": "Try rapidly once more.",
    "audio_stream_url": "https://..."
  }
}
```

### `POST /api/v1/attempts/flow`

Scores a roleplay response and advances the scenario intent.

```json
{
  "session_id": "uuid",
  "scenario": "coffee_shop",
  "stress_level": "calm",
  "audio_upload_id": "uuid"
}
```

The response includes transcript, WPM, filler count, long-pause count, optional prosody/pitch display, normalized `conversation_flow`, next scenario prompt, and streamed coach audio.

---

## 7. Data to retain for the MVP

| Entity                  | Important fields                                                                                                 |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `sessions`              | user, mission, mode, scenario, stress level, started/completed times                                             |
| `attempts`              | session, prompt/reference text, transcript, sequence, audio key if enabled                                       |
| `assessment_results`    | Azure aggregate scores, raw assessment JSON, active speech seconds, WPM, filler/long-pause counts, pitch summary |
| `word_feedback`         | attempt, word, status, accuracy, error type, phoneme details                                                     |
| `coach_turns`           | attempt, encouragement, cue, next prompt, TTS audio key/status                                                   |
| `achievement_snapshots` | first/best comparable attempt, metric delta, display copy                                                        |

---

## 8. 48-hour build order

| Hours | Build                                                     | Demo proof                                               |
| ----- | --------------------------------------------------------- | -------------------------------------------------------- |
| 0–6   | Expo shell, FastAPI, Supabase, test Azure/ElevenLabs keys | One fixture audio request returns an Azure assessment.   |
| 6–16  | ClearSpeak `/r/` drill and `POST /attempts/assess`        | A highlighted target word receives a real phoneme score. |
| 16–26 | Coach prompt and ElevenLabs streaming TTS                 | User hears a specific correction within a short beat.    |
| 26–34 | Speech Mirror visual, retry loop, before/after card       | Score visibly rises on a prepared demonpm in retry.      |
| 34–42 | Coffee Shop Scenario Sprint and Flow Score                | Voice roleplay feels responsive and adapts to Calm/Busy. |
| 42–48 | Demo polish, seeded fallback, pitch rehearsal             | A 90-second live or recorded demo tells the full story.  |

---

## 9. Success criteria

1. A judge can understand the product value without reading an explanation: a word is highlighted, the coach explains it, and the next attempt visibly improves.
2. The `/r/` drill uses Azure phoneme-level assessment rather than a transcript-confidence proxy.
3. The first coach audio starts within roughly 1.5 seconds of a completed short attempt on the demo network; a visible processing state covers slower responses.
4. The Coffee Shop roleplay demonstrates adaptive, voice-first practice beyond reading a fixed script.
5. The final Before → After card makes the user’s improvement emotionally and visually clear.
6. Demo fallbacks ensure the journey can be shown even if a provider is temporarily unavailable.
