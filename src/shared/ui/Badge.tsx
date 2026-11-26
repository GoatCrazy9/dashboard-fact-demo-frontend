import type { ReactNode } from 'react'
import { cn } from '@/shared/utils/cn'

type Tone = 'brand' | 'success' | 'error' | 'warning' | 'gray'

const tones: Record<Tone, string> = {
  brand: 'bg-brand-secondary text-brand-secondary',
  success: 'bg-success-secondary text-success-primary',
  error: 'bg-error-secondary text-error-primary',
  warning: 'bg-warning-secondary text-warning-primary',
  gray: 'bg-tertiary text-secondary',
}

export function Badge({
  tone = 'gray',
  startIcon,
  endIcon,
  children,
  className,
}: {
  tone?: Tone
  startIcon?: ReactNode
  endIcon?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
        tones[tone],
        className,
      )}
    >
      {startIcon}
      {children}
      {endIcon}
    </span>
  )
}