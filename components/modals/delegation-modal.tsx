'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { X, Users, TrendingUp, Coins, Info } from 'lucide-react'

interface DelegationModalProps {
    isOpen: boolean
    onClose: () => void
    onDelegate: (amount: number) => void
    agentName: string
    agentId: string
    memecoin: string
    operatorFee: number // Percentage (e.g., 10 for 10%)
    currentAPY: number
    totalDelegated: number
    maxDelegation: number
}

export function DelegationModal({
    isOpen,
    onClose,
    onDelegate,
    agentName,
    agentId,
    memecoin,
    operatorFee,
    currentAPY,
    totalDelegated,
    maxDelegation,
}: DelegationModalProps) {
    const [amount, setAmount] = useState('')
    const [isConfirming, setIsConfirming] = useState(false)

    if (!isOpen) return null

    const delegationAmount = parseFloat(amount) || 0
    const estimatedMonthlyReturn = (delegationAmount * currentAPY) / 100 / 12
    const operatorCut = (estimatedMonthlyReturn * operatorFee) / 100
    const yourShare = estimatedMonthlyReturn - operatorCut

    const remainingSlots = maxDelegation - totalDelegated
    const canDelegate = delegationAmount > 0 && delegationAmount <= remainingSlots

    const handleDelegate = async () => {
        if (!canDelegate) return

        setIsConfirming(true)

        // Simulate transaction
        await new Promise(resolve => setTimeout(resolve, 2000))

        onDelegate(delegationAmount)
        setIsConfirming(false)
        setAmount('')
        onClose()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            Join Squad
                        </CardTitle>
                        <button
                            onClick={onClose}
                            className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-lg font-bold">{agentName}</span>
                        <Badge variant="outline">{memecoin}</Badge>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    {/* Agent Performance Summary */}
                    <div className="bg-secondary/30 rounded-lg p-3 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Current APY</span>
                            <span className="font-bold text-accent">{currentAPY}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Operator Fee</span>
                            <span className="font-bold text-destructive">{operatorFee}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Total Delegated</span>
                            <span className="font-bold">${totalDelegated.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Available Slots</span>
                            <span className="font-bold text-primary">${remainingSlots.toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Delegation Amount Input */}
                    <div className="space-y-2">
                        <Label htmlFor="delegation-amount">Investment Amount (USDC)</Label>
                        <Input
                            id="delegation-amount"
                            type="number"
                            placeholder="100"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            min="0"
                            max={remainingSlots}
                        />
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setAmount('100')}
                                className="flex-1 text-xs"
                            >
                                $100
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setAmount('500')}
                                className="flex-1 text-xs"
                            >
                                $500
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setAmount('1000')}
                                className="flex-1 text-xs"
                            >
                                $1,000
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setAmount(remainingSlots.toString())}
                                className="flex-1 text-xs"
                            >
                                Max
                            </Button>
                        </div>
                    </div>

                    {/* Earnings Breakdown */}
                    {delegationAmount > 0 && (
                        <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 space-y-2">
                            <div className="flex items-center gap-2 mb-2">
                                <Coins className="h-4 w-4 text-primary" />
                                <span className="text-sm font-medium text-primary">Estimated Monthly Returns</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Gross Return</span>
                                <span className="font-bold">${estimatedMonthlyReturn.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Operator Fee ({operatorFee}%)</span>
                                <span className="font-bold text-destructive">-${operatorCut.toFixed(2)}</span>
                            </div>
                            <div className="border-t pt-2 flex justify-between">
                                <span className="font-medium">Your Share</span>
                                <span className="font-bold text-accent">${yourShare.toFixed(2)}/mo</span>
                            </div>
                        </div>
                    )}

                    {/* Info Alert */}
                    <div className="bg-muted/50 rounded-lg p-3 flex gap-2 text-xs">
                        <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <p className="text-muted-foreground">
                            You can unstake your delegation at any time. Profits are automatically distributed to your wallet.
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="flex-1"
                            disabled={isConfirming}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleDelegate}
                            className="flex-1"
                            disabled={!canDelegate || isConfirming}
                        >
                            {isConfirming ? (
                                <>
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent mr-2" />
                                    Confirming...
                                </>
                            ) : (
                                <>
                                    <Users className="h-4 w-4 mr-2" />
                                    Join Squad
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
