import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { loadSession } from '@/features/session/session-store';

export default function RevealRoute() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const [score, setScore] = useState<number>();
  useEffect(() => { if (sessionId) void loadSession(sessionId).then((session) => setScore(session?.drillResult?.clear_speak?.overall)); }, [sessionId]);
  return <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.page}>
    <Text style={styles.eyebrow}>MISSION COMPLETE</Text><Text style={styles.title}>Your best{`\n`}practice yet.</Text>
    <Text style={styles.scoreLabel}>BEST PRACTICE FEEDBACK</Text><Text style={styles.score}>{score ?? '—'}</Text><Text style={styles.scoreNote}>You gave “rapidly” a clearer, smoother start.</Text>
    <Text style={styles.body}>A Before → After comparison appears only when the backend provides a valid comparable pair. For now, this is a clean best-attempt celebration.</Text>
    <Pressable accessibilityRole="button" accessibilityLabel="Take on Coffee Shop scenario" onPress={() => router.replace(`/scenario/coffee-shop/${sessionId ?? Date.now()}`)} style={styles.cta}><Text style={styles.ctaText}>Take on Coffee Shop  →</Text></Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel="Return home" onPress={() => router.popToTop()} style={styles.secondary}><Text style={styles.secondaryText}>Back to home</Text></Pressable>
  </ScrollView>;
}

const styles = StyleSheet.create({ page: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 20, backgroundColor: '#F7F7F1' }, eyebrow: { color: '#246B69', fontWeight: '900', letterSpacing: 1.2 }, title: { color: '#172540', fontSize: 42, lineHeight: 48, fontWeight: '900' }, scoreLabel: { color: '#246B69', fontSize: 12, fontWeight: '900', letterSpacing: 1 }, score: { color: '#172540', fontSize: 72, fontWeight: '900', fontVariant: ['tabular-nums'] }, scoreNote: { color: '#536271', lineHeight: 21 }, body: { color: '#687587', lineHeight: 21 }, cta: { minHeight: 60, borderRadius: 21, backgroundColor: '#FF8565', alignItems: 'center', justifyContent: 'center' }, ctaText: { color: '#FFF', fontWeight: '900' }, secondary: { minHeight: 48, alignItems: 'center', justifyContent: 'center' }, secondaryText: { color: '#246B69', fontWeight: '800' } });
