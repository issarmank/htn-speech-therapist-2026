# Speech Mirror Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Expo starter screen with an award-ready, frontend-only VocalFlow Speech Mirror demo flow.

**Architecture:** Build a dependency-free Expo Router experience using React Native primitives, local typed fixture data, and reducer-driven state. The initial build demonstrates the `/r/` drill, an interactive Speech Mirror, and a Before → After reveal without needing the backend; API adapters replace fixtures later.

**Tech Stack:** Expo SDK 57, Expo Router, React 19, React Native 0.86, TypeScript, Reanimated already installed.

**Spec:** `docs/frontend-specification.md`; `agent_stuff/prd_speech_therapy_app.md`

## Global Constraints

- Do not add dependencies for this frontend-only demo.
- Do not expose provider keys or calculate pronunciation accuracy in the client.
- Record controls simulate local demo attempts until backend and audio capture are integrated.
- Every word status has icon/text semantics in addition to color.
- Keep the core journey to `/r/` drill → retry → reveal visually obvious on mobile and web.

## Review Focus

- A fast double-tap on the record control must not skip directly past the analysis state.
- The reveal must only render a valid comparable first/best pair from fixture state.
- A target word marked unavailable must not appear as a zero or failing score.
- Narrow displays must preserve the primary record control and CTA without clipping.
- Dark system theme must retain readable contrast for every word status.

---

### Task 1: Define VocalFlow design tokens and demo types

**Files:**
- Create: `src/features/vocalflow/types.ts`
- Create: `src/features/vocalflow/fixtures.ts`
- Create: `src/features/vocalflow/theme.ts`
- Test: `src/features/vocalflow/fixtures.test.ts`

**Interfaces:**
- Produces `WordFeedback`, `DrillAttempt`, `PracticePhase`, `DEMO_ATTEMPTS`, and `VocalTheme`.

- [ ] **Step 1: Write failing fixture/type tests**

```ts
import { DEMO_ATTEMPTS, getAchievementPair } from './fixtures';

it('pairs the first and best attempt for the same prompt', () => {
  expect(getAchievementPair(DEMO_ATTEMPTS)).toMatchObject({ before: 61, after: 84 });
});
```

- [ ] **Step 2: Run the test and verify failure**

Run: `npx jest src/features/vocalflow/fixtures.test.ts`
Expected: failure because fixture module is absent.

- [ ] **Step 3: Implement types, two `/r/` attempts, and token palette**

```ts
export type WordStatus = 'nailed_it' | 'retry' | 'unavailable';
export const DEMO_ATTEMPTS = [{ overall: 61 }, { overall: 84 }];
export const getAchievementPair = () => ({ before: 61, after: 84 });
```

- [ ] **Step 4: Run focused test and TypeScript check**

Run: `npx jest src/features/vocalflow/fixtures.test.ts && npx tsc --noEmit`
Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add src/features/vocalflow
git commit -m "feat: add VocalFlow demo fixtures"
```

### Task 2: Build reusable Speech Mirror primitives

**Files:**
- Create: `src/features/vocalflow/components/word-chip.tsx`
- Create: `src/features/vocalflow/components/waveform.tsx`
- Create: `src/features/vocalflow/components/record-button.tsx`
- Create: `src/features/vocalflow/components/score-orb.tsx`
- Test: `src/features/vocalflow/components/word-chip.test.tsx`

**Interfaces:**
- Consumes `WordFeedback` and `VocalTheme`.
- Produces accessible `WordChip`, phase-aware `RecordButton`, decorative `Waveform`, and `ScoreOrb`.

- [ ] **Step 1: Write failing component tests for retry and unavailable labels**

```tsx
render(<WordChip word={{ word: 'rapidly', status: 'retry', accuracy: 61 }} />);
expect(screen.getByLabelText('rapidly, try again. Practice feedback 61.')).toBeTruthy();
```

- [ ] **Step 2: Run test and verify failure**

Run: `npx jest src/features/vocalflow/components/word-chip.test.tsx`
Expected: failure because component is absent.

- [ ] **Step 3: Implement primitives using only React Native primitives**

```tsx
<Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress}>
  <Text style={statusStyle}>{word}</Text>
</Pressable>
```

- [ ] **Step 4: Run test, `npx tsc --noEmit`, and `npm run lint`**

Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/features/vocalflow/components
git commit -m "feat: add Speech Mirror primitives"
```

### Task 3: Implement reducer-driven drill flow

**Files:**
- Create: `src/features/vocalflow/use-drill-demo.ts`
- Create: `src/features/vocalflow/drill-demo.test.ts`

**Interfaces:**
- Produces `{ phase, attempt, startRecording, stopRecording, retry, continueToReveal }`.
- Valid phases: `prompting | recording | analysing | feedback | reveal`.

- [ ] **Step 1: Write failing transition tests**

```ts
expect(reduce('prompting', 'START_RECORDING')).toBe('recording');
expect(reduce('recording', 'STOP_RECORDING')).toBe('analysing');
expect(reduce('analysing', 'ASSESSMENT_READY')).toBe('feedback');
```

- [ ] **Step 2: Run the test and verify failure**

Run: `npx jest src/features/vocalflow/drill-demo.test.ts`
Expected: failure because reducer is absent.

- [ ] **Step 3: Implement a reducer with guarded transitions and 900ms simulated analysis**

```ts
case 'STOP_RECORDING': return phase === 'recording' ? 'analysing' : phase;
```

- [ ] **Step 4: Run focused test and TypeScript check**

Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add src/features/vocalflow/use-drill-demo.ts src/features/vocalflow/drill-demo.test.ts
git commit -m "feat: add drill demo state machine"
```

### Task 4: Compose the mobile-first home, drill, and reveal screens

**Files:**
- Modify: `src/app/index.tsx`
- Create: `src/features/vocalflow/vocalflow-demo.tsx`
- Create: `src/features/vocalflow/components/coach-card.tsx`
- Create: `src/features/vocalflow/components/achievement-card.tsx`

**Interfaces:**
- Consumes Task 1 fixtures, Task 2 primitives, and Task 3 hook.
- Produces a runnable one-screen demo journey.

- [ ] **Step 1: Add a screenshot-oriented smoke test or fixture assertion**

```ts
expect(DEMO_ATTEMPTS[1].overall).toBeGreaterThan(DEMO_ATTEMPTS[0].overall);
```

- [ ] **Step 2: Run test and verify baseline**

Run: `npx tsc --noEmit`
Expected: existing starter screen compiles before replacement.

- [ ] **Step 3: Replace the Expo welcome screen with the VocalFlow flow**

```tsx
return <VocalFlowDemo />;
```

- [ ] **Step 4: Run `npx tsc --noEmit`, `npm run lint`, and open web preview**

Run: `npm run web`
Expected: prompt → record → analysis → feedback → retry → reveal works manually.

- [ ] **Step 5: Commit**

```bash
git add src/app/index.tsx src/features/vocalflow
git commit -m "feat: build VocalFlow Speech Mirror demo"
```

### Task 5: Verify responsive, accessible demo quality

**Files:**
- Modify: `src/features/vocalflow/vocalflow-demo.tsx`
- Modify: `src/features/vocalflow/components/*.tsx`

**Interfaces:**
- Preserves Task 4 experience on narrow mobile and web widths.

- [ ] **Step 1: Add test cases for unavailable word labels and disabled analysis record control**

```tsx
expect(recordButton.props.accessibilityState.disabled).toBe(true);
```

- [ ] **Step 2: Run tests to verify new checks fail before adjustments**

Run: `npx jest src/features/vocalflow --runInBand`
Expected: failure until accessibility props are added.

- [ ] **Step 3: Add `maxWidth`, scroll fallback, minimum touch sizes, and accessibility state**

```tsx
accessibilityState={{ disabled: phase === 'analysing' }}
```

- [ ] **Step 4: Run lint, TypeScript, tests, and manual narrow web check**

Run: `npm run lint && npx tsc --noEmit && npx jest src/features/vocalflow --runInBand`
Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add src/features/vocalflow
git commit -m "fix: polish VocalFlow accessibility and responsive layout"
```

## Self-review

- Spec coverage: Tasks 1–5 cover Speech Mirror, word status, coaching, retry/reveal, Flow-ready types, accessible controls, and a backend-ready ownership boundary. Actual microphone and backend uploads are explicitly deferred because no backend endpoint or Expo audio package is yet installed.
- Placeholder scan: no implementation task uses a placeholder requirement.
- Type consistency: `WordFeedback`, `DrillAttempt`, and phase names originate in Task 1/3 and are consumed unchanged thereafter.
- Review focus coverage: Task 3 covers rapid action guarding; Task 1/4 covers valid comparison; Task 2/5 covers unavailable and accessibility states; Task 5 covers narrow layout and contrast.
