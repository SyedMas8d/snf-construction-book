import React from 'react';
import { StyleSheet } from 'react-native';
import DateTimePicker, { DateTimePickerChangeEvent } from '@react-native-community/datetimepicker';
import { colors } from '../theme/theme';

// iOS build of DatePickerField. Unlike Android, iOS's "compact" display renders
// its own small tappable button that opens a popover calendar on tap — there's no
// separate "open" step to manage, so (unlike the Android variant) this mounts the
// native picker directly instead of toggling it behind a custom Pressable.
export function DatePickerField({
  date,
  onChange,
  allowFuture = false,
}: {
  date: string;
  onChange: (date: string) => void;
  allowFuture?: boolean;
}) {
  function handleValueChange(_event: DateTimePickerChangeEvent, selected: Date) {
    onChange(selected.toISOString().slice(0, 10));
  }

  return (
    <DateTimePicker
      value={new Date(`${date}T00:00:00.000Z`)}
      mode="date"
      display="compact"
      accentColor={colors.primary}
      maximumDate={allowFuture ? undefined : new Date()}
      onValueChange={handleValueChange}
      style={styles.picker}
    />
  );
}

const styles = StyleSheet.create({
  picker: { alignSelf: 'flex-start' },
});
