'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { CheckCircle2, AlertTriangle, Key, ShieldCheck, Clock } from 'lucide-react'
import { useState } from 'react'

interface KeyRenewalModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    isExpired?: boolean
}

export function KeyRenewalModal({ isOpen, onClose, onSuccess, isExpired = false }: KeyRenewalModalProps) {
    const [step, setStep] = useState<'info' | 'signing' | 'success'>('info')

    const handleRenew = () => {
        setStep('signing')
        // Simulate signing delay
        setTimeout(() => {
            setStep('success')
        }, 2000)
    }

    const handleClose = () => {
        if (step === 'success') {
            onSuccess()
        }
        onClose()
        // Reset step after close animation
        setTimeout(() => setStep('info'), 300)
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Key className="h-5 w-5 text-primary" />
                        {isExpired ? 'Trading Key Expired' : 'Perp Trading Key'}
                    </DialogTitle>
                    <DialogDescription>
                        Manage your Perp DEX trading credentials
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {step === 'info' && (
                        <div className="space-y-4">
                            {isExpired ? (
                                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-start gap-3">
                                    <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-destructive">Key Expired</p>
                                        <p className="text-xs text-muted-foreground">
                                            Your trading key has expired. You must renew it to continue trading or managing agents.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 flex items-start gap-3">
                                    <ShieldCheck className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-green-500">Key Active</p>
                                        <p className="text-xs text-muted-foreground">
                                            Your trading key is valid. It will expire in 29 days.
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Status</span>
                                    <span className={isExpired ? 'text-destructive font-medium' : 'text-green-500 font-medium'}>
                                        {isExpired ? 'Inactive' : 'Active'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Scope</span>
                                    <span>Read / Trade</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Expiration</span>
                                    <span>30 Days (Standard)</span>
                                </div>
                            </div>

                            <Button className="w-full" onClick={handleRenew}>
                                {isExpired ? 'Renew Trading Key' : 'Rotate Key (Renew)'}
                            </Button>
                        </div>
                    )}

                    {step === 'signing' && (
                        <div className="flex flex-col items-center justify-center py-8 space-y-4">
                            <div className="relative">
                                <div className="h-12 w-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
                                <Key className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                            </div>
                            <div className="text-center space-y-1">
                                <p className="font-medium">Waiting for Signature</p>
                                <p className="text-sm text-muted-foreground">Please sign the request in your wallet...</p>
                            </div>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="flex flex-col items-center justify-center py-6 space-y-4">
                            <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                                <CheckCircle2 className="h-6 w-6 text-green-500" />
                            </div>
                            <div className="text-center space-y-1">
                                <p className="font-medium">Key Generated Successfully</p>
                                <p className="text-sm text-muted-foreground">
                                    Your new Perp trading key is active for 30 days.
                                </p>
                            </div>
                            <Button className="w-full" onClick={handleClose}>
                                Done
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
