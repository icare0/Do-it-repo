import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { format, startOfYear, endOfYear, eachDayOfInterval, getDay, differenceInWeeks, startOfWeek } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useThemeStore } from '@/store/themeStore';
import { getTheme } from '@/theme';

interface HeatmapData {
  date: string; // YYYY-MM-DD
  count: number;
}

interface HeatmapProps {
  data: HeatmapData[];
  year?: number;
  onDayPress?: (date: string, count: number) => void;
}

const CELL_SIZE = 12;
const CELL_GAP = 3;
const DAYS_IN_WEEK = 7;

export function Heatmap({ data, year = new Date().getFullYear(), onDayPress }: HeatmapProps) {
  const { colorScheme } = useThemeStore();
  const theme = getTheme(colorScheme);

  const dataMap = useMemo(() => {
    const map = new Map<string, number>();
    data.forEach((d) => map.set(d.date, d.count));
    return map;
  }, [data]);

  const yearStart = startOfYear(new Date(year, 0, 1));
  const yearEnd = endOfYear(new Date(year, 0, 1));
  const firstDayOfYear = startOfWeek(yearStart, { weekStartsOn: 1 });

  const allDays = eachDayOfInterval({ start: firstDayOfYear, end: yearEnd });
  const weeks = useMemo(() => {
    const weekGroups: Date[][] = [];
    let currentWeek: Date[] = [];

    allDays.forEach((day) => {
      const dayOfWeek = getDay(day);
      const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday = 0

      if (adjustedDay === 0 && currentWeek.length > 0) {
        weekGroups.push(currentWeek);
        currentWeek = [];
      }

      currentWeek.push(day);
    });

    if (currentWeek.length > 0) {
      weekGroups.push(currentWeek);
    }

    return weekGroups;
  }, [allDays]);

  const maxCount = useMemo(() => {
    return Math.max(1, ...data.map((d) => d.count));
  }, [data]);

  const getColor = (count: number): string => {
    if (count === 0) {
      return colorScheme === 'dark' ? '#1F1F1F' : '#EBEDF0';
    }

    const intensity = Math.min(count / maxCount, 1);
    const colors = colorScheme === 'dark'
      ? ['#0E4429', '#006D32', '#26A641', '#39D353'] // Dark mode greens
      : ['#9BE9A8', '#40C463', '#30A14E', '#216E39']; // Light mode greens

    const index = Math.floor(intensity * (colors.length - 1));
    return colors[index];
  };

  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
  const days = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  const totalTasks = useMemo(() => {
    return data.reduce((sum, d) => sum + d.count, 0);
  }, [data]);

  const activeDays = useMemo(() => {
    return data.filter((d) => d.count > 0).length;
  }, [data]);

  return (
    <View style={styles.container}>
      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: theme.colors.primary }]}>{totalTasks}</Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>tâches</Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: theme.colors.success }]}>{activeDays}</Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>jours actifs</Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: theme.colors.secondary }]}>
            {activeDays > 0 ? Math.round(totalTasks / activeDays * 10) / 10 : 0}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>moyenne/jour</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.heatmapContainer}>
          {/* Month labels */}
          <View style={styles.monthLabels}>
            <View style={{ width: 20 }} />
            {months.map((month, index) => (
              <Text
                key={month}
                style={[
                  styles.monthLabel,
                  { color: theme.colors.textSecondary },
                  { left: index * 4.3 * (CELL_SIZE + CELL_GAP) },
                ]}
              >
                {month}
              </Text>
            ))}
          </View>

          <View style={styles.gridContainer}>
            {/* Day labels */}
            <View style={styles.dayLabels}>
              {days.map((day, index) => (
                <Text
                  key={index}
                  style={[
                    styles.dayLabel,
                    { color: theme.colors.textSecondary },
                    { height: CELL_SIZE + CELL_GAP },
                  ]}
                >
                  {index % 2 === 0 ? day : ''}
                </Text>
              ))}
            </View>

            {/* Grid */}
            <View style={styles.grid}>
              {weeks.map((week, weekIndex) => (
                <View key={weekIndex} style={styles.week}>
                  {Array.from({ length: DAYS_IN_WEEK }).map((_, dayIndex) => {
                    const day = week[dayIndex];
                    if (!day || day < yearStart) {
                      return (
                        <View
                          key={dayIndex}
                          style={[
                            styles.cell,
                            { width: CELL_SIZE, height: CELL_SIZE, backgroundColor: 'transparent' },
                          ]}
                        />
                      );
                    }

                    const dateStr = format(day, 'yyyy-MM-dd');
                    const count = dataMap.get(dateStr) || 0;
                    const isToday = dateStr === format(new Date(), 'yyyy-MM-dd');

                    return (
                      <View
                        key={dayIndex}
                        style={[
                          styles.cell,
                          {
                            width: CELL_SIZE,
                            height: CELL_SIZE,
                            backgroundColor: getColor(count),
                            borderWidth: isToday ? 1 : 0,
                            borderColor: theme.colors.primary,
                          },
                        ]}
                        onTouchEnd={() => onDayPress?.(dateStr, count)}
                      />
                    );
                  })}
                </View>
              ))}
            </View>
          </View>

          {/* Legend */}
          <View style={styles.legend}>
            <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>Moins</Text>
            {[0, 0.25, 0.5, 0.75, 1].map((intensity, index) => (
              <View
                key={index}
                style={[
                  styles.legendCell,
                  {
                    backgroundColor: getColor(intensity * maxCount),
                  },
                ]}
              />
            ))}
            <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>Plus</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  heatmapContainer: {
    paddingVertical: 8,
  },
  monthLabels: {
    flexDirection: 'row',
    position: 'relative',
    height: 20,
    marginBottom: 4,
  },
  monthLabel: {
    fontSize: 10,
    position: 'absolute',
  },
  gridContainer: {
    flexDirection: 'row',
  },
  dayLabels: {
    marginRight: 4,
  },
  dayLabel: {
    fontSize: 9,
    textAlign: 'right',
    paddingRight: 4,
    lineHeight: CELL_SIZE + CELL_GAP,
  },
  grid: {
    flexDirection: 'row',
  },
  week: {
    flexDirection: 'column',
    marginRight: CELL_GAP,
  },
  cell: {
    borderRadius: 2,
    marginBottom: CELL_GAP,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 4,
  },
  legendText: {
    fontSize: 10,
    marginHorizontal: 4,
  },
  legendCell: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
});
