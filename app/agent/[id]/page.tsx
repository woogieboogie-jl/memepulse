'use client'

import { NavHeader } from '@/components/nav-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { X402Badge } from '@/components/x402-badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ArrowLeft, TrendingUp, TrendingDown, ExternalLink, Play, Pause, Settings, Zap, Activity, Clock, BarChart2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { getAgentBySlug } from '@/lib/agents-data'
import { useRouter, useParams } from 'next/navigation'
import { useTheme } from 'next-themes'
import { DepositModal } from '@/components/modals/deposit-modal'
import { KeyRenewalModal } from '@/components/modals/key-renewal-modal'

import { useCredibility, useMiningStats } from '@/hooks/use-contracts'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

// Helper component for empty state display
function EmptyValue({ tooltip }: { tooltip: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="text-muted-foreground cursor-help">-</span>
        </TooltipTrigger>
        <TooltipContent className="z-[9999]" side="top" sideOffset={5}>
          <p className="font-body text-xs">{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default function AgentDetailPage() {
  const { theme } = useTheme()
  const [showTxModal, setShowTxModal] = useState(false)
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [selectedTx, setSelectedTx] = useState<any>(null)
  const [agent, setAgent] = useState<ReturnType<typeof getAgentBySlug>>(undefined)
  const router = useRouter()
  const params = useParams()
  const [showRenewalModal, setShowRenewalModal] = useState(false)

  // Live Data Hooks
  const { credibility, isLoading: isCredibilityLoading } = useCredibility(agent?.address)
  const { updates, volume, hasData: hasMiningData, isLoading: isMiningLoading } = useMiningStats(agent?.address)

  // Display values with fallback
  const displaySocialScore = isCredibilityLoading ? agent?.socialScore || 0 : credibility
  const displayMined = hasMiningData ? volume : (agent?.mTokensMined || 0)
  const displayContributions = hasMiningData ? updates : (agent?.oracleContributions || 0)

  const handleTogglePause = () => {
    if (agent) {
      setAgent({
        ...agent,
        status: agent.status === 'active' ? 'paused' : 'active'
      })
    }
  }

  const handleEdit = () => {
    router.push(`/create?edit=${agent?.id}`)
  }

  // Protect page - require valid trading key
  useEffect(() => {
    const isRegistered = localStorage.getItem('orderly_registered') === 'true'
    const isKeyExpired = localStorage.getItem('orderly_key_expired') === 'true'

    if (isKeyExpired) {
      setShowRenewalModal(true)
      return
    }

    if (!isRegistered) {
      router.push('/register')
    }
  }, [router, params.id])

  const handleRenewalSuccess = () => {
    setShowRenewalModal(false)
    window.dispatchEvent(new Event('localStorageChange'))
  }

  // Theme-aware colors for charts
  const isDark = theme === 'dark'
  const chartColors = {
    grid: isDark ? '#374151' : '#e5e7eb',
    axis: isDark ? '#9ca3af' : '#6b7280',
    line: isDark ? '#a78bfa' : '#8884d8',
    tooltipBg: isDark ? '#1f2937' : '#ffffff',
    tooltipBorder: isDark ? '#374151' : '#e5e7eb',
    tooltipText: isDark ? '#f3f4f6' : '#111827',
    tooltipItem: isDark ? '#a78bfa' : '#8884d8',
  }

  useEffect(() => {
    if (params?.id && typeof params.id === 'string') {
      const agentData = getAgentBySlug(params.id)
      setAgent(agentData)
    }
  }, [params?.id])

  if (!params?.id || !agent) {
    return (
      <div className="min-h-screen bg-background/80 backdrop-blur-sm">
        <NavHeader />
        <main className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-2 mb-6">
            <Link
              href="/marketplace"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back to Marketplace
            </Link>
          </div>
          <p className="text-muted-foreground">Loading agent data...</p>
        </main>
      </div>
    )
  }

  const handleTxClick = (tx: any) => {
    setSelectedTx(tx)
    setShowTxModal(true)
  }

  const performanceData = agent?.performanceData && agent.performanceData.length > 0
    ? agent.performanceData.map(p => ({
      time: 'time' in p ? p.time : p.date,
      value: p.value
    }))
    : []

  return (
    <div className="min-h-screen bg-background/80 backdrop-blur-sm">
      <NavHeader />

      <main className="container mx-auto px-4 py-4">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6">
            <Button
              variant="ghost"
              className="mb-2 pl-0 hover:bg-transparent hover:text-primary"
              onClick={() => {
                if (agent) {
                  router.push(agent.isOwned ? "/my-agents" : "/marketplace")
                } else {
                  router.push("/marketplace")
                }
              }}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to {agent?.isOwned ? "My Agents" : "Marketplace"}
            </Button>

            {/* Memecoin Hero Section - NEW! */}
            {agent.memecoin && (
              <Card className="mb-6 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    {/* Large Memecoin Emoji */}
                    <div className="flex-shrink-0">
                      <div className="text-9xl leading-none">
                        {agent.memecoin === 'DOGE' && '🐕'}
                        {agent.memecoin === 'PEPE' && '🐸'}
                        {agent.memecoin === 'SHIB' && '🐕‍🦺'}
                        {agent.memecoin === 'FLOKI' && '🐺'}
                        {agent.memecoin === 'WIF' && '🎩'}
                        {agent.memecoin === 'BONK' && '💥'}
                        {agent.memecoin === 'BTC' && '₿'}
                      </div>
                    </div>

                    {/* Memecoin Stats */}
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Memecoin</p>
                        <p className="text-2xl font-bold text-primary">{agent.memecoin}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Social Pulse</p>
                        <div className="flex items-center gap-2">
                          <p className="text-2xl font-bold">
                            {isCredibilityLoading ? <span className="animate-pulse">...</span> : displaySocialScore}
                          </p>
                          <span className="text-sm text-muted-foreground">/100</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">wM Mined</p>
                        <p className="text-2xl font-bold text-accent">
                          {isMiningLoading ? (
                            <span className="animate-pulse">...</span>
                          ) : hasMiningData ? (
                            displayMined.toLocaleString()
                          ) : displayMined > 0 ? (
                            displayMined.toLocaleString()
                          ) : (
                            <EmptyValue tooltip="No mining activity yet" />
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Oracle Contributions</p>
                        <p className="text-2xl font-bold">
                          {isMiningLoading ? (
                            <span className="animate-pulse">...</span>
                          ) : displayContributions > 0 ? (
                            displayContributions
                          ) : (
                            <EmptyValue tooltip="No contributions yet" />
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold">{agent.name}</h1>
                  <div className="flex items-center gap-2">
                    {agent.status && (
                      <Badge variant={agent.status === 'active' ? 'default' : 'secondary'} className="h-6">
                        {agent.status === 'active' ? (
                          <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            Running
                          </div>
                        ) : 'Stopped'}
                      </Badge>
                    )}
                    <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-muted/50 border text-xs font-medium text-muted-foreground">
                      <Activity className="w-3 h-3" />
                      Heartbeat: 1m ago
                    </div>
                  </div>
                </div>

                <p className="text-muted-foreground mb-4 max-w-2xl text-lg leading-relaxed">
                  {agent.strategy}
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {agent.triggers.map(trigger => (
                    <Badge key={trigger} variant="secondary" className="px-2.5 py-1">{trigger}</Badge>
                  ))}
                  {agent.contexts.map(context => (
                    <Badge key={context} variant="outline" className="px-2.5 py-1">{context}</Badge>
                  ))}
                </div>
              </div>

              <div className="flex flex-col items-end gap-3">
                <div className="flex gap-2">
                  {agent.isOwned ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleTogglePause}
                        className="gap-2"
                      >
                        {agent.status === 'active' ? (
                          <>
                            <Pause className="h-4 w-4" />
                            Pause
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4" />
                            Resume
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleEdit}
                        className="gap-2"
                      >
                        <Settings className="h-4 w-4" />
                        Config
                      </Button>
                      <Button size="sm" onClick={() => setShowDepositModal(true)}>Add Funds</Button>
                    </>
                  ) : (
                    <Button size="sm" onClick={() => setShowDepositModal(true)}>Deposit to Agent</Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 mb-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-muted-foreground">Total Equity</p>
                  <Badge variant="outline" className="text-[10px] font-normal">USDC</Badge>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">${agent.funded.toLocaleString()}</span>
                  {agent.totalDeposits && (
                    <span className="text-xs text-muted-foreground">/ ${agent.totalDeposits.toLocaleString()} cap</span>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-muted-foreground">Total P&L</p>
                  {agent.pnl >= 0 ? <TrendingUp className="h-4 w-4 text-accent" /> : <TrendingDown className="h-4 w-4 text-destructive" />}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className={`text-2xl font-bold ${agent.pnl >= 0 ? 'text-accent' : 'text-destructive'}`}>
                    {agent.pnl >= 0 ? '+' : ''}${agent.pnl.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <span className={`text-xs ${agent.pnl >= 0 ? 'text-accent' : 'text-destructive'}`}>
                    ({((agent.pnl / (agent.funded - agent.pnl)) * 100).toFixed(1)}%)
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-muted-foreground">Sharpe Ratio</p>
                  <BarChart2 className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{(agent.sharpeRatio ?? 0).toFixed(2)}</span>
                  <Badge variant={agent.sharpeRatio > 2 ? 'default' : 'secondary'} className="text-[10px] h-5">
                    {agent.sharpeRatio > 2 ? 'Excellent' : 'Good'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-muted-foreground">Win Rate</p>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{agent.winRate ?? 0}%</span>
                  <span className="text-xs text-muted-foreground">{agent.totalTrades || 0} trades</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 mb-6 md:grid-cols-3">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Performance Chart</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  {performanceData && performanceData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={performanceData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} opacity={0.3} vertical={false} />
                        <XAxis
                          dataKey="time"
                          stroke={chartColors.axis}
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          dy={10}
                        />
                        <YAxis
                          stroke={chartColors.axis}
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          dx={-10}
                          domain={['auto', 'auto']}
                        />
                        <RechartsTooltip
                          contentStyle={{
                            backgroundColor: chartColors.tooltipBg,
                            border: `1px solid ${chartColors.tooltipBorder}`,
                            borderRadius: '8px',
                            padding: '8px 12px',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                          }}
                          labelStyle={{ color: chartColors.tooltipText, fontWeight: 'bold', marginBottom: '4px' }}
                          itemStyle={{ color: chartColors.tooltipItem }}
                        />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke={chartColors.line}
                          strokeWidth={3}
                          dot={false}
                          activeDot={{ r: 6, fill: chartColors.line, stroke: isDark ? '#1f2937' : 'white', strokeWidth: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">No performance data available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Risk Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Max Drawdown</span>
                    </div>
                    <span className="font-medium text-destructive">-{agent.maxDrawdown || 0}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Avg Hold Time</span>
                    </div>
                    <span className="font-medium">{agent.avgTradeDuration || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Total Trades</span>
                    </div>
                    <span className="font-medium">{agent.totalTrades || 0}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Leverage Cap</span>
                    <Badge variant="outline">5x</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Stop Loss</span>
                    <Badge variant="outline">Hard (-5%)</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Take Profit</span>
                    <Badge variant="outline">Trailing</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Oracle Feed Assignment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Oracle Feed Assignment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Contributing to:</p>
                  <p className="text-2xl font-bold flex items-center gap-2 mb-1">
                    {agent.memecoin} Pulse Oracle
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {displayContributions} submissions • {displayMined.toLocaleString()} wM mined
                  </p>
                </div>
                <Button asChild>
                  <Link href={`/feed/${agent.memecoin}`}>
                    View Full Feed
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="positions" className="space-y-4">
            <TabsList>
              <TabsTrigger value="positions">Positions</TabsTrigger>
              <TabsTrigger value="trades">History</TabsTrigger>
              <TabsTrigger value="reasoning">Reasoning</TabsTrigger>
              <TabsTrigger value="transactions">x402 Ledger</TabsTrigger>
            </TabsList>

            <TabsContent value="positions">
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Asset</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Entry</TableHead>
                        <TableHead>Current</TableHead>
                        <TableHead>P&L</TableHead>
                        <TableHead>Leverage</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {agent.positions.length > 0 ? (
                        agent.positions.map((pos) => (
                          <TableRow key={pos.id}>
                            <TableCell className="font-medium">{pos.asset}</TableCell>
                            <TableCell>
                              <Badge variant={pos.type === 'Long' ? 'default' : 'secondary'} className="font-normal">
                                {pos.type}
                              </Badge>
                            </TableCell>
                            <TableCell>${pos.entry.toLocaleString()}</TableCell>
                            <TableCell>${pos.current.toLocaleString()}</TableCell>
                            <TableCell className={pos.pnl >= 0 ? 'text-accent' : 'text-destructive'}>
                              {pos.pnl >= 0 ? '+' : ''}${pos.pnl}
                            </TableCell>
                            <TableCell>{pos.leverage}</TableCell>
                            <TableCell className="text-right">
                              <X402Badge onClick={() => handleTxClick({ txHash: pos.txHash, type: 'Trade' })} />
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                            No open positions
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="trades">
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Asset</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Entry</TableHead>
                        <TableHead>Exit</TableHead>
                        <TableHead>P&L</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead className="text-right">Receipt</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {agent.completedTrades.length > 0 ? (
                        agent.completedTrades.map((trade) => (
                          <TableRow key={trade.id}>
                            <TableCell className="text-xs text-muted-foreground">{trade.date}</TableCell>
                            <TableCell className="font-medium">{trade.asset}</TableCell>
                            <TableCell>
                              <Badge variant={trade.type === 'Long' ? 'default' : 'secondary'} className="font-normal">
                                {trade.type}
                              </Badge>
                            </TableCell>
                            <TableCell>${trade.entry.toLocaleString()}</TableCell>
                            <TableCell>${trade.exit.toLocaleString()}</TableCell>
                            <TableCell className={trade.pnl >= 0 ? 'text-accent font-medium' : 'text-destructive font-medium'}>
                              {trade.pnl >= 0 ? '+' : ''}${trade.pnl}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">{trade.duration}</TableCell>
                            <TableCell className="text-right">
                              <X402Badge onClick={() => handleTxClick({ txHash: trade.txHash, type: 'Trade', amount: trade.pnl })} />
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                            No completed trades
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="transactions">
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Chain</TableHead>
                        <TableHead className="text-right">Transaction</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {agent.transactions.length > 0 ? (
                        agent.transactions.map((tx) => (
                          <TableRow key={tx.id}>
                            <TableCell>
                              <Badge variant="outline" className="font-normal">{tx.type}</Badge>
                            </TableCell>
                            <TableCell className="font-medium">
                              {tx.type === 'Creation' ? `${tx.amount} USDC` : `$${tx.amount.toLocaleString()}`}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">{tx.date}</TableCell>
                            <TableCell className="text-xs">{tx.chain}</TableCell>
                            <TableCell className="text-right">
                              <button
                                onClick={() => handleTxClick(tx)}
                                className="inline-flex items-center gap-1 text-primary hover:underline font-mono text-xs"
                              >
                                {tx.txHash.substring(0, 8)}...
                                <ExternalLink className="h-3 w-3" />
                              </button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            No transactions
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reasoning">
              <Card>
                <CardHeader>
                  <CardTitle>Agent Reasoning Log</CardTitle>
                  <CardDescription>Real-time decision making process</CardDescription>
                </CardHeader>
                <CardContent>
                  {agent.reasoningLog.length > 0 ? (
                    <div className="space-y-6">
                      {agent.reasoningLog.map((log) => (
                        <div key={log.id} className="relative pl-6 border-l-2 border-muted pb-2 last:pb-0">
                          <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-background" />
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs text-muted-foreground font-mono">{log.time}</span>
                            <Badge variant="outline" className="text-[10px]">{log.trigger}</Badge>
                          </div>
                          <h4 className="font-semibold text-sm mb-1">{log.action}</h4>
                          <div className="bg-muted/30 rounded-lg p-3 text-sm space-y-2">
                            <p>
                              <span className="font-medium text-muted-foreground">Context: </span>
                              {log.context}
                            </p>
                            <p>
                              <span className="font-medium text-muted-foreground">Reasoning: </span>
                              {log.reasoning}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      No reasoning logs available
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main >

      {showTxModal && selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={() => setShowTxModal(false)}>
          <Card className="w-full max-w-md shadow-lg" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle>Transaction Receipt</CardTitle>
              <CardDescription>x402 Protocol Verification</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-muted/50 rounded-lg space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Transaction Hash</Label>
                  <p className="font-mono text-sm break-all text-primary">{selectedTx.txHash}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Chain</Label>
                    <p className="text-sm font-medium">{selectedTx.chain || 'Ethereum'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Timestamp</Label>
                    <p className="text-sm font-medium">{selectedTx.date || new Date().toLocaleString()}</p>
                  </div>
                </div>
                {selectedTx.amount && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Amount</Label>
                    <p className="text-lg font-bold">${selectedTx.amount}</p>
                  </div>
                )}
              </div>
              <Button className="w-full" onClick={() => setShowTxModal(false)}>
                Close Receipt
              </Button>
            </CardContent>
          </Card>
        </div>
      )
      }

      {
        showDepositModal && agent && (
          <DepositModal
            agentName={agent.name}
            agentStrategy={agent.strategy}
            agentTrigger={agent.triggers[0]}
            agentContexts={agent.contexts}
            agentPnl={agent.pnl}
            agentSharpeRatio={agent.sharpeRatio}
            agentWinRate={agent.winRate}
            isOwnAgent={agent.isOwned || false}
            onClose={() => setShowDepositModal(false)}
            onSuccess={() => {
              setShowDepositModal(false)
            }}
          />
        )
      }

      <KeyRenewalModal
        isOpen={showRenewalModal}
        onClose={() => setShowRenewalModal(false)}
        onSuccess={handleRenewalSuccess}
        isExpired={true}
      />
    </div >
  )
}
