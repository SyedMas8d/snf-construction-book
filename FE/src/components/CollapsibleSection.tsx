import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function CollapsibleSection({
  title,
  subtitle,
  defaultExpanded = false,
  expanded: controlledExpanded,
  onToggle,
  children,
}: {
  title: string;
  subtitle?: string;
  defaultExpanded?: boolean;
  expanded?: boolean;
  onToggle?: (expanded: boolean) => void;
  children: React.ReactNode;
}) {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  const expanded = controlledExpanded ?? internalExpanded;

  function toggle() {
    const next = !expanded;
    if (onToggle) {
      onToggle(next);
    } else {
      setInternalExpanded(next);
    }
  }

  return (
    <View style={styles.container}>
      <Pressable style={styles.header} onPress={toggle}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color="#6b7280" />
      </Pressable>
      {expanded && <View style={styles.body}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    marginBottom: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#f9fafb',
  },
  headerText: { flex: 1, marginRight: 8 },
  title: { fontSize: 15, fontWeight: '700', color: '#111827' },
  subtitle: { color: '#6b7280', fontSize: 12, marginTop: 2 },
  body: { padding: 12, gap: 8 },
});
