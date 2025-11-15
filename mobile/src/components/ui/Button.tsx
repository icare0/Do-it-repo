import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore } from '@/store/themeStore';
import { getTheme } from '@/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
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
  style,
  textStyle,
}) => {
  const { colorScheme } = useThemeStore();
  const theme = getTheme(colorScheme);

  const heightMap = {
    small: 40,
    medium: 48,
    large: 56,
  };

  const fontSizeMap = {
    small: 14,
    medium: 16,
    large: 18,
  };

  const isGradient = variant === 'primary';

  const buttonContent = (
    <>
      {loading ? (
        <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? theme.colors.primary : '#fff'} />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.text,
              {
                fontSize: fontSizeMap[size],
                color: getTextColor(),
                marginLeft: icon ? 8 : 0,
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </>
  );

  function getTextColor() {
    if (disabled) return theme.colors.textTertiary;
    switch (variant) {
      case 'primary':
        return '#FFFFFF';
      case 'outline':
      case 'ghost':
        return theme.colors.primary;
      default:
        return theme.colors.text;
    }
  }

  function getBackgroundColor() {
    if (disabled) return theme.colors.backgroundTertiary;
    switch (variant) {
      case 'secondary':
        return theme.colors.surfaceSecondary;
      case 'outline':
        return 'transparent';
      case 'ghost':
        return 'transparent';
      default:
        return theme.colors.primary;
    }
  }

  function getBorderColor() {
    if (variant === 'outline') {
      return disabled ? theme.colors.border : theme.colors.primary;
    }
    return 'transparent';
  }

  const buttonStyle: ViewStyle = {
    height: heightMap[size],
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    borderWidth: variant === 'outline' ? 1 : 0,
    borderColor: getBorderColor(),
    backgroundColor: isGradient ? 'transparent' : getBackgroundColor(),
    opacity: disabled ? 0.5 : 1,
    width: fullWidth ? '100%' : undefined,
    ...style,
  };

  if (isGradient && !disabled) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        style={[styles.button, buttonStyle]}
      >
        <LinearGradient
          colors={theme.colors.gradient.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[StyleSheet.absoluteFill, { borderRadius: theme.borderRadius.xl }]}
        />
        {buttonContent}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[styles.button, buttonStyle]}
    >
      {buttonContent}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
  },
});
