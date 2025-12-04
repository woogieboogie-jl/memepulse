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
import { getPublicAgents } from '@/lib/agents-data'
import { Search, Sparkles, TrendingUp, Activity } from 'lucide-react'
import { useState } from 'react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

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

export default function MarketplacePage() {
  const [sortBy, setSortBy] = useState('social')
  const [searchQuery, setSearchQuery] = useState('')
  const [showKOLOnly, setShowKOLOnly] = useState(false)
  const [selectedMemecoin, setSelectedMemecoin] = useState('ALL')

  const publicAgents = getPublicAgents()

  // Filter by memecoin
  const filteredByMemecoin = selectedMemecoin === 'ALL'
    ? publicAgents
    : publicAgents.filter(agent => agent.memecoin === selectedMemecoin)

  // Sort agents
  const sortedAgents = [...filteredByMemecoin].sort((a, b) => {
    switch (sortBy) {
      case 'social':
        return (b.socialScore || 0) - (a.socialScore || 0)
      case 'hottest':
        // Hottest = combination of social score + mTokensMined
        const scoreA = (a.socialScore || 0) + ((a.mTokensMined || 0) / 100)
        const scoreB = (b.socialScore || 0) + ((b.mTokensMined || 0) / 100)
        return scoreB - scoreA
      case 'sharpe':
        return (b.sharpeRatio || 0) - (a.sharpeRatio || 0)
      case 'deposits':
        return (b.totalDeposits || 0) - (a.totalDeposits || 0)
      case 'winrate':
        return (b.winRate || 0) - (a.winRate || 0)
      case 'pnl':
        return b.pnl - a.pnl
      default:
        return 0
    }
  })

  // Apply KOL and search filters
  const filteredAgents = sortedAgents.filter(agent => {
    if (showKOLOnly && !agent.isKOL) return false
    return agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.strategy.toLowerCase().includes(searchQuery.toLowerCase())
  })

  // Group by memecoin for display
  const groupedAgents: Record<string, typeof filteredAgents> = {}
  filteredAgents.forEach(agent => {
    const memecoin = agent.memecoin || 'OTHER'
    if (!groupedAgents[memecoin]) {
      groupedAgents[memecoin] = []
    }
    groupedAgents[memecoin].push(agent)
  })

  return (
    <div className="min-h-screen bg-background/80 backdrop-blur-sm">
      <NavHeader />

      <main className="container mx-auto px-4 py-4">
        <div className="w-full max-w-6xl mx-auto">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Marketplace</h1>
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
              <AgentRankingTable agents={publicAgents} />
            </div>
          </div>

          {/* Memecoin Filter Tabs */}
          <div className="mb-6">
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {MEMECOIN_CATEGORIES.map((category) => {
                const count = category.symbol === 'ALL'
                  ? publicAgents.length
                  : publicAgents.filter(a => a.memecoin === category.symbol).length

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
                placeholder="Search agents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className={`h-4 w-4 ${showKOLOnly ? 'text-purple-500' : 'text-muted-foreground'}`} />
                <Label htmlFor="kol-filter" className="text-sm font-medium cursor-pointer">
                  KOL Only
                </Label>
                <Switch
                  id="kol-filter"
                  checked={showKOLOnly}
                  onCheckedChange={setShowKOLOnly}
                  aria-label="Filter to show only KOL agents"
                  className="data-[state=checked]:bg-purple-500 data-[state=checked]:hover:bg-purple-600"
                />
              </div>
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

          {/* Grouped Agent Display */}
          {selectedMemecoin === 'ALL' ? (
            // Show grouped by memecoin
            <div className="space-y-8">
              {Object.entries(groupedAgents).map(([memecoin, agents]) => {
                const category = MEMECOIN_CATEGORIES.find(c => c.symbol === memecoin)
                const avgSocialScore = Math.round(
                  agents.reduce((sum, a) => sum + (a.socialScore || 0), 0) / agents.length
                )

                return (
                  <div key={memecoin}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{category?.emoji || '🪙'}</span>
                        <div>
                          <h2 className="text-xl font-bold">{category?.name || memecoin} Agents</h2>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Activity className="h-3 w-3" />
                            <span>Avg Social Pulse: {avgSocialScore}/100</span>
                            <Badge variant="outline" className="text-[10px]">
                              {agents.length} agents
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      {agents.map((agent) => (
                        <MarketplaceCard
                          key={agent.id}
                          {...agent}
                          winRate={agent.winRate || 0}
                          sharpeRatio={agent.sharpeRatio || 0}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            // Show flat list for selected memecoin
            <div className="grid gap-3 md:grid-cols-2">
              {filteredAgents.map((agent) => (
                <MarketplaceCard
                  key={agent.id}
                  {...agent}
                  winRate={agent.winRate || 0}
                  sharpeRatio={agent.sharpeRatio || 0}
                />
              ))}
            </div>
          )}

          {filteredAgents.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Search className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-xl font-semibold">No agents found</h3>
                <p className="text-center text-muted-foreground">
                  Try adjusting your search or filters
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
