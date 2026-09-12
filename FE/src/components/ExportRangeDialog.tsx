import React, { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { DateNav, todayDateString } from './DateNav';
import { colors, spacing, typography } from '../theme/theme';

function daysBetween(from: string, to: string): number {
  const a = new Date(`${from}T00:00:00.000Z`).getTime();
  const b = new Date(`${to}T00:00:00.000Z`).getTime();
  return Math.round((b - a) / 86400000) + 1;
}

export function ExportRangeDialog({
  visible,
  onClose,
  onConfirm,
  exporting,
  maxDays = 30,
  title = 'Export Dashboard',
  confirmLabel = 'Export to Excel',
}: {
  visible: boolean;
  onClose: () => void;
  onConfirm: (from: string, to: string) => void;
  exporting: boolean;
  maxDays?: number;
  title?: string;
  confirmLabel?: string;
}) {
  const [from, setFrom] = useState(todayDateString());
  const [to, setTo] = useState(todayDateString());
  const span = daysBetween(from, to);
  const invalid = span < 1 || span > maxDays;

  return (
    <Modal visible={visible} onClose={onClose}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>Choose a date range (up to {maxDays} days)</Text>

      <Text style={styles.label}>From</Text>
      <DateNav date={from} onChange={setFrom} />
      <Text style={styles.label}>To</Text>
      <DateNav date={to} onChange={setTo} />

      {invalid && (
        <Text style={styles.error}>
          {span > maxDays
            ? `Range can't exceed ${maxDays} days (currently ${span}).`
            : '"From" must be on or before "To".'}
        </Text>
      )}

      <Button
        title={exporting ? 'Exporting…' : confirmLabel}
        variant="success"
        loading={exporting}
        disabled={invalid}
        onPress={() => onConfirm(from, to)}
      />
      <Button title="Cancel" variant="secondary" onPress={onClose} />
    </Modal>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.heading },
  subtitle: { ...typography.body, color: colors.textMuted, marginBottom: spacing.sm },
  label: { ...typography.label, marginTop: spacing.sm },
  error: { color: colors.danger, fontWeight: '600', marginTop: spacing.xs },
});
