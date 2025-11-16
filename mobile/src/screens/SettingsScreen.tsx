import React, { useState, useEffect } from 'react';
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
import { syncService } from '@/services/syncService';
import { locationService } from '@/services/locationService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen() {
  const { colorScheme, toggleTheme } = useThemeStore();
  const theme = getTheme(colorScheme);
  const { user } = useAuthStore();
  const { lastSync, pendingChanges, isSyncing } = useSyncStore();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Load settings from AsyncStorage on mount
  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const notifEnabled = await AsyncStorage.getItem('notifications_enabled');
      const locEnabled = await AsyncStorage.getItem('location_enabled');

      if (notifEnabled !== null) {
        setNotificationsEnabled(notifEnabled === 'true');
      }
      if (locEnabled !== null) {
        setLocationEnabled(locEnabled === 'true');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

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

  async function handleForceSync() {
    try {
      setSyncing(true);
      await syncService.forceSyncNow();
      Alert.alert('Succès', 'Synchronisation terminée avec succès', [{ text: 'OK' }]);
    } catch (error) {
      console.error('Sync error:', error);
      Alert.alert('Erreur', 'Impossible de synchroniser. Vérifiez votre connexion.', [{ text: 'OK' }]);
    } finally {
      setSyncing(false);
    }
  }

  async function handleToggleNotifications(value: boolean) {
    setNotificationsEnabled(value);
    await AsyncStorage.setItem('notifications_enabled', value.toString());
    if (value) {
      Alert.alert('Notifications activées', 'Vous recevrez des rappels pour vos tâches', [{ text: 'OK' }]);
    }
  }

  async function handleToggleLocation(value: boolean) {
    try {
      setLocationEnabled(value);
      await AsyncStorage.setItem('location_enabled', value.toString());

      if (value) {
        // Request permissions and start background tracking
        const hasPermission = await locationService.requestPermissions();
        if (hasPermission) {
          await locationService.startBackgroundLocationTracking();
          Alert.alert('Localisation activée', 'Vous pouvez maintenant ajouter des lieux à vos tâches et recevoir des rappels de proximité.', [{ text: 'OK' }]);
        } else {
          // Permission denied, revert the toggle
          setLocationEnabled(false);
          await AsyncStorage.setItem('location_enabled', 'false');
          Alert.alert('Permission requise', 'Veuillez activer la localisation dans les paramètres de votre appareil.', [{ text: 'OK' }]);
        }
      } else {
        // Stop background tracking
        await locationService.stopBackgroundLocationTracking();
        Alert.alert('Localisation désactivée', 'Le suivi de localisation en arrière-plan a été désactivé.', [{ text: 'OK' }]);
      }
    } catch (error) {
      console.error('Error toggling location:', error);
      Alert.alert('Erreur', 'Impossible de modifier les paramètres de localisation.', [{ text: 'OK' }]);
    }
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

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Notifications</Text>
          <Card style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="notifications-outline" size={24} color={theme.colors.text} />
                <Text style={[styles.settingLabel, { color: theme.colors.text }]}>Activer les rappels</Text>
              </View>
              <Switch value={notificationsEnabled} onValueChange={handleToggleNotifications} />
            </View>
          </Card>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Localisation</Text>
          <Card style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="location-outline" size={24} color={theme.colors.text} />
                <Text style={[styles.settingLabel, { color: theme.colors.text }]}>Activer la localisation</Text>
              </View>
              <Switch value={locationEnabled} onValueChange={handleToggleLocation} />
            </View>
          </Card>
        </View>

        {/* Sync Status */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Synchronisation</Text>
          <Card style={styles.settingCard}>
            <View style={styles.syncStatusRow}>
              <View style={[styles.syncIconCircle, {
                backgroundColor: isSyncing ? `${theme.colors.primary}15` : pendingChanges > 0 ? `${theme.colors.warning}15` : `${theme.colors.success}15`
              }]}>
                <Ionicons
                  name={isSyncing ? 'sync' : pendingChanges > 0 ? 'cloud-upload-outline' : 'cloud-done-outline'}
                  size={24}
                  color={isSyncing ? theme.colors.primary : pendingChanges > 0 ? theme.colors.warning : theme.colors.success}
                />
              </View>
              <View style={styles.syncStatusInfo}>
                <Text style={[styles.syncStatusLabel, { color: theme.colors.text }]}>
                  {isSyncing ? 'Synchronisation en cours...' : pendingChanges > 0 ? 'Synchronisation automatique' : 'Tout est synchronisé'}
                </Text>
                <Text style={[styles.syncStatusText, { color: theme.colors.textSecondary }]}>
                  {lastSync ? `Dernière synchro: ${lastSync.toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit' })}` : 'Aucune synchronisation'}
                </Text>
                {pendingChanges > 0 && (
                  <Text style={[styles.syncStatusPending, { color: theme.colors.warning }]}>
                    {pendingChanges} modification{pendingChanges > 1 ? 's' : ''} en attente
                  </Text>
                )}
              </View>
            </View>
          </Card>
        </View>

        {/* Logout */}
        <Card style={[styles.logoutCard, { backgroundColor: `${theme.colors.error}08`, borderColor: `${theme.colors.error}30` }]}>
          <View style={styles.logoutContent}>
            <View style={[styles.logoutIconCircle, { backgroundColor: `${theme.colors.error}15` }]}>
              <Ionicons name="log-out-outline" size={24} color={theme.colors.error} />
            </View>
            <View style={styles.logoutInfo}>
              <Text style={[styles.logoutTitle, { color: theme.colors.text }]}>Se déconnecter</Text>
              <Text style={[styles.logoutDescription, { color: theme.colors.textSecondary }]}>
                Vous serez déconnecté de votre compte
              </Text>
            </View>
            <Button
              title="Déconnexion"
              onPress={handleLogout}
              variant="outline"
              size="small"
              style={{ borderColor: theme.colors.error }}
            />
          </View>
        </Card>
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
  syncRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  syncInfo: { flex: 1 },
  syncText: { fontSize: 14, marginBottom: 4 },
  syncStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  syncIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncStatusInfo: {
    flex: 1,
  },
  syncStatusLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  syncStatusText: {
    fontSize: 13,
    marginBottom: 2,
  },
  syncStatusPending: {
    fontSize: 12,
    fontWeight: '600',
  },
  logoutCard: {
    marginTop: 8,
    borderWidth: 1,
  },
  logoutContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  logoutIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutInfo: {
    flex: 1,
  },
  logoutTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  logoutDescription: {
    fontSize: 13,
  },
});
