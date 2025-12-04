'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Coins, TrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'

export interface TradingEvent {
    id: string
    timestamp: Date
    user: string
    memecoin: string
    amount: number
    action: string
    txHash: string
}

export function TradingEventFeed() {
    const [events, setEvents] = useState<TradingEvent[]>([
        {
            id: '1',
            timestamp: new Date(Date.now() - 30000),
            user: '0x1234...5678',
            memecoin: 'DOGE',
            amount: 50,
            action: 'Long 2x',
            txHash: '0xabc...def',
        },
        {
            id: '2',
            timestamp: new Date(Date.now() - 120000),
            user: '0x8765...4321',
            memecoin: 'PEPE',
            amount: 125,
            action: 'Short 3x',
            txHash: '0xfed...cba',
        },
        {
            id: '3',
            timestamp: new Date(Date.now() - 240000),
            user: '0xabcd...efgh',
            memecoin: 'FLOKI',
            amount: 89,
            action: 'Long 4x',
            txHash: '0x123...456',
        },
    ])

    const formatTime = (date: Date) => {
        const now = new Date()
        const diff = Math.floor((now.getTime() - date.getTime()) / 1000)

        if (diff < 60) return `${diff}s ago`
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
        return `${Math.floor(diff / 3600)}h ago`
    }

    return (
        <Card className="h-full">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Coins className="h-5 w-5 text-accent animate-bounce" />
                    Live Trading Feed
                    <Badge variant="outline" className="ml-auto text-xs">
                        Real-time
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {events.map((event, index) => (
                        <div
                            key={event.id}
                            className="group relative bg-secondary/30 hover:bg-secondary/50 rounded-sm p-2 transition-all border-l-2 border-accent"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-mono text-xs text-muted-foreground">
                                            {formatTime(event.timestamp)}
                                        </span>
                                        <Badge variant="outline" className="text-[10px] px-1 py-0">
                                            {event.memecoin}
                                        </Badge>
                                    </div>
                                    <div className="text-sm">
                                        <span className="text-muted-foreground">User </span>
                                        <span className="font-mono text-xs text-primary">{event.user}</span>
                                        <span className="text-muted-foreground"> mined </span>
                                        <span className="font-bold text-accent">+{event.amount} $M</span>
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        {event.action}
                                    </div>
                                </div>
                                <TrendingUp className="h-4 w-4 text-accent flex-shrink-0 mt-1" />
                            </div>

                            {/* Coin animation on hover */}
                            <div className="absolute -right-1 -top-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Coins className="h-4 w-4 text-accent animate-bounce" />
                            </div>
                        </div>
                    ))}
                </div>

                {events.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                        Waiting for mining events...
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
