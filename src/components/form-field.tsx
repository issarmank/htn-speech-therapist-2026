import { forwardRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import { Colors, Radius, Type } from '@/constants/theme';

type Props = TextInputProps & {
  label: string;
  error?: string;
  secure?: boolean;
};

export const FormField = forwardRef<TextInput, Props>(function FormField(
  { label, error, secure, style, ...rest },
  ref,
) {
  const [hidden, setHidden] = useState(!!secure);
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.field, focused && styles.focused, !!error && styles.errored]}>
        <TextInput
          ref={ref}
          style={[styles.input, style]}
          placeholderTextColor={Colors.muted}
          secureTextEntry={hidden}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...rest}
        />
        {secure ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
            hitSlop={12}
            onPress={() => setHidden((v) => !v)}>
            <Text style={styles.toggle}>{hidden ? 'Show' : 'Hide'}</Text>
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { ...Type.caption, color: Colors.muted },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 52,
    paddingHorizontal: 16,
    borderRadius: Radius.chip,
    borderWidth: 1,
    borderColor: Colors.line,
    backgroundColor: Colors.surface,
  },
  focused: { borderColor: Colors.violet },
  errored: { borderColor: Colors.rose },
  input: { flex: 1, ...Type.body, color: Colors.ink, paddingVertical: 12 },
  toggle: { ...Type.caption, color: Colors.violetDeep },
  error: { ...Type.caption, color: Colors.rose },
});
