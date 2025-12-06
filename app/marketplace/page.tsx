'use client'

import { NavHeader } from '@/components/nav-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AgentComparisonChart } from '@/components/agent-comparison-chart'
import { AgentRankingTable } from '@/components/agent-ranking-table'
import { MarketplaceCard } from '@/components/marketplace-card'
import { getSupportedMemecoins, getMemecoinEmoji, getMemecoinName } from '@/lib/contracts'
import { useAgentsForFeed } from '@/hooks/use-contracts'
import { Search, TrendingUp, Activity, Loader2 } from 'lucide-react'
import { useState, useMemo } from 'react'

// Memecoin categories with emoji
const MEMECOIN_CATEGORIES = [
  { symbol: 'ALL', name: 'All Memes', emoji: '🌐' },
  { symbol: 'DOGE', name: 'Dogecoin', emoji: '🐕' },
  { symbol: 'PEPE', name: 'Pepe', emoji: '🐸' },
  { symbol: 'SHIB', name: 'Shiba Inu', emoji: '🐕‍🦺' },
  { symbol: 'FLOKI', name: 'Floki', emoji: '🐺' },
  { symbol: 'WIF', name: 'dogwifhat', emoji: '🎩' },
  { symbol: 'BONK', name: 'Bonk', emoji: '💥' },
  { symbol: 'BTC', name: 'Bitcoin', emoji: '₿' },
]

// Component to fetch and display agents for a single feed
function FeedAgentsSection({ 
  feedSymbol, 
  searchQuery 
}: { 
  feedSymbol: string
  searchQuery: string 
}) {
  const { agents, isLoading } = useAgentsForFeed(feedSymbol)
  const category = MEMECOIN_CATEGORIES.find(c => c.symbol === feedSymbol)

  // Build agent data from on-chain addresses
  const agentCards = useMemo(() => {
    return agents.map((address, index) => ({
      id: `${feedSymbol}-${address}-${index}`,
      name: `${feedSymbol} Agent #${index + 1}`,
      strategy: 'On-chain oracle agent',
      funded: 0,
      pnl: 0,
      winRate: 0,
      sharpeRatio: 0,
      memecoin: feedSymbol,
      address,
      performanceData: [],
      triggers: [],
      contexts: [],
      symbol: feedSymbol,
    }))
  }, [agents, feedSymbol])

  // Filter by search
  const filteredAgents = agentCards.filter(agent => 
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.address.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (filteredAgents.length === 0) {
    return null
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{category?.emoji || getMemecoinEmoji(feedSymbol)}</span>
          <div>
            <h2 className="text-xl font-bold">{category?.name || getMemecoinName(feedSymbol)} Agents</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Activity className="h-3 w-3" />
              <Badge variant="outline" className="text-[10px]">
                {filteredAgents.length} agent{filteredAgents.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          </div>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-2">
        {filteredAgents.map((agent) => (
          <MarketplaceCard
            key={agent.id}
            {...agent}
            address={agent.address}
            winRate={agent.winRate || 0}
            sharpeRatio={agent.sharpeRatio || 0}
          />
        ))}
      </div>
    </div>
  )
}

export default function MarketplacePage() {
  const [sortBy, setSortBy] = useState('social')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMemecoin, setSelectedMemecoin] = useState('ALL')

  // Get supported memecoins from contracts
  const supportedMemecoins = getSupportedMemecoins()

  // Fetch agent counts for all feeds (for category badges)
  const dogeAgents = useAgentsForFeed('DOGE')
  const pepeAgents = useAgentsForFeed('PEPE')
  const shibAgents = useAgentsForFeed('SHIB')
  const flokiAgents = useAgentsForFeed('FLOKI')
  const wifAgents = useAgentsForFeed('WIF')
  const bonkAgents = useAgentsForFeed('BONK')
  const btcAgents = useAgentsForFeed('BTC')

  const agentCounts: Record<string, number> = {
    DOGE: dogeAgents.agentCount,
    PEPE: pepeAgents.agentCount,
    SHIB: shibAgents.agentCount,
    FLOKI: flokiAgents.agentCount,
    WIF: wifAgents.agentCount,
    BONK: bonkAgents.agentCount,
    BTC: btcAgents.agentCount,
  }

  const totalAgentCount = Object.values(agentCounts).reduce((sum, count) => sum + count, 0)

  // For ranking table, build a flat list of all agents
  const allAgents = useMemo(() => {
    const all: any[] = []
    const feedsData = [
      { symbol: 'DOGE', agents: dogeAgents.agents },
      { symbol: 'PEPE', agents: pepeAgents.agents },
      { symbol: 'SHIB', agents: shibAgents.agents },
      { symbol: 'FLOKI', agents: flokiAgents.agents },
      { symbol: 'WIF', agents: wifAgents.agents },
      { symbol: 'BONK', agents: bonkAgents.agents },
      { symbol: 'BTC', agents: btcAgents.agents },
    ]
    
    feedsData.forEach(({ symbol, agents }) => {
      agents.forEach((address, index) => {
        all.push({
          id: `${symbol}-${address}-${index}`,
          name: `${symbol} Agent #${index + 1}`,
          strategy: 'On-chain oracle agent',
          funded: 0,
          pnl: 0,
          winRate: 0,
          sharpeRatio: 0,
          memecoin: symbol,
          address,
          performanceData: [],
          triggers: [],
          contexts: [],
        })
      })
    })
    return all
  }, [dogeAgents.agents, pepeAgents.agents, shibAgents.agents, flokiAgents.agents, wifAgents.agents, bonkAgents.agents, btcAgents.agents])

  // Determine which feeds to show
  const feedsToShow = selectedMemecoin === 'ALL' 
    ? supportedMemecoins 
    : [selectedMemecoin]

  return (
    <div className="min-h-screen bg-background/80 backdrop-blur-sm">
      <NavHeader />

      <main className="container mx-auto px-4 py-4">
        <div className="w-full max-w-6xl mx-auto">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold font-pixel">Marketplace</h1>
              <p className="text-sm text-muted-foreground">
                Discover and invest in top-performing memecoin pulse agents
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3 mb-8 items-stretch">
            <div className="md:col-span-2">
              <AgentComparisonChart />
            </div>
            <div className="md:col-span-1">
              <AgentRankingTable agents={allAgents} />
            </div>
          </div>

          {/* Memecoin Filter Tabs */}
          <div className="mb-6">
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {MEMECOIN_CATEGORIES.map((category) => {
                const count = category.symbol === 'ALL'
                  ? totalAgentCount
                  : agentCounts[category.symbol] || 0

                return (
                  <Button
                    key={category.symbol}
                    variant={selectedMemecoin === category.symbol ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedMemecoin(category.symbol)}
                    className="flex-shrink-0 gap-2"
                  >
                    <span className="text-base">{category.emoji}</span>
                    <span>{category.name}</span>
                    <Badge variant="secondary" className="text-[10px] ml-1">
                      {count}
                    </Badge>
                  </Button>
                )
              })}
            </div>
          </div>

          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search agents by name or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Sort by:</span>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="social">
                      <div className="flex items-center gap-2">
                        <Activity className="h-3 w-3" />
                        Social Pulse
                      </div>
                    </SelectItem>
                    <SelectItem value="hottest">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-3 w-3" />
                        Hottest Memes
                      </div>
                    </SelectItem>
                    <SelectItem value="sharpe">Sharpe Ratio</SelectItem>
                    <SelectItem value="deposits">Total Deposits</SelectItem>
                    <SelectItem value="winrate">Win Rate</SelectItem>
                    <SelectItem value="pnl">Total P&L</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Agent Display - Grouped by Feed */}
          <div className="space-y-8">
            {feedsToShow.map((feed) => (
              <FeedAgentsSection 
                key={feed} 
                feedSymbol={feed} 
                searchQuery={searchQuery}
              />
            ))}
          </div>

          {totalAgentCount === 0 && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Search className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-xl font-semibold">No agents registered</h3>
                <p className="text-center text-muted-foreground">
                  No agents have been registered for any feed yet.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
