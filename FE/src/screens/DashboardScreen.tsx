import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSites } from '../context/SitesContext';
import { ActiveSiteBanner } from '../components/ActiveSiteBanner';
import { DateNav, todayDateString } from '../components/DateNav';
import { ExportRangeDialog } from '../components/ExportRangeDialog';
import { api } from '../api/client';
import { DashboardSummary } from '../api/types';
import { downloadBlobAsFile } from '../utils/downloadBlob';
import { Screen } from '../components/ui/Screen';
import { Card } from '../components/ui/Card';
import { Chip } from '../components/ui/Chip';
import { Button } from '../components/ui/Button';
import { colors, spacing, typography } from '../theme/theme';

function daysAgoString(days: number): string {
  const d = new Date(`${todayDateString()}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

function startOfMonthString(): string {
  const d = new Date(`${todayDateString()}T00:00:00.000Z`);
  d.setUTCDate(1);
  return d.toISOString().slice(0, 10);
}

const PRESETS: { label: string; from: () => string; to: () => string }[] = [
  { label: 'Today', from: todayDateString, to: todayDateString },
  { label: 'Last 7 days', from: () => daysAgoString(6), to: todayDateString },
  { label: 'This month', from: startOfMonthString, to: todayDateString },
];

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
  const [from, setFrom] = useState(daysAgoString(6));
  const [to, setTo] = useState(todayDateString());
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  const load = useCallback(async () => {
    if (!selectedSiteId) {
      setSummary(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setSummary(await api.dashboard.get(selectedSiteId, from, to));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [selectedSiteId, from, to]);

  useEffect(() => {
    load();
  }, [load]);

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

      <View style={styles.presetRow}>
        {PRESETS.map((preset) => (
          <Chip
            key={preset.label}
            label={preset.label}
            onPress={() => {
              setFrom(preset.from());
              setTo(preset.to());
            }}
          />
        ))}
      </View>

      <Text style={styles.rangeLabel}>From</Text>
      <DateNav date={from} onChange={setFrom} />
      <Text style={styles.rangeLabel}>To</Text>
      <DateNav date={to} onChange={setTo} />

      <Button title="Export to Excel" variant="success" onPress={() => setExportDialogOpen(true)} style={styles.exportButton} />
      <ExportRangeDialog
        visible={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        onConfirm={handleExport}
        exporting={exporting}
      />

      {error && <Text style={styles.error}>{error}</Text>}
      {loading && <Text style={styles.loading}>Loading…</Text>}

      {summary && !loading && (
        <>
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Wages</Text>
            <StatRow label="Total worker-days" value={summary.wages.totalWorkerCount} />
            <StatRow label="Unpaid worker-days" value={summary.wages.unpaidWorkerCount} />
            <StatRow label="Daily logs" value={summary.wages.entryCount} />
          </Card>

          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Inventory</Text>
            <StatRow label="Total stock in" value={summary.inventory.totalStockIn} />
            <StatRow label="Total usage" value={summary.inventory.totalUsage} />

            {summary.inventory.byItem.length === 0 && (
              <Text style={styles.empty}>No inventory movement in this range</Text>
            )}
            {summary.inventory.byItem.map((row) => (
              <View key={row.itemId} style={styles.itemRow}>
                <Text style={styles.itemName}>{row.name}</Text>
                <Text style={styles.itemStats}>
                  +{row.stockIn} / -{row.usage} · balance {row.balanceStock} {row.unit}
                </Text>
              </View>
            ))}
          </Card>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.title, marginBottom: spacing.md },
  presetRow: { flexDirection: 'row', marginBottom: spacing.md },
  rangeLabel: { ...typography.label, marginBottom: spacing.xs },
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
  empty: { color: colors.textMuted, fontStyle: 'italic', marginTop: spacing.sm },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  itemName: { ...typography.bodyStrong, fontSize: 13 },
  itemStats: { fontSize: 13, color: colors.textMuted },
});
