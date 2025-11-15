import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { useThemeStore } from '@/store/themeStore';
import { getTheme } from '@/theme';

interface IconButtonProps {
  icon: React.ReactNode;
  onPress: () => void;
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'filled' | 'outline';
  disabled?: boolean;
  style?: ViewStyle;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onPress,
  size = 'medium',
  variant = 'default',
  disabled = false,
  style,
}) => {
  const { colorScheme } = useThemeStore();
  const theme = getTheme(colorScheme);

  const sizeMap = {
    small: 32,
    medium: 40,
    large: 48,
  };

  const buttonSize = sizeMap[size];

  const buttonStyle: ViewStyle = {
    width: buttonSize,
    height: buttonSize,
    borderRadius: buttonSize / 2,
    backgroundColor:
      variant === 'filled'
        ? theme.colors.primary
        : variant === 'outline'
        ? 'transparent'
        : theme.colors.backgroundSecondary,
    borderWidth: variant === 'outline' ? 1 : 0,
    borderColor: theme.colors.border,
    opacity: disabled ? 0.5 : 1,
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={[styles.button, buttonStyle, style]}
    >
      {icon}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
