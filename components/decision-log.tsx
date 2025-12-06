'use client'

import { useState, useEffect, useRef, memo, useCallback } from 'react'
import { TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { agentApi, type DecisionLogResponse } from '@/lib/api'

interface DecisionLogProps {
  agentId: string
}

interface LogItemProps {
  log: DecisionLogResponse
  isNew: boolean
}

const LogItem = memo(({ log, isNew }: LogItemProps) => {
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'BUY':
        return <TrendingUp className="h-5 w-5 text-accent" />
      case 'SELL':
        return <TrendingDown className="h-5 w-5 text-destructive" />
      case 'HOLD':
        return <Minus className="h-5 w-5 text-muted-foreground" />
      default:
        return null
    }
  }

  const getActionVariant = (action: string) => {
    switch (action) {
      case 'BUY':
        return 'default'
      case 'SELL':
        return 'destructive'
      case 'HOLD':
      default:
        return 'secondary'
    }
  }

  const formatPrice = (cents: number) => {
    return (cents / 100).toFixed(4)
  }

  const formatPnl = (cents: number | null) => {
    if (cents === null) return null
    const value = cents / 100
    const formatted = Math.abs(value).toFixed(2)
    return value >= 0 ? `+$${formatted}` : `-$${formatted}`
  }

  const formatTimestamp = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const pnlValue = log.pnl !== null ? log.pnl / 100 : null

  return (
    <div
      className={`rounded-lg p-4 border transition-all duration-300 ${
        isNew
          ? 'border-primary bg-primary/5 shadow-lg'
          : 'border-border bg-muted/30 hover:border-muted-foreground/30'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          {getActionIcon(log.action)}
          <Badge variant={getActionVariant(log.action) as 'default' | 'secondary' | 'destructive'}>
            {log.action}
          </Badge>
          {pnlValue !== null && (
            <Badge
              variant="outline"
              className={pnlValue >= 0 ? 'text-accent border-accent' : 'text-destructive border-destructive'}
            >
              {formatPnl(log.pnl)}
            </Badge>
          )}
        </div>
        <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
          {formatTimestamp(log.createdAt)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
        <div className="flex items-center gap-2 bg-background rounded px-3 py-2">
          <span className="text-muted-foreground">Symbol:</span>
          <span className="text-foreground font-bold">{log.symbol}</span>
        </div>
        <div className="flex items-center gap-2 bg-background rounded px-3 py-2">
          <span className="text-muted-foreground">Price:</span>
          <span className="text-foreground font-mono font-semibold">
            ${formatPrice(log.price)}
          </span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-border">
        <p className="text-sm text-muted-foreground leading-relaxed">{log.reason}</p>
      </div>
    </div>
  )
})

LogItem.displayName = 'LogItem'

export function DecisionLog({ agentId }: DecisionLogProps) {
  const [logs, setLogs] = useState<DecisionLogResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [newLogIds, setNewLogIds] = useState<Set<string>>(new Set())
  const intervalRef = useRef<number | null>(null)

  const fetchLogs = useCallback(
    async (cursor?: string, isLoadMore = false, isPolling = false) => {
      try {
        if (isLoadMore) {
          setLoadingMore(true)
        } else if (!isPolling) {
          setLoading(true)
        }

        const result = await agentApi.getDecisionLogs(agentId, cursor)

        if (isLoadMore) {
          setLogs((prev) => [...prev, ...result.logs])
        } else {
          setLogs((prev) => {
            const existingIds = new Set(prev.map((log) => log.id))
            const newLogs = result.logs.filter((log) => !existingIds.has(log.id))

            if (newLogs.length > 0 && isPolling) {
              const newIds = new Set(newLogs.map((log) => log.id))
              setNewLogIds(newIds)
              setTimeout(() => setNewLogIds(new Set()), 10000)
              return [...newLogs, ...prev]
            }

            if (newLogs.length > 0) {
              return [...newLogs, ...prev]
            }

            return prev.length === 0 ? result.logs : prev
          })
        }

        setNextCursor(result.nextCursor)
        setHasMore(result.hasMore)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load decisions')
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [agentId]
  )

  useEffect(() => {
    fetchLogs()

    intervalRef.current = window.setInterval(() => {
      fetchLogs(undefined, false, true)
    }, 20000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [agentId, fetchLogs])

  const handleLoadMore = () => {
    if (nextCursor && !loadingMore) {
      fetchLogs(nextCursor, true)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Agent Decisions</CardTitle>
            <span className="text-xs text-muted-foreground">Updates every 20 seconds</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center py-12">
            <Loader2 className="animate-spin text-muted-foreground" size={32} />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Agent Decisions</CardTitle>
            <span className="text-xs text-muted-foreground">Updates every 20 seconds</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center text-destructive py-8">{error}</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Agent Decisions</CardTitle>
          <span className="text-xs text-muted-foreground">Updates every 20 seconds</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {logs.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">No decisions yet</div>
          ) : (
            <>
              {logs.map((log) => (
                <LogItem key={log.id} log={log} isNew={newLogIds.has(log.id)} />
              ))}

              {hasMore && (
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="animate-spin" size={16} />
                      <span>Loading more...</span>
                    </div>
                  ) : (
                    'Load more'
                  )}
                </Button>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
