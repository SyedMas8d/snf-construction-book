import React from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, spacing } from '../../theme/theme';

export function Screen({
  children,
  scroll,
  contentStyle,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  contentStyle?: ViewStyle;
}) {
  if (scroll) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={[styles.content, contentStyle]}>
        {children}
      </ScrollView>
    );
  }
  return <View style={[styles.container, styles.content, contentStyle]}>{children}</View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg },
});
