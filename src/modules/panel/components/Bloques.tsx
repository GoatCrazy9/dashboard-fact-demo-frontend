import type { ReactNode } from 'react'
import { Skeleton } from '@/shared/ui/Skeleton'
import { Icon, type IconName } from '@/shared/ui/icons'
import { cn } from '@/shared/utils/cn'

export type TonoIndicador = 'error' | 'warning' | 'success'

/** Indicador compacto del dashboard, con el mismo patrón visual que dojo. */
export function Indicador({
  etiqueta,
  valor,
  detalle,
  icono,
  tono,
  cargando = false,
}: {
  etiqueta: string
  valor: string
  detalle?: string
  icono: IconName
  tono?: TonoIndicador
  cargando?: boolean
}) {
  if (cargando) {
    return (
      <div className="space-y-2 rounded-xl bg-primary p-3 shadow-xs ring-1 ring-tertiary ring-inset">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-2.5 w-20" />
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-primary p-3 shadow-xs ring-1 ring-tertiary ring-inset">
      <div className="flex items-start justify-between gap-2">
        <p className="line-clamp-2 text-xs font-medium text-tertiary">{etiqueta}</p>
        <span
          className={cn(
            'flex size-7 shrink-0 items-center justify-center rounded-lg',
            tono === 'error'
              ? 'bg-error-secondary text-fg-error-primary'
              : tono === 'warning'
                ? 'bg-warning-secondary text-fg-warning-primary'
                : tono === 'success'
                  ? 'bg-success-secondary text-fg-success-primary'
                  : 'bg-tertiary text-fg-secondary',
          )}
        >
          <Icon name={icono} className="size-4" />
        </span>
      </div>
      <p className="mt-1.5 truncate text-lg font-semibold text-primary tabular-nums sm:text-xl">
        {valor}
      </p>
      {detalle && <p className="mt-0.5 line-clamp-2 text-[11px] text-tertiary">{detalle}</p>}
    </div>
  )
}

export function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section aria-label={titulo} className="mt-5">
      <h2 className="mb-2 text-xs font-semibold tracking-wide text-tertiary uppercase">{titulo}</h2>
      {children}
    </section>
  )
}
