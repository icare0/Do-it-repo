import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  StyleProp,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { useThemeStore } from '@/store/themeStore';
import { getTheme, spacing, borderRadius, shadows } from '@/theme';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  onLongPress?: () => void;
  variant?: 'default' | 'elevated' | 'glass' | 'gradient' | 'flat';
  padding?: keyof typeof spacing;
  borderRadiusSize?: keyof typeof borderRadius;
  disabled?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  onLongPress,
  variant = 'elevated',
  padding = 'lg',
  borderRadiusSize = 'xl',
  disabled = false,
}) => {
  const { colorScheme } = useThemeStore();
  const theme = getTheme(colorScheme);

  const cardBaseStyle: ViewStyle = {
    borderRadius: borderRadius[borderRadiusSize],
    padding: spacing[padding],
    overflow: 'hidden',
  };

  const getCardStyle = (): ViewStyle => {
    switch (variant) {
      case 'elevated':
        return {
          ...cardBaseStyle,
          backgroundColor: theme.colors.surface,
          ...shadows.md,
        };
      case 'glass':
        return {
          ...cardBaseStyle,
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: theme.colors.borderLight,
        };
      case 'gradient':
        return {
          ...cardBaseStyle,
          backgroundColor: 'transparent',
        };
      case 'flat':
        return {
          ...cardBaseStyle,
          backgroundColor: theme.colors.surfaceSecondary,
        };
      case 'default':
      default:
        return {
          ...cardBaseStyle,
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
        };
    }
  };

  const renderContent = () => {
    if (variant === 'glass') {
      return (
        <>
          <BlurView
            intensity={colorScheme === 'dark' ? 20 : 40}
            tint={colorScheme}
            style={StyleSheet.absoluteFill}
          />
          <View style={{ zIndex: 1 }}>
            {children}
          </View>
        </>
      );
    }

    if (variant === 'gradient') {
      return (
        <>
          <LinearGradient
            colors={
              colorScheme === 'dark'
                ? ['rgba(28, 28, 30, 0.9)', 'rgba(44, 44, 46, 0.9)']
                : ['rgba(255, 255, 255, 0.9)', 'rgba(249, 249, 251, 0.9)']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFill, { borderRadius: borderRadius[borderRadiusSize] }]}
          />
          <View style={{ zIndex: 1 }}>
            {children}
          </View>
        </>
      );
    }

    return children;
  };

  if (onPress || onLongPress) {
    return (
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        disabled={disabled}
        style={({ pressed }) => [
          getCardStyle(),
          {
            opacity: pressed ? 0.8 : 1,
            transform: pressed ? [{ scale: 0.98 }] : [{ scale: 1 }],
          },
          style,
        ]}
      >
        {renderContent()}
      </Pressable>
    );
  }

  return (
    <View style={[getCardStyle(), style]}>
      {renderContent()}
    </View>
  );
};

// Specialized Cards for common use cases

interface SectionCardProps {
  children: React.ReactNode;
  title?: string;
  style?: StyleProp<ViewStyle>;
}

export const SectionCard: React.FC<SectionCardProps> = ({
  children,
  title,
  style,
}) => {
  const { colorScheme } = useThemeStore();
  const theme = getTheme(colorScheme);

  return (
    <View style={[styles.sectionCard, style]}>
      {title && (
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
            {title.toUpperCase()}
          </Text>
        </View>
      )}
      <Card variant="elevated" padding="md" borderRadiusSize="lg">
        {children}
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionCard: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
