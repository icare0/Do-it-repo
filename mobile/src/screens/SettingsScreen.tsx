import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useThemeStore } from '@/store/themeStore';
import { useAuthStore } from '@/store/authStore';
import { useUserStore } from '@/store/userStore';
import { getTheme } from '@/theme';
import { authService } from '@/services/authService';
import { locationService } from '@/services/locationService';
import { hapticsService } from '@/services/hapticsService';
import { notificationService } from '@/services/notificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen() {
  const navigation = useNavigation();
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

        {/* Stats Section - Compact */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Progression</Text>
          <TouchableOpacity
            onPress={() => {
              hapticsService.light();
              navigation.navigate('Stats' as never);
            }}
            activeOpacity={0.7}
          >
            <Card style={styles.statsCard}>
              <LinearGradient
                colors={['#FF6B35', '#F7931E']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.statsGradient}
              >
                <View style={styles.statsRow}>
                  <View style={styles.statsLeft}>
                    <Ionicons name="flame" size={32} color="#FFF" />
                    <View style={styles.statsInfo}>
                      <Text style={styles.statsValue}>{streak} jours</Text>
                      <Text style={styles.statsLabel}>Série active 🔥</Text>
                    </View>
                  </View>
                  <View style={styles.statsRight}>
                    <View style={styles.statMini}>
                      <Ionicons name="trophy" size={16} color="#FFF" />
                      <Text style={styles.statMiniText}>Lvl {level}</Text>
                    </View>
                    <View style={styles.statMini}>
                      <Ionicons name="star" size={16} color="#FFF" />
                      <Text style={styles.statMiniText}>{points} pts</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#FFF" style={{ opacity: 0.7 }} />
                </View>
              </LinearGradient>
            </Card>
          </TouchableOpacity>
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
        <Card variant="flat" style={[styles.logoutCard, { backgroundColor: `${theme.colors.error}08` }]}>
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
  // Stats Section - Compact
  statsCard: { overflow: 'hidden' },
  statsGradient: {
    padding: 16,
    borderRadius: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  statsInfo: {
    flex: 1,
  },
  statsValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 2,
  },
  statsLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFF',
    opacity: 0.9,
  },
  statsRight: {
    gap: 6,
  },
  statMini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statMiniText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },
  logoutCard: {
    marginTop: 8,
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
