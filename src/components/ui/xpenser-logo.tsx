import { cn } from "@/lib/utils"

interface XpenserLogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function XpenserLogo({ className, size = 'md' }: XpenserLogoProps) {
  const sizes = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-4xl'
  }

  return (
    <span className={cn("font-bold text-muted-foreground", sizes[size], className)}>
      Xpenser
    </span>
  )
}
