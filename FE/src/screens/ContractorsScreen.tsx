import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSites } from '../context/SitesContext';
import { ActiveSiteBanner } from '../components/ActiveSiteBanner';
import { api } from '../api/client';
import { Contractor } from '../api/types';
import { CollapsibleSection } from '../components/CollapsibleSection';

function WorkerTypeChips({
  workerTypes,
  onRemove,
}: {
  workerTypes: string[];
  onRemove?: (type: string) => void;
}) {
  if (workerTypes.length === 0) {
    return <Text style={styles.empty}>No worker types yet</Text>;
  }
  return (
    <View style={styles.chipRow}>
      {workerTypes.map((type) => (
        <View key={type} style={styles.chip}>
          <Text style={styles.chipText}>{type}</Text>
          {onRemove && (
            <Pressable onPress={() => onRemove(type)} hitSlop={8}>
              <Text style={styles.chipRemove}>×</Text>
            </Pressable>
          )}
        </View>
      ))}
    </View>
  );
}

export function ContractorsScreen() {
  const { selectedSiteId } = useSites();
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [newWorkerTypes, setNewWorkerTypes] = useState<string[]>([]);
  const [workerTypeInput, setWorkerTypeInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formExpanded, setFormExpanded] = useState(false);

  const loadContractors = useCallback(async () => {
    if (!selectedSiteId) {
      setContractors([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setContractors(await api.contractors.list(selectedSiteId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load contractors');
    } finally {
      setLoading(false);
    }
  }, [selectedSiteId]);

  useEffect(() => {
    loadContractors();
  }, [loadContractors]);

  function addWorkerTypeToForm() {
    const trimmed = workerTypeInput.trim();
    if (!trimmed || newWorkerTypes.includes(trimmed)) {
      setWorkerTypeInput('');
      return;
    }
    setNewWorkerTypes((current) => [...current, trimmed]);
    setWorkerTypeInput('');
  }

  async function handleCreate() {
    setFormError(null);
    if (!selectedSiteId) {
      setFormError('Select a site first');
      return;
    }
    if (!name.trim()) {
      setFormError('Contractor name is required');
      return;
    }
    setSubmitting(true);
    try {
      await api.contractors.create({
        site: selectedSiteId,
        name: name.trim(),
        phone: phone.trim() || undefined,
        workerTypes: newWorkerTypes,
      });
      setName('');
      setPhone('');
      setNewWorkerTypes([]);
      setFormExpanded(false);
      await loadContractors();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create contractor');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Contractors</Text>
      <ActiveSiteBanner />

      <CollapsibleSection
        title="Add Contractor"
        subtitle="Register a new contractor for this site"
        expanded={formExpanded}
        onToggle={setFormExpanded}
      >
        <TextInput style={styles.input} placeholder="Contractor name" value={name} onChangeText={setName} />
        <TextInput
          style={styles.input}
          placeholder="Phone (optional)"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
        <View style={styles.addWorkerTypeRow}>
          <TextInput
            style={[styles.input, styles.addWorkerTypeInput]}
            placeholder="Worker type (e.g. Mason)"
            value={workerTypeInput}
            onChangeText={setWorkerTypeInput}
            onSubmitEditing={addWorkerTypeToForm}
          />
          <Pressable style={styles.addButton} onPress={addWorkerTypeToForm}>
            <Text style={styles.addButtonText}>Add</Text>
          </Pressable>
        </View>
        <WorkerTypeChips
          workerTypes={newWorkerTypes}
          onRemove={(type) => setNewWorkerTypes((current) => current.filter((t) => t !== type))}
        />
        {formError && <Text style={styles.error}>{formError}</Text>}
        <Pressable style={styles.button} onPress={handleCreate} disabled={submitting}>
          <Text style={styles.buttonText}>{submitting ? 'Saving…' : 'Add Contractor'}</Text>
        </Pressable>
      </CollapsibleSection>

      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={contractors}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadContractors} />}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>No contractors yet</Text> : null}
        renderItem={({ item }) => (
          <ContractorCard
            contractor={item}
            expanded={expandedId === item._id}
            onToggle={() => setExpandedId((current) => (current === item._id ? null : item._id))}
            onChanged={loadContractors}
          />
        )}
      />
    </View>
  );
}

function ContractorCard({
  contractor,
  expanded,
  onToggle,
  onChanged,
}: {
  contractor: Contractor;
  expanded: boolean;
  onToggle: () => void;
  onChanged: () => void;
}) {
  const [workerTypeInput, setWorkerTypeInput] = useState('');
  const [phone, setPhone] = useState(contractor.phone ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function savePhone() {
    setSubmitting(true);
    setActionError(null);
    try {
      await api.contractors.update(contractor._id, { phone: phone.trim() || undefined });
      await onChanged();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update phone number');
    } finally {
      setSubmitting(false);
    }
  }

  async function addWorkerType() {
    const trimmed = workerTypeInput.trim();
    if (!trimmed || contractor.workerTypes.includes(trimmed)) {
      setWorkerTypeInput('');
      return;
    }
    setSubmitting(true);
    setActionError(null);
    try {
      await api.contractors.update(contractor._id, { workerTypes: [...contractor.workerTypes, trimmed] });
      setWorkerTypeInput('');
      await onChanged();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to add worker type');
    } finally {
      setSubmitting(false);
    }
  }

  async function removeWorkerType(type: string) {
    setSubmitting(true);
    setActionError(null);
    try {
      await api.contractors.update(contractor._id, {
        workerTypes: contractor.workerTypes.filter((t) => t !== type),
      });
      await onChanged();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to remove worker type');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    setSubmitting(true);
    setActionError(null);
    try {
      await api.contractors.delete(contractor._id);
      await onChanged();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete contractor');
      setSubmitting(false);
    }
  }

  function handleToggle() {
    if (!expanded) {
      setPhone(contractor.phone ?? '');
      setActionError(null);
    }
    onToggle();
  }

  return (
    <View style={styles.card}>
      <Pressable onPress={handleToggle}>
        <Text style={styles.cardTitle}>{contractor.name}</Text>
        {contractor.phone && <Text style={styles.cardSubtitle}>{contractor.phone}</Text>}
        <WorkerTypeChips workerTypes={contractor.workerTypes} />
      </Pressable>

      {expanded && (
        <View style={styles.expandedPanel}>
          <View style={styles.addWorkerTypeRow}>
            <TextInput
              style={[styles.input, styles.addWorkerTypeInput]}
              placeholder="Phone (optional)"
              value={phone}
              onChangeText={setPhone}
              onSubmitEditing={savePhone}
              keyboardType="phone-pad"
            />
            <Pressable style={styles.addButton} onPress={savePhone} disabled={submitting}>
              <Text style={styles.addButtonText}>Save</Text>
            </Pressable>
          </View>
          <View style={styles.addWorkerTypeRow}>
            <TextInput
              style={[styles.input, styles.addWorkerTypeInput]}
              placeholder="New worker type"
              value={workerTypeInput}
              onChangeText={setWorkerTypeInput}
              onSubmitEditing={addWorkerType}
            />
            <Pressable style={styles.addButton} onPress={addWorkerType} disabled={submitting}>
              <Text style={styles.addButtonText}>Add</Text>
            </Pressable>
          </View>
          <WorkerTypeChips workerTypes={contractor.workerTypes} onRemove={removeWorkerType} />
          {actionError && <Text style={styles.error}>{actionError}</Text>}
          <Pressable style={styles.deleteButton} onPress={handleDelete} disabled={submitting}>
            <Text style={styles.deleteButtonText}>Delete Contractor</Text>
          </Pressable>
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
  addWorkerTypeRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  addWorkerTypeInput: { flex: 1 },
  addButton: {
    backgroundColor: '#374151',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  addButtonText: { color: '#fff', fontWeight: '600' },
  button: {
    backgroundColor: '#ed515b',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '600' },
  deleteButton: {
    borderWidth: 1,
    borderColor: '#dc2626',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  deleteButtonText: { color: '#dc2626', fontWeight: '600' },
  error: { color: '#dc2626', marginBottom: 8 },
  empty: { color: '#6b7280', fontStyle: 'italic' },
  card: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  cardTitle: { fontSize: 16, fontWeight: '600', marginBottom: 6 },
  cardSubtitle: { color: '#4b5563', marginTop: -4, marginBottom: 6 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipText: { fontSize: 12, color: '#374151', fontWeight: '600' },
  chipRemove: { fontSize: 14, color: '#6b7280', fontWeight: '700' },
  expandedPanel: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 8,
  },
});
