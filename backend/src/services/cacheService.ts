import redisClient from '../config/redis';
import logger from '../config/logger';

/**
 * Service de cache avec Redis
 * Améliore les performances en mettant en cache les données fréquemment accédées
 */

class CacheService {
  private defaultTTL = 3600; // 1 heure par défaut

  /**
   * Récupère une valeur du cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redisClient.get(key);
      if (!value) return null;

      return JSON.parse(value) as T;
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Stocke une valeur dans le cache
   */
  async set(key: string, value: any, ttl: number = this.defaultTTL): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value);
      await redisClient.setex(key, ttl, serialized);
      return true;
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Supprime une clé du cache
   */
  async delete(key: string): Promise<boolean> {
    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      logger.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Supprime toutes les clés correspondant à un pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length === 0) return 0;

      const pipeline = redisClient.pipeline();
      keys.forEach((key) => pipeline.del(key));
      await pipeline.exec();

      logger.info(`🗑️  Deleted ${keys.length} cache keys matching pattern: ${pattern}`);
      return keys.length;
    } catch (error) {
      logger.error(`Cache delete pattern error for ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Vérifie si une clé existe dans le cache
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await redisClient.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Définit un TTL sur une clé existante
   */
  async expire(key: string, ttl: number): Promise<boolean> {
    try {
      await redisClient.expire(key, ttl);
      return true;
    } catch (error) {
      logger.error(`Cache expire error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Incrémente une valeur numérique
   */
  async increment(key: string, amount: number = 1): Promise<number> {
    try {
      return await redisClient.incrby(key, amount);
    } catch (error) {
      logger.error(`Cache increment error for key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Gère le cache avec une fonction de fallback
   */
  async remember<T>(
    key: string,
    ttl: number,
    fallback: () => Promise<T>
  ): Promise<T> {
    // Essayer de récupérer du cache
    const cached = await this.get<T>(key);
    if (cached !== null) {
      logger.debug(`Cache hit for key: ${key}`);
      return cached;
    }

    // Pas en cache, exécuter la fonction fallback
    logger.debug(`Cache miss for key: ${key}`);
    const value = await fallback();

    // Stocker dans le cache
    await this.set(key, value, ttl);

    return value;
  }

  /**
   * Cache des tâches d'un utilisateur
   */
  getUserTasksCacheKey(userId: string): string {
    return `user:${userId}:tasks`;
  }

  /**
   * Cache des geofences d'un utilisateur
   */
  getUserGeofencesCacheKey(userId: string): string {
    return `user:${userId}:geofences`;
  }

  /**
   * Cache des statistiques d'un utilisateur
   */
  getUserStatsCacheKey(userId: string): string {
    return `user:${userId}:stats`;
  }

  /**
   * Cache de la vue "Aujourd'hui" d'un utilisateur
   */
  getUserTodayCacheKey(userId: string): string {
    return `user:${userId}:today`;
  }

  /**
   * Invalide tous les caches d'un utilisateur
   */
  async invalidateUserCache(userId: string): Promise<void> {
    await this.deletePattern(`user:${userId}:*`);
    logger.info(`🗑️  Invalidated all cache for user: ${userId}`);
  }

  /**
   * Invalide le cache des tâches d'un utilisateur
   */
  async invalidateUserTasksCache(userId: string): Promise<void> {
    await this.delete(this.getUserTasksCacheKey(userId));
    await this.delete(this.getUserTodayCacheKey(userId));
    logger.debug(`🗑️  Invalidated tasks cache for user: ${userId}`);
  }
}

export default new CacheService();
