import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CollapsibleSection } from './CollapsibleSection';
import { Button } from './ui/Button';
import { DateNav, todayDateString } from './DateNav';
import { spacing, typography } from '../theme/theme';

export function DateRangeSearch({
  from,
  to,
  onApply,
  title = 'Search by Date',
  allowFuture = false,
}: {
  from: string | null;
  to: string | null;
  onApply: (from: string | null, to: string | null) => void;
  title?: string;
  allowFuture?: boolean;
}) {
  const [draftFrom, setDraftFrom] = useState(from ?? todayDateString());
  const [draftTo, setDraftTo] = useState(to ?? todayDateString());
  const [expanded, setExpanded] = useState(false);

  const active = !!(from || to);

  return (
    <CollapsibleSection
      title={title}
      subtitle={active ? `${from ?? '…'} → ${to ?? '…'}` : 'Filter by a date range'}
      expanded={expanded}
      onToggle={setExpanded}
    >
      <Text style={styles.sublabel}>From</Text>
      <DateNav date={draftFrom} onChange={setDraftFrom} allowFuture={allowFuture} />
      <Text style={styles.sublabel}>To</Text>
      <DateNav date={draftTo} onChange={setDraftTo} allowFuture={allowFuture} />
      <View style={styles.actionsRow}>
        <Button
          title="Clear"
          variant="secondary"
          onPress={() => {
            onApply(null, null);
            setExpanded(false);
          }}
          style={styles.actionButton}
        />
        <Button
          title="Search"
          onPress={() => {
            onApply(draftFrom, draftTo);
            setExpanded(false);
          }}
          style={styles.actionButton}
        />
      </View>
    </CollapsibleSection>
  );
}

const styles = StyleSheet.create({
  sublabel: { ...typography.label, marginTop: spacing.sm },
  actionsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  actionButton: { flex: 1 },
});
