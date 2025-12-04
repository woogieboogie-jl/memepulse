'use client'

import { useQuery } from '@tanstack/react-query'
import { Activity, Twitter } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export function PulseMonitor() {
    const { data: pulse } = useQuery({
        queryKey: ['pulse'],
        queryFn: async () => {
            const res = await fetch('/api/pulse')
            return res.json()
        },
        refetchInterval: 5000 // Poll every 5 seconds
    })

    if (!pulse) return null

    return (
        <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full border border-border">
            <div className="flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-primary animate-pulse" />
                <span className="text-xs font-medium">Pulse:</span>
            </div>
            <div className="flex items-center gap-2">
                <Badge variant={pulse.socialScore > 50 ? 'default' : 'secondary'} className="text-[10px] h-5">
                    {pulse.socialScore}/100
                </Badge>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Twitter className="h-3 w-3" />
                    <span>{pulse.symbol}</span>
                </div>
            </div>
        </div>
    )
}
