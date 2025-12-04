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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Memecoin options
const MEMECOINS = [
  { symbol: 'DOGE', name: 'Dogecoin', emoji: '🐕', socialScore: 78, volume: 1250000 },
  { symbol: 'PEPE', name: 'Pepe', emoji: '🐸', socialScore: 62, volume: 890000 },
  { symbol: 'SHIB', name: 'Shiba Inu', emoji: '🐕‍🦺', socialScore: 45, volume: 670000 },
  { symbol: 'FLOKI', name: 'Floki', emoji: '🐺', socialScore: 85, volume: 1560000 },
  { symbol: 'WIF', name: 'dogwifhat', emoji: '🎩', socialScore: 71, volume: 980000 },
  { symbol: 'BONK', name: 'Bonk', emoji: '💥', socialScore: 73, volume: 1120000 },
  { symbol: 'BTC', name: 'Bitcoin', emoji: '₿', socialScore: 92, volume: 5800000 },
]

// PRD-Aligned Triggers (Pulse types)
const triggers = [
  { id: 'elon', label: 'Elon Pulse', icon: Twitter, description: 'Detects Elon Musk tweets about your memecoin', cost: 0.002 },
  { id: 'ai', label: 'AI Pulse', icon: Cpu, description: 'AI-powered sentiment shifts & trend analysis', cost: 0.003 },
  { id: 'trend', label: 'Trend Pulse', icon: TrendingUp, description: 'Volume spikes & price momentum patterns', cost: 0.002 },
]

const contexts = [
  { id: 'market', label: 'Market Context', icon: BarChart3, description: 'Price action, indicators, order book', cost: 0.001 },
  { id: 'social', label: 'Social Context', icon: Globe, description: 'Twitter trends, Reddit mentions, influencer activity', cost: 0.001 },
  { id: 'onchain', label: 'On-chain Context', icon: Database, description: 'Whale movements, exchange flows, wallet activity', cost: 0.002 },
]

export default function CreateAgentPage() {
  const router = useRouter()

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

  // Check registration
  useEffect(() => {
    const checkRegistration = async () => {
      setIsCheckingRegistration(true)
      await new Promise(resolve => setTimeout(resolve, 500))

      const isRegistered = localStorage.getItem('orderly_registered') === 'true'
      const isKeyExpired = localStorage.getItem('orderly_key_expired') === 'true'

      if (isKeyExpired) {
        setShowRenewalModal(true)
        setIsCheckingRegistration(false)
        return
      }

      if (!isRegistered) {
        router.push('/register')
      } else {
        setIsCheckingRegistration(false)
      }
    }

    checkRegistration()
  }, [router])

  const handleRenewalSuccess = () => {
    setShowRenewalModal(false)
    window.dispatchEvent(new Event('localStorageChange'))
  }

  // Calculate Mining APY
  const calculateMiningAPY = () => {
    if (!selectedMemecoin) return 0

    const coin = MEMECOINS.find(c => c.symbol === selectedMemecoin)
    if (!coin) return 0

    // Formula: (socialScore × volume × contextMultiplier) / 100000
    const contextMultiplier = 1 + (selectedContexts.length * 0.2)
    const apy = Math.round((coin.socialScore * (coin.volume / 10000) * contextMultiplier) / 100)

    return Math.min(apy, 99) // Cap at 99%
  }

  // Calculate estimated $M mined per day
  const calculateDailyMining = () => {
    const apy = calculateMiningAPY()
    // Rough estimate: 1000 USDC equity → 10 $M/day at 50% APY
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
    setSelectedContexts(prev =>
      prev.includes(contextId)
        ? prev.filter(c => c !== contextId)
        : prev.length < 3 ? [...prev, contextId] : prev
    )
  }

  const handleLaunch = async () => {
    setShowSubAccountModal(true)
    setIsCreatingSubAccount(true)

    await new Promise(resolve => setTimeout(resolve, 2500))

    const newSubAccountId = `sub_${Math.random().toString(36).substr(2, 9)}`
    setSubAccountId(newSubAccountId)
    setIsCreatingSubAccount(false)

    await new Promise(resolve => setTimeout(resolve, 1000))

    // Register Agent with Backend
    try {
      await fetch('/api/pulse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: selectedMemecoin,
          price: 0,
          volume: 0,
          socialScore: MEMECOINS.find(c => c.symbol === selectedMemecoin)?.socialScore || 0,
          timestamp: Math.floor(Date.now() / 1000),
          agentName,
          strategy
        })
      })
    } catch (error) {
      console.error('Failed to register agent:', error)
    }

    setShowSubAccountModal(false)
    setShowPaymentModal(true)
  }

  const handlePaymentSuccess = () => {
    router.push('/my-agents')
  }

  const isValid = selectedMemecoin && agentName && selectedTrigger && selectedContexts.length > 0 && strategy.length >= 50

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

  return (
    <div className="min-h-screen bg-background">
      <NavHeader />

      <main className="container mx-auto px-4 py-4">
        <div className="mx-auto max-w-6xl">
          <div className="mb-4">
            <h1 className="text-2xl font-bold">Create Memecoin Pulse Agent</h1>
            <p className="text-sm text-muted-foreground">
              Deploy an AI agent that monitors social pulse and mines $M tokens
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              {/* STEP 1: Memecoin Selection - NEW! */}
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
                    <div className="grid gap-3 sm:grid-cols-3">
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
                        return (
                          <button
                            key={context.id}
                            onClick={() => handleContextToggle(context.id)}
                            className={`flex flex-col items-start gap-2 rounded-lg border-2 p-4 text-left transition-all ${isSelected
                              ? 'border-accent bg-accent/5'
                              : 'border-border hover:border-accent/50'
                              }`}
                          >
                            <Icon className={`h-5 w-5 ${isSelected ? 'text-accent' : 'text-muted-foreground'}`} />
                            <div>
                              <div className="font-medium text-sm">{context.label}</div>
                              <div className="text-xs text-muted-foreground">{context.description}</div>
                            </div>
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
                    {/* Mining APY Estimator - NEW! */}
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
                          Based on {selectedMemecoin} social score & volume
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
                      disabled={!isValid}
                      onClick={handleLaunch}
                    >
                      Deploy Agent
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
