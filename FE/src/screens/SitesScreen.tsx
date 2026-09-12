import React, { useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSites } from '../context/SitesContext';
import { api } from '../api/client';
import { Site } from '../api/types';
import { CollapsibleSection } from '../components/CollapsibleSection';

const STATUS_OPTIONS: Site['status'][] = ['planned', 'active', 'completed', 'on-hold'];

export function SitesScreen({ onEnterSite }: { onEnterSite: (siteId: string) => void }) {
  const { sites, loading, error, refreshSites } = useSites();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [client, setClient] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [formExpanded, setFormExpanded] = useState(false);

  async function handleCreate() {
    setFormError(null);
    if (!name.trim() || !address.trim()) {
      setFormError('Name and address are required');
      return;
    }
    setSubmitting(true);
    try {
      await api.sites.create({
        name: name.trim(),
        address: address.trim(),
        client: client.trim() || undefined,
        startDate: new Date().toISOString(),
      });
      setName('');
      setAddress('');
      setClient('');
      setFormExpanded(false);
      await refreshSites();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create site');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sites</Text>

      <CollapsibleSection
        title="Add Site"
        subtitle="Create a new construction site"
        expanded={formExpanded}
        onToggle={setFormExpanded}
      >
        <TextInput style={styles.input} placeholder="Site name" value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="Address" value={address} onChangeText={setAddress} />
        <TextInput style={styles.input} placeholder="Client (optional)" value={client} onChangeText={setClient} />
        {formError && <Text style={styles.error}>{formError}</Text>}
        <Pressable style={styles.button} onPress={handleCreate} disabled={submitting}>
          <Text style={styles.buttonText}>{submitting ? 'Creating…' : 'Add Site'}</Text>
        </Pressable>
      </CollapsibleSection>

      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={sites}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refreshSites} />}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>No sites yet</Text> : null}
        renderItem={({ item }) => (
          <SiteCard
            site={item}
            expanded={expandedId === item._id}
            onToggle={() => setExpandedId((current) => (current === item._id ? null : item._id))}
            onChanged={refreshSites}
            onEnter={() => onEnterSite(item._id)}
          />
        )}
      />
    </View>
  );
}

function SiteCard({
  site,
  expanded,
  onToggle,
  onChanged,
  onEnter,
}: {
  site: Site;
  expanded: boolean;
  onToggle: () => void;
  onChanged: () => void;
  onEnter: () => void;
}) {
  const [name, setName] = useState(site.name);
  const [address, setAddress] = useState(site.address);
  const [client, setClient] = useState(site.client ?? '');
  const [status, setStatus] = useState(site.status);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleToggle() {
    if (!expanded) {
      setName(site.name);
      setAddress(site.address);
      setClient(site.client ?? '');
      setStatus(site.status);
      setError(null);
    }
    onToggle();
  }

  async function handleSave() {
    setError(null);
    if (!name.trim() || !address.trim()) {
      setError('Name and address are required');
      return;
    }
    setSubmitting(true);
    try {
      await api.sites.update(site._id, {
        name: name.trim(),
        address: address.trim(),
        client: client.trim() || undefined,
        status,
      });
      await onChanged();
      onToggle();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update site');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.card}>
      <Pressable style={styles.cardMain} onPress={onEnter}>
        <View style={styles.cardMainText}>
          <Text style={styles.cardTitle}>{site.name}</Text>
          <Text style={styles.cardSubtitle}>{site.address}</Text>
          {site.client && <Text style={styles.cardSubtitle}>Client: {site.client}</Text>}
          <Text style={styles.status}>{site.status}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
      </Pressable>

      <Pressable onPress={handleToggle} hitSlop={8}>
        <Text style={styles.editText}>{expanded ? 'Cancel Edit' : 'Edit'}</Text>
      </Pressable>

      {expanded && (
        <View style={styles.expandedPanel}>
          <TextInput style={styles.input} placeholder="Site name" value={name} onChangeText={setName} />
          <TextInput style={styles.input} placeholder="Address" value={address} onChangeText={setAddress} />
          <TextInput style={styles.input} placeholder="Client (optional)" value={client} onChangeText={setClient} />

          <View style={styles.statusRow}>
            {STATUS_OPTIONS.map((option) => (
              <Pressable
                key={option}
                onPress={() => setStatus(option)}
                style={[styles.statusChip, status === option && styles.statusChipActive]}
              >
                <Text style={[styles.statusChipText, status === option && styles.statusChipTextActive]}>
                  {option}
                </Text>
              </Pressable>
            ))}
          </View>

          {error && <Text style={styles.error}>{error}</Text>}
          <Pressable style={styles.button} onPress={handleSave} disabled={submitting}>
            <Text style={styles.buttonText}>{submitting ? 'Saving…' : 'Save Changes'}</Text>
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
  button: {
    backgroundColor: '#ed515b',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '600' },
  error: { color: '#dc2626', marginBottom: 8 },
  empty: { color: '#6b7280', fontStyle: 'italic', textAlign: 'center', marginTop: 24 },
  card: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  cardMain: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardMainText: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  cardSubtitle: { color: '#4b5563', marginTop: 2 },
  status: { marginTop: 6, color: '#ed515b', fontWeight: '600', fontSize: 12, textTransform: 'uppercase' },
  editText: { marginTop: 10, color: '#ed515b', fontWeight: '700', fontSize: 12 },
  expandedPanel: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 8,
  },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#e5e7eb',
  },
  statusChipActive: { backgroundColor: '#ed515b' },
  statusChipText: { color: '#374151', fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  statusChipTextActive: { color: '#fff' },
});
