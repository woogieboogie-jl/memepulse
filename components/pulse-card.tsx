'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Activity } from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

import { useAggregatorStats, useFeedRewardMultiplier } from '@/hooks/use-contracts'
import { usePriceWithChange } from '@/hooks/use-price-with-change'
import { CONTRACTS } from '@/lib/contracts'
import { formatPrice, formatPercentChange } from '@/lib/format'

export interface PulseCardProps {
    memecoin: string
    symbol: string
    currentPrice?: number
    priceChange24h?: number
    credibility?: number // 0-100 on-chain credibility score
    volume24h?: number
    lastProofTxHash?: string
}

// Helper component for empty state display
function EmptyValue({ tooltip }: { tooltip: string }) {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <span className="text-muted-foreground cursor-help">-</span>
                </TooltipTrigger>
                <TooltipContent className="z-[9999]" side="top" sideOffset={5}>
                    <p className="font-body text-xs">{tooltip}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}

export function PulseCard({
    memecoin,
    symbol,
    currentPrice: initialPrice,
    priceChange24h: initialChange,
    credibility: initialCredibility,
    volume24h: initialVolume,
}: PulseCardProps) {
    const router = useRouter()

    // Fetch live data with 24h change tracking
    const { 
        price: livePrice, 
        hasData: hasPriceData, 
        updatedAt, 
        isLoading: isPriceLoading,
        changePercent24h,
        hasChangeData
    } = usePriceWithChange(symbol as keyof typeof CONTRACTS.PRICE_FEEDS)
    const { dailyUpdates, hasData: hasStatsData } = useAggregatorStats(symbol)
    const { multiplier, isLoading: isMultiplierLoading } = useFeedRewardMultiplier(symbol)

    // Use live data or fallback to initial props, or show empty state
    const displayPrice = hasPriceData && livePrice !== null ? livePrice : initialPrice
    const displayCredibility = hasStatsData ? Math.min(dailyUpdates * 10, 100) : initialCredibility || 0 // Map updates to credibility
    const displayVolume = initialVolume || 0

    // 24h change - use localStorage tracking, fall back to initial if available
    const displayChange = hasChangeData ? changePercent24h : initialChange

    // Determine pulse intensity based on Credibility
    const getPulseIntensity = () => {
        if (displayCredibility >= 80) return 'pulse-strong'
        if (displayCredibility >= 60) return 'pulse-medium'
        if (displayCredibility >= 40) return 'pulse-weak'
        return 'pulse-idle'
    }

    const getCredibilityColor = () => {
        if (displayCredibility >= 80) return 'text-destructive'
        if (displayCredibility >= 60) return 'text-accent'
        if (displayCredibility >= 40) return 'text-primary'
        return 'text-muted-foreground'
    }

    // Multiplier is already converted by the hook (e.g., 1.2 = 1.2x)
    const getMiningMultiplierColor = () => {
        if (multiplier >= 1.3) return 'bg-primary text-primary-foreground'
        if (multiplier >= 1.1) return 'bg-accent text-accent-foreground'
        return 'bg-secondary text-secondary-foreground'
    }

    const handleCardClick = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement
        if (target.closest('button') || target.closest('a')) return
        router.push(`/feed/${symbol}`)
    }

    return (
        <Card
            className={`relative overflow-hidden transition-all hover:border-primary/50 cursor-pointer ${getPulseIntensity()}`}
            onClick={handleCardClick}
        >
            <CardContent className="p-4">
                {/* Header: Symbol + Price */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className="text-2xl font-bold font-pixel">{symbol}</div>
                        <Activity className={`h-5 w-5 ${getCredibilityColor()}`} />
                    </div>
                    <div className="text-right">
                        <div className="text-lg font-bold">
                            {isPriceLoading ? (
                                <span className="animate-pulse">...</span>
                            ) : displayPrice !== undefined && displayPrice !== null ? (
                                formatPrice(displayPrice, { showCurrency: true })
                            ) : (
                                <EmptyValue tooltip="Feed not activated yet" />
                            )}
                        </div>
                        <div className={`text-xs ${displayChange !== undefined && displayChange !== null && displayChange >= 0 ? 'text-accent' : 'text-destructive'}`}>
                            {displayChange !== undefined && displayChange !== null ? (
                                formatPercentChange(displayChange)
                            ) : (
                                <EmptyValue tooltip="Building price history..." />
                            )}
                        </div>
                        {updatedAt && updatedAt > 0 && (
                            <div className="text-[10px] text-muted-foreground mt-1">
                                {new Date(updatedAt * 1000).toLocaleTimeString()}
                            </div>
                        )}
                    </div>
                </div>

                {/* Credibility Gauge */}
                <div className="mb-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Credibility</span>
                        <span className={`font-bold ${getCredibilityColor()}`}>
                            {hasStatsData ? `${displayCredibility}%` : (
                                <EmptyValue tooltip="No oracle updates yet" />
                            )}
                        </span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-500 ${displayCredibility >= 80
                                ? 'bg-destructive animate-pulse'
                                : displayCredibility >= 60
                                    ? 'bg-accent'
                                    : displayCredibility >= 40
                                        ? 'bg-primary'
                                        : 'bg-muted'
                                }`}
                            style={{ width: `${displayCredibility}%` }}
                        />
                    </div>
                </div>

                {/* Mining Reward Multiplier Badge */}
                <div className="mb-3">
                    <Badge className={`${getMiningMultiplierColor()} font-bold text-xs`}>
                        {isMultiplierLoading ? (
                            <span className="animate-pulse">⛏️ Mining: ...</span>
                        ) : (
                            `⛏️ Mining: ${multiplier.toFixed(1)}x`
                        )}
                    </Badge>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div>
                        <div className="text-muted-foreground">24h Volume</div>
                        <div className="font-bold">
                            {displayVolume > 0 ? `$${(displayVolume / 1000).toFixed(1)}K` : (
                                <EmptyValue tooltip="No trading volume yet" />
                            )}
                        </div>
                    </div>
                    <div>
                        <div className="text-muted-foreground">Memecoin</div>
                        <div className="font-bold">{memecoin}</div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant="default"
                        className="flex-1 text-xs"
                        onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/create?memecoin=${symbol}`)
                        }}
                    >
                        Launch Agent
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs"
                        onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/marketplace?filter=${symbol}`)
                        }}
                    >
                        Join Squad
                    </Button>
                </div>

                {/* Pulse Animation Overlay */}
                {displayCredibility >= 80 && (
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute inset-0 bg-destructive/10 animate-pulse" />
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
