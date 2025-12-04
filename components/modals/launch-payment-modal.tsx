'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { X402Badge } from '@/components/x402-badge'
import { X, CheckCircle, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'

interface LaunchPaymentModalProps {
  agentName: string
  trigger: string
  contexts: string[]
  strategy: string
  launchFee?: number
  onClose: () => void
  onSuccess: () => void
}

export function LaunchPaymentModal({
  agentName,
  trigger,
  contexts,
  strategy,
  launchFee = 10,
  onClose,
  onSuccess
}: LaunchPaymentModalProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [txHash, setTxHash] = useState('')

  const gasEstimate = 2

  const handlePayment = async () => {
    setIsProcessing(true)

    // Simulate sub-account creation (matches real flow)
    await new Promise(resolve => setTimeout(resolve, 1500))
    const subAccountId = `sub_${Math.random().toString(36).substr(2, 9)}`
    console.log('✅ Sub-account created:', subAccountId)

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 500))
    setTxHash('0xdef456...abc123')
    setIsSuccess(true)
    setIsProcessing(false)
    setTimeout(() => {
      onSuccess()
    }, 1500)
  }

  // Lock body scroll when modal is open
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = originalStyle
    }
  }, [])

  if (isSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm overflow-y-auto p-4">
        <Card className="w-full max-w-md my-auto">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-accent" />
            </div>
            <CardTitle className="text-center">Agent Created Successfully!</CardTitle>
            <CardDescription className="text-center">Redirecting to your agents dashboard...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Agent Name</span>
                <span className="font-semibold">{agentName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Transaction</span>
                <div className="flex items-center gap-1">
                  <span className="font-mono text-xs">{txHash}</span>
                  <X402Badge />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm overflow-y-auto p-4" onClick={onClose}>
      <Card className="w-full max-w-md my-auto" onClick={(e) => e.stopPropagation()}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Launch Your AI Agent</CardTitle>
              <CardDescription>Confirm payment to create {agentName}</CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Agent Name</p>
              <p className="font-semibold">{agentName}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Trigger</p>
              <p className="text-sm">{trigger}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Context</p>
              <p className="text-sm">{contexts.join(', ')}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Strategy</p>
              <p className="text-sm line-clamp-2">{strategy}</p>
            </div>
          </div>

          <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Payment Details</span>
              <X402Badge />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Creation Fee</span>
              <span className="font-semibold">{launchFee} USDC</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Gas Estimate</span>
              <span>~${gasEstimate} USDC</span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t">
              <span className="font-medium">Total</span>
              <span className="font-bold">{launchFee + gasEstimate} USDC</span>
            </div>
            <p className="text-xs text-muted-foreground pt-2">
              Transaction will be recorded on-chain via x402 protocol
            </p>
          </div>

          <Button
            className="w-full"
            size="lg"
            disabled={isProcessing}
            onClick={handlePayment}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing Payment...
              </>
            ) : (
              'Confirm & Pay with USDC'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
