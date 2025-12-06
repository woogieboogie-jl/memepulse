'use client'

import { useState, useEffect } from 'react'
import { CONTRACTS } from '@/lib/contracts'

export interface AggregatorStats {
    volume24h: number
    sentiment: number // 0-100
    activeAgents: number
    updatesToday: number
    avgAccuracy: number
}

/**
 * Fetches aggregated stats for a memecoin feed.
 * TODO: Implement real event indexing from Aggregator contract.
 * Currently returns mock data for UI integration.
 */
export function useAggregatorStats(symbol: keyof typeof CONTRACTS.PRICE_FEEDS) {
    const [stats, setStats] = useState<AggregatorStats>({
        volume24h: 0,
        sentiment: 50,
        activeAgents: 0,
        updatesToday: 0,
        avgAccuracy: 0
    })
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        // Simulate API call / Indexing delay
        const timer = setTimeout(() => {
            // Generate plausible mock data based on symbol
            const mockVolume = Math.floor(Math.random() * 1000000) + 500000
            const mockSentiment = Math.floor(Math.random() * 40) + 40 // 40-80
            const mockAgents = Math.floor(Math.random() * 15) + 5

            setStats({
                volume24h: mockVolume,
                sentiment: mockSentiment,
                activeAgents: mockAgents,
                updatesToday: mockAgents * 24, // Approx 1 update/hour per agent
                avgAccuracy: 92.5
            })
            setIsLoading(false)
        }, 1000)

        return () => clearTimeout(timer)
    }, [symbol])

    return { stats, isLoading }
}
