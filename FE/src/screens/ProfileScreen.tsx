import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Screen } from '../components/ui/Screen';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { TextField } from '../components/ui/TextField';
import { CollapsibleSection } from '../components/CollapsibleSection';
import { colors, radius, spacing, typography } from '../theme/theme';

export function ProfileScreen() {
  const { user } = useAuth();
  const [formExpanded, setFormExpanded] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!saved) return;
    const timer = setTimeout(() => setSaved(false), 2500);
    return () => clearTimeout(timer);
  }, [saved]);

  async function handleChangePassword() {
    setError(null);
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
      setFormExpanded(false);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.root}>
      <Screen scroll>
        <Text style={styles.title}>Profile</Text>

        <Card style={styles.infoCard}>
          <InfoRow label="Name" value={user?.name ?? '—'} />
          <InfoRow label="Email" value={user?.email ?? '—'} />
          <InfoRow label="Phone" value={user?.phone ?? '—'} />
          <InfoRow label="Role" value={user?.role ?? '—'} capitalize />
        </Card>

        <CollapsibleSection
          title="Change Password"
          subtitle="Update your account password"
          expanded={formExpanded}
          onToggle={setFormExpanded}
        >
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
          <Button
            title={submitting ? 'Saving…' : 'Change Password'}
            loading={submitting}
            onPress={handleChangePassword}
          />
        </CollapsibleSection>
      </Screen>

      {saved && (
        <View style={styles.toastOverlay} pointerEvents="none">
          <View style={styles.toast}>
            <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            <Text style={styles.toastText}>Password updated successfully</Text>
          </View>
        </View>
      )}
    </View>
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
  root: { flex: 1 },
  title: { ...typography.title, marginBottom: spacing.lg },
  infoCard: { gap: 2, marginBottom: spacing.lg },
  infoLabel: { ...typography.label, marginTop: spacing.sm },
  infoValue: { ...typography.body, color: colors.text },
  infoValueCapitalize: { textTransform: 'capitalize' },
  error: { color: colors.danger, fontWeight: '600' },
  toastOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.successMuted,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  toastText: { color: colors.success, fontWeight: '700', fontSize: 13 },
});
