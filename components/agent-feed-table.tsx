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
import { useAgentUpdateCount, useCredibility, useMiningStats } from '@/hooks/use-contracts'

interface AgentFeedTableProps {
    agents: Agent[]
    symbol: string
}

type SortField = 'updates' | 'credibility' | 'volume' | 'lastActive'

// Individual row component that fetches real data
function AgentRow({ 
    agent, 
    index, 
    onViewAgent 
}: { 
    agent: Agent
    index: number
    onViewAgent: (id: string) => void 
}) {
    // Get agent address from allAgentsData (if available)
    const agentData = allAgentsData[agent.id]
    const agentAddress = agentData?.address

    // Fetch real data from contracts
    const { updateCount, isLoading: updatesLoading } = useAgentUpdateCount(agentAddress)
    const { credibility, isLoading: credLoading } = useCredibility(agentAddress)
    const { volume, isLoading: volumeLoading } = useMiningStats(agentAddress)

    const isLoading = updatesLoading || credLoading || volumeLoading

    return (
        <TableRow className="cursor-pointer hover:bg-muted/50">
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
            <TableCell>
                {isLoading ? (
                    <span className="text-muted-foreground animate-pulse">...</span>
                ) : (
                    updateCount || '-'
                )}
            </TableCell>
            <TableCell>
                {isLoading ? (
                    <span className="text-muted-foreground animate-pulse">...</span>
                ) : (
                    <Badge variant={credibility >= 60 ? 'default' : 'secondary'}>
                        {credibility > 0 ? `${credibility.toFixed(0)}%` : '-'}
                    </Badge>
                )}
            </TableCell>
            <TableCell className="font-semibold text-primary">
                {isLoading ? (
                    <span className="text-muted-foreground animate-pulse">...</span>
                ) : (
                    volume > 0 ? `$${volume.toLocaleString()}` : '-'
                )}
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
                {updateCount > 0 ? 'Active' : 'No data'}
            </TableCell>
            <TableCell className="text-right">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewAgent(agent.id)}
                >
                    View Agent
                </Button>
            </TableCell>
        </TableRow>
    )
}

// Mobile card component
function AgentMobileCard({ 
    agent, 
    index, 
    onViewAgent 
}: { 
    agent: Agent
    index: number
    onViewAgent: (id: string) => void 
}) {
    const agentData = allAgentsData[agent.id]
    const agentAddress = agentData?.address

    const { updateCount, isLoading: updatesLoading } = useAgentUpdateCount(agentAddress)
    const { credibility, isLoading: credLoading } = useCredibility(agentAddress)
    const { volume, isLoading: volumeLoading } = useMiningStats(agentAddress)

    const isLoading = updatesLoading || credLoading || volumeLoading

    return (
        <div
            className="p-4 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer"
            onClick={() => onViewAgent(agent.id)}
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
                    <div className="font-semibold">
                        {isLoading ? '...' : (updateCount || '-')}
                    </div>
                </div>
                <div>
                    <div className="text-muted-foreground">Credibility</div>
                    {isLoading ? (
                        <span className="text-muted-foreground">...</span>
                    ) : (
                        <Badge variant={credibility >= 60 ? 'default' : 'secondary'}>
                            {credibility > 0 ? `${credibility.toFixed(0)}%` : '-'}
                        </Badge>
                    )}
                </div>
                <div>
                    <div className="text-muted-foreground">Volume</div>
                    <div className="font-semibold text-primary">
                        {isLoading ? '...' : (volume > 0 ? `$${volume.toLocaleString()}` : '-')}
                    </div>
                </div>
                <div>
                    <div className="text-muted-foreground">Status</div>
                    <div className="text-xs">
                        {updateCount > 0 ? 'Active' : 'No data'}
                    </div>
                </div>
            </div>
        </div>
    )
}

export function AgentFeedTable({ agents, symbol }: AgentFeedTableProps) {
    const router = useRouter()
    const [sortField, setSortField] = useState<SortField>('updates')
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

    const handleViewAgent = (agentId: string) => {
        router.push(`/agent/${agentId}`)
    }

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
                            <SelectItem value="credibility">
                                <div className="flex items-center gap-2">
                                    <Target className="h-4 w-4" />
                                    Credibility
                                </div>
                            </SelectItem>
                            <SelectItem value="volume">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4" />
                                    Volume
                                </div>
                            </SelectItem>
                            <SelectItem value="lastActive">Status</SelectItem>
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
                                        onClick={() => toggleSort('credibility')}
                                    >
                                        Credibility
                                        <ArrowUpDown className="ml-2 h-3 w-3" />
                                    </Button>
                                </TableHead>
                                <TableHead>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8"
                                        onClick={() => toggleSort('volume')}
                                    >
                                        Volume
                                        <ArrowUpDown className="ml-2 h-3 w-3" />
                                    </Button>
                                </TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {agents.map((agent, index) => (
                                <AgentRow
                                    key={agent.id}
                                    agent={agent}
                                    index={index}
                                    onViewAgent={handleViewAgent}
                                />
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                    {agents.map((agent, index) => (
                        <AgentMobileCard
                            key={agent.id}
                            agent={agent}
                            index={index}
                            onViewAgent={handleViewAgent}
                        />
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
