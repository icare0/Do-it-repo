import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  Animated,
  Pressable,
} from 'react-native';
import { useThemeStore } from '@/store/themeStore';
import { getTheme, spacing, borderRadius, typography } from '@/theme';
import { Ionicons } from '@expo/vector-icons';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  variant?: 'default' | 'filled' | 'outline';
  size?: 'small' | 'medium' | 'large';
  clearable?: boolean;
  onClear?: () => void;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  containerStyle,
  variant = 'filled',
  size = 'medium',
  clearable = false,
  onClear,
  style,
  value,
  ...props
}) => {
  const { colorScheme } = useThemeStore();
  const theme = getTheme(colorScheme);
  const [isFocused, setIsFocused] = useState(false);
  const [animatedValue] = useState(new Animated.Value(0));

  const heightMap = {
    small: 44,
    medium: 50,
    large: 56,
  };

  const fontSizeMap = {
    small: 15,
    medium: 17,
    large: 18,
  };

  React.useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: isFocused ? 1 : 0,
      useNativeDriver: false,
      tension: 100,
      friction: 10,
    }).start();
  }, [isFocused]);

  const getBackgroundColor = () => {
    if (variant === 'filled') {
      return theme.colors.backgroundSecondary;
    }
    if (variant === 'outline') {
      return 'transparent';
    }
    return theme.colors.backgroundSecondary;
  };

  const getBorderColor = () => {
    if (error) return theme.colors.error;
    if (isFocused) return theme.colors.primary;
    if (variant === 'outline') return theme.colors.border;
    return 'transparent';
  };

  const getBorderWidth = () => {
    if (variant === 'outline') return 1;
    if (isFocused || error) return 2;
    return 0;
  };

  const showClearButton = clearable && value && value.length > 0;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: theme.colors.text }]}>
          {label}
        </Text>
      )}
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: getBackgroundColor(),
            borderColor: getBorderColor(),
            borderWidth: getBorderWidth(),
            height: heightMap[size],
            borderRadius: borderRadius.md,
          },
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <TextInput
          {...props}
          value={value}
          style={[
            styles.input,
            {
              color: theme.colors.text,
              fontSize: fontSizeMap[size],
              paddingLeft: leftIcon ? 0 : spacing.md,
              paddingRight: (showClearButton || rightIcon) ? 0 : spacing.md,
            },
            style,
          ]}
          placeholderTextColor={theme.colors.textTertiary}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
        />
        {showClearButton && (
          <Pressable
            onPress={onClear}
            style={styles.clearButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <View
              style={[
                styles.clearButtonInner,
                { backgroundColor: theme.colors.textTertiary },
              ]}
            >
              <Ionicons
                name="close"
                size={12}
                color={theme.colors.surface}
              />
            </View>
          </Pressable>
        )}
        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>
      {(error || helperText) && (
        <Text
          style={[
            styles.helperText,
            {
              color: error ? theme.colors.error : theme.colors.textSecondary,
            },
          ]}
        >
          {error || helperText}
        </Text>
      )}
    </View>
  );
};

// Search Input variant
interface SearchInputProps extends Omit<InputProps, 'leftIcon' | 'variant'> {
  onSearch?: (text: string) => void;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  onSearch,
  onClear,
  value,
  ...props
}) => {
  const { colorScheme } = useThemeStore();
  const theme = getTheme(colorScheme);

  return (
    <Input
      {...props}
      value={value}
      variant="filled"
      leftIcon={
        <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
      }
      clearable
      onClear={onClear}
      placeholder="Rechercher..."
    />
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: spacing.sm,
    letterSpacing: -0.24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  input: {
    flex: 1,
    height: '100%',
    fontWeight: '400',
    letterSpacing: -0.41,
  },
  leftIcon: {
    marginRight: spacing.sm,
  },
  rightIcon: {
    marginLeft: spacing.sm,
  },
  clearButton: {
    marginLeft: spacing.sm,
    padding: 4,
  },
  clearButtonInner: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helperText: {
    fontSize: 13,
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
    letterSpacing: -0.08,
  },
});
