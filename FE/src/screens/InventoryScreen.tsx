import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  const [openItemId, setOpenItemId] = useState<string | null>(null);
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
    setOpenItemId(null);
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

  if (openItemId) {
    return (
      <InventoryItemDetailScreen
        itemId={openItemId}
        onBack={() => setOpenItemId(null)}
        onSiteListChanged={() => loadItems(page)}
      />
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item._id}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => loadItems(page)} />}
        ListHeaderComponent={
          <>
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
                    <Text style={[styles.categoryChipText, category === c && styles.categoryChipTextActive]}>
                      {c}
                    </Text>
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
          </>
        }
        ListEmptyComponent={!loading ? <Text style={styles.empty}>No inventory items for this site yet</Text> : null}
        renderItem={({ item }) => <InventoryItemRow item={item} onPress={() => setOpenItemId(item._id)} />}
        ListFooterComponent={
          total > 0 ? <PaginationControls page={page} totalPages={totalPages} onChange={setPage} /> : null
        }
      />
    </View>
  );
}

function InventoryItemRow({ item, onPress }: { item: InventoryItem; onPress: () => void }) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.rowMain}>
        <View style={styles.rowMainText}>
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
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
      </View>
    </Pressable>
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

function InventoryItemDetailScreen({
  itemId,
  onBack,
  onSiteListChanged,
}: {
  itemId: string;
  onBack: () => void;
  onSiteListChanged: () => void;
}) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [item, setItem] = useState<InventoryItem | null>(null);
  const [loadingItem, setLoadingItem] = useState(false);
  const [itemError, setItemError] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editUnit, setEditUnit] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [loadingTx, setLoadingTx] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);
  const [historyDate, setHistoryDate] = useState(todayDateString());

  const [movementFormExpanded, setMovementFormExpanded] = useState(false);
  const [type, setType] = useState<InventoryTransaction['type']>('stock-in');
  const [quantity, setQuantity] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [editingAmountId, setEditingAmountId] = useState<string | null>(null);
  const [editAmountValue, setEditAmountValue] = useState('');
  const [savingAmount, setSavingAmount] = useState(false);

  const loadItem = useCallback(async () => {
    setLoadingItem(true);
    setItemError(null);
    try {
      setItem(await api.inventory.get(itemId));
    } catch (err) {
      setItemError(err instanceof Error ? err.message : 'Failed to load item');
    } finally {
      setLoadingItem(false);
    }
  }, [itemId]);

  const loadTransactions = useCallback(async () => {
    setLoadingTx(true);
    setTxError(null);
    try {
      setTransactions(await api.inventory.transactions.list(itemId, historyDate));
    } catch (err) {
      setTxError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setLoadingTx(false);
    }
  }, [itemId, historyDate]);

  useEffect(() => {
    loadItem();
  }, [loadItem]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  function startEditing() {
    if (!item) return;
    setEditName(item.name);
    setEditUnit(item.unit);
    setEditError(null);
    setEditing(true);
  }

  async function handleSaveEdit() {
    setEditError(null);
    if (!editName.trim() || !editUnit.trim()) {
      setEditError('Name and unit are required');
      return;
    }
    setSavingEdit(true);
    try {
      await api.inventory.update(itemId, { name: editName.trim(), unit: editUnit.trim() });
      setEditing(false);
      await loadItem();
      onSiteListChanged();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to update item');
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleRecord() {
    setTxError(null);
    const qty = Number(quantity);
    if (!quantity || Number.isNaN(qty) || qty <= 0) {
      setTxError('Enter a valid quantity');
      return;
    }
    setSubmitting(true);
    try {
      await api.inventory.transactions.create(itemId, {
        type,
        quantity: qty,
        date: historyDate,
        amount: isAdmin && type === 'stock-in' && amount.trim() ? Number(amount) : undefined,
        note: note.trim() || undefined,
      });
      setQuantity('');
      setAmount('');
      setNote('');
      setMovementFormExpanded(false);
      await Promise.all([loadTransactions(), loadItem()]);
      onSiteListChanged();
    } catch (err) {
      setTxError(err instanceof Error ? err.message : 'Failed to record movement');
    } finally {
      setSubmitting(false);
    }
  }

  function startEditingAmount(transaction: InventoryTransaction) {
    setEditingAmountId(transaction._id);
    setEditAmountValue(transaction.amount?.toString() ?? '');
    setTxError(null);
  }

  async function handleSaveAmount(transactionId: string) {
    const value = Number(editAmountValue);
    if (!editAmountValue.trim() || Number.isNaN(value) || value < 0) {
      setTxError('Enter a valid amount');
      return;
    }
    setSavingAmount(true);
    try {
      await api.inventory.transactions.updateAmount(itemId, transactionId, value);
      setEditingAmountId(null);
      await loadTransactions();
      onSiteListChanged();
    } catch (err) {
      setTxError(err instanceof Error ? err.message : 'Failed to update amount');
    } finally {
      setSavingAmount(false);
    }
  }

  async function handleDeleteTransaction(transactionId: string) {
    setTxError(null);
    setSubmitting(true);
    try {
      await api.inventory.transactions.delete(itemId, transactionId);
      await Promise.all([loadTransactions(), loadItem()]);
      onSiteListChanged();
    } catch (err) {
      setTxError(err instanceof Error ? err.message : 'Failed to delete movement');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.detailHeader}>
        <Pressable onPress={onBack} hitSlop={8} style={styles.backButton}>
          <Ionicons name="arrow-back" size={18} color="#ed515b" />
          <Text style={styles.backText}>Inventory</Text>
        </Pressable>
      </View>

      {itemError && <Text style={styles.error}>{itemError}</Text>}
      {loadingItem && !item && <Text style={styles.cardSubtitle}>Loading…</Text>}

      {item && (
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.detailScrollContent}>
          <View style={styles.detailTitleRow}>
            <View style={styles.rowMainText}>
              <Text style={styles.title}>{item.name}</Text>
              <Text style={styles.cardSubtitle}>
                {item.quantity} {item.unit} · {item.category}
              </Text>
              {item.lowStock && <Text style={styles.lowStock}>Low stock</Text>}
            </View>
            <Pressable onPress={editing ? () => setEditing(false) : startEditing} hitSlop={8}>
              <Text style={styles.editText}>{editing ? 'Cancel' : 'Edit'}</Text>
            </Pressable>
          </View>

          {editing && (
            <View style={styles.card}>
              <TextInput style={styles.input} placeholder="Item name" value={editName} onChangeText={setEditName} />
              <TextInput
                style={styles.input}
                placeholder="Unit (bags, kg, pcs)"
                value={editUnit}
                onChangeText={setEditUnit}
              />
              {editError && <Text style={styles.error}>{editError}</Text>}
              <Pressable style={styles.smallButton} onPress={handleSaveEdit} disabled={savingEdit}>
                <Text style={styles.buttonText}>{savingEdit ? 'Saving…' : 'Save Changes'}</Text>
              </Pressable>
            </View>
          )}

          <CollapsibleSection
            title="Add Movement"
            subtitle="Record a stock-in or usage entry"
            expanded={movementFormExpanded}
            onToggle={setMovementFormExpanded}
          >
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
            {isAdmin && type === 'stock-in' && (
              <TextInput
                style={styles.input}
                placeholder="Amount paid (optional)"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
              />
            )}
            <TextInput style={styles.input} placeholder="Note (optional)" value={note} onChangeText={setNote} />
            {txError && <Text style={styles.error}>{txError}</Text>}
            <Pressable style={styles.smallButton} onPress={handleRecord} disabled={submitting}>
              <Text style={styles.buttonText}>{submitting ? 'Saving…' : `Record Movement (${historyDate})`}</Text>
            </Pressable>
          </CollapsibleSection>

          <View style={styles.card}>
            <Text style={styles.historyTitle}>History</Text>
            <DateNav date={historyDate} onChange={setHistoryDate} />
            {loadingTx && <Text style={styles.cardSubtitle}>Loading…</Text>}
            {!loadingTx && transactions.length === 0 && <Text style={styles.cardSubtitle}>No movements on this date</Text>}
            {transactions.map((tx) => (
              <View key={tx._id} style={styles.txCard}>
                <View style={styles.txHeaderRow}>
                  <Text style={[styles.txDelta, tx.type === 'usage' && styles.txDeltaUsage]}>
                    {tx.type === 'stock-in' ? '+' : '-'}
                    {tx.quantity} {item.unit}
                  </Text>
                  <Text style={styles.txDate}>{new Date(tx.date).toLocaleDateString()}</Text>
                </View>
                <Text style={styles.cardSubtitle}>
                  {tx.previousQuantity} → {tx.newQuantity}
                </Text>
                {tx.amount !== undefined && (
                  <Text style={styles.cardSubtitle}>Amount: ₹{tx.amount.toLocaleString('en-IN')}</Text>
                )}
                {tx.note && <Text style={styles.cardSubtitle}>{tx.note}</Text>}
                {tx.recordedByName && (
                  <Text style={styles.cardSubtitle}>
                    by <Text style={styles.creatorName}>{tx.recordedByName}</Text>
                  </Text>
                )}

                {editingAmountId === tx._id ? (
                  <View style={styles.amountEditRow}>
                    <TextInput
                      style={styles.amountInput}
                      placeholder="Amount"
                      value={editAmountValue}
                      onChangeText={setEditAmountValue}
                      keyboardType="numeric"
                      autoFocus
                    />
                    <Pressable onPress={() => handleSaveAmount(tx._id)} disabled={savingAmount} hitSlop={8}>
                      <Text style={styles.historyAmountLink}>{savingAmount ? 'Saving…' : 'Save'}</Text>
                    </Pressable>
                    <Pressable onPress={() => setEditingAmountId(null)} hitSlop={8}>
                      <Text style={styles.cardSubtitle}>Cancel</Text>
                    </Pressable>
                  </View>
                ) : (
                  <View style={styles.txActionsRow}>
                    {isAdmin && tx.type === 'stock-in' && (
                      <Pressable onPress={() => startEditingAmount(tx)} hitSlop={8}>
                        <Text style={styles.historyAmountLink}>
                          {tx.amount !== undefined ? 'Edit Amount' : 'Add Amount'}
                        </Text>
                      </Pressable>
                    )}
                    {(isAdmin || tx.recordedBy === user?._id) && (
                      <Pressable
                        onPress={() => handleDeleteTransaction(tx._id)}
                        disabled={submitting}
                        hitSlop={8}
                        style={styles.historyDeleteButton}
                      >
                        <Text style={styles.historyDelete}>Delete</Text>
                      </Pressable>
                    )}
                  </View>
                )}
              </View>
            ))}
          </View>
        </ScrollView>
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
    gap: 8,
  },
  rowMain: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowMainText: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  cardSubtitle: { color: '#4b5563', marginTop: 2 },
  lowStock: { marginTop: 6, color: '#dc2626', fontWeight: '700', fontSize: 12, textTransform: 'uppercase' },
  editText: { color: '#ed515b', fontWeight: '700', fontSize: 12 },
  historyTitle: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 4 },
  txCard: {
    borderWidth: 1,
    borderColor: '#f3f4f6',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    gap: 2,
  },
  txHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  txDelta: { fontSize: 14, fontWeight: '700', color: '#16a34a' },
  txDeltaUsage: { color: '#dc2626' },
  txDate: { fontSize: 12, color: '#6b7280' },
  txActionsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  historyDeleteButton: { marginLeft: 'auto' },
  historyDelete: { fontSize: 12, color: '#dc2626', fontWeight: '600' },
  historyAmountLink: { fontSize: 12, color: '#ed515b', fontWeight: '700' },
  amountEditRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  amountInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
  },
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
  detailHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  detailScrollContent: { paddingBottom: 32 },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { color: '#ed515b', fontWeight: '700', fontSize: 14 },
  detailTitleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 12 },
});
