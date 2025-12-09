import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useThemeStore } from '@/store/themeStore';
import { useAuthStore } from '@/store/authStore';
import { useUserStore } from '@/store/userStore';
import { getTheme } from '@/theme';
import { authService } from '@/services/authService';
import { locationService } from '@/services/locationService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen() {
  const { colorScheme, toggleTheme } = useThemeStore();
  const theme = getTheme(colorScheme);
  const { user } = useAuthStore();
  const { streak, points, level, tasksCompleted, totalTasks } = useUserStore();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);

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

        {/* Stats Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Tes Statistiques 🎯</Text>

          {/* Streak Card */}
          <Card style={styles.statsCard}>
            <LinearGradient
              colors={['#FF6B35', '#F7931E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.streakGradient}
            >
              <View style={styles.streakContent}>
                <Ionicons name="flame" size={32} color="#FFF" />
                <View style={styles.streakInfo}>
                  <Text style={styles.streakValue}>{streak}</Text>
                  <Text style={styles.streakLabel}>jours de série !</Text>
                </View>
              </View>
              <Text style={styles.streakMotivation}>Continue comme ça ! 🚀</Text>
            </LinearGradient>
          </Card>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            {/* Level */}
            <Card style={styles.statCard}>
              <View style={[styles.statIconCircle, { backgroundColor: `${theme.colors.primary}15` }]}>
                <Ionicons name="trophy" size={24} color={theme.colors.primary} />
              </View>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>{level}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Niveau</Text>
            </Card>

            {/* Points */}
            <Card style={styles.statCard}>
              <View style={[styles.statIconCircle, { backgroundColor: `${theme.colors.secondary}15` }]}>
                <Ionicons name="star" size={24} color={theme.colors.secondary} />
              </View>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>{points}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Points</Text>
            </Card>
          </View>

          {/* Completion Rate */}
          <Card style={styles.completionCard}>
            <View style={styles.completionHeader}>
              <Text style={[styles.completionTitle, { color: theme.colors.text }]}>Taux de réussite</Text>
              <Text style={[styles.completionPercent, { color: theme.colors.primary }]}>
                {totalTasks > 0 ? Math.round((tasksCompleted / totalTasks) * 100) : 0}%
              </Text>
            </View>
            <View style={[styles.progressBar, { backgroundColor: `${theme.colors.primary}15` }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: theme.colors.primary,
                    width: `${totalTasks > 0 ? (tasksCompleted / totalTasks) * 100 : 0}%`,
                  },
                ]}
              />
            </View>
            <Text style={[styles.completionStats, { color: theme.colors.textSecondary }]}>
              {tasksCompleted} / {totalTasks} tâches terminées
            </Text>
          </Card>
        </View>

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
  // Stats Section
  statsCard: { marginBottom: 12, overflow: 'hidden' },
  streakGradient: {
    padding: 20,
    borderRadius: 16,
  },
  streakContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 8,
  },
  streakInfo: {
    flex: 1,
  },
  streakValue: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFF',
    lineHeight: 40,
  },
  streakLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    opacity: 0.9,
  },
  streakMotivation: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
    opacity: 0.8,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
  },
  statIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  completionCard: {
    padding: 20,
  },
  completionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  completionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  completionPercent: {
    fontSize: 24,
    fontWeight: '800',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  completionStats: {
    fontSize: 13,
    textAlign: 'center',
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
