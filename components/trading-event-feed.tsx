'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Coins, TrendingUp, AlertCircle } from 'lucide-react'
import { useOracleUpdateEvents } from '@/hooks/use-contracts'
import { MEMECORE_NETWORK } from '@/lib/contracts'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

export interface OracleUpdateEvent {
    id: string
    agent: string
    feedSymbol: string
    price: bigint
    volume: bigint
    timestamp: Date
    txHash: string
    blockNumber: bigint
}

function formatAddress(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
}

function formatTime(date: Date): string {
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
}

function formatVolume(volume: bigint): string {
    const vol = Number(volume) / 1e8 // 8 decimals
    if (vol >= 1000) return `$${(vol / 1000).toFixed(1)}K`
    return `$${vol.toFixed(2)}`
}

function formatPrice(price: bigint): string {
    const p = Number(price) / 1e8
    if (p >= 1000) return `$${p.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
    if (p >= 1) return `$${p.toFixed(4)}`
    return `$${p.toFixed(8)}`
}

export function TradingEventFeed() {
    const { events, hasEvents, isLoading, isError } = useOracleUpdateEvents(15)

    return (
        <Card className="h-full">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Coins className="h-5 w-5 text-accent animate-bounce" />
                    Oracle Update Feed
                    <Badge variant="outline" className="ml-auto text-xs">
                        {isLoading ? 'Loading...' : hasEvents ? 'Live' : 'Waiting'}
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                {isError && (
                    <div className="flex items-center gap-2 text-sm text-destructive p-2 bg-destructive/10 rounded">
                        <AlertCircle className="h-4 w-4" />
                        Failed to load events
                    </div>
                )}

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
                                            {event.feedSymbol}
                                        </Badge>
                                    </div>
                                    <div className="text-sm">
                                        <span className="text-muted-foreground">Agent </span>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <span className="font-mono text-xs text-primary cursor-help">
                                                        {formatAddress(event.agent)}
                                                    </span>
                                                </TooltipTrigger>
                                                <TooltipContent className="z-[9999]" side="top" sideOffset={5}>
                                                    <p className="font-body text-xs font-mono">{event.agent}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                        <span className="text-muted-foreground"> submitted </span>
                                        <span className="font-bold text-accent">{formatPrice(event.price)}</span>
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                                        <span>Vol: {formatVolume(event.volume)}</span>
                                        <a
                                            href={`${MEMECORE_NETWORK.blockExplorer}/tx/${event.txHash}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary hover:underline"
                                        >
                                            View tx
                                        </a>
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

                {!isLoading && !hasEvents && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                        <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No oracle updates yet</p>
                        <p className="text-xs mt-1">Updates will appear when agents submit price data</p>
                    </div>
                )}

                {isLoading && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                        <div className="animate-pulse">Loading oracle events...</div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
