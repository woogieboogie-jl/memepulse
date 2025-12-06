'use client'

import { useState } from 'react'
import { PulseCard } from '@/components/pulse-card'
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
import { 
    getSupportedMemecoins, 
    getMemecoinName,
    getMemecoinEmoji 
} from '@/lib/contracts'

// Build feed list from configured price feeds
const MEMECOIN_FEEDS = getSupportedMemecoins().map(symbol => ({
    memecoin: getMemecoinName(symbol),
    symbol: symbol,
}))

export function OracleFeed() {
    const [searchQuery, setSearchQuery] = useState('')
    const [sortBy, setSortBy] = useState('social')

    // Filter by search
    const filteredCoins = MEMECOIN_FEEDS.filter(
        (coin) =>
            coin.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
            coin.memecoin.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="w-full max-w-6xl mx-auto">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4">
                    <div>
                        <h1 className="text-3xl font-bold font-pixel">Memecoin Pulses</h1>
                        <p className="text-sm text-muted-foreground">
                            Live trade-weighted price oracles powered by memecoin perp trading
                        </p>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
                                    <SelectItem value="credibility">Credibility</SelectItem>
                                    <SelectItem value="apy">Mining APY</SelectItem>
                                    <SelectItem value="price">Price Change</SelectItem>
                                    <SelectItem value="volume">24h Volume</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Feed Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredCoins.length > 0 ? (
                        filteredCoins.map((coin) => (
                            <PulseCard
                                key={coin.symbol}
                                symbol={coin.symbol}
                                memecoin={coin.memecoin}
                            />
                        ))
                    ) : (
                        <div className="col-span-full text-center py-12">
                            <p className="text-muted-foreground">No memecoins found matching your search</p>
                        </div>
                    )}
                </div>

                {/* Live Trading Feed */}
                <TradingEventFeed />
            </div>
        </div>
    )
}
