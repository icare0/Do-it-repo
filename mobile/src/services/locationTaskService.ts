import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task } from '@/types';
import { locationService } from './locationService';
import { notificationService } from './notificationService';
import { smartTaskService } from './smartTaskService';

interface LocationVisit {
  taskId: string;
  latitude: number;
  longitude: number;
  timestamp: Date;
  duration: number; // in seconds
}

class LocationTaskService {
  private activeVisits: Map<string, LocationVisit> = new Map();
  private locationWatchId: any = null;
  private readonly PROXIMITY_THRESHOLD = 0.1; // 100 meters
  private readonly AUTO_COMPLETE_DURATION = 300; // 5 minutes in seconds
  private readonly STORAGE_KEY = 'location_visits';

  async initialize() {
    await this.loadVisits();
  }

  private async loadVisits() {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const visits: any[] = JSON.parse(stored);
        this.activeVisits = new Map(
          visits.map(v => [v.taskId, { ...v, timestamp: new Date(v.timestamp) }])
        );
      }
    } catch (error) {
      console.error('Error loading location visits:', error);
    }
  }

  private async saveVisits() {
    try {
      const visits = Array.from(this.activeVisits.values());
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(visits));
    } catch (error) {
      console.error('Error saving location visits:', error);
    }
  }

  /**
   * Start monitoring user location and check for task proximity
   */
  async startLocationMonitoring(tasks: Task[], onTaskComplete: (task: Task) => void) {
    if (this.locationWatchId) {
      console.log('Location monitoring already active');
      return;
    }

    await locationService.startWatchingLocation(async (location) => {
      const { latitude, longitude } = location.coords;

      for (const task of tasks) {
        if (task.completed || !task.location) continue;

        const distance = locationService.calculateDistance(
          latitude,
          longitude,
          task.location.latitude,
          task.location.longitude
        );

        if (distance < this.PROXIMITY_THRESHOLD) {
          await this.handleTaskProximity(task, { latitude, longitude }, onTaskComplete);
        } else {
          // User left the area, remove from active visits
          if (this.activeVisits.has(task.id)) {
            this.activeVisits.delete(task.id);
            await this.saveVisits();
          }
        }
      }

      // Send proximity notifications
      await this.checkProximityNotifications(tasks, { latitude, longitude });
    });
  }

  /**
   * Stop monitoring location
   */
  stopLocationMonitoring() {
    locationService.stopWatchingLocation();
    this.locationWatchId = null;
  }

  /**
   * Handle when user enters task proximity
   */
  private async handleTaskProximity(
    task: Task,
    location: { latitude: number; longitude: number },
    onTaskComplete: (task: Task) => void
  ) {
    const now = Date.now();

    if (this.activeVisits.has(task.id)) {
      // User is still in proximity, update duration
      const visit = this.activeVisits.get(task.id)!;
      visit.duration = Math.floor((now - visit.timestamp.getTime()) / 1000);

      // Check if user has been there long enough
      if (visit.duration >= this.AUTO_COMPLETE_DURATION) {
        console.log(`Auto-completing task: ${task.title}`);

        // Send notification to confirm
        await notificationService.scheduleNotification({
          title: 'Tâche terminée ?',
          body: `Vous êtes à ${task.location?.name} depuis ${Math.floor(visit.duration / 60)} minutes. Marquer "${task.title}" comme terminée ?`,
          data: {
            taskId: task.id,
            type: 'auto_complete_suggestion',
          },
        });

        // Auto-complete if user stays even longer (10 minutes)
        if (visit.duration >= this.AUTO_COMPLETE_DURATION * 2) {
          onTaskComplete(task);
          this.activeVisits.delete(task.id);
        }
      }

      await this.saveVisits();
    } else {
      // New visit
      const visit: LocationVisit = {
        taskId: task.id,
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: new Date(),
        duration: 0,
      };

      this.activeVisits.set(task.id, visit);
      await this.saveVisits();

      // Send proximity notification
      await notificationService.scheduleNotification({
        title: 'Tâche à proximité',
        body: `Vous êtes près de "${task.location?.name}" - Tâche: ${task.title}`,
        data: {
          taskId: task.id,
          type: 'proximity_alert',
        },
      });
    }
  }

  /**
   * Check and send smart proximity notifications
   */
  private async checkProximityNotifications(
    tasks: Task[],
    currentLocation: { latitude: number; longitude: number }
  ) {
    const nearbyTasks = await smartTaskService.getNearbyTasks(tasks, currentLocation);

    // Group nearby tasks by location
    const tasksByLocation = new Map<string, Task[]>();

    for (const task of nearbyTasks) {
      if (task.location) {
        const key = `${task.location.latitude.toFixed(4)},${task.location.longitude.toFixed(4)}`;
        if (!tasksByLocation.has(key)) {
          tasksByLocation.set(key, []);
        }
        tasksByLocation.get(key)!.push(task);
      }
    }

    // Send grouped notifications
    for (const [locationKey, tasks] of tasksByLocation) {
      if (tasks.length > 1) {
        const locationName = tasks[0].location?.name || 'cette zone';
        await notificationService.scheduleNotification({
          title: `${tasks.length} tâches à proximité`,
          body: `Vous avez ${tasks.length} tâches à faire près de ${locationName}`,
          data: {
            taskIds: tasks.map(t => t.id),
            type: 'grouped_proximity',
          },
        });
      }
    }
  }

  /**
   * Get tasks sorted by proximity to current location
   */
  async getTasksByProximity(tasks: Task[]): Promise<Task[]> {
    const location = await locationService.getCurrentLocation();
    if (!location) return tasks;

    const { latitude, longitude } = location.coords;
    const tasksWithLocation = tasks.filter(t => t.location && !t.completed);

    const tasksWithDistance = tasksWithLocation.map(task => {
      const distance = locationService.calculateDistance(
        latitude,
        longitude,
        task.location!.latitude,
        task.location!.longitude
      );

      return { task, distance };
    });

    // Sort by distance (closest first)
    tasksWithDistance.sort((a, b) => a.distance - b.distance);

    // Combine with tasks without location
    const tasksWithoutLocation = tasks.filter(t => !t.location && !t.completed);

    return [
      ...tasksWithDistance.map(t => t.task),
      ...tasksWithoutLocation,
    ];
  }

  /**
   * Get intelligent route suggestion for multiple tasks
   */
  async getOptimizedRoute(tasks: Task[]): Promise<{
    route: Task[];
    totalDistance: number;
  }> {
    const location = await locationService.getCurrentLocation();
    if (!location) {
      return { route: tasks, totalDistance: 0 };
    }

    const tasksWithLocation = tasks.filter(t => t.location && !t.completed);
    if (tasksWithLocation.length === 0) {
      return { route: tasks, totalDistance: 0 };
    }

    // Simple nearest neighbor algorithm for route optimization
    const route: Task[] = [];
    const remaining = new Set(tasksWithLocation);
    let currentLocation = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
    let totalDistance = 0;

    while (remaining.size > 0) {
      let nearest: Task | null = null;
      let minDistance = Infinity;

      for (const task of remaining) {
        const distance = locationService.calculateDistance(
          currentLocation.latitude,
          currentLocation.longitude,
          task.location!.latitude,
          task.location!.longitude
        );

        if (distance < minDistance) {
          minDistance = distance;
          nearest = task;
        }
      }

      if (nearest) {
        route.push(nearest);
        totalDistance += minDistance;
        remaining.delete(nearest);
        currentLocation = {
          latitude: nearest.location!.latitude,
          longitude: nearest.location!.longitude,
        };
      }
    }

    return { route, totalDistance };
  }

  /**
   * Clean up old visits
   */
  async cleanupOldVisits() {
    const now = Date.now();
    const ONE_DAY = 24 * 60 * 60 * 1000;

    for (const [taskId, visit] of this.activeVisits) {
      if (now - visit.timestamp.getTime() > ONE_DAY) {
        this.activeVisits.delete(taskId);
      }
    }

    await this.saveVisits();
  }
}

export const locationTaskService = new LocationTaskService();
