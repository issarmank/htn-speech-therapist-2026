import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Banner } from '@/components/banner';
import { LevelMeter } from '@/components/level-meter';
import { MAX_RECORD_SECONDS, MIN_RECORD_SECONDS } from '@/constants/backend';
import { MAX_BODY_SCALE, useResponsive } from '@/constants/responsive';
import { Colors, ContentColumn, Layout, Radius, Shadow, Type } from '@/constants/theme';
import { usePracticeRecorder } from '@/features/audio/use-practice-recorder';
import { PRACTICE_CONTEXTS, contextById } from '@/features/practice/contexts';
import { promptsFor } from '@/features/practice/prompts';

function clock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function Practice() {
  const params = useLocalSearchParams<{ context?: string; error?: string }>();
  const [contextId, setContextId] = useState(params.context ?? 'interview');
  const context = contextById(contextId);

  // An index rather than a stored string: the prompt is derived, so changing
  // context never needs an effect to re-sync it, and "New one" cycles instead
  // of risking the same prompt twice.
  const [promptSeed, setPromptSeed] = useState(() => Math.floor(Math.random() * 997));
  const prompt = useMemo(() => {
    const pool = promptsFor(context);
    return pool[promptSeed % pool.length];
  }, [context, promptSeed]);
  const [speak, setSpeak] = useState(true);
  // Analyzing hands failures back here rather than dead-ending on its own
  // screen, so the user is already where they need to be to retry.
  const [dismissedError, setDismissedError] = useState<string | null>(null);
  const analyzeError = params.error && params.error !== dismissedError ? params.error : null;
  const [showContexts, setShowContexts] = useState(false);

  // Guards the window between "stop" and the analyzing screen mounting. The
  // analyze endpoint has no idempotency key, so a second submit is the client's
  // problem to prevent.
  const submittingRef = useRef(false);

  const recorder = usePracticeRecorder();
  const recording = recorder.status === 'recording';
  const { isShort: shortScreen } = useResponsive();

  async function toggle() {
    if (submittingRef.current) return;

    if (!recording) {
      recorder.resetIssue();
      await recorder.start();
      return;
    }

    if (!recorder.canStop) return;

    const clip = await recorder.stop();
    if (!clip) return;

    submittingRef.current = true;
    router.push({
      pathname: '/analyzing',
      params: { uri: clip.uri, context: contextId, speak: String(speak) },
    });
    // Released on the way back, so a second session can start.
    setTimeout(() => {
      submittingRef.current = false;
    }, 1_000);
  }

  if (recorder.status === 'permission_denied') {
    return (
      <SafeAreaView style={styles.screen}>
        <ScrollView contentContainerStyle={styles.permission}>
          <View style={styles.permissionCopy}>
            <Text style={styles.permissionTitle}>VocalFlow needs your microphone to listen.</Text>
            <Text style={styles.permissionBody}>
              Recording happens only while you hold a session open.
            </Text>
            <Pressable
              accessibilityRole="button"
              style={styles.permissionButton}
              onPress={() => void Linking.openSettings()}>
              <Text style={styles.permissionButtonText}>Open Settings</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.content}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <View style={styles.topRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: speak }}
              hitSlop={8}
              onPress={() => setSpeak((v) => !v)}>
              <Text style={styles.toggle}>Coach speaks {speak ? 'on' : 'off'}</Text>
            </Pressable>
          </View>

          <View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Practising ${context.label}. Change.`}
              onPress={() => setShowContexts((v) => !v)}>
              <Text style={styles.context}>{context.label} ⌄</Text>
            </Pressable>

            {showContexts ? (
              <View style={styles.contextList}>
                {PRACTICE_CONTEXTS.map((entry) => (
                  <Pressable
                    key={entry.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: entry.id === contextId }}
                    style={[styles.chip, entry.id === contextId && styles.chipSelected]}
                    onPress={() => {
                      setContextId(entry.id);
                      setShowContexts(false);
                    }}>
                    <Text
                      style={[
                        styles.chipText,
                        entry.id === contextId && styles.chipTextSelected,
                      ]}>
                      {entry.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>

          {analyzeError ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${analyzeError}. Tap to dismiss.`}
              onPress={() => setDismissedError(params.error ?? null)}>
              <Banner>{analyzeError}</Banner>
            </Pressable>
          ) : null}

          <View style={styles.promptCard}>
            <Text style={styles.prompt}>{prompt}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Show a different prompt"
              hitSlop={8}
              onPress={() => setPromptSeed((seed) => seed + 1)}>
              <Text style={styles.shuffle}>New one</Text>
            </Pressable>
          </View>

          <View style={styles.meterArea}>
            <LevelMeter level={recording ? recorder.level : 0} active={recording} />
            <Text style={styles.timer}>
              {clock(recorder.secondsElapsed)} / {clock(MAX_RECORD_SECONDS)}
            </Text>
          </View>
        </ScrollView>

        <View style={styles.micArea}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              recording
                ? `Stop recording, ${recorder.secondsElapsed} seconds`
                : 'Start recording'
            }
            accessibilityState={{ disabled: recording && !recorder.canStop }}
            style={[
              styles.mic,
              shortScreen && styles.micCompact,
              recording && styles.micRecording,
              recorder.nearingLimit && styles.micWarning,
            ]}
            onPress={toggle}>
            <View style={recording ? styles.micSquare : styles.micDot} />
          </Pressable>

          <Text style={styles.hint} maxFontSizeMultiplier={MAX_BODY_SCALE}>
            {recorder.status === 'too_short'
              ? `That was too short. Give it at least ${MIN_RECORD_SECONDS} seconds.`
              : recorder.status === 'recording_failed'
                ? 'Recording failed. Try once more.'
                : recording
                  ? recorder.canStop
                    ? 'Tap to stop when you are done.'
                    : 'Keep going…'
                  : 'Say at least a full sentence.'}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.canvas },
  content: { ...ContentColumn, flex: 1, padding: Layout.page },
  // `flexGrow` lets the meter centre itself when there is room and lets the
  // prompt scroll when there is not — on a 568 pt screen or at 130% text.
  scroll: { flexGrow: 1, gap: Layout.gap },
  topRow: { flexDirection: 'row', justifyContent: 'flex-end' },
  toggle: { ...Type.caption, color: Colors.violetDeep },
  context: { ...Type.heading, color: Colors.ink },
  contextList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.chip,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  chipSelected: { backgroundColor: Colors.violet, borderColor: Colors.violet },
  chipText: { ...Type.caption, color: Colors.body },
  chipTextSelected: { color: '#FFFFFF' },

  promptCard: {
    padding: Layout.card,
    borderRadius: Radius.card,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.line,
    gap: 12,
  },
  prompt: { ...Type.heading, color: Colors.ink },
  shuffle: { ...Type.caption, color: Colors.violetDeep, alignSelf: 'flex-end' },

  meterArea: {
    flex: 1,
    minHeight: 96,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  timer: { ...Type.caption, color: Colors.muted, fontVariant: ['tabular-nums'] },

  micArea: { alignItems: 'center', gap: 16, paddingTop: Layout.gap, paddingBottom: Layout.gap },
  mic: {
    width: 88,
    height: 88,
    borderRadius: Radius.pill,
    backgroundColor: Colors.violet,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow,
  },
  // The mic never drops below the 48 dp floor; 76 is as small as it gets.
  micCompact: { width: 76, height: 76 },
  micRecording: { backgroundColor: Colors.violetDeep },
  micWarning: { backgroundColor: Colors.amber },
  micDot: { width: 28, height: 28, borderRadius: Radius.pill, backgroundColor: '#FFFFFF' },
  micSquare: { width: 24, height: 24, borderRadius: 4, backgroundColor: '#FFFFFF' },
  hint: { ...Type.caption, color: Colors.muted, textAlign: 'center' },

  permission: { flexGrow: 1, padding: Layout.page, justifyContent: 'center' },
  permissionCopy: { ...ContentColumn, gap: 16 },
  permissionTitle: { ...Type.title2, color: Colors.ink },
  permissionBody: { ...Type.body, color: Colors.body },
  permissionButton: {
    minHeight: Layout.cta,
    borderRadius: Radius.cta,
    backgroundColor: Colors.violet,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionButtonText: { ...Type.bodyStrong, color: '#FFFFFF' },
});
