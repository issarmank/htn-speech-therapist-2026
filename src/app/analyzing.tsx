import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LevelMeter } from '@/components/level-meter';
import { Colors, ContentColumn, Layout, Radius, Type } from '@/constants/theme';
import { api } from '@/features/api/client';
import { ApiError } from '@/features/api/contracts';
import { newestReviewId } from '@/features/history/use-reviews';
import { contextById } from '@/features/practice/contexts';
import { lastResult } from '@/features/session/last-result';
import { recordTimings } from '@/features/hood/last-run';

/**
 * The backend runs Transcribe → Measure → Coach → Speak inside one HTTP call
 * and reports `timings_ms` only after it finishes, so this progress is an
 * honest estimate, labelled as one. The last stage stays active until the
 * response actually lands — it never shows all-done early.
 */
const STAGES = [
  { key: 'stt', label: 'Transcribing your words', estimate: 1_400 },
  { key: 'metrics', label: 'Measuring pace and pauses', estimate: 300 },
  { key: 'coach', label: 'Writing your coaching note', estimate: 2_200 },
  { key: 'tts', label: 'Preparing the spoken cue', estimate: 700 },
] as const;

const SLOW_AFTER_MS = 12_000;

export default function Analyzing() {
  const params = useLocalSearchParams<{ uri?: string; context?: string; speak?: string }>();
  const speak = params.speak === 'true';
  const context = contextById(params.context);

  const [stage, setStage] = useState(0);
  const [slow, setSlow] = useState(false);
  const abortRef = useRef(false);

  const stages = speak ? STAGES : STAGES.slice(0, 3);

  // Estimated stage advance. Stops at the last stage and waits there.
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    let elapsed = 0;
    stages.slice(0, -1).forEach((entry, index) => {
      elapsed += entry.estimate;
      timers.push(setTimeout(() => setStage(index + 1), elapsed));
    });
    timers.push(setTimeout(() => setSlow(true), SLOW_AFTER_MS));
    return () => timers.forEach(clearTimeout);
  }, [stages]);

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility('Analyzing your recording');
  }, []);

  useEffect(() => {
    if (!params.uri) {
      router.replace('/(app)/practice');
      return;
    }

    let active = true;

    (async () => {
      // Captured before the call so the storage check can prove a new review
      // row appeared. Comparing ids rather than timestamps keeps it immune to
      // device clock skew.
      const previousReviewId = await newestReviewId();

      try {
        const response = await api.analyze({
          uri: params.uri!,
          context: context.value ?? undefined,
          speak,
        });

        if (!active || abortRef.current) return;

        lastResult.set({
          response,
          context: context.value,
          previousReviewId,
          receivedAt: Date.now(),
        });
        recordTimings(response.timings_ms, response.metrics, speak);

        AccessibilityInfo.announceForAccessibility(
          `Analysis ready. Focus: ${response.feedback.primary_focus}.`,
        );
        router.replace('/results');
      } catch (error) {
        if (!active || abortRef.current) return;
        // A 401 has already signed us out and redirected; anything else goes
        // back to Practice with the reason attached.
        if (error instanceof ApiError && error.code === 'UNAUTHORIZED') return;

        router.replace({
          pathname: '/(app)/practice',
          params: {
            context: params.context ?? 'interview',
            error: error instanceof ApiError ? error.message : 'Something went wrong.',
          },
        });
      }
    })();

    return () => {
      active = false;
    };
  }, [params.uri, params.context, context.value, speak]);

  return (
    <SafeAreaView style={styles.screen}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Cancel analysis"
        hitSlop={12}
        style={styles.cancel}
        onPress={() => {
          abortRef.current = true;
          router.replace({
            pathname: '/(app)/practice',
            params: { context: params.context ?? 'interview' },
          });
        }}>
        <Text style={styles.cancelText}>Cancel</Text>
      </Pressable>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.column}>
          <LevelMeter level={0.22} active />

          <Text style={styles.title}>Listening closely…</Text>

          <View style={styles.stages}>
            {stages.map((entry, index) => {
              const done = index < stage;
              const current = index === stage;
              return (
                <View key={entry.key} style={styles.stageRow}>
                  <View
                    style={[styles.dot, done && styles.dotDone, current && styles.dotActive]}
                  />
                  <Text
                    style={[styles.stageLabel, (done || current) && styles.stageLabelActive]}>
                    {entry.label}
                  </Text>
                </View>
              );
            })}
          </View>

          <Text style={styles.caption}>
            {slow
              ? 'Taking a little longer than usual…'
              : 'Estimated progress. Real timings appear in Under the hood.'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.canvas },
  content: { flexGrow: 1, padding: Layout.page, justifyContent: 'center' },
  column: { ...ContentColumn, gap: Layout.section },
  // Pinned to the screen, so centring the content cannot push it off-screen.
  cancel: { position: 'absolute', zIndex: 1, top: Layout.page, left: Layout.page },
  cancelText: { ...Type.caption, color: Colors.muted },
  title: { ...Type.title2, color: Colors.ink },
  stages: { gap: 18 },
  stageRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  dot: {
    width: 12,
    height: 12,
    borderRadius: Radius.pill,
    borderWidth: 2,
    borderColor: Colors.line,
  },
  dotActive: { backgroundColor: Colors.violet, borderColor: Colors.violet },
  dotDone: { backgroundColor: Colors.violetTint, borderColor: Colors.violet },
  stageLabel: { ...Type.body, color: Colors.muted, flex: 1 },
  stageLabelActive: { color: Colors.ink },
  caption: { ...Type.caption, color: Colors.muted },
});
