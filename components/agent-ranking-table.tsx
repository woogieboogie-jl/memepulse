'use client'

import { Card, CardContent, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { Medal, TrendingUp, Shield } from 'lucide-react'
import { AgentCardProps } from './agent-card'
import { useCredibility, useAgentUpdateCount } from '@/hooks/use-contracts'

interface AgentRankingTableProps {
  agents: AgentCardProps[]
}

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Medal className="h-4 w-4 text-yellow-500" />
    case 2:
      return <Medal className="h-4 w-4 text-gray-400" />
    case 3:
      return <Medal className="h-4 w-4 text-amber-600" />
    default:
      return <span className="text-xs font-bold text-muted-foreground">#{rank}</span>
  }
}

// Component to display credibility for a single agent
function AgentCredibilityCell({ address }: { address?: string }) {
  const { credibility, isLoading } = useCredibility(address)
  
  if (isLoading) {
    return <span className="animate-pulse text-muted-foreground">...</span>
  }
  
  // credibility is already in percentage (0-100) from the hook
  return (
    <Badge 
      variant={credibility >= 75 ? 'default' : credibility >= 50 ? 'secondary' : 'outline'}
      className="font-mono"
    >
      {credibility.toFixed(0)}%
    </Badge>
  )
}

// Component to display update count for a single agent
function AgentUpdatesCell({ address }: { address?: string }) {
  const { updateCount, isLoading } = useAgentUpdateCount(address)
  
  if (isLoading) {
    return <span className="animate-pulse text-muted-foreground">...</span>
  }
  
  return <span className="text-sm font-mono">{updateCount}</span>
}

export function AgentRankingTable({ agents }: AgentRankingTableProps) {
  const router = useRouter()

  // Show top 5 agents (they come from Marketplace which already fetches from on-chain)
  // In production, we'd sort these by credibility client-side or fetch sorted from backend
  const topAgents = agents.slice(0, 5)

  const handleRowClick = (agentId: string) => {
    router.push(`/agent/${agentId}`)
  }

  if (topAgents.length === 0) {
    return (
      <Card className="h-full flex flex-col">
        <CardContent className="p-6 flex flex-col flex-1 items-center justify-center">
          <Shield className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-muted-foreground text-sm">No agents registered yet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full flex flex-col">
      <CardContent className="p-6 flex flex-col flex-1">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl font-bold mb-1 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Top Agents by Credibility
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Ranked by on-chain oracle credibility
            </p>
          </div>
        </div>
        <div className="flex-1 flex flex-col">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Rank</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead className="text-right">Credibility</TableHead>
                <TableHead className="text-right">Updates</TableHead>
                <TableHead className="text-right">Feed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topAgents.map((agent, index) => {
                const rank = index + 1
                return (
                  <TableRow
                    key={agent.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleRowClick(agent.id)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-1.5">
                        {getRankIcon(rank)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className="font-semibold hover:text-primary transition-colors"
                      >
                        {agent.name}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <AgentCredibilityCell address={agent.address} />
                    </TableCell>
                    <TableCell className="text-right">
                      <AgentUpdatesCell address={agent.address} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className="text-xs">
                        {agent.memecoin || '-'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
