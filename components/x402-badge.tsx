import { Badge } from '@/components/ui/badge'

interface X402BadgeProps {
  onClick?: () => void
  className?: string
}

export function X402Badge({ onClick, className }: X402BadgeProps) {
  return (
    <Badge
      variant="outline"
      className={`cursor-pointer font-sans text-xs hover:bg-accent ${className || ''}`}
      onClick={onClick}
    >
      x402
    </Badge>
  )
}
