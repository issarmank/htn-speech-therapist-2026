import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';

import { MAX_TITLE_SCALE } from '@/constants/responsive';
import { Blade, Colors, Gradients, Layout, Radius, Type } from '@/constants/theme';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'outline';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
};

/** Primary CTA. The blade corner is deliberate and belongs only here. */
export function GradientButton({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  style,
}: Props) {
  const inert = disabled || loading;

  const content = loading ? (
    <ActivityIndicator color={variant === 'primary' ? '#FFFFFF' : Colors.violet} />
  ) : (
    <Text
      style={[styles.label, variant === 'outline' && styles.labelOutline]}
      numberOfLines={1}
      maxFontSizeMultiplier={MAX_TITLE_SCALE}>
      {label}
    </Text>
  );

  if (variant === 'outline') {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !!inert, busy: !!loading }}
        disabled={inert}
        onPress={onPress}
        style={({ pressed }) => [
          styles.base,
          styles.outline,
          pressed && styles.pressed,
          inert && styles.inert,
          style,
        ]}>
        {content}
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inert, busy: !!loading }}
      disabled={inert}
      onPress={onPress}
      style={({ pressed }) => [pressed && styles.pressed, inert && styles.inert, style]}>
      <LinearGradient
        colors={[...Gradients.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.base, Blade]}>
        {content}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: Layout.cta,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  outline: {
    borderWidth: 1,
    borderColor: Colors.violet,
    borderRadius: Radius.cta,
    backgroundColor: 'transparent',
  },
  label: { ...Type.bodyStrong, color: '#FFFFFF' },
  labelOutline: { color: Colors.violet },
  pressed: { opacity: 0.88 },
  inert: { opacity: 0.45 },
});
