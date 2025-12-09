import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = '@doit_onboarding_completed';

interface OnboardingStore {
  hasCompletedOnboarding: boolean;
  isLoading: boolean;
  checkOnboardingStatus: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
}

export const useOnboardingStore = create<OnboardingStore>((set) => ({
  hasCompletedOnboarding: false,
  isLoading: true,

  checkOnboardingStatus: async () => {
    try {
      const value = await AsyncStorage.getItem(ONBOARDING_KEY);
      set({ hasCompletedOnboarding: value === 'true', isLoading: false });
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      set({ isLoading: false });
    }
  },

  completeOnboarding: async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      set({ hasCompletedOnboarding: true });
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  },

  resetOnboarding: async () => {
    try {
      await AsyncStorage.removeItem(ONBOARDING_KEY);
      set({ hasCompletedOnboarding: false });
    } catch (error) {
      console.error('Error resetting onboarding:', error);
    }
  },
}));
