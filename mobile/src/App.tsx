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

export default function App() {
  const { colorScheme } = useThemeStore();
  const { token, refreshToken } = useAuthStore();

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

      // Sync service will be initialized by the useEffect above when tokens are ready
    } catch (error) {
      console.error('Service initialization error:', error);
    }
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <RootNavigator />
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
