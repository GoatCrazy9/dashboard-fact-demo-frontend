import { cn } from '@/shared/utils/cn'
import { Skeleton, TopProgressBar } from '@/shared/ui/Skeleton'

export type PestanaReporteSkeleton = 'RESUMEN' | 'DETALLE' | 'DIA' | 'PRODUCTO'

const CURVA_SKELETON = 'M0,74 C18,62 28,66 42,48 S70,52 84,30 S96,34 100,18'

function GraficoAreaSkeleton() {
  return (
    <div className="relative h-45 w-full overflow-hidden rounded-md" aria-hidden="true">
      <Skeleton className="absolute inset-0 opacity-30" />
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

function TarjetasSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[0, 1, 2, 3].map((indice) => (
        <div
          key={indice}
          className="flex flex-col gap-4 rounded-xl bg-primary p-5 shadow-xs ring-1 ring-secondary ring-inset"
        >
          <div className="flex items-center justify-between gap-2">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="size-8 rounded-lg" />
          </div>
          <Skeleton className="h-8 w-32 max-w-full" />
          <Skeleton className="h-3.5 w-40 max-w-full" />
        </div>
      ))}
    </div>
  )
}

function TablaSkeleton({
  titulo,
  columnas,
}: {
  titulo: string
  columnas: { cabecera: string; celda: React.ReactNode; alineacion?: 'right' }[]
}) {
  return (
    <div className="bg-primary shadow-xs ring-1 ring-secondary -mx-4 rounded-none ring-inset lg:mx-0 lg:rounded-xl">
      <div className="flex items-center gap-2 border-b border-secondary px-4 py-4 lg:px-6">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-5 w-8 rounded-md" />
        <span className="sr-only">{titulo}</span>
      </div>
      <div className="hidden lg:block">
        <table className="w-full overflow-x-hidden" aria-hidden="true">
          <thead className="relative h-11 bg-secondary [&>tr>th]:after:pointer-events-none [&>tr>th]:after:absolute [&>tr>th]:after:inset-x-0 [&>tr>th]:after:bottom-0 [&>tr>th]:after:h-px [&>tr>th]:after:bg-border-secondary">
            <tr>
              {columnas.map((columna, indice) => (
                <th
                  key={indice}
                  scope="col"
                  className={cn(
                    'relative p-0 px-6 py-2 nth-2:pl-3',
                    columna.alineacion === 'right' && 'text-right',
                  )}
                >
                  <div className={cn('flex', columna.alineacion === 'right' && 'justify-end')}>
                    <Skeleton className={cn('h-3', columna.cabecera)} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, fila) => (
              <tr
                key={fila}
                className="relative h-18 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-px after:w-full after:bg-border-secondary last:after:hidden"
              >
                {columnas.map((columna, indice) => (
                  <td
                    key={indice}
                    className={cn(
                      'relative px-6 py-4 nth-2:pl-3',
                      columna.alineacion === 'right' && 'text-right',
                    )}
                  >
                    {columna.celda}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col gap-3 p-4 lg:hidden">
        {Array.from({ length: 4 }).map((_, indice) => (
          <div
            key={indice}
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
              {[0, 1].map((celda) => (
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
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-secondary px-4 py-3 md:px-6 md:pt-3 md:pb-4">
        <Skeleton className="h-3 w-40 max-w-full" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
    </div>
  )
}

/** Silueta del reporte según la sección activa; conserva altura y evita CLS. */
export function ReportesSkeleton({ pestana }: { pestana: PestanaReporteSkeleton }) {
  return (
    <div role="status" aria-label="Cargando reporte de ventas" className="flex flex-col">
      <TopProgressBar />
      <span className="sr-only">Cargando reporte de ventas…</span>

      <div className="mb-8 flex w-full flex-col gap-5 px-4 lg:px-8">
        <div className="relative flex flex-col gap-5 bg-primary">
          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="flex flex-1 flex-col gap-1">
              <Skeleton className="h-6 w-44 max-w-full" />
              <Skeleton className="h-4 w-80 max-w-full" />
            </div>
            <div className="flex flex-wrap items-start gap-3">
              <Skeleton className="h-9 w-32 rounded-lg" />
              <Skeleton className="h-9 w-28 rounded-lg" />
            </div>
          </div>
        </div>
        <div className="relative flex flex-wrap gap-3 border-b border-border-secondary pb-2.5">
          {['w-20', 'w-16', 'w-20', 'w-24'].map((ancho, indice) => (
            <Skeleton key={indice} className={cn('h-4', ancho)} />
          ))}
        </div>
      </div>

      <div className="flex w-full flex-col gap-6 px-4 lg:px-8">
        <div className="flex flex-wrap gap-3">
          {pestana !== 'RESUMEN' && <Skeleton className="h-10 w-full max-w-80 rounded-lg sm:h-9 sm:flex-1" />}
          <div className={cn('relative', pestana === 'RESUMEN' && 'ml-auto')}>
            <Skeleton className="h-9 w-52 max-w-full rounded-lg" />
          </div>
        </div>

        {pestana === 'RESUMEN' ? (
          <div className="flex flex-col gap-6">
            <TarjetasSkeleton />

            <div className="bg-primary shadow-xs ring-1 ring-secondary -mx-4 rounded-none ring-inset lg:mx-0 lg:rounded-xl">
              <div className="flex flex-col gap-1 border-b border-secondary px-4 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-6">
                <div className="space-y-1.5">
                  <Skeleton className="h-5 w-36" />
                  <Skeleton className="h-3.5 w-52 max-w-full" />
                </div>
                <Skeleton className="h-3.5 w-28 max-w-full" />
              </div>
              <div className="px-4 py-5 lg:px-6">
                <GraficoAreaSkeleton />
                <div className="mt-3 flex justify-between gap-3">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            </div>

            <div className="bg-primary shadow-xs ring-1 ring-secondary -mx-4 rounded-none ring-inset lg:mx-0 lg:rounded-xl">
              <div className="space-y-1.5 border-b border-secondary px-4 py-4 lg:px-6">
                <Skeleton className="h-5 w-48 max-w-full" />
                <Skeleton className="h-3.5 w-56 max-w-full" />
              </div>
              <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4 lg:p-6">
                {[0, 1, 2, 3].map((indice) => (
                  <div key={indice} className="min-w-0 rounded-lg bg-secondary p-3 ring-1 ring-tertiary ring-inset">
                    <Skeleton className="h-3 w-20 max-w-full" />
                    <Skeleton className="mt-2 h-3.5 w-24 max-w-full" />
                    <Skeleton className="mt-1 h-3 w-28 max-w-full" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : pestana === 'DETALLE' ? (
          <TablaSkeleton
            titulo="Detalle de ventas"
            columnas={[
              {
                cabecera: 'w-24',
                celda: (
                  <div className="space-y-1.5">
                    <Skeleton className="h-3.5 w-40" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                ),
              },
              { cabecera: 'w-12', celda: <Skeleton className="h-3.5 w-16" /> },
              { cabecera: 'w-20', celda: <Skeleton className="h-5 w-24 rounded-md" /> },
              {
                cabecera: 'w-24',
                celda: <Skeleton className="ms-auto h-3.5 w-24" />,
                alineacion: 'right',
              },
              { cabecera: 'w-20', celda: <Skeleton className="h-3.5 w-28" /> },
            ]}
          />
        ) : pestana === 'DIA' ? (
          <TablaSkeleton
            titulo="Ventas por día"
            columnas={[
              { cabecera: 'w-24', celda: <Skeleton className="h-3.5 w-28" /> },
              {
                cabecera: 'w-20',
                celda: <Skeleton className="ms-auto h-3.5 w-24" />,
                alineacion: 'right',
              },
              {
                cabecera: 'w-20',
                celda: <Skeleton className="ms-auto h-3.5 w-20" />,
                alineacion: 'right',
              },
            ]}
          />
        ) : (
          <TablaSkeleton
            titulo="Ventas por producto"
            columnas={[
              {
                cabecera: 'w-32',
                celda: (
                  <div className="flex items-center gap-3">
                    <Skeleton className="size-8 shrink-0 rounded-full" />
                    <Skeleton className="h-3.5 w-40" />
                  </div>
                ),
              },
              {
                cabecera: 'w-20',
                celda: <Skeleton className="ms-auto h-3.5 w-16" />,
                alineacion: 'right',
              },
              {
                cabecera: 'w-24',
                celda: <Skeleton className="ms-auto h-3.5 w-24" />,
                alineacion: 'right',
              },
            ]}
          />
        )}
      </div>
    </div>
  )
}
