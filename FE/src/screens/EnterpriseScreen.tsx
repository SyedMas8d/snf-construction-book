import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { api } from '../api/client';
import { Screen } from '../components/ui/Screen';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { TextField } from '../components/ui/TextField';
import { colors, spacing, typography } from '../theme/theme';

export function EnterpriseScreen() {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const settings = await api.enterprise.get();
      setName(settings.name);
      setAddress(settings.address);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load enterprise settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave() {
    setError(null);
    setSaved(false);
    if (!name.trim() || !address.trim()) {
      setError('Name and address are required');
      return;
    }
    setSaving(true);
    try {
      await api.enterprise.update({ name: name.trim(), address: address.trim() });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save enterprise settings');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen scroll>
      <Text style={styles.title}>Enterprise</Text>
      <Text style={styles.subtitle}>
        This name and address appear on the letterhead of exported pay slip PDFs.
      </Text>

      <Card style={styles.form}>
        {loading && <Text style={styles.hint}>Loading…</Text>}
        <TextField label="Company Name" value={name} onChangeText={setName} placeholder="Company name" />
        <TextField label="Address" value={address} onChangeText={setAddress} placeholder="Company address" multiline />
        {error && <Text style={styles.error}>{error}</Text>}
        {saved && <Text style={styles.success}>Saved</Text>}
        <Button title={saving ? 'Saving…' : 'Save'} loading={saving} onPress={handleSave} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.title, marginBottom: spacing.xs },
  subtitle: { ...typography.body, color: colors.textMuted, marginBottom: spacing.lg },
  form: { gap: spacing.sm },
  hint: { color: colors.textMuted, fontStyle: 'italic' },
  error: { color: colors.danger, fontWeight: '600' },
  success: { color: colors.success, fontWeight: '600' },
});
