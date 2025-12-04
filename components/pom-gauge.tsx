'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Coins, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

export function PoMGauge() {
    // Mock PoM data - in real app would come from oracle contributions
    const pomStrength = 78 // 0-100 score
    const miningRate = 12.4 // $M per hour
    const efficiency = 92 // percentage

    // Color based on strength
    const getColor = () => {
        if (pomStrength >= 80) return 'text-green-500'
        if (pomStrength >= 60) return 'text-yellow-500'
        return 'text-orange-500'
    }

    const getBgColor = () => {
        if (pomStrength >= 80) return 'bg-green-500'
        if (pomStrength >= 60) return 'bg-yellow-500'
        return 'bg-orange-500'
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5 hover:border-primary/50 transition-all cursor-help">
                        <CardContent className="p-3">
                            <div className="flex items-center gap-3">
                                {/* Icon */}
                                <div className="flex-shrink-0">
                                    <div className="relative">
                                        <Coins className={`h-6 w-6 ${getColor()}`} />
                                        <div className="absolute -top-1 -right-1">
                                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Gauge Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-medium text-muted-foreground">PoM Gauge</span>
                                        <Badge variant="outline" className="text-[9px] h-4 px-1">
                                            Active
                                        </Badge>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                                        <div
                                            className={`h-full ${getBgColor()} transition-all duration-300`}
                                            style={{ width: `${pomStrength}%` }}
                                        />
                                    </div>

                                    {/* Stats */}
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className={`text-sm font-bold ${getColor()}`}>
                                            {pomStrength}%
                                        </span>
                                        <span className="text-[10px] text-muted-foreground">
                                            {miningRate} $M/hr
                                        </span>
                                    </div>
                                </div>

                                {/* Efficiency Badge */}
                                <div className="flex-shrink-0">
                                    <div className="flex flex-col items-center">
                                        <TrendingUp className="h-4 w-4 text-accent mb-0.5" />
                                        <span className="text-[9px] font-bold text-accent">{efficiency}%</span>
                                        <span className="text-[7px] text-muted-foreground">Eff</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                    <div className="space-y-1">
                        <p className="font-semibold text-sm">Proof of Mining Gauge</p>
                        <p className="text-xs text-muted-foreground">
                            Your oracle contribution strength determines $M token mining rate
                        </p>
                        <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                            <div>
                                <span className="text-muted-foreground">Strength:</span>
                                <span className="font-bold ml-1">{pomStrength}%</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Mining:</span>
                                <span className="font-bold ml-1">{miningRate} $M/hr</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Efficiency:</span>
                                <span className="font-bold ml-1">{efficiency}%</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Daily:</span>
                                <span className="font-bold ml-1">{(miningRate * 24).toFixed(1)} $M</span>
                            </div>
                        </div>
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}
