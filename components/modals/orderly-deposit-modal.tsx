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

interface OrderlyDepositModalProps {
  isOpen: boolean
  onClose: () => void
  depositAmount: string
  onAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  walletBalance: string
  balanceRevalidating: boolean
  allowance: string
  onDeposit: () => void
  depositStep: 'idle' | 'approving' | 'depositing'
  isDepositPending: boolean
}

export function OrderlyDepositModal({
  isOpen,
  onClose,
  depositAmount,
  onAmountChange,
  walletBalance,
  balanceRevalidating,
  allowance,
  onDeposit,
  depositStep,
  isDepositPending,
}: OrderlyDepositModalProps) {
  const isProcessing = depositStep !== 'idle' || isDepositPending
  const needsApproval = parseFloat(allowance || '0') < parseFloat(depositAmount || '0')

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Deposit USDC</DialogTitle>
        </DialogHeader>

        {isProcessing ? (
          <div className="text-center py-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-foreground font-medium mb-2">
              {depositStep === 'approving' && 'Approving USDC...'}
              {depositStep === 'depositing' && 'Processing Deposit...'}
              {depositStep === 'idle' && isDepositPending && 'Processing...'}
            </p>
            <p className="text-sm text-muted-foreground">
              {depositStep === 'approving' &&
                'Please approve USDC spending in your wallet'}
              {depositStep === 'depositing' &&
                'Please confirm the deposit transaction in your wallet'}
              {depositStep === 'idle' &&
                isDepositPending &&
                'Please confirm the transaction in your wallet'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Deposit USDC from your wallet to your trading account.
              <br />
              Note: Minimum $10 Total Equity required to start trading.
            </p>

            <div className="p-4 bg-muted/30 rounded-lg border border-border">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  Available USDC
                </span>
                <span className="text-sm font-medium text-foreground">
                  {balanceRevalidating
                    ? 'Loading...'
                    : `${Number(walletBalance).toFixed(2)} USDC`}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deposit-amount">Amount (USDC)</Label>
              <Input
                id="deposit-amount"
                type="number"
                value={depositAmount}
                onChange={onAmountChange}
                placeholder="10"
                min="0.01"
                step="0.01"
              />
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
                onClick={onDeposit}
                disabled={
                  !depositAmount ||
                  parseFloat(depositAmount) <= 0 ||
                  parseFloat(depositAmount) > Number(walletBalance)
                }
              >
                {needsApproval ? 'Approve & Deposit' : 'Deposit'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
