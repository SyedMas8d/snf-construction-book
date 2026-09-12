import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerChangeEvent } from '@react-native-community/datetimepicker';
import { colors, radius, spacing, typography } from '../theme/theme';

// Android build of DatePickerField. Android has no "compact" inline style — mounting
// the native picker immediately opens a system dialog, so it's kept unmounted until
// the field is tapped, then unmounted again on both select and dismiss.
export function DatePickerField({
  date,
  onChange,
  allowFuture = false,
}: {
  date: string;
  onChange: (date: string) => void;
  allowFuture?: boolean;
}) {
  const [show, setShow] = useState(false);

  function handleValueChange(_event: DateTimePickerChangeEvent, selected: Date) {
    setShow(false);
    onChange(selected.toISOString().slice(0, 10));
  }

  return (
    <View>
      <Pressable style={styles.field} onPress={() => setShow(true)}>
        <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
        <Text style={styles.label}>{date}</Text>
      </Pressable>
      {show && (
        <DateTimePicker
          value={new Date(`${date}T00:00:00.000Z`)}
          mode="date"
          display="default"
          maximumDate={allowFuture ? undefined : new Date()}
          onValueChange={handleValueChange}
          onDismiss={() => setShow(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    alignSelf: 'flex-start',
  },
  label: { ...typography.bodyStrong },
});
