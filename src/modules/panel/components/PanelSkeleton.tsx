import { cn } from '@/shared/utils/cn'
import { Skeleton, TopProgressBar } from '@/shared/ui/Skeleton'
import { PanelInsightsSkeleton } from './PanelInsights'

const CURVA_SKELETON = 'M0,74 C18,62 28,66 42,48 S70,52 84,30 S96,34 100,18'

/** Silueta del gráfico de área curva mientras llega `/api/panel/resumen`. */
function GraficoSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('relative w-full overflow-hidden rounded-md', className)} aria-hidden="true">
      <Skeleton className="absolute inset-0 opacity-40" />
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="relative size-full animate-pulse text-tertiary/70"
      >
        <path
          d={`${CURVA_SKELETON} L100,100 L0,100 Z`}
          fill="currentColor"
          fillOpacity="0.12"
          stroke="none"
        />
        <path
          d={CURVA_SKELETON}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  )
}

function TabsSkeleton() {
  return (
    <div className="flex flex-wrap gap-0.5 rounded-lg bg-secondary_alt p-0.5">
      {['w-16', 'w-16', 'w-16'].map((ancho, indice) => (
        <Skeleton key={indice} className={cn('h-8 rounded-lg', ancho)} />
      ))}
    </div>
  )
}

/** Esqueleto de todo el panel: conserva la estructura para evitar saltos de layout. */
export function PanelSkeleton() {
  return (
    <div role="status" aria-label="Cargando panel" className="flex flex-col gap-8">
      <TopProgressBar />
      <span className="sr-only">Cargando panel…</span>

      <section className="flex flex-col gap-5 px-4 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="flex flex-1 items-center gap-3">
            <Skeleton className="size-14 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-6 w-72 max-w-full" />
              <Skeleton className="h-3 w-52" />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Skeleton className="h-12 w-full rounded-lg sm:h-10 sm:w-70" />
            <Skeleton className="size-12 rounded-lg sm:h-10 sm:w-44" />
          </div>
        </div>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-wrap gap-0.5 rounded-lg bg-secondary_alt p-0.5">
            {['w-16', 'w-20', 'w-16', 'w-16', 'w-20'].map((ancho, indice) => (
              <Skeleton key={indice} className={cn('h-8 rounded-lg', ancho)} />
            ))}
          </div>
          <Skeleton className="h-9 w-40 rounded-lg" />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-8 px-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3 lg:gap-8 lg:px-8">
        {[0, 1, 2].map((indice) => (
          <div key={indice} className="w-full min-w-0 max-w-lg">
            <div className="flex flex-col overflow-hidden rounded-xl bg-secondary shadow-xs ring-1 ring-secondary ring-inset">
              <div className="mb-0.5 px-4 pt-3 pb-2 md:px-5">
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="relative flex flex-col gap-4 rounded-xl bg-primary px-4 py-5 shadow-xs ring-1 ring-secondary ring-inset md:gap-5 md:px-5">
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-3 pe-6">
                    <Skeleton className="h-9 w-40 max-w-full" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                  <Skeleton className="h-3 w-56 max-w-full" />
                </div>
                <GraficoSkeleton className="h-14" />
                <Skeleton className="absolute top-4 right-4 size-5 rounded-md md:top-5 md:right-5" />
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="px-4 lg:px-8">
        <div className="flex flex-col gap-0.5 rounded-xl bg-secondary shadow-xs ring-1 ring-secondary ring-inset">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-3 pb-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-52 max-w-full" />
          </div>
          <div className="flex flex-col gap-5 rounded-xl bg-primary p-5 ring-1 ring-secondary ring-inset">
            <div className="flex flex-col gap-3">
              <Skeleton className="h-9 w-48 max-w-full" />
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-40 max-w-full" />
              </div>
            </div>
            <div className="flex h-54 flex-col gap-1.5 lg:h-60">
              <GraficoSkeleton className="flex-1" />
              <div className="flex justify-between px-2">
                {[0, 1, 2, 3, 4, 5].map((indice) => (
                  <Skeleton key={indice} className="h-3 w-10 max-w-[16%]" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <PanelInsightsSkeleton />

      <section className="px-4 lg:px-8">
        <div className="bg-primary shadow-xs ring-1 ring-secondary -mx-4 rounded-none ring-inset lg:mx-0 lg:rounded-xl">
          <div className="relative hidden flex-col items-start gap-4 border-b border-secondary bg-primary px-4 py-5 pb-5 md:flex-row md:px-6 lg:flex">
            <div className="flex flex-1 items-center gap-2">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-5 w-24 rounded-md" />
            </div>
            <TabsSkeleton />
          </div>

          <div className="hidden lg:block">
            <table className="w-full overflow-x-hidden" aria-hidden="true">
              <thead className="relative h-11 bg-secondary [&>tr>th]:after:pointer-events-none [&>tr>th]:after:absolute [&>tr>th]:after:inset-x-0 [&>tr>th]:after:bottom-0 [&>tr>th]:after:h-px [&>tr>th]:after:bg-border-secondary">
                <tr>
                  {['w-28', 'w-20', 'w-16', 'w-24', 'w-24', 'w-8'].map((ancho, indice) => (
                    <th key={indice} scope="col" className="relative p-0 px-6 py-2">
                      <Skeleton className={cn('h-2.5', ancho)} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[0, 1, 2, 3, 4].map((fila) => (
                  <tr
                    key={fila}
                    className="relative h-18 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-px after:w-full after:bg-border-secondary last:after:hidden"
                  >
                    <td className="relative px-6 py-4">
                      <Skeleton className="h-3.5 w-40" />
                      <Skeleton className="mt-1.5 h-3 w-24" />
                    </td>
                    <td className="relative px-6 py-4"><Skeleton className="h-3.5 w-20" /></td>
                    <td className="relative px-6 py-4"><Skeleton className="h-3.5 w-16" /></td>
                    <td className="relative px-6 py-4"><Skeleton className="h-5 w-24 rounded-md" /></td>
                    <td className="relative px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="size-8 shrink-0 rounded-full" />
                        <Skeleton className="h-3.5 w-32" />
                      </div>
                    </td>
                    <td className="relative px-4 py-4"><Skeleton className="ms-auto size-7 rounded-lg" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 p-4 lg:hidden">
            <div className="flex flex-col items-start gap-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-44" />
                <Skeleton className="h-5 w-24 rounded-md" />
              </div>
              <TabsSkeleton />
            </div>
            {[0, 1, 2, 3].map((fila) => (
              <div
                key={fila}
                className="flex flex-col gap-3 rounded-xl bg-primary p-4 shadow-xs ring-1 ring-secondary ring-inset"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1.5">
                    <Skeleton className="h-3.5 w-40 max-w-full" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                  <Skeleton className="h-5 w-20 rounded-md" />
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {[0, 1, 2, 3].map((celda) => (
                    <div key={celda} className="space-y-1">
                      <Skeleton className="h-2.5 w-16" />
                      <Skeleton className="h-3.5 w-24 max-w-full" />
                    </div>
                  ))}
                </div>
                <Skeleton className="h-9 w-full rounded-lg" />
              </div>
            ))}
          </div>

          <div className="border-t border-secondary px-4 py-3 md:px-6 md:pt-3 md:pb-4">
            <Skeleton className="h-8 w-full max-w-80 rounded-lg" />
          </div>
        </div>
      </section>
    </div>
  )
}
