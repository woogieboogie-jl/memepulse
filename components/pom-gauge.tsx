'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Coins, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

import { useCurrentEpoch, useTimeUntilNextEpoch, useEpochTotalVolume } from '@/hooks/use-contracts'

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

export function PoMGauge() {
    // Fetch real data from contracts
    const { currentEpoch, isLoading: isEpochLoading } = useCurrentEpoch()
    const { secondsRemaining, isLoading: isTimeLoading } = useTimeUntilNextEpoch()
    const { totalVolume, hasData: hasVolumeData, isLoading: isVolumeLoading } = useEpochTotalVolume(currentEpoch)

    // Distribution rate (from ProtocolConfig - could also be fetched)
    const distributionRate = 0.05 // 0.05 $M per $1 volume (default)

    // Calculate estimated rewards
    const estimatedRewards = totalVolume * distributionRate

    const isLoading = isEpochLoading || isTimeLoading || isVolumeLoading

    return (
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5 hover:border-primary/50 transition-all">
            <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Coins className="h-5 w-5 text-primary" />
                        <h3 className="font-bold text-sm">Mining Rewards</h3>
                        {!isEpochLoading && currentEpoch > 0 && (
                            <span className="text-xs text-muted-foreground">(Epoch {currentEpoch})</span>
                        )}
                    </div>
                    <Badge variant="outline" className="text-xs border-primary/50 text-primary">
                        {isTimeLoading ? (
                            <span className="animate-pulse">...</span>
                        ) : secondsRemaining > 0 ? (
                            `Ends: ${formatTimeRemaining(secondsRemaining)}`
                        ) : (
                            'New epoch starting...'
                        )}
                    </Badge>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    {/* Estimated Rewards */}
                    <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Est. Rewards</div>
                        <div className="text-xl font-bold font-pixel text-primary">
                            {isLoading ? (
                                <span className="animate-pulse">...</span>
                            ) : hasVolumeData && estimatedRewards > 0 ? (
                                <>
                                    {estimatedRewards.toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="text-xs font-sans">wM</span>
                                </>
                            ) : (
                                <EmptyValue tooltip="No volume in current epoch" />
                            )}
                        </div>
                    </div>

                    {/* Epoch Volume */}
                    <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Epoch Volume</div>
                        <div className="text-lg font-bold">
                            {isVolumeLoading ? (
                                <span className="animate-pulse">...</span>
                            ) : hasVolumeData ? (
                                `$${(totalVolume / 1000).toFixed(1)}K`
                            ) : (
                                <EmptyValue tooltip="No trading volume yet" />
                            )}
                        </div>
                    </div>

                    {/* Distribution Rate */}
                    <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Rate</div>
                        <div className="text-lg font-bold text-accent">
                            {distributionRate} <span className="text-xs text-muted-foreground">wM/$</span>
                        </div>
                    </div>
                </div>

                <div className="mt-3 pt-3 border-t border-border/50 text-[10px] text-muted-foreground flex items-center gap-1.5">
                    <TrendingUp className="h-3 w-3" />
                    <span>Rewards are distributed based on your contribution to the protocol&apos;s volume.</span>
                </div>
            </CardContent>
        </Card>
    )
}
