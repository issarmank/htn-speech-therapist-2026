import { StyleSheet, Text, View } from 'react-native';

import { Accordion } from '@/components/accordion';
import { MetricTile } from '@/components/metric-tile';
import { PaceBand } from '@/components/pace-band';
import { TimelineStrip } from '@/components/timeline-strip';
import { COACH_FALLBACK_PATTERN, LONG_PAUSE_S, MID_PAUSE_S } from '@/constants/backend';
import { useResponsive } from '@/constants/responsive';
import { Blade, Colors, Layout, Radius, Shadow, Type } from '@/constants/theme';
import { emphasisedTile, focusGlyph, focusLabel } from '@/features/results/focus';
import type { ResultView } from '@/features/results/view-source';
import { labelForContextValue } from '@/features/practice/contexts';

export function ResultsView({ view, action }: { view: ResultView; action?: React.ReactNode }) {
  const { metrics, feedback } = view;
  const { stackTiles } = useResponsive();
  const emphasis = emphasisedTile(feedback.primary_focus);
  const coachUnavailable = feedback.observations[0]?.pattern === COACH_FALLBACK_PATTERN;

  const hardFillerCounts = countBy(metrics.hard_fillers.map((hit) => hit.text.toLowerCase()));
  const softCount = metrics.soft_fillers.length;

  return (
    <View style={styles.wrap}>
      <Text style={styles.encouragement}>{feedback.encouragement}</Text>

      {coachUnavailable ? (
        <View style={styles.fallback}>
          <Text style={styles.fallbackText}>
            The coach was unavailable, but your measurements below are accurate.
          </Text>
        </View>
      ) : null}

      <View style={styles.focusCard}>
        <View style={styles.focusBadge}>
          <Text style={styles.focusGlyph}>{focusGlyph(feedback.primary_focus)}</Text>
          <Text style={styles.focusLabel}>{focusLabel(feedback.primary_focus)}</Text>
        </View>
        <Text style={styles.cue}>{feedback.coaching_cue}</Text>
        {action}
      </View>

      <Text style={styles.heading}>Your speech at a glance</Text>

      <View style={styles.grid}>
        <View style={[styles.row, stackTiles && styles.rowStacked]}>
          <MetricTile
            stacked={stackTiles}
            label="Pace"
            value={metrics.wpm === null ? null : Math.round(metrics.wpm)}
            unit="wpm"
            emphasised={emphasis === 'pace'}
          />
          <MetricTile
            stacked={stackTiles}
            label="Fillers"
            value={metrics.hard_fillers.length}
            detail={
              metrics.hard_fillers.length === 0
                ? 'None. Smooth.'
                : Object.entries(hardFillerCounts)
                    .map(([text, count]) => `${text} ×${count}`)
                    .join('  ')
            }
            emphasised={emphasis === 'fillers'}
          />
        </View>

        {metrics.wpm !== null ? <PaceBand wpm={metrics.wpm} /> : null}

        {softCount > 0 ? (
          <Text style={styles.soft}>
            + {softCount} casual {softCount === 1 ? 'word' : 'words'} like{' '}
            {unique(metrics.soft_fillers.map((hit) => hit.text)).slice(0, 3).join(', ')}
          </Text>
        ) : null}

        <View style={[styles.row, stackTiles && styles.rowStacked]}>
          <MetricTile
            stacked={stackTiles}
            label="Long pauses"
            value={metrics.long_pauses.length}
            detail={
              metrics.long_pauses.length === 0
                ? `None over ${LONG_PAUSE_S} s`
                : `over ${LONG_PAUSE_S} s`
            }
            emphasised={emphasis === 'pauses'}
          />
          {emphasis === 'repeats' ? (
            <MetricTile
              stacked={stackTiles}
              label="Repeats"
              value={metrics.repetitions.length}
              detail={metrics.repetitions.slice(0, 3).join(', ') || undefined}
              emphasised
            />
          ) : emphasis === 'sentence' ? (
            <MetricTile
              stacked={stackTiles}
              label="Sentence length"
              value={
                metrics.avg_words_per_sentence === null
                  ? null
                  : Math.round(metrics.avg_words_per_sentence)
              }
              unit="words"
              emphasised
            />
          ) : (
            <MetricTile
              stacked={stackTiles}
              label="Smoothest stretch"
              value={
                metrics.longest_fluent_run_s === null
                  ? null
                  : metrics.longest_fluent_run_s.toFixed(1)
              }
              unit="s"
            />
          )}
        </View>
      </View>

      <Accordion title="More measurements">
        <Measurement
          label="Articulation rate"
          value={metrics.articulation_rate}
          unit="wpm while speaking"
        />
        <Measurement
          label="Speaking share"
          value={metrics.speech_ratio === null ? null : Math.round(metrics.speech_ratio * 100)}
          unit="% of the clip"
        />
        <Measurement label={`Mid pauses (${MID_PAUSE_S}–${LONG_PAUSE_S} s)`} value={metrics.mid_pauses} />
        <Measurement label="Sentence length" value={metrics.avg_words_per_sentence} unit="words" />
        <Measurement label="Repeats" value={metrics.repetitions.length} />
        <Measurement label="Words" value={metrics.word_count} />
        <Measurement label="Clip length" value={Math.round(metrics.duration_s)} unit="s" />
        {metrics.audio_events.length > 0 ? (
          <Measurement label="Audio events" value={metrics.audio_events.join(', ')} />
        ) : null}
      </Accordion>

      <View style={styles.section}>
        <Text style={styles.heading}>Where it happened</Text>
        <TimelineStrip metrics={metrics} />
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>Why the coach said that</Text>
        {feedback.observations.map((observation, index) => (
          <Accordion key={index} title={observation.pattern}>
            <Text style={styles.body}>{observation.evidence}</Text>
            <Text style={styles.muted}>{observation.why_it_matters}</Text>
          </Accordion>
        ))}
      </View>

      <View style={styles.tryCard}>
        <Text style={styles.tryTitle}>Try this next</Text>
        <Text style={styles.body}>{feedback.try_this_next}</Text>
      </View>

      <Accordion
        title="What we heard"
        subtitle={labelForContextValue(view.contextValue)}>
        <Text style={styles.transcript}>{view.transcript}</Text>
      </Accordion>
    </View>
  );
}

function Measurement({
  label,
  value,
  unit,
}: {
  label: string;
  value: number | string | null;
  unit?: string;
}) {
  return (
    <View style={styles.measurement}>
      <Text style={styles.muted}>{label}</Text>
      <Text style={styles.measurementValue}>
        {value === null ? 'Not measured' : `${value}${unit ? ` ${unit}` : ''}`}
      </Text>
    </View>
  );
}

function countBy(items: string[]): Record<string, number> {
  return items.reduce<Record<string, number>>((acc, item) => {
    acc[item] = (acc[item] ?? 0) + 1;
    return acc;
  }, {});
}

function unique(items: string[]): string[] {
  return [...new Set(items.map((item) => item.toLowerCase()))];
}

const styles = StyleSheet.create({
  wrap: { gap: Layout.section },
  encouragement: { ...Type.heading, color: Colors.ink },

  fallback: { padding: 14, borderRadius: Radius.chip, backgroundColor: Colors.blueTint },
  fallbackText: { ...Type.caption, color: Colors.blueText },

  focusCard: {
    backgroundColor: Colors.violetTint,
    padding: Layout.card,
    gap: 14,
    ...Blade,
    ...Shadow,
  },
  focusBadge: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  focusGlyph: { fontSize: 16, color: Colors.violetDeep },
  focusLabel: { ...Type.caption, color: Colors.violetDeep, fontWeight: '700' },
  cue: { ...Type.title2, color: Colors.ink },

  heading: { ...Type.heading, color: Colors.ink },
  grid: { gap: 12 },
  row: { flexDirection: 'row', gap: 12 },
  // DESIGN_SPEC §8: at 130% text the cards wrap to a single column.
  rowStacked: { flexDirection: 'column' },
  soft: { ...Type.caption, color: Colors.muted },

  section: { gap: 12 },
  body: { ...Type.body, color: Colors.body },
  muted: { ...Type.caption, color: Colors.muted },
  transcript: { ...Type.body, color: Colors.body },

  measurement: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  measurementValue: { ...Type.caption, color: Colors.ink, flexShrink: 1 },

  tryCard: {
    padding: Layout.card,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.line,
    backgroundColor: Colors.surface,
    gap: 8,
  },
  tryTitle: { ...Type.bodyStrong, color: Colors.ink },
});
