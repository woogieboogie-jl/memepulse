'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { ArrowUpDown, TrendingUp, Target, Zap } from 'lucide-react'
import { allAgentsData } from '@/lib/agents-data'
import type { Agent } from '@/lib/agents-data'
import { getTimeAgo } from '@/lib/feed-stats'

interface AgentFeedTableProps {
    agents: Agent[]
    symbol: string
}

type SortField = 'updates' | 'accuracy' | 'lastActive' | 'mined'

export function AgentFeedTable({ agents, symbol }: AgentFeedTableProps) {
    const router = useRouter()
    const [sortField, setSortField] = useState<SortField>('updates')
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

    // Mock data for demonstration (in real app, this would come from agent oracleStats)
    const getAgentStats = (agentId: string) => {
        const hash = agentId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
        return {
            updates: 50 + (hash % 300),
            accuracy: 90 + (hash % 10),
            lastActive: new Date(Date.now() - (hash % 60) * 60 * 1000).toISOString(),
            mined: (hash % 100) + 50,
        }
    }

    // Sort agents
    const sortedAgents = [...agents].sort((a, b) => {
        const statsA = getAgentStats(a.id)
        const statsB = getAgentStats(b.id)

        let comparison = 0
        switch (sortField) {
            case 'updates':
                comparison = statsB.updates - statsA.updates
                break
            case 'accuracy':
                comparison = statsB.accuracy - statsA.accuracy
                break
            case 'lastActive':
                comparison = new Date(statsB.lastActive).getTime() - new Date(statsA.lastActive).getTime()
                break
            case 'mined':
                comparison = statsB.mined - statsA.mined
                break
        }

        return sortDirection === 'desc' ? comparison : -comparison
    })

    const toggleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc')
        } else {
            setSortField(field)
            setSortDirection('desc')
        }
    }

    if (agents.length === 0) {
        return (
            <Card>
                <CardContent className="pt-6 text-center py-12">
                    <div className="text-4xl mb-4">🤖</div>
                    <h3 className="text-lg font-semibold mb-2">No Agents Yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        Be the first to deploy an agent for the {symbol} oracle feed!
                    </p>
                    <Button onClick={() => router.push(`/create?memecoin=${symbol}`)}>
                        Deploy Agent
                    </Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>Registered Agents ({agents.length})</CardTitle>
                    <Select value={sortField} onValueChange={(value) => setSortField(value as SortField)}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Sort by..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="updates">
                                <div className="flex items-center gap-2">
                                    <Zap className="h-4 w-4" />
                                    Updates
                                </div>
                            </SelectItem>
                            <SelectItem value="accuracy">
                                <div className="flex items-center gap-2">
                                    <Target className="h-4 w-4" />
                                    Accuracy
                                </div>
                            </SelectItem>
                            <SelectItem value="mined">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4" />
                                    $M Mined
                                </div>
                            </SelectItem>
                            <SelectItem value="lastActive">Last Active</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent>
                {/* Desktop Table */}
                <div className="hidden md:block rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12">#</TableHead>
                                <TableHead>Agent</TableHead>
                                <TableHead>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8"
                                        onClick={() => toggleSort('updates')}
                                    >
                                        Updates
                                        <ArrowUpDown className="ml-2 h-3 w-3" />
                                    </Button>
                                </TableHead>
                                <TableHead>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8"
                                        onClick={() => toggle Sort('accuracy')}
                  >
                                    Accuracy
                                    <ArrowUpDown className="ml-2 h-3 w-3" />
                                </Button>
                            </TableHead>
                            <TableHead>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8"
                                    onClick={() => toggleSort('mined')}
                                >
                                    $M Mined
                                    <ArrowUpDown className="ml-2 h-3 w-3" />
                                </Button>
                            </TableHead>
                            <TableHead>Last Active</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedAgents.map((agent, index) => {
                            const stats = getAgentStats(agent.id)
                            return (
                                <TableRow key={agent.id} className="cursor-pointer hover:bg-muted/50">
                                    <TableCell className="font-medium">
                                        {index + 1}
                                        {index < 3 && (
                                            <span className="ml-1">
                                                {index === 0 && '🥇'}
                                                {index === 1 && '🥈'}
                                                {index === 2 && '🥉'}
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl">{agent.emoji}</span>
                                            <span className="font-semibold">{agent.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{stats.updates}</TableCell>
                                    <TableCell>
                                        <Badge variant={stats.accuracy >= 95 ? 'default' : 'secondary'}>
                                            {stats.accuracy.toFixed(1)}%
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="font-semibold text-primary">
                                        {stats.mined} $M
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {getTimeAgo(stats.lastActive)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => router.push(`/agent/${agent.id}`)}
                                        >
                                            View Agent
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
                {sortedAgents.map((agent, index) => {
                    const stats = getAgentStats(agent.id)
                    return (
                        <div
                            key={agent.id}
                            className="p-4 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer"
                            onClick={() => router.push(`/agent/${agent.id}`)}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-muted-foreground">#{index + 1}</span>
                                    <span className="text-2xl">{agent.emoji}</span>
                                    <span className="font-semibold">{agent.name}</span>
                                </div>
                                {index < 3 && (
                                    <span className="text-xl">
                                        {index === 0 && '🥇'}
                                        {index === 1 && '🥈'}
                                        {index === 2 && '🥉'}
                                    </span>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <div className="text-muted-foreground">Updates</div>
                                    <div className="font-semibold">{stats.updates}</div>
                                </div>
                                <div>
                                    <div className="text-muted-foreground">Accuracy</div>
                                    <Badge variant={stats.accuracy >= 95 ? 'default' : 'secondary'}>
                                        {stats.accuracy.toFixed(1)}%
                                    </Badge>
                                </div>
                                <div>
                                    <div className="text-muted-foreground">$M Mined</div>
                                    <div className="font-semibold text-primary">{stats.mined} $M</div>
                                </div>
                                <div>
                                    <div className="text-muted-foreground">Last Active</div>
                                    <div className="text-xs">{getTimeAgo(stats.lastActive)}</div>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </CardContent>
    </Card >
  )
}
