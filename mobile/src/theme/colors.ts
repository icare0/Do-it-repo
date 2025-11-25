// Apple-inspired Design System Colors
// Based on SF Symbols and iOS Human Interface Guidelines

export const colors = {
  light: {
    // Primary - Blue (iOS System Blue)
    primary: '#007AFF',
    primaryDark: '#0051D5',
    primaryLight: '#4DA2FF',
    primarySoft: '#E5F1FF',

    // Secondary - Purple (iOS System Purple)
    secondary: '#AF52DE',
    secondaryDark: '#8E3CC4',
    secondaryLight: '#C77EE8',
    secondarySoft: '#F5E9FF',

    // Accent colors (iOS System Colors)
    pink: '#FF2D55',
    pinkSoft: '#FFE5EC',
    teal: '#5AC8FA',
    tealSoft: '#E5F7FF',
    green: '#34C759',
    greenSoft: '#E5F9ED',
    yellow: '#FFCC00',
    yellowSoft: '#FFF8E5',
    orange: '#FF9500',
    orangeSoft: '#FFF3E5',
    red: '#FF3B30',
    redSoft: '#FFE5E5',
    indigo: '#5856D6',
    indigoSoft: '#EEEEFF',

    // Backgrounds (Apple layered UI)
    background: '#F5F5F7', // Apple's light background
    backgroundElevated: '#FFFFFF',
    backgroundSecondary: '#EFEFF4',
    backgroundTertiary: '#E5E5EA',

    // Glass morphism
    glass: 'rgba(255, 255, 255, 0.7)',
    glassSecondary: 'rgba(255, 255, 255, 0.5)',

    // Surface (Cards)
    surface: '#FFFFFF',
    surfaceSecondary: '#F9F9FB',
    surfaceElevated: '#FFFFFF',

    // Text (SF Pro)
    text: '#1D1D1F', // Apple's dark text
    textSecondary: '#6E6E73', // Apple's secondary text
    textTertiary: '#86868B', // Apple's tertiary text
    textQuaternary: '#C6C6C8',
    textInverse: '#FFFFFF',
    textOnColor: '#FFFFFF',

    // Borders
    border: '#D1D1D6',
    borderLight: '#E5E5EA',
    borderSecondary: '#C6C6C8',
    divider: '#E5E5EA',

    // Status colors (iOS semantic colors)
    success: '#34C759',
    successLight: '#E5F9ED',
    error: '#FF3B30',
    errorLight: '#FFE5E5',
    warning: '#FF9500',
    warningLight: '#FFF3E5',
    info: '#007AFF',
    infoLight: '#E5F1FF',

    // Category colors (colorful and soft)
    categories: {
      work: '#5856D6',
      workSoft: '#EEEEFF',
      personal: '#FF2D55',
      personalSoft: '#FFE5EC',
      shopping: '#FF9500',
      shoppingSoft: '#FFF3E5',
      health: '#34C759',
      healthSoft: '#E5F9ED',
      finance: '#5AC8FA',
      financeSoft: '#E5F7FF',
      learning: '#AF52DE',
      learningSoft: '#F5E9FF',
      social: '#FFCC00',
      socialSoft: '#FFF8E5',
      travel: '#007AFF',
      travelSoft: '#E5F1FF',
    },

    // Priority colors
    priority: {
      high: '#FF3B30',
      highSoft: '#FFE5E5',
      medium: '#FF9500',
      mediumSoft: '#FFF3E5',
      low: '#5AC8FA',
      lowSoft: '#E5F7FF',
    },

    // Gradients (Apple-style soft gradients)
    gradient: {
      primary: ['#007AFF', '#5856D6'],
      secondary: ['#AF52DE', '#FF2D55'],
      sunrise: ['#FF9500', '#FF3B30'],
      ocean: ['#5AC8FA', '#007AFF'],
      forest: ['#34C759', '#5AC8FA'],
      sunset: ['#FF9500', '#AF52DE'],
      midnight: ['#5856D6', '#1D1D1F'],
    },

    // Special effects
    overlay: 'rgba(0, 0, 0, 0.4)',
    overlayLight: 'rgba(0, 0, 0, 0.2)',
    overlayStrong: 'rgba(0, 0, 0, 0.6)',
    shimmer: 'rgba(255, 255, 255, 0.6)',

    // Shadows
    shadowColor: 'rgba(0, 0, 0, 0.1)',
  },

  dark: {
    // Primary - Blue (iOS System Blue Dark)
    primary: '#0A84FF',
    primaryDark: '#0069D9',
    primaryLight: '#409CFF',
    primarySoft: '#1A2F4D',

    // Secondary - Purple (iOS System Purple Dark)
    secondary: '#BF5AF2',
    secondaryDark: '#A640D9',
    secondaryLight: '#CF74F5',
    secondarySoft: '#2D1F3D',

    // Accent colors (iOS System Colors Dark Mode)
    pink: '#FF375F',
    pinkSoft: '#3D1F26',
    teal: '#64D2FF',
    tealSoft: '#1F2D3D',
    green: '#30D158',
    greenSoft: '#1F3D26',
    yellow: '#FFD60A',
    yellowSoft: '#3D3320',
    orange: '#FF9F0A',
    orangeSoft: '#3D2A1F',
    red: '#FF453A',
    redSoft: '#3D1F1F',
    indigo: '#5E5CE6',
    indigoSoft: '#26263D',

    // Backgrounds (Apple dark mode)
    background: '#000000', // Pure black for OLED
    backgroundElevated: '#1C1C1E',
    backgroundSecondary: '#1C1C1E',
    backgroundTertiary: '#2C2C2E',

    // Glass morphism
    glass: 'rgba(28, 28, 30, 0.7)',
    glassSecondary: 'rgba(28, 28, 30, 0.5)',

    // Surface (Cards)
    surface: '#1C1C1E',
    surfaceSecondary: '#2C2C2E',
    surfaceElevated: '#2C2C2E',

    // Text (SF Pro Dark)
    text: '#FFFFFF',
    textSecondary: '#98989D',
    textTertiary: '#636366',
    textQuaternary: '#48484A',
    textInverse: '#1D1D1F',
    textOnColor: '#FFFFFF',

    // Borders
    border: '#38383A',
    borderLight: '#48484A',
    borderSecondary: '#3A3A3C',
    divider: '#38383A',

    // Status colors (iOS semantic colors dark)
    success: '#30D158',
    successLight: '#1F3D26',
    error: '#FF453A',
    errorLight: '#3D1F1F',
    warning: '#FF9F0A',
    warningLight: '#3D2A1F',
    info: '#0A84FF',
    infoLight: '#1A2F4D',

    // Category colors (vibrant for dark mode)
    categories: {
      work: '#5E5CE6',
      workSoft: '#26263D',
      personal: '#FF375F',
      personalSoft: '#3D1F26',
      shopping: '#FF9F0A',
      shoppingSoft: '#3D2A1F',
      health: '#30D158',
      healthSoft: '#1F3D26',
      finance: '#64D2FF',
      financeSoft: '#1F2D3D',
      learning: '#BF5AF2',
      learningSoft: '#2D1F3D',
      social: '#FFD60A',
      socialSoft: '#3D3320',
      travel: '#0A84FF',
      travelSoft: '#1A2F4D',
    },

    // Priority colors
    priority: {
      high: '#FF453A',
      highSoft: '#3D1F1F',
      medium: '#FF9F0A',
      mediumSoft: '#3D2A1F',
      low: '#64D2FF',
      lowSoft: '#1F2D3D',
    },

    // Gradients (vibrant for dark mode)
    gradient: {
      primary: ['#0A84FF', '#5E5CE6'],
      secondary: ['#BF5AF2', '#FF375F'],
      sunrise: ['#FF9F0A', '#FF453A'],
      ocean: ['#64D2FF', '#0A84FF'],
      forest: ['#30D158', '#64D2FF'],
      sunset: ['#FF9F0A', '#BF5AF2'],
      midnight: ['#5E5CE6', '#000000'],
    },

    // Special effects
    overlay: 'rgba(0, 0, 0, 0.7)',
    overlayLight: 'rgba(0, 0, 0, 0.5)',
    overlayStrong: 'rgba(0, 0, 0, 0.85)',
    shimmer: 'rgba(255, 255, 255, 0.1)',

    // Shadows
    shadowColor: 'rgba(0, 0, 0, 0.5)',
  },
};

export type ColorScheme = 'light' | 'dark';
export type ThemeColors = typeof colors.light;

// Helper function to get category color
export const getCategoryColor = (category: string, scheme: ColorScheme = 'light') => {
  const categoryKey = category.toLowerCase() as keyof typeof colors.light.categories;
  return colors[scheme].categories[categoryKey] || colors[scheme].primary;
};

// Helper function to get category soft color
export const getCategorySoftColor = (category: string, scheme: ColorScheme = 'light') => {
  const categoryKey = `${category.toLowerCase()}Soft` as keyof typeof colors.light.categories;
  return colors[scheme].categories[categoryKey] || colors[scheme].primarySoft;
};

// Helper function to get priority color
export const getPriorityColor = (priority: 'low' | 'medium' | 'high', scheme: ColorScheme = 'light') => {
  return colors[scheme].priority[priority];
};

// Helper function to get priority soft color
export const getPrioritySoftColor = (priority: 'low' | 'medium' | 'high', scheme: ColorScheme = 'light') => {
  const key = `${priority}Soft` as keyof typeof colors.light.priority;
  return colors[scheme].priority[key];
};
