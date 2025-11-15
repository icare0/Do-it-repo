export const colors = {
  light: {
    primary: '#3B82F6', // blue-500
    primaryDark: '#2563EB', // blue-600
    primaryLight: '#60A5FA', // blue-400
    secondary: '#8B5CF6', // violet-500
    secondaryDark: '#7C3AED', // violet-600
    secondaryLight: '#A78BFA', // violet-400

    background: '#FFFFFF',
    backgroundSecondary: '#F9FAFB', // neutral-50
    backgroundTertiary: '#F3F4F6', // neutral-100

    surface: '#FFFFFF',
    surfaceSecondary: '#F9FAFB',

    text: '#171717', // neutral-900
    textSecondary: '#737373', // neutral-500
    textTertiary: '#A3A3A3', // neutral-400
    textInverse: '#FFFFFF',

    border: '#E5E5E5', // neutral-200
    borderLight: '#F5F5F5', // neutral-100

    success: '#10B981', // green-500
    successLight: '#D1FAE5', // green-100
    error: '#EF4444', // red-500
    errorLight: '#FEE2E2', // red-100
    warning: '#F59E0B', // amber-500
    warningLight: '#FEF3C7', // amber-100
    info: '#3B82F6', // blue-500
    infoLight: '#DBEAFE', // blue-100

    gradient: {
      primary: ['#3B82F6', '#8B5CF6'],
      secondary: ['#8B5CF6', '#EC4899'],
      tertiary: ['#10B981', '#3B82F6'],
    },
  },

  dark: {
    primary: '#60A5FA', // blue-400
    primaryDark: '#3B82F6', // blue-500
    primaryLight: '#93C5FD', // blue-300
    secondary: '#A78BFA', // violet-400
    secondaryDark: '#8B5CF6', // violet-500
    secondaryLight: '#C4B5FD', // violet-300

    background: '#0A0A0A', // neutral-950
    backgroundSecondary: '#171717', // neutral-900
    backgroundTertiary: '#262626', // neutral-800

    surface: '#171717',
    surfaceSecondary: '#262626',

    text: '#FAFAFA', // neutral-50
    textSecondary: '#A3A3A3', // neutral-400
    textTertiary: '#737373', // neutral-500
    textInverse: '#0A0A0A',

    border: '#404040', // neutral-700
    borderLight: '#525252', // neutral-600

    success: '#34D399', // green-400
    successLight: '#064E3B', // green-900
    error: '#F87171', // red-400
    errorLight: '#7F1D1D', // red-900
    warning: '#FBBF24', // amber-400
    warningLight: '#78350F', // amber-900
    info: '#60A5FA', // blue-400
    infoLight: '#1E3A8A', // blue-900

    gradient: {
      primary: ['#3B82F6', '#8B5CF6'],
      secondary: ['#8B5CF6', '#EC4899'],
      tertiary: ['#10B981', '#3B82F6'],
    },
  },
};

export type ColorScheme = 'light' | 'dark';
export type ThemeColors = typeof colors.light;
