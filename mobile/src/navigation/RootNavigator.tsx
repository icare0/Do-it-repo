import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, ActivityIndicator, Dimensions } from 'react-native';


import { useAuthStore } from '@/store/authStore';
import { useOnboardingStore } from '@/store/onboardingStore';
import { authService } from '@/services/authService';
import { useThemeStore } from '@/store/themeStore';
import { getTheme } from '@/theme';
import { deepLinkingService } from '@/services/deepLinkingService';

const { width } = Dimensions.get('window');

// Screens
import OnboardingScreen from '@/screens/OnboardingScreen';
import LoginScreen from '@/screens/LoginScreen';
import RegisterScreen from '@/screens/RegisterScreen';
import TodayScreen from '@/screens/TodayScreen';
import TaskListScreen from '@/screens/TaskListScreen';
import TaskDetailScreen from '@/screens/TaskDetailScreen';
import QuickAddScreen from '@/screens/QuickAddScreen';
import CalendarScreen from '@/screens/CalendarScreen';
import SettingsScreen from '@/screens/SettingsScreen';
import NotificationsScreen from '@/screens/NotificationsScreen';
import NotificationSettingsScreen from '@/screens/NotificationSettingsScreen';
import FocusModeScreen from '@/screens/FocusModeScreen';
import StatsScreen from '@/screens/StatsScreen';
import { SmartAssistantScreen } from '@/screens/SmartAssistantScreen';
import WidgetSetupScreen from '@/screens/WidgetSetupScreen';

import { RootStackParamList } from '@/types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  const { colorScheme } = useThemeStore();
  const theme = getTheme(colorScheme);
  const isDark = colorScheme === 'dark';

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: isDark ? '#8E8E93' : '#8E8E93', // iOS gray
        tabBarStyle: {
          backgroundColor: isDark
            ? 'rgba(28, 28, 30, 0.72)' // iOS dark translucent
            : 'rgba(249, 249, 249, 0.92)', // iOS light translucent
          borderTopWidth: 0,
          height: 50, // iOS standard tab bar height
          paddingTop: 0,
          paddingBottom: 0,
          position: 'absolute',
          left: 0,
          bottom: 0,
          width: width,

          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarItemStyle: {
          paddingVertical: 6,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
          marginTop: -2,
          marginBottom: 2,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen
        name="Today"
        component={TodayScreen}
        options={{
          tabBarLabel: "Aujourd'hui",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "today" : "today-outline"}
              size={28}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="TaskList"
        component={TaskListScreen}
        options={{
          tabBarLabel: 'Tâches',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "checkmark-circle" : "checkmark-circle-outline"}
              size={28}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{
          tabBarLabel: 'Calendrier',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "calendar" : "calendar-outline"}
              size={28}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Réglages',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "settings" : "settings-outline"}
              size={28}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// import * as QuickActions from 'expo-quick-actions';
// import { useQuickAction } from 'expo-quick-actions/hooks';
import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export default function RootNavigator() {
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const { hasCompletedOnboarding, isLoading: onboardingLoading, checkOnboardingStatus } = useOnboardingStore();
  const { colorScheme } = useThemeStore();
  const theme = getTheme(colorScheme);

  // const action = useQuickAction();

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  // useEffect(() => {
  //   QuickActions.setItems([
  //     {
  //       id: 'quick_add',
  //       title: 'Nouvelle Tâche',
  //       subtitle: 'Ajouter rapidement',
  //       icon: 'compose',
  //       params: { href: 'quick-add' },
  //     },
  //   ]);
  // }, []);

  // useEffect(() => {
  //   if (action?.params?.href === 'quick-add' && isAuthenticated && navigationRef.isReady()) {
  //     // @ts-ignore
  //     navigationRef.navigate('QuickAdd');
  //   }
  // }, [action, isAuthenticated]);

  // Initialize deep linking service
  useEffect(() => {
    if (navigationRef.current) {
      deepLinkingService.initialize(navigationRef.current);
    }

    return () => {
      deepLinkingService.cleanup();
    };
  }, []);

  if (authLoading || onboardingLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        {!hasCompletedOnboarding ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : !isAuthenticated ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Main" component={TabNavigator} />
            <Stack.Screen
              name="QuickAdd"
              component={QuickAddScreen}
              options={{
                presentation: 'modal',
                animation: 'slide_from_bottom',
              }}
            />
            <Stack.Screen
              name="TaskDetail"
              component={TaskDetailScreen}
              options={{
                presentation: 'modal',
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen
              name="Notifications"
              component={NotificationsScreen}
              options={{
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen
              name="NotificationSettings"
              component={NotificationSettingsScreen}
              options={{
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen
              name="FocusMode"
              component={FocusModeScreen}
              options={{
                presentation: 'fullScreenModal',
                animation: 'slide_from_bottom',
              }}
            />
            <Stack.Screen
              name="Stats"
              component={StatsScreen}
              options={{
                presentation: 'modal',
                animation: 'slide_from_bottom',
              }}
            />
            <Stack.Screen
              name="SmartAssistant"
              component={SmartAssistantScreen}
              options={{
                presentation: 'modal',
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen
              name="WidgetSetup"
              component={WidgetSetupScreen}
              options={{
                presentation: 'modal',
                animation: 'slide_from_right',
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
