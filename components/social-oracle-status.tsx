'use client'

import { Badge } from '@/components/ui/badge'
import { Activity, Users, Radio } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface SocialOracleStatusProps {
  status: 'active' | 'inactive'
  lastUpdate: string
  followerCount?: number
  tradingSignals?: number
}

export function SocialOracleStatus({ 
  status, 
  lastUpdate, 
  followerCount,
  tradingSignals 
}: SocialOracleStatusProps) {
  const isActive = status === 'active'
  const lastUpdateDate = new Date(lastUpdate)
  const timeAgo = formatDistanceToNow(lastUpdateDate, { addSuffix: true })

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <Badge 
        variant="outline" 
        className={`${isActive ? 'border-green-500/50 bg-green-500/10 text-green-600 dark:text-green-400' : 'border-muted-foreground/30 bg-muted/20'}`}
      >
        <div className={`h-1.5 w-1.5 rounded-full mr-1.5 ${isActive ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground'}`} />
        <Activity className="h-3 w-3 mr-1" />
        {isActive ? 'Live' : 'Inactive'}
      </Badge>
      
      <span className="text-muted-foreground flex items-center gap-1">
        <Radio className="h-3 w-3" />
        Updated {timeAgo}
      </span>
      
      {followerCount !== undefined && (
        <span className="text-muted-foreground flex items-center gap-1">
          <Users className="h-3 w-3" />
          {followerCount.toLocaleString()} followers
        </span>
      )}
      
      {tradingSignals !== undefined && (
        <span className="text-muted-foreground">
          {tradingSignals} signals
        </span>
      )}
    </div>
  )
}

