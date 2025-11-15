import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useThemeStore } from '@/store/themeStore';
import { getTheme } from '@/theme';

interface BadgeProps {
  label: string;
  variant?: 'default' | 'primary' | 'success' | 'error' | 'warning';
  size?: 'small' | 'medium';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'default',
  size = 'medium',
  style,
  textStyle,
}) => {
  const { colorScheme } = useThemeStore();
  const theme = getTheme(colorScheme);

  const getColors = () => {
    switch (variant) {
      case 'primary':
        return {
          bg: theme.colors.infoLight,
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
      default:
        return {
          bg: theme.colors.backgroundTertiary,
          text: theme.colors.textSecondary,
        };
    }
  };

  const colors = getColors();
  const fontSize = size === 'small' ? 12 : 14;
  const padding = size === 'small' ? 6 : 8;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: colors.bg,
          paddingHorizontal: padding * 1.5,
          paddingVertical: padding / 2,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: colors.text,
            fontSize,
          },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '600',
  },
});
