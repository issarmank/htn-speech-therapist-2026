import { useMemo, useState } from 'react';
import { Dimensions, StyleSheet, View, type LayoutChangeEvent, type ViewStyle } from 'react-native';

import { Colors } from '@/constants/theme';

const BAR_WIDTH = 4;
const BAR_GAP = 4;
const MIN_BARS = 15;
const MAX_BARS = 41;

/**
 * Placeholder for the DESIGN_SPEC voice bars. Same role — a row of strands
 * whose height follows a bell envelope scaled by the live mic level — but
 * driven by plain re-renders rather than Reanimated. Phase 5 replaces it with
 * the shared `VoiceBars` used by the landing and analyzing screens too.
 *
 * The strand count is measured from the width it is actually given rather
 * than fixed, so the row fills a tablet and still fits a 320 pt phone instead
 * of overflowing it.
 *
 * Decorative: hidden from screen readers, per DESIGN_SPEC §8.
 */
export function LevelMeter({
  level,
  active,
  height = 72,
  style,
}: {
  level: number;
  active: boolean;
  /** Row height. The tallest strand reaches about 80% of it. */
  height?: number;
  style?: ViewStyle;
}) {
  // Seeded from the window so the first frame already draws strands; the
  // real width lands on the next layout pass.
  const [width, setWidth] = useState(() => Dimensions.get('window').width);

  const barCount = useMemo(() => {
    if (!width) return 0;
    const fits = Math.floor((width + BAR_GAP) / (BAR_WIDTH + BAR_GAP));
    // Odd, so one strand sits dead centre under the peak of the envelope.
    const clamped = Math.max(MIN_BARS, Math.min(MAX_BARS, fits));
    return clamped % 2 === 0 ? clamped - 1 : clamped;
  }, [width]);

  function measure(event: LayoutChangeEvent) {
    const next = event.nativeEvent.layout.width;
    if (Math.abs(next - width) > 1) setWidth(next);
  }

  const peak = Math.max(4, height * 0.8);

  return (
    <View
      style={[styles.row, { height }, style]}
      onLayout={measure}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      {Array.from({ length: barCount }, (_, index) => {
        // Bell envelope: tallest in the middle, tapering to the edges.
        const offset = (index - (barCount - 1) / 2) / ((barCount - 1) / 2);
        const envelope = Math.cos((offset * Math.PI) / 2) ** 1.5;
        const jitter = active ? 0.6 + 0.4 * Math.sin(index * 1.7) : 0;
        const barHeight = 4 + peak * envelope * level * jitter;

        return (
          <View
            key={index}
            style={[
              styles.bar,
              {
                height: Math.max(4, barHeight),
                backgroundColor: mix(index / (barCount - 1)),
                opacity: active ? 1 : 0.35,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

/** violet → blue across the row, matching the primary gradient. */
function mix(t: number): string {
  const from = [0x6a, 0x48, 0xf0];
  const to = [0x3f, 0x6f, 0xe8];
  const channel = (i: number) => Math.round(from[i] + (to[i] - from[i]) * t);
  return `rgb(${channel(0)}, ${channel(1)}, ${channel(2)})`;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: BAR_GAP,
    alignSelf: 'stretch',
    overflow: 'hidden',
  },
  bar: { width: BAR_WIDTH, borderRadius: 2, backgroundColor: Colors.violet },
});
