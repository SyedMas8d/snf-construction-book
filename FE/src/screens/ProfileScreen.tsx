import React, { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Screen } from '../components/ui/Screen';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { TextField } from '../components/ui/TextField';
import { colors, spacing, typography } from '../theme/theme';

export function ProfileScreen() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleChangePassword() {
    setError(null);
    setSaved(false);
    if (!currentPassword || !newPassword) {
      setError('Enter your current and new password');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match');
      return;
    }
    setSubmitting(true);
    try {
      await api.auth.changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen scroll>
      <Text style={styles.title}>Profile</Text>

      <Card style={styles.infoCard}>
        <InfoRow label="Name" value={user?.name ?? '—'} />
        <InfoRow label="Email" value={user?.email ?? '—'} />
        <InfoRow label="Phone" value={user?.phone ?? '—'} />
        <InfoRow label="Role" value={user?.role ?? '—'} capitalize />
      </Card>

      <Text style={styles.sectionTitle}>Change Password</Text>
      <Card style={styles.form}>
        <TextField
          label="Current Password"
          placeholder="••••••••"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
        />
        <TextField
          label="New Password"
          placeholder="At least 6 characters"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
        />
        <TextField
          label="Confirm New Password"
          placeholder="••••••••"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />
        {error && <Text style={styles.error}>{error}</Text>}
        {saved && <Text style={styles.success}>Password changed</Text>}
        <Button
          title={submitting ? 'Saving…' : 'Change Password'}
          loading={submitting}
          onPress={handleChangePassword}
        />
      </Card>
    </Screen>
  );
}

function InfoRow({ label, value, capitalize }: { label: string; value: string; capitalize?: boolean }) {
  return (
    <>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, capitalize && styles.infoValueCapitalize]}>{value}</Text>
    </>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.title, marginBottom: spacing.lg },
  infoCard: { gap: 2, marginBottom: spacing.lg },
  infoLabel: { ...typography.label, marginTop: spacing.sm },
  infoValue: { ...typography.body, color: colors.text },
  infoValueCapitalize: { textTransform: 'capitalize' },
  sectionTitle: { ...typography.heading, marginBottom: spacing.sm },
  form: { gap: spacing.sm },
  error: { color: colors.danger, fontWeight: '600' },
  success: { color: colors.success, fontWeight: '600' },
});
