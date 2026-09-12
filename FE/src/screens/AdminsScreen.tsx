import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Linking, Platform, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api/client';
import { Admin } from '../api/types';
import { CollapsibleSection } from '../components/CollapsibleSection';
import { CopyButton } from '../components/CopyButton';

type CreatedCredentials = {
  name: string;
  email: string;
  phone: string;
  temporaryPassword: string;
  enterpriseName: string;
};

const PAGE_LIMIT = 10;

export function AdminsScreen() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [enterpriseName, setEnterpriseName] = useState('');
  const [enterpriseAddress, setEnterpriseAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [lastCreated, setLastCreated] = useState<CreatedCredentials | null>(null);
  const [formExpanded, setFormExpanded] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));

  const loadAdmins = useCallback(async (targetPage: number, searchTerm: string) => {
    setLoading(true);
    setListError(null);
    try {
      const result = await api.auth.listAdmins({ page: targetPage, limit: PAGE_LIMIT, search: searchTerm });
      setAdmins(result.items);
      setTotal(result.total);
    } catch (err) {
      setListError(err instanceof Error ? err.message : 'Failed to load admins');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAdmins(page, search);
  }, [loadAdmins, page, search]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  async function handleCreate() {
    setFormError(null);
    setLastCreated(null);
    if (!name.trim() || !email.trim() || !phone.trim() || !enterpriseName.trim() || !enterpriseAddress.trim()) {
      setFormError('All fields are required');
      return;
    }

    setSubmitting(true);
    try {
      const created = await api.auth.createAdmin({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        enterpriseName: enterpriseName.trim(),
        enterpriseAddress: enterpriseAddress.trim(),
      });
      setLastCreated({
        name: created.name,
        email: created.email,
        phone: created.phone,
        temporaryPassword: created.temporaryPassword,
        enterpriseName: created.enterprise.name,
      });
      setName('');
      setEmail('');
      setPhone('');
      setEnterpriseName('');
      setEnterpriseAddress('');
      setFormExpanded(false);
      await loadAdmins(1, search);
      setPage(1);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create admin account');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admins</Text>
      <Text style={styles.subtitle}>Onboard a company admin along with their enterprise</Text>

      <CollapsibleSection
        title="Create Admin"
        subtitle="Onboard a new company admin"
        expanded={formExpanded}
        onToggle={setFormExpanded}
      >
        <TextInput style={styles.input} placeholder="Admin name" value={name} onChangeText={setName} />
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Phone (with country code, e.g. 91XXXXXXXXXX)"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
        <Text style={styles.label}>Enterprise</Text>
        <TextInput
          style={styles.input}
          placeholder="Company name"
          value={enterpriseName}
          onChangeText={setEnterpriseName}
        />
        <TextInput
          style={styles.input}
          placeholder="Company address"
          value={enterpriseAddress}
          onChangeText={setEnterpriseAddress}
          multiline
        />
        {formError && <Text style={styles.error}>{formError}</Text>}
        <Pressable style={styles.button} onPress={handleCreate} disabled={submitting}>
          <Text style={styles.buttonText}>{submitting ? 'Creating…' : 'Create Admin'}</Text>
        </Pressable>
      </CollapsibleSection>

      {lastCreated && <NewCredentialsCard credentials={lastCreated} onDismiss={() => setLastCreated(null)} />}

      <TextInput
        style={styles.input}
        placeholder="Search admins by name, email or phone"
        value={search}
        onChangeText={setSearch}
        autoCapitalize="none"
      />

      {listError && <Text style={styles.error}>{listError}</Text>}

      <FlatList
        data={admins}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => loadAdmins(page, search)} />}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>No admins found</Text> : null}
        renderItem={({ item }) => <AdminCard admin={item} />}
        ListFooterComponent={
          total > 0 ? <PaginationControls page={page} totalPages={totalPages} onChange={setPage} /> : null
        }
      />
    </View>
  );
}

function buildCredentialsMessage(credentials: CreatedCredentials): string {
  return `Hi ${credentials.name}, here are your Construction Book admin login details for ${credentials.enterpriseName}:\n\nEmail: ${credentials.email}\nPassword: \`\`\`${credentials.temporaryPassword}\`\`\`\n\nPlease change your password after logging in from your Profile.`;
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
      setSendError('No valid phone number for this admin');
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
      <Text style={styles.credentialsTitle}>Admin created — share their login details</Text>
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

function AdminCard({ admin }: { admin: Admin }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{admin.name}</Text>
      <Text style={styles.cardSubtitle}>{admin.email}</Text>
      <Text style={styles.cardSubtitle}>{admin.phone}</Text>
      <View style={styles.enterpriseRow}>
        <Ionicons name="business-outline" size={14} color="#4b5563" />
        <Text style={styles.cardSubtitle}>{admin.enterprise.name}</Text>
      </View>
      <Text style={styles.cardSubtitle}>{admin.enterprise.address}</Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  subtitle: { color: '#6b7280', marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase' },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
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
  empty: { color: '#6b7280', fontStyle: 'italic', textAlign: 'center', marginTop: 24 },
  card: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    gap: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  cardSubtitle: { color: '#4b5563', marginTop: 2 },
  enterpriseRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
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
