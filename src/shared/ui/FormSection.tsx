import type { ReactNode } from 'react'
import { cn } from '@/shared/utils/cn'
import { Card } from './Card'
import { Icon, type IconName } from './icons'

/** Sección de formulario con el mismo patrón visual que Ventas. */
export function FormSection({
  titulo,
  descripcion,
  icono,
  acciones,
  children,
}: {
  titulo: string
  descripcion: string
  icono: IconName
  acciones?: ReactNode
  children: ReactNode
}) {
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-secondary px-4 py-4 lg:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-tertiary text-brand-secondary">
            <Icon name={icono} className="size-4" />
          </span>
          <div className="min-w-0">
            <h2 className="text-md font-semibold text-primary">{titulo}</h2>
            <p className="text-sm text-tertiary">{descripcion}</p>
          </div>
        </div>
        {acciones}
      </div>
      <div className="p-4 lg:p-6">{children}</div>
    </Card>
  )
}

/** Etiqueta + control + error, alineada con la altura h-10 del resto del formulario. */
export function Campo({
  etiqueta,
  children,
  className,
  error,
  pista,
}: {
  etiqueta: string
  children: ReactNode
  className?: string
  error?: string
  pista?: string
}) {
  return (
    <label className={cn('flex min-w-0 flex-col gap-1.5 text-sm', className)}>
      <span className="font-medium text-secondary">{etiqueta}</span>
      {children}
      {error ? (
        <span role="alert" className="text-xs font-medium text-error-primary">
          {error}
        </span>
      ) : pista ? (
        <span className="text-xs text-tertiary">{pista}</span>
      ) : null}
    </label>
  )
}

/** Altura y estilo de control compartidos con el Select de Untitled UI. */
export const inputClass =
  'h-10 w-full min-w-0 rounded-lg bg-primary px-3 text-base text-primary shadow-xs ring-1 ring-primary ring-inset outline-hidden transition-shadow placeholder:text-placeholder focus:ring-2 focus:ring-brand disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm'
