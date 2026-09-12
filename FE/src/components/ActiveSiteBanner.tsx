import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSites } from '../context/SitesContext';
import { colors, radius, spacing, typography } from '../theme/theme';

// Site switching always happens at the top-level nav now (admins via Sites → enter a
// site, engineers via the header's "Change site") — this just confirms which one, so
// there's no way to silently change site out from under whichever flow got you here.
export function ActiveSiteBanner() {
  const { sites, selectedSiteId } = useSites();
  const site = sites.find((s) => s._id === selectedSiteId);

  return (
    <View style={styles.banner}>
      <Ionicons name="location" size={16} color={colors.primaryDark} />
      <Text style={styles.text}>{site?.name ?? 'No site selected'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryMuted,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  text: { ...typography.bodyStrong, color: colors.primaryDark },
});
