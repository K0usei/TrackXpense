import { cn } from "@/lib/utils"
import { useMediaQuery } from "@/hooks/useMediaQuery"

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function Logo({ className, size = 'md' }: LogoProps) {
  const isMobile = useMediaQuery('(max-width: 640px)')

  // Responsive size adjustments
  const sizes = {
    sm: isMobile ? 'text-lg' : 'text-xl',
    md: isMobile ? 'text-xl' : 'text-2xl',
    lg: isMobile ? 'text-3xl' : 'text-4xl'
  }

  return (
    <span className={cn("font-bold tracking-tight", sizes[size], className)}>
      Track<span className="text-blue-500">X</span>pense
    </span>
  )
}
