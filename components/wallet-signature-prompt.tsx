'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

interface WalletSignaturePromptProps {
    message: string
    description?: string
}

export function WalletSignaturePrompt({ message, description }: WalletSignaturePromptProps) {
    return (
        <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-3">
                    <div className="relative">
                        <div className="h-12 w-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="h-6 w-6 rounded-full bg-primary/20" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <p className="font-medium text-foreground">{message}</p>
                        {description && (
                            <p className="text-sm text-muted-foreground">{description}</p>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
