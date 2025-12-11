'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Wallet } from 'lucide-react'

interface OrderlyWithdrawModalProps {
  isOpen: boolean
  onClose: () => void
  withdrawAmount: string
  onAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  availableBalance: number
  onWithdraw: () => void
  isWithdrawPending: boolean
}

export function OrderlyWithdrawModal({
  isOpen,
  onClose,
  withdrawAmount,
  onAmountChange,
  availableBalance,
  onWithdraw,
  isWithdrawPending,
}: OrderlyWithdrawModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Withdraw USDC</DialogTitle>
        </DialogHeader>

        {isWithdrawPending ? (
          <div className="text-center py-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-foreground font-medium mb-2">
              Processing Withdrawal...
            </p>
            <p className="text-sm text-muted-foreground">
              Please confirm the transaction in your wallet
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Withdraw USDC from your trading account to your wallet.
            </p>

            <div className="p-4 bg-muted/30 rounded-lg border border-border">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  Available to Withdraw
                </span>
                <span className="text-sm font-medium text-foreground">
                  {availableBalance.toFixed(2)} USDC
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="withdraw-amount">Amount (USDC)</Label>
              <Input
                id="withdraw-amount"
                type="number"
                value={withdrawAmount}
                onChange={onAmountChange}
                placeholder="10"
                min="0.01"
                step="0.01"
              />
              <button
                type="button"
                className="text-xs text-primary hover:underline"
                onClick={() => onAmountChange({ target: { value: availableBalance.toString() } } as React.ChangeEvent<HTMLInputElement>)}
              >
                Max
              </button>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={onWithdraw}
                disabled={
                  !withdrawAmount ||
                  parseFloat(withdrawAmount) <= 0 ||
                  parseFloat(withdrawAmount) > availableBalance
                }
              >
                Withdraw
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
