'use client'

import { useState, useEffect, useCallback } from 'react'
import { NavHeader } from '@/components/nav-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PortfolioOverview } from '@/components/portfolio-overview'
import { AgentCard, AgentCardProps } from '@/components/agent-card'
import Link from 'next/link'
import { Bot, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { KeyRenewalModal } from '@/components/modals/key-renewal-modal'
import { useConnectWallet } from '@web3-onboard/react'
import { useAccount } from '@orderly.network/hooks'
import { useAuth } from '@/contexts/AuthContext'
import { agentApi, type AgentResponse } from '@/lib/api'
import { WalletRequired } from '@/components/wallet-required'

interface SubAccountBalance {
  holding: number
  frozen: number
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

function getSymbolFromOrderly(orderlySymbol: string): string {
  // PERP_DOGE_USDC -> DOGE
  const match = orderlySymbol.match(/PERP_(\w+)_USDC/)
  return match ? match[1] : orderlySymbol
}

// Convert API AgentResponse to AgentCardProps
function convertToAgentCardProps(
  agent: AgentResponse,
  balance?: SubAccountBalance,
  isHealthy?: boolean
): AgentCardProps {
  const symbol = getSymbolFromOrderly(agent.symbol)

  // Determine status
  const status = agent.status === 'running' ? 'active' : 'stopped'
  const health = agent.status === 'running'
    ? (isHealthy ? 'healthy' : 'offline')
    : 'offline'

  // Build triggers array
  const triggers: string[] = []
  if (agent.trigger?.type === 'twitter') {
    triggers.push(`@${agent.trigger.username}`)
  } else if (agent.trigger?.type === 'timer') {
    triggers.push(`${((agent.trigger.intervalMs ?? 60000) / 60000).toFixed(0)}min`)
  }

  // Build contexts array
  const contexts = agent.context ? agent.context.split(',').filter(Boolean) : []

  return {
    id: agent.id,
    name: agent.name || 'Unnamed Agent',
    strategy: agent.strategy || 'No strategy defined',
    funded: balance?.holding ?? 0,
    pnl: 0, // TODO: Get actual PnL from Orderly
    memecoin: symbol,
    socialScore: Math.floor(Math.random() * 40) + 40, // TODO: Get from oracle
    mTokensMined: 0, // TODO: Get from MemeCore contract
    oracleContributions: 0, // TODO: Get from MemeCore contract
    status,
    health,
    triggers,
    contexts,
  }
}

export default function MyAgentsPage() {
  const router = useRouter()
  const [{ wallet }] = useConnectWallet()
  const { isAuthenticated } = useAuth()
  const { subAccount } = useAccount()

  const [agents, setAgents] = useState<AgentResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [subAccountBalances, setSubAccountBalances] = useState<Record<string, SubAccountBalance>>({})
  const [showRenewalModal, setShowRenewalModal] = useState(false)
  const [currentTime, setCurrentTime] = useState(() => Date.now())

  // Update current time for health check
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 30000)
    return () => clearInterval(interval)
  }, [])

  const subAccountRef = { current: subAccount }
  subAccountRef.current = subAccount

  const fetchSubAccountBalances = useCallback(async () => {
    if (!wallet) return

    try {
      const response = await subAccountRef.current.refresh()
      const balances: Record<string, SubAccountBalance> = {}

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
  }, [wallet])

  // Fetch agents from API
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const data = await agentApi.list()
        setAgents(data)
      } catch (err) {
        console.error('Failed to fetch agents:', err)
      } finally {
        setIsLoading(false)
      }
    }

    if (isAuthenticated) {
      fetchAgents()
      const intervalId = setInterval(fetchAgents, 5000)
      return () => clearInterval(intervalId)
    } else {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  // Fetch sub account balances
  useEffect(() => {
    if (wallet && isAuthenticated) {
      fetchSubAccountBalances()
      const interval = setInterval(fetchSubAccountBalances, 10000)
      return () => clearInterval(interval)
    }
  }, [wallet, isAuthenticated, fetchSubAccountBalances])

  // Check for expired key
  useEffect(() => {
    const isKeyExpired = localStorage.getItem('orderly_key_expired') === 'true'
    if (isKeyExpired) {
      setShowRenewalModal(true)
    }
  }, [])

  const handleRenewalSuccess = () => {
    setShowRenewalModal(false)
    window.dispatchEvent(new Event('localStorageChange'))
  }

  // Convert agents to AgentCardProps
  const agentCards: AgentCardProps[] = agents.map(agent => {
    const isHealthy = agent.status === 'running' &&
      agent.lastHeartbeatAt &&
      currentTime - new Date(agent.lastHeartbeatAt).getTime() < 180000

    return convertToAgentCardProps(
      agent,
      subAccountBalances[agent.subAccountId],
      isHealthy
    )
  })

  // Loading state (only shown when authenticated)
  if (isAuthenticated && isLoading) {
    return (
      <div className="min-h-screen bg-background/80 backdrop-blur-sm">
        <NavHeader />
        <main className="container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
            <p className="text-muted-foreground">Loading your agents...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <WalletRequired
      title="Connect Your Wallet"
      description="Connect your wallet to view and manage your AI trading agents."
    >
      <div className="min-h-screen bg-background/80 backdrop-blur-sm">
        <NavHeader />

        <main className="container mx-auto px-4 py-4">
          <div className="w-full max-w-6xl mx-auto">
            <div className="mb-4 flex items-center justify-between">
              <div className="mb-4">
                <h1 className="text-3xl font-bold font-pixel">Command Center</h1>
                <p className="text-sm text-muted-foreground">
                  Manage your deployed agents and claim mining rewards
                </p>
              </div>
              <Button asChild>
                <Link href="/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Agent
                </Link>
              </Button>
            </div>

            <PortfolioOverview />

            {agentCards.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Bot className="mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 text-xl font-semibold">No agents yet</h3>
                  <p className="mb-6 text-center text-muted-foreground">
                    Create your first AI trading agent to get started
                  </p>
                  <Button asChild>
                    <Link href="/create">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Your First Agent
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {agentCards.map((agent) => (
                  <AgentCard
                    key={agent.id}
                    {...agent}
                  />
                ))}
              </div>
            )}
          </div>
        </main>

        <KeyRenewalModal
          isOpen={showRenewalModal}
          onClose={() => setShowRenewalModal(false)}
          onSuccess={handleRenewalSuccess}
          isExpired={true}
        />
      </div>
    </WalletRequired>
  )
}
