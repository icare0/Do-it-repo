import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore } from '@/store/themeStore';
import { getTheme, spacing, borderRadius, iconSizes, hitSlop } from '@/theme';
import { BlurView } from 'expo-blur';

interface ButtonProps {
  title?: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'tinted' | 'glass';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
  hapticFeedback?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  hapticFeedback = true,
}) => {
  const { colorScheme } = useThemeStore();
  const theme = getTheme(colorScheme);

  const heightMap = {
    small: 40,
    medium: 50,
    large: 56,
  };

  const paddingMap = {
    small: spacing.md,
    medium: spacing.xl,
    large: spacing.xxl,
  };

  const fontSizeMap = {
    small: 15,
    medium: 17,
    large: 18,
  };

  const borderRadiusMap = {
    small: borderRadius.md,
    medium: borderRadius.lg,
    large: borderRadius.xl,
  };

  const getTextColor = (): string => {
    if (disabled) return theme.colors.textTertiary;
    switch (variant) {
      case 'primary':
      case 'destructive':
        return theme.colors.textOnColor;
      case 'outline':
      case 'ghost':
        return theme.colors.primary;
      case 'tinted':
        return theme.colors.primary;
      case 'glass':
        return theme.colors.text;
      case 'secondary':
      default:
        return theme.colors.text;
    }
  };

  const getBackgroundColor = (): string => {
    if (disabled) return theme.colors.backgroundTertiary;
    switch (variant) {
      case 'primary':
        return theme.colors.primary;
      case 'secondary':
        return theme.colors.surfaceSecondary;
      case 'destructive':
        return theme.colors.error;
      case 'tinted':
        return theme.colors.primarySoft;
      case 'outline':
      case 'ghost':
      case 'glass':
        return 'transparent';
      default:
        return theme.colors.primary;
    }
  };

  const getBorderColor = (): string => {
    if (variant === 'outline') {
      return disabled ? theme.colors.border : theme.colors.primary;
    }
    if (variant === 'glass') {
      return theme.colors.borderLight;
    }
    return 'transparent';
  };

  const isGradient = variant === 'primary' && !disabled;

  const buttonStyle: ViewStyle = {
    height: heightMap[size],
    paddingHorizontal: icon && !title ? heightMap[size] / 2 : paddingMap[size],
    borderRadius: borderRadiusMap[size],
    borderWidth: variant === 'outline' || variant === 'glass' ? 1 : 0,
    borderColor: getBorderColor(),
    backgroundColor: isGradient ? 'transparent' : getBackgroundColor(),
    opacity: disabled ? 0.5 : 1,
    width: fullWidth ? '100%' : undefined,
    minWidth: icon && !title ? heightMap[size] : undefined,
    overflow: 'hidden',
  };

  const renderContent = () => (
    <>
      {loading ? (
        <ActivityIndicator
          color={getTextColor()}
          size={size === 'small' ? 'small' : 'small'}
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <View style={{ marginRight: title ? spacing.sm : 0 }}>
              {icon}
            </View>
          )}
          {title && (
            <Text
              style={[
                styles.text,
                {
                  fontSize: fontSizeMap[size],
                  color: getTextColor(),
                },
                textStyle,
              ]}
            >
              {title}
            </Text>
          )}
          {icon && iconPosition === 'right' && (
            <View style={{ marginLeft: title ? spacing.sm : 0 }}>
              {icon}
            </View>
          )}
        </>
      )}
    </>
  );

  if (variant === 'glass' && !disabled) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.6}
        style={[styles.button, buttonStyle, style]}
        hitSlop={hitSlop.sm}
      >
        <BlurView
          intensity={colorScheme === 'dark' ? 20 : 40}
          tint={colorScheme}
          style={[StyleSheet.absoluteFill, { borderRadius: borderRadiusMap[size] }]}
        />
        <View style={styles.buttonContent}>
          {renderContent()}
        </View>
      </TouchableOpacity>
    );
  }

  if (isGradient) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        style={[styles.button, buttonStyle, style]}
        hitSlop={hitSlop.sm}
      >
        <LinearGradient
          colors={theme.colors.gradient.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[StyleSheet.absoluteFill, { borderRadius: borderRadiusMap[size] }]}
        />
        <View style={styles.buttonContent}>
          {renderContent()}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.6}
      style={[styles.button, buttonStyle, style]}
      hitSlop={hitSlop.sm}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
    letterSpacing: -0.41,
  },
});
