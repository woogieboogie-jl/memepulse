'use client'

import { Activity, Coins, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { useCurrentEpoch, useTimeUntilNextEpoch, useEpochTotalVolume, useBaseRewardRate, useFeedRewardMultiplier } from '@/hooks/use-contracts'
import { useState, useEffect } from 'react'
import { Zap } from 'lucide-react'

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

// Format seconds to HH:MM:SS
function formatTimeRemaining(seconds: number): string {
    if (seconds <= 0) return '00:00:00'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

/**
 * Live countdown timer that ticks every second
 */
function LiveCountdown({ initialSeconds }: { initialSeconds: number }) {
    const [seconds, setSeconds] = useState(initialSeconds)

    useEffect(() => {
        // Reset when initialSeconds changes (e.g., from a refetch)
        setSeconds(initialSeconds)
    }, [initialSeconds])

    useEffect(() => {
        if (seconds <= 0) return

        const interval = setInterval(() => {
            setSeconds(prev => Math.max(0, prev - 1))
        }, 1000)

        return () => clearInterval(interval)
    }, [seconds > 0]) // Only re-run if we go from 0 to positive

    if (seconds <= 0) {
        return <span className="text-accent animate-pulse">New epoch...</span>
    }

    return <span className="font-mono tabular-nums">{formatTimeRemaining(seconds)}</span>
}

interface OracleMiningBannerProps {
    selectedFeed?: string // e.g., "DOGE" extracted from "DOGE-PERP"
}

/**
 * Consolidated Oracle + Mining Banner
 * Shows: Oracle contribution message + epoch info + rewards in one minimal banner
 * All values fetched from on-chain contracts
 */
export function OracleMiningBanner({ selectedFeed }: OracleMiningBannerProps) {
    // Extract symbol from perp format (e.g., "DOGE-PERP" -> "DOGE")
    const feedSymbol = selectedFeed?.replace('-PERP', '') || 'DOGE'
    
    // Fetch real data from contracts
    const { currentEpoch, isLoading: isEpochLoading } = useCurrentEpoch()
    const { secondsRemaining, isLoading: isTimeLoading } = useTimeUntilNextEpoch()
    const { totalVolume, hasData: hasVolumeData, isLoading: isVolumeLoading } = useEpochTotalVolume(currentEpoch)
    const { rewardTokens, display: rewardDisplay, isLoading: isRewardLoading } = useBaseRewardRate()
    const { multiplier, multiplierDisplay, isLoading: isMultiplierLoading } = useFeedRewardMultiplier(feedSymbol)

    // Calculate estimated rewards based on epoch volume and base reward
    // Apply the feed-specific multiplier
    const estimatedRewards = hasVolumeData && totalVolume > 0 && rewardTokens > 0
        ? (totalVolume / 1000) * (rewardTokens / 100000) * multiplier
        : 0

    const isLoading = isEpochLoading || isTimeLoading || isVolumeLoading || isRewardLoading || isMultiplierLoading

    return (
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 border border-primary/20 rounded-lg p-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Left: Oracle Message + Selected Feed Multiplier */}
                <div className="flex items-center gap-2 min-w-0">
                    <Activity className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-xs font-medium text-primary">
                        Trades power MemeCore oracles
                    </span>
                    {/* Feed Multiplier Badge */}
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Badge 
                                    variant="outline" 
                                    className={`text-[10px] h-5 px-1.5 cursor-help ${
                                        multiplier > 1 
                                            ? 'border-accent/50 text-accent bg-accent/10' 
                                            : multiplier < 1 
                                                ? 'border-muted-foreground/50 text-muted-foreground' 
                                                : 'border-primary/30 text-primary'
                                    }`}
                                >
                                    <Zap className="h-2.5 w-2.5 mr-0.5" />
                                    {feedSymbol} {isMultiplierLoading ? '...' : multiplierDisplay}
                                </Badge>
                            </TooltipTrigger>
                            <TooltipContent className="z-[9999]" side="bottom" sideOffset={5}>
                                <p className="font-body text-xs">
                                    <span className="font-semibold">{feedSymbol}</span> has a <span className="text-accent font-semibold">{multiplierDisplay}</span> reward multiplier<br />
                                    {multiplier > 1 && <span className="text-green-500">Bonus rewards for high-demand feeds!</span>}
                                    {multiplier < 1 && <span className="text-muted-foreground">Stable asset - lower rewards</span>}
                                    {multiplier === 1 && <span className="text-muted-foreground">Baseline reward rate</span>}
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>

                {/* Right: Stats Row */}
                <div className="flex items-center gap-4 text-xs">
                    {/* Epoch Info with Live Countdown */}
                    <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {isEpochLoading ? (
                            <span className="animate-pulse text-muted-foreground">...</span>
                        ) : (
                            <span className="text-muted-foreground">
                                Epoch {currentEpoch}
                            </span>
                        )}
                        {!isTimeLoading && secondsRemaining > 0 && (
                            <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-primary/30 text-primary font-mono">
                                <LiveCountdown initialSeconds={secondsRemaining} />
                            </Badge>
                        )}
                    </div>

                    {/* Divider */}
                    <div className="h-4 w-px bg-border" />

                    {/* Volume */}
                    <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground">Vol:</span>
                        {isVolumeLoading ? (
                            <span className="animate-pulse">...</span>
                        ) : hasVolumeData && totalVolume > 0 ? (
                            <span className="font-mono font-medium">
                                ${totalVolume >= 1000 ? `${(totalVolume / 1000).toFixed(1)}K` : totalVolume.toFixed(0)}
                            </span>
                        ) : (
                            <EmptyValue tooltip="No trading volume this epoch" />
                        )}
                    </div>

                    {/* Divider */}
                    <div className="h-4 w-px bg-border" />

                    {/* Reward Rate (from on-chain) */}
                    <div className="flex items-center gap-1.5">
                        <Coins className="h-3 w-3 text-accent" />
                        {isRewardLoading ? (
                            <span className="animate-pulse">...</span>
                        ) : estimatedRewards > 0 ? (
                            <span className="font-mono font-medium text-accent">
                                ~{estimatedRewards >= 1000 ? `${(estimatedRewards / 1000).toFixed(1)}K` : estimatedRewards.toFixed(0)} wM
                            </span>
                        ) : (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span className="text-muted-foreground cursor-help font-mono">
                                            {rewardDisplay}/update
                                        </span>
                                    </TooltipTrigger>
                                    <TooltipContent className="z-[9999]" side="top" sideOffset={5}>
                                        <p className="font-body text-xs">
                                            Base reward: {rewardDisplay} per oracle update<br />
                                            <span className="text-muted-foreground">Fetched from ProtocolConfig</span>
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
