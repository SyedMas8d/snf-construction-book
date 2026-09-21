import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSites } from '../context/SitesContext';
import { ActiveSiteBanner } from '../components/ActiveSiteBanner';
import { api } from '../api/client';
import { DailyLog, RecentWagePayment, WorkLogPayable } from '../api/types';
import { downloadBlobAsFile } from '../utils/downloadBlob';
import { todayDateString } from '../utils/date';
import { Screen } from '../components/ui/Screen';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Chip } from '../components/ui/Chip';
import { DateRangeSearch } from '../components/DateRangeSearch';
import { colors, radius, spacing, typography } from '../theme/theme';

type ViewMode = 'payable' | 'paid';

const PAGE_LIMIT = 10;

export function WagesScreen() {
  const { selectedSiteId } = useSites();
  const [mode, setMode] = useState<ViewMode>('payable');
  const [payables, setPayables] = useState<WorkLogPayable[]>([]);
  const [recentPaid, setRecentPaid] = useState<RecentWagePayment[]>([]);
  const [recentPaidTotal, setRecentPaidTotal] = useState(0);
  const [recentPaidPage, setRecentPaidPage] = useState(1);
  const [searchFrom, setSearchFrom] = useState<string | null>(null);
  const [searchTo, setSearchTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recentPaidTotalPages = Math.max(1, Math.ceil(recentPaidTotal / PAGE_LIMIT));

  const loadPayables = useCallback(async () => {
    if (!selectedSiteId) {
      setPayables([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setPayables(await api.wages.workLogPayables(selectedSiteId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payable work logs');
    } finally {
      setLoading(false);
    }
  }, [selectedSiteId]);

  const loadRecentPaid = useCallback(
    async (targetPage: number) => {
      if (!selectedSiteId) {
        setRecentPaid([]);
        setRecentPaidTotal(0);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const result = await api.wages.recentPaid(selectedSiteId, {
          page: targetPage,
          limit: PAGE_LIMIT,
          from: searchFrom ?? undefined,
          to: searchTo ?? undefined,
        });
        setRecentPaid(result.items);
        setRecentPaidTotal(result.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load recent payments');
      } finally {
        setLoading(false);
      }
    },
    [selectedSiteId, searchFrom, searchTo]
  );

  useEffect(() => {
    if (mode === 'payable') loadPayables();
  }, [mode, loadPayables]);

  useEffect(() => {
    setRecentPaidPage(1);
  }, [searchFrom, searchTo, selectedSiteId]);

  useEffect(() => {
    if (mode === 'paid') loadRecentPaid(recentPaidPage);
  }, [mode, loadRecentPaid, recentPaidPage]);

  async function handlePaidRow() {
    await loadPayables();
    if (mode === 'paid') await loadRecentPaid(recentPaidPage);
  }

  return (
    <Screen>
      <Text style={styles.title}>Wages</Text>
      <ActiveSiteBanner />

      <View style={styles.modeRow}>
        <Chip label="Payable" active={mode === 'payable'} onPress={() => setMode('payable')} />
        <Chip label="Recently Paid" active={mode === 'paid'} onPress={() => setMode('paid')} />
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      {mode === 'payable' ? (
        <FlatList
          data={payables}
          keyExtractor={(p) => p.workLogId}
          onRefresh={loadPayables}
          refreshing={loading}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            !loading ? (
              <Text style={styles.empty}>
                No work logs yet — start one from the Daily Logs tab, then pay it here once entries are logged.
              </Text>
            ) : null
          }
          renderItem={({ item }) => <WorkLogPayableCard site={selectedSiteId!} payable={item} onPaid={handlePaidRow} />}
        />
      ) : (
        <>
          <DateRangeSearch
            from={searchFrom}
            to={searchTo}
            onApply={(from, to) => {
              setSearchFrom(from);
              setSearchTo(to);
            }}
          />
          {!loading && recentPaid.length > 0 && (
            <Text style={styles.summary}>
              {recentPaidTotal} payment{recentPaidTotal === 1 ? '' : 's'} — tap Mark Unpaid to undo one
            </Text>
          )}
          <FlatList
            data={recentPaid}
            keyExtractor={(p) => p.paymentId}
            onRefresh={() => loadRecentPaid(recentPaidPage)}
            refreshing={loading}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              !loading ? (
                <Text style={styles.empty}>
                  {searchFrom || searchTo ? 'No payments in this date range' : 'No payments recorded yet'}
                </Text>
              ) : null
            }
            renderItem={({ item }) => (
              <RecentPaymentCard
                site={selectedSiteId!}
                payment={item}
                onChanged={() => loadRecentPaid(recentPaidPage)}
              />
            )}
            ListFooterComponent={
              recentPaidTotal > 0 ? (
                <PaginationControls
                  page={recentPaidPage}
                  totalPages={recentPaidTotalPages}
                  onChange={setRecentPaidPage}
                />
              ) : null
            }
          />
        </>
      )}
    </Screen>
  );
}

const MAX_PAYSHEET_RANGE_DAYS = 7;

function daysBetween(from: string, to: string): number {
  const a = new Date(`${from}T00:00:00.000Z`).getTime();
  const b = new Date(`${to}T00:00:00.000Z`).getTime();
  return Math.round((b - a) / 86400000) + 1;
}

function WorkLogPayableCard({
  site,
  payable,
  onPaid,
}: {
  site: string;
  payable: WorkLogPayable;
  onPaid: () => Promise<void>;
}) {
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [paying, setPaying] = useState(false);
  const [unpaying, setUnpaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const rangeTooLong = daysBetween(payable.from, payable.to) > MAX_PAYSHEET_RANGE_DAYS;

  const unpaidRows = payable.rows.filter((row) => row.unpaidWorkerCount > 0);
  const paidRows = payable.rows.filter((row) => row.unpaidWorkerCount === 0);

  async function handleExport() {
    setExportError(null);
    setExporting(true);
    try {
      const blob = await api.wages.exportPaysheet(site, payable.from, payable.to, payable.contractorId);
      await downloadBlobAsFile(blob, `paysheet-${payable.contractorName}-${payable.from}-to-${payable.to}.pdf`);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Failed to export pay slip');
    } finally {
      setExporting(false);
    }
  }

  async function submitPayment() {
    const entries = unpaidRows.map((row) => {
      const raw = amounts[row.workerType]?.trim();
      return { workerType: row.workerType, amount: raw ? Number(raw) : 0 };
    });
    const invalid = entries.find((e) => Number.isNaN(e.amount) || e.amount < 0);
    if (invalid) {
      setPayError(`Enter a valid amount for ${invalid.workerType}`);
      return;
    }
    setPayError(null);
    setPaying(true);
    try {
      const result = await api.wages.payWorkLog({
        site,
        workLogId: payable.workLogId,
        contractor: payable.contractorId,
        entries,
      });
      setAmounts({});
      await onPaid();
      if (result.truncated) {
        Alert.alert(
          'Work log closed',
          `This work log's last day is now ${result.to}, since it had future days that hadn't happened yet. Create a new work log for any dates after that.`
        );
      }
    } catch (err) {
      setPayError(err instanceof Error ? err.message : 'Failed to pay');
    } finally {
      setPaying(false);
    }
  }

  function handlePayAll() {
    if (unpaidRows.length === 0) return;
    if (payable.to > todayDateString()) {
      Alert.alert(
        'Work log has future days',
        `This work log runs through ${payable.to}, but paying now will close it early — its last day will be set to the last date with a logged entry, and it won't accept new entries after that. Create a new work log for later dates. Continue?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Pay & Close', style: 'destructive', onPress: submitPayment },
        ]
      );
      return;
    }
    submitPayment();
  }

  async function handleUnpayAll() {
    setPayError(null);
    setUnpaying(true);
    try {
      await api.wages.unpayWorkLog({
        site,
        workLogId: payable.workLogId,
        contractor: payable.contractorId,
        workerTypes: payable.rows.map((row) => row.workerType),
      });
      await onPaid();
    } catch (err) {
      setPayError(err instanceof Error ? err.message : 'Failed to mark unpaid');
    } finally {
      setUnpaying(false);
    }
  }

  return (
    <Card style={styles.workLogCard}>
      <View style={styles.cardHeaderRow}>
        <View style={styles.cardHeaderText}>
          <Text style={styles.dateHeading}>{payable.contractorName}</Text>
          <Text style={styles.rangeText}>
            {payable.from} → {payable.to}
          </Text>
        </View>
        <Button
          title={exporting ? '…' : 'Export'}
          variant="secondary"
          loading={exporting}
          disabled={rangeTooLong}
          onPress={handleExport}
          style={styles.cardExportButton}
        />
      </View>
      {rangeTooLong && (
        <Text style={styles.hint}>
          This work log spans more than {MAX_PAYSHEET_RANGE_DAYS} days — pay slip export isn't available for it.
        </Text>
      )}
      {exportError && <Text style={styles.error}>{exportError}</Text>}

      {payable.rows.map((row) => (
        <PayableRow
          key={row.workerType}
          site={site}
          workLogId={payable.workLogId}
          workerType={row.workerType}
          meta={
            row.unpaidWorkerCount > 0
              ? `${row.unpaidWorkerCount} of ${row.totalWorkerCount} worker-days unpaid`
              : `Fully paid — ${row.totalWorkerCount} worker-days${row.paidAmount > 0 ? ` · ₹${row.paidAmount}` : ''}`
          }
          payable={row.unpaidWorkerCount > 0}
          amount={amounts[row.workerType] ?? ''}
          onChangeAmount={(value) => setAmounts((current) => ({ ...current, [row.workerType]: value }))}
        />
      ))}

      {payError && <Text style={styles.error}>{payError}</Text>}
      <View style={styles.cardPayActionsRow}>
        {unpaidRows.length > 0 && (
          <Button
            title={paying ? 'Paying…' : 'Pay'}
            variant="success"
            loading={paying}
            onPress={handlePayAll}
            style={styles.cardPayButton}
          />
        )}
        {paidRows.length > 0 && (
          <Button
            title={unpaying ? 'Saving…' : 'Mark Unpaid'}
            variant="danger"
            loading={unpaying}
            onPress={handleUnpayAll}
            style={styles.cardPayButton}
          />
        )}
      </View>
    </Card>
  );
}

function PayableRow({
  site,
  workLogId,
  workerType,
  meta,
  payable,
  amount,
  onChangeAmount,
}: {
  site: string;
  workLogId: string;
  workerType: string;
  meta: string;
  payable: boolean;
  amount: string;
  onChangeAmount: (value: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [history, setHistory] = useState<DailyLog[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    setHistoryError(null);
    try {
      setHistory(await api.dailyLogs.list(site, { workLog: workLogId, workerType }));
    } catch (err) {
      setHistoryError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setLoadingHistory(false);
    }
  }, [site, workLogId, workerType]);

  useEffect(() => {
    if (expanded) loadHistory();
  }, [expanded, loadHistory]);

  return (
    <View style={styles.entryRow}>
      <Pressable onPress={() => setExpanded((current) => !current)}>
        <Text style={styles.entryLabel}>
          {workerType} {expanded ? '▾' : '▸'}
        </Text>
        <Text style={[styles.entryMeta, payable ? styles.entryMetaUnpaid : styles.entryMetaPaid]}>{meta}</Text>
      </Pressable>

      {expanded && (
        <View style={styles.historyPanel}>
          {historyError && <Text style={styles.error}>{historyError}</Text>}
          {loadingHistory && <Text style={styles.historyHint}>Loading…</Text>}
          {!loadingHistory && history.length === 0 && <Text style={styles.historyHint}>No daily logs yet</Text>}
          {[...history]
            .sort((a, b) => a.date.localeCompare(b.date))
            .map((log) => (
              <View key={log._id} style={styles.historyRow}>
                <Text style={styles.historyDate}>{log.date.slice(0, 10)}</Text>
                <Text style={styles.historyCount}>×{log.count}</Text>
                <Text style={[styles.historyStatus, log.paid ? styles.entryMetaPaid : styles.entryMetaUnpaid]}>
                  {log.paid ? 'Paid' : 'Unpaid'}
                </Text>
              </View>
            ))}
        </View>
      )}

      {payable && (
        <TextInput
          style={styles.amountInput}
          placeholder="Amount (defaults to 0)"
          placeholderTextColor={colors.textFaint}
          value={amount}
          onChangeText={onChangeAmount}
          keyboardType="numeric"
        />
      )}
    </View>
  );
}

function RecentPaymentCard({
  site,
  payment,
  onChanged,
}: {
  site: string;
  payment: RecentWagePayment;
  onChanged: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleMarkUnpaid() {
    setSubmitting(true);
    setError(null);
    try {
      await api.wages.markUnpaid({
        site,
        contractor: payment.contractorId,
        workerType: payment.workerType,
        from: payment.from,
        to: payment.to,
      });
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark unpaid');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card style={styles.paymentCard}>
      <Text style={styles.dateHeading}>
        {payment.contractorName} — {payment.workerType}
      </Text>
      <Text style={styles.paymentMeta}>
        {payment.from === payment.to ? payment.from : `${payment.from} → ${payment.to}`} · ₹{payment.amount}
      </Text>
      {error && <Text style={styles.error}>{error}</Text>}
      <Button
        title={submitting ? 'Saving…' : 'Mark Unpaid'}
        variant="danger"
        loading={submitting}
        onPress={handleMarkUnpaid}
        style={styles.markUnpaidButton}
      />
    </Card>
  );
}

function PaginationControls({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  return (
    <View style={styles.pagination}>
      <Pressable
        style={[styles.pageButton, page <= 1 && styles.pageButtonDisabled]}
        onPress={() => onChange(page - 1)}
        disabled={page <= 1}
      >
        <Text style={styles.pageButtonText}>Prev</Text>
      </Pressable>
      <Text style={styles.pageIndicator}>
        Page {page} of {totalPages}
      </Text>
      <Pressable
        style={[styles.pageButton, page >= totalPages && styles.pageButtonDisabled]}
        onPress={() => onChange(page + 1)}
        disabled={page >= totalPages}
      >
        <Text style={styles.pageButtonText}>Next</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.title, marginBottom: spacing.md },
  modeRow: { flexDirection: 'row', marginBottom: spacing.md },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  pageButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  pageButtonDisabled: { opacity: 0.4 },
  pageButtonText: { color: colors.text, fontWeight: '600', fontSize: 13 },
  pageIndicator: { color: colors.textMuted, fontSize: 13 },
  summary: { ...typography.label, marginBottom: spacing.sm },
  error: { color: colors.danger, fontWeight: '600', marginBottom: spacing.sm },
  empty: { color: colors.textMuted, fontStyle: 'italic', textAlign: 'center', marginTop: spacing.xxl },
  list: { gap: spacing.md, paddingBottom: spacing.xl },
  workLogCard: { gap: spacing.xs },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  cardHeaderText: { flex: 1 },
  cardExportButton: { paddingVertical: 8, paddingHorizontal: spacing.md },
  hint: { ...typography.caption, fontStyle: 'italic', marginBottom: spacing.xs },
  dateHeading: { ...typography.heading },
  rangeText: { ...typography.body, color: colors.textMuted, marginBottom: spacing.xs },
  entryRow: {
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 2,
  },
  entryLabel: { ...typography.bodyStrong },
  entryMeta: { ...typography.caption },
  entryMetaUnpaid: { color: colors.danger },
  entryMetaPaid: { color: colors.success },
  amountInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.surface,
    marginTop: spacing.xs,
  },
  cardPayActionsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  cardPayButton: { flex: 1 },
  historyPanel: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 4,
  },
  historyHint: { ...typography.caption, fontStyle: 'italic' },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  historyDate: { ...typography.caption, flex: 1 },
  historyCount: { ...typography.caption, color: colors.text },
  historyStatus: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', minWidth: 50, textAlign: 'right' },
  paymentCard: { gap: spacing.xs },
  paymentMeta: { ...typography.body, color: colors.textMuted },
  markUnpaidButton: { marginTop: spacing.sm },
});
