import React, { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';

export function CopyButton({ value, color = '#6b7280' }: { value: string; color?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await Clipboard.setStringAsync(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Pressable onPress={handleCopy} hitSlop={8} style={styles.button}>
      <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={16} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { paddingHorizontal: 4, paddingVertical: 2 },
});
