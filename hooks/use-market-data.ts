'use client'

import { useQuery } from '@tanstack/react-query'
import { generateCandle, INITIAL_PRICES } from '@/lib/mock-generator'

// --- Types ---
export interface Candle {
    timestamp: number
    open: number
    high: number
    low: number
    close: number
    volume: number
}

// --- Historical Data Generator (Cached) ---
const generateHistory = (symbol: string, timeframe: string) => {
    const candles: Candle[] = []
    const now = Date.now()
    let price = INITIAL_PRICES[symbol] || 100

    // 15m default
    const intervalMs = timeframe === '1d' ? 86400000 : 900000
    const count = 100

    for (let i = count; i > 0; i--) {
        const timestamp = now - (i * intervalMs)
        // Simplify back-generation
        const candle = generateCandle(price, symbol, intervalMs / 1000)
        candles.push({ ...candle, timestamp })
        price = candle.close
    }
    return candles
}

export function useMarketCandles(symbol: string, timeframe: string) {
    return useQuery({
        queryKey: ['marketCandles', symbol, timeframe],
        queryFn: async () => {
            // Small artificial delay to verify loading states
            await new Promise(r => setTimeout(r, 500))
            return generateHistory(symbol, timeframe)
        },
        staleTime: 5 * 60 * 1000, // 5 mins cache
    })
}

export function useOrderBook(symbol: string) {
    return useQuery({
        queryKey: ['orderBook', symbol],
        queryFn: async () => {
            // Generate mock depth
            const price = INITIAL_PRICES[symbol] || 100
            const bids = Array.from({ length: 5 }).map((_, i) => ({
                price: price * (1 - (i + 1) * 0.001),
                size: Math.random() * 100
            }))
            const asks = Array.from({ length: 5 }).map((_, i) => ({
                price: price * (1 + (i + 1) * 0.001),
                size: Math.random() * 100
            }))
            return { bids, asks }
        },
        refetchInterval: 2000, // Refresh every 2s
    })
}

export function useMiningAPR(symbol: string) {
    return useQuery({
        queryKey: ['miningAPR', symbol],
        queryFn: async () => {
            // Mock APY based on "volatility" or random
            return 10 + Math.random() * 50 // 10-60% APY
        },
        staleTime: 60 * 1000, // 1 min
    })
}
