import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api/client';
import { CustomerPayment } from '../api/types';
import { DatePickerField } from './DatePickerField';
import { todayDateString } from '../utils/date';
import { colors, radius, spacing, typography } from '../theme/theme';

export function CustomerPaymentsPanel({ siteId, onChanged }: { siteId: string; onChanged?: () => void }) {
  const [payments, setPayments] = useState<CustomerPayment[]>([]);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayDateString());
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setListError(null);
    try {
      setPayments(await api.sites.payments.list(siteId));
    } catch (err) {
      setListError(err instanceof Error ? err.message : 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId]);

  async function handleAdd() {
    setFormError(null);
    const numericAmount = Number(amount);
    if (!amount.trim() || Number.isNaN(numericAmount) || numericAmount <= 0) {
      setFormError('Enter a valid amount');
      return;
    }
    setSubmitting(true);
    try {
      await api.sites.payments.create(siteId, {
        amount: numericAmount,
        date: new Date(`${date}T00:00:00.000Z`).toISOString(),
        note: note.trim() || undefined,
      });
      setAmount('');
      setNote('');
      setDate(todayDateString());
      await load();
      onChanged?.();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to add payment');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.sites.payments.delete(siteId, id);
      await load();
      onChanged?.();
    } catch (err) {
      setListError(err instanceof Error ? err.message : 'Failed to delete payment');
    }
  }

  const total = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <View style={styles.container}>
      <Text style={styles.total}>Total received: ₹{total.toLocaleString('en-IN')}</Text>

      <TextInput
        style={styles.input}
        placeholder="Amount received"
        placeholderTextColor={colors.textFaint}
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
      />
      <DatePickerField date={date} onChange={setDate} />
      <TextInput
        style={styles.input}
        placeholder="Note (optional)"
        placeholderTextColor={colors.textFaint}
        value={note}
        onChangeText={setNote}
      />
      {formError && <Text style={styles.error}>{formError}</Text>}
      <Pressable style={styles.button} onPress={handleAdd} disabled={submitting}>
        <Text style={styles.buttonText}>{submitting ? 'Adding…' : 'Add Payment'}</Text>
      </Pressable>

      {listError && <Text style={styles.error}>{listError}</Text>}
      {loading && <Text style={styles.loading}>Loading…</Text>}
      {!loading && payments.length === 0 && <Text style={styles.empty}>No payments recorded yet</Text>}
      {payments.map((payment) => (
        <View key={payment._id} style={styles.paymentRow}>
          <View style={styles.paymentRowText}>
            <Text style={styles.paymentAmount}>₹{payment.amount.toLocaleString('en-IN')}</Text>
            <Text style={styles.paymentMeta}>
              {payment.date.slice(0, 10)}
              {payment.note ? ` · ${payment.note}` : ''}
            </Text>
          </View>
          <Pressable onPress={() => handleDelete(payment._id)} hitSlop={8}>
            <Ionicons name="trash-outline" size={18} color={colors.danger} />
          </Pressable>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  total: { ...typography.bodyStrong },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  buttonText: { color: colors.onPrimary, fontWeight: '600' },
  error: { color: colors.danger },
  loading: { color: colors.textMuted, fontStyle: 'italic' },
  empty: { color: colors.textFaint, fontStyle: 'italic', textAlign: 'center', marginTop: spacing.sm },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  paymentRowText: { flex: 1 },
  paymentAmount: { ...typography.bodyStrong },
  paymentMeta: { ...typography.caption, marginTop: 2 },
});
