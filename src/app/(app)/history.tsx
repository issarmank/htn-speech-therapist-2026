import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Banner } from '@/components/banner';
import { MAX_TITLE_SCALE } from '@/constants/responsive';
import { Colors, ContentColumn, Layout, Radius, Type } from '@/constants/theme';
import type { SpeechReview } from '@/features/api/contracts';
import { formatReviewDate } from '@/features/api/dates';
import { useReviews } from '@/features/history/use-reviews';
import { labelForContextValue } from '@/features/practice/contexts';
import { focusGlyph, focusLabel } from '@/features/results/focus';
import { fromReview, selectedReview } from '@/features/results/view-source';

export default function History() {
  const { reviews, loading, refreshing, error, reload } = useReviews(20);

  useFocusEffect(
    useCallback(() => {
      void reload('refresh');
    }, [reload]),
  );

  function open(review: SpeechReview) {
    selectedReview.set(fromReview(review));
    router.push('/results');
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title} maxFontSizeMultiplier={MAX_TITLE_SCALE}>
          History
        </Text>
        <Text style={styles.sub}>
          Every session you have recorded, saved on the server.
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loading} color={Colors.violet} />
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void reload('refresh')}
              tintColor={Colors.violet}
            />
          }
          ListHeaderComponent={error ? <Banner>{error}</Banner> : null}
          ListEmptyComponent={
            error ? null : (
              <Text style={styles.empty}>
                Nothing yet. Record a session and it will appear here.
              </Text>
            )
          }
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Session from ${formatReviewDate(item.created_at)}, focus ${focusLabel(
                item.feedback.primary_focus,
              )}`}
              style={styles.row}
              onPress={() => open(item)}>
              <View style={styles.rowTop}>
                <Text style={styles.rowDate}>{formatReviewDate(item.created_at)}</Text>
                <Text style={styles.rowContext} numberOfLines={1}>
                  {labelForContextValue(item.context)}
                </Text>
              </View>

              <Text style={styles.rowCue} numberOfLines={2}>
                {item.feedback.coaching_cue}
              </Text>

              <View style={styles.rowMeta}>
                <Text style={styles.badge}>
                  {focusGlyph(item.feedback.primary_focus)} {focusLabel(item.feedback.primary_focus)}
                </Text>
                <Text style={styles.meta}>
                  {item.metrics.wpm === null ? '— wpm' : `${Math.round(item.metrics.wpm)} wpm`}
                </Text>
                <Text style={styles.meta}>{item.metrics.hard_fillers.length} fillers</Text>
                {/* Absent audio means S3 was unset or the upload failed — the
                    review still saved, which is the backend's design. */}
                <Text style={[styles.meta, !item.audio_url && styles.metaOff]}>
                  {item.audio_url ? '♪ clip' : 'no clip'}
                </Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.canvas },
  header: { ...ContentColumn, padding: Layout.page, paddingBottom: 12, gap: 6 },
  title: { ...Type.title1, color: Colors.ink },
  sub: { ...Type.body, color: Colors.body },
  loading: { marginTop: 40 },
  list: { ...ContentColumn, paddingHorizontal: Layout.page, paddingBottom: 32, gap: 12 },
  empty: { ...Type.body, color: Colors.muted, marginTop: 24 },
  row: {
    padding: Layout.card,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.line,
    backgroundColor: Colors.surface,
    gap: 10,
  },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  rowDate: { ...Type.caption, color: Colors.ink, flexShrink: 1 },
  rowContext: { ...Type.caption, color: Colors.muted, flexShrink: 1 },
  rowCue: { ...Type.body, color: Colors.body },
  rowMeta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12 },
  badge: { ...Type.caption, color: Colors.violetDeep },
  meta: { ...Type.caption, color: Colors.muted },
  metaOff: { color: Colors.amber },
});
