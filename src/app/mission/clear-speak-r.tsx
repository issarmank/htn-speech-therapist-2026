import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

export default function ClearSpeakIntro() {
  const sessionId = `r-${Date.now()}`;
  return <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.page}>
    <Text style={styles.eyebrow}>CLEARSPEAK · R SOUND</Text><Text style={styles.title}>A clearer start{`\n`}to “rapidly.”</Text>
    <Text style={styles.subtitle}>You’ll say one phrase at a comfortable pace. VocalFlow will surface one word and one cue—no score maze, no diagnosis.</Text>
    <View style={styles.steps}><Text style={styles.step}>1   Say the phrase</Text><Text style={styles.step}>2   Notice one word</Text><Text style={styles.step}>3   Try it once more</Text></View>
    <View style={styles.prompt}><Text style={styles.promptLabel}>TODAY’S PHRASE</Text><Text selectable style={styles.promptText}>Red robin runs rapidly.</Text></View>
    <Pressable accessibilityRole="button" accessibilityLabel="Begin ClearSpeak warm-up" onPress={() => router.replace(`/practice/${sessionId}`)} style={styles.cta}><Text style={styles.ctaText}>Begin warm-up  →</Text></Pressable>
  </ScrollView>;
}

const styles = StyleSheet.create({ page: { flexGrow: 1, padding: 24, gap: 20, backgroundColor: '#F7F7F1' }, eyebrow: { color: '#246B69', fontWeight: '900', letterSpacing: 1.2 }, title: { color: '#172540', fontSize: 39, lineHeight: 45, fontWeight: '900' }, subtitle: { color: '#637183', fontSize: 16, lineHeight: 24 }, steps: { gap: 12, padding: 18, borderRadius: 20, backgroundColor: '#FFF' }, step: { color: '#27364D', fontWeight: '700' }, prompt: { gap: 8, padding: 22, borderRadius: 24, backgroundColor: '#172540' }, promptLabel: { color: '#9EE4D9', fontWeight: '900', fontSize: 12, letterSpacing: 1 }, promptText: { color: '#FFF', fontSize: 28, lineHeight: 38, fontWeight: '800' }, cta: { minHeight: 62, borderRadius: 21, backgroundColor: '#FF8565', alignItems: 'center', justifyContent: 'center', marginTop: 'auto' }, ctaText: { color: '#FFF', fontWeight: '900', fontSize: 15 } });
