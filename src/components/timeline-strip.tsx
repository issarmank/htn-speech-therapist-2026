import { StyleSheet, Text, View, type DimensionValue } from 'react-native';

import { Colors, Radius, Type } from '@/constants/theme';
import type { SpeechMetrics } from '@/features/api/contracts';

/**
 * Where the long pauses and fillers fell across the clip. This is the
 * substitute for inline transcript highlighting — the response carries no
 * word-level timings, only these per-event offsets.
 */
export function TimelineStrip({ metrics }: { metrics: SpeechMetrics }) {
  const total = metrics.duration_s;
  if (!total || total <= 0) return null;

  const pct = (seconds: number): DimensionValue =>
    `${Math.max(0, Math.min(1, seconds / total)) * 100}%`;

  // A filler with no start cannot be placed, so it is dropped rather than
  // drawn at zero.
  const fillers = metrics.hard_fillers.filter((hit) => hit.start !== null);

  return (
    <View style={styles.wrap}>
      <View style={styles.track}>
        {metrics.long_pauses.map((pause, index) => (
          <View
            key={`pause-${index}`}
            style={[
              styles.pause,
              { left: pct(pause.start), width: pct(pause.duration) },
            ]}
          />
        ))}
        {fillers.map((hit, index) => (
          <View key={`filler-${index}`} style={[styles.filler, { left: pct(hit.start!) }]} />
        ))}
      </View>

      <View style={styles.axis}>
        <Text style={styles.tick}>0s</Text>
        <Text style={styles.tick}>{Math.round(total)}s</Text>
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.swatch, styles.pauseSwatch]} />
          <Text style={styles.legendText}>Long pause</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.swatch, styles.fillerSwatch]} />
          <Text style={styles.legendText}>Filler</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  track: {
    height: 28,
    borderRadius: Radius.chip,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.line,
    overflow: 'hidden',
  },
  pause: { position: 'absolute', top: 0, bottom: 0, minWidth: 3, backgroundColor: Colors.amberTint },
  filler: {
    position: 'absolute',
    top: 10,
    width: 8,
    height: 8,
    marginLeft: -4,
    borderRadius: Radius.pill,
    backgroundColor: Colors.violet,
  },
  axis: { flexDirection: 'row', justifyContent: 'space-between' },
  tick: { ...Type.caption, color: Colors.muted },
  legend: { flexDirection: 'row', gap: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  swatch: { width: 10, height: 10, borderRadius: 2 },
  pauseSwatch: { backgroundColor: Colors.amberTint, borderWidth: 1, borderColor: Colors.amber },
  fillerSwatch: { backgroundColor: Colors.violet, borderRadius: Radius.pill },
  legendText: { ...Type.caption, color: Colors.muted },
});
