import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AppSettings {
  // Appearance
  colorScheme: 'light' | 'dark' | 'system';

  // Haptics
  hapticsEnabled: boolean;
  hapticIntensity: 'light' | 'medium' | 'strong';

  // Security
  biometricsEnabled: boolean;
  appLockEnabled: boolean;
  lockTimeout: number; // seconds, 0 = immediate

  // Voice
  voiceInputEnabled: boolean;
  whisperApiKey: string | null;

  // Daily Briefing
  dailyBriefingEnabled: boolean;
  dailyBriefingTime: string; // HH:mm
  includeWeather: boolean;

  // Location
  locationEnabled: boolean;
  backgroundLocationEnabled: boolean;
  proximityNotifications: boolean;

  // Focus Mode
  defaultPomodoroDuration: number; // minutes
  defaultBreakDuration: number; // minutes
  autoStartBreaks: boolean;
  focusModeSound: 'none' | 'rain' | 'cafe' | 'forest' | 'waves';

  // Data
  autoSyncEnabled: boolean;
  syncInterval: number; // minutes

  // Onboarding
  onboardingCompleted: boolean;
  showTips: boolean;
}

interface SettingsState {
  settings: AppSettings;
  isLoading: boolean;

  // Actions
  updateSettings: (updates: Partial<AppSettings>) => void;
  loadSettings: () => Promise<void>;
  saveSettings: () => Promise<void>;
  resetSettings: () => void;
}

const DEFAULT_SETTINGS: AppSettings = {
  colorScheme: 'system',
  hapticsEnabled: true,
  hapticIntensity: 'medium',
  biometricsEnabled: false,
  appLockEnabled: false,
  lockTimeout: 0,
  voiceInputEnabled: true,
  whisperApiKey: null,
  dailyBriefingEnabled: true,
  dailyBriefingTime: '08:00',
  includeWeather: true,
  locationEnabled: true,
  backgroundLocationEnabled: false,
  proximityNotifications: true,
  defaultPomodoroDuration: 25,
  defaultBreakDuration: 5,
  autoStartBreaks: false,
  focusModeSound: 'none',
  autoSyncEnabled: true,
  syncInterval: 5,
  onboardingCompleted: false,
  showTips: true,
};

const SETTINGS_KEY = 'app_settings';

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  isLoading: true,

  updateSettings: (updates) => {
    set((state) => ({
      settings: { ...state.settings, ...updates },
    }));
    get().saveSettings();
  },

  loadSettings: async () => {
    try {
      set({ isLoading: true });
      const stored = await AsyncStorage.getItem(SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        set({ settings: { ...DEFAULT_SETTINGS, ...parsed } });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  saveSettings: async () => {
    try {
      const { settings } = get();
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  },

  resetSettings: () => {
    set({ settings: DEFAULT_SETTINGS });
    get().saveSettings();
  },
}));
