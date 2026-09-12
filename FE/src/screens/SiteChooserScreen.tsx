import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Site } from '../api/types';
import { Card } from '../components/ui/Card';
import { Screen } from '../components/ui/Screen';
import { colors, radius, spacing, typography } from '../theme/theme';

export function SiteChooserScreen({ sites, onChoose }: { sites: Site[]; onChoose: (siteId: string) => void }) {
  return (
    <Screen contentStyle={styles.content}>
      <Text style={styles.title}>Choose a Site</Text>
      <Text style={styles.subtitle}>Select which site you're working on. You can switch later from the header.</Text>

      <FlatList
        data={sites}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>No sites have been assigned to you yet — contact your admin.</Text>
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => onChoose(item._id)}>
            <Card style={styles.card}>
              <View style={styles.cardIcon}>
                <Ionicons name="location" size={20} color={colors.primaryDark} />
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardSubtitle}>{item.address}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textFaint} />
            </Card>
          </Pressable>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1 },
  title: { ...typography.title, marginBottom: spacing.xs },
  subtitle: { ...typography.subtitle, marginBottom: spacing.lg },
  list: { gap: spacing.sm },
  empty: { color: colors.textMuted, fontStyle: 'italic', textAlign: 'center', marginTop: spacing.xxl },
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1 },
  cardTitle: typography.heading,
  cardSubtitle: { ...typography.caption, marginTop: 2 },
});
