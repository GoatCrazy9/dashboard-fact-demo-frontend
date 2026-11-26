import type { ReactNode } from 'react'
import { cn } from '@/shared/utils/cn'

export function Card({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'rounded-2xl bg-primary shadow-xs ring-1 ring-tertiary ring-inset',
        className,
      )}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
  /** 'compact' reduce tipografía y espaciado de la cabecera (formularios y listados densos). */
  density?: 'default' | 'compact'
}

export function CardHeader({ title, description, actions, density = 'default' }: CardHeaderProps) {
  const compact = density === 'compact'
  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-3', compact ? 'px-4 py-3' : 'px-6 py-5')}>
      <div>
        <h3 className={cn('font-semibold text-primary', compact ? 'text-base' : 'text-lg')}>{title}</h3>
        {description && <p className={cn('text-tertiary', compact ? 'mt-0.5 text-xs' : 'mt-1 text-sm')}>{description}</p>}
      </div>
      {actions}
    </div>
  )
}

export function CardBody({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('space-y-6 border-t border-tertiary p-4 sm:p-6', className)}>
      {children}
    </div>
  )
}