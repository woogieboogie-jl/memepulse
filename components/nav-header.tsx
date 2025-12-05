'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'

import { Key, AlertTriangle, Coins } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { KeyRenewalModal } from '@/components/modals/key-renewal-modal'

import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { injected } from 'wagmi/connectors'

export function NavHeader() {
  const { address, isConnected } = useAccount()
  const { connect } = useConnect()
  const { disconnect } = useDisconnect()
  const [isRegistered, setIsRegistered] = useState(false)
  const [keyExpired, setKeyExpired] = useState(false)
  const [showKeyModal, setShowKeyModal] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  // Check registration and key status
  useEffect(() => {
    const checkStatus = () => {
      const registered = localStorage.getItem('orderly_registered') === 'true'
      const expired = localStorage.getItem('orderly_key_expired') === 'true'

      setIsRegistered(registered)
      setKeyExpired(expired)
    }

    checkStatus()

    // Listen for storage changes (from demo control panel or other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'orderly_registered' || e.key === 'orderly_key_expired') {
        checkStatus()
      }
    }

    // Listen for custom event (for same-tab changes)
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
    // If not registered, redirect to registration
    if (!isRegistered) {
      router.push('/register')
    } else if (keyExpired) {
      // If key expired, show renewal modal
      setShowKeyModal(true)
    } else {
      // Show informational modal for active key
      setShowKeyModal(true)
    }
  }

  const handleWalletToggle = () => {
    if (isConnected) {
      disconnect()
    } else {
      connect({ connector: injected() })
    }
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

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold">
              <span className="text-primary">Meme</span>
              <span className="text-accent">Pulse</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
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
              href="/oracle"
              className={`text-sm font-medium transition-colors relative ${pathname === '/oracle'
                ? 'text-primary font-semibold'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              Memecoin Pulses
              {pathname === '/oracle' && (
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
              href="/my-agents"
              className={`text-sm font-medium transition-colors relative ${pathname === '/my-agents'
                ? 'text-primary font-semibold'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              Command Center
              {pathname === '/my-agents' && (
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
          {/* $M Token Balance - NEW! */}
          {isConnected && isRegistered && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full">
              <Coins className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold text-primary">1,240</span>
              <span className="text-xs text-muted-foreground">$M</span>
            </div>
          )}


          {isConnected && (
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
            <Button variant="outline" className="font-mono text-sm" onClick={handleWalletToggle}>
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </Button>
          ) : (
            <Button onClick={handleWalletToggle}>
              Connect Wallet
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
