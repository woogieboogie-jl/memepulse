'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'

import { Key, AlertTriangle, Coins, LayoutDashboard, LogOut } from 'lucide-react'
import { KeyRenewalModal } from '@/components/modals/key-renewal-modal'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { useWMBalance } from '@/hooks/use-contracts'
import { useConnectWallet } from '@web3-onboard/react'
import { useAuth } from '@/contexts/AuthContext'

export function NavHeader() {
  const [{ wallet }, connect] = useConnectWallet()
  const { isAuthenticated, isAuthenticating, logout } = useAuth()

  const address = wallet?.accounts?.[0]?.address
  const isConnected = !!wallet

  const [isRegistered, setIsRegistered] = useState(false)
  const [keyExpired, setKeyExpired] = useState(false)
  const [showKeyModal, setShowKeyModal] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  // Fetch real wM balance
  const { balance: wmBalance, isLoading: isBalanceLoading } = useWMBalance(address)

  // Check registration and key status
  useEffect(() => {
    const checkStatus = () => {
      if (typeof window === 'undefined') return

      const registered = localStorage.getItem('orderly_registered') === 'true'
      const expired = localStorage.getItem('orderly_key_expired') === 'true'

      setIsRegistered(registered)
      setKeyExpired(expired)
    }

    checkStatus()

    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'orderly_registered' || e.key === 'orderly_key_expired') {
        checkStatus()
      }
    }

    const handleCustomStorageChange = () => {
      checkStatus()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('localStorageChange', handleCustomStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('localStorageChange', handleCustomStorageChange)
    }
  }, [])

  const handleKeyClick = () => {
    if (!isRegistered) {
      router.push('/register')
    } else if (keyExpired) {
      setShowKeyModal(true)
    } else {
      setShowKeyModal(true)
    }
  }

  const handleConnect = async () => {
    try {
      await connect()
    } catch (error) {
      console.error('Failed to connect wallet:', error)
    }
  }

  const handleDisconnect = () => {
    logout()
  }

  // Determine button state
  const getKeyButtonState = () => {
    if (!isRegistered) {
      return {
        variant: 'outline' as const,
        icon: Key,
        text: 'Setup Trading',
        showBadge: false
      }
    }

    if (keyExpired) {
      return {
        variant: 'outline' as const,
        icon: AlertTriangle,
        text: 'Renew Key',
        showBadge: true
      }
    }

    return {
      variant: 'outline' as const,
      icon: Key,
      text: 'Trading Key',
      showBadge: false
    }
  }

  const buttonState = getKeyButtonState()

  // Format balance for display
  const formatBalance = (bal: number) => {
    if (bal >= 1000000) return `${(bal / 1000000).toFixed(2)}M`
    if (bal >= 1000) return `${(bal / 1000).toFixed(1)}K`
    return bal.toFixed(2)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold font-pixel">
              <span className="text-primary">Meme</span>
              <span className="text-accent">Pulse</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/oracle"
              className={`text-sm font-medium transition-colors relative ${pathname === '/oracle'
                ? 'text-primary font-semibold'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              Pulses
              {pathname === '/oracle' && (
                <div className="absolute -bottom-4 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </Link>
            <Link
              href="/marketplace"
              className={`text-sm font-medium transition-colors relative ${pathname === '/marketplace'
                ? 'text-primary font-semibold'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              Marketplace
              {pathname === '/marketplace' && (
                <div className="absolute -bottom-4 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </Link>
            <Link
              href="/create"
              className={`text-sm font-medium transition-colors relative ${pathname === '/create'
                ? 'text-primary font-semibold'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              Create Agent
              {pathname === '/create' && (
                <div className="absolute -bottom-4 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </Link>
            <Link
              href="/trade"
              className={`text-sm font-medium transition-colors relative ${pathname === '/trade'
                ? 'text-primary font-semibold'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              Manual Mode
              {pathname === '/trade' && (
                <div className="absolute -bottom-4 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {/* wM Token Balance */}
          {isConnected && isAuthenticated && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full cursor-help">
                    <Coins className="h-4 w-4 text-primary" />
                    <span className="text-sm font-bold text-primary">
                      {isBalanceLoading ? (
                        <span className="animate-pulse">...</span>
                      ) : wmBalance > 0 ? (
                        formatBalance(wmBalance)
                      ) : (
                        '-'
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground">wM</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="z-[9999]" side="bottom" sideOffset={5}>
                  <p className="font-body text-xs">
                    {wmBalance > 0
                      ? `${wmBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })} wM tokens`
                      : 'No wM tokens yet'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Command Center Icon */}
          <Button
            variant="outline"
            size="icon"
            className="border-primary text-primary hover:bg-primary/10 hover:text-primary"
            onClick={() => router.push('/my-agents')}
            title="Command Center"
          >
            <LayoutDashboard className="h-5 w-5" />
          </Button>

          {isConnected && isAuthenticated && (
            <div className="relative">
              <Button
                variant={buttonState.variant}
                size="sm"
                className="gap-2"
                onClick={handleKeyClick}
              >
                <buttonState.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{buttonState.text}</span>
              </Button>
              {buttonState.showBadge && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                </span>
              )}
            </div>
          )}

          {isConnected ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="font-mono text-sm">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => router.push('/my-agents')}>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  My Agents
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDisconnect} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Disconnect
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={handleConnect} disabled={isAuthenticating}>
              {isAuthenticating ? 'Connecting...' : 'Connect Wallet'}
            </Button>
          )}
        </div>
      </div>

      <KeyRenewalModal
        isOpen={showKeyModal}
        onClose={() => setShowKeyModal(false)}
        onSuccess={() => {
          setShowKeyModal(false)
          setKeyExpired(false)
          localStorage.removeItem('orderly_key_expired')
          window.dispatchEvent(new Event('localStorageChange'))
        }}
        isExpired={keyExpired}
      />
    </header>
  )
}
