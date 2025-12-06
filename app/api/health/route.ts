import { NextResponse } from 'next/server'
import { getRedis, isRedisConfigured } from '@/lib/redis'

/**
 * Health check endpoint to verify Redis connection
 * GET /api/health
 */
export async function GET() {
  const result: Record<string, any> = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    redis: {
      configured: isRedisConfigured(),
      connected: false,
      error: null
    }
  }

  try {
    const redis = await getRedis()
    
    if (redis) {
      // Test write
      await redis.set('health:test', 'ok')
      const testValue = await redis.get('health:test')
      
      result.redis.connected = true
      result.redis.testValue = testValue
      
      // Get trade count
      const tradeCount = await redis.lLen('trades')
      result.redis.tradeCount = tradeCount
    }
  } catch (error) {
    result.redis.error = (error as Error).message
    result.status = 'degraded'
  }

  return NextResponse.json(result)
}

