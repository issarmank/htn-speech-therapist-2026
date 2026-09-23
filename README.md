# Parrdon Us 👋

Live Site: https://www.parrdon.us/welcome
Backend Repo: https://github.com/AmruthArunkumar/htn-speech-therapist-2026-backend

Parrdon Us is an AI speech-practice companion built around a **Speech Mirror**: a user says a target phrase, sees which word or sound needs another try, hears a concise coaching cue, and immediately retries — making improvement visible and audible right after someone speaks, instead of hiding it in a dashboard.

## Key points

- **Inspiration** — speech therapy practice mostly happens at home, alone, without feedback; Parrdon Us aims to feel like a calm, encouraging coach in your pocket rather than homework.
- **ClearSpeak (hero flow)** — scripted `/r/` pronunciation drills (e.g. "Red robin runs rapidly"); highlights the weak word, explains one small adjustment, and shows a Before → After improvement card on retry.
- **Scenario Sprint** — voice roleplay for real-world practice (e.g. a Coffee Shop scenario with Calm or Busy environments); surfaces transparent delivery signals like pace, fillers, and long pauses.
- **Mobile app** — React Native + Expo + TypeScript. Records a spoken turn, renders a local waveform, and presents the Speech Mirror, word-level feedback, coach playback, and an achievement reveal.
- **Backend pipeline** — FastAPI orchestrates the voice pipeline: Gemini and ElevenLabs score scripted drills and generate feedback on the audio, and ElevenLabs streams the coach's voice back with low latency.
- **Design decision: separate scoring** — ClearSpeak uses phoneme-aware pronunciation assessment; Scenario Sprint uses an explicitly non-clinical "Conversation Flow" score (pace, fillers, pauses, prosody) — never presented as a diagnosis.
- **Design philosophy** — one clear, repeatable cue beats a dense report of metrics: one celebration, one correction, one next step.

## Tech stack

- **Mobile app:** React Native, Expo (Expo Router), TypeScript
- **Backend:** FastAPI (Python) — [separate repo](https://github.com/AmruthArunkumar/htn-speech-therapist-2026-backend)
- **Speech scoring & coaching:** Gemini 3.5 Flash
- **Voice:** ElevenLabs API
- **Database:** MongoDB

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. (Optional) Point at a live backend by setting `EXPO_PUBLIC_API_URL` in `.env` — see `src/constants/config.ts`. Without it, the app runs in demo mode against local fixtures.

3. Start the app

   ```bash
   npx expo start
   ```
