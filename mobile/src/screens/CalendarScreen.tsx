import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import { useThemeStore } from '@/store/themeStore';
import { useTaskStore } from '@/store/taskStore';
import { getTheme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { calendarService } from '@/services/calendarService';

export default function CalendarScreen() {
  const { colorScheme } = useThemeStore();
  const theme = getTheme(colorScheme);
  const { tasks } = useTaskStore();
  const [syncing, setSyncing] = useState(false);

  async function handleSync() {
    try {
      setSyncing(true);

      // Request calendar permissions
      const hasPermission = await calendarService.requestPermissions();

      if (!hasPermission) {
        Alert.alert(
          'Permission requise',
          'Veuillez autoriser l\'accès au calendrier pour synchroniser vos tâches.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Sync tasks to calendar
      await calendarService.syncTasksToCalendar(tasks);

      Alert.alert(
        'Synchronisation réussie',
        `${tasks.filter(t => t.startDate).length} tâches ont été synchronisées avec votre calendrier.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Calendar sync error:', error);
      Alert.alert(
        'Erreur de synchronisation',
        'Impossible de synchroniser les tâches avec le calendrier. Veuillez réessayer.',
        [{ text: 'OK' }]
      );
    } finally {
      setSyncing(false);
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Calendrier</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Calendar
          theme={{
            backgroundColor: theme.colors.background,
            calendarBackground: theme.colors.surface,
            textSectionTitleColor: theme.colors.textSecondary,
            selectedDayBackgroundColor: theme.colors.primary,
            selectedDayTextColor: '#ffffff',
            todayTextColor: theme.colors.primary,
            dayTextColor: theme.colors.text,
            textDisabledColor: theme.colors.textTertiary,
            monthTextColor: theme.colors.text,
            arrowColor: theme.colors.primary,
            textDayFontWeight: '400',
            textMonthFontWeight: '600',
            textDayHeaderFontWeight: '500',
            'stylesheet.calendar.header': {
              week: {
                marginTop: 5,
                flexDirection: 'row',
                justifyContent: 'space-around',
                backgroundColor: theme.colors.surface,
              },
            },
          }}
        />

        <View style={[styles.infoCard, { backgroundColor: `${theme.colors.primary}08`, borderColor: `${theme.colors.primary}30` }]}>
          <Ionicons name="information-circle" size={24} color={theme.colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.infoTitle, { color: theme.colors.text }]}>
              Synchronisation automatique
            </Text>
            <Text style={[styles.infoDescription, { color: theme.colors.textSecondary }]}>
              {tasks.filter(t => t.startDate).length > 0
                ? `${tasks.filter(t => t.startDate).length} tâche(s) avec date disponible(s)`
                : 'Aucune tâche avec date pour le moment'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 24, paddingVertical: 16 },
  title: { fontSize: 32, fontWeight: '700' },
  content: { padding: 24 },
  infoText: {
    marginTop: 12,
    fontSize: 14,
    textAlign: 'center',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 24,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 13,
  },
});
