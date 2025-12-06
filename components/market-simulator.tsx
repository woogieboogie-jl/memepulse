'use client'

import { useEffect, useRef } from 'react'
import { useMarketStore } from '@/lib/store/market-store'
import { useUserStore } from '@/lib/store/user-store'
import { generateNextPrice, INITIAL_PRICES } from '@/lib/mock-generator'

// Simulation interval (ms)
const TICK_RATE = 1000

export function MarketSimulator() {
    const { prices, updatePrice, updateStats } = useMarketStore()
    const { orders, fillOrder } = useUserStore()

    // Ref to track if we've initialized to avoid double-init in strict mode
    const initialized = useRef(false)

    // Initialize prices if empty
    useEffect(() => {
        if (Object.keys(prices).length === 0 && !initialized.current) {
            initialized.current = true
            Object.entries(INITIAL_PRICES).forEach(([symbol, price]) => {
                updatePrice(symbol, price)
            })
        }
    }, [prices, updatePrice])

    // Simulation Loop
    useEffect(() => {
        const interval = setInterval(() => {
            // 1. Update Prices
            Object.keys(INITIAL_PRICES).forEach(symbol => {
                const currentPrice = prices[symbol] || INITIAL_PRICES[symbol]
                const nextPrice = generateNextPrice(currentPrice, symbol)

                updatePrice(symbol, nextPrice)

                // Mock 24h stats update (simplified)
                updateStats(symbol, {
                    change24h: nextPrice - INITIAL_PRICES[symbol],
                    changePercent24h: ((nextPrice - INITIAL_PRICES[symbol]) / INITIAL_PRICES[symbol]) * 100,
                    high24h: nextPrice * 1.05,
                    low24h: nextPrice * 0.95,
                    volume24h: Math.random() * 1000000 + 500000
                })
            })

            // 2. Matching Engine (Check Limit Orders)
            // Access latest state directly via store hooks inside effect or pass dependencies
            // Ideally, we'd use `useUserStore.getState()` for non-reactive reads to avoid re-runs
            // But adhering to React rules, we rely on the injected `orders`.
            // NOTE: `orders` dependency might cause this effect to re-run frequently. 
            // For performance, usually we'd put this in a separate worker or refined effect.
            // For Hackathon demo, it's fine.

            orders.forEach(order => {
                if (order.status !== 'pending') return

                const currentPrice = prices[order.symbol]
                if (!currentPrice) return

                // Limit Buy: Price drops below limit
                if (order.side === 'buy' && order.type === 'limit' && order.price && currentPrice <= order.price) {
                    fillOrder(order.id, currentPrice)
                    console.log(`[Matching Engine] Filled Buy ${order.symbol} @ ${currentPrice}`)
                }

                // Limit Sell: Price rises above limit
                if (order.side === 'sell' && order.type === 'limit' && order.price && currentPrice >= order.price) {
                    fillOrder(order.id, currentPrice)
                    console.log(`[Matching Engine] Filled Sell ${order.symbol} @ ${currentPrice}`)
                }

                // Stop Loss handling could be added here
            })

        }, TICK_RATE)

        return () => clearInterval(interval)
    }, [prices, updatePrice, updateStats, orders, fillOrder])

    return null // Headless component
}
