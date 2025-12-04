'use client'

import { NavHeader } from '@/components/nav-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PortfolioOverview } from '@/components/portfolio-overview'
import { AgentCard, AgentCardProps } from '@/components/agent-card'
import { getUserAgents } from '@/lib/agents-data'
import Link from 'next/link'
import { Bot, Plus } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { KeyRenewalModal } from '@/components/modals/key-renewal-modal'

export default function MyAgentsPage() {
  const router = useRouter()
  const [agents] = useState<AgentCardProps[]>(getUserAgents())
  const [showRenewalModal, setShowRenewalModal] = useState(false)

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
  }, [router])

  const handleRenewalSuccess = () => {
    setShowRenewalModal(false)
    window.dispatchEvent(new Event('localStorageChange'))
  }

  return (
    <div className="min-h-screen bg-background/80 backdrop-blur-sm">
      <NavHeader />

      <main className="container mx-auto px-4 py-4">
        <div className="w-full max-w-6xl mx-auto">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">My Agents</h1>
              <p className="text-sm text-muted-foreground">
                Manage your AI trading agents and track performance
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

          {agents.length === 0 ? (
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
              {agents.map((agent) => (
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
  )
}
