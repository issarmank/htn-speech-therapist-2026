import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { Colors, Radius, Type } from '@/constants/theme';

type Props = {
  label: string;
  /** `null` means the backend could not measure it — never render 0 for null. */
  value: number | string | null;
  unit?: string;
  detail?: string;
  emphasised?: boolean;
  /** Set when the tiles are in a single column: sizes from content, not flex. */
  stacked?: boolean;
  style?: ViewStyle;
};

export function MetricTile({ label, value, unit, detail, emphasised, stacked, style }: Props) {
  const unmeasured = value === null;

  return (
    <View
      style={[styles.tile, stacked && styles.stacked, emphasised && styles.emphasised, style]}
      accessibilityLabel={
        unmeasured
          ? `${label}: not enough speech to measure`
          : `${label}: ${value}${unit ? ` ${unit}` : ''}`
      }>
      <Text style={styles.label}>{label}</Text>

      {unmeasured ? (
        <Text style={styles.unmeasured}>Not enough speech to measure</Text>
      ) : (
        <View style={styles.valueRow}>
          <Text style={styles.value}>{value}</Text>
          {unit ? <Text style={styles.unit}>{unit}</Text> : null}
        </View>
      )}

      {detail && !unmeasured ? <Text style={styles.detail}>{detail}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minHeight: 96,
    padding: 16,
    gap: 6,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.line,
    backgroundColor: Colors.surface,
  },
  stacked: { flexGrow: 0, flexShrink: 0, flexBasis: 'auto', alignSelf: 'stretch' },
  emphasised: { borderWidth: 2, borderColor: Colors.violet },
  label: { ...Type.caption, color: Colors.muted },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  value: { ...Type.metric, color: Colors.ink },
  unit: { ...Type.caption, color: Colors.muted },
  detail: { ...Type.caption, color: Colors.body },
  unmeasured: { ...Type.caption, color: Colors.muted, paddingVertical: 8 },
});
