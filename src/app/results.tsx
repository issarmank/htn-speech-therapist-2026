import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GradientButton } from '@/components/gradient-button';
import { ResultsView } from '@/components/results-view';
import { Colors, ContentColumn, Layout, Radius, Type } from '@/constants/theme';
import { parseServerDate } from '@/features/api/dates';
import { runStorageCheck } from '@/features/hood/storage-check';
import { labelForContextValue } from '@/features/practice/contexts';
import { useCueAudio } from '@/features/results/use-cue-audio';
import {
  fromAnalysis,
  selectedReview,
  type ResultView,
} from '@/features/results/view-source';
import { lastResult } from '@/features/session/last-result';

export default function Results() {
  const [view] = useState<ResultView | null>(() => {
    // A row opened from History wins; otherwise this is a run that just
    // finished and is sitting in the in-memory handoff.
    const fromHistory = selectedReview.take();
    if (fromHistory) return fromHistory;

    const run = lastResult.get();
    return run ? fromAnalysis(run.response, run.context) : null;
  });

  const audio = useCueAudio(view?.cueBase64 ?? null, view?.clipUrl ?? null);

  // Storage verification runs once per fresh result: the analyze call swallows
  // a failed Mongo write and a failed S3 upload, so the only way to know is to
  // read the history back.
  useEffect(() => {
    if (!view?.fresh) return;
    const run = lastResult.get();
    if (run) void runStorageCheck(run.previousReviewId);
  }, [view]);

  // The cue autoplays once on arrival; replay stays available.
  useEffect(() => {
    if (view?.fresh && view.cueBase64 && audio.available) audio.play();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, audio.available]);

  if (!view) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>That result is no longer available.</Text>
          <GradientButton label="Back to practice" onPress={() => router.replace('/(app)')} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.context}>
            {labelForContextValue(view.contextValue)}
            {view.createdAt ? ` · ${parseServerDate(view.createdAt).toLocaleDateString()}` : ''}
          </Text>
          <Pressable accessibilityRole="button" hitSlop={12} onPress={() => router.back()}>
            <Text style={styles.close}>Close</Text>
          </Pressable>
        </View>

        <ResultsView
          view={view}
          action={
            audio.available ? (
              <Pressable accessibilityRole="button" style={styles.hear} onPress={audio.play}>
                <Text style={styles.hearText}>
                  {view.cueBase64 ? 'Hear it' : 'Play your recording'}
                </Text>
              </Pressable>
            ) : audio.failed ? (
              <Text style={styles.playbackFailed}>Playback failed. The text above still stands.</Text>
            ) : null
          }
        />
      </ScrollView>

      <View style={styles.footer}>
        <GradientButton
          label={view.fresh ? 'Try again' : 'Practise this again'}
          onPress={() => router.replace('/(app)/practice')}
        />
        <Pressable accessibilityRole="button" onPress={() => router.replace('/(app)')}>
          <Text style={styles.done}>Done</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.canvas },
  content: { ...ContentColumn, padding: Layout.page, gap: Layout.section, paddingBottom: 32 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 16 },
  context: { ...Type.caption, color: Colors.muted, flexShrink: 1 },
  close: { ...Type.caption, color: Colors.violetDeep },
  hear: {
    alignSelf: 'flex-start',
    minHeight: Layout.minTouch,
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderRadius: Radius.cta,
    backgroundColor: Colors.surface,
  },
  hearText: { ...Type.bodyStrong, color: Colors.violetDeep },
  playbackFailed: { ...Type.caption, color: Colors.muted },
  footer: {
    ...ContentColumn,
    padding: Layout.page,
    paddingTop: 12,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.line,
    backgroundColor: Colors.canvas,
  },
  done: { ...Type.caption, color: Colors.muted, textAlign: 'center' },
  empty: { ...ContentColumn, flex: 1, padding: Layout.page, justifyContent: 'center', gap: 16 },
  emptyText: { ...Type.body, color: Colors.body },
});
