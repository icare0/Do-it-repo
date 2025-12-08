import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, DateData } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { format, startOfMonth, endOfMonth, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SkeletonTaskCard, SkeletonList } from '@/components/ui/Skeleton';
import { useThemeStore } from '@/store/themeStore';
import { useTaskStore } from '@/store/taskStore';
import { getTheme } from '@/theme';
import { calendarService } from '@/services/calendarService';
import { hapticsService } from '@/services/hapticsService';
import { CalendarEvent } from '@/types';

interface MarkedDates {
  [date: string]: {
    marked?: boolean;
    dotColor?: string;
    selected?: boolean;
    selectedColor?: string;
    dots?: Array<{ key: string; color: string }>;
  };
}

export default function CalendarScreen() {
  const navigation = useNavigation();
  const { colorScheme } = useThemeStore();
  const theme = getTheme(colorScheme);
  const { tasks, setSelectedTask } = useTaskStore();

  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const isLoadingEventsRef = useRef(false); // Flag pour éviter les appels multiples

  const loadCalendarEvents = useCallback(async () => {
    // Éviter les appels multiples
    if (isLoadingEventsRef.current) {
      console.log('⏸️ [CalendarScreen] Chargement déjà en cours, annulation...');
      return;
    }

    try {
      console.log('🖥️ [CalendarScreen] ========== CHARGEMENT DES ÉVÉNEMENTS ==========');
      isLoadingEventsRef.current = true;
      setIsLoading(true);

      console.log('🖥️ [CalendarScreen] Demande de permissions...');
      const hasPermission = await calendarService.requestPermissions();
      console.log('🖥️ [CalendarScreen] Permissions:', hasPermission);

      if (hasPermission) {
        const start = startOfMonth(new Date());
        const end = endOfMonth(new Date());
        // Get events for 3 months
        start.setMonth(start.getMonth() - 1);
        end.setMonth(end.getMonth() + 1);

        console.log('🖥️ [CalendarScreen] Appel à calendarService.getEvents()...');
        console.log('🖥️ [CalendarScreen] Période:', start.toISOString(), 'à', end.toISOString());

        const events = await calendarService.getEvents(start, end);

        console.log('🖥️ [CalendarScreen] ========== ÉVÉNEMENTS REÇUS ==========');
        console.log('🖥️ [CalendarScreen] Nombre total:', events.length);
        events.forEach((event, index) => {
          console.log(`🖥️ [CalendarScreen] Événement ${index + 1}:`, {
            title: event.title,
            source: event.source,
            startDate: event.startDate.toISOString(),
          });
        });

        setCalendarEvents(events);
        console.log('✅ [CalendarScreen] État mis à jour avec', events.length, 'événements');
      } else {
        console.log('❌ [CalendarScreen] Pas de permissions, impossible de charger les événements');
      }
    } catch (error) {
      console.error('❌ [CalendarScreen] Erreur lors du chargement:', error);
    } finally {
      setIsLoading(false);
      isLoadingEventsRef.current = false;
      console.log('🖥️ [CalendarScreen] ========== FIN CHARGEMENT ==========');
    }
  }, []);

  useEffect(() => {
    loadCalendarEvents();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCalendarEvents();
    setRefreshing(false);
  };

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      await hapticsService.medium();

      const hasPermission = await calendarService.requestPermissions();
      if (!hasPermission) {
        Alert.alert(
          'Permission requise',
          "Veuillez autoriser l'accès au calendrier pour synchroniser vos tâches.",
          [{ text: 'OK' }]
        );
        return;
      }

      const tasksWithDate = tasks.filter((t) => t.startDate);
      await calendarService.syncTasksToCalendar(tasks);
      await loadCalendarEvents();

      await hapticsService.success();
      Alert.alert(
        'Synchronisation réussie',
        `${tasksWithDate.length} tâche(s) synchronisée(s) avec votre calendrier.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Calendar sync error:', error);
      await hapticsService.error();
      Alert.alert(
        'Erreur de synchronisation',
        'Impossible de synchroniser les tâches avec le calendrier.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDayPress = async (day: DateData) => {
    await hapticsService.selection();
    setSelectedDate(day.dateString);
  };

  const handleTaskPress = (task: any) => {
    hapticsService.light();
    setSelectedTask(task);
    navigation.navigate('TaskDetail' as never, { taskId: task.id } as never);
  };

  // Build marked dates
  const markedDates: MarkedDates = {};

  // Add tasks to marked dates
  tasks.forEach((task) => {
    if (task.startDate) {
      const dateStr = format(task.startDate, 'yyyy-MM-dd');
      if (!markedDates[dateStr]) {
        markedDates[dateStr] = { dots: [] };
      }
      markedDates[dateStr].dots?.push({
        key: task.id,
        color: task.priority === 'high' ? theme.colors.error : theme.colors.primary,
      });
    }
  });

  // Add calendar events
  calendarEvents.forEach((event) => {
    const dateStr = format(event.startDate, 'yyyy-MM-dd');
    if (!markedDates[dateStr]) {
      markedDates[dateStr] = { dots: [] };
    }
    markedDates[dateStr].dots?.push({
      key: event.id,
      color: theme.colors.secondary,
    });
  });

  // Mark selected date
  if (markedDates[selectedDate]) {
    markedDates[selectedDate].selected = true;
    markedDates[selectedDate].selectedColor = theme.colors.primary;
  } else {
    markedDates[selectedDate] = {
      selected: true,
      selectedColor: theme.colors.primary,
    };
  }

  // Get items for selected date
  const selectedTasks = tasks.filter(
    (task) => task.startDate && format(task.startDate, 'yyyy-MM-dd') === selectedDate
  );

  const selectedEvents = calendarEvents.filter(
    (event) => format(event.startDate, 'yyyy-MM-dd') === selectedDate
  );

  const calendarTheme = colorScheme === 'dark'
    ? {
        backgroundColor: '#171717',
        calendarBackground: '#171717',
        textSectionTitleColor: '#A3A3A3',
        selectedDayBackgroundColor: '#60A5FA',
        selectedDayTextColor: '#ffffff',
        todayTextColor: '#60A5FA',
        dayTextColor: '#FAFAFA',
        textDisabledColor: '#737373',
        monthTextColor: '#FAFAFA',
        arrowColor: '#60A5FA',
        disabledArrowColor: '#737373',
        textDayFontWeight: '400' as const,
        textMonthFontWeight: '600' as const,
        textDayHeaderFontWeight: '500' as const,
      }
    : {
        backgroundColor: '#FFFFFF',
        calendarBackground: '#FFFFFF',
        textSectionTitleColor: '#737373',
        selectedDayBackgroundColor: '#3B82F6',
        selectedDayTextColor: '#ffffff',
        todayTextColor: '#3B82F6',
        dayTextColor: '#171717',
        textDisabledColor: '#A3A3A3',
        monthTextColor: '#171717',
        arrowColor: '#3B82F6',
        disabledArrowColor: '#A3A3A3',
        textDayFontWeight: '400' as const,
        textMonthFontWeight: '600' as const,
        textDayHeaderFontWeight: '500' as const,
      };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Calendrier</Text>
        <TouchableOpacity
          style={[styles.syncButton, { backgroundColor: `${theme.colors.primary}15` }]}
          onPress={handleSync}
          disabled={isSyncing}
        >
          <Ionicons
            name={isSyncing ? 'sync' : 'sync-outline'}
            size={20}
            color={theme.colors.primary}
          />
          <Text style={[styles.syncText, { color: theme.colors.primary }]}>
            {isSyncing ? 'Sync...' : 'Sync'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Calendar */}
        <View
          style={[
            styles.calendarContainer,
            {
              backgroundColor: colorScheme === 'dark' ? '#171717' : '#FFFFFF',
              borderColor: colorScheme === 'dark' ? '#404040' : 'transparent',
              borderWidth: colorScheme === 'dark' ? 1 : 0,
            },
          ]}
        >
          <Calendar
            key={`calendar-${colorScheme}`}
            theme={calendarTheme}
            onDayPress={handleDayPress}
            markedDates={markedDates}
            markingType="multi-dot"
            firstDay={1}
            enableSwipeMonths
            style={{ borderRadius: 16 }}
          />
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: theme.colors.primary }]} />
            <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>Tâches</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: theme.colors.secondary }]} />
            <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>Calendrier</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: theme.colors.error }]} />
            <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>Prioritaire</Text>
          </View>
        </View>

        {/* Selected Day Details */}
        <View style={styles.dayDetails}>
          <Text style={[styles.dayTitle, { color: theme.colors.text }]}>
            {format(new Date(selectedDate), 'EEEE d MMMM', { locale: fr })}
          </Text>

          {selectedTasks.length === 0 && selectedEvents.length === 0 ? (
            <Card style={styles.emptyCard}>
              <View style={styles.emptyContent}>
                <Ionicons name="calendar-outline" size={48} color={theme.colors.textTertiary} />
                <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                  Rien de prévu ce jour
                </Text>
                <Button
                  title="Ajouter une tâche"
                  onPress={() => navigation.navigate('QuickAdd' as never)}
                  variant="outline"
                  size="small"
                  style={{ marginTop: 12 }}
                />
              </View>
            </Card>
          ) : (
            <>
              {/* Tasks */}
              {selectedTasks.length > 0 && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
                    TÂCHES ({selectedTasks.length})
                  </Text>
                  {selectedTasks.map((task) => (
                    <Card key={task.id} style={styles.itemCard} onPress={() => handleTaskPress(task)}>
                      <View style={styles.itemContent}>
                        <View
                          style={[
                            styles.itemIndicator,
                            {
                              backgroundColor:
                                task.priority === 'high'
                                  ? theme.colors.error
                                  : theme.colors.primary,
                            },
                          ]}
                        />
                        <View style={styles.itemInfo}>
                          <Text
                            style={[
                              styles.itemTitle,
                              { color: theme.colors.text },
                              task.completed && styles.completed,
                            ]}
                          >
                            {task.title}
                          </Text>
                          {task.startDate && (
                            <Text style={[styles.itemTime, { color: theme.colors.textSecondary }]}>
                              {format(task.startDate, 'HH:mm')}
                              {task.duration && ` · ${task.duration} min`}
                            </Text>
                          )}
                        </View>
                        {task.category && <Badge label={task.category} size="small" />}
                      </View>
                    </Card>
                  ))}
                </View>
              )}

              {/* Calendar Events */}
              {selectedEvents.length > 0 && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
                    CALENDRIER ({selectedEvents.length})
                  </Text>
                  {selectedEvents.map((event) => (
                    <Card key={event.id} style={styles.itemCard}>
                      <View style={styles.itemContent}>
                        <View
                          style={[styles.itemIndicator, { backgroundColor: theme.colors.secondary }]}
                        />
                        <View style={styles.itemInfo}>
                          <Text style={[styles.itemTitle, { color: theme.colors.text }]}>
                            {event.title}
                          </Text>
                          <Text style={[styles.itemTime, { color: theme.colors.textSecondary }]}>
                            {format(event.startDate, 'HH:mm')} - {format(event.endDate, 'HH:mm')}
                          </Text>
                          {event.location && (
                            <View style={styles.locationRow}>
                              <Ionicons
                                name="location-outline"
                                size={12}
                                color={theme.colors.textTertiary}
                              />
                              <Text style={[styles.locationText, { color: theme.colors.textTertiary }]}>
                                {event.location}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </Card>
                  ))}
                </View>
              )}
            </>
          )}
        </View>

        {/* Summary Card */}
        <View style={styles.summaryContainer}>
          <Card variant="flat" padding="lg" borderRadiusSize="lg" style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
                <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
                  {tasks.filter((t) => t.startDate).length}
                </Text>
                <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
                  Tâches
                </Text>
              </View>
              <View style={[styles.summaryDivider, { backgroundColor: theme.colors.border }]} />
              <View style={styles.summaryItem}>
                <Ionicons name="calendar" size={20} color={theme.colors.secondary} />
                <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
                  {calendarEvents.length}
                </Text>
                <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
                  Événements
                </Text>
              </View>
            </View>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  syncText: { fontSize: 15, fontWeight: '600' },
  content: { padding: 24, paddingTop: 0, paddingBottom: 94 }, // Space for tab bar (50px + 44px padding)
  calendarContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 16,
    marginBottom: 24,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
  },
  dayDetails: {
    marginBottom: 24,
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'capitalize',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
  },
  emptyCard: {
    paddingVertical: 32,
  },
  emptyContent: {
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
  },
  itemCard: {
    marginBottom: 8,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '500',
  },
  itemTime: {
    fontSize: 13,
    marginTop: 2,
  },
  completed: {
    textDecorationLine: 'line-through',
    opacity: 0.5,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  locationText: {
    fontSize: 12,
  },
  summaryContainer: {
    marginTop: 16,
  },
  summaryCard: {
    overflow: 'hidden',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  summaryDivider: {
    width: 1,
    height: 48,
    marginHorizontal: 12,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
});
