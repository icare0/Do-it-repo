/**
 * Service de calcul d'itinéraires avec OSRM (100% gratuit)
 * OSRM = Open Source Routing Machine
 * API publique: http://router.project-osrm.org
 */

import { RouteInfo, RouteStep } from '../types/optimization';
import { Location } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const OSRM_BASE_URL = 'https://router.project-osrm.org';
const CACHE_DURATION = 3600000; // 1 heure
const CACHE_KEY_PREFIX = 'route_cache_';

interface OSRMRoute {
  distance: number;
  duration: number;
  geometry: {
    coordinates: number[][];
  };
  legs: Array<{
    distance: number;
    duration: number;
    steps: Array<{
      distance: number;
      duration: number;
      name: string;
      maneuver: {
        location: number[];
        instruction: string;
      };
    }>;
  }>;
}

interface OSRMResponse {
  code: string;
  routes: OSRMRoute[];
  waypoints: any[];
}

class RouteService {
  /**
   * Calcule l'itinéraire entre deux points
   */
  async calculateRoute(
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number },
    options: {
      useCache?: boolean;
      alternatives?: boolean;
    } = {}
  ): Promise<RouteInfo | null> {
    const { useCache = true, alternatives = false } = options;

    // Vérifier le cache
    if (useCache) {
      const cached = await this.getCachedRoute(origin, destination);
      if (cached) return cached;
    }

    try {
      // Format: /route/v1/{profile}/{coordinates}
      // Profile: car, bike, foot
      // Coordinates: lon1,lat1;lon2,lat2
      const coordinates = `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`;
      const url = `${OSRM_BASE_URL}/route/v1/driving/${coordinates}?overview=full&geometries=geojson&steps=true&alternatives=${alternatives}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('OSRM API error:', response.status);
        return this.calculateEstimatedRoute(origin, destination);
      }

      const data: OSRMResponse = await response.json();

      if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
        console.error('No routes found');
        return this.calculateEstimatedRoute(origin, destination);
      }

      const route = this.parseOSRMRoute(data.routes[0]);

      // Mettre en cache
      if (useCache) {
        await this.cacheRoute(origin, destination, route);
      }

      return route;
    } catch (error) {
      console.error('Error calculating route:', error);
      // Fallback: estimation basée sur la distance à vol d'oiseau
      return this.calculateEstimatedRoute(origin, destination);
    }
  }

  /**
   * Calcule l'itinéraire multi-points optimisé
   */
  async calculateMultiPointRoute(
    waypoints: Array<{ latitude: number; longitude: number }>,
    optimize: boolean = true
  ): Promise<RouteInfo | null> {
    if (waypoints.length < 2) return null;

    try {
      // Format: lon1,lat1;lon2,lat2;...
      const coordinates = waypoints
        .map((wp) => `${wp.longitude},${wp.latitude}`)
        .join(';');

      // Si optimize = true, OSRM va trouver le meilleur ordre
      const url = `${OSRM_BASE_URL}/route/v1/driving/${coordinates}?overview=full&geometries=geojson&steps=true`;

      const response = await fetch(url);

      if (!response.ok) {
        return this.calculateEstimatedMultiPointRoute(waypoints);
      }

      const data: OSRMResponse = await response.json();

      if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
        return this.calculateEstimatedMultiPointRoute(waypoints);
      }

      return this.parseOSRMRoute(data.routes[0]);
    } catch (error) {
      console.error('Error calculating multi-point route:', error);
      return this.calculateEstimatedMultiPointRoute(waypoints);
    }
  }

  /**
   * Calcule la matrice de distances entre plusieurs points
   * Utile pour l'optimisation de routes (TSP)
   */
  async calculateDistanceMatrix(
    points: Array<{ latitude: number; longitude: number }>
  ): Promise<number[][]> {
    if (points.length < 2) return [];

    try {
      const coordinates = points
        .map((p) => `${p.longitude},${p.latitude}`)
        .join(';');

      // OSRM Table service
      const url = `${OSRM_BASE_URL}/table/v1/driving/${coordinates}?annotations=distance,duration`;

      const response = await fetch(url);

      if (!response.ok) {
        return this.calculateEstimatedDistanceMatrix(points);
      }

      const data = await response.json();

      if (data.code !== 'Ok' || !data.distances) {
        return this.calculateEstimatedDistanceMatrix(points);
      }

      return data.distances;
    } catch (error) {
      console.error('Error calculating distance matrix:', error);
      return this.calculateEstimatedDistanceMatrix(points);
    }
  }

  /**
   * Estime le temps de trajet en fonction de l'heure (heures de pointe)
   */
  estimateTravelTimeWithTraffic(
    baseTimeSeconds: number,
    departureTime: Date
  ): number {
    const hour = departureTime.getHours();
    const dayOfWeek = departureTime.getDay();

    let trafficMultiplier = 1.0;

    // Week-end: moins de trafic
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      trafficMultiplier = 0.9;
    } else {
      // Heures de pointe en semaine
      if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
        trafficMultiplier = 1.5; // +50% de temps
      } else if (hour >= 12 && hour <= 14) {
        trafficMultiplier = 1.2; // +20% de temps
      }
    }

    return Math.round(baseTimeSeconds * trafficMultiplier);
  }

  // ===== PARSING OSRM =====

  /**
   * Parse une route OSRM en RouteInfo
   */
  private parseOSRMRoute(osrmRoute: OSRMRoute): RouteInfo {
    const steps: RouteStep[] = [];

    // Parcourir tous les legs et leurs steps
    for (const leg of osrmRoute.legs) {
      for (const step of leg.steps) {
        steps.push({
          distance: step.distance,
          duration: step.duration,
          instruction: step.maneuver.instruction || step.name,
          coordinates: {
            latitude: step.maneuver.location[1],
            longitude: step.maneuver.location[0],
          },
        });
      }
    }

    return {
      distance: osrmRoute.distance,
      duration: osrmRoute.duration,
      steps,
      geometry: osrmRoute.geometry,
    };
  }

  // ===== FALLBACK: ESTIMATIONS =====

  /**
   * Calcule une route estimée basée sur la distance à vol d'oiseau
   */
  private calculateEstimatedRoute(
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number }
  ): RouteInfo {
    const distance = this.calculateHaversineDistance(origin, destination);

    // Facteur de correction pour tenir compte des routes (pas à vol d'oiseau)
    const routeFactor = 1.3;
    const adjustedDistance = distance * routeFactor;

    // Vitesse moyenne en ville: 25 km/h
    const speedKmh = 25;
    const durationSeconds = (adjustedDistance / 1000 / speedKmh) * 3600;

    return {
      distance: adjustedDistance,
      duration: durationSeconds,
      steps: [
        {
          distance: adjustedDistance,
          duration: durationSeconds,
          instruction: 'Itinéraire estimé (données limitées)',
          coordinates: {
            latitude: destination.latitude,
            longitude: destination.longitude,
          },
        },
      ],
    };
  }

  /**
   * Calcule une route multi-points estimée
   */
  private calculateEstimatedMultiPointRoute(
    waypoints: Array<{ latitude: number; longitude: number }>
  ): RouteInfo {
    let totalDistance = 0;
    let totalDuration = 0;
    const steps: RouteStep[] = [];

    for (let i = 0; i < waypoints.length - 1; i++) {
      const segment = this.calculateEstimatedRoute(
        waypoints[i],
        waypoints[i + 1]
      );
      totalDistance += segment.distance;
      totalDuration += segment.duration;
      steps.push(...segment.steps);
    }

    return {
      distance: totalDistance,
      duration: totalDuration,
      steps,
    };
  }

  /**
   * Calcule une matrice de distances estimée
   */
  private calculateEstimatedDistanceMatrix(
    points: Array<{ latitude: number; longitude: number }>
  ): number[][] {
    const matrix: number[][] = [];

    for (let i = 0; i < points.length; i++) {
      matrix[i] = [];
      for (let j = 0; j < points.length; j++) {
        if (i === j) {
          matrix[i][j] = 0;
        } else {
          const distance = this.calculateHaversineDistance(
            points[i],
            points[j]
          );
          matrix[i][j] = distance * 1.3; // Facteur de correction
        }
      }
    }

    return matrix;
  }

  // ===== CACHE =====

  /**
   * Récupère une route du cache
   */
  private async getCachedRoute(
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number }
  ): Promise<RouteInfo | null> {
    try {
      const cacheKey = this.getCacheKey(origin, destination);
      const cached = await AsyncStorage.getItem(cacheKey);

      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);

      // Vérifier si le cache est encore valide
      if (Date.now() - timestamp > CACHE_DURATION) {
        await AsyncStorage.removeItem(cacheKey);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error reading route cache:', error);
      return null;
    }
  }

  /**
   * Met en cache une route
   */
  private async cacheRoute(
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number },
    route: RouteInfo
  ): Promise<void> {
    try {
      const cacheKey = this.getCacheKey(origin, destination);
      await AsyncStorage.setItem(
        cacheKey,
        JSON.stringify({
          data: route,
          timestamp: Date.now(),
        })
      );
    } catch (error) {
      console.error('Error caching route:', error);
    }
  }

  /**
   * Génère une clé de cache unique
   */
  private getCacheKey(
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number }
  ): string {
    const originKey = `${origin.latitude.toFixed(4)},${origin.longitude.toFixed(4)}`;
    const destKey = `${destination.latitude.toFixed(4)},${destination.longitude.toFixed(4)}`;
    return `${CACHE_KEY_PREFIX}${originKey}_${destKey}`;
  }

  // ===== UTILITAIRES =====

  /**
   * Calcule la distance à vol d'oiseau (formule Haversine)
   */
  private calculateHaversineDistance(
    point1: { latitude: number; longitude: number },
    point2: { latitude: number; longitude: number }
  ): number {
    const R = 6371e3; // Rayon de la Terre en mètres
    const φ1 = (point1.latitude * Math.PI) / 180;
    const φ2 = (point2.latitude * Math.PI) / 180;
    const Δφ = ((point2.latitude - point1.latitude) * Math.PI) / 180;
    const Δλ = ((point2.longitude - point1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Nettoie le cache expiré
   */
  async clearExpiredCache(): Promise<void> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const routeCacheKeys = allKeys.filter((key) =>
        key.startsWith(CACHE_KEY_PREFIX)
      );

      for (const key of routeCacheKeys) {
        const cached = await AsyncStorage.getItem(key);
        if (cached) {
          const { timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp > CACHE_DURATION) {
            await AsyncStorage.removeItem(key);
          }
        }
      }
    } catch (error) {
      console.error('Error clearing expired cache:', error);
    }
  }

  // ===== OPTIMISATION 2-OPT =====

  /**
   * Optimise une route avec l'algorithme 2-opt
   * Améliore une solution existante en éliminant les croisements
   *
   * Principe: Pour chaque paire d'arêtes, essayer de les croiser
   * Si le croisement réduit la distance totale, l'appliquer
   *
   * Complexité: O(n²) par itération, converge généralement en 2-5 itérations
   * Gain typique: 5-15% d'amélioration sur Nearest Neighbor
   */
  async optimize2Opt(
    route: Array<{ latitude: number; longitude: number }>,
    maxIterations: number = 10
  ): Promise<{
    optimizedRoute: Array<{ latitude: number; longitude: number }>;
    improvement: number; // Pourcentage d'amélioration
    iterations: number;
  }> {
    if (route.length < 4) {
      // 2-opt nécessite au moins 4 points
      return {
        optimizedRoute: route,
        improvement: 0,
        iterations: 0,
      };
    }

    let currentRoute = [...route];
    let currentDistance = this.calculateTotalRouteDistance(currentRoute);
    const initialDistance = currentDistance;
    let improved = true;
    let iterationCount = 0;

    while (improved && iterationCount < maxIterations) {
      improved = false;
      iterationCount++;

      // Essayer toutes les paires d'arêtes
      for (let i = 0; i < currentRoute.length - 2; i++) {
        for (let j = i + 2; j < currentRoute.length; j++) {
          // Éviter les arêtes adjacentes (pas de sens de les croiser)
          if (j === currentRoute.length - 1 && i === 0) continue;

          // Calculer la distance actuelle des deux arêtes
          const distanceBefore =
            this.calculateHaversineDistance(currentRoute[i], currentRoute[i + 1]) +
            this.calculateHaversineDistance(currentRoute[j], currentRoute[(j + 1) % currentRoute.length]);

          // Calculer la distance si on croise les arêtes
          const distanceAfter =
            this.calculateHaversineDistance(currentRoute[i], currentRoute[j]) +
            this.calculateHaversineDistance(currentRoute[i + 1], currentRoute[(j + 1) % currentRoute.length]);

          // Si le croisement améliore, l'appliquer
          if (distanceAfter < distanceBefore) {
            // Inverser la section entre i+1 et j
            currentRoute = this.reverse2OptSegment(currentRoute, i + 1, j);
            currentDistance = this.calculateTotalRouteDistance(currentRoute);
            improved = true;
          }
        }
      }
    }

    const improvement = ((initialDistance - currentDistance) / initialDistance) * 100;

    console.log(
      `[RouteService] 2-opt: ${iterationCount} iterations, ${improvement.toFixed(1)}% improvement (${(initialDistance / 1000).toFixed(1)}km → ${(currentDistance / 1000).toFixed(1)}km)`
    );

    return {
      optimizedRoute: currentRoute,
      improvement,
      iterations: iterationCount,
    };
  }

  /**
   * Inverse un segment de route (pour 2-opt)
   */
  private reverse2OptSegment(
    route: Array<{ latitude: number; longitude: number }>,
    start: number,
    end: number
  ): Array<{ latitude: number; longitude: number }> {
    const result = [...route];
    const segment = result.slice(start, end + 1).reverse();

    for (let i = 0; i < segment.length; i++) {
      result[start + i] = segment[i];
    }

    return result;
  }

  /**
   * Calcule la distance totale d'une route
   */
  private calculateTotalRouteDistance(
    route: Array<{ latitude: number; longitude: number }>
  ): number {
    let total = 0;

    for (let i = 0; i < route.length - 1; i++) {
      total += this.calculateHaversineDistance(route[i], route[i + 1]);
    }

    return total;
  }

  /**
   * Optimise une route avec Nearest Neighbor + 2-opt (combiné)
   * Meilleure qualité que NN seul, toujours rapide
   */
  async optimizeRouteComplete(
    points: Array<{ latitude: number; longitude: number; id?: string }>,
    startLocation?: { latitude: number; longitude: number }
  ): Promise<{
    optimizedOrder: Array<{ latitude: number; longitude: number; id?: string }>;
    totalDistance: number;
    improvement2Opt: number;
  }> {
    if (points.length < 2) {
      return {
        optimizedOrder: points,
        totalDistance: 0,
        improvement2Opt: 0,
      };
    }

    // Étape 1: Nearest Neighbor
    const start = startLocation || points[0];
    const nnRoute = this.nearestNeighborRoute(points, start);

    // Étape 2: 2-opt pour affiner
    const { optimizedRoute, improvement } = await this.optimize2Opt(
      nnRoute.map((p) => ({ latitude: p.latitude, longitude: p.longitude }))
    );

    // Remettre les IDs si présents
    const finalRoute = optimizedRoute.map((point, index) => {
      const original = points.find(
        (p) =>
          Math.abs(p.latitude - point.latitude) < 0.00001 &&
          Math.abs(p.longitude - point.longitude) < 0.00001
      );
      return original || point;
    });

    const totalDistance = this.calculateTotalRouteDistance(optimizedRoute);

    return {
      optimizedOrder: finalRoute,
      totalDistance,
      improvement2Opt: improvement,
    };
  }

  /**
   * Nearest Neighbor simple (sans optimization 2-opt)
   * Utilisé comme base pour 2-opt
   */
  private nearestNeighborRoute(
    points: Array<{ latitude: number; longitude: number }>,
    start: { latitude: number; longitude: number }
  ): Array<{ latitude: number; longitude: number }> {
    const remaining = [...points];
    const route: Array<{ latitude: number; longitude: number }> = [];
    let current = start;

    while (remaining.length > 0) {
      let nearestIndex = 0;
      let nearestDistance = Infinity;

      for (let i = 0; i < remaining.length; i++) {
        const distance = this.calculateHaversineDistance(current, remaining[i]);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = i;
        }
      }

      const nearest = remaining.splice(nearestIndex, 1)[0];
      route.push(nearest);
      current = nearest;
    }

    return route;
  }
}

export default new RouteService();
