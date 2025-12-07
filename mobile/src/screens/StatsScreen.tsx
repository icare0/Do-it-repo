import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

import { Card } from '@/components/ui/Card';
import { useThemeStore } from '@/store/themeStore';
import { useUserStore } from '@/store/userStore';
import { useTaskStore } from '@/store/taskStore';
import { getTheme, spacing, borderRadius, typography, shadows } from '@/theme';

export default function StatsScreen() {
  const navigation = useNavigation();
  const { colorScheme } = useThemeStore();
  const theme = getTheme(colorScheme);
  const { points, level, streak, achievements } = useUserStore();
  const { tasks } = useTaskStore();

  const completedTasks = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const stats = [
    {
      icon: 'flame',
      label: 'Série actuelle',
      value: streak,
      unit: 'jours',
      color: theme.colors.orange,
      bgColor: theme.colors.orangeSoft,
    },
    {
      icon: 'star',
      label: 'Points totaux',
      value: points,
      unit: 'pts',
      color: theme.colors.warning,
      bgColor: theme.colors.warningLight,
    },
    {
      icon: 'trending-up',
      label: 'Niveau',
      value: level,
      unit: '',
      color: theme.colors.primary,
      bgColor: theme.colors.primaryLight,
    },
    {
      icon: 'checkmark-circle',
      label: 'Taux de complétion',
      value: completionRate,
      unit: '%',
      color: theme.colors.success,
      bgColor: theme.colors.successLight,
    },
  ];

  const recentAchievements = achievements?.slice(0, 5) || [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={28} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>Statistiques</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Streak Card - Featured */}
        <Card variant="elevated" padding="xl" borderRadiusSize="xxl" style={styles.featuredCard}>
          <LinearGradient
            colors={['#FF6B35', '#F7931E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientCard}
          >
            <View style={styles.streakIcon}>
              <Ionicons name="flame" size={48} color="#FFFFFF" />
            </View>
            <Text style={styles.streakValue}>{streak}</Text>
            <Text style={styles.streakLabel}>
              {streak > 1 ? 'jours consécutifs' : 'jour'}
            </Text>
            <Text style={styles.streakSubtext}>
              Continue comme ça ! 🚀
            </Text>
          </LinearGradient>
        </Card>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {stats.slice(1).map((stat, index) => (
            <Card
              key={index}
              variant="elevated"
              padding="lg"
              borderRadiusSize="xl"
              style={styles.statCard}
            >
              <View style={[styles.statIcon, { backgroundColor: stat.bgColor }]}>
                <Ionicons name={stat.icon as any} size={24} color={stat.color} />
              </View>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {stat.value}
                {stat.unit && <Text style={styles.statUnit}> {stat.unit}</Text>}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                {stat.label}
              </Text>
            </Card>
          ))}
        </View>

        {/* Progress Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
            PROGRESSION
          </Text>
          <Card variant="elevated" padding="lg" borderRadiusSize="lg">
            <View style={styles.progressRow}>
              <View style={styles.progressInfo}>
                <Text style={[styles.progressLabel, { color: theme.colors.text }]}>
                  Tâches complétées
                </Text>
                <Text style={[styles.progressValue, { color: theme.colors.textSecondary }]}>
                  {completedTasks} / {totalTasks}
                </Text>
              </View>
              <View style={[styles.progressCircle, { borderColor: theme.colors.borderLight }]}>
                <Text style={[styles.progressPercent, { color: theme.colors.primary }]}>
                  {completionRate}%
                </Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Achievements Section */}
        {recentAchievements.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
              SUCCÈS RÉCENTS
            </Text>
            {recentAchievements.map((achievement: any, index: number) => (
              <Card
                key={index}
                variant="flat"
                padding="md"
                borderRadiusSize="lg"
                style={styles.achievementCard}
              >
                <View style={[styles.achievementIcon, { backgroundColor: theme.colors.warningLight }]}>
                  <Ionicons name="trophy" size={20} color={theme.colors.warning} />
                </View>
                <View style={styles.achievementInfo}>
                  <Text style={[styles.achievementTitle, { color: theme.colors.text }]}>
                    {achievement.name}
                  </Text>
                  <Text style={[styles.achievementDesc, { color: theme.colors.textSecondary }]}>
                    {achievement.description}
                  </Text>
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* Motivational Message */}
        <Card
          variant="flat"
          padding="lg"
          borderRadiusSize="lg"
          style={[styles.motivationCard, { backgroundColor: theme.colors.primaryLight }]}
        >
          <Text style={[styles.motivationText, { color: theme.colors.primary }]}>
            💪 Vous êtes sur la bonne voie ! Continuez à accomplir vos objectifs quotidiens.
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.title1,
  },
  content: {
    padding: spacing.xl,
    paddingTop: spacing.md,
  },
  featuredCard: {
    marginBottom: spacing.xl,
    overflow: 'hidden',
  },
  gradientCard: {
    padding: spacing.xxl,
    alignItems: 'center',
    borderRadius: borderRadius.xxl,
  },
  streakIcon: {
    marginBottom: spacing.md,
  },
  streakValue: {
    fontSize: 72,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 80,
  },
  streakLabel: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: spacing.sm,
  },
  streakSubtext: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
    marginBottom: spacing.xl,
  },
  statCard: {
    width: '48%',
    marginHorizontal: '1%',
    marginBottom: spacing.md,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  statValue: {
    ...typography.title2,
    marginBottom: spacing.xxs,
  },
  statUnit: {
    fontSize: 16,
    fontWeight: '400',
  },
  statLabel: {
    ...typography.caption1,
  },
  section: {
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    ...typography.caption1Emphasized,
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressInfo: {
    flex: 1,
  },
  progressLabel: {
    ...typography.body,
    marginBottom: spacing.xxs,
  },
  progressValue: {
    ...typography.subheadline,
  },
  progressCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressPercent: {
    ...typography.headline,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  achievementIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    ...typography.bodyEmphasized,
    marginBottom: spacing.xxs,
  },
  achievementDesc: {
    ...typography.caption1,
  },
  motivationCard: {
    marginTop: spacing.md,
  },
  motivationText: {
    ...typography.subheadline,
    textAlign: 'center',
  },
});
