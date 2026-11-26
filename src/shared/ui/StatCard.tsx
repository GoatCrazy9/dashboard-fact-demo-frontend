import { Icon } from './icons'
import type { IconName } from './icons'
import { Badge } from './Badge'
import { Skeleton } from './Skeleton'

interface StatCardProps {
  label: string
  value: string | number
  hint?: string
  trend?: { value: string; direction: 'up' | 'down' }
  icon: IconName
  isLoading?: boolean
}

export function StatCard({ label, value, hint, trend, icon, isLoading = false }: StatCardProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl bg-primary p-5 shadow-xs ring-1 ring-tertiary ring-inset md:p-6">
        <Skeleton className="size-12 rounded-xl" />
        <div className="mt-5 space-y-3">
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-primary p-5 shadow-xs ring-1 ring-tertiary ring-inset md:p-6">
      <div className="flex size-12 items-center justify-center rounded-xl bg-tertiary">
        <Icon name={icon} className="size-6 text-primary" />
      </div>

      <div className="mt-5 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <span className="text-sm text-tertiary">{label}</span>
          <h4 className="mt-2 text-display-sm font-bold text-primary">{value}</h4>
          {hint && <p className="mt-1 text-xs text-quaternary">{hint}</p>}
        </div>

        {trend && (
          <Badge
            tone={trend.direction === 'up' ? 'success' : 'error'}
            startIcon={
              <Icon
                name={trend.direction === 'up' ? 'arrow-up' : 'arrow-down'}
                className="size-3.5"
              />
            }
          >
            {trend.value}
          </Badge>
        )}
      </div>
    </div>
  )
}