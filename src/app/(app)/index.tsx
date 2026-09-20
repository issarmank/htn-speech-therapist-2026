import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MAX_TITLE_SCALE, useResponsive } from '@/constants/responsive';
import { Colors, Blade, ContentColumn, Layout, Radius, Shadow, Type } from '@/constants/theme';
import { useAuth } from '@/features/auth/auth-context';
import { useReviews } from '@/features/history/use-reviews';
import {
  DEFAULT_CONTEXT,
  PRACTICE_CONTEXTS,
  type PracticeContext,
} from '@/features/practice/contexts';
import { focusLabel } from '@/features/results/focus';
import { MetricTile } from '@/components/metric-tile';

export default function Home() {
  const { email } = useAuth();
  const { reviews, reload } = useReviews(5);
  const [context, setContext] = useState<PracticeContext>(DEFAULT_CONTEXT);
  const { stackTiles } = useResponsive();

  // History is written by the analyze call on another screen, so re-read it
  // whenever this tab comes back into focus.
  useFocusEffect(
    useCallback(() => {
      void reload('refresh');
    }, [reload]),
  );

  const last = reviews[0];
  const initials = (email ?? '?').slice(0, 2).toUpperCase();

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.hi}>Hi there</Text>
            <Text style={styles.title} maxFontSizeMultiplier={MAX_TITLE_SCALE}>
              Ready when{'\n'}you are.
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Account"
            hitSlop={8}
            style={styles.avatar}
            onPress={() => router.push('/profile')}>
            <Text style={styles.avatarText}>{initials}</Text>
          </Pressable>
        </View>

        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Talk for up to a minute.</Text>
          <Text style={styles.heroBody}>What are you practising?</Text>

          <View style={styles.chips}>
            {PRACTICE_CONTEXTS.map((entry) => {
              const selected = entry.id === context.id;
              return (
                <Pressable
                  key={entry.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  style={[styles.chip, selected && styles.chipSelected]}
                  onPress={() => setContext(entry)}>
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                    {entry.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Start a ${context.label} session`}
            style={styles.start}
            onPress={() => router.push({ pathname: '/(app)/practice', params: { context: context.id } })}>
            <Text style={styles.startText}>Start</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>Your last session</Text>
          {last ? (
            <>
              <View style={[styles.tiles, stackTiles && styles.tilesStacked]}>
                <MetricTile
                  stacked={stackTiles}
                  label="Pace"
                  value={last.metrics.wpm === null ? null : Math.round(last.metrics.wpm)}
                  unit="wpm"
                />
                <MetricTile
                  stacked={stackTiles}
                  label="Fillers"
                  value={last.metrics.hard_fillers.length}
                />
              </View>
              <View style={styles.lastRow}>
                <Text style={styles.lastFocus}>
                  Focus was {focusLabel(last.feedback.primary_focus).toLowerCase()}.
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push('/(app)/history')}>
                  <Text style={styles.link}>See history</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <Text style={styles.empty}>Your first session will show up here.</Text>
          )}
        </View>

        <Pressable
          accessibilityRole="button"
          style={styles.hoodCard}
          onPress={() => router.push('/(app)/hood')}>
          <Text style={styles.hoodTitle}>See how your voice becomes feedback</Text>
          <Text style={styles.hoodBody}>Transcribe → Measure → Coach → Speak</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.canvas },
  content: { ...ContentColumn, padding: Layout.page, gap: Layout.section, paddingBottom: 48 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  headerText: { flex: 1 },
  hi: { ...Type.caption, color: Colors.muted },
  title: { ...Type.title1, color: Colors.ink, marginTop: 4 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    backgroundColor: Colors.violetTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...Type.caption, color: Colors.violetDeep, fontWeight: '700' },

  hero: { backgroundColor: Colors.violetTint, padding: Layout.card, gap: 12, ...Blade, ...Shadow },
  heroTitle: { ...Type.heading, color: Colors.ink },
  heroBody: { ...Type.body, color: Colors.body },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
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
  start: {
    marginTop: 8,
    minHeight: Layout.cta,
    borderRadius: Radius.cta,
    backgroundColor: Colors.violet,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startText: { ...Type.bodyStrong, color: '#FFFFFF' },

  section: { gap: 12 },
  heading: { ...Type.heading, color: Colors.ink },
  tiles: { flexDirection: 'row', gap: 12 },
  // DESIGN_SPEC §8: at 130% text the tiles stop fitting side by side.
  tilesStacked: { flexDirection: 'column' },
  lastRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  lastFocus: { ...Type.caption, color: Colors.body, flexShrink: 1 },
  link: { ...Type.caption, color: Colors.violetDeep },
  empty: { ...Type.body, color: Colors.muted },

  hoodCard: {
    padding: Layout.card,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.line,
    backgroundColor: Colors.surface,
    gap: 6,
  },
  hoodTitle: { ...Type.bodyStrong, color: Colors.ink },
  hoodBody: { ...Type.caption, color: Colors.muted },
});
