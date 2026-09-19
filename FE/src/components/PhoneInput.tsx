import React, { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Modal } from './ui/Modal';
import { COUNTRIES, Country, flagEmoji } from '../utils/countries';
import { colors, radius, spacing } from '../theme/theme';

export function PhoneInput({
  country,
  onChangeCountry,
  value,
  onChangeValue,
  placeholder = 'Phone number',
}: {
  country: Country;
  onChangeCountry: (country: Country) => void;
  value: string;
  onChangeValue: (text: string) => void;
  placeholder?: string;
}) {
  const [pickerVisible, setPickerVisible] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = COUNTRIES.filter((c) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return c.name.toLowerCase().includes(term) || c.dialCode.includes(term);
  });

  function handleSelectCountry(next: Country) {
    onChangeCountry(next);
    setPickerVisible(false);
    setSearch('');
  }

  return (
    <View>
      <View style={styles.row}>
        <Pressable style={styles.countryButton} onPress={() => setPickerVisible(true)}>
          <Text style={styles.flag}>{flagEmoji(country.iso2)}</Text>
          <Text style={styles.dialCode}>+{country.dialCode}</Text>
          <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
        </Pressable>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={colors.textFaint}
          value={value}
          onChangeText={onChangeValue}
          keyboardType="phone-pad"
        />
      </View>

      <Modal visible={pickerVisible} onClose={() => setPickerVisible(false)}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search country or code"
          placeholderTextColor={colors.textFaint}
          value={search}
          onChangeText={setSearch}
          autoFocus
        />
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.iso2}
          style={styles.list}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={<Text style={styles.empty}>No matching country</Text>}
          renderItem={({ item }) => (
            <Pressable style={styles.countryRow} onPress={() => handleSelectCountry(item)}>
              <Text style={styles.flag}>{flagEmoji(item.iso2)}</Text>
              <Text style={styles.countryName}>{item.name}</Text>
              <Text style={styles.dialCode}>+{item.dialCode}</Text>
            </Pressable>
          )}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm },
  countryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surface,
  },
  flag: { fontSize: 18 },
  dialCode: { fontSize: 14, color: colors.text, fontWeight: '600' },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
  },
  list: { maxHeight: 360 },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  countryName: { flex: 1, fontSize: 14, color: colors.text },
  empty: { color: colors.textFaint, fontStyle: 'italic', textAlign: 'center', paddingVertical: 16 },
});
