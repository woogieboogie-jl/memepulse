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
import { Medal, TrendingUp } from 'lucide-react'
import { AgentCardProps } from './agent-card'

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

export function AgentRankingTable({ agents }: AgentRankingTableProps) {
  const router = useRouter()

  // Get top 5 agents sorted by total P&L
  const topAgents = [...agents]
    .sort((a, b) => b.pnl - a.pnl)
    .slice(0, 5)

  const handleRowClick = (agentId: string) => {
    router.push(`/agent/${agentId}`)
  }

  return (
    <Card className="h-full flex flex-col">
      <CardContent className="p-6 flex flex-col flex-1">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl font-bold mb-1 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Top Agents
            </CardTitle>
          </div>
        </div>
        <div className="flex-1 flex flex-col">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Rank</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead className="text-right">P&L</TableHead>
                <TableHead className="text-right">Sharpe</TableHead>
                <TableHead className="text-right">Win Rate</TableHead>
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
                      <span className={agent.pnl >= 0 ? 'text-accent' : 'text-destructive'}>
                        {agent.pnl >= 0 ? '+' : ''}${agent.pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline">
                        {(agent.sharpeRatio ?? 0).toFixed(2)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm">{(agent.winRate ?? 0).toFixed(1)}%</span>
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

