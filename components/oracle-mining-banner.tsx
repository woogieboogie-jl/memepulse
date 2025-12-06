'use client'

import { Activity, Coins, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { useCurrentEpoch, useTimeUntilNextEpoch, useEpochTotalVolume, useEpochDuration } from '@/hooks/use-contracts'

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
 * Consolidated Oracle + Mining Banner
 * Shows: Oracle contribution message + epoch info + rewards in one minimal banner
 */
export function OracleMiningBanner() {
    // Fetch real data from contracts
    const { currentEpoch, isLoading: isEpochLoading } = useCurrentEpoch()
    const { secondsRemaining, isLoading: isTimeLoading } = useTimeUntilNextEpoch()
    const { totalVolume, hasData: hasVolumeData, isLoading: isVolumeLoading } = useEpochTotalVolume(currentEpoch)
    const { epochDuration } = useEpochDuration()

    // Distribution rate - could fetch from ProtocolConfig.baseRewardPerUpdate
    // For now: 0.05 wM per $1 volume (5% of volume as rewards)
    const distributionRate = 0.05

    // Calculate estimated rewards based on epoch volume
    const estimatedRewards = hasVolumeData && totalVolume > 0 ? totalVolume * distributionRate : 0

    const isLoading = isEpochLoading || isTimeLoading || isVolumeLoading

    return (
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 border border-primary/20 rounded-lg p-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Left: Oracle Message */}
                <div className="flex items-center gap-2 min-w-0">
                    <Activity className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-xs font-medium text-primary">
                        Trades power MemeCore oracles
                    </span>
                    <span className="text-[10px] text-muted-foreground hidden sm:inline">
                        — earn wM from foundation subsidies
                    </span>
                </div>

                {/* Right: Stats Row */}
                <div className="flex items-center gap-4 text-xs">
                    {/* Epoch Info */}
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
                            <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-primary/30 text-primary">
                                {formatTimeRemaining(secondsRemaining)}
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

                    {/* Estimated Rewards */}
                    <div className="flex items-center gap-1.5">
                        <Coins className="h-3 w-3 text-accent" />
                        {isLoading ? (
                            <span className="animate-pulse">...</span>
                        ) : estimatedRewards > 0 ? (
                            <span className="font-mono font-medium text-accent">
                                ~{estimatedRewards >= 1000 ? `${(estimatedRewards / 1000).toFixed(1)}K` : estimatedRewards.toFixed(0)} wM
                            </span>
                        ) : (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span className="text-muted-foreground cursor-help">
                                            {distributionRate} wM/$
                                        </span>
                                    </TooltipTrigger>
                                    <TooltipContent className="z-[9999]" side="top" sideOffset={5}>
                                        <p className="font-body text-xs">
                                            Earn {distributionRate} wM for every $1 of trading volume
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

