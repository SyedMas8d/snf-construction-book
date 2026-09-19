import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSites } from '../context/SitesContext';
import { ActiveSiteBanner } from '../components/ActiveSiteBanner';
import { ExportRangeDialog } from '../components/ExportRangeDialog';
import { CollapsibleSection } from '../components/CollapsibleSection';
import { CustomerPaymentsPanel } from '../components/CustomerPaymentsPanel';
import { api } from '../api/client';
import { DashboardSummary } from '../api/types';
import { downloadBlobAsFile } from '../utils/downloadBlob';
import { Screen } from '../components/ui/Screen';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { colors, radius, spacing, typography } from '../theme/theme';

function formatCurrency(value: number): string {
  return `₹${value.toLocaleString('en-IN')}`;
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

export function DashboardScreen() {
  const { selectedSiteId } = useSites();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [paymentsExpanded, setPaymentsExpanded] = useState(false);
  const [editingCost, setEditingCost] = useState(false);
  const [costInput, setCostInput] = useState('');
  const [savingCost, setSavingCost] = useState(false);
  const [costError, setCostError] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesInput, setNotesInput] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!selectedSiteId) {
      setSummary(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setSummary(await api.dashboard.get(selectedSiteId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [selectedSiteId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setEditingCost(false);
    setEditingNotes(false);
  }, [selectedSiteId]);

  function startEditingCost() {
    setCostInput(summary?.estimatedCost?.toString() ?? '');
    setCostError(null);
    setEditingCost(true);
  }

  async function handleSaveCost() {
    if (!selectedSiteId) return;
    setCostError(null);
    setSavingCost(true);
    try {
      await api.sites.update(selectedSiteId, {
        estimatedCost: costInput.trim() ? Number(costInput) : undefined,
      });
      setEditingCost(false);
      await load();
    } catch (err) {
      setCostError(err instanceof Error ? err.message : 'Failed to update estimated cost');
    } finally {
      setSavingCost(false);
    }
  }

  function startEditingNotes() {
    setNotesInput(summary?.notes ?? '');
    setNotesError(null);
    setEditingNotes(true);
  }

  async function handleSaveNotes() {
    if (!selectedSiteId) return;
    setNotesError(null);
    setSavingNotes(true);
    try {
      await api.sites.update(selectedSiteId, { notes: notesInput.trim() || undefined });
      setEditingNotes(false);
      await load();
    } catch (err) {
      setNotesError(err instanceof Error ? err.message : 'Failed to update notes');
    } finally {
      setSavingNotes(false);
    }
  }

  async function handleExport(exportFrom: string, exportTo: string) {
    if (!selectedSiteId) {
      setError('Select a site first');
      return;
    }
    setExporting(true);
    setError(null);
    try {
      const blob = await api.dashboard.exportXlsx(selectedSiteId, exportFrom, exportTo);
      await downloadBlobAsFile(blob, `dashboard-${exportFrom}-to-${exportTo}.xlsx`);
      setExportDialogOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export');
    } finally {
      setExporting(false);
    }
  }

  return (
    <Screen scroll>
      <Text style={styles.title}>Dashboard</Text>
      <ActiveSiteBanner />

      <Button title="Export to Excel" variant="success" onPress={() => setExportDialogOpen(true)} style={styles.exportButton} />
      <ExportRangeDialog
        visible={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        onConfirm={handleExport}
        exporting={exporting}
      />

      {error && <Text style={styles.error}>{error}</Text>}
      {loading && <Text style={styles.loading}>Loading…</Text>}

      {selectedSiteId && (
        <CollapsibleSection
          title="Customer Payments"
          subtitle="Log payments received from the customer for this site"
          expanded={paymentsExpanded}
          onToggle={setPaymentsExpanded}
        >
          <CustomerPaymentsPanel siteId={selectedSiteId} onChanged={load} />
        </CollapsibleSection>
      )}

      {summary && !loading && (
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Site Cost</Text>

          {editingCost ? (
            <View style={styles.costEditRow}>
              <TextInput
                style={styles.costInput}
                placeholder="Estimated cost"
                placeholderTextColor={colors.textFaint}
                value={costInput}
                onChangeText={setCostInput}
                keyboardType="numeric"
                autoFocus
              />
              <Pressable style={styles.costIconButton} onPress={handleSaveCost} disabled={savingCost} hitSlop={8}>
                <Ionicons name="checkmark" size={20} color={colors.success} />
              </Pressable>
              <Pressable style={styles.costIconButton} onPress={() => setEditingCost(false)} hitSlop={8}>
                <Ionicons name="close" size={20} color={colors.textMuted} />
              </Pressable>
            </View>
          ) : (
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Estimated cost</Text>
              <View style={styles.costValueRow}>
                <Text style={styles.statValue}>
                  {summary.estimatedCost !== undefined ? formatCurrency(summary.estimatedCost) : '—'}
                </Text>
                <Pressable onPress={startEditingCost} hitSlop={8}>
                  <Ionicons name="pencil" size={14} color={colors.textMuted} />
                </Pressable>
              </View>
            </View>
          )}
          {costError && <Text style={styles.error}>{costError}</Text>}

          <StatRow label="Received from customer" value={formatCurrency(summary.totalReceived)} />
          <StatRow label="Spent on wages" value={formatCurrency(summary.totalWagesPaid)} />
          <StatRow label="Spent on materials" value={formatCurrency(summary.totalMaterialSpend)} />
        </Card>
      )}

      {summary && !loading && (
        <Card style={styles.card}>
          <View style={styles.notesHeaderRow}>
            <Text style={styles.cardTitle}>Notes</Text>
            {!editingNotes && (
              <Pressable onPress={startEditingNotes} hitSlop={8}>
                <Ionicons name="pencil" size={14} color={colors.textMuted} />
              </Pressable>
            )}
          </View>

          {editingNotes ? (
            <View style={styles.notesEditColumn}>
              <TextInput
                style={styles.notesInput}
                placeholder="Notes about this site"
                placeholderTextColor={colors.textFaint}
                value={notesInput}
                onChangeText={setNotesInput}
                multiline
                autoFocus
              />
              <View style={styles.notesActionsRow}>
                <Pressable style={styles.costIconButton} onPress={handleSaveNotes} disabled={savingNotes} hitSlop={8}>
                  <Ionicons name="checkmark" size={20} color={colors.success} />
                </Pressable>
                <Pressable style={styles.costIconButton} onPress={() => setEditingNotes(false)} hitSlop={8}>
                  <Ionicons name="close" size={20} color={colors.textMuted} />
                </Pressable>
              </View>
            </View>
          ) : (
            <Text style={summary.notes ? styles.notesText : styles.notesEmpty}>
              {summary.notes || 'No notes yet'}
            </Text>
          )}
          {notesError && <Text style={styles.error}>{notesError}</Text>}
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.title, marginBottom: spacing.md },
  exportButton: { marginTop: spacing.sm, marginBottom: spacing.xs },
  error: { color: colors.danger, marginBottom: spacing.sm, fontWeight: '600' },
  loading: { color: colors.textMuted, fontStyle: 'italic', marginBottom: spacing.sm },
  card: { marginTop: spacing.md },
  cardTitle: { ...typography.heading, marginBottom: spacing.sm },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  statLabel: { ...typography.body, color: colors.textMuted },
  statValue: { ...typography.bodyStrong },
  costValueRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  costEditRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 6 },
  costInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  costIconButton: { padding: 4 },
  notesHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  notesText: { ...typography.body, color: colors.text },
  notesEmpty: { ...typography.body, color: colors.textFaint, fontStyle: 'italic' },
  notesEditColumn: { gap: spacing.sm },
  notesInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.surface,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  notesActionsRow: { flexDirection: 'row', gap: spacing.sm },
});
