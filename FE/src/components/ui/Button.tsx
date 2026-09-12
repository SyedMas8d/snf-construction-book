import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '../../theme/theme';

type Variant = 'primary' | 'secondary' | 'danger' | 'success';

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variantStyles[variant].container,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      {loading && <ActivityIndicator size="small" color={variantStyles[variant].text.color} style={styles.spinner} />}
      <Text style={[styles.text, variantStyles[variant].text]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { fontSize: 15, fontWeight: '700' },
  spinner: { marginRight: spacing.sm },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
});

const variantStyles: Record<Variant, { container: ViewStyle; text: { color: string } }> = {
  primary: { container: { backgroundColor: colors.primary }, text: { color: colors.onPrimary } },
  success: { container: { backgroundColor: colors.success }, text: { color: colors.onPrimary } },
  danger: { container: { backgroundColor: colors.dangerMuted }, text: { color: colors.danger } },
  secondary: {
    container: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderStrong },
    text: { color: colors.text },
  },
};
