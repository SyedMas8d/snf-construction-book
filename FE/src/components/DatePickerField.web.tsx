import React from 'react';
import { todayDateString } from '../utils/date';
import { colors, radius, spacing } from '../theme/theme';

// Web build of DatePickerField — Metro/webpack picks this file automatically
// instead of DatePickerField.tsx when bundling for web. Renders the browser's
// native <input type="date"> since @react-native-community/datetimepicker has
// no web implementation. Uses React.createElement instead of JSX because this
// project's tsconfig has no "dom" lib, so raw <input> JSX has no type to check
// against — createElement('input', ...) sidesteps that with a plain any-typed call.
export function DatePickerField({
  date,
  onChange,
  allowFuture = false,
}: {
  date: string;
  onChange: (date: string) => void;
  allowFuture?: boolean;
}) {
  return React.createElement('input', {
    type: 'date',
    value: date,
    max: allowFuture ? undefined : todayDateString(),
    onChange: (event: { target: { value: string } }) => {
      if (event.target.value) onChange(event.target.value);
    },
    style: {
      border: `1px solid ${colors.border}`,
      borderRadius: radius.md,
      padding: `${spacing.sm}px ${spacing.md}px`,
      fontSize: 14,
      fontWeight: 600,
      color: colors.text,
      backgroundColor: colors.surface,
      fontFamily: 'inherit',
    },
  });
}
