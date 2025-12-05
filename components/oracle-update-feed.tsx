'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Activity, TrendingUp, TrendingDown, ExternalLink, RefreshCw } from 'lucide-react'
import { getRecentUpdates, OracleUpdate } from '@/lib/oracle-updates'
import { getTimeAgo } from '@/lib/feed-stats'

interface OracleUpdateFeedProps {
    symbol: string
    limit?: number
}

export function OracleUpdateFeed({ symbol, limit = 50 }: OracleUpdateFeedProps) {
    const [updates, setUpdates] = useState<OracleUpdate[]>([])
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [lastRefresh, setLastRefresh] = useState(new Date())

    // Load initial data
    useEffect(() => {
        setUpdates(getRecentUpdates(symbol, limit))
    }, [symbol, limit])

    // Auto-refresh every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setUpdates(getRecentUpdates(symbol, limit))
            setLastRefresh(new Date())
        }, 30000) // 30 seconds

        return () => clearInterval(interval)
    }, [symbol, limit])

    const handleRefresh = () => {
        setIsRefreshing(true)
        setUpdates(getRecentUpdates(symbol, limit))
        setLastRefresh(new Date())
        setTimeout(() => setIsRefreshing(false), 500)
    }

    const getMemeCoreTxUrl = (txHash: string) => {
        return `https://formicarium.memecorescan.io/tx/${txHash}`
    }

    const getPulseChangeColor = (prev: number, curr: number) => {
        if (curr > prev) return 'text-green-500'
        if (curr < prev) return 'text-red-500'
        return 'text-muted-foreground'
    }

    const getPulseChangeIcon = (prev: number, curr: number) => {
        if (curr > prev) return <TrendingUp className="h-3 w-3" />
        if (curr < prev) return <TrendingDown className="h-3 w-3" />
        return null
    }

    return (
        <Card className="h-fit sticky top-4">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">Live Updates</CardTitle>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="h-8 w-8 p-0"
                    >
                        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                    Last updated: {getTimeAgo(lastRefresh.toISOString())}
                </p>
            </CardHeader>
            <CardContent className="max-h-[600px] overflow-y-auto space-y-3 scrollbar-thin">
                {updates.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No recent updates</p>
                    </div>
                ) : (
                    updates.map((update) => (
                        <div
                            key={update.id}
                            className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                        >
                            {/* Header: Agent + Time */}
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold truncate">{update.agentName}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {getTimeAgo(update.timestamp)}
                                    </p>
                                </div>
                                <Badge
                                    variant={update.status === 'success' ? 'default' : update.status === 'pending' ? 'secondary' : 'destructive'}
                                    className="text-[10px]"
                                >
                                    {update.status === 'success' && '✓'}
                                    {update.status === 'pending' && '⏳'}
                                    {update.status === 'failed' && '✗'}
                                </Badge>
                            </div>

                            {/* Pulse Change */}
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs text-muted-foreground">Pulse:</span>
                                <div className="flex items-center gap-1">
                                    <span className="text-sm font-mono">{update.previousPulse}</span>
                                    <span className="text-xs text-muted-foreground">→</span>
                                    <span className={`text-sm font-mono font-semibold flex items-center gap-1 ${getPulseChangeColor(update.previousPulse, update.newPulse)}`}>
                                        {update.newPulse}
                                        {getPulseChangeIcon(update.previousPulse, update.newPulse)}
                                    </span>
                                </div>
                            </div>

                            {/* Transaction Hash */}
                            <div className="flex items-center gap-1">
                                <span className="text-[10px] text-muted-foreground">Tx:</span>
                                <a
                                    href={getMemeCoreTxUrl(update.txHash)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[10px] font-mono text-primary hover:underline flex items-center gap-1"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {update.txHash}
                                    <ExternalLink className="h-2.5 w-2.5" />
                                </a>
                            </div>
                        </div>
                    ))
                )}
            </CardContent>
        </Card>
    )
}
