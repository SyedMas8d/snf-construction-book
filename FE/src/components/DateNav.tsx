import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { DatePickerField } from './DatePickerField';
import { todayDateString } from '../utils/date';
import { colors, spacing } from './../theme/theme';

export { todayDateString };

export function DateNav({
  date,
  onChange,
  allowFuture = false,
}: {
  date: string;
  onChange: (date: string) => void;
  allowFuture?: boolean;
}) {
  const isToday = date === todayDateString();

  return (
    <View style={styles.row}>
      <DatePickerField date={date} onChange={onChange} allowFuture={allowFuture} />
      {!isToday && (
        <Pressable onPress={() => onChange(todayDateString())}>
          <Text style={styles.todayLink}>Jump to today</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  todayLink: { color: colors.primary, fontSize: 12, fontWeight: '700' },
});
