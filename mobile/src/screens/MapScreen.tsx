import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Region } from 'react-native-maps';
import { useThemeStore } from '@/store/themeStore';
import { useTaskStore } from '@/store/taskStore';
import { getTheme } from '@/theme';
import { locationService } from '@/services/locationService';

export default function MapScreen() {
  const { colorScheme } = useThemeStore();
  const theme = getTheme(colorScheme);
  const { tasks } = useTaskStore();
  const mapRef = useRef<MapView>(null);

  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [region, setRegion] = useState<Region>({
    latitude: 48.8566, // Default to Paris as fallback
    longitude: 2.3522,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  });

  const tasksWithLocation = tasks.filter(t => t.location);

  useEffect(() => {
    getUserLocation();
  }, []);

  async function getUserLocation() {
    try {
      // Request permissions first
      const hasPermission = await locationService.requestPermissions();

      if (!hasPermission) {
        Alert.alert(
          'Permission requise',
          'Veuillez activer la localisation pour voir votre position sur la carte.',
          [{ text: 'OK' }]
        );
        setLoadingLocation(false);
        return;
      }

      // Get current position
      const position = await locationService.getCurrentPosition();

      if (position) {
        const { latitude, longitude } = position.coords;
        setUserLocation({ latitude, longitude });

        const newRegion = {
          latitude,
          longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };

        setRegion(newRegion);

        // Animate to user location
        if (mapRef.current) {
          mapRef.current.animateToRegion(newRegion, 1000);
        }
      }
    } catch (error) {
      console.error('Error getting user location:', error);
      Alert.alert(
        'Erreur',
        'Impossible de récupérer votre position. Vérifiez que la localisation est activée.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoadingLocation(false);
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Carte</Text>
      </View>

      {loadingLocation && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Récupération de votre position...
          </Text>
        </View>
      )}

      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region}
        showsUserLocation={true}
        showsMyLocationButton={true}
        followsUserLocation={false}
      >
        {/* User location marker is shown automatically with showsUserLocation */}

        {/* Task markers */}
        {tasksWithLocation.map(task => task.location && (
          <Marker
            key={task.id}
            coordinate={{
              latitude: task.location.latitude,
              longitude: task.location.longitude,
            }}
            title={task.title}
            description={task.description}
            pinColor={theme.colors.primary}
          />
        ))}
      </MapView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 24, paddingVertical: 16 },
  title: { fontSize: 32, fontWeight: '700' },
  map: { flex: 1 },
  loadingOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -75 }, { translateY: -50 }],
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 150,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});
