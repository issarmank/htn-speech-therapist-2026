import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useAudioPlayer } from 'expo-audio';

import { assessmentClient } from '@/features/api/client';
import { AssessmentError, type DrillAttemptResult, type WordFeedback } from '@/features/api/contracts';
import { usePracticeRecorder } from '@/features/audio/use-practice-recorder';
import { createSession, saveSession } from '@/features/session/session-store';
import { useSessionRestore } from '@/features/session/use-session-restore';

const phrase = 'Red robin runs rapidly.';
type Stage = 'prompting' | 'recording' | 'analysing' | 'feedback' | 'failed';

const id = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

function wordStyle(feedback?: WordFeedback) {
  if (feedback?.status === 'nailed_it') return styles.nailed;
  if (feedback?.status === 'retry') return styles.retry;
  if (feedback?.status === 'unavailable') return styles.unavailable;
  return undefined;
}

export function PracticeScreen({ sessionId }: { sessionId: string }) {
  const recorder = usePracticeRecorder();
  const { session, setSession, restoring } = useSessionRestore(sessionId);
  const [stage, setStage] = useState<Stage>('prompting');
  const [result, setResult] = useState<DrillAttemptResult | undefined>();
  const [error, setError] = useState<string>();
  const [selectedWord, setSelectedWord] = useState<WordFeedback>();
  const [dismissedRestore, setDismissedRestore] = useState(false);
  const player = useAudioPlayer(null);

  useEffect(() => {
    if (!restoring && !session) {
      const next = createSession(sessionId, 'clear_speak');
      setSession(next);
      void saveSession(next);
    }
  }, [restoring, session, sessionId, setSession]);

  const activeResult = result ?? (dismissedRestore ? undefined : session?.drillResult);
  const displayStage = activeResult && stage === 'prompting' ? 'feedback' : stage;
  const feedbackByIndex = useMemo(() => new Map(activeResult?.word_feedback.map((item) => [item.word_index, item])), [activeResult]);
  const recordingHint = recorder.secondsRemaining <= 2 ? `Wrapping up in ${recorder.secondsRemaining}s` : recorder.secondsRemaining <= 20 ? `${recorder.secondsRemaining}s remaining` : '';

  const begin = async () => {
    setError(undefined);
    if (await recorder.start()) setStage('recording');
  };
  const submit = async () => {
    const clip = await recorder.stop();
    if (!clip) return;
    setStage('analysing');
    try {
      const assessment = await assessmentClient.assessDrill({ clipUri: clip.uri, sessionId, promptId: session?.promptId ?? 'red-robin-runs-rapidly', idempotencyKey: id() });
      setResult(assessment);
      setDismissedRestore(false);
      const next = { ...(session ?? createSession(sessionId, 'clear_speak')), attemptIds: [...(session?.attemptIds ?? []), assessment.attempt_id], drillResult: assessment };
      setSession(next);
      await saveSession(next);
      setStage('feedback');
    } catch (reason) {
      setError(reason instanceof AssessmentError ? reason.message : 'We could not score that one. Please try again.');
      setStage('failed');
    }
  };
  const retry = () => { setDismissedRestore(true); setResult(undefined); setError(undefined); setStage('prompting'); };
  const complete = async () => {
    if (!activeResult) return;
    const next = { ...(session ?? createSession(sessionId, 'clear_speak')), completed: true, drillResult: activeResult };
    setSession(next);
    await saveSession(next);
    router.push(`/reveal/${sessionId}`);
  };

  if (restoring) return <View style={styles.center}><Text>Loading your practice…</Text></View>;
  const words = phrase.replace('.', '').split(' ');
  return <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.page}>
    <Text style={styles.eyebrow}>CLEARSPEAK · R SOUND</Text>
    <Text style={styles.title}>Make your R sound land clearly.</Text>
    <Text style={styles.progress}>Attempt {(session?.attemptIds.length ?? 0) + 1} of 3</Text>
    <View style={styles.mirror}>
      <Text style={styles.mirrorLabel}>SPEECH MIRROR · {displayStage === 'recording' ? 'LISTENING' : 'READY'}</Text>
      <View style={styles.phraseRow}>{words.map((word, index) => {
        const feedback = feedbackByIndex.get(index);
        return <Pressable key={word} accessibilityRole={feedback ? 'button' : undefined} accessibilityLabel={feedback ? `${word}, ${feedback.status === 'nailed_it' ? 'nailed it' : feedback.status === 'retry' ? 'try again' : 'not enough audio to score'}` : word} onPress={feedback ? () => setSelectedWord(feedback) : undefined}><Text style={[styles.phrase, wordStyle(feedback)]}>{word}{index < words.length - 1 ? ' ' : '.'}</Text></Pressable>;
      })}</View>
      <View style={styles.wave}>{[18, 32, 50, 28, 58, 36, 48, 23, 38].map((height, index) => <View key={index} style={[styles.bar, { height: displayStage === 'recording' ? height : 10 + (index % 3) * 6 }]} />)}</View>
      {displayStage === 'recording' && <Text style={styles.lightText}>{recordingHint}</Text>}
    </View>
    {displayStage === 'analysing' && <Text style={styles.status}>Finding your clearest sound…</Text>}
    {recorder.status === 'permission_denied' && <Text selectable style={styles.error}>VocalFlow needs microphone access to listen. Enable it in Settings, then try again.</Text>}
    {recorder.status === 'too_short' && <Text selectable style={styles.error}>We didn’t catch enough speech. Try a full phrase.</Text>}
    {recorder.status === 'recording_failed' && <Text selectable style={styles.error}>Recording stopped unexpectedly. Your prompt is still here—try again.</Text>}
    {error && <Text selectable style={styles.error}>{error}</Text>}
    {activeResult && <CoachCard result={activeResult} onReplay={() => { if (activeResult.coach.audio_stream_url) { player.replace(activeResult.coach.audio_stream_url); player.play(); } }} />}
    {selectedWord && <View style={styles.detailSheet}><Text style={styles.detailTitle}>{selectedWord.word}</Text><Text selectable style={styles.detailText}>{selectedWord.status === 'unavailable' ? 'Not enough audio to score this word yet.' : selectedWord.status === 'nailed_it' ? 'Nailed it. Keep the same relaxed start.' : activeResult?.focus?.reason ?? 'Try a rounder, smoother start.'}</Text>{selectedWord.accuracy !== undefined && <Text style={styles.detailScore}>Practice feedback {selectedWord.accuracy}</Text>}<Pressable accessibilityRole="button" accessibilityLabel="Close word detail" onPress={() => setSelectedWord(undefined)}><Text style={styles.secondaryText}>Close</Text></Pressable></View>}
    <Pressable accessibilityRole="button" accessibilityLabel={displayStage === 'recording' ? 'Stop and score your phrase' : 'Start recording your phrase'} accessibilityState={{ disabled: displayStage === 'analysing' }} disabled={displayStage === 'analysing'} onPress={displayStage === 'recording' ? submit : begin} style={[styles.record, displayStage === 'analysing' && styles.disabled]}>
      <Text style={styles.recordText}>{displayStage === 'recording' ? '■  Stop and score' : displayStage === 'analysing' ? '···  Analysing' : '◉  Hold to speak'}</Text>
    </Pressable>
    {(displayStage === 'failed' || recorder.status === 'too_short' || recorder.status === 'recording_failed') && <Pressable accessibilityRole="button" accessibilityLabel="Try this phrase again" onPress={retry} style={styles.secondary}><Text style={styles.secondaryText}>Try again</Text></Pressable>}
    {displayStage === 'feedback' && <Pressable accessibilityRole="button" accessibilityLabel={activeResult?.clear_speak?.overall && activeResult.clear_speak.overall >= 80 ? 'See your improvement' : 'Try the phrase again'} onPress={activeResult?.clear_speak?.overall && activeResult.clear_speak.overall >= 80 ? complete : retry} style={styles.cta}><Text style={styles.ctaText}>{activeResult?.clear_speak?.overall && activeResult.clear_speak.overall >= 80 ? 'See your improvement  →' : 'Try rapidly again  →'}</Text></Pressable>}
  </ScrollView>;
}

function CoachCard({ result, onReplay }: { result: DrillAttemptResult; onReplay: () => void }) {
  const unavailable = result.word_feedback.some((item) => item.status === 'unavailable');
  return <View style={styles.coach}>
    <Text style={styles.coachTitle}>VOCALFLOW COACH</Text>
    {result.clear_speak ? <Text style={styles.metric}>Practice feedback {result.clear_speak.overall} · Flow {result.clear_speak.fluency ?? '—'}</Text> : <Text style={styles.metric}>Practice feedback unavailable</Text>}
    <Text selectable style={styles.coachText}>{result.coach.encouragement}</Text>
    <Text selectable style={styles.coachCue}>{result.coach.one_coaching_cue}</Text>
    {unavailable && <Text style={styles.note}>Some words did not have enough audio to score. They are not treated as a failing grade.</Text>}
    {result.coach.audio_stream_url ? <Pressable accessibilityRole="button" accessibilityLabel="Hear coaching cue" onPress={onReplay}><Text style={styles.secondaryText}>Hear it</Text></Pressable> : <Text style={styles.note}>Coach audio is unavailable right now; the written cue is ready to use.</Text>}
  </View>;
}

const styles = StyleSheet.create({
  page: { padding: 24, gap: 18, backgroundColor: '#F7F7F1', flexGrow: 1 }, center: { flex: 1, alignItems: 'center', justifyContent: 'center' }, eyebrow: { color: '#246B69', fontWeight: '800', letterSpacing: 1.2 }, title: { color: '#172540', fontSize: 36, lineHeight: 43, fontWeight: '900' }, progress: { color: '#617080', fontWeight: '700' }, mirror: { padding: 22, gap: 18, borderRadius: 28, backgroundColor: '#172540' }, mirrorLabel: { color: '#9EE4D9', fontSize: 12, fontWeight: '800', letterSpacing: 1 }, phraseRow: { flexDirection: 'row', flexWrap: 'wrap' }, phrase: { color: '#FFF', fontSize: 28, lineHeight: 39, fontWeight: '800' }, nailed: { color: '#8FE0C5', textDecorationLine: 'underline' }, retry: { color: '#FFCA7B', textDecorationLine: 'underline' }, unavailable: { color: '#CFD6DA', textDecorationLine: 'underline', textDecorationStyle: 'dotted' }, wave: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' }, bar: { width: 8, borderRadius: 8, backgroundColor: '#75CEC5' }, lightText: { color: '#B9D7D4', textAlign: 'center' }, status: { color: '#617080', textAlign: 'center' }, error: { color: '#9C3A25', padding: 14, borderRadius: 14, backgroundColor: '#FFE5DE' }, coach: { padding: 18, borderRadius: 22, gap: 8, backgroundColor: '#FFF', boxShadow: '0 4px 14px rgba(23,37,64,.08)' }, coachTitle: { color: '#246B69', fontSize: 12, fontWeight: '900', letterSpacing: 1 }, metric: { color: '#172540', fontWeight: '800' }, coachText: { color: '#27364D', fontSize: 16, lineHeight: 23 }, coachCue: { color: '#246B69', fontWeight: '700', lineHeight: 21 }, note: { color: '#687587', fontSize: 13, lineHeight: 18 }, detailSheet: { gap: 8, padding: 18, borderRadius: 20, backgroundColor: '#FFF1CB' }, detailTitle: { color: '#172540', fontSize: 20, fontWeight: '900' }, detailText: { color: '#27364D', lineHeight: 21 }, detailScore: { color: '#805A00', fontWeight: '800' }, record: { minHeight: 64, borderRadius: 20, backgroundColor: '#246B69', alignItems: 'center', justifyContent: 'center' }, disabled: { opacity: .65 }, recordText: { color: '#FFF', fontWeight: '900' }, cta: { minHeight: 58, borderRadius: 20, backgroundColor: '#FF8565', alignItems: 'center', justifyContent: 'center' }, ctaText: { color: '#FFF', fontWeight: '900' }, secondary: { minHeight: 48, alignItems: 'center', justifyContent: 'center' }, secondaryText: { color: '#246B69', fontWeight: '800' },
});
