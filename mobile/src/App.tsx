import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import RootNavigator from '@/navigation/RootNavigator';
import { useThemeStore } from '@/store/themeStore';
import { useAuthStore } from '@/store/authStore';
import { syncService } from '@/services/syncService';
import { authService } from '@/services/authService';
import { notificationService } from '@/services/notificationService';
import { locationService } from '@/services/locationService';
import { smartTaskService } from '@/services/smartTaskService';
import { locationTaskService } from '@/services/locationTaskService';
import { useDataLoader, useTaskSubscription } from '@/hooks/useDataLoader';

export default function App() {
  const { colorScheme } = useThemeStore();
  const { token, refreshToken } = useAuthStore();

  // Load data from WatermelonDB on startup
  const { isLoading: isLoadingData, error: dataError } = useDataLoader();

  // Subscribe to real-time task updates
  useTaskSubscription();

  useEffect(() => {
    initializeServices();

    return () => {
      syncService.destroy();
    };
  }, []);

  // Initialize sync only when auth tokens are ready
  useEffect(() => {
    if (token && refreshToken) {
      syncService.initialize();
    }
  }, [token, refreshToken]);

  async function initializeServices() {
    try {
      // Initialize auth service FIRST
      await authService.initialize();

      // Initialize notification service
      await notificationService.initialize();

      // Request location permissions
      await locationService.requestPermissions();

      // Initialize smart task services
      await smartTaskService.initialize();
      await locationTaskService.initialize();

      // Sync service will be initialized by the useEffect above when tokens are ready
    } catch (error) {
      console.error('Service initialization error:', error);
    }
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider style={{ flex: 1 }}>
        <RootNavigator />
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
