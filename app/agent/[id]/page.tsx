'use client'

import { NavHeader } from '@/components/nav-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Play,
  Pause,
  Settings,
  Activity,
  Trash2,
  Loader2,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { agentApi, type AgentResponse } from '@/lib/api'
import { DecisionLog } from '@/components/decision-log'
import { KeyRenewalModal } from '@/components/modals/key-renewal-modal'
import { PendingTransactionManager } from '@/lib/pending-transaction'
import {
  useAccount,
  useInternalTransfer,
  useTransfer,
  useCollateral,
  useAccountInstance,
  useSubAccountDataObserver,
} from '@orderly.network/hooks'
import { WalletRequired } from '@/components/wallet-required'

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

function getSymbolFromTrading(tradingSymbol: string): string {
  const match = orderlySymbol.match(/PERP_(\w+)_USDC/)
  return match ? match[1] : orderlySymbol
}

export default function AgentDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { isAuthenticated } = useAuth()
  const agentId = params?.id as string

  const [agent, setAgent] = useState<AgentResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isStarting, setIsStarting] = useState(false)
  const [isStopping, setIsStopping] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showRenewalModal, setShowRenewalModal] = useState(false)

  // Fund modal state
  const [showFundModal, setShowFundModal] = useState(false)
  const [fundAmount, setFundAmount] = useState('')
  const [isFunding, setIsFunding] = useState(false)

  // Withdraw modal state
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [isWithdrawing, setIsWithdrawing] = useState(false)

  // Trading hooks
  const { subAccount } = useAccount()
  const accountInstance = useAccountInstance()
  const { transfer: internalTransfer, submitting: isTransferSubmitting } = useInternalTransfer()
  const { transfer: subAccountTransfer, submitting: isSubAccountTransferSubmitting } = useTransfer({
    fromAccountId: agent?.subAccountId,
  })
  const collateral = useCollateral()
  const accountId = accountInstance?.accountId

  // Use subaccount observer to get positions for agent's subaccount
  const { positions: subAccountPositions } = useSubAccountDataObserver(agent?.subAccountId)

  // SubAccount balance
  const [subAccountBalance, setSubAccountBalance] = useState<{
    holding: number
    frozen: number
  } | null>(null)

  // SubAccount values
  const usdcHolding = subAccountBalance?.holding || 0
  const totalEquity = usdcHolding
  const subAccountAvailable = usdcHolding - (subAccountBalance?.frozen || 0)

  // Account available balance for transfer
  const accountAvailable = collateral?.freeCollateral || 0

  // Pending transactions
  const pendingFund = PendingTransactionManager.get('fund', usdcHolding)
  const pendingWithdraw = PendingTransactionManager.get('withdraw', usdcHolding)
  const hasPendingTransaction = pendingFund || pendingWithdraw

  // Get symbol for display
  const symbol = agent?.symbol ? getSymbolFromTrading(agent.symbol) : ''
  const emoji = MEMECOIN_EMOJI[symbol] || '🤖'

  // Fetch subAccount balance
  const subAccountRef = { current: subAccount }
  subAccountRef.current = subAccount

  const fetchSubAccountBalance = useCallback(async (subAccountId: string) => {
    try {
      const response = await subAccountRef.current.refresh()
      const holdings = response?.[subAccountId]
      if (holdings && Array.isArray(holdings)) {
        const usdcHolding = holdings.find((h: { token: string }) => h.token === 'USDC')
        if (usdcHolding) {
          setSubAccountBalance({
            holding: usdcHolding.holding,
            frozen: usdcHolding.frozen,
          })
        }
      }
    } catch {
      // Ignore errors
    }
  }, [])

  // Fetch agent
  useEffect(() => {
    const fetchAgent = async () => {
      if (!agentId) return

      try {
        const data = await agentApi.get(agentId)
        setAgent(data)
      } catch (err) {
        console.error('Failed to fetch agent:', err)
      } finally {
        setIsLoading(false)
      }
    }

    if (isAuthenticated && agentId) {
      fetchAgent()
      const intervalId = setInterval(fetchAgent, 5000)
      return () => clearInterval(intervalId)
    } else {
      setIsLoading(false)
    }
  }, [isAuthenticated, agentId])

  // Fetch subAccount balance
  useEffect(() => {
    if (!agent?.subAccountId || !accountId) return

    const subAccountId = agent.subAccountId
    fetchSubAccountBalance(subAccountId)
    const interval = setInterval(() => fetchSubAccountBalance(subAccountId), 10000)
    return () => clearInterval(interval)
  }, [agent?.subAccountId, accountId, fetchSubAccountBalance])

  // Poll faster when pending
  useEffect(() => {
    if (!hasPendingTransaction || !agent?.subAccountId) return

    const subAccountId = agent.subAccountId
    const interval = setInterval(() => fetchSubAccountBalance(subAccountId), 1000)
    return () => clearInterval(interval)
  }, [hasPendingTransaction, agent?.subAccountId, fetchSubAccountBalance])

  // Check for expired key
  useEffect(() => {
    const isKeyExpired = localStorage.getItem('orderly_key_expired') === 'true'
    if (isKeyExpired) {
      setShowRenewalModal(true)
    }
  }, [])

  const handleStartAgent = async () => {
    if (!agent || isStarting) return

    setIsStarting(true)
    try {
      const data = await agentApi.start(agent.id)
      setAgent(data)
    } catch (error) {
      console.error('Failed to start agent:', error)
      alert('Failed to start agent')
    } finally {
      setIsStarting(false)
    }
  }

  const handleStopAgent = async () => {
    if (!agent || isStopping) return

    setIsStopping(true)
    try {
      const data = await agentApi.stop(agent.id)
      setAgent(data)
    } catch (error) {
      console.error('Failed to stop agent:', error)
      alert('Failed to stop agent')
    } finally {
      setIsStopping(false)
    }
  }

  const handleDeleteAgent = async () => {
    if (!agent || isDeleting) return
    if (agent.status !== 'stopped') {
      alert('Agent must be stopped before deleting')
      return
    }
    if (usdcHolding > 0) {
      alert('Please withdraw all funds before deleting the agent')
      return
    }
    if (!confirm('Are you sure you want to delete this agent?')) return

    setIsDeleting(true)
    try {
      await agentApi.delete(agent.id)
      router.push('/my-agents')
    } catch (error) {
      console.error('Failed to delete agent:', error)
      alert('Failed to delete agent')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleFund = async () => {
    if (!agent?.subAccountId || !fundAmount || isFunding) return

    const amount = parseFloat(fundAmount)
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount')
      return
    }

    setIsFunding(true)
    try {
      await internalTransfer({
        token: 'USDC',
        amount: amount.toString(),
        receiver: agent.subAccountId,
        decimals: 6,
      })

      PendingTransactionManager.set('fund', amount, usdcHolding)
      setShowFundModal(false)
      setFundAmount('')
      fetchSubAccountBalance(agent.subAccountId)
    } catch (error) {
      console.error('Failed to fund:', error)
      alert('Failed to fund agent')
    } finally {
      setIsFunding(false)
    }
  }

  const handleWithdraw = async () => {
    if (!agent?.subAccountId || !withdrawAmount || isWithdrawing || !accountId) return

    const amount = parseFloat(withdrawAmount)
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount')
      return
    }

    if (amount > subAccountAvailable) {
      alert(`Insufficient balance. Available: $${subAccountAvailable.toFixed(2)}`)
      return
    }

    setIsWithdrawing(true)
    try {
      await subAccountTransfer('USDC', {
        account_id: accountId,
        amount: amount,
      })

      PendingTransactionManager.set('withdraw', amount, usdcHolding)
      setShowWithdrawModal(false)
      setWithdrawAmount('')
      fetchSubAccountBalance(agent.subAccountId)
    } catch (error) {
      console.error('Failed to withdraw:', error)
      alert('Failed to withdraw funds')
    } finally {
      setIsWithdrawing(false)
    }
  }

  const handleRenewalSuccess = () => {
    setShowRenewalModal(false)
    window.dispatchEvent(new Event('localStorageChange'))
  }

  // Health check
  const isHealthy =
    agent?.status === 'running' &&
    agent?.lastHeartbeatAt &&
    Date.now() - new Date(agent.lastHeartbeatAt).getTime() < 180000

  if (!isAuthenticated) {
    return (
      <WalletRequired
        title="Connect Your Wallet"
        description="Please connect your wallet to view agent details."
        variant="card"
      >
        <div />
      </WalletRequired>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background/80 backdrop-blur-sm">
        <NavHeader />
        <main className="container mx-auto px-4 py-16">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading agent...</p>
          </div>
        </main>
      </div>
    )
  }

  if (!agent) {
    return (
      <div className="min-h-screen bg-background/80 backdrop-blur-sm">
        <NavHeader />
        <main className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-3xl font-bold mb-4 text-foreground">Agent Not Found</h1>
            <p className="text-muted-foreground mb-8">
              The agent you're looking for doesn't exist.
            </p>
            <Button asChild>
              <Link href="/my-agents">Back to My Agents</Link>
            </Button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background/80 backdrop-blur-sm">
      <NavHeader />

      <main className="container mx-auto px-4 py-4">
        <div className="mx-auto max-w-6xl">
          {/* Back Button */}
            <Button
              variant="ghost"
            className="mb-4 pl-0 hover:bg-transparent hover:text-primary"
            onClick={() => router.push('/my-agents')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
            Back to My Agents
            </Button>

          {/* Memecoin Hero Section */}
              <Card className="mb-6 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="flex-shrink-0">
                  <div className="text-8xl leading-none">{emoji}</div>
                    </div>

                <div className="flex-1 w-full">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold">{agent.name || 'Unnamed Agent'}</h1>
                    <Badge
                      variant={agent.status === 'running' ? 'default' : 'secondary'}
                      className="h-6"
                    >
                      {agent.status === 'running' ? (
                        <div className="flex items-center gap-1.5">
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${
                              isHealthy ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                            }`}
                          />
                          {isHealthy ? 'Running' : 'Not Responding'}
                      </div>
                      ) : agent.status === 'starting' ? (
                        <div className="flex items-center gap-1.5">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Starting
                        </div>
                      ) : agent.status === 'stopping' ? (
                        <div className="flex items-center gap-1.5">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Stopping
                      </div>
                      ) : (
                        'Stopped'
                      )}
                    </Badge>
                  </div>

                  <p className="text-muted-foreground mb-4 max-w-2xl">{agent.strategy}</p>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{agent.symbol}</Badge>
                    {agent.trigger?.type === 'twitter' && (
                      <Badge variant="outline">@{agent.trigger.username}</Badge>
                    )}
                    {agent.trigger?.type === 'timer' && (
                      <Badge variant="outline">
                        {((agent.trigger.intervalMs ?? 60000) / 60000).toFixed(0)}min
                      </Badge>
                    )}
                    {agent.context && <Badge variant="outline">{agent.context}</Badge>}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {agent.status === 'running' ? (
                    <Button
                      variant="destructive"
                      onClick={handleStopAgent}
                      disabled={isStopping}
                    >
                      {isStopping ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Pause className="mr-2 h-4 w-4" />
                      )}
                      Stop Agent
                    </Button>
                  ) : agent.status === 'starting' || agent.status === 'stopping' ? (
                    <Button disabled>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {agent.status === 'starting' ? 'Starting...' : 'Stopping...'}
                    </Button>
                  ) : (
                    <>
                      <Button
                        onClick={handleStartAgent}
                        disabled={totalEquity < 10 || isStarting}
                        title={totalEquity < 10 ? 'Minimum $10 required' : ''}
                      >
                        {isStarting ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Play className="mr-2 h-4 w-4" />
                        )}
                        Start Agent
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleDeleteAgent}
                        disabled={isDeleting || usdcHolding > 0}
                        title={usdcHolding > 0 ? 'Withdraw all funds first' : ''}
                      >
                        {isDeleting ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="mr-2 h-4 w-4" />
                        )}
                        Delete
                      </Button>
                    </>
                  )}
                </div>
                </div>
              </CardContent>
            </Card>

          {/* Stats Grid */}
          <div className="grid gap-4 mb-6 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-muted-foreground">Collateral</p>
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold">${usdcHolding.toFixed(2)}</p>
                {totalEquity < 10 && (
                  <p className="text-xs text-yellow-500 mt-1">Min $10 required to start</p>
                )}
                {pendingFund || pendingWithdraw ? (
                  <div className="mt-2">
                    {pendingFund && (
                      <div className="flex items-center gap-1.5 text-xs text-primary">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>+${pendingFund.amount.toFixed(2)} pending</span>
                      </div>
                    )}
                    {pendingWithdraw && (
                      <div className="flex items-center gap-1.5 text-xs text-destructive">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>-${pendingWithdraw.amount.toFixed(2)} pending</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      className="flex-1 h-7 text-xs"
                      onClick={() => setShowFundModal(true)}
                    >
                      <ArrowDownLeft className="h-3 w-3 mr-1" />
                      Fund
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-7 text-xs"
                      onClick={() => setShowWithdrawModal(true)}
                      disabled={subAccountAvailable <= 0}
                    >
                      <ArrowUpRight className="h-3 w-3 mr-1" />
                      Withdraw
                    </Button>
                </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-muted-foreground">Equity</p>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold">${totalEquity.toFixed(2)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-muted-foreground">Available</p>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold">${subAccountAvailable.toFixed(2)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="positions" className="space-y-4">
            <TabsList>
              <TabsTrigger value="positions">Positions</TabsTrigger>
              <TabsTrigger value="decisions">Decisions</TabsTrigger>
            </TabsList>

            <TabsContent value="positions">
              <Card>
                <CardHeader>
                  <CardTitle>Open Positions</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Symbol</TableHead>
                        <TableHead>Side</TableHead>
                        <TableHead className="text-right">Size</TableHead>
                        <TableHead className="text-right">Entry Price</TableHead>
                        <TableHead className="text-right">Mark Price</TableHead>
                        <TableHead className="text-right">Unrealized PnL</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subAccountPositions?.rows && subAccountPositions.rows.length > 0 ? (
                        subAccountPositions.rows.map((position) => {
                          const isLong = position.position_qty > 0
                          const pnl = position.unrealized_pnl || 0
                          const pnlPercent = position.unrealized_pnl_ROI
                            ? (position.unrealized_pnl_ROI * 100).toFixed(2)
                            : '0.00'
                          return (
                            <TableRow key={position.symbol}>
                              <TableCell className="font-medium">{position.symbol}</TableCell>
                            <TableCell>
                                <Badge variant={isLong ? 'default' : 'destructive'}>
                                  {isLong ? 'Long' : 'Short'}
                              </Badge>
                            </TableCell>
                              <TableCell className="text-right">
                                {Math.abs(position.position_qty).toFixed(4)}
                              </TableCell>
                              <TableCell className="text-right">
                                ${position.average_open_price?.toFixed(2) || '-'}
                              </TableCell>
                              <TableCell className="text-right">
                                ${position.mark_price?.toFixed(2) || '-'}
                            </TableCell>
                            <TableCell className="text-right">
                                <span className={pnl >= 0 ? 'text-accent' : 'text-destructive'}>
                                  ${pnl.toFixed(2)} ({pnl >= 0 ? '+' : ''}
                                  {pnlPercent}%)
                                </span>
                            </TableCell>
                          </TableRow>
                          )
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            No open positions
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="decisions">
              <DecisionLog agentId={agent.id} />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Fund Modal */}
      <Dialog open={showFundModal} onOpenChange={setShowFundModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fund Agent</DialogTitle>
            <DialogDescription>
              Transfer USDC from your main account to this agent's sub account.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-muted/30 rounded-lg text-sm space-y-2">
              <p className="text-muted-foreground">
                Funds are transferred internally within the trading infrastructure. Each agent has its own
                isolated sub-account.
              </p>
                </div>

            <div className="space-y-2">
              <Label htmlFor="fund-amount">Amount (USDC)</Label>
              <Input
                id="fund-amount"
                type="number"
                value={fundAmount}
                onChange={(e) => setFundAmount(e.target.value)}
                placeholder="10.00"
                min="0"
                step="0.01"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Main Account Available</span>
                <span className="font-medium">${accountAvailable.toFixed(2)} USDC</span>
                  </div>
                </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowFundModal(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleFund}
                disabled={
                  isFunding ||
                  isTransferSubmitting ||
                  !fundAmount ||
                  parseFloat(fundAmount) <= 0 ||
                  parseFloat(fundAmount) > accountAvailable
                }
              >
                {isFunding || isTransferSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Transferring...
                  </>
                ) : (
                  'Transfer'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Withdraw Modal */}
      <Dialog open={showWithdrawModal} onOpenChange={setShowWithdrawModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Withdraw to Main Account</DialogTitle>
            <DialogDescription>
              Transfer USDC from this agent back to your main account.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-muted/30 rounded-lg text-sm space-y-2">
              <p className="text-muted-foreground">
                Make sure to stop the agent before withdrawing all funds to avoid trading errors.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="withdraw-amount">Amount (USDC)</Label>
              <Input
                id="withdraw-amount"
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="10.00"
                min="0"
                step="0.01"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Agent Available Balance</span>
                <span className="font-medium">${subAccountAvailable.toFixed(2)} USDC</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowWithdrawModal(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleWithdraw}
                disabled={
                  isWithdrawing ||
                  isSubAccountTransferSubmitting ||
                  !withdrawAmount ||
                  parseFloat(withdrawAmount) <= 0 ||
                  parseFloat(withdrawAmount) > subAccountAvailable
                }
              >
                {isWithdrawing || isSubAccountTransferSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Withdrawing...
                  </>
                ) : (
                  'Withdraw'
                )}
              </Button>
            </div>
        </div>
        </DialogContent>
      </Dialog>

      <KeyRenewalModal
        isOpen={showRenewalModal}
        onClose={() => setShowRenewalModal(false)}
        onSuccess={handleRenewalSuccess}
        isExpired={true}
      />
    </div>
  )
}
