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
            <View style={styles.syncRow}>
              <View style={styles.syncInfo}>
                <Text style={[styles.syncText, { color: theme.colors.textSecondary }]}>
                  Dernière synchro: {lastSync ? lastSync.toLocaleString('fr-FR') : 'Jamais'}
                </Text>
                <Text style={[styles.syncText, { color: theme.colors.textSecondary }]}>
                  Modifications en attente: {pendingChanges}
                </Text>
              </View>
              <Button
                title="Synchroniser"
                onPress={handleForceSync}
                loading={syncing || isSyncing}
                disabled={syncing || isSyncing}
                variant="outline"
                size="small"
              />
            </View>
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
  syncRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  syncInfo: { flex: 1 },
  syncText: { fontSize: 14, marginBottom: 4 },
});
