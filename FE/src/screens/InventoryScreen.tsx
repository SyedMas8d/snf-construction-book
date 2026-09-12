import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSites } from '../context/SitesContext';
import { useAuth } from '../context/AuthContext';
import { ActiveSiteBanner } from '../components/ActiveSiteBanner';
import { DateNav, todayDateString } from '../components/DateNav';
import { api } from '../api/client';
import { InventoryItem, InventoryTransaction } from '../api/types';
import { CollapsibleSection } from '../components/CollapsibleSection';

const CATEGORIES: InventoryItem['category'][] = ['material', 'tool', 'equipment'];
const PAGE_LIMIT = 10;

export function InventoryScreen() {
  const { selectedSiteId } = useSites();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [formExpanded, setFormExpanded] = useState(false);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<InventoryItem['category']>('material');
  const [unit, setUnit] = useState('');
  const [minThreshold, setMinThreshold] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));

  const loadItems = useCallback(
    async (targetPage: number) => {
      if (!selectedSiteId) {
        setItems([]);
        setTotal(0);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const result = await api.inventory.list(selectedSiteId, { page: targetPage, limit: PAGE_LIMIT });
        setItems(result.items);
        setTotal(result.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load inventory');
      } finally {
        setLoading(false);
      }
    },
    [selectedSiteId]
  );

  useEffect(() => {
    setPage(1);
  }, [selectedSiteId]);

  useEffect(() => {
    loadItems(page);
  }, [loadItems, page]);

  async function handleCreate() {
    setFormError(null);
    const threshold = minThreshold ? Number(minThreshold) : undefined;
    if (!selectedSiteId) {
      setFormError('Select a site first');
      return;
    }
    if (!name.trim() || !unit.trim()) {
      setFormError('Name and unit are required');
      return;
    }
    setSubmitting(true);
    try {
      await api.inventory.create({
        site: selectedSiteId,
        name: name.trim(),
        category,
        unit: unit.trim(),
        minThreshold: threshold,
      });
      setName('');
      setUnit('');
      setMinThreshold('');
      setFormExpanded(false);
      await loadItems(1);
      setPage(1);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create inventory item');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Inventory</Text>
      <ActiveSiteBanner />

      <CollapsibleSection
        title="Add Item"
        subtitle="Register a new inventory item for this site"
        expanded={formExpanded}
        onToggle={setFormExpanded}
      >
        <TextInput style={styles.input} placeholder="Item name" value={name} onChangeText={setName} />
        <View style={styles.categoryRow}>
          {CATEGORIES.map((c) => (
            <Pressable
              key={c}
              onPress={() => setCategory(c)}
              style={[styles.categoryChip, category === c && styles.categoryChipActive]}
            >
              <Text style={[styles.categoryChipText, category === c && styles.categoryChipTextActive]}>{c}</Text>
            </Pressable>
          ))}
        </View>
        <TextInput style={styles.input} placeholder="Unit (bags, kg, pcs)" value={unit} onChangeText={setUnit} />
        <TextInput
          style={styles.input}
          placeholder="Low-stock threshold (optional)"
          value={minThreshold}
          onChangeText={setMinThreshold}
          keyboardType="numeric"
        />
        {formError && <Text style={styles.error}>{formError}</Text>}
        <Pressable style={styles.button} onPress={handleCreate} disabled={submitting}>
          <Text style={styles.buttonText}>{submitting ? 'Saving…' : 'Add Item (starts at 0 stock)'}</Text>
        </Pressable>
      </CollapsibleSection>

      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={items}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => loadItems(page)} />}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>No inventory items for this site yet</Text> : null}
        renderItem={({ item }) => (
          <InventoryItemCard
            item={item}
            expanded={expandedItemId === item._id}
            onToggle={() => setExpandedItemId((current) => (current === item._id ? null : item._id))}
            onChanged={() => loadItems(page)}
          />
        )}
        ListFooterComponent={
          total > 0 ? <PaginationControls page={page} totalPages={totalPages} onChange={setPage} /> : null
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

function InventoryItemCard({
  item,
  expanded,
  onToggle,
  onChanged,
}: {
  item: InventoryItem;
  expanded: boolean;
  onToggle: () => void;
  onChanged: () => void;
}) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [loadingTx, setLoadingTx] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);

  const [type, setType] = useState<InventoryTransaction['type']>('stock-in');
  const [quantity, setQuantity] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [historyDate, setHistoryDate] = useState(todayDateString());

  const loadTransactions = useCallback(async () => {
    setLoadingTx(true);
    setTxError(null);
    try {
      setTransactions(await api.inventory.transactions.list(item._id, historyDate));
    } catch (err) {
      setTxError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setLoadingTx(false);
    }
  }, [item._id, historyDate]);

  useEffect(() => {
    if (expanded) {
      loadTransactions();
    }
  }, [expanded, loadTransactions]);

  async function handleRecord() {
    setTxError(null);
    const qty = Number(quantity);
    if (!quantity || Number.isNaN(qty) || qty <= 0) {
      setTxError('Enter a valid quantity');
      return;
    }
    setSubmitting(true);
    try {
      await api.inventory.transactions.create(item._id, {
        type,
        quantity: qty,
        date: historyDate,
        note: note.trim() || undefined,
      });
      setQuantity('');
      setNote('');
      await Promise.all([loadTransactions(), onChanged()]);
    } catch (err) {
      setTxError(err instanceof Error ? err.message : 'Failed to record movement');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteTransaction(transactionId: string) {
    setTxError(null);
    setSubmitting(true);
    try {
      await api.inventory.transactions.delete(item._id, transactionId);
      await Promise.all([loadTransactions(), onChanged()]);
    } catch (err) {
      setTxError(err instanceof Error ? err.message : 'Failed to delete movement');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.card}>
      <Pressable onPress={onToggle}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.cardSubtitle}>
          {item.quantity} {item.unit} · {item.category}
          {item.createdByName ? (
            <>
              {' · Added by '}
              <Text style={styles.creatorName}>{item.createdByName}</Text>
            </>
          ) : null}
        </Text>
        {item.lowStock && <Text style={styles.lowStock}>Low stock</Text>}
      </Pressable>

      {expanded && (
        <View style={styles.expandedPanel}>
          <View style={styles.categoryRow}>
            {(['stock-in', 'usage'] as const).map((t) => (
              <Pressable
                key={t}
                onPress={() => setType(t)}
                style={[styles.categoryChip, type === t && styles.categoryChipActive]}
              >
                <Text style={[styles.categoryChipText, type === t && styles.categoryChipTextActive]}>
                  {t === 'stock-in' ? 'Stock In' : 'Usage'}
                </Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            style={styles.input}
            placeholder={`Quantity (${item.unit})`}
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
          />
          <TextInput style={styles.input} placeholder="Note (optional)" value={note} onChangeText={setNote} />
          {txError && <Text style={styles.error}>{txError}</Text>}
          <Pressable style={styles.smallButton} onPress={handleRecord} disabled={submitting}>
            <Text style={styles.buttonText}>{submitting ? 'Saving…' : `Record Movement (${historyDate})`}</Text>
          </Pressable>

          <Text style={styles.historyTitle}>History</Text>
          <DateNav date={historyDate} onChange={setHistoryDate} />
          {loadingTx && <Text style={styles.cardSubtitle}>Loading…</Text>}
          {!loadingTx && transactions.length === 0 && <Text style={styles.cardSubtitle}>No movements on this date</Text>}
          {transactions.map((tx) => (
            <View key={tx._id} style={styles.historyRowContainer}>
              <Text style={styles.historyRow}>
                {new Date(tx.date).toLocaleDateString()} · {tx.type === 'stock-in' ? '+' : '-'}
                {tx.quantity} ({tx.previousQuantity} → {tx.newQuantity}){tx.note ? ` · ${tx.note}` : ''}
                {tx.recordedByName ? (
                  <>
                    {' · '}
                    <Text style={styles.creatorName}>by {tx.recordedByName}</Text>
                  </>
                ) : null}
              </Text>
              {(isAdmin || tx.recordedBy === user?._id) && (
                <Pressable onPress={() => handleDeleteTransaction(tx._id)} disabled={submitting} hitSlop={8}>
                  <Text style={styles.historyDelete}>Delete</Text>
                </Pressable>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  categoryRow: { flexDirection: 'row', gap: 8 },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#e5e7eb',
  },
  categoryChipActive: { backgroundColor: '#ed515b' },
  categoryChipText: { color: '#374151', fontSize: 12, fontWeight: '600' },
  categoryChipTextActive: { color: '#fff' },
  button: {
    backgroundColor: '#ed515b',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  smallButton: {
    backgroundColor: '#ed515b',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonText: { color: '#fff', fontWeight: '600' },
  error: { color: '#dc2626', marginBottom: 8 },
  creatorName: { fontWeight: '700', color: '#ed515b' },
  empty: { color: '#6b7280', fontStyle: 'italic', textAlign: 'center', marginTop: 24 },
  card: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  cardSubtitle: { color: '#4b5563', marginTop: 2 },
  lowStock: { marginTop: 6, color: '#dc2626', fontWeight: '700', fontSize: 12, textTransform: 'uppercase' },
  expandedPanel: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 8,
  },
  historyTitle: { fontSize: 13, fontWeight: '700', marginTop: 8, color: '#374151' },
  historyRowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  historyRow: { flex: 1, fontSize: 12, color: '#4b5563' },
  historyDelete: { fontSize: 12, color: '#dc2626', fontWeight: '600' },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginTop: 8,
    marginBottom: 24,
  },
  pageButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  pageButtonDisabled: { opacity: 0.4 },
  pageButtonText: { color: '#374151', fontWeight: '600', fontSize: 13 },
  pageIndicator: { color: '#6b7280', fontSize: 13 },
});
