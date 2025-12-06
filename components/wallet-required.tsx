'use client'

import { ReactNode } from 'react'
import { useConnectWallet } from '@web3-onboard/react'
import { useAuth } from '@/contexts/AuthContext'
import { NavHeader } from '@/components/nav-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Wallet, Loader2, ArrowRight } from 'lucide-react'

type WalletVariant = 'card' | 'minimal' | 'inline'

interface WalletRequiredProps {
  children: ReactNode
  title?: string
  description?: string
  /** 
   * - "card": Full card with icon, button, and step indicators (default)
   * - "minimal": Simple centered text with hint to use nav button
   * - "inline": No header, for embedding in existing page layouts
   */
  variant?: WalletVariant
  /** Show the NavHeader (default: true for card/minimal, false for inline) */
  showHeader?: boolean
  /** Custom hint text for minimal variant */
  hint?: string
}

export function WalletRequired({
  children,
  title = 'Connect Your Wallet',
  description = 'Please connect your wallet to continue.',
  variant = 'card',
  showHeader,
  hint = 'Click "Connect Wallet" in the top right corner to get started.',
}: WalletRequiredProps) {
  const [{ wallet, connecting }, connect] = useConnectWallet()
  const { isAuthenticated, isAuthenticating } = useAuth()

  const isConnected = !!wallet

  // If authenticated, render children
  if (isAuthenticated) {
    return <>{children}</>
  }

  // Determine if header should be shown
  const shouldShowHeader = showHeader ?? (variant !== 'inline')

  // Connection/authentication in progress
  const isLoading = connecting || isAuthenticating

  // Loading state text
  const loadingTitle = isConnected ? 'Signing In...' : 'Connecting...'
  const loadingDescription = isConnected 
    ? 'Please sign the message in your wallet to authenticate.'
    : 'Opening wallet connection...'

  // Render the appropriate variant
  const renderContent = () => {
    switch (variant) {
      case 'minimal':
        return (
          <main className="container mx-auto px-4 py-16">
            <div className="max-w-2xl mx-auto text-center">
              <h1 className="text-3xl font-bold mb-4 text-foreground font-pixel">
                {isLoading ? loadingTitle : title}
              </h1>
              <p className="text-muted-foreground mb-8">
                {isLoading ? loadingDescription : description}
              </p>
              {!isLoading && hint && (
                <div className="p-6 bg-primary/10 border border-primary/20 rounded-lg">
                  <p className="text-sm text-primary">{hint}</p>
                </div>
              )}
              {isLoading && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Please check your wallet...</span>
                </div>
              )}
            </div>
          </main>
        )

      case 'inline':
        return (
          <div className="max-w-md mx-auto py-8">
            <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
              <CardContent className="pt-8 pb-8 text-center">
                {renderCardContent()}
              </CardContent>
            </Card>
          </div>
        )

      case 'card':
      default:
        return (
          <main className="container mx-auto px-4 py-16">
            <div className="max-w-md mx-auto">
              <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
                <CardContent className="pt-8 pb-8 text-center">
                  {renderCardContent()}
                </CardContent>
              </Card>
            </div>
          </main>
        )
    }
  }

  // Shared card content for card and inline variants
  const renderCardContent = () => (
    <>
      {/* Icon */}
      <div className="mx-auto mb-6 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
        {isLoading ? (
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        ) : (
          <Wallet className="h-8 w-8 text-primary" />
        )}
      </div>

      {/* Title */}
      <h1 className="text-2xl font-bold mb-3 text-foreground font-pixel">
        {isLoading ? loadingTitle : title}
      </h1>

      {/* Description */}
      <p className="text-muted-foreground mb-6 text-sm">
        {isLoading ? loadingDescription : description}
      </p>

      {/* Connect Button */}
      {!isLoading && (
        <Button
          onClick={() => connect()}
          size="lg"
          className="w-full font-medium"
        >
          <Wallet className="mr-2 h-4 w-4" />
          Connect Wallet
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>
            {isConnected ? 'Awaiting signature...' : 'Please check your wallet...'}
          </span>
        </div>
      )}

      {/* Steps indicator */}
      <div className="mt-8 pt-6 border-t border-border">
        <div className="flex justify-center gap-6 text-xs text-muted-foreground">
          <div className={`flex items-center gap-2 ${isConnected ? 'text-emerald-500' : ''}`}>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${
              isConnected ? 'border-emerald-500 bg-emerald-500/20' : 'border-muted-foreground/30'
            }`}>
              {isConnected ? '✓' : '1'}
            </div>
            <span>Connect</span>
          </div>
          <div className={`flex items-center gap-2 ${isAuthenticated ? 'text-emerald-500' : ''}`}>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${
              isAuthenticated ? 'border-emerald-500 bg-emerald-500/20' : 'border-muted-foreground/30'
            }`}>
              {isAuthenticated ? '✓' : '2'}
            </div>
            <span>Sign</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center text-[10px] font-bold">
              3
            </div>
            <span>Ready</span>
          </div>
        </div>
      </div>
    </>
  )

  if (shouldShowHeader) {
    return (
      <div className="min-h-screen bg-background/80 backdrop-blur-sm">
        <NavHeader />
        {renderContent()}
      </div>
    )
  }

  return renderContent()
}
