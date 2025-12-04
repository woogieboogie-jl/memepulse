'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X402Badge } from '@/components/x402-badge'
import { X, CheckCircle, Loader2, ArrowLeft, AlertCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface DepositModalProps {
  agentName: string
  agentStrategy?: string
  agentTrigger?: string
  agentContexts?: string[]
  agentPnl?: number
  agentSharpeRatio?: number
  agentWinRate?: number
  isOwnAgent: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function DepositModal({
  agentName,
  agentStrategy,
  agentTrigger,
  agentContexts,
  agentPnl,
  agentSharpeRatio,
  agentWinRate,
  isOwnAgent,
  onClose,
  onSuccess
}: DepositModalProps) {
  const [step, setStep] = useState<'details' | 'deposit'>('details')
  const [amount, setAmount] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [txHash, setTxHash] = useState('')

  const walletBalance = 10000
  const gasEstimate = 2.5
  const minDeposit = 100
  const minBalanceWarning = 20

  const handleDeposit = async () => {
    setIsProcessing(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    setTxHash('0xabcd1234...ef5678')
    setIsSuccess(true)
    setIsProcessing(false)
    setTimeout(() => {
      onSuccess?.()
    }, 1500)
  }

  const setQuickAmount = (percentage: number) => {
    setAmount((walletBalance * percentage / 100).toFixed(2))
  }

  // Lock body scroll when modal is open
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = originalStyle
    }
  }, [])

  const isValidAmount = parseFloat(amount) >= minDeposit && parseFloat(amount) <= walletBalance

  if (isSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm overflow-y-auto p-4">
        <Card className="w-full max-w-md my-auto">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-accent" />
            </div>
            <CardTitle className="text-center">Deposit Successful!</CardTitle>
            <CardDescription className="text-center">
              {isOwnAgent
                ? `Your funds have been deposited to ${agentName}`
                : `You've successfully invested in ${agentName}`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Agent Name</span>
                <span className="font-semibold">{agentName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-semibold">${parseFloat(amount).toLocaleString()} USDC</span>
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
            <div className="flex items-center gap-2">
              {step === 'deposit' && (
                <Button variant="ghost" size="icon" onClick={() => setStep('details')} className="h-8 w-8">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <div>
                <CardTitle>{isOwnAgent ? 'Deposit to Your Agent' : 'Deposit to Agent'}</CardTitle>
                <CardDescription>
                  {step === 'details'
                    ? `Review ${agentName} details before depositing`
                    : `Confirm payment to fund ${agentName}`
                  }
                </CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 'details' ? (
            <>
              {/* Step 1: Agent Details */}
              <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Agent Name</p>
                  <p className="font-semibold">{agentName}</p>
                </div>
                {agentStrategy && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Strategy</p>
                    <p className="text-sm">{agentStrategy}</p>
                  </div>
                )}
                {agentTrigger && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Trigger</p>
                    <p className="text-sm">{agentTrigger}</p>
                  </div>
                )}
                {agentContexts && agentContexts.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Context</p>
                    <p className="text-sm">{agentContexts.join(', ')}</p>
                  </div>
                )}
                {(agentPnl !== undefined || agentSharpeRatio !== undefined || agentWinRate !== undefined) && (
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                    {agentPnl !== undefined && (
                      <div>
                        <p className="text-xs text-muted-foreground">Total P&L</p>
                        <p className={`text-sm font-semibold ${agentPnl >= 0 ? 'text-accent' : 'text-destructive'}`}>
                          {agentPnl >= 0 ? '+' : ''}${agentPnl.toLocaleString()}
                        </p>
                      </div>
                    )}
                    {agentSharpeRatio !== undefined && (
                      <div>
                        <p className="text-xs text-muted-foreground">Sharpe Ratio</p>
                        <p className="text-sm font-semibold">{agentSharpeRatio.toFixed(2)}</p>
                      </div>
                    )}
                    {agentWinRate !== undefined && (
                      <div>
                        <p className="text-xs text-muted-foreground">Win Rate</p>
                        <p className="text-sm font-semibold">{agentWinRate}%</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {!isOwnAgent && (
                <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-sm">
                  You're investing in a public agent. Returns will be shared based on your deposit proportion.
                </div>
              )}

              <Button
                className="w-full"
                size="lg"
                onClick={() => setStep('deposit')}
              >
                Understood
              </Button>
            </>
          ) : (
            <>
              {/* Step 2: Deposit Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount">Deposit Amount (USDC)</Label>
                <div className="relative">
                  <Input
                    id="amount"
                    type="number"
                    placeholder={`Min ${minDeposit}`}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pr-16"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    USDC
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Balance: ${walletBalance.toLocaleString()} USDC</span>
                  <div className="flex gap-1">
                    <button onClick={() => setQuickAmount(25)} className="hover:text-foreground transition-colors">25%</button>
                    <button onClick={() => setQuickAmount(50)} className="hover:text-foreground transition-colors">50%</button>
                    <button onClick={() => setQuickAmount(75)} className="hover:text-foreground transition-colors">75%</button>
                    <button onClick={() => setQuickAmount(100)} className="hover:text-foreground transition-colors">100%</button>
                  </div>
                </div>

                {amount && parseFloat(amount) < minDeposit && (
                  <p className="text-xs text-destructive mt-1">
                    Minimum deposit is ${minDeposit} USDC
                  </p>
                )}
              </div>

              <Alert variant="default" className="bg-muted/50 border-none">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs text-muted-foreground">
                  Agents require a minimum balance of ${minBalanceWarning} to maintain active status.
                  Streaming costs are deducted automatically.
                </AlertDescription>
              </Alert>

              {/* Payment Details Section - Matching Launch Modal Style */}
              <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Payment Details</span>
                  <X402Badge />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Deposit Amount</span>
                  <span className="font-semibold">{amount || '0'} USDC</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Gas Estimate</span>
                  <span>~${gasEstimate} USDC</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t">
                  <span className="font-medium">Total</span>
                  <span className="font-bold">{(parseFloat(amount || '0') + gasEstimate).toFixed(2)} USDC</span>
                </div>
                <p className="text-xs text-muted-foreground pt-2">
                  Transaction will be recorded on-chain via x402 protocol
                </p>
              </div>

              <Button
                className="w-full"
                size="lg"
                disabled={!isValidAmount || isProcessing}
                onClick={handleDeposit}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  'Deposit'
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
