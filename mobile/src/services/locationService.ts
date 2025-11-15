import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';

const LOCATION_TASK_NAME = 'background-location-task';
const GEOFENCING_TASK_NAME = 'geofencing-task';

class LocationService {
  private watchId: Location.LocationSubscription | null = null;

  async requestPermissions(): Promise<boolean> {
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();

      if (foregroundStatus !== 'granted') {
        return false;
      }

      if (Platform.OS === 'android') {
        const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
        return backgroundStatus === 'granted';
      }

      return true;
    } catch (error) {
      console.error('Permission request error:', error);
      return false;
    }
  }

  async getCurrentLocation(): Promise<Location.LocationObject | null> {
    try {
      const hasPermission = await this.checkPermissions();
      if (!hasPermission) {
        const granted = await this.requestPermissions();
        if (!granted) return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      return location;
    } catch (error) {
      console.error('Get current location error:', error);
      return null;
    }
  }

  async startWatchingLocation(callback: (location: Location.LocationObject) => void) {
    try {
      const hasPermission = await this.checkPermissions();
      if (!hasPermission) return;

      this.watchId = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 10000, // 10 seconds
          distanceInterval: 50, // 50 meters
        },
        callback
      );
    } catch (error) {
      console.error('Watch location error:', error);
    }
  }

  stopWatchingLocation() {
    if (this.watchId) {
      this.watchId.remove();
      this.watchId = null;
    }
  }

  async startBackgroundLocationTracking() {
    try {
      const hasPermission = await this.checkPermissions();
      if (!hasPermission) return;

      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 60000, // 1 minute
        distanceInterval: 100, // 100 meters
        foregroundService: {
          notificationTitle: 'TaskFlow',
          notificationBody: 'Tracking your location for task reminders',
        },
      });
    } catch (error) {
      console.error('Background location tracking error:', error);
    }
  }

  async stopBackgroundLocationTracking() {
    try {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    } catch (error) {
      console.error('Stop background tracking error:', error);
    }
  }

  async startGeofencing(regions: Array<{
    identifier: string;
    latitude: number;
    longitude: number;
    radius: number;
    notifyOnEnter?: boolean;
    notifyOnExit?: boolean;
  }>) {
    try {
      const hasPermission = await this.checkPermissions();
      if (!hasPermission) return;

      await Location.startGeofencingAsync(GEOFENCING_TASK_NAME, regions);
    } catch (error) {
      console.error('Start geofencing error:', error);
    }
  }

  async stopGeofencing() {
    try {
      await Location.stopGeofencingAsync(GEOFENCING_TASK_NAME);
    } catch (error) {
      console.error('Stop geofencing error:', error);
    }
  }

  async reverseGeocode(latitude: number, longitude: number) {
    try {
      const result = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (result.length > 0) {
        const location = result[0];
        return {
          name: location.name || 'Unknown location',
          address: `${location.street || ''} ${location.city || ''} ${location.region || ''}`.trim(),
        };
      }
      return null;
    } catch (error) {
      console.error('Reverse geocode error:', error);
      return null;
    }
  }

  private async checkPermissions(): Promise<boolean> {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status === 'granted';
  }

  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

export const locationService = new LocationService();

// Define background tasks
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('Background location task error:', error);
    return;
  }
  if (data) {
    const { locations } = data as any;
    // Handle location update
    console.log('Background location update:', locations);
  }
});

TaskManager.defineTask(GEOFENCING_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('Geofencing task error:', error);
    return;
  }
  if (data) {
    const { eventType, region } = data as any;
    // Handle geofence event
    console.log('Geofence event:', eventType, region);
  }
});
