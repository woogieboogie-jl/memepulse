'use client'

import { useState } from 'react'
import { PulseCard, PulseCardProps } from '@/components/pulse-card'
import { TradingEventFeed } from '@/components/trading-event-feed'
import { Input } from '@/components/ui/input'
import { Search, Filter } from 'lucide-react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

// Mock data for memecoin oracle feed
const MEMECOIN_ORACLE_DATA: PulseCardProps[] = [
    {
        memecoin: 'Dogecoin',
        symbol: 'DOGE',
        currentPrice: 0.085,
        priceChange24h: 8.4,
        socialScore: 78,
        miningAPY: 45,
        volume24h: 125000,
        lastProofTxHash: '0x1234567890abcdef1234567890abcdef12345678',
    },
    {
        memecoin: 'Pepe',
        symbol: 'PEPE',
        currentPrice: 0.000012,
        priceChange24h: -3.1,
        socialScore: 62,
        miningAPY: 32,
        volume24h: 89000,
        lastProofTxHash: '0xabcdef1234567890abcdef1234567890abcdef12',
    },
    {
        memecoin: 'Floki Inu',
        symbol: 'FLOKI',
        currentPrice: 0.00016,
        priceChange24h: 12.3,
        socialScore: 85,
        miningAPY: 52,
        volume24h: 156000,
        lastProofTxHash: '0xfedcba0987654321fedcba0987654321fedcba09',
    },
    {
        memecoin: 'Shiba Inu',
        symbol: 'SHIB',
        currentPrice: 0.0000078,
        priceChange24h: 1.9,
        socialScore: 45,
        miningAPY: 18,
        volume24h: 67000,
    },
    {
        memecoin: 'dogwifhat',
        symbol: 'WIF',
        currentPrice: 0.42,
        priceChange24h: -2.4,
        socialScore: 71,
        miningAPY: 38,
        volume24h: 98000,
        lastProofTxHash: '0x9876543210fedcba9876543210fedcba98765432',
    },
    {
        memecoin: 'Bonk',
        symbol: 'BONK',
        currentPrice: 0.0000035,
        priceChange24h: 5.6,
        socialScore: 73,
        miningAPY: 41,
        volume24h: 112000,
        lastProofTxHash: '0x1111222233334444555566667777888899990000',
    },
    {
        memecoin: 'Bitcoin',
        symbol: 'BTC',
        currentPrice: 43250,
        priceChange24h: 2.3,
        socialScore: 92,
        miningAPY: 28,
        volume24h: 580000,
        lastProofTxHash: '0xbtc1234567890abcdefbtc1234567890abcdef',
    },
]

export function OracleFeed() {
    const [searchQuery, setSearchQuery] = useState('')
    const [sortBy, setSortBy] = useState('social')

    // Sort memecoins
    const sortedCoins = [...MEMECOIN_ORACLE_DATA].sort((a, b) => {
        switch (sortBy) {
            case 'social':
                return b.socialScore - a.socialScore
            case 'apy':
                return b.miningAPY - a.miningAPY
            case 'price':
                return b.priceChange24h - a.priceChange24h
            case 'volume':
                return b.volume24h - a.volume24h
            default:
                return 0
        }
    })

    // Filter by search
    const filteredCoins = sortedCoins.filter(
        (coin) =>
            coin.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
            coin.memecoin.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-pixel mb-2">Feeds</h1>
                    <p className="text-muted-foreground">
                        Real-time memecoin pulse monitoring powered by social sentiment and on-chain data
                    </p>
                </div>

                {/* Controls */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search memecoins..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="social">Social Score</SelectItem>
                                <SelectItem value="apy">Mining APY</SelectItem>
                                <SelectItem value="price">Price Change</SelectItem>
                                <SelectItem value="volume">Volume</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Pulse Grid - 2/3 width on large screens */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredCoins.map((coin) => (
                            <PulseCard key={coin.symbol} {...coin} />
                        ))}
                    </div>

                    {filteredCoins.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                            No memecoins found matching "{searchQuery}"
                        </div>
                    )}
                </div>

                {/* Trading Feed - 1/3 width on large screens */}
                <div className="lg:col-span-1">
                    <div className="sticky top-4">
                        <TradingEventFeed />
                    </div>
                </div>
            </div>
        </div>
    )
}
