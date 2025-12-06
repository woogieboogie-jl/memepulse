'use client'

import { NavHeader } from '@/components/nav-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { X402Badge } from '@/components/x402-badge'
import { LaunchPaymentModal } from '@/components/modals/launch-payment-modal'
import { KeyRenewalModal } from '@/components/modals/key-renewal-modal'
import { WalletSignaturePrompt } from '@/components/wallet-signature-prompt'
import { useState, useEffect } from 'react'
import { Twitter, BarChart3, Globe, Sparkles, Database, Zap, Cpu, CheckCircle2, Clock, Coins, TrendingUp, Activity } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useConnectWallet } from '@web3-onboard/react'
import { useAccount } from '@orderly.network/hooks'
import { useAuth } from '@/contexts/AuthContext'
import { agentApi, userApi, type TriggerConfig } from '@/lib/api'

// Memecoin options with Orderly symbols
const MEMECOINS = [
  { symbol: 'DOGE', orderly: 'PERP_DOGE_USDC', name: 'Dogecoin', emoji: '🐕', socialScore: 78, volume: 1250000 },
  { symbol: 'PEPE', orderly: 'PERP_PEPE_USDC', name: 'Pepe', emoji: '🐸', socialScore: 62, volume: 890000 },
  { symbol: 'SHIB', orderly: 'PERP_SHIB_USDC', name: 'Shiba Inu', emoji: '🐕‍🦺', socialScore: 45, volume: 670000 },
  { symbol: 'FLOKI', orderly: 'PERP_FLOKI_USDC', name: 'Floki', emoji: '🐺', socialScore: 85, volume: 1560000 },
  { symbol: 'WIF', orderly: 'PERP_WIF_USDC', name: 'dogwifhat', emoji: '🎩', socialScore: 71, volume: 980000 },
  { symbol: 'BONK', orderly: 'PERP_BONK_USDC', name: 'Bonk', emoji: '💥', socialScore: 73, volume: 1120000 },
  { symbol: 'BTC', orderly: 'PERP_BTC_USDC', name: 'Bitcoin', emoji: '₿', socialScore: 92, volume: 5800000 },
]

// PRD-Aligned Triggers (Pulse types)
const triggers = [
  { id: 'timer', label: 'Timer Pulse', icon: Clock, description: 'Agent checks market at regular intervals', cost: 0.002, intervalMs: 60000 },
  { id: 'elon', label: 'Elon Pulse', icon: Twitter, description: 'Detects Elon Musk tweets about your memecoin', cost: 0.002, username: 'elonmusk' },
  { id: 'ai', label: 'AI Pulse', icon: Cpu, description: 'AI-powered sentiment shifts & trend analysis', cost: 0.003, intervalMs: 180000 },
  { id: 'trend', label: 'Trend Pulse', icon: TrendingUp, description: 'Volume spikes & price momentum patterns', cost: 0.002, intervalMs: 300000 },
]

const contexts = [
  { id: 'market', label: 'Market Context', icon: BarChart3, description: 'Price action, indicators, order book', cost: 0.001 },
  { id: 'social', label: 'Social Context', icon: Globe, description: 'Twitter trends, Reddit mentions, influencers', cost: 0.001, disabled: true },
  { id: 'onchain', label: 'On-chain Context', icon: Database, description: 'Whale movements, exchange flows', cost: 0.002, disabled: true },
]

export default function CreateAgentPage() {
  const router = useRouter()
  const [{ wallet }] = useConnectWallet()
  const { subAccount } = useAccount()
  const { auth, isAuthenticated, hasOrderlyAccount } = useAuth()

  // State
  const [selectedMemecoin, setSelectedMemecoin] = useState<string>('')
  const [agentName, setAgentName] = useState('')
  const [selectedTrigger, setSelectedTrigger] = useState<string>('')
  const [selectedContexts, setSelectedContexts] = useState<string[]>([])
  const [strategy, setStrategy] = useState('')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showSubAccountModal, setShowSubAccountModal] = useState(false)
  const [isCreatingSubAccount, setIsCreatingSubAccount] = useState(false)
  const [subAccountId, setSubAccountId] = useState<string | null>(null)
  const [isCheckingRegistration, setIsCheckingRegistration] = useState(true)
  const [showRenewalModal, setShowRenewalModal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  // Check registration
  useEffect(() => {
    const checkRegistration = async () => {
      setIsCheckingRegistration(true)

      if (!isAuthenticated || !auth?.token) {
        setIsCheckingRegistration(false)
        return
      }

      try {
        const userInfo = await userApi.getMe()
        const isKeyExpired = localStorage.getItem('orderly_key_expired') === 'true'

        if (isKeyExpired) {
          setShowRenewalModal(true)
          setIsCheckingRegistration(false)
          return
        }

        if (!userInfo.orderlyAccountId) {
          router.push('/register')
        } else {
          localStorage.setItem('orderly_registered', 'true')
          setIsCheckingRegistration(false)
        }
      } catch (err) {
        console.error('Failed to check registration:', err)
        router.push('/register')
      }
    }

    checkRegistration()
  }, [isAuthenticated, auth?.token, router])

  const handleRenewalSuccess = () => {
    setShowRenewalModal(false)
    window.dispatchEvent(new Event('localStorageChange'))
  }

  // Calculate Mining APY
  const calculateMiningAPY = () => {
    if (!selectedMemecoin) return 0

    const coin = MEMECOINS.find(c => c.symbol === selectedMemecoin)
    if (!coin) return 0

    const contextMultiplier = 1 + (selectedContexts.length * 0.2)
    const apy = Math.round((coin.socialScore * (coin.volume / 10000) * contextMultiplier) / 100)

    return Math.min(apy, 99)
  }

  const calculateDailyMining = () => {
    const apy = calculateMiningAPY()
    return Math.round((apy / 50) * 10)
  }

  const calculateDeploymentFee = () => {
    let baseFee = 10
    const strategyFee = Math.floor(strategy.length / 100) * 2
    return baseFee + strategyFee
  }

  const deploymentFee = calculateDeploymentFee()
  const miningAPY = calculateMiningAPY()
  const dailyMining = calculateDailyMining()

  const handleContextToggle = (contextId: string) => {
    const context = contexts.find(c => c.id === contextId)
    if (context?.disabled) return

    setSelectedContexts(prev =>
      prev.includes(contextId)
        ? prev.filter(c => c !== contextId)
        : prev.length < 3 ? [...prev, contextId] : prev
    )
  }

  const handleLaunch = async () => {
    if (!auth?.token) {
      setError('Not authenticated')
      return
    }

    if (!agentName.trim()) {
      setError('Agent name is required')
      return
    }

    if (!selectedTrigger) {
      setError('Please select a trigger')
      return
    }

    if (selectedContexts.length === 0) {
      setError('Please select at least one context')
      return
    }

    if (strategy.length < 50) {
      setError('Strategy must be at least 50 characters')
      return
    }

    setShowSubAccountModal(true)
    setIsCreatingSubAccount(true)
    setError(null)

    try {
      // Create sub account using Orderly SDK
      console.log('Creating sub account...')
      const subAccountResult = await subAccount.create()
      console.log('Sub account created:', subAccountResult)

      if (!subAccountResult?.sub_account_id) {
        throw new Error('Failed to create sub account')
      }

      setSubAccountId(subAccountResult.sub_account_id)
      setIsCreatingSubAccount(false)

      // Build trigger config
      const triggerData = triggers.find(t => t.id === selectedTrigger)
      let trigger: TriggerConfig

      if (selectedTrigger === 'elon') {
        trigger = { type: 'twitter', username: 'elonmusk' }
      } else {
        trigger = { type: 'timer', intervalMs: triggerData?.intervalMs || 60000 }
      }

      // Find the Orderly symbol for the selected memecoin
      const coin = MEMECOINS.find(c => c.symbol === selectedMemecoin)
      const orderlySymbol = coin?.orderly || 'PERP_DOGE_USDC'

      // Wait a moment for UI feedback
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Create agent via backend API
      console.log('Creating agent...')
      setIsCreating(true)
      const result = await agentApi.create({
        name: agentName,
        subAccountId: subAccountResult.sub_account_id,
        symbol: orderlySymbol,
        mode: 'mainnet',
        trigger,
        context: selectedContexts.join(','),
        strategy,
      })

      console.log('Agent created:', result)

      setShowSubAccountModal(false)
      setShowPaymentModal(true)
    } catch (err) {
      console.error('Failed to create agent:', err)
      setError(err instanceof Error ? err.message : 'Failed to create agent')
      setShowSubAccountModal(false)
      setIsCreatingSubAccount(false)
      setIsCreating(false)
    }
  }

  const handlePaymentSuccess = () => {
    router.push('/my-agents')
  }

  const isValid = selectedMemecoin && agentName && selectedTrigger && selectedContexts.length > 0 && strategy.length >= 50

  // Loading state
  if (isCheckingRegistration) {
    return (
      <div className="min-h-screen bg-background/80 backdrop-blur-sm">
        <NavHeader />
        <main className="container mx-auto px-4 py-4">
          <div className="mx-auto max-w-6xl flex items-center justify-center py-16">
            <Card className="w-full max-w-md">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mb-4" />
                <p className="text-sm text-muted-foreground">Checking registration status...</p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  // Not authenticated state
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <NavHeader />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-3xl font-bold mb-4">Connect Your Wallet</h1>
            <p className="text-muted-foreground mb-8">
              Please connect your wallet to create an AI trading agent.
            </p>
            <div className="p-6 bg-primary/10 border border-primary/20 rounded-lg">
              <p className="text-sm text-primary">
                Click "Connect Wallet" in the top right corner to get started.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <NavHeader />

      <main className="container mx-auto px-4 py-4">
        <div className="mx-auto max-w-6xl">
          <div className="mb-4">
            <h1 className="text-3xl font-bold font-pixel">Create Memecoin Pulse Agent</h1>
            <p className="text-sm text-muted-foreground">
              Deploy an AI agent that monitors social pulse and mines $M tokens
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              {/* STEP 1: Memecoin Selection */}
              <Card className="border-2 border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Coins className="h-5 w-5 text-primary" />
                    Step 1: Select Memecoin
                  </CardTitle>
                  <CardDescription>Which memecoin should this agent monitor?</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {MEMECOINS.map((coin) => {
                      const isSelected = selectedMemecoin === coin.symbol
                      return (
                        <button
                          key={coin.symbol}
                          onClick={() => {
                            setSelectedMemecoin(coin.symbol)
                            setAgentName(`${coin.symbol} Pulse`)
                          }}
                          className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${isSelected
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                            }`}
                        >
                          <div className="text-3xl">{coin.emoji}</div>
                          <div className="text-sm font-medium">{coin.symbol}</div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Activity className="h-3 w-3" />
                            {coin.socialScore}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* STEP 2: Agent Name */}
              {selectedMemecoin && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Cpu className="h-5 w-5 text-primary" />
                      Step 2: Name Your Agent
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Label htmlFor="agent-name">Agent Name</Label>
                    <Input
                      id="agent-name"
                      placeholder={`${selectedMemecoin} Pulse`}
                      value={agentName}
                      onChange={(e) => setAgentName(e.target.value)}
                      className="mt-2"
                    />
                  </CardContent>
                </Card>
              )}

              {/* STEP 3: Pulse Trigger */}
              {selectedMemecoin && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-primary" />
                      Step 3: Choose Pulse Type
                    </CardTitle>
                    <CardDescription>What triggers should wake up your agent?</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {triggers.map((trigger) => {
                        const Icon = trigger.icon
                        const isSelected = selectedTrigger === trigger.id
                        return (
                          <button
                            key={trigger.id}
                            onClick={() => setSelectedTrigger(trigger.id)}
                            className={`flex flex-col items-start gap-2 rounded-lg border-2 p-4 text-left transition-all ${isSelected
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                              }`}
                          >
                            <Icon className={`h-5 w-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                            <div>
                              <p className="font-medium text-sm">{trigger.label}</p>
                              <p className="text-xs text-muted-foreground">{trigger.description}</p>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* STEP 4: Data Contexts */}
              {selectedTrigger && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5 text-primary" />
                      Step 4: Data Contexts
                    </CardTitle>
                    <CardDescription>Additional data sources for oracle reasoning (max 3)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {contexts.map((context) => {
                        const Icon = context.icon
                        const isSelected = selectedContexts.includes(context.id)
                        const isDisabled = context.disabled
                        return (
                          <button
                            key={context.id}
                            onClick={() => handleContextToggle(context.id)}
                            disabled={isDisabled}
                            className={`relative flex flex-col items-start gap-2 rounded-lg border-2 p-4 text-left transition-all ${isDisabled
                              ? 'border-border opacity-40 cursor-not-allowed'
                              : isSelected
                                ? 'border-accent bg-accent/5'
                                : 'border-border hover:border-accent/50'
                              }`}
                          >
                            <Icon className={`h-5 w-5 ${isSelected ? 'text-accent' : 'text-muted-foreground'}`} />
                            <div>
                              <div className="font-medium text-sm">{context.label}</div>
                              <div className="text-xs text-muted-foreground">{context.description}</div>
                            </div>
                            {isDisabled && (
                              <span className="absolute top-2 left-2 text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                                Coming Soon
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* STEP 5: Strategy */}
              {selectedContexts.length > 0 && (
                <Card className="border-2 border-primary/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      Step 5: Trading Strategy
                    </CardTitle>
                    <CardDescription>Describe your oracle & trading strategy (50-500 characters)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder={`e.g., When ${selectedMemecoin} social pulse spikes above 80 and volume increases 50%, execute long with 3x leverage. Monitor whale wallets and exit if sentiment drops below 60...`}
                      className="min-h-[160px] text-base"
                      value={strategy}
                      onChange={(e) => setStrategy(e.target.value)}
                      maxLength={500}
                    />
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className={strategy.length >= 50 ? 'text-accent' : 'text-muted-foreground'}>
                        {strategy.length}/500 characters {strategy.length >= 50 && '✓'}
                      </span>
                      {strategy.length >= 50 && (
                        <span className="text-accent font-medium">Strategy looks good!</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Cost & Mining Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-4">
                <Card className="border-l-4 border-l-primary shadow-lg">
                  <CardHeader className="pb-3">
                    <CardTitle>Cost & Mining Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Mining APY Estimator */}
                    {selectedMemecoin && (
                      <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-sm font-semibold">Estimated Mining</Label>
                          <Coins className="h-4 w-4 text-primary" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-xs text-muted-foreground">Mining APY</span>
                            <span className="text-lg font-bold text-primary">{miningAPY}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-xs text-muted-foreground">Est. Daily $M</span>
                            <span className="text-sm font-bold text-accent">~{dailyMining} $M</span>
                          </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-2">
                          Based on {selectedMemecoin} Social Pulse & volume
                        </p>
                      </div>
                    )}

                    {/* Deployment Fee */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-semibold">One-time Deployment</Label>
                        <X402Badge />
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Base Fee</span>
                          <span>10 USDC</span>
                        </div>
                        {strategy.length > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Strategy Complexity</span>
                            <span>+{Math.floor(strategy.length / 100) * 2} USDC</span>
                          </div>
                        )}
                        <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                          <span>Total</span>
                          <span>{deploymentFee} USDC</span>
                        </div>
                      </div>
                    </div>

                    <Button
                      className="w-full"
                      size="lg"
                      disabled={!isValid || isCreating}
                      onClick={handleLaunch}
                    >
                      {isCreating ? 'Creating...' : 'Deploy Agent'}
                    </Button>

                    {!isValid && (
                      <p className="text-xs text-center text-muted-foreground">
                        Complete all steps to launch
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* What Happens Next */}
          {isValid && (
            <Card className="mt-6 border-primary/50 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  What Happens After Deployment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3 text-sm">
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">1</span>
                    <span>Agent deploys on <strong>Orderly Finance (Arbitrum)</strong></span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">2</span>
                    <span>Registers as price provider to <strong>{selectedMemecoin} oracle on MemeCore</strong></span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">3</span>
                    <span>Trades {selectedMemecoin} perps based on your strategy conditions</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">4</span>
                    <span>Updates oracle price via <strong>volume-weighted trades</strong></span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent/20 text-accent flex items-center justify-center text-xs font-bold">💰</span>
                    <span><strong>Earns trading P&L + MemeCore oracle subsidies</strong></span>
                  </li>
                </ol>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Sub-Account Creation Modal */}
      {showSubAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Creating Sub-Account</CardTitle>
              <CardDescription>Setting up isolated trading account for your agent</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isCreatingSubAccount ? (
                <WalletSignaturePrompt
                  message="Creating Orderly Sub-Account"
                  description="Please sign the sub-account creation message in your wallet"
                />
              ) : (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-500">Sub-Account Created</p>
                    <p className="text-xs text-muted-foreground mt-1 font-mono">
                      {subAccountId}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {showPaymentModal && (
        <LaunchPaymentModal
          agentName={agentName}
          trigger={triggers.find(t => t.id === selectedTrigger)?.label || ''}
          contexts={selectedContexts.map(ctx => contexts.find(c => c.id === ctx)?.label || '')}
          strategy={strategy}
          launchFee={deploymentFee}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}

      <KeyRenewalModal
        isOpen={showRenewalModal}
        onClose={() => setShowRenewalModal(false)}
        onSuccess={handleRenewalSuccess}
        isExpired={true}
      />
    </div>
  )
}
