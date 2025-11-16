import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import { useThemeStore } from '@/store/themeStore';
import { useTaskStore } from '@/store/taskStore';
import { getTheme } from '@/theme';
import { Button } from '@/components/ui/Button';
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
          }}
        />

        <Button
          title="Synchroniser avec le calendrier"
          onPress={handleSync}
          loading={syncing}
          disabled={syncing || tasks.filter(t => t.startDate).length === 0}
          fullWidth
          style={{ marginTop: 24 }}
        />

        {tasks.filter(t => t.startDate).length === 0 && (
          <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
            Aucune tâche avec date à synchroniser
          </Text>
        )}
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
});
