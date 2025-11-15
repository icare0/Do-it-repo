import { colors, ColorScheme, ThemeColors } from './colors';
import { spacing, borderRadius, shadows } from './spacing';
import { typography } from './typography';

export interface Theme {
  colors: ThemeColors;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  shadows: typeof shadows;
  typography: typeof typography;
}

export const lightTheme: Theme = {
  colors: colors.light,
  spacing,
  borderRadius,
  shadows,
  typography,
};

export const darkTheme: Theme = {
  colors: colors.dark,
  spacing,
  borderRadius,
  shadows,
  typography,
};

export const getTheme = (colorScheme: ColorScheme): Theme => {
  return colorScheme === 'dark' ? darkTheme : lightTheme;
};

export * from './colors';
export * from './spacing';
export * from './typography';
