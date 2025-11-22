import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { useThemeStore } from '@/store/themeStore';
import { getTheme } from '@/theme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 20, borderRadius = 8, style }: SkeletonProps) {
  const { colorScheme } = useThemeStore();
  const theme = getTheme(colorScheme);
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const opacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          backgroundColor: theme.colors.border,
          opacity,
        },
        style,
      ]}
    />
  );
}

interface SkeletonTextProps {
  lines?: number;
  lineHeight?: number;
  spacing?: number;
  lastLineWidth?: string;
}

export function SkeletonText({ lines = 3, lineHeight = 16, spacing = 8, lastLineWidth = '60%' }: SkeletonTextProps) {
  return (
    <View style={{ gap: spacing }}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          height={lineHeight}
          width={index === lines - 1 ? lastLineWidth : '100%'}
        />
      ))}
    </View>
  );
}

interface SkeletonTaskCardProps {
  showCheckbox?: boolean;
  showBadge?: boolean;
}

export function SkeletonTaskCard({ showCheckbox = true, showBadge = true }: SkeletonTaskCardProps) {
  const { colorScheme } = useThemeStore();
  const theme = getTheme(colorScheme);

  return (
    <View style={[styles.taskCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <View style={styles.taskContent}>
        {showCheckbox && <Skeleton width={24} height={24} borderRadius={12} />}
        <View style={styles.taskInfo}>
          <Skeleton height={18} width="70%" style={{ marginBottom: 8 }} />
          <View style={styles.taskMeta}>
            <Skeleton height={14} width={60} />
            {showBadge && <Skeleton height={20} width={80} borderRadius={10} />}
          </View>
        </View>
      </View>
    </View>
  );
}

export function SkeletonCalendarDay() {
  return (
    <View style={styles.calendarDay}>
      <Skeleton width={32} height={32} borderRadius={16} />
      <Skeleton width={24} height={8} style={{ marginTop: 4 }} />
    </View>
  );
}

export function SkeletonNotification() {
  const { colorScheme } = useThemeStore();
  const theme = getTheme(colorScheme);

  return (
    <View style={[styles.notification, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <Skeleton width={44} height={44} borderRadius={22} />
      <View style={styles.notificationContent}>
        <Skeleton height={16} width="80%" style={{ marginBottom: 6 }} />
        <Skeleton height={14} width="100%" />
        <Skeleton height={12} width={80} style={{ marginTop: 8 }} />
      </View>
    </View>
  );
}

export function SkeletonList({ count = 5, component: Component = SkeletonTaskCard }: { count?: number; component?: React.ComponentType }) {
  return (
    <View style={{ gap: 12 }}>
      {Array.from({ length: count }).map((_, index) => (
        <Component key={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
  taskCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  taskContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  taskInfo: {
    flex: 1,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  calendarDay: {
    alignItems: 'center',
    padding: 8,
  },
  notification: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  notificationContent: {
    flex: 1,
  },
});
