import Redis from 'ioredis';
import logger from './logger';

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0', 10),
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
};

// Client Redis principal
export const redisClient = new Redis(redisConfig);

// Client Redis pour les publications (pub/sub)
export const redisPublisher = new Redis(redisConfig);

// Client Redis pour les souscriptions (pub/sub)
export const redisSubscriber = new Redis(redisConfig);

// Gestion des événements
redisClient.on('connect', () => {
  logger.info('✅ Redis client connected');
});

redisClient.on('error', (error) => {
  logger.error('❌ Redis client error:', error);
});

redisPublisher.on('connect', () => {
  logger.info('✅ Redis publisher connected');
});

redisSubscriber.on('connect', () => {
  logger.info('✅ Redis subscriber connected');
});

export default redisClient;
