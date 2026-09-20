import { StyleSheet, Text, View, type DimensionValue } from 'react-native';

import { PACE_BAND, paceLabel } from '@/constants/backend';
import { Colors, Radius, Type } from '@/constants/theme';

/**
 * The comfortable band with a marker, never an alarm. Below the band reads
 * "Unhurried" and above it "Quick" — words, not warning colours.
 */
export function PaceBand({ wpm }: { wpm: number }) {
  const [low, high] = PACE_BAND;
  // Show a band from 60 to 220 wpm so the marker has somewhere to sit at
  // either extreme instead of pinning to an edge.
  const MIN = 60;
  const MAX = 220;
  const clamp = (value: number) => Math.max(0, Math.min(1, (value - MIN) / (MAX - MIN)));
  const pct = (value: number): DimensionValue => `${value * 100}%`;

  return (
    <View style={styles.wrap}>
      <View style={styles.track}>
        <View
          style={[
            styles.comfortable,
            { left: pct(clamp(low)), width: pct(clamp(high) - clamp(low)) },
          ]}
        />
        <View style={[styles.marker, { left: pct(clamp(wpm)) }]} />
      </View>
      <Text style={styles.label}>{paceLabel(wpm)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  track: {
    height: 8,
    borderRadius: Radius.pill,
    backgroundColor: Colors.line,
    justifyContent: 'center',
  },
  comfortable: {
    position: 'absolute',
    height: 8,
    borderRadius: Radius.pill,
    backgroundColor: Colors.blueTint,
  },
  marker: {
    position: 'absolute',
    width: 4,
    height: 16,
    borderRadius: 2,
    marginLeft: -2,
    backgroundColor: Colors.violet,
  },
  label: { ...Type.caption, color: Colors.muted },
});
