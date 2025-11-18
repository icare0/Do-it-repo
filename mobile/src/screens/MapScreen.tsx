import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Region, Polyline } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useThemeStore } from '@/store/themeStore';
import { useTaskStore } from '@/store/taskStore';
import { getTheme } from '@/theme';
import { locationService } from '@/services/locationService';
import { locationTaskService } from '@/services/locationTaskService';
import { Task } from '@/types';

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
  const [sortedTasks, setSortedTasks] = useState<Task[]>([]);
  const [showRoute, setShowRoute] = useState(false);
  const [optimizedRoute, setOptimizedRoute] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const tasksWithLocation = tasks.filter(t => t.location && !t.completed);

  useEffect(() => {
    getUserLocation();
  }, []);

  useEffect(() => {
    if (userLocation) {
      sortTasksByProximity();
    }
  }, [userLocation, tasks]);

  async function getUserLocation() {
    try {
      // Request permissions first
      const hasPermission = await locationService.requestPermissions();

      if (!hasPermission) {
        setLoadingLocation(false);
        Alert.alert(
          'Permission requise',
          'Veuillez activer la localisation pour voir votre position sur la carte.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Get current position
      const position = await locationService.getCurrentLocation();

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
        setLoadingLocation(false);

        // Animate to user location
        if (mapRef.current) {
          mapRef.current.animateToRegion(newRegion, 1000);
        }
      } else {
        setLoadingLocation(false);
      }
    } catch (error) {
      console.error('Error getting user location:', error);
      setLoadingLocation(false);
      Alert.alert(
        'Erreur',
        'Impossible de récupérer votre position. Vérifiez que la localisation est activée.',
        [{ text: 'OK' }]
      );
    }
  }

  async function sortTasksByProximity() {
    const sorted = await locationTaskService.getTasksByProximity(tasks);
    setSortedTasks(sorted.slice(0, 10)); // Show top 10 nearest tasks
  }

  async function handleOptimizeRoute() {
    const { route, totalDistance } = await locationTaskService.getOptimizedRoute(tasksWithLocation);
    setOptimizedRoute(route);
    setShowRoute(true);

    Alert.alert(
      'Itinéraire optimisé',
      `${route.length} tâches - Distance totale: ${totalDistance.toFixed(1)} km`,
      [{ text: 'OK' }]
    );

    // Fit map to show all markers
    if (mapRef.current && route.length > 0) {
      const coordinates = route
        .filter(t => t.location)
        .map(t => ({
          latitude: t.location!.latitude,
          longitude: t.location!.longitude,
        }));

      if (userLocation) {
        coordinates.unshift(userLocation);
      }

      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 50, right: 50, bottom: 300, left: 50 },
        animated: true,
      });
    }
  }

  function getMarkerColor(task: Task): string {
    if (task.priority === 'high') return '#EF4444';
    if (task.priority === 'low') return '#10B981';
    return theme.colors.primary;
  }

  function calculateDistance(task: Task): string {
    if (!userLocation || !task.location) return '';

    const distance = locationService.calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      task.location.latitude,
      task.location.longitude
    );

    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Carte</Text>
        {tasksWithLocation.length > 1 && (
          <TouchableOpacity
            onPress={handleOptimizeRoute}
            style={[styles.routeButton, { backgroundColor: theme.colors.primary }]}
          >
            <Ionicons name="git-network-outline" size={20} color="#fff" />
            <Text style={styles.routeButtonText}>Itinéraire</Text>
          </TouchableOpacity>
        )}
      </View>

      {loadingLocation && (
        <View style={[styles.loadingOverlay, { backgroundColor: colorScheme === 'dark' ? 'rgba(23, 23, 23, 0.95)' : 'rgba(255, 255, 255, 0.95)' }]}>
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
        {/* Task markers */}
        {tasksWithLocation.map((task, index) => task.location && (
          <Marker
            key={task.id}
            coordinate={{
              latitude: task.location.latitude,
              longitude: task.location.longitude,
            }}
            title={task.title}
            description={`${task.description || ''} ${calculateDistance(task)}`}
            pinColor={getMarkerColor(task)}
            onPress={() => setSelectedTask(task)}
          >
            {showRoute && optimizedRoute.includes(task) && (
              <View style={styles.markerLabel}>
                <Text style={styles.markerLabelText}>{optimizedRoute.indexOf(task) + 1}</Text>
              </View>
            )}
          </Marker>
        ))}

        {/* Route polyline */}
        {showRoute && optimizedRoute.length > 0 && userLocation && (
          <Polyline
            coordinates={[
              userLocation,
              ...optimizedRoute
                .filter(t => t.location)
                .map(t => ({
                  latitude: t.location!.latitude,
                  longitude: t.location!.longitude,
                }))
            ]}
            strokeColor={theme.colors.primary}
            strokeWidth={3}
          />
        )}
      </MapView>

      {/* Selected Task Details */}
      {selectedTask && selectedTask.location && (
        <View style={[styles.taskDetailSheet, { backgroundColor: theme.colors.surface }]}>
          <View style={[styles.sheetHandle, { backgroundColor: theme.colors.border }]} />

          <View style={styles.taskDetailHeader}>
            <View style={styles.taskDetailHeaderLeft}>
              <View style={[styles.priorityDot, { backgroundColor: getMarkerColor(selectedTask) }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.taskDetailTitle, { color: theme.colors.text }]} numberOfLines={2}>
                  {selectedTask.title}
                </Text>
                <Text style={[styles.taskDetailLocation, { color: theme.colors.textSecondary }]}>
                  {selectedTask.location.name} • {calculateDistance(selectedTask)}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => setSelectedTask(null)}>
              <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {selectedTask.startDate && (
            <View style={styles.taskDetailMeta}>
              <Ionicons name="time-outline" size={16} color={theme.colors.textSecondary} />
              <Text style={[styles.taskDetailMetaText, { color: theme.colors.textSecondary }]}>
                {format(selectedTask.startDate, "dd MMM 'à' HH:mm", { locale: fr })}
              </Text>
            </View>
          )}

          <View style={styles.taskDetailActions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => {
                // Navigate to the location
                const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedTask.location!.latitude},${selectedTask.location!.longitude}`;
                Linking.openURL(url).catch(() =>
                  Alert.alert('Erreur', 'Impossible d\'ouvrir l\'itinéraire')
                );
              }}
            >
              <Ionicons name="navigate" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Y aller</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButtonSecondary, { borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
              onPress={() => {
                setSelectedTask(null);
                // Navigate to task detail screen would go here
              }}
            >
              <Ionicons name="information-circle-outline" size={20} color={theme.colors.text} />
              <Text style={[styles.actionButtonSecondaryText, { color: theme.colors.text }]}>Détails</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Nearby tasks list */}
      {!selectedTask && sortedTasks.length > 0 && (
        <View style={[styles.taskList, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.taskListHeader}>
            <Ionicons name="location" size={20} color={theme.colors.primary} />
            <Text style={[styles.taskListTitle, { color: theme.colors.text }]}>
              Tâches à proximité
            </Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.taskListContent}>
            {sortedTasks.map((task) => task.location && (
              <TouchableOpacity
                key={task.id}
                style={[styles.taskCard, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}
                onPress={() => {
                  setSelectedTask(task);
                  if (mapRef.current && task.location) {
                    mapRef.current.animateToRegion({
                      latitude: task.location.latitude,
                      longitude: task.location.longitude,
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01,
                    }, 500);
                  }
                }}
              >
                <View style={styles.taskCardHeader}>
                  <View style={[styles.priorityDot, { backgroundColor: getMarkerColor(task) }]} />
                  <Text style={[styles.taskTitle, { color: theme.colors.text }]} numberOfLines={2}>
                    {task.title}
                  </Text>
                </View>
                <View style={styles.taskCardMeta}>
                  <Ionicons name="location-outline" size={14} color={theme.colors.textSecondary} />
                  <Text style={[styles.taskLocation, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                    {task.location.name}
                  </Text>
                </View>
                <View style={styles.taskCardMeta}>
                  <Ionicons name="walk-outline" size={14} color={theme.colors.textSecondary} />
                  <Text style={[styles.taskDistance, { color: theme.colors.textSecondary }]}>
                    {calculateDistance(task)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  title: { fontSize: 32, fontWeight: '700' },
  routeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  routeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  map: { flex: 1 },
  loadingOverlay: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    zIndex: 10,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    minWidth: 200,
    maxWidth: 250,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  markerLabel: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  markerLabelText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3B82F6',
  },
  taskDetailSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
    paddingBottom: 24,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  taskDetailHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  taskDetailHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    flex: 1,
  },
  taskDetailTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  taskDetailLocation: {
    fontSize: 14,
  },
  taskDetailMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  taskDetailMetaText: {
    fontSize: 14,
  },
  taskDetailActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtonSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
  },
  actionButtonSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
  },
  taskList: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  taskListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  taskListTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  taskListContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  taskCard: {
    width: 200,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 4,
  },
  taskCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  taskTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  taskCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  taskLocation: {
    flex: 1,
    fontSize: 12,
  },
  taskDistance: {
    fontSize: 12,
    fontWeight: '600',
  },
});
