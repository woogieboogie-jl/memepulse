'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { X402Badge } from '@/components/x402-badge'
import { X, CheckCircle, AlertCircle } from 'lucide-react'
import { useState, useEffect } from 'react'

interface PublishModalProps {
  agentName: string
  sharpeRatio: number
  minimumTrades: number
  currentTrades: number
  onClose: () => void
}

export function PublishModal({ 
  agentName, 
  sharpeRatio, 
  minimumTrades, 
  currentTrades, 
  onClose 
}: PublishModalProps) {
  const [collateral, setCollateral] = useState('100')
  const [description, setDescription] = useState('')
  const [acceptRisk, setAcceptRisk] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [txHash, setTxHash] = useState('')

  const minimumCollateral = 100
  const sharpeTarget = 2.0
  const meetsRequirements = sharpeRatio >= sharpeTarget && currentTrades >= minimumTrades

  const handlePublish = async () => {
    setIsProcessing(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    setTxHash('0x9876fedc...ba4321')
    setIsSuccess(true)
    setIsProcessing(false)
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={onClose}>
        <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-accent" />
            </div>
            <CardTitle className="text-center">Agent Published!</CardTitle>
            <CardDescription className="text-center">{agentName} is now available in the public marketplace</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Collateral Staked</span>
                <span className="font-semibold">${parseFloat(collateral).toLocaleString()} USDC</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Transaction</span>
                <div className="flex items-center gap-1">
                  <span className="font-mono text-xs">{txHash}</span>
                  <X402Badge />
                </div>
              </div>
            </div>
            <Button className="w-full" onClick={onClose}>
              View in Marketplace
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Publish Agent to Marketplace</CardTitle>
              <CardDescription>Make {agentName} available for public deposits</CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Eligibility Requirements</h3>
            <div className="space-y-2">
              <div className={`flex items-center gap-2 text-sm ${sharpeRatio >= sharpeTarget ? 'text-accent' : 'text-muted-foreground'}`}>
                {sharpeRatio >= sharpeTarget ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <span>Sharpe Ratio: {sharpeRatio.toFixed(2)} / {sharpeTarget.toFixed(1)} minimum</span>
              </div>
              <div className={`flex items-center gap-2 text-sm ${currentTrades >= minimumTrades ? 'text-accent' : 'text-muted-foreground'}`}>
                {currentTrades >= minimumTrades ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <span>Completed Trades: {currentTrades} / {minimumTrades} minimum</span>
              </div>
            </div>
          </div>

          {!meetsRequirements && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              Your agent doesn't meet the publishing requirements yet. Keep trading to improve performance.
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Agent Description</Label>
            <Textarea
              id="description"
              placeholder="Describe your agent's strategy, performance, and what makes it unique..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="collateral">Collateral Stake (USDC)</Label>
            <Input
              id="collateral"
              type="number"
              placeholder="100"
              value={collateral}
              onChange={(e) => setCollateral(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Minimum ${minimumCollateral} USDC. Your stake will be locked while the agent is public.
            </p>
          </div>

          <div className="rounded-lg bg-muted p-4 space-y-2 text-sm">
            <p className="font-medium">Fee Structure</p>
            <p className="text-muted-foreground">You'll earn 10% of profits from other users' deposits</p>
          </div>

          <div className="flex items-start gap-2">
            <Checkbox 
              id="risk" 
              checked={acceptRisk}
              onCheckedChange={(checked) => setAcceptRisk(checked as boolean)}
            />
            <Label htmlFor="risk" className="text-sm leading-relaxed cursor-pointer">
              I understand that my collateral will be locked and other users will deposit funds into this agent. 
              I take full responsibility for the agent's performance.
            </Label>
          </div>

          <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Transaction Summary</span>
              <X402Badge />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Collateral Stake</span>
              <span className="font-semibold">{collateral || '0'} USDC</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Gas Estimate</span>
              <span>~$3 USDC</span>
            </div>
          </div>

          <Button 
            className="w-full" 
            size="lg"
            disabled={
              !meetsRequirements || 
              !collateral || 
              parseFloat(collateral) < minimumCollateral || 
              !description || 
              !acceptRisk ||
              isProcessing
            }
            onClick={handlePublish}
          >
            {isProcessing ? 'Publishing...' : 'Publish Agent'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
