import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import { useThemeStore } from '@/store/themeStore';
import { getTheme } from '@/theme';
import { useSyncStore } from '@/store/syncStore';

interface OfflineIndicatorProps {
  position?: 'top' | 'bottom';
  showWhenOnline?: boolean;
}

export function OfflineIndicator({ position = 'bottom', showWhenOnline = false }: OfflineIndicatorProps) {
  const { colorScheme } = useThemeStore();
  const theme = getTheme(colorScheme);
  const { pendingChanges, isSyncing } = useSyncStore();
  const [isConnected, setIsConnected] = useState<boolean | null>(true);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const shouldShow = !isConnected || (showWhenOnline && pendingChanges > 0);

    if (shouldShow && !visible) {
      setVisible(true);
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 10,
      }).start();
    } else if (!shouldShow && visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 10,
      }).start(() => setVisible(false));
    }
  }, [isConnected, pendingChanges, showWhenOnline, visible, slideAnim]);

  if (!visible) return null;

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [position === 'top' ? -100 : 100, 0],
  });

  const isOffline = !isConnected;
  const backgroundColor = isOffline
    ? theme.colors.warning
    : isSyncing
    ? theme.colors.primary
    : theme.colors.success;

  const icon = isOffline
    ? 'cloud-offline-outline'
    : isSyncing
    ? 'sync-outline'
    : 'cloud-done-outline';

  const message = isOffline
    ? 'Mode hors ligne'
    : isSyncing
    ? 'Synchronisation...'
    : `${pendingChanges} modification${pendingChanges > 1 ? 's' : ''} en attente`;

  const subMessage = isOffline
    ? 'Vos modifications seront synchronisées automatiquement'
    : isSyncing
    ? 'Veuillez patienter'
    : 'Sera synchronisé dès que possible';

  return (
    <Animated.View
      style={[
        styles.container,
        position === 'top' ? styles.top : styles.bottom,
        { backgroundColor, transform: [{ translateY }] },
      ]}
    >
      <View style={styles.content}>
        <Ionicons
          name={icon as any}
          size={20}
          color="#fff"
          style={isSyncing ? styles.spinning : undefined}
        />
        <View style={styles.textContainer}>
          <Text style={styles.message}>{message}</Text>
          <Text style={styles.subMessage}>{subMessage}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

// Minimal compact version for status bar
export function OfflineBadge() {
  const { colorScheme } = useThemeStore();
  const theme = getTheme(colorScheme);
  const { pendingChanges, isSyncing } = useSyncStore();
  const [isConnected, setIsConnected] = useState<boolean | null>(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  if (isConnected && pendingChanges === 0) return null;

  const isOffline = !isConnected;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: isOffline
            ? `${theme.colors.warning}20`
            : `${theme.colors.primary}20`,
        },
      ]}
    >
      <Ionicons
        name={isOffline ? 'cloud-offline' : 'cloud-upload'}
        size={14}
        color={isOffline ? theme.colors.warning : theme.colors.primary}
      />
      <Text
        style={[
          styles.badgeText,
          { color: isOffline ? theme.colors.warning : theme.colors.primary },
        ]}
      >
        {isOffline ? 'Hors ligne' : pendingChanges}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingVertical: 12,
    paddingHorizontal: 16,
    zIndex: 1000,
  },
  top: {
    top: 0,
  },
  bottom: {
    bottom: 0,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  textContainer: {
    flex: 1,
  },
  message: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  subMessage: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  spinning: {
    // Note: For actual spinning animation, you'd need to implement
    // a separate animated component
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
