import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../theme/theme';

export type TabKey =
  | 'dashboard'
  | 'sites'
  | 'contractors'
  | 'dailyLogs'
  | 'wages'
  | 'inventory'
  | 'team'
  | 'enterprise';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const ICONS: Record<TabKey, { active: IconName; inactive: IconName }> = {
  dashboard: { active: 'grid', inactive: 'grid-outline' },
  sites: { active: 'location', inactive: 'location-outline' },
  contractors: { active: 'people', inactive: 'people-outline' },
  dailyLogs: { active: 'document-text', inactive: 'document-text-outline' },
  wages: { active: 'cash', inactive: 'cash-outline' },
  inventory: { active: 'cube', inactive: 'cube-outline' },
  team: { active: 'person-add', inactive: 'person-add-outline' },
  enterprise: { active: 'business', inactive: 'business-outline' },
};

export const TABS: { key: TabKey; label: string }[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'sites', label: 'Sites' },
  { key: 'contractors', label: 'Contractors' },
  { key: 'dailyLogs', label: 'Daily Logs' },
  { key: 'wages', label: 'Wages' },
  { key: 'inventory', label: 'Inventory' },
];

// Admin's top-level nav: pick a site (or manage team/company), rather than a flat list
// of every operational screen regardless of site context.
export const ADMIN_TOP_TABS: { key: TabKey; label: string }[] = [
  { key: 'sites', label: 'Sites' },
  { key: 'team', label: 'Team' },
  { key: 'enterprise', label: 'Enterprise' },
];

// Shown once an admin has entered a specific site's workspace.
export const SITE_WORKSPACE_TABS: { key: TabKey; label: string }[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'contractors', label: 'Contractors' },
  { key: 'dailyLogs', label: 'Daily Logs' },
  { key: 'wages', label: 'Wages' },
  { key: 'inventory', label: 'Inventory' },
];

export function TabBar({
  active,
  onChange,
  tabs = TABS,
}: {
  active: TabKey;
  onChange: (tab: TabKey) => void;
  tabs?: { key: TabKey; label: string }[];
}) {
  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        return (
          <Pressable
            key={tab.key}
            style={styles.tab}
            onPress={() => onChange(tab.key)}
            accessibilityLabel={tab.label}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            <View style={[styles.indicator, isActive && styles.indicatorActive]} />
            <Ionicons
              name={isActive ? ICONS[tab.key].active : ICONS[tab.key].inactive}
              size={22}
              color={isActive ? colors.primary : colors.textMuted}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    paddingBottom: 4,
  },
  tab: { flex: 1, paddingTop: 10, paddingBottom: 6, alignItems: 'center', gap: spacing.xs },
  indicator: { width: 20, height: 3, borderRadius: 2, backgroundColor: 'transparent' },
  indicatorActive: { backgroundColor: colors.primary },
});
