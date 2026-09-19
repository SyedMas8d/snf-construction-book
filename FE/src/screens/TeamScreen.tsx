import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSites } from '../context/SitesContext';
import { api } from '../api/client';
import { Site, User } from '../api/types';
import { CollapsibleSection } from '../components/CollapsibleSection';
import { CopyButton } from '../components/CopyButton';
import { PhoneInput } from '../components/PhoneInput';
import { Country, DEFAULT_COUNTRY } from '../utils/countries';
import { isValidPhone, toE164 } from '../utils/phone';

type CreatedCredentials = { name: string; email: string; phone: string; temporaryPassword: string; title: string };

function SiteChipPicker({
  sites,
  selectedSiteIds,
  onToggle,
}: {
  sites: Site[];
  selectedSiteIds: string[];
  onToggle: (siteId: string) => void;
}) {
  if (sites.length === 0) {
    return <Text style={styles.hint}>No sites yet — add one in the Sites tab first.</Text>;
  }
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
      {sites.map((site) => (
        <Pressable
          key={site._id}
          onPress={() => onToggle(site._id)}
          style={[styles.chip, selectedSiteIds.includes(site._id) && styles.chipActive]}
        >
          <Text style={[styles.chipText, selectedSiteIds.includes(site._id) && styles.chipTextActive]}>
            {site.name}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const PAGE_LIMIT = 10;

export function TeamScreen() {
  const { sites } = useSites();
  const [engineers, setEngineers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneCountry, setPhoneCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [assignedSiteIds, setAssignedSiteIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [lastCreated, setLastCreated] = useState<CreatedCredentials | null>(null);
  const [formExpanded, setFormExpanded] = useState(false);

  const siteNameById = new Map(sites.map((s) => [s._id, s.name]));
  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));

  const loadEngineers = useCallback(async (targetPage: number, searchTerm: string) => {
    setLoading(true);
    setListError(null);
    try {
      const result = await api.auth.listEngineers({ page: targetPage, limit: PAGE_LIMIT, search: searchTerm });
      setEngineers(result.items);
      setTotal(result.total);
    } catch (err) {
      setListError(err instanceof Error ? err.message : 'Failed to load engineers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEngineers(page, search);
  }, [loadEngineers, page, search]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  function toggleAssignedSite(siteId: string) {
    setAssignedSiteIds((current) =>
      current.includes(siteId) ? current.filter((id) => id !== siteId) : [...current, siteId]
    );
  }

  async function handleCreate() {
    setFormError(null);
    setLastCreated(null);
    if (!name.trim() || !email.trim() || !isValidPhone(phoneCountry, phone)) {
      setFormError(!name.trim() || !email.trim() ? 'All fields are required' : 'Enter a valid phone number');
      return;
    }

    setSubmitting(true);
    try {
      const created = await api.auth.createEngineer({
        name: name.trim(),
        email: email.trim(),
        phone: toE164(phoneCountry, phone),
        assignedSites: assignedSiteIds,
      });
      setLastCreated({
        name: created.name,
        email: created.email,
        phone: created.phone,
        temporaryPassword: created.temporaryPassword,
        title: 'Engineer created — share their login details',
      });
      setName('');
      setEmail('');
      setPhone('');
      setPhoneCountry(DEFAULT_COUNTRY);
      setAssignedSiteIds([]);
      setFormExpanded(false);
      await loadEngineers(1, search);
      setPage(1);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create engineer account');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Team</Text>
      <Text style={styles.subtitle}>Create an engineer account</Text>

      <CollapsibleSection
        title="Create Engineer"
        subtitle="Onboard a new engineer"
        expanded={formExpanded}
        onToggle={setFormExpanded}
      >
        <TextInput style={styles.input} placeholder="Name" value={name} onChangeText={setName} />
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <PhoneInput country={phoneCountry} onChangeCountry={setPhoneCountry} value={phone} onChangeValue={setPhone} />
        <Text style={styles.label}>Assigned Sites</Text>
        <SiteChipPicker sites={sites} selectedSiteIds={assignedSiteIds} onToggle={toggleAssignedSite} />
        {formError && <Text style={styles.error}>{formError}</Text>}
        <Pressable style={styles.button} onPress={handleCreate} disabled={submitting}>
          <Text style={styles.buttonText}>{submitting ? 'Creating…' : 'Create Engineer'}</Text>
        </Pressable>
      </CollapsibleSection>

      {lastCreated && <NewCredentialsCard credentials={lastCreated} onDismiss={() => setLastCreated(null)} />}

      <TextInput
        style={styles.input}
        placeholder="Search engineers by name, email or phone"
        value={search}
        onChangeText={setSearch}
        autoCapitalize="none"
      />

      {listError && <Text style={styles.error}>{listError}</Text>}

      <FlatList
        data={engineers}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => loadEngineers(page, search)} />}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>No engineers found</Text> : null}
        renderItem={({ item }) => (
          <EngineerCard
            engineer={item}
            sites={sites}
            siteNameById={siteNameById}
            expanded={expandedId === item._id}
            onToggle={() => setExpandedId((current) => (current === item._id ? null : item._id))}
            onChanged={() => loadEngineers(page, search)}
            onReset={setLastCreated}
          />
        )}
        ListFooterComponent={
          total > 0 ? (
            <PaginationControls page={page} totalPages={totalPages} onChange={setPage} />
          ) : null
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

function buildCredentialsMessage(credentials: CreatedCredentials): string {
  return `Hi ${credentials.name}, here are your Construction Book login details:\n\nEmail: ${credentials.email}\nPassword: \`\`\`${credentials.temporaryPassword}\`\`\`\n\nPlease change your password after logging in from your Profile.`;
}

function NewCredentialsCard({
  credentials,
  onDismiss,
}: {
  credentials: CreatedCredentials;
  onDismiss: () => void;
}) {
  const [sendError, setSendError] = useState<string | null>(null);

  async function handleSend() {
    setSendError(null);
    const digits = credentials.phone.replace(/[^0-9]/g, '');
    if (!digits) {
      setSendError('No valid phone number for this engineer');
      return;
    }
    const message = buildCredentialsMessage(credentials);
    const url = `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      await Linking.openURL(url);
    }
  }

  return (
    <View style={styles.credentialsCard}>
      <Text style={styles.credentialsTitle}>{credentials.title}</Text>
      <Text style={styles.credentialsRow}>Email: {credentials.email}</Text>
      <View style={styles.credentialsPasswordRow}>
        <Text style={styles.credentialsRow}>Password: {credentials.temporaryPassword}</Text>
        <CopyButton value={credentials.temporaryPassword} color="#166534" />
      </View>
      {sendError && <Text style={styles.error}>{sendError}</Text>}
      <View style={styles.credentialsActions}>
        <Pressable style={styles.whatsappButton} onPress={handleSend}>
          <Ionicons name="logo-whatsapp" size={18} color="#fff" />
          <Text style={styles.whatsappButtonText}>Share via WhatsApp</Text>
        </Pressable>
        <Pressable onPress={onDismiss} hitSlop={8}>
          <Text style={styles.dismissText}>Dismiss</Text>
        </Pressable>
      </View>
    </View>
  );
}

function EngineerCard({
  engineer,
  sites,
  siteNameById,
  expanded,
  onToggle,
  onChanged,
  onReset,
}: {
  engineer: User;
  sites: Site[];
  siteNameById: Map<string, string>;
  expanded: boolean;
  onToggle: () => void;
  onChanged: () => void;
  onReset: (credentials: CreatedCredentials) => void;
}) {
  const [siteIds, setSiteIds] = useState(engineer.assignedSites);
  const [deleting, setDeleting] = useState(false);
  const [savingSites, setSavingSites] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleToggle() {
    if (!expanded) {
      setSiteIds(engineer.assignedSites);
      setError(null);
    }
    onToggle();
  }

  function toggleSite(siteId: string) {
    setSiteIds((current) => (current.includes(siteId) ? current.filter((id) => id !== siteId) : [...current, siteId]));
  }

  async function handleSaveSites() {
    setSavingSites(true);
    setError(null);
    try {
      await api.auth.updateEngineerSites(engineer._id, siteIds);
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update assigned sites');
    } finally {
      setSavingSites(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      await api.auth.deleteEngineer(engineer._id);
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete engineer');
      setDeleting(false);
    }
  }

  async function handleResetPassword() {
    setResetting(true);
    setError(null);
    try {
      const result = await api.auth.resetEngineerPassword(engineer._id);
      onReset({
        name: result.name,
        email: result.email,
        phone: result.phone,
        temporaryPassword: result.temporaryPassword,
        title: 'Password reset — share their new login details',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setResetting(false);
    }
  }

  const assignedNames = engineer.assignedSites.map((id) => siteNameById.get(id) ?? 'Unknown site');

  return (
    <View style={styles.card}>
      <Pressable onPress={handleToggle}>
        <Text style={styles.cardTitle}>{engineer.name}</Text>
        <Text style={styles.cardSubtitle}>{engineer.email}</Text>
        <Text style={styles.cardSubtitle}>{engineer.phone}</Text>
        <Text style={styles.cardSubtitle}>
          {assignedNames.length > 0 ? `Sites: ${assignedNames.join(', ')}` : 'No sites assigned'}
        </Text>
      </Pressable>

      {expanded && (
        <View style={styles.expandedPanel}>
          <Text style={styles.label}>Assigned Sites</Text>
          <SiteChipPicker sites={sites} selectedSiteIds={siteIds} onToggle={toggleSite} />
          {error && <Text style={styles.error}>{error}</Text>}
          <Pressable style={styles.button} onPress={handleSaveSites} disabled={savingSites}>
            <Text style={styles.buttonText}>{savingSites ? 'Saving…' : 'Save Sites'}</Text>
          </Pressable>
          <Pressable style={styles.resetButton} onPress={handleResetPassword} disabled={resetting}>
            <Text style={styles.resetButtonText}>{resetting ? 'Resetting…' : 'Reset Password'}</Text>
          </Pressable>
          <Pressable style={styles.deleteButton} onPress={handleDelete} disabled={deleting}>
            <Text style={styles.deleteButtonText}>{deleting ? 'Deleting…' : 'Delete Engineer'}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  subtitle: { color: '#6b7280', marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase' },
  hint: { color: '#6b7280', fontStyle: 'italic' },
  chipScroll: { flexGrow: 0, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#e5e7eb',
    marginRight: 8,
  },
  chipActive: { backgroundColor: '#ed515b' },
  chipText: { color: '#374151', fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  button: {
    backgroundColor: '#ed515b',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '600' },
  credentialsCard: {
    borderWidth: 1,
    borderColor: '#bbf7d0',
    backgroundColor: '#f0fdf4',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    gap: 4,
  },
  credentialsTitle: { fontWeight: '700', color: '#166534', marginBottom: 4 },
  credentialsRow: { color: '#166534', fontSize: 13 },
  credentialsPasswordRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  credentialsActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  whatsappButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#25d366',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  whatsappButtonText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  dismissText: { color: '#166534', fontWeight: '600', fontSize: 13 },
  error: { color: '#dc2626' },
  success: { color: '#16a34a' },
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
  expandedPanel: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 8,
  },
  resetButton: {
    borderWidth: 1,
    borderColor: '#d97706',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  resetButtonText: { color: '#d97706', fontWeight: '600' },
  deleteButton: {
    borderWidth: 1,
    borderColor: '#dc2626',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  deleteButtonText: { color: '#dc2626', fontWeight: '600' },
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
