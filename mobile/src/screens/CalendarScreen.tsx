import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
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

  async function handleSync() {
    await calendarService.syncTasksToCalendar(tasks);
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
          fullWidth
          style={{ marginTop: 24 }}
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
});
