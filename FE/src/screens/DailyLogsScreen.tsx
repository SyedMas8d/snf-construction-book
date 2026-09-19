import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Linking, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSites } from '../context/SitesContext';
import { useAuth } from '../context/AuthContext';
import { ActiveSiteBanner } from '../components/ActiveSiteBanner';
import { DateNav, todayDateString } from '../components/DateNav';
import { DateRangeSearch } from '../components/DateRangeSearch';
import { DatePickerField } from '../components/DatePickerField';
import { api } from '../api/client';
import { Contractor, DailyLog, WorkLog, WorkLogBucket, WorkLogOverlap } from '../api/types';
import { Card } from '../components/ui/Card';
import { Chip } from '../components/ui/Chip';
import { Button } from '../components/ui/Button';
import { TextField } from '../components/ui/TextField';
import { colors, radius, spacing, typography } from '../theme/theme';

const PAGE_LIMIT = 10;
const CURRENT_LIMIT = 50;

const BUCKETS: { key: WorkLogBucket; label: string }[] = [
  { key: 'current', label: 'Current' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'previous', label: 'Previous' },
];

function shiftDate(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function buildDateRange(from: string, to: string): string[] {
  const dates: string[] = [];
  let cursor = from;
  while (cursor <= to) {
    dates.push(cursor);
    cursor = shiftDate(cursor, 1);
  }
  return dates;
}

function formatShortDate(dateStr: string): string {
  const [, month, day] = dateStr.split('-');
  return `${day}/${month}`;
}

function formatWhatsAppDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year.slice(-2)}`;
}

function groupByContractor(entries: DailyLog[], contractorById: Map<string, Contractor>) {
  const order: string[] = [];
  const byContractorId = new Map<string, DailyLog[]>();
  for (const entry of entries) {
    if (!byContractorId.has(entry.contractor)) {
      byContractorId.set(entry.contractor, []);
      order.push(entry.contractor);
    }
    byContractorId.get(entry.contractor)!.push(entry);
  }
  return order.map((contractorId) => ({
    contractorId,
    contractorName: contractorById.get(contractorId)?.name ?? 'Unknown contractor',
    entries: byContractorId.get(contractorId)!,
  }));
}

function buildWhatsAppMessage(
  entries: DailyLog[],
  siteName: string,
  contractorById: Map<string, Contractor>,
  dateStr: string
): string {
  const groups = groupByContractor(entries, contractorById);
  const header = `${formatWhatsAppDate(dateStr)} ${siteName}`;
  const blocks = groups.map((group) => {
    const workerLines = group.entries.map((e) => `      ${e.workerType} : ${e.count}`).join('\n');
    const notes = group.entries.map((e) => e.notes).filter((n): n is string => !!n);
    const notesBlock = notes.length > 0 ? `\n     Notes:\n${notes.map((n) => `          *${n}`).join('\n')}` : '';
    return `•${group.contractorName}\n${workerLines}${notesBlock}`;
  });
  return `${header}\n${blocks.join('\n\n')}`;
}

export function DailyLogsScreen() {
  const { selectedSiteId, sites } = useSites();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [bucket, setBucket] = useState<WorkLogBucket>('current');
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchFrom, setSearchFrom] = useState<string | null>(null);
  const [searchTo, setSearchTo] = useState<string | null>(null);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [logsDate, setLogsDate] = useState(todayDateString());
  const [todaysEntries, setTodaysEntries] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openWorkLogId, setOpenWorkLogId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const paginated = bucket !== 'current';
  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));

  const loadWorkLogs = useCallback(
    async (targetPage: number) => {
      if (!selectedSiteId) {
        setWorkLogs([]);
        setTotal(0);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const result = await api.workLogs.list({
          site: selectedSiteId,
          bucket,
          page: targetPage,
          limit: bucket === 'current' ? CURRENT_LIMIT : PAGE_LIMIT,
          from: searchFrom ?? undefined,
          to: searchTo ?? undefined,
        });
        setWorkLogs(result.items);
        setTotal(result.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load work logs');
      } finally {
        setLoading(false);
      }
    },
    [selectedSiteId, bucket, searchFrom, searchTo]
  );

  const loadContractors = useCallback(async () => {
    if (!selectedSiteId) {
      setContractors([]);
      return;
    }
    try {
      setContractors(await api.contractors.list(selectedSiteId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load contractors');
    }
  }, [selectedSiteId]);

  const loadTodaysEntries = useCallback(async () => {
    if (!selectedSiteId) {
      setTodaysEntries([]);
      return;
    }
    try {
      setTodaysEntries(await api.dailyLogs.list(selectedSiteId, { from: logsDate, to: logsDate }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load logs for this date');
    }
  }, [selectedSiteId, logsDate]);

  useEffect(() => {
    setPage(1);
  }, [bucket, searchFrom, searchTo, selectedSiteId]);

  useEffect(() => {
    loadWorkLogs(page);
  }, [loadWorkLogs, page]);

  useEffect(() => {
    loadContractors();
  }, [loadContractors]);

  useEffect(() => {
    loadTodaysEntries();
  }, [loadTodaysEntries]);

  const refreshAll = useCallback(async () => {
    await Promise.all([loadWorkLogs(page), loadTodaysEntries()]);
  }, [loadWorkLogs, loadTodaysEntries, page]);

  const contractorById = new Map(contractors.map((c) => [c._id, c]));
  const siteName = sites.find((s) => s._id === selectedSiteId)?.name ?? '';

  if (openWorkLogId) {
    return (
      <WorkLogDetailScreen
        workLogId={openWorkLogId}
        contractors={contractors}
        onBack={() => setOpenWorkLogId(null)}
        onSiteListChanged={refreshAll}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Daily Logs</Text>
      <ActiveSiteBanner />

      <Button
        title={creating ? 'Cancel' : '+ New Work Log'}
        variant={creating ? 'secondary' : 'primary'}
        onPress={() => setCreating((c) => !c)}
        disabled={!selectedSiteId}
        style={styles.newButton}
      />

      {creating && (
        <NewWorkLogForm
          site={selectedSiteId!}
          contractors={contractors}
          onCreated={async () => {
            setCreating(false);
            await refreshAll();
          }}
        />
      )}

      {selectedSiteId && (
        <TodaysLogsSection
          entries={todaysEntries}
          contractorById={contractorById}
          siteName={siteName}
          userPhone={user?.phone}
          date={logsDate}
          onDateChange={setLogsDate}
        />
      )}

      {isAdmin && (
        <View style={styles.bucketRow}>
          {BUCKETS.map((b) => (
            <Chip key={b.key} label={b.label} active={bucket === b.key} onPress={() => setBucket(b.key)} />
          ))}
        </View>
      )}

      {isAdmin && paginated && (
        <DateRangeSearch
          from={searchFrom}
          to={searchTo}
          onApply={(from, to) => {
            setSearchFrom(from);
            setSearchTo(to);
          }}
          allowFuture={bucket === 'upcoming'}
        />
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={workLogs}
        keyExtractor={(w) => w._id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refreshAll} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.empty}>
              {bucket === 'current' && contractors.length === 0
                ? 'No contractors yet — add one in the Contractors tab first.'
                : `No ${bucket} work logs${paginated && (searchFrom || searchTo) ? ' in this date range' : ''}.`}
            </Text>
          ) : null
        }
        renderItem={({ item }) => <WorkLogCard workLog={item} onPress={() => setOpenWorkLogId(item._id)} />}
        ListFooterComponent={
          paginated && total > 0 ? <PaginationControls page={page} totalPages={totalPages} onChange={setPage} /> : null
        }
      />
    </View>
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

function TodaysLogsSection({
  entries,
  contractorById,
  siteName,
  userPhone,
  date,
  onDateChange,
}: {
  entries: DailyLog[];
  contractorById: Map<string, Contractor>;
  siteName: string;
  userPhone?: string;
  date: string;
  onDateChange: (date: string) => void;
}) {
  const [sendError, setSendError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const groups = groupByContractor(entries, contractorById);
  const totalWorkerCount = entries.reduce((sum, e) => sum + e.count, 0);
  const isToday = date === todayDateString();

  async function handleSend() {
    setSendError(null);
    const digits = (userPhone ?? '').replace(/[^0-9]/g, '');
    if (!digits) {
      setSendError('Your account has no phone number set — add one to your profile first');
      return;
    }
    const message = buildWhatsAppMessage(entries, siteName, contractorById, date);
    const url = `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      await Linking.openURL(url);
    }
  }

  return (
    <Card style={styles.todayCard}>
      <Pressable style={styles.todayHeaderRow} onPress={() => setExpanded((c) => !c)}>
        <View style={styles.todayHeaderLeft}>
          <Text style={styles.cardTitle}>{isToday ? "Today's Logs" : `Logs — ${date}`}</Text>
          {entries.length > 0 && (
            <Text style={styles.todaySummary}>
              {groups.length} contractor{groups.length === 1 ? '' : 's'} · {totalWorkerCount} worker-day
              {totalWorkerCount === 1 ? '' : 's'}
            </Text>
          )}
        </View>
        <View style={styles.todayHeaderActions}>
          <DatePickerField date={date} onChange={onDateChange} />
          <Pressable onPress={handleSend} disabled={entries.length === 0} hitSlop={8}>
            <Ionicons name="logo-whatsapp" size={26} color={entries.length === 0 ? colors.textFaint : '#25d366'} />
          </Pressable>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textMuted} />
        </View>
      </Pressable>
      {sendError && <Text style={styles.error}>{sendError}</Text>}
      {expanded &&
        (entries.length === 0 ? (
          <Text style={styles.hint}>No entries logged {isToday ? 'today' : 'on this date'} yet</Text>
        ) : (
          groups.map((group) => (
            <View key={group.contractorId} style={styles.todayContractorBlock}>
              <Text style={styles.todayContractorName}>{group.contractorName}</Text>
              {group.entries.map((entry) => (
                <Text key={entry._id} style={styles.todayEntryLine}>
                  {entry.workerType} : {entry.count}
                </Text>
              ))}
              {group.entries.some((e) => e.notes) && (
                <Text style={styles.todayNotesLine}>
                  Notes: {group.entries.filter((e) => e.notes).map((e) => e.notes).join(' · ')}
                </Text>
              )}
            </View>
          ))
        ))}
    </Card>
  );
}

function NewWorkLogForm({
  site,
  contractors,
  onCreated,
}: {
  site: string;
  contractors: Contractor[];
  onCreated: () => void;
}) {
  const [contractorIds, setContractorIds] = useState<string[]>([]);
  const [from, setFrom] = useState(todayDateString());
  const [to, setTo] = useState(todayDateString());
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [overlaps, setOverlaps] = useState<WorkLogOverlap[]>([]);
  const [checkingOverlaps, setCheckingOverlaps] = useState(false);

  const hasContractors = contractorIds.length > 0;
  const hasOverlap = overlaps.length > 0;

  function toggleContractor(id: string) {
    setContractorIds((current) => (current.includes(id) ? current.filter((c) => c !== id) : [...current, id]));
  }

  useEffect(() => {
    if (contractorIds.length === 0 || from > to) {
      setOverlaps([]);
      return;
    }
    let cancelled = false;
    setCheckingOverlaps(true);
    api.workLogs
      .overlaps({ site, contractors: contractorIds, from, to })
      .then((rows) => {
        if (!cancelled) setOverlaps(rows);
      })
      .catch(() => {
        if (!cancelled) setOverlaps([]);
      })
      .finally(() => {
        if (!cancelled) setCheckingOverlaps(false);
      });
    return () => {
      cancelled = true;
    };
  }, [site, contractorIds.join(','), from, to]);

  async function handleCreate() {
    setFormError(null);
    if (hasOverlap) {
      setFormError('Resolve the date overlap before creating');
      return;
    }
    if (from > to) {
      setFormError('"From" must be on or before "To"');
      return;
    }
    setSubmitting(true);
    try {
      await Promise.all(contractorIds.map((contractor) => api.workLogs.create({ site, contractor, from, to })));
      onCreated();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create work log');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card style={styles.form}>
      <Text style={styles.label}>Contractors</Text>
      {contractors.length === 0 ? (
        <Text style={styles.hint}>No contractors yet — add one in the Contractors tab first.</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {contractors.map((c) => (
            <Chip
              key={c._id}
              label={c.name}
              active={contractorIds.includes(c._id)}
              onPress={() => toggleContractor(c._id)}
            />
          ))}
        </ScrollView>
      )}

      {hasContractors ? (
        <>
          <Text style={styles.label}>From</Text>
          <DateNav date={from} onChange={setFrom} allowFuture />
          <Text style={styles.label}>To</Text>
          <DateNav date={to} onChange={setTo} allowFuture />

          {checkingOverlaps && <Text style={styles.hint}>Checking existing work logs…</Text>}
          {!checkingOverlaps && hasOverlap && (
            <View style={styles.overlapWarning}>
              <Text style={styles.overlapWarningTitle}>Date overlap — remove a contractor or change the range:</Text>
              {overlaps.map((o) => (
                <Text key={o.contractorId} style={styles.overlapWarningRow}>
                  {o.contractorName}: {o.ranges.map((r) => `${r.from} → ${r.to}`).join(', ')}
                </Text>
              ))}
            </View>
          )}
        </>
      ) : (
        <Text style={styles.hint}>Select at least one contractor to choose dates.</Text>
      )}

      {formError && <Text style={styles.error}>{formError}</Text>}
      {hasContractors && (
        <Button
          title={
            submitting
              ? 'Creating…'
              : contractorIds.length > 1
                ? `Create ${contractorIds.length} Work Logs`
                : 'Create Work Log'
          }
          loading={submitting}
          disabled={hasOverlap}
          onPress={handleCreate}
        />
      )}
    </Card>
  );
}

function WorkLogCard({ workLog, onPress }: { workLog: WorkLog; onPress: () => void }) {
  const locked = workLog.fullyPaid;

  return (
    <Pressable onPress={onPress}>
      <Card style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>{workLog.contractorName}</Text>
          <View style={styles.badgeRow}>
            {locked && (
              <View style={styles.paidBadge}>
                <Ionicons name="checkmark-circle" size={12} color={colors.success} />
                <Text style={styles.paidBadgeText}>Fully Paid</Text>
              </View>
            )}
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{workLog.totalWorkerCount} worker-days</Text>
            </View>
          </View>
        </View>
        <Text style={styles.cardSubtitle}>
          {workLog.from.slice(0, 10)} → {workLog.to.slice(0, 10)} · {workLog.entryCount} entr
          {workLog.entryCount === 1 ? 'y' : 'ies'}
          {workLog.createdByName ? (
            <>
              {' · Created by '}
              <Text style={styles.creatorName}>{workLog.createdByName}</Text>
            </>
          ) : null}
        </Text>
      </Card>
    </Pressable>
  );
}

function WorkLogDetailScreen({
  workLogId,
  contractors,
  onBack,
  onSiteListChanged,
}: {
  workLogId: string;
  contractors: Contractor[];
  onBack: () => void;
  onSiteListChanged: () => void;
}) {
  const [workLog, setWorkLog] = useState<WorkLog | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadWorkLog = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setWorkLog(await api.workLogs.get(workLogId));
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load work log');
    } finally {
      setLoading(false);
    }
  }, [workLogId]);

  useEffect(() => {
    loadWorkLog();
  }, [loadWorkLog]);

  const contractor = workLog ? contractors.find((c) => c._id === workLog.contractor) ?? null : null;
  const locked = workLog?.fullyPaid ?? false;

  async function handleChanged() {
    await loadWorkLog();
    onSiteListChanged();
  }

  async function handleDelete() {
    setDeleteError(null);
    setDeleting(true);
    try {
      await api.workLogs.delete(workLogId);
      onSiteListChanged();
      onBack();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete work log');
      setDeleting(false);
    }
  }

  return (
    <View style={styles.container}>
      <Pressable onPress={onBack} hitSlop={8} style={styles.backButton}>
        <Ionicons name="arrow-back" size={18} color={colors.primaryDark} />
        <Text style={styles.backText}>Daily Logs</Text>
      </Pressable>

      {loadError && <Text style={styles.error}>{loadError}</Text>}
      {loading && !workLog && <Text style={styles.hint}>Loading…</Text>}

      {workLog && (
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.listContent}>
          <Card style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>{workLog.contractorName}</Text>
              <View style={styles.badgeRow}>
                {locked && (
                  <View style={styles.paidBadge}>
                    <Ionicons name="checkmark-circle" size={12} color={colors.success} />
                    <Text style={styles.paidBadgeText}>Fully Paid</Text>
                  </View>
                )}
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{workLog.totalWorkerCount} worker-days</Text>
                </View>
              </View>
            </View>
            <Text style={styles.cardSubtitle}>
              {workLog.from.slice(0, 10)} → {workLog.to.slice(0, 10)} · {workLog.entryCount} entr
              {workLog.entryCount === 1 ? 'y' : 'ies'}
              {workLog.createdByName ? (
                <>
                  {' · Created by '}
                  <Text style={styles.creatorName}>{workLog.createdByName}</Text>
                </>
              ) : null}
            </Text>

            {!editing && !locked && (
              <View style={styles.cardActionsRow}>
                <Pressable onPress={() => setEditing(true)} hitSlop={8}>
                  <Text style={styles.cardActionText}>Edit</Text>
                </Pressable>
                <Pressable onPress={handleDelete} disabled={deleting} hitSlop={8}>
                  <Text style={styles.cardActionTextDanger}>{deleting ? 'Deleting…' : 'Delete'}</Text>
                </Pressable>
              </View>
            )}
            {deleteError && <Text style={styles.error}>{deleteError}</Text>}

            {editing && !locked && (
              <EditWorkLogForm
                workLog={workLog}
                onCancel={() => setEditing(false)}
                onSaved={async () => {
                  setEditing(false);
                  await handleChanged();
                }}
              />
            )}
          </Card>

          {!editing && (
            <WorkLogDetail workLog={workLog} contractor={contractor} locked={locked} onChanged={handleChanged} />
          )}
        </ScrollView>
      )}
    </View>
  );
}

function EditWorkLogForm({
  workLog,
  onCancel,
  onSaved,
}: {
  workLog: WorkLog;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [from, setFrom] = useState(workLog.from.slice(0, 10));
  const [to, setTo] = useState(workLog.to.slice(0, 10));
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSave() {
    setFormError(null);
    if (from > to) {
      setFormError('"From" must be on or before "To"');
      return;
    }
    setSubmitting(true);
    try {
      await api.workLogs.update(workLog._id, { from, to });
      onSaved();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to update work log');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.editPanel}>
      <Text style={styles.label}>From</Text>
      <DateNav date={from} onChange={setFrom} allowFuture />
      <Text style={styles.label}>To</Text>
      <DateNav date={to} onChange={setTo} allowFuture />
      {formError && <Text style={styles.error}>{formError}</Text>}
      <View style={styles.editActionsRow}>
        <Button title="Cancel" variant="secondary" onPress={onCancel} style={styles.editActionButton} />
        <Button
          title={submitting ? 'Saving…' : 'Save'}
          loading={submitting}
          onPress={handleSave}
          style={styles.editActionButton}
        />
      </View>
    </View>
  );
}

function WorkLogDetail({
  workLog,
  contractor,
  locked,
  onChanged,
}: {
  workLog: WorkLog;
  contractor: Contractor | null;
  locked: boolean;
  onChanged: () => void;
}) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [entries, setEntries] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dates = buildDateRange(workLog.from.slice(0, 10), workLog.to.slice(0, 10));
  // Can't log work for a day that hasn't happened yet — only today and earlier are insertable.
  const selectableDates = dates.filter((d) => d <= todayDateString());
  const todayInRange = selectableDates.includes(todayDateString());
  const [selectedDate, setSelectedDate] = useState(
    todayInRange ? todayDateString() : selectableDates[selectableDates.length - 1]
  );
  const [selectedWorkerType, setSelectedWorkerType] = useState<string | null>(null);
  const [count, setCount] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const canInsert = !locked && selectableDates.length > 0;

  const loadEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setEntries(await api.dailyLogs.list(workLog.site, { workLog: workLog._id }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load entries');
    } finally {
      setLoading(false);
    }
  }, [workLog.site, workLog._id]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  async function handleAddEntry() {
    setFormError(null);
    if (!selectedDate) {
      setFormError('This work log has not started yet — no days are loggable until it begins');
      return;
    }
    if (!selectedWorkerType) {
      setFormError('Select a worker type');
      return;
    }
    const workerCount = Number(count);
    if (!count || Number.isNaN(workerCount) || workerCount < 1) {
      setFormError('Enter a valid worker count');
      return;
    }
    setSubmitting(true);
    try {
      await api.dailyLogs.create({
        site: workLog.site,
        contractor: workLog.contractor,
        workLog: workLog._id,
        date: selectedDate,
        workerType: selectedWorkerType,
        count: workerCount,
        notes: notes.trim() || undefined,
      });
      setSelectedWorkerType(null);
      setCount('');
      setNotes('');
      await Promise.all([loadEntries(), onChanged()]);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to add entry');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.dailyLogs.delete(id);
      await Promise.all([loadEntries(), onChanged()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete entry');
    }
  }

  return (
    <>
      <Card style={styles.card}>
        <Text style={styles.label}>Insert Entry</Text>
        {locked ? (
          <Text style={styles.hint}>This work log is fully paid — entries are locked and can no longer be edited.</Text>
        ) : (
          <>
            <Text style={styles.sublabel}>Day</Text>
            {selectableDates.length === 0 ? (
              <Text style={styles.hint}>This work log starts in the future — no days are loggable yet.</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                {selectableDates.map((d) => (
                  <Chip
                    key={d}
                    label={formatShortDate(d)}
                    active={selectedDate === d}
                    onPress={() => setSelectedDate(d)}
                  />
                ))}
              </ScrollView>
            )}

            {canInsert &&
              (contractor && contractor.workerTypes.length > 0 ? (
                <>
                  <Text style={styles.sublabel}>Worker Type</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                    {contractor.workerTypes.map((type) => (
                      <Chip
                        key={type}
                        label={type}
                        active={selectedWorkerType === type}
                        onPress={() => setSelectedWorkerType(type)}
                      />
                    ))}
                  </ScrollView>
                </>
              ) : (
                <Text style={styles.hint}>
                  This contractor has no worker types yet — add some in the Contractors tab.
                </Text>
              ))}

            {canInsert && (
              <>
                <TextField placeholder="Worker count" value={count} onChangeText={setCount} keyboardType="numeric" />
                <TextField placeholder="Notes (optional)" value={notes} onChangeText={setNotes} />
                {formError && <Text style={styles.error}>{formError}</Text>}
                <Button title={submitting ? 'Saving…' : 'Add Entry'} loading={submitting} onPress={handleAddEntry} />
              </>
            )}
          </>
        )}
      </Card>

      <Card style={styles.card}>
        <Text style={styles.label}>Entries</Text>
        {error && <Text style={styles.error}>{error}</Text>}
        {loading && <Text style={styles.hint}>Loading…</Text>}
        {!loading && entries.length === 0 && <Text style={styles.hint}>No entries yet</Text>}
        {[...entries]
          .sort((a, b) => a.date.localeCompare(b.date))
          .map((entry) => (
            <View key={entry._id} style={styles.entryRow}>
              <Text style={styles.entryText}>
                {entry.date.slice(0, 10)} · {entry.workerType} ×{entry.count}
                {entry.notes ? ` · ${entry.notes}` : ''}
                {entry.createdByName ? (
                  <>
                    {' · '}
                    <Text style={styles.creatorName}>by {entry.createdByName}</Text>
                  </>
                ) : null}
              </Text>
              {!locked && (isAdmin || entry.createdBy === user?._id) && (
                <Pressable onPress={() => handleDelete(entry._id)} hitSlop={8}>
                  <Text style={styles.deleteText}>Delete</Text>
                </Pressable>
              )}
            </View>
          ))}
      </Card>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg },
  title: { ...typography.title, marginBottom: spacing.md },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: spacing.md },
  backText: { color: colors.primaryDark, fontWeight: '700', fontSize: 14 },
  newButton: { marginBottom: spacing.md },
  form: { gap: spacing.sm, marginBottom: spacing.lg },
  overlapWarning: {
    backgroundColor: colors.dangerMuted,
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: 2,
  },
  overlapWarningTitle: { ...typography.label, color: colors.danger },
  overlapWarningRow: { fontSize: 12, color: colors.danger },
  bucketRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
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
  todayCard: { gap: spacing.sm, marginBottom: spacing.lg },
  todayHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  todayHeaderLeft: { flex: 1 },
  todayHeaderActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  todaySummary: { ...typography.caption, marginTop: 2 },
  todayContractorBlock: {
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  todayContractorName: { ...typography.bodyStrong },
  todayEntryLine: { fontSize: 13, color: colors.text, marginLeft: spacing.md },
  todayNotesLine: { fontSize: 12, color: colors.textMuted, fontStyle: 'italic', marginLeft: spacing.md, marginTop: 2 },
  label: typography.label,
  sublabel: { ...typography.label, marginTop: spacing.sm },
  hint: { color: colors.textMuted, fontStyle: 'italic' },
  chipScroll: { flexGrow: 0, marginBottom: spacing.xs },
  error: { color: colors.danger, marginBottom: spacing.sm, fontWeight: '600' },
  empty: { color: colors.textMuted, fontStyle: 'italic', textAlign: 'center', marginTop: spacing.xxl },
  listContent: { paddingBottom: spacing.lg },
  card: { marginBottom: spacing.sm },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: typography.heading,
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.successMuted,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  paidBadgeText: { color: colors.success, fontSize: 11, fontWeight: '700' },
  countBadge: {
    backgroundColor: colors.primaryMuted,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  countBadgeText: { color: colors.primaryDark, fontSize: 12, fontWeight: '700' },
  cardActionsRow: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.sm },
  cardActionText: { fontSize: 12, color: colors.primaryDark, fontWeight: '700' },
  cardActionTextDanger: { fontSize: 12, color: colors.danger, fontWeight: '700' },
  editPanel: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  editActionsRow: { flexDirection: 'row', gap: spacing.sm },
  editActionButton: { flex: 1 },
  cardSubtitle: { color: colors.textMuted, marginTop: 2, fontSize: 13 },
  entryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  entryText: { flex: 1, fontSize: 13, color: colors.text },
  creatorName: { fontWeight: '700', color: colors.primaryDark },
  deleteText: { fontSize: 12, color: colors.danger, fontWeight: '600' },
});
