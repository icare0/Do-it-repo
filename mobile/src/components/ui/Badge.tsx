import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useThemeStore } from '@/store/themeStore';
import { getTheme, getCategoryColor, getCategorySoftColor, getPriorityColor, getPrioritySoftColor, spacing, borderRadius } from '@/theme';
import { Ionicons } from '@expo/vector-icons';

interface BadgeProps {
  label: string;
  variant?: 'default' | 'primary' | 'success' | 'error' | 'warning' | 'info';
  category?: 'work' | 'personal' | 'shopping' | 'health' | 'finance' | 'learning' | 'social' | 'travel';
  priority?: 'low' | 'medium' | 'high';
  size?: 'small' | 'medium' | 'large';
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
  textStyle?: TextStyle;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'default',
  category,
  priority,
  size = 'medium',
  icon,
  style,
  textStyle,
  dot = false,
}) => {
  const { colorScheme } = useThemeStore();
  const theme = getTheme(colorScheme);

  const getColors = (): { bg: string; text: string } => {
    // Priority takes precedence
    if (priority) {
      return {
        bg: getPrioritySoftColor(priority, colorScheme),
        text: getPriorityColor(priority, colorScheme),
      };
    }

    // Then category
    if (category) {
      return {
        bg: getCategorySoftColor(category, colorScheme),
        text: getCategoryColor(category, colorScheme),
      };
    }

    // Then variant
    switch (variant) {
      case 'primary':
        return {
          bg: theme.colors.primarySoft,
          text: theme.colors.primary,
        };
      case 'success':
        return {
          bg: theme.colors.successLight,
          text: theme.colors.success,
        };
      case 'error':
        return {
          bg: theme.colors.errorLight,
          text: theme.colors.error,
        };
      case 'warning':
        return {
          bg: theme.colors.warningLight,
          text: theme.colors.warning,
        };
      case 'info':
        return {
          bg: theme.colors.infoLight,
          text: theme.colors.info,
        };
      default:
        return {
          bg: theme.colors.backgroundTertiary,
          text: theme.colors.textSecondary,
        };
    }
  };

  const getSizes = () => {
    switch (size) {
      case 'small':
        return {
          fontSize: 11,
          paddingVertical: 3,
          paddingHorizontal: 8,
          borderRadius: borderRadius.sm,
          iconSize: 10,
        };
      case 'large':
        return {
          fontSize: 15,
          paddingVertical: 6,
          paddingHorizontal: 14,
          borderRadius: borderRadius.md,
          iconSize: 16,
        };
      case 'medium':
      default:
        return {
          fontSize: 13,
          paddingVertical: 4,
          paddingHorizontal: 10,
          borderRadius: borderRadius.sm,
          iconSize: 12,
        };
    }
  };

  const colors = getColors();
  const sizes = getSizes();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: colors.bg,
          paddingVertical: sizes.paddingVertical,
          paddingHorizontal: sizes.paddingHorizontal,
          borderRadius: sizes.borderRadius,
        },
        style,
      ]}
    >
      {dot && (
        <View
          style={[
            styles.dot,
            {
              backgroundColor: colors.text,
              width: sizes.iconSize - 2,
              height: sizes.iconSize - 2,
              borderRadius: (sizes.iconSize - 2) / 2,
              marginRight: spacing.xs,
            },
          ]}
        />
      )}
      {icon && !dot && (
        <Ionicons
          name={icon}
          size={sizes.iconSize}
          color={colors.text}
          style={{ marginRight: spacing.xs }}
        />
      )}
      <Text
        style={[
          styles.text,
          {
            color: colors.text,
            fontSize: sizes.fontSize,
          },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

// Category Badge - specialized for task categories
interface CategoryBadgeProps {
  category: 'work' | 'personal' | 'shopping' | 'health' | 'finance' | 'learning' | 'social' | 'travel';
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({
  category,
  size = 'medium',
  style,
}) => {
  const categoryIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
    work: 'briefcase',
    personal: 'person',
    shopping: 'cart',
    health: 'fitness',
    finance: 'cash',
    learning: 'school',
    social: 'people',
    travel: 'airplane',
  };

  const categoryLabels: Record<string, string> = {
    work: 'Travail',
    personal: 'Personnel',
    shopping: 'Courses',
    health: 'Santé',
    finance: 'Finance',
    learning: 'Formation',
    social: 'Social',
    travel: 'Voyage',
  };

  return (
    <Badge
      label={categoryLabels[category]}
      category={category}
      icon={categoryIcons[category]}
      size={size}
      style={style}
    />
  );
};

// Priority Badge
interface PriorityBadgeProps {
  priority: 'low' | 'medium' | 'high';
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  showLabel?: boolean;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  priority,
  size = 'medium',
  style,
  showLabel = true,
}) => {
  const priorityIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
    low: 'arrow-down',
    medium: 'remove',
    high: 'arrow-up',
  };

  const priorityLabels: Record<string, string> = {
    low: 'Faible',
    medium: 'Moyenne',
    high: 'Haute',
  };

  if (!showLabel) {
    return (
      <Badge
        label=""
        priority={priority}
        icon={priorityIcons[priority]}
        size={size}
        style={[{ paddingHorizontal: size === 'small' ? 6 : 8 }, style]}
      />
    );
  }

  return (
    <Badge
      label={priorityLabels[priority]}
      priority={priority}
      icon={priorityIcons[priority]}
      size={size}
      style={style}
    />
  );
};

// Status Badge
interface StatusBadgeProps {
  completed?: boolean;
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  completed = false,
  size = 'medium',
  style,
}) => {
  return (
    <Badge
      label={completed ? 'Terminée' : 'En cours'}
      variant={completed ? 'success' : 'info'}
      icon={completed ? 'checkmark-circle' : 'time'}
      size={size}
      style={style}
    />
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  dot: {
    alignSelf: 'center',
  },
});
