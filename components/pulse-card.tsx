'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TrendingUp, Activity, ExternalLink } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export interface PulseCardProps {
    memecoin: string
    symbol: string // e.g., "DOGE", "PEPE"
    currentPrice: number
    priceChange24h: number
    socialScore: number // 0-100
    miningAPY: number // percentage
    volume24h: number
    lastProofTxHash?: string
}

export function PulseCard({
    memecoin,
    symbol,
    currentPrice,
    priceChange24h,
    socialScore,
    miningAPY,
    volume24h,
    lastProofTxHash,
}: PulseCardProps) {
    const router = useRouter()
    const [showProof, setShowProof] = useState(false)

    // Determine pulse intensity based on Social Pulse
    const getPulseIntensity = () => {
        if (socialScore >= 80) return 'pulse-strong' // Red flash + intense heartbeat
        if (socialScore >= 60) return 'pulse-medium' // Orange glow
        if (socialScore >= 40) return 'pulse-weak' // Yellow subtle
        return 'pulse-idle' // Gray dormant
    }

    const getSocialScoreColor = () => {
        if (socialScore >= 80) return 'text-destructive'
        if (socialScore >= 60) return 'text-accent'
        if (socialScore >= 40) return 'text-primary'
        return 'text-muted-foreground'
    }

    const getMiningAPYColor = () => {
        if (miningAPY >= 40) return 'bg-primary text-primary-foreground'
        if (miningAPY >= 20) return 'bg-accent text-accent-foreground'
        return 'bg-secondary text-secondary-foreground'
    }

    return (
        <Card className={`relative overflow-hidden transition-all hover:border-primary/50 cursor-pointer ${getPulseIntensity()}`}>
            <CardContent className="p-4">
                {/* Header: Symbol + Price */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className="text-2xl font-bold font-pixel">{symbol}</div>
                        <Activity className={`h-5 w-5 ${getSocialScoreColor()}`} />
                    </div>
                    <div className="text-right">
                        <div className="text-lg font-bold">${currentPrice.toFixed(6)}</div>
                        <div className={`text-xs ${priceChange24h >= 0 ? 'text-accent' : 'text-destructive'}`}>
                            {priceChange24h >= 0 ? '+' : ''}{priceChange24h.toFixed(2)}%
                        </div>
                    </div>
                </div>

                {/* Social Pulse Gauge */}
                <div className="mb-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Social Pulse</span>
                        <span className={`font-bold ${getSocialScoreColor()}`}>{socialScore}/100</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-500 ${socialScore >= 80
                                ? 'bg-destructive animate-pulse'
                                : socialScore >= 60
                                    ? 'bg-accent'
                                    : socialScore >= 40
                                        ? 'bg-primary'
                                        : 'bg-muted'
                                }`}
                            style={{ width: `${socialScore}%` }}
                        />
                    </div>
                </div>

                {/* Mining APY Badge */}
                <div className="mb-3">
                    <Badge className={`${getMiningAPYColor()} font-bold text-xs`}>
                        ⛏️ Mining APY: {miningAPY}%
                    </Badge>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div>
                        <div className="text-muted-foreground">24h Volume</div>
                        <div className="font-bold">${(volume24h / 1000).toFixed(1)}K</div>
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

                {/* x402 Proof Link */}
                {lastProofTxHash && (
                    <button
                        className="mt-2 w-full text-xs text-primary hover:text-primary/80 flex items-center justify-center gap-1"
                        onClick={(e) => {
                            e.stopPropagation()
                            setShowProof(true)
                        }}
                    >
                        <ExternalLink className="h-3 w-3" />
                        View x402 Proof
                    </button>
                )}

                {/* View Feed Details Link */}
                <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 w-full text-xs"
                    onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/feed/${symbol}`)
                    }}
                >
                    View Feed Details →
                </Button>

                {/* Pulse Animation Overlay */}
                {socialScore >= 80 && (
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute inset-0 bg-destructive/10 animate-pulse" />
                    </div>
                )}
            </CardContent>

            {/* x402 Proof Modal would go here */}
            {showProof && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="max-w-md w-full">
                        <CardContent className="p-6">
                            <h3 className="text-lg font-bold mb-4">x402 Transaction Proof</h3>
                            <div className="space-y-2 text-sm">
                                <div>
                                    <span className="text-muted-foreground">Tx Hash:</span>
                                    <div className="font-mono text-xs">{lastProofTxHash}</div>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Status:</span>
                                    <Badge className="ml-2 bg-primary">Verified ✓</Badge>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="mt-4 w-full"
                                onClick={() => setShowProof(false)}
                            >
                                Close
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}
        </Card>
    )
}
