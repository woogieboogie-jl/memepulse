'use client'

import { useEffect, useState } from 'react'

export interface TickerPrice {
    symbol: string
    price: number
    change24h: number
}

export function GlobalTicker() {
    const [prices, setPrices] = useState<TickerPrice[]>([
        { symbol: 'BTC', price: 43250, change24h: 2.3 },
        { symbol: 'ETH', price: 3280, change24h: -1.2 },
        { symbol: 'SOL', price: 101.5, change24h: 4.7 },
        { symbol: 'DOGE', price: 0.085, change24h: 8.4 },
        { symbol: 'PEPE', price: 0.000012, change24h: -3.1 },
        { symbol: 'SHIB', price: 0.0000078, change24h: 1.9 },
        { symbol: 'FLOKI', price: 0.00016, change24h: 12.3 },
        { symbol: 'WIF', price: 0.42, change24h: -2.4 },
        { symbol: 'BONK', price: 0.0000035, change24h: 5.6 },
    ])

    // Duplicate for seamless loop
    const displayPrices = [...prices, ...prices]

    return (
        <div className="w-full bg-card border-b border-border overflow-hidden">
            <div className="ticker-wrapper">
                <div className="ticker-content">
                    {displayPrices.map((item, index) => (
                        <div key={index} className="ticker-item inline-flex items-center gap-2 px-4">
                            <span className="font-bold text-primary">{item.symbol}</span>
                            <span className="text-foreground">
                                ${item.symbol === 'BTC' || item.symbol === 'ETH' || item.symbol === 'SOL' || item.symbol === 'WIF'
                                    ? item.price.toLocaleString()
                                    : item.price.toFixed(item.price < 0.001 ? 8 : 6)}
                            </span>
                            <span className={`text-xs ${item.change24h >= 0 ? 'text-accent' : 'text-destructive'}`}>
                                {item.change24h >= 0 ? '▲' : '▼'} {Math.abs(item.change24h).toFixed(2)}%
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <style jsx>{`
        .ticker-wrapper {
          position: relative;
          height: 2rem;
          display: flex;
          align-items: center;
        }
        
        .ticker-content {
          display: flex;
          animation: ticker 30s linear infinite;
          will-change: transform;
        }
        
        @keyframes ticker {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        
        .ticker-item {
          white-space: nowrap;
        }
      `}</style>
        </div>
    )
}
