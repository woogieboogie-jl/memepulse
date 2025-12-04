'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TrendingUp, TrendingDown, Play, Pause, Activity, Coins } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { LineChart, Line, Area, ResponsiveContainer, YAxis } from 'recharts'

export interface AgentCardProps {
  id: string
  name: string
  strategy: string
  funded: number // Treated as Equity
  pnl: number // 24h PnL

  // PRD-Aligned: Memecoin-specific fields
  memecoin: string // DOGE, PEPE, SHIB, FLOKI, etc.
  socialScore: number // 0-100 current social sentiment
  mTokensMined: number // $M rewards earned from oracle contributions
  oracleContributions: number // Number of pulses submitted to chain

  symbol?: string // Deprecated: use memecoin instead
  status?: 'active' | 'paused' | 'stopped'
  health?: 'healthy' | 'warning' | 'offline'

  // Optional for My Agents but might be passed
  triggers?: string[]
  contexts?: string[]
  performanceData?: Array<{ time: string; value: number }>

  // Legacy/Unused in simplified view but kept for compatibility if needed
  winRate?: number
  sharpeRatio?: number
  isOwned?: boolean
  isPublished?: boolean
  creator?: string
  totalDeposits?: number
  investorCount?: number
  collateralStake?: number
  isKOL?: boolean
  kolName?: string
  socialOracle?: any
  qualificationCriteria?: any
}

// Memecoin emoji mapping
const MEMECOIN_EMOJI: Record<string, string> = {
  DOGE: '🐕',
  PEPE: '🐸',
  SHIB: '🐕‍🦺',
  FLOKI: '🐺',
  WIF: '🎩',
  BONK: '💥',
  BTC: '₿',
}

export function AgentCard({
  id,
  name,
  strategy,
  funded,
  pnl,
  memecoin,
  socialScore = 0,
  mTokensMined = 0,
  oracleContributions = 0,
  symbol, // Deprecated: use memecoin instead
  status = 'active',
  health = 'healthy',
  triggers = [],
  contexts = [],
  performanceData = [],
}: AgentCardProps) {
  const { theme } = useTheme()
  const router = useRouter()

  // Theme-aware sparkline color
  const getSparklineColor = () => {
    if (pnl < 0) return '#ef4444'
    return theme === 'dark' ? '#22c55e' : '#10b981'
  }

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.closest('button') || target.closest('a')) return
    router.push(`/agent/${id}`)
  }

  const getHealthColor = (h: string) => {
    switch (h) {
      case 'healthy': return 'bg-green-500'
      case 'warning': return 'bg-yellow-500'
      case 'offline': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getSocialScoreColor = () => {
    if (socialScore >= 80) return 'text-destructive'
    if (socialScore >= 60) return 'text-accent'
    if (socialScore >= 40) return 'text-primary'
    return 'text-muted-foreground'
  }

  const getSocialScoreBgColor = () => {
    if (socialScore >= 80) return 'bg-destructive'
    if (socialScore >= 60) return 'bg-accent'
    if (socialScore >= 40) return 'bg-primary'
    return 'bg-muted'
  }

  // Pulse glow effect for high social score
  const shouldPulse = socialScore >= 80
  const cardClassName = `overflow-hidden transition-all cursor-pointer group h-full hover:border-primary/50 ${shouldPulse ? 'animate-pulse-glow' : ''
    }`

  return (
    <Card className={cardClassName} onClick={handleCardClick}>
      <CardHeader className="pb-2.5">
        {/* Memecoin Logo + Title */}
        <div className="flex items-start gap-3 mb-2">
          <div className="text-4xl" title={memecoin}>
            {MEMECOIN_EMOJI[memecoin] || '🪙'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-xl leading-tight group-hover:text-primary transition-colors">
                {name}
              </CardTitle>
              <div className={`h-2.5 w-2.5 rounded-full ${getHealthColor(health)} ring-2 ring-background`} title={`Health: ${health}`} />
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge variant={status === 'active' ? 'default' : 'secondary'} className="text-[10px] py-0 px-1.5 h-5">
                {status === 'active' ? (
                  <>
                    <Play className="mr-1 h-2.5 w-2.5" />
                    Running
                  </>
                ) : (
                  <>
                    <Pause className="mr-1 h-2.5 w-2.5" />
                    Stopped
                  </>
                )}
              </Badge>

              <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-5">
                {memecoin}
              </Badge>
            </div>
          </div>
        </div>

        {/* Social Score Gauge */}
        <div className="mb-2">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground flex items-center gap-1">
              <Activity className="h-3 w-3" />
              Social Pulse
            </span>
            <span className={`font-bold ${getSocialScoreColor()}`}>
              {socialScore}/100
            </span>
          </div>
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${getSocialScoreBgColor()} ${shouldPulse ? 'animate-pulse' : ''
                }`}
              style={{ width: `${socialScore}%` }}
            />
          </div>
        </div>

        {/* Strategy */}
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-2">{strategy}</p>

        {/* Triggers & Contexts */}
        {(triggers.length > 0 || contexts.length > 0) && (
          <div className="flex flex-wrap gap-1 mb-2">
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
      </CardHeader>

      <CardContent className="space-y-2.5">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] text-muted-foreground mb-0.5 leading-tight">Total Equity</p>
            <p className="text-lg font-bold leading-tight">
              ${funded.toLocaleString()}
            </p>
          </div>

          <div>
            <p className="text-[10px] text-muted-foreground mb-0.5 leading-tight">24h P&L</p>
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
        </div>

        {/* $M Mined Display - NEW! */}
        <div className="bg-primary/10 border border-primary/20 rounded-md p-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Coins className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-primary">$M Mined</span>
            </div>
            <span className="text-sm font-bold text-primary">
              {mTokensMined.toLocaleString()}
            </span>
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            {oracleContributions} oracle contributions
          </div>
        </div>

        {/* Performance Sparkline */}
        {performanceData.length > 0 && (
          <div className="h-[40px] -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceData}>
                <defs>
                  <linearGradient id={`gradient-${id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={getSparklineColor()} stopOpacity={0.5} />
                    <stop offset="100%" stopColor={getSparklineColor()} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="value"
                  fill={`url(#gradient-${id})`}
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

        {/* Action Button */}
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
            Manage Agent
          </Button>
        </div>
      </CardContent>

      {/* Pulse Glow Overlay for High Social Score */}
      {shouldPulse && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-destructive/5 animate-pulse" />
        </div>
      )}
    </Card>
  )
}
