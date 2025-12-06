'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TrendingUp, TrendingDown, Wallet, Activity, Bot, Plus, Loader2 } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useEffect, useState, useMemo, useCallback } from 'react'
import { useTheme } from 'next-themes'
import { useAccount, useAccountInstance, useCollateral, usePositionStream, useStatisticsDaily, useDeposit, useChains } from '@orderly.network/hooks'
import { useConnectWallet } from '@web3-onboard/react'
import { useAuth } from '@/contexts/AuthContext'
import { agentApi } from '@/lib/api'
import { OrderlyDepositModal } from '@/components/modals/orderly-deposit-modal'
import { PendingTransactionManager } from '@/lib/pending-transaction'

interface SubAccountBalance {
  holding: number
  frozen: number
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatPnl(value: number): string {
  const formatted = Math.abs(value).toFixed(2)
  return value >= 0 ? `+$${formatted}` : `-$${formatted}`
}

export function PortfolioOverview() {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const { isAuthenticated } = useAuth()
  const [{ wallet }] = useConnectWallet()
  const [activeAgents, setActiveAgents] = useState(0)
  const [totalAgents, setTotalAgents] = useState(0)
  const [subAccountBalances, setSubAccountBalances] = useState<Record<string, SubAccountBalance>>({})

  // Deposit state
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [depositAmount, setDepositAmount] = useState('')
  const [depositStep, setDepositStep] = useState<'idle' | 'approving' | 'depositing'>('idle')
  const [isDepositPending, setIsDepositPending] = useState(false)

  // Orderly hooks
  const { subAccount } = useAccount()
  const accountInstance = useAccountInstance()
  const accountId = accountInstance?.accountId
  const collateral = useCollateral()
  const [positions] = usePositionStream()

  // Deposit hook
  const [, { findByChainId }] = useChains()
  const arbitrumChain = findByChainId(42161)
  const usdcAddress = arbitrumChain?.token_infos?.find((t) => t.symbol === 'USDC')?.address || ''

  const {
    deposit,
    balance: walletBalance,
    balanceRevalidating,
    allowance,
    approve,
    setQuantity: setDepositQuantity,
  } = useDeposit({
    address: usdcAddress,
    decimals: 6,
    srcToken: 'USDC',
    srcChainId: 42161,
  })

  // Unrealized PnL from collateral hook
  const unrealizedPnL = collateral?.unsettledPnL || 0

  // Position value
  const positionValue = positions?.rows?.reduce(
    (sum, pos) => sum + Math.abs(pos.position_qty || 0) * (pos.mark_price || 0),
    0
  ) || 0

  // Fetch all sub account balances (main + sub accounts)
  const subAccountRef = { current: subAccount }
  subAccountRef.current = subAccount

  const fetchSubAccountBalances = useCallback(async () => {
    if (!accountId) return

    try {
      const response = await subAccountRef.current.refresh()
      const balances: Record<string, SubAccountBalance> = {}

      // Store holdings for all accounts (main + sub)
      for (const [accId, holdings] of Object.entries(response || {})) {
        if (holdings && Array.isArray(holdings)) {
          const usdcHolding = (
            holdings as { token: string; holding: number; frozen: number }[]
          ).find((h) => h.token === 'USDC')
          if (usdcHolding) {
            balances[accId] = {
              holding: usdcHolding.holding,
              frozen: usdcHolding.frozen,
            }
          }
        }
      }

      setSubAccountBalances(balances)
    } catch {
      // Ignore errors
    }
  }, [accountId])

  // Total collateral = all account holdings (main + sub)
  const totalCollateral = Object.values(subAccountBalances).reduce(
    (sum, balance) => sum + (balance?.holding || 0),
    0
  )

  // Total equity = collateral + unrealized PnL
  const totalEquity = totalCollateral + unrealizedPnL

  // Available balance from main account collateral
  const availableBalance = collateral?.availableBalance || 0

  // Get pending deposit (auto-clears if balance changed or expired)
  const pendingDeposit = PendingTransactionManager.get('deposit', totalCollateral)

  // Deposit handlers
  const handleDepositAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setDepositAmount(value)
    setDepositQuantity(value)
  }

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) return

    try {
      setIsDepositPending(true)
      const needsApproval = parseFloat(allowance || '0') < parseFloat(depositAmount)

      if (needsApproval) {
        setDepositStep('approving')
        await approve(depositAmount)
      }

      setDepositStep('depositing')
      await deposit()

      // Save pending deposit to localStorage
      PendingTransactionManager.set('deposit', parseFloat(depositAmount), totalCollateral)

      setShowDepositModal(false)
      setDepositAmount('')
      setDepositQuantity('')

      // Refresh balances after deposit
      await fetchSubAccountBalances()
    } catch (error) {
      console.error('Deposit failed:', error)
    } finally {
      setDepositStep('idle')
      setIsDepositPending(false)
    }
  }

  const handleCloseDepositModal = () => {
    setShowDepositModal(false)
    setDepositAmount('')
    setDepositQuantity('')
  }

  // Daily statistics for chart
  const dateRange = useMemo(() => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 30)
    const formatDateParam = (d: Date) => d.toISOString().split('T')[0]
    return {
      startDate: formatDateParam(start),
      endDate: formatDateParam(end),
    }
  }, [])

  const [dailyData] = useStatisticsDaily(
    { startDate: dateRange.startDate, endDate: dateRange.endDate },
    { ignoreAggregation: true }
  )

  const chartData = useMemo(() => {
    if (!dailyData || dailyData.length === 0) return []

    const sorted = [...dailyData].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    // Remove leading zeros
    let startIndex = 0
    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i].pnl !== 0 || sorted[i].account_value > 0) {
        startIndex = i
        break
      }
    }
    const trimmed = sorted.slice(startIndex)

    // Calculate cumulative PnL
    let cumulative = 0
    return trimmed.map((row) => {
      cumulative += row.pnl || 0
      return {
        date: row.date,
        dateFormatted: formatDate(row.date),
        pnl: row.pnl || 0,
        cumulativePnl: cumulative,
        accountValue: row.account_value || 0,
      }
    })
  }, [dailyData])

  const totalPnl = chartData.length > 0 ? chartData[chartData.length - 1].cumulativePnl : 0
  const isPositive = totalPnl >= 0
  const pnlPercentage = totalCollateral > 0 ? ((totalPnl / totalCollateral) * 100).toFixed(2) : '0.00'

  // Fetch sub account balances
  useEffect(() => {
    if (accountId) {
      fetchSubAccountBalances()
      const interval = setInterval(fetchSubAccountBalances, 10000)
      return () => clearInterval(interval)
    }
  }, [accountId, fetchSubAccountBalances])

  // Poll faster (1s) when there's a pending deposit
  useEffect(() => {
    if (!pendingDeposit) return
    const interval = setInterval(fetchSubAccountBalances, 1000)
    return () => clearInterval(interval)
  }, [pendingDeposit, fetchSubAccountBalances])

  // Fetch agent count
  useEffect(() => {
    const fetchAgents = async () => {
      if (!isAuthenticated) return
      try {
        const agents = await agentApi.list()
        setTotalAgents(agents.length)
        setActiveAgents(agents.filter(a => a.status === 'running').length)
      } catch {
        // Ignore
      }
    }
    fetchAgents()
    const interval = setInterval(fetchAgents, 10000)
    return () => clearInterval(interval)
  }, [isAuthenticated])

  useEffect(() => {
    setMounted(true)
  }, [])

  // Theme-aware colors for charts
  const isDark = mounted && theme === 'dark'
  const chartColors = {
    grid: isDark ? '#374151' : '#e5e7eb',
    axis: isDark ? '#9ca3af' : '#6b7280',
    tooltipBg: isDark ? '#1f2937' : '#ffffff',
    tooltipBorder: isDark ? '#374151' : '#e5e7eb',
    tooltipText: isDark ? '#f3f4f6' : '#111827',
  }

  if (!mounted) {
    return (
      <div className="mb-6">
        <div className="grid grid-cols-3 gap-2 mb-3">
          <Card className="p-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <Wallet className="h-3.5 w-3.5 text-primary" />
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Total Equity</p>
            </div>
            <p className="text-xl font-bold leading-none">$0.00</p>
          </Card>
          <Card className="p-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <Activity className="h-3.5 w-3.5 text-primary" />
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Position Value</p>
            </div>
            <p className="text-xl font-bold leading-none">$0.00</p>
          </Card>
          <Card className="p-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Available Balance</p>
            </div>
            <p className="text-xl font-bold leading-none">$0.00</p>
          </Card>
        </div>
        <Card className="p-4">
          <div className="h-[200px] w-full flex items-center justify-center">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="mb-6">
      <div className="grid grid-cols-3 gap-2 mb-3">
        <Card className="p-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <Wallet className="h-3.5 w-3.5 text-primary" />
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Total Equity</p>
          </div>
          <p className="text-xl font-bold leading-none">${totalEquity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          {unrealizedPnL !== 0 && (
            <p className={`text-[10px] mt-0.5 ${unrealizedPnL >= 0 ? 'text-accent' : 'text-destructive'}`}>
              {unrealizedPnL >= 0 ? '+' : ''}{unrealizedPnL.toFixed(2)} unrealized
            </p>
          )}
        </Card>

        <Card className="p-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <Activity className="h-3.5 w-3.5 text-primary" />
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Position Value</p>
          </div>
          <p className="text-xl font-bold leading-none">${positionValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </Card>

        <Card className="p-2.5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp className="h-3.5 w-3.5 text-primary" />
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Available Balance</p>
              </div>
              <p className="text-xl font-bold leading-none">${availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            {pendingDeposit ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary/10">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-xs font-medium text-primary">+${pendingDeposit.amount.toFixed(2)}</span>
              </div>
            ) : (
              <Button
                size="sm"
                className="h-8"
                onClick={() => setShowDepositModal(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Deposit
              </Button>
            )}
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <h3 className="text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wide">30-Day Performance</h3>
            <div className="h-[200px] w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor={isPositive ? '#22c55e' : '#ef4444'}
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor={isPositive ? '#22c55e' : '#ef4444'}
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="dateFormatted"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: chartColors.axis, fontSize: 11 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: chartColors.axis, fontSize: 11 }}
                      tickFormatter={(value) =>
                        value >= 0 ? `$${value.toFixed(0)}` : `-$${Math.abs(value).toFixed(0)}`
                      }
                      width={60}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: chartColors.tooltipBg,
                        border: `1px solid ${chartColors.tooltipBorder}`,
                        borderRadius: '6px',
                        fontSize: '12px',
                        color: chartColors.tooltipText,
                      }}
                      formatter={(value: number) => [formatPnl(value), 'Cumulative P&L']}
                    />
                    <Area
                      type="monotone"
                      dataKey="cumulativePnl"
                      stroke={isPositive ? '#22c55e' : '#ef4444'}
                      strokeWidth={2}
                      fill="url(#pnlGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground text-sm">No trading data yet. Start trading to see performance.</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 min-w-[140px]">
            <div className="p-2 rounded-md bg-muted/30">
              <p className="text-[9px] text-muted-foreground uppercase tracking-wide mb-0.5">Total P&L</p>
              <div className="flex items-center gap-1">
                {totalPnl >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-accent" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-destructive" />
                )}
                <p className={`text-sm font-bold leading-none ${totalPnl >= 0 ? 'text-accent' : 'text-destructive'}`}>
                  {formatPnl(totalPnl)}
                </p>
              </div>
              <p className={`text-[10px] mt-0.5 ${parseFloat(pnlPercentage) >= 0 ? 'text-accent' : 'text-destructive'}`}>
                {parseFloat(pnlPercentage) >= 0 ? '+' : ''}{pnlPercentage}%
              </p>
            </div>

            <div className="p-2 rounded-md bg-muted/30">
              <p className="text-[9px] text-muted-foreground uppercase tracking-wide mb-0.5">Total Collateral</p>
              <div className="flex items-center gap-1">
                <Wallet className="h-3 w-3 text-primary" />
                <p className="text-sm font-bold leading-none">${totalCollateral.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
              </div>
            </div>

            <div className="p-2 rounded-md bg-muted/30">
              <p className="text-[9px] text-muted-foreground uppercase tracking-wide mb-0.5">Unrealized P&L</p>
              <div className="flex items-center gap-1">
                {unrealizedPnL >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-accent" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-destructive" />
                )}
                <p className={`text-sm font-bold leading-none ${unrealizedPnL >= 0 ? 'text-accent' : 'text-destructive'}`}>
                  {formatPnl(unrealizedPnL)}
                </p>
              </div>
            </div>

            <div className="p-2 rounded-md bg-muted/30">
              <p className="text-[9px] text-muted-foreground uppercase tracking-wide mb-0.5">Active Agents</p>
              <div className="flex items-center gap-1">
                <Bot className="h-3 w-3 text-primary" />
                <p className="text-sm font-bold leading-none">{activeAgents} / {totalAgents}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <OrderlyDepositModal
        isOpen={showDepositModal}
        onClose={handleCloseDepositModal}
        depositAmount={depositAmount}
        onAmountChange={handleDepositAmountChange}
        walletBalance={walletBalance || '0'}
        balanceRevalidating={balanceRevalidating}
        allowance={allowance || '0'}
        onDeposit={handleDeposit}
        depositStep={depositStep}
        isDepositPending={isDepositPending}
      />
    </div>
  )
}
