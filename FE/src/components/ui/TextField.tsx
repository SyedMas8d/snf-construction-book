import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../theme/theme';

export function TextField({
  label,
  style,
  secureTextEntry,
  ...inputProps
}: { label?: string } & TextInputProps) {
  const [visible, setVisible] = useState(false);
  const isPasswordField = !!secureTextEntry;

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.inputRow}>
        <TextInput
          placeholderTextColor={colors.textFaint}
          style={[styles.input, isPasswordField && styles.inputWithIcon, style]}
          secureTextEntry={isPasswordField && !visible}
          {...inputProps}
        />
        {isPasswordField && (
          <Pressable style={styles.eyeButton} onPress={() => setVisible((v) => !v)} hitSlop={8}>
            <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs },
  label: typography.label,
  inputRow: { position: 'relative', justifyContent: 'center' },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  inputWithIcon: { paddingRight: 44 },
  eyeButton: {
    position: 'absolute',
    right: spacing.sm,
    height: '100%',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
});
