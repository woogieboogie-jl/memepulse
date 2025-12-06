'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TrendingUp, TrendingDown, Users, Activity } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { LineChart, Line, Area, ResponsiveContainer } from 'recharts'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { DelegationModal } from '@/components/modals/delegation-modal'

import { useCredibility } from '@/hooks/use-contracts'

export interface MarketplaceCardProps {
    id: string
    name: string
    strategy: string
    funded: number
    pnl: number
    winRate: number
    sharpeRatio: number

    // PRD-Aligned: Memecoin-specific
    memecoin: string
    socialScore?: number
    mTokensMined?: number

    address?: string // Wallet address for on-chain interactions

    // Marketplace specific
    creator?: string
    totalDeposits?: number
    minDeposit?: number
    feeStructure?: string

    // Delegation
    operatorFee?: number
    currentAPY?: number
    maxDelegation?: number

    // Common
    triggers?: string[]
    contexts?: string[]
    performanceData?: Array<{ time: string; value: number }>
}

export function MarketplaceCard({
    id,
    name,
    strategy,
    funded,
    pnl,
    winRate,
    sharpeRatio,
    memecoin,
    socialScore = 0,
    mTokensMined = 0,
    address,
    creator,
    totalDeposits = 0,
    minDeposit = 100,
    feeStructure = "2% + 20%",
    operatorFee = 10,
    currentAPY = 45,
    maxDelegation = 10000,
    triggers = [],
    contexts = [],
    performanceData = [],
}: MarketplaceCardProps) {
    const [showDelegationModal, setShowDelegationModal] = useState(false)
    const { theme } = useTheme()
    const router = useRouter()

    // Live Credibility Score
    const { credibility, isLoading: isCredibilityLoading } = useCredibility(address)

    // Use live score if available, otherwise fallback to static prop
    const displayScore = address ? credibility : socialScore

    const getSparklineColor = () => {
        if (pnl < 0) return '#ef4444'
        return theme === 'dark' ? '#22c55e' : '#10b981'
    }

    const handleCardClick = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement
        if (target.closest('button') || target.closest('a')) return
        router.push(`/agent/${id}`)
    }

    const getSharpeLabel = (ratio: number) => {
        if (ratio >= 3.0) return { label: "Excellent", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" }
        if (ratio >= 2.0) return { label: "Good", color: "bg-green-500/10 text-green-500 border-green-500/20" }
        if (ratio >= 1.0) return { label: "Okay", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" }
        return { label: "Poor", color: "bg-red-500/10 text-red-500 border-red-500/20" }
    }

    const sharpeInfo = getSharpeLabel(sharpeRatio)

    return (
        <>
            <Card
                className="overflow-hidden transition-all cursor-pointer group h-full hover:border-primary/50"
                onClick={handleCardClick}
            >
                <CardHeader className="pb-2.5">
                    <div className="flex items-center justify-between gap-3 mb-1.5">
                        <div className="flex-1 flex items-center gap-3 min-w-0">
                            <div className="flex-1 min-w-0">
                                <div className="mb-1.5">
                                    <CardTitle className="text-2xl leading-tight group-hover:text-primary transition-colors">
                                        {name}
                                    </CardTitle>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Activity className="h-3 w-3 text-muted-foreground" />
                                        <span className="text-xs text-muted-foreground">Pulse:</span>
                                        <span className={`text-xs font-bold ${displayScore >= 80 ? 'text-destructive' : displayScore >= 60 ? 'text-accent' : 'text-primary'}`}>
                                            {isCredibilityLoading ? '...' : displayScore}/100
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1.5 flex-wrap">
                                    {creator && <span className="text-xs text-muted-foreground">by {creator}</span>}

                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <Badge variant="outline" className={`${sharpeInfo.color} text-[10px] py-0 px-1.5 h-5 cursor-help`}>
                                                    {sharpeInfo.label}
                                                </Badge>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Sharpe Ratio: {sharpeRatio.toFixed(2)}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                            </div>
                        </div>

                        {performanceData.length > 0 && (
                            <div className="flex-shrink-0 w-[120px] h-[36px] flex items-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={performanceData}>
                                        <defs>
                                            <linearGradient id={`gradient-m-${id}`} x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor={getSparklineColor()} stopOpacity={0.5} />
                                                <stop offset="100%" stopColor={getSparklineColor()} stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <Area
                                            type="monotone"
                                            dataKey="value"
                                            fill={`url(#gradient-m-${id})`}
                                            stroke="none"
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="value"
                                            stroke={getSparklineColor()}
                                            strokeWidth={2}
                                            dot={false}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{strategy}</p>

                        {(triggers.length > 0 || contexts.length > 0) && (
                            <div className="flex flex-wrap gap-1">
                                {triggers.map(trigger => (
                                    <Badge key={trigger} variant="secondary" className="text-[10px] py-0 px-1.5 h-4">
                                        {trigger}
                                    </Badge>
                                ))}
                                {contexts.map(context => (
                                    <Badge key={context} variant="outline" className="text-[10px] py-0 px-1.5 h-4">
                                        {context}
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="space-y-2.5">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <p className="text-[10px] text-muted-foreground mb-0.5 leading-tight">30d Return</p>
                            <div className="flex items-center gap-1">
                                {pnl >= 0 ? (
                                    <TrendingUp className="h-3.5 w-3.5 text-accent" />
                                ) : (
                                    <TrendingDown className="h-3.5 w-3.5 text-destructive" />
                                )}
                                <p className={`text-lg font-bold leading-tight ${pnl >= 0 ? 'text-accent' : 'text-destructive'}`}>
                                    {pnl >= 0 ? '+' : ''}{pnl.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                        </div>

                        <div>
                            <p className="text-[10px] text-muted-foreground mb-0.5 leading-tight">Min Deposit</p>
                            <p className="text-lg font-bold leading-tight">${minDeposit}</p>
                        </div>

                        <div className="col-span-2">
                            <p className="text-[10px] text-muted-foreground mb-0.5 leading-tight">Fee Structure</p>
                            <p className="text-sm font-medium leading-tight">{feeStructure}</p>
                        </div>
                    </div>

                    <div className="flex gap-1.5 pt-1">
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-8 text-xs"
                            onClick={(e) => {
                                e.stopPropagation()
                                router.push(`/agent/${id}`)
                            }}
                        >
                            View Details
                        </Button>
                        <Button
                            size="sm"
                            className="flex-1 h-8 text-xs gap-1"
                            onClick={(e) => {
                                e.stopPropagation()
                                setShowDelegationModal(true)
                            }}
                        >
                            <Users className="h-3 w-3" />
                            Join Squad
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <DelegationModal
                isOpen={showDelegationModal}
                onClose={() => setShowDelegationModal(false)}
                onDelegate={(amount) => {
                    console.log(`Delegated ${amount} USDC to agent ${id}`)
                }}
                agentName={name}
                agentId={id}
                memecoin={memecoin}
                operatorFee={operatorFee}
                currentAPY={currentAPY}
                totalDelegated={totalDeposits}
                maxDelegation={maxDelegation}
            />
        </>
    )
}
