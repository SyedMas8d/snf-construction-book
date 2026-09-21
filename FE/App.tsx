import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { SitesProvider, useSites } from './src/context/SitesContext';
import { ADMIN_TOP_TABS, SITE_WORKSPACE_TABS, TABS, TabBar, TabKey } from './src/components/TabBar';
import { AuthScreen } from './src/screens/AuthScreen';
import { SiteChooserScreen } from './src/screens/SiteChooserScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { SitesScreen } from './src/screens/SitesScreen';
import { ContractorsScreen } from './src/screens/ContractorsScreen';
import { DailyLogsScreen } from './src/screens/DailyLogsScreen';
import { WagesScreen } from './src/screens/WagesScreen';
import { InventoryScreen } from './src/screens/InventoryScreen';
import { TeamScreen } from './src/screens/TeamScreen';
import { EnterpriseScreen } from './src/screens/EnterpriseScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { AdminsScreen } from './src/screens/AdminsScreen';
import { colors, radius, spacing } from './src/theme/theme';

function MainAppShell() {
  const { user, signOut } = useAuth();
  const { sites, selectedSiteId, setSelectedSiteId, loading: sitesLoading, refreshSites } = useSites();
  const [engineerTab, setEngineerTab] = useState<TabKey>('dashboard');
  // Engineers pick a site explicitly on every fresh session instead of inheriting
  // whichever site SitesContext auto-selected — that silent default was the source
  // of logs occasionally landing against the wrong site.
  const [siteConfirmed, setSiteConfirmed] = useState(false);

  // Admins navigate Sites → (enter a site) → Dashboard/Contractors/Daily Logs/Wages/Inventory,
  // instead of a flat bar mixing site-management with per-site operational screens.
  const [adminTopTab, setAdminTopTab] = useState<TabKey>('sites');
  const [enteredSiteId, setEnteredSiteId] = useState<string | null>(null);
  const [siteWorkspaceTab, setSiteWorkspaceTab] = useState<TabKey>('dashboard');
  const [showProfile, setShowProfile] = useState(false);

  const isEngineer = user?.role === 'engineer';
  const isAdmin = user?.role === 'admin';
  const isSuperAdmin = user?.role === 'super_admin';
  const needsSiteChoice = isEngineer && !siteConfirmed;
  const inSiteWorkspace = isAdmin && enteredSiteId !== null;

  const ENGINEER_TAB_KEYS: TabKey[] = ['dashboard', 'dailyLogs', 'inventory'];
  const engineerTabs = TABS.filter((tab) => ENGINEER_TAB_KEYS.includes(tab.key));

  function handleEnterSite(siteId: string) {
    setSelectedSiteId(siteId);
    setEnteredSiteId(siteId);
    setSiteWorkspaceTab('dashboard');
  }

  const initial = user?.name?.trim().charAt(0).toUpperCase() ?? '?';
  const enteredSiteName = sites.find((s) => s._id === enteredSiteId)?.name;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.identity} onPress={() => setShowProfile(true)}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View>
            <Text style={styles.headerName}>{user?.name}</Text>
            <View
              style={[
                styles.roleBadge,
                user?.role === 'admin' || user?.role === 'super_admin' ? styles.roleBadgeAdmin : styles.roleBadgeEngineer,
              ]}
            >
              <Text
                style={[
                  styles.roleBadgeText,
                  user?.role === 'admin' || user?.role === 'super_admin'
                    ? styles.roleBadgeTextAdmin
                    : styles.roleBadgeTextEngineer,
                ]}
              >
                {user?.role === 'super_admin' ? 'Super Admin' : user?.role}
              </Text>
            </View>
          </View>
        </Pressable>
        <View style={styles.headerActions}>
          {showProfile ? (
            <Pressable style={styles.changeSiteButton} onPress={() => setShowProfile(false)}>
              <Ionicons name="arrow-back" size={14} color={colors.primaryDark} />
              <Text style={styles.changeSiteText}>Back</Text>
            </Pressable>
          ) : (
            <>
              {isEngineer && !needsSiteChoice && (
                <Pressable style={styles.changeSiteButton} onPress={() => setSiteConfirmed(false)}>
                  <Ionicons name="swap-horizontal" size={14} color={colors.primaryDark} />
                  <Text style={styles.changeSiteText}>Change site</Text>
                </Pressable>
              )}
              {inSiteWorkspace && (
                <Pressable style={styles.changeSiteButton} onPress={() => setEnteredSiteId(null)}>
                  <Ionicons name="arrow-back" size={14} color={colors.primaryDark} />
                  <Text style={styles.changeSiteText}>{enteredSiteName ?? 'All Sites'}</Text>
                </Pressable>
              )}
            </>
          )}
          <Pressable style={styles.logoutButton} onPress={signOut}>
            <Text style={styles.logoutText}>Log out</Text>
          </Pressable>
        </View>
      </View>

      <KeyboardAvoidingView style={styles.body} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {showProfile ? (
          <ProfileScreen />
        ) : needsSiteChoice ? (
          <SiteChooserScreen
            sites={sites}
            loading={sitesLoading}
            onRefresh={refreshSites}
            onChoose={(siteId) => {
              setSelectedSiteId(siteId);
              setSiteConfirmed(true);
            }}
          />
        ) : isSuperAdmin ? (
          <AdminsScreen />
        ) : isAdmin ? (
          inSiteWorkspace ? (
            <>
              {siteWorkspaceTab === 'dashboard' && <DashboardScreen />}
              {siteWorkspaceTab === 'contractors' && <ContractorsScreen />}
              {siteWorkspaceTab === 'dailyLogs' && <DailyLogsScreen />}
              {siteWorkspaceTab === 'wages' && <WagesScreen />}
              {siteWorkspaceTab === 'inventory' && <InventoryScreen />}
              <TabBar active={siteWorkspaceTab} onChange={setSiteWorkspaceTab} tabs={SITE_WORKSPACE_TABS} />
            </>
          ) : (
            <>
              {adminTopTab === 'sites' && <SitesScreen onEnterSite={handleEnterSite} />}
              {adminTopTab === 'team' && <TeamScreen />}
              {adminTopTab === 'enterprise' && <EnterpriseScreen />}
              <TabBar active={adminTopTab} onChange={setAdminTopTab} tabs={ADMIN_TOP_TABS} />
            </>
          )
        ) : (
          <>
            {engineerTab === 'dashboard' && <DashboardScreen />}
            {engineerTab === 'dailyLogs' && <DailyLogsScreen />}
            {engineerTab === 'inventory' && <InventoryScreen />}
            <TabBar active={engineerTab} onChange={setEngineerTab} tabs={engineerTabs} />
          </>
        )}
      </KeyboardAvoidingView>
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

function MainApp() {
  return (
    <SitesProvider>
      <MainAppShell />
    </SitesProvider>
  );
}

function Root() {
  const { user, loading } = useAuth();

  if (loading) {
    return <SafeAreaView style={styles.container} />;
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <AuthScreen />
        <StatusBar style="auto" />
      </SafeAreaView>
    );
  }

  return <MainApp />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <Root />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.primaryDark, fontWeight: '800', fontSize: 15 },
  headerName: { color: colors.text, fontSize: 14, fontWeight: '700' },
  roleBadge: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 1,
    marginTop: 2,
  },
  roleBadgeAdmin: { backgroundColor: colors.primaryMuted },
  roleBadgeEngineer: { backgroundColor: colors.successMuted },
  roleBadgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
  roleBadgeTextAdmin: { color: colors.primaryDark },
  roleBadgeTextEngineer: { color: colors.success },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  changeSiteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primaryMuted,
  },
  changeSiteText: { color: colors.primaryDark, fontSize: 12, fontWeight: '700' },
  logoutButton: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.dangerMuted,
  },
  logoutText: { color: colors.danger, fontSize: 12, fontWeight: '700' },
});
