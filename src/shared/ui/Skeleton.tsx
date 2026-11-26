import { cn } from '@/shared/utils/cn'

interface SkeletonProps {
  className?: string
}

/** Bloque neutro para estados de carga; efecto shimmer y pulso suave. */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-md bg-tertiary/80 animate-pulse before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-primary/35 before:to-transparent',
        className,
      )}
    />
  )
}

/** Barra de progreso superior indeterminada durante transiciones de ruta o carga de módulo. */
export function TopProgressBar() {
  return (
    <div
      role="progressbar"
      aria-label="Cargando contenido"
      className="fixed inset-x-0 top-0 z-[100] h-0.5 overflow-hidden bg-brand-primary/40"
    >
      <div className="h-full w-full origin-left animate-indeterminate bg-brand-solid" />
    </div>
  )
}

/** Varias líneas de texto para listas y tablas. */
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className={cn('h-3', index === lines - 1 ? 'w-2/3' : 'w-full')}
        />
      ))}
    </div>
  )
}

/**
 * Esqueleto estructural completo para la carga inicial de un módulo (Suspense).
 * Mantiene la silueta de Header, Filtros y Tabla para eliminar el salto de layout (CLS).
 */
export function PageSkeleton() {
  return (
    <div role="status" aria-label="Cargando módulo" className="w-full space-y-4 py-1">
      <TopProgressBar />
      <span className="sr-only">Cargando módulo…</span>

      {/* PageHeader Skeleton */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-3 w-14" />
            <span className="text-xs text-tertiary">/</span>
            <Skeleton className="h-3 w-24" />
          </div>
          {/* Title */}
          <Skeleton className="h-5 w-40" />
          {/* Description */}
          <Skeleton className="h-3 w-64 max-w-full" />
        </div>
        {/* Action Button */}
        <Skeleton className="h-7.5 w-28 rounded-lg" />
      </div>

      {/* FilterCard Skeleton */}
      <div className="mt-4 rounded-2xl bg-primary p-3 shadow-xs ring-1 ring-inset ring-tertiary">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
          <div className="flex flex-wrap items-end gap-2.5">
            <div className="space-y-1">
              <Skeleton className="h-2.5 w-12" />
              <Skeleton className="h-7.5 w-32 rounded-lg" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-2.5 w-14" />
              <Skeleton className="h-7.5 w-36 rounded-lg" />
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <div className="space-y-1">
              <Skeleton className="h-2.5 w-14" />
              <Skeleton className="h-7.5 w-48 rounded-lg" />
            </div>
            <Skeleton className="h-7.5 w-20 rounded-lg" />
          </div>
        </div>
      </div>

      {/* TableCard Skeleton */}
      <div className="mt-5 overflow-hidden rounded-2xl bg-primary shadow-xs ring-1 ring-inset ring-tertiary">
        <div className="border-b border-tertiary/60 px-4 py-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-1 h-2.5 w-20" />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="h-9 border-b border-tertiary/50 bg-primary">
              <tr>
                {['w-28', 'w-36', 'w-24', 'w-20', 'w-16 ml-auto'].map((w, idx) => (
                  <th key={idx} className="px-4 py-1.5 text-start">
                    <Skeleton className={cn('h-2.5', w)} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-tertiary/40 [&_tr:nth-child(odd)]:bg-row_alt">
              {Array.from({ length: 5 }).map((_, row) => (
                <tr key={row} className="h-11">
                  <td className="px-4 py-2"><Skeleton className="h-3 w-28" /></td>
                  <td className="px-4 py-2"><Skeleton className="h-3 w-40" /></td>
                  <td className="px-4 py-2"><Skeleton className="h-3 w-24" /></td>
                  <td className="px-4 py-2"><Skeleton className="h-5 w-16 rounded-full" /></td>
                  <td className="px-4 py-2"><Skeleton className="ml-auto h-6 w-16 rounded-md" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
