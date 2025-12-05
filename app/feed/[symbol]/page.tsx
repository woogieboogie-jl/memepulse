'use client'

import { notFound } from 'next/navigation'
import { NavHeader } from '@/components/nav-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    getFeedContract,
    getMemecoinEmoji,
    getMemecoinName
} from '@/lib/memecoin-contracts'
import { getFeedStats, getTimeAgo } from '@/lib/feed-stats'
import {
    Activity,
    Users,
    Zap,
    Target,
    TrendingUp,
    ExternalLink,
    Copy,
    CheckCircle2
} from 'lucide-react'
import { useState } from 'react'

export default function FeedPage({ params }: { params: { symbol: string } }) {
    const symbol = params.symbol.toUpperCase()
    const [copied, setCopied] = useState(false)

    // Get contract and feed data
    const contract = getFeedContract(symbol)
    const feedStats = getFeedStats(symbol)

    if (!contract || !feedStats) {
        notFound()
    }

    const copyAddress = () => {
        navigator.clipboard.writeText(contract.contractAddress)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const isLive = new Date().getTime() - new Date(feedStats.lastUpdate).getTime() < 10 * 60 * 1000

    return (
        <div className="min-h-screen bg-background/80 backdrop-blur-sm">
            <NavHeader />

            <main className="container mx-auto px-4 py-8">
                <div className="max-w-6xl mx-auto space-y-6">

                    {/* Hero Section */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    <span className="text-6xl">{getMemecoinEmoji(symbol)}</span>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h1 className="text-3xl font-bold font-pixel">{symbol} Pulse Oracle</h1>
                                            {isLive && (
                                                <Badge variant="default" className="bg-green-500 animate-pulse">
                                                    <Activity className="h-3 w-3 mr-1" />
                                                    Live
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-muted-foreground">{getMemecoinName(symbol)} Social Pulse Feed</p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {feedStats.updatesToday} updates today • Last update: {getTimeAgo(feedStats.lastUpdate)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Contract Info */}
                            <div className="mt-6 pt-6 border-t border-border space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-muted-foreground">Contract Address:</span>
                                        <div className="flex items-center gap-2 mt-1">
                                            <code className="bg-muted px-2 py-1 rounded font-mono text-xs break-all">
                                                {contract.contractAddress}
                                            </code>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-8 w-8 p-0"
                                                onClick={copyAddress}
                                            >
                                                {copied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Network:</span>
                                        <p className="font-medium mt-1">{contract.network} (Chain ID: {contract.chainId})</p>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">RPC URL:</span>
                                        <code className="block bg-muted px-2 py-1 rounded font-mono text-xs mt-1">
                                            {contract.rpcUrl}
                                        </code>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Update Frequency:</span>
                                        <p className="font-medium mt-1">{contract.updateFrequency}</p>
                                    </div>
                                </div>
                                <Button variant="outline" size="sm" className="gap-2">
                                    <ExternalLink className="h-4 w-4" />
                                    View on MemeCore Explorer
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Feed Health Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex flex-col items-center text-center">
                                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                                        <Users className="h-6 w-6 text-primary" />
                                    </div>
                                    <p className="text-3xl font-bold mb-1">{feedStats.totalAgents}</p>
                                    <p className="text-xs text-muted-foreground">Active Agents</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex flex-col items-center text-center">
                                    <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center mb-3">
                                        <Zap className="h-6 w-6 text-accent" />
                                    </div>
                                    <p className="text-3xl font-bold mb-1">{feedStats.updatesToday}</p>
                                    <p className="text-xs text-muted-foreground">Updates Today</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex flex-col items-center text-center">
                                    <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center mb-3">
                                        <Target className="h-6 w-6 text-green-500" />
                                    </div>
                                    <p className="text-3xl font-bold mb-1">{feedStats.averageAccuracy}%</p>
                                    <p className="text-xs text-muted-foreground">Avg Accuracy</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex flex-col items-center text-center">
                                    <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
                                        <TrendingUp className="h-6 w-6 text-destructive" />
                                    </div>
                                    <p className="text-3xl font-bold mb-1">{feedStats.currentPulse}/100</p>
                                    <p className="text-xs text-muted-foreground">Current Pulse</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Top Contributors */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Top Contributors</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {feedStats.topContributors.map((contributor, index) => (
                                    <div
                                        key={contributor.agentId}
                                        className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                                                #{index + 1}
                                            </div>
                                            <div>
                                                <p className="font-semibold">{contributor.agentName}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {contributor.updates} updates • {contributor.accuracy}% accuracy
                                                </p>
                                            </div>
                                        </div>
                                        <Button variant="outline" size="sm">
                                            View Agent
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Coming Soon Section */}
                    <Card className="border-dashed">
                        <CardContent className="pt-6 text-center py-12">
                            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">More Features Coming Soon</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Agent registry, live update feed, and analytics charts will be available in the next update
                            </p>
                        </CardContent>
                    </Card>

                </div>
            </main>
        </div>
    )
}
