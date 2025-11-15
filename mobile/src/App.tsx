import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import RootNavigator from '@/navigation/RootNavigator';
import { useThemeStore } from '@/store/themeStore';
import { syncService } from '@/services/syncService';
import { notificationService } from '@/services/notificationService';
import { locationService } from '@/services/locationService';

export default function App() {
  const { colorScheme } = useThemeStore();

  useEffect(() => {
    initializeServices();

    return () => {
      syncService.destroy();
    };
  }, []);

  async function initializeServices() {
    try {
      // Initialize notification service
      await notificationService.initialize();

      // Request location permissions
      await locationService.requestPermissions();

      // Initialize sync service
      await syncService.initialize();
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
