# VocalFlow

## Inspiration

Speech therapy is often limited to a small number of clinical hours each week, while the most important practice happens at home—alone, without immediate feedback. We wanted to make that practice feel less like filling out homework and more like having a calm, encouraging coach in your pocket.

VocalFlow is inspired by the moment a person realizes they have improved. Instead of hiding speech data in a dashboard, we make the change visible and audible right after someone speaks.

## What it does

VocalFlow is an AI speech-practice companion built around a **Speech Mirror**. A user says a target phrase, sees which word or sound needs another try, hears a concise coaching cue, and immediately retries.

Our hero flow is ClearSpeak: the user practises an `/r/` phrase such as “Red robin runs rapidly.” VocalFlow highlights a weak word, explains one small adjustment, and then shows a Before → After improvement card when the user retries.

We also built Scenario Sprint, a voice roleplay mode for real-world practice. In the Coffee Shop scenario, users can choose a Calm or Busy environment, order a drink, respond to a clarification, and see transparent delivery signals such as pace, fillers, and long pauses.

## How we built it

The mobile experience is designed in React Native with Expo and TypeScript. It records a short spoken turn, renders a local waveform, and presents the Speech Mirror, word-level feedback, coach playback, and achievement reveal.

Our FastAPI backend orchestrates the voice pipeline:

- Azure Speech Pronunciation Assessment scores scripted drills against the expected phrase at word and phoneme granularity.
- OpenAI transcription provides roleplay text for delivery analysis and contextual coaching.
- A structured LLM response turns measured signals into one warm, actionable cue.
- ElevenLabs streams the coach’s voice back to the user with low latency.
- Supabase persists sessions, attempts, feedback, and comparable Before → After snapshots.

The critical design decision was separating real pronunciation feedback from conversational delivery feedback. ClearSpeak uses Azure’s phoneme-aware assessment; Scenario Sprint uses an explicitly non-clinical Conversation Flow score based on pace, filler words, internal pauses, and available prosody signals.

## Challenges we ran into

The hardest problem was making the product feel immediate without pretending that every score is equally trustworthy. A transcription confidence score is not a pronunciation score, so we needed a dedicated assessment service for scripted drills and a separate, transparent score for unscripted roleplay.

We also had to balance low latency with meaningful coaching. Rather than asking an LLM to invent feedback from raw audio, the backend first identifies one measurable focus signal. The model only turns that fact into empathetic, concise language.

Finally, we designed for a live-demo reality: audio providers can be slow or unavailable. VocalFlow keeps the spoken phrase visible while analysis runs, shows coach text even when audio playback fails, and has clearly isolated demo fixtures for rehearsed fallbacks.

## Accomplishments that we're proud of

- Turning a complex speech-analysis pipeline into a single memorable loop: **speak → see → hear → improve**.
- Using real phoneme-aware assessment for the `/r/` practice drill rather than presenting a generic AI confidence number as clinical feedback.
- Making improvement emotionally legible with a Before → After reveal instead of a dense report of metrics.
- Designing one voice experience that supports both focused practice and real-world confidence-building roleplay.
- Keeping the coach warm and specific: one celebration, one correction, and one next step.

## What we learned

The most useful feedback is not necessarily the most detailed feedback. Users benefit more from one clear, repeatable cue than from five charts competing for attention.

We also learned that speech AI needs precise language. A score can be valuable when users understand what it measures; it becomes misleading when it is framed as a diagnosis. That distinction shaped every part of VocalFlow’s product and technical design.

## What's next for VocalFlow

Next, we want to expand the prompt library beyond `/r/` drills, add more roleplay settings such as job interviews and emergency communication practice, and let users build a personalized progression from the sounds and scenarios they find hardest.

We would also explore clinician-sharing controls, longitudinal progress views, multilingual assessment, and validated acoustic models for use cases beyond scripted pronunciation practice. Our goal is to make high-quality speech practice more available between therapy sessions while keeping clinicians—not algorithms—in charge of care.
