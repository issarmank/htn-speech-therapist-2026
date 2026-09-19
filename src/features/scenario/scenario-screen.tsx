import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { assessmentClient } from '@/features/api/client';
import { AssessmentError, type FlowAttemptResult } from '@/features/api/contracts';
import { usePracticeRecorder } from '@/features/audio/use-practice-recorder';
import { createSession, saveSession } from '@/features/session/session-store';
import { useSessionRestore } from '@/features/session/use-session-restore';

type Stage = 'prompting' | 'recording' | 'submitting' | 'feedback' | 'failed';
const id = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export function ScenarioScreen({ sessionId }: { sessionId: string }) {
  const recorder = usePracticeRecorder();
  const { session, setSession, restoring } = useSessionRestore(sessionId);
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState<Stage>('prompting');
  const [result, setResult] = useState<FlowAttemptResult>();
  const [error, setError] = useState<string>();
  const [dismissedRestore, setDismissedRestore] = useState(false);

  useEffect(() => {
    if (!restoring && !session) {
      const next = createSession(sessionId, 'scenario_sprint');
      setSession(next);
      void saveSession(next);
    }
  }, [restoring, session, sessionId, setSession]);

  const activeResult = result ?? (dismissedRestore ? undefined : session?.flowResult);
  const activeBusy = busy || (!dismissedRestore && session?.stress === 'busy');
  const displayStage = activeResult && stage === 'prompting' ? 'feedback' : stage;

  const start = async () => { setError(undefined); if (await recorder.start()) setStage('recording'); };
  const stopAndSubmit = async () => {
    const clip = await recorder.stop();
    if (!clip) return;
    setStage('submitting');
    try {
      const assessment = await assessmentClient.assessFlow({ clipUri: clip.uri, sessionId, promptId: session?.promptId ?? 'coffee-shop-order', idempotencyKey: id() }, activeBusy);
      setResult(assessment);
      setDismissedRestore(false);
      const next = { ...(session ?? createSession(sessionId, 'scenario_sprint')), attemptIds: [...(session?.attemptIds ?? []), assessment.attempt_id], flowResult: assessment, stress: activeBusy ? 'busy' as const : 'calm' as const, intent: assessment.next_intent };
      setSession(next);
      await saveSession(next);
      setStage('feedback');
    } catch (reason) {
      setError(reason instanceof AssessmentError ? reason.message : 'We could not score that turn. Please try again.');
      setStage('failed');
    }
  };
  const retry = () => { setDismissedRestore(true); setResult(undefined); setError(undefined); setStage('prompting'); };
  const chooseBusy = () => { if (displayStage === 'prompting' || displayStage === 'feedback') { setDismissedRestore(true); setBusy(true); setResult(undefined); setStage('prompting'); } };

  if (restoring) return <View style={styles.center}><Text>Setting up Coffee Shop…</Text></View>;
  const prompt = activeResult?.coach.next_prompt ?? (activeBusy ? 'The café is busy. Start your order clearly and confidently.' : 'Hi! What can I get started for you today?');
  return <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.page}>
    <Text style={styles.eyebrow}>SCENARIO SPRINT · COFFEE SHOP</Text>
    <Text style={styles.title}>Order with confidence.</Text>
    <Text style={styles.subtitle}>Practice one turn at a time. Conversation Flow describes pacing and clarity in context—not pronunciation.</Text>
    <View style={styles.modeRow}>
      <Pressable accessibilityRole="button" accessibilityLabel="Choose calm coffee shop" disabled={displayStage === 'recording' || displayStage === 'submitting'} onPress={() => { setBusy(false); retry(); }} style={[styles.mode, !activeBusy && styles.selected]}><Text style={styles.modeText}>Calm</Text></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Choose busy coffee shop" disabled={displayStage === 'recording' || displayStage === 'submitting'} onPress={chooseBusy} style={[styles.mode, activeBusy && styles.selected]}><Text style={styles.modeText}>Busy</Text></Pressable>
    </View>
    <View style={styles.barista}><Text style={styles.baristaLabel}>BARISTA</Text><Text selectable style={styles.baristaText}>{prompt}</Text></View>
    {activeResult && <View style={styles.flowCard}><Text style={styles.flowLabel}>CONVERSATION FLOW</Text><Text style={styles.score}>{activeResult.conversation_flow ?? '—'}</Text><Text style={styles.signals}>{activeResult.signals.wpm ?? '—'} WPM   ·   {activeResult.signals.filler_count ?? '—'} fillers   ·   {activeResult.signals.long_pause_count ?? '—'} long pauses</Text><Text selectable style={styles.coach}>{activeResult.coach.one_coaching_cue}</Text></View>}
    {displayStage === 'submitting' && <Text style={styles.status}>The barista is listening…</Text>}
    {recorder.status === 'permission_denied' && <Text selectable style={styles.error}>VocalFlow needs microphone access to listen. Your Coffee Shop prompt is still ready.</Text>}
    {(recorder.status === 'too_short' || recorder.status === 'recording_failed' || error) && <Text selectable style={styles.error}>{error ?? (recorder.status === 'too_short' ? 'We didn’t catch enough speech. Try a full order.' : 'Recording stopped unexpectedly. Try again.')}</Text>}
    <Pressable accessibilityRole="button" accessibilityLabel={displayStage === 'recording' ? 'Stop and submit coffee shop response' : 'Start recording coffee shop response'} accessibilityState={{ disabled: displayStage === 'submitting' }} disabled={displayStage === 'submitting'} onPress={displayStage === 'recording' ? stopAndSubmit : start} style={[styles.record, displayStage === 'submitting' && styles.disabled]}><Text style={styles.recordText}>{displayStage === 'recording' ? '■  Finish my order' : displayStage === 'submitting' ? '···  Listening' : '◉  Tap to start your order'}</Text></Pressable>
    {(displayStage === 'failed' || recorder.status === 'too_short' || recorder.status === 'recording_failed') && <Pressable accessibilityRole="button" accessibilityLabel="Retry coffee shop turn" onPress={retry} style={styles.secondary}><Text style={styles.secondaryText}>Try again</Text></Pressable>}
    {displayStage === 'feedback' && <Pressable accessibilityRole="button" accessibilityLabel="Return to home" onPress={() => router.replace('/')} style={styles.cta}><Text style={styles.ctaText}>Finish practice  →</Text></Pressable>}
  </ScrollView>;
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, backgroundColor: '#F7F7F1', padding: 24, gap: 18 }, center: { flex: 1, alignItems: 'center', justifyContent: 'center' }, eyebrow: { color: '#246B69', fontWeight: '900', letterSpacing: 1.1 }, title: { color: '#172540', fontSize: 38, lineHeight: 44, fontWeight: '900' }, subtitle: { color: '#637183', lineHeight: 22 }, modeRow: { flexDirection: 'row', gap: 10 }, mode: { flex: 1, alignItems: 'center', padding: 14, borderRadius: 16, borderWidth: 1, borderColor: '#C7D2CF' }, selected: { borderColor: '#246B69', backgroundColor: '#DCEFED' }, modeText: { color: '#172540', fontWeight: '800' }, barista: { gap: 8, padding: 20, borderRadius: 22, backgroundColor: '#172540' }, baristaLabel: { color: '#9EE4D9', fontSize: 12, fontWeight: '900', letterSpacing: 1 }, baristaText: { color: '#FFF', fontSize: 19, lineHeight: 28, fontWeight: '700' }, flowCard: { gap: 7, padding: 20, borderRadius: 22, backgroundColor: '#E7F4F1' }, flowLabel: { color: '#246B69', fontSize: 12, fontWeight: '900', letterSpacing: 1 }, score: { color: '#172540', fontSize: 42, fontWeight: '900', fontVariant: ['tabular-nums'] }, signals: { color: '#536271', fontWeight: '700' }, coach: { color: '#246B69', lineHeight: 21, fontWeight: '700', marginTop: 4 }, status: { color: '#687587', textAlign: 'center' }, error: { color: '#9C3A25', padding: 14, borderRadius: 14, backgroundColor: '#FFE5DE' }, record: { minHeight: 64, borderRadius: 20, backgroundColor: '#246B69', alignItems: 'center', justifyContent: 'center' }, disabled: { opacity: .65 }, recordText: { color: '#FFF', fontWeight: '900' }, cta: { minHeight: 58, borderRadius: 20, backgroundColor: '#FF8565', alignItems: 'center', justifyContent: 'center' }, ctaText: { color: '#FFF', fontWeight: '900' }, secondary: { minHeight: 48, alignItems: 'center', justifyContent: 'center' }, secondaryText: { color: '#246B69', fontWeight: '800' },
});
