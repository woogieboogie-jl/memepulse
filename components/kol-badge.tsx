'use client'

import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Sparkles } from 'lucide-react'

interface KOLBadgeProps {
  kolName?: string
  className?: string
}

export function KOLBadge({ kolName, className }: KOLBadgeProps) {
  return (
    <Badge 
      className={`bg-gradient-to-r from-purple-600 to-violet-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow ${className || ''}`}
    >
      <Sparkles className="h-3 w-3 mr-1" />
      <CheckCircle2 className="h-3 w-3 mr-1" />
      <span className="font-semibold">KOL</span>
      {kolName && (
        <span className="ml-1 opacity-90">• {kolName}</span>
      )}
    </Badge>
  )
}

