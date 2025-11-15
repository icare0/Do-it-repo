import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/store/themeStore';
import { getTheme } from '@/theme';

interface CheckboxProps {
  checked: boolean;
  onPress: () => void;
  disabled?: boolean;
  size?: number;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onPress,
  disabled = false,
  size = 24,
}) => {
  const { colorScheme } = useThemeStore();
  const theme = getTheme(colorScheme);

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={[
        styles.checkbox,
        {
          width: size,
          height: size,
          borderRadius: size / 3,
          borderColor: checked ? theme.colors.primary : theme.colors.border,
          backgroundColor: checked ? theme.colors.primary : 'transparent',
          borderWidth: checked ? 0 : 2,
          opacity: disabled ? 0.5 : 1,
        },
      ]}
    >
      {checked && (
        <Ionicons name="checkmark" size={size * 0.7} color="#fff" />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  checkbox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
