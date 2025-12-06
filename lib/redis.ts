import { createClient, RedisClientType } from 'redis'

let redis: RedisClientType | null = null

/**
 * Get Redis client instance (singleton pattern)
 * Uses REDIS_URL from environment
 */
export async function getRedis(): Promise<RedisClientType | null> {
  // Check if Redis is configured
  if (!process.env.REDIS_URL) {
    console.log('[Redis] No REDIS_URL configured, using in-memory fallback')
    return null
  }

  // Return existing connection if available
  if (redis && redis.isOpen) {
    return redis
  }

  try {
    redis = createClient({
      url: process.env.REDIS_URL
    })

    redis.on('error', (err) => {
      console.error('[Redis] Client error:', err)
    })

    await redis.connect()
    console.log('[Redis] Connected successfully')
    return redis
  } catch (error) {
    console.error('[Redis] Connection failed:', error)
    return null
  }
}

/**
 * Check if Redis is configured and available
 */
export function isRedisConfigured(): boolean {
  return !!process.env.REDIS_URL
}

