import { create } from 'zustand';
import { ColorScheme } from '@/theme';

interface ThemeState {
  colorScheme: ColorScheme;
  toggleTheme: () => void;
  setColorScheme: (scheme: ColorScheme) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  colorScheme: 'light',

  toggleTheme: () => set((state) => ({
    colorScheme: state.colorScheme === 'light' ? 'dark' : 'light'
  })),

  setColorScheme: (scheme) => set({ colorScheme: scheme }),
}));
