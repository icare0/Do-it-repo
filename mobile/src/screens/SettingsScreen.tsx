import React from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useThemeStore } from '@/store/themeStore';
import { useAuthStore } from '@/store/authStore';
import { useSyncStore } from '@/store/syncStore';
import { getTheme } from '@/theme';
import { authService } from '@/services/authService';

export default function SettingsScreen() {
  const { colorScheme, toggleTheme } = useThemeStore();
  const theme = getTheme(colorScheme);
  const { user } = useAuthStore();
  const { lastSync, pendingChanges } = useSyncStore();

  async function handleLogout() {
    Alert.alert('Déconnexion', 'Êtes-vous sûr de vouloir vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnexion',
        style: 'destructive',
        onPress: async () => {
          await authService.logout();
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Paramètres</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* User Info */}
        <Card style={styles.card}>
          <View style={styles.userInfo}>
            <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
              <Text style={styles.avatarText}>{user?.name?.[0] || 'U'}</Text>
            </View>
            <View>
              <Text style={[styles.userName, { color: theme.colors.text }]}>{user?.name}</Text>
              <Text style={[styles.userEmail, { color: theme.colors.textSecondary }]}>{user?.email}</Text>
            </View>
          </View>
        </Card>

        {/* Appearance */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Apparence</Text>
          <Card style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="moon-outline" size={24} color={theme.colors.text} />
                <Text style={[styles.settingLabel, { color: theme.colors.text }]}>Mode sombre</Text>
              </View>
              <Switch value={colorScheme === 'dark'} onValueChange={toggleTheme} />
            </View>
          </Card>
        </View>

        {/* Sync Status */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Synchronisation</Text>
          <Card style={styles.settingCard}>
            <Text style={[styles.syncText, { color: theme.colors.textSecondary }]}>
              Dernière synchro: {lastSync ? lastSync.toLocaleString('fr-FR') : 'Jamais'}
            </Text>
            <Text style={[styles.syncText, { color: theme.colors.textSecondary }]}>
              Modifications en attente: {pendingChanges}
            </Text>
          </Card>
        </View>

        {/* Logout */}
        <Button
          title="Se déconnecter"
          onPress={handleLogout}
          variant="outline"
          fullWidth
          icon={<Ionicons name="log-out-outline" size={20} color={theme.colors.error} />}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 24, paddingVertical: 16 },
  title: { fontSize: 32, fontWeight: '700' },
  content: { padding: 24 },
  card: { marginBottom: 24 },
  userInfo: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 24, fontWeight: '700' },
  userName: { fontSize: 18, fontWeight: '600' },
  userEmail: { fontSize: 14 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  settingCard: {},
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  settingInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingLabel: { fontSize: 16 },
  syncText: { fontSize: 14, marginBottom: 4 },
});
