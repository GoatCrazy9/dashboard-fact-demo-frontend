import type { ReactNode } from 'react'
import { Icon } from './icons'
import type { IconName } from './icons'
import { cn } from '@/shared/utils/cn'
import { useDensity } from './density'

type Tone = 'error' | 'success' | 'warning' | 'info'

const tones: Record<
  Tone,
  { container: string; icon: string; glyph: IconName; title: string; body: string }
> = {
  error: {
    container: 'bg-error-secondary ring-error_subtle',
    icon: 'text-fg-error-primary',
    glyph: 'warning',
    title: 'text-primary',
    body: 'text-secondary',
  },
  success: {
    container: 'bg-success-secondary ring-tertiary',
    icon: 'text-fg-success-primary',
    glyph: 'check',
    title: 'text-primary',
    body: 'text-secondary',
  },
  warning: {
    container: 'bg-warning-secondary ring-tertiary',
    icon: 'text-fg-warning-primary',
    glyph: 'warning',
    title: 'text-primary',
    body: 'text-secondary',
  },
  info: {
    container: 'bg-brand-primary ring-tertiary',
    icon: 'text-fg-brand-primary',
    glyph: 'shield',
    title: 'text-primary',
    body: 'text-secondary',
  },
}

interface AlertProps {
  tone?: Tone
  title?: string
  children: ReactNode
  className?: string
}

export function Alert({ tone = 'info', title, children, className }: AlertProps) {
  const styles = tones[tone]
  const compact = useDensity() === 'compact'

  return (
    <div
      role="alert"
      className={cn(
        'flex items-start rounded-xl shadow-xs ring-1 ring-inset',
        compact ? 'gap-2 p-3' : 'gap-3 p-4',
        styles.container,
        className,
      )}
    >
      <Icon name={styles.glyph} className={cn('mt-0.5 shrink-0', compact ? 'size-4' : 'size-5', styles.icon)} />
      <div className={cn('min-w-0', compact ? 'text-xs' : 'text-sm')}>
        {title && <p className={cn('font-semibold', styles.title)}>{title}</p>}
        <p className={cn(title ? 'mt-0.5' : undefined, styles.body)}>{children}</p>
      </div>
    </div>
  )
}