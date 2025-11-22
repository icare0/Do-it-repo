import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import { Card } from '@/components/ui/Card';
import { useThemeStore } from '@/store/themeStore';
import { useTaskStore } from '@/store/taskStore';
import { getTheme } from '@/theme';
import { weatherService, WeatherData } from '@/services/weatherService';
import { hapticsService } from '@/services/hapticsService';

interface DailyBriefingProps {
  onDismiss?: () => void;
  onTaskPress?: () => void;
  onFocusPress?: () => void;
}

export function DailyBriefing({ onDismiss, onTaskPress, onFocusPress }: DailyBriefingProps) {
  const { colorScheme } = useThemeStore();
  const theme = getTheme(colorScheme);
  const { tasks } = useTaskStore();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [expanded, setExpanded] = useState(true);
  const expandAnim = React.useRef(new Animated.Value(1)).current;

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  // Calculate stats
  const todayTasks = tasks.filter(
    (t) => t.startDate && format(t.startDate, 'yyyy-MM-dd') === todayStr && !t.completed
  );
  const highPriorityTasks = todayTasks.filter((t) => t.priority === 'high');
  const tasksWithMeetings = todayTasks.filter(
    (t) => t.category?.toLowerCase().includes('réunion') || t.category?.toLowerCase().includes('meeting')
  );

  useEffect(() => {
    loadWeather();
  }, []);

  const loadWeather = async () => {
    const data = await weatherService.getCurrentWeather();
    setWeather(data);
  };

  const toggleExpand = async () => {
    await hapticsService.light();
    const toValue = expanded ? 0 : 1;
    Animated.spring(expandAnim, {
      toValue,
      useNativeDriver: false,
      tension: 100,
      friction: 10,
    }).start();
    setExpanded(!expanded);
  };

  const getGreeting = () => {
    const hour = today.getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  const getWeatherIcon = (condition?: string): string => {
    switch (condition) {
      case 'clear':
        return 'sunny';
      case 'clouds':
        return 'cloudy';
      case 'rain':
        return 'rainy';
      case 'snow':
        return 'snow';
      case 'thunderstorm':
        return 'thunderstorm';
      default:
        return 'partly-sunny';
    }
  };

  const getMotivationalMessage = () => {
    if (todayTasks.length === 0) {
      return 'Ta journée est libre ! Profites-en 🎉';
    }
    if (highPriorityTasks.length > 0) {
      return `${highPriorityTasks.length} tâche${highPriorityTasks.length > 1 ? 's' : ''} prioritaire${highPriorityTasks.length > 1 ? 's' : ''} à ne pas oublier !`;
    }
    if (todayTasks.length <= 3) {
      return 'Une journée bien gérée en perspective 👍';
    }
    return 'Journée chargée ! Focus mode activé ? 🎯';
  };

  const maxHeight = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 300],
  });

  const opacity = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <Card style={styles.container}>
      {/* Header - Always visible */}
      <TouchableOpacity onPress={toggleExpand} activeOpacity={0.9}>
        <LinearGradient
          colors={colorScheme === 'dark' ? ['#1E3A8A', '#312E81'] : ['#3B82F6', '#8B5CF6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>{getGreeting()} !</Text>
              <Text style={styles.date}>
                {format(today, 'EEEE d MMMM', { locale: fr })}
              </Text>
            </View>

            {weather && (
              <View style={styles.weatherBadge}>
                <Ionicons
                  name={getWeatherIcon(weather.condition) as any}
                  size={20}
                  color="#fff"
                />
                <Text style={styles.temperature}>{weather.temperature}°</Text>
              </View>
            )}
          </View>

          <View style={styles.expandIcon}>
            <Ionicons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="rgba(255,255,255,0.8)"
            />
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* Expandable Content */}
      <Animated.View style={[styles.content, { maxHeight, opacity }]}>
        {/* Motivational Message */}
        <View style={styles.messageContainer}>
          <Text style={[styles.message, { color: theme.colors.text }]}>
            {getMotivationalMessage()}
          </Text>
        </View>

        {/* Weather Advice */}
        {weather?.advice && (
          <View style={[styles.adviceCard, { backgroundColor: `${theme.colors.warning}15` }]}>
            <Ionicons name="umbrella-outline" size={18} color={theme.colors.warning} />
            <Text style={[styles.adviceText, { color: theme.colors.text }]}>
              {weather.advice}
            </Text>
          </View>
        )}

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <View style={[styles.statIcon, { backgroundColor: `${theme.colors.primary}15` }]}>
              <Ionicons name="checkbox-outline" size={18} color={theme.colors.primary} />
            </View>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {todayTasks.length}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              tâches
            </Text>
          </View>

          <View style={styles.stat}>
            <View style={[styles.statIcon, { backgroundColor: `${theme.colors.error}15` }]}>
              <Ionicons name="flag-outline" size={18} color={theme.colors.error} />
            </View>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {highPriorityTasks.length}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              prioritaires
            </Text>
          </View>

          <View style={styles.stat}>
            <View style={[styles.statIcon, { backgroundColor: `${theme.colors.secondary}15` }]}>
              <Ionicons name="people-outline" size={18} color={theme.colors.secondary} />
            </View>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {tasksWithMeetings.length}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              réunions
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: `${theme.colors.primary}15` }]}
            onPress={onTaskPress}
          >
            <Ionicons name="list-outline" size={20} color={theme.colors.primary} />
            <Text style={[styles.actionText, { color: theme.colors.primary }]}>
              Voir les tâches
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: `${theme.colors.secondary}15` }]}
            onPress={onFocusPress}
          >
            <Ionicons name="timer-outline" size={20} color={theme.colors.secondary} />
            <Text style={[styles.actionText, { color: theme.colors.secondary }]}>
              Mode Focus
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Dismiss Button */}
      {onDismiss && expanded && (
        <TouchableOpacity
          style={styles.dismissButton}
          onPress={() => {
            hapticsService.light();
            onDismiss();
          }}
        >
          <Ionicons name="close" size={18} color={theme.colors.textTertiary} />
        </TouchableOpacity>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 0,
    overflow: 'hidden',
  },
  header: {
    padding: 16,
    borderRadius: 12,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  date: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  weatherBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  temperature: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  expandIcon: {
    alignSelf: 'center',
    marginTop: 8,
  },
  content: {
    padding: 16,
    overflow: 'hidden',
  },
  messageContainer: {
    marginBottom: 16,
  },
  message: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
  },
  adviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    gap: 10,
  },
  adviceText: {
    flex: 1,
    fontSize: 13,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  stat: {
    alignItems: 'center',
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
    gap: 8,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  dismissButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 8,
    zIndex: 10,
  },
});
