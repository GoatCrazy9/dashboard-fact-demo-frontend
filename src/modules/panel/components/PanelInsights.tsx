import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useAsyncData } from '@/shared/hooks/useAsyncData'
import { hoyEnLima } from '@/shared/utils/fechas'
import { soles } from '@/shared/utils/format'
import { Icon } from '@/shared/ui/icons'
import { Skeleton } from '@/shared/ui/Skeleton'
import { reportesService } from '@/modules/reportes/service/reportesService'
import type { PanelResumen } from '@/shared/types'
import { GraficoArea, type PuntoVenta } from './GraficoArea'
import { GraficoDona, GraficoDonaSkeleton } from './GraficoDona'
import { GraficoRadial, GraficoRadialSkeleton } from './GraficoRadial'

const numero = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 2 })

function Tarjeta({
  titulo,
  descripcion,
  children,
}: {
  titulo: string
  descripcion: string
  children: ReactNode
}) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5 rounded-xl bg-secondary shadow-xs ring-1 ring-secondary ring-inset">
      <div className="flex flex-col gap-0.5 px-5 pt-3 pb-2">
        <h3 className="text-sm font-semibold text-primary">{titulo}</h3>
        <p className="text-xs text-tertiary">{descripcion}</p>
      </div>
      <div className="flex flex-1 flex-col rounded-xl bg-primary p-5 ring-1 ring-secondary ring-inset">
        {children}
      </div>
    </div>
  )
}

function DistribucionMes({ resumen }: { resumen: PanelResumen | null }) {
  return (
    <Tarjeta titulo="Distribución del mes" descripcion="Facturación, boletas e IGV">
      <GraficoRadial
        titulo="Distribución del mes"
        etiquetaCentro="Ventas del mes"
        valorCentro={soles(resumen?.ventasMes ?? 0)}
        series={[
          { etiqueta: 'Facturas', valor: resumen?.montoFacturasMes ?? 0, formato: soles },
          { etiqueta: 'Boletas', valor: resumen?.montoBoletasMes ?? 0, formato: soles },
          { etiqueta: 'IGV', valor: resumen?.igvMes ?? 0, formato: soles },
        ]}
      />
    </Tarjeta>
  )
}

function VentasPorHora({ resumen }: { resumen: PanelResumen | null }) {
  const puntos = useMemo<PuntoVenta[]>(
    () =>
      (resumen?.ventasPorHora ?? []).map((punto) => ({
        etiqueta: punto.hora,
        total: punto.total,
        cantidad: punto.cantidad,
      })),
    [resumen],
  )
  const horaMaxima = puntos.reduce<PuntoVenta | null>(
    (mejor, punto) => (!mejor || punto.total > mejor.total ? punto : mejor),
    null,
  )
  const horaPico = horaMaxima && horaMaxima.total > 0 ? horaMaxima : null

  return (
    <Tarjeta titulo="Ventas por hora" descripcion="Últimas 24 horas registradas">
      <div className="flex flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-xs text-tertiary">Hora pico</p>
            <p className="text-display-xs font-semibold text-primary tabular-nums">
              {horaPico?.etiqueta ?? '—'}
            </p>
          </div>
          {horaPico && (
            <p className="text-sm text-tertiary tabular-nums">
              <span className="font-semibold text-primary">{soles(horaPico.total)}</span> ·{' '}
              {numero.format(horaPico.cantidad)} comprobantes
            </p>
          )}
        </div>

        <GraficoArea
          puntos={puntos}
          altura={88}
          className="text-fg-success-secondary"
          ariaLabel="Ventas por hora en las últimas 24 horas"
        />
        <div className="flex justify-between text-xs text-tertiary tabular-nums">
          <span>00:00</span>
          <span>12:00</span>
          <span>23:00</span>
        </div>
      </div>
    </Tarjeta>
  )
}

function TopProductos() {
  const [rangoMes] = useState(() => {
    const hoy = hoyEnLima()
    return { desde: `${hoy.slice(0, 7)}-01`, hasta: hoy }
  })
  const { data: reporte, error, loading } = useAsyncData(
    () => reportesService.ventas(rangoMes),
    [rangoMes],
  )
  const productos = useMemo(
    () =>
      [...(reporte?.porProducto ?? [])]
        .sort((a, b) => b.totalPEN - a.totalPEN || b.cantidad - a.cantidad)
        .slice(0, 5),
    [reporte],
  )

  return (
    <Tarjeta titulo="Top productos" descripcion="Mayor facturación del mes, en PEN">
      <div className="flex flex-1 flex-col gap-3">
        {loading && !reporte ? (
          <ol
            role="status"
            aria-label="Cargando productos"
            className="flex flex-col gap-3"
          >
            {[0, 1, 2, 3, 4].map((fila) => (
              <li key={fila} className="flex items-center gap-3">
                {fila === 0 && <span className="sr-only">Cargando productos…</span>}
                <Skeleton className="size-7 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-full max-w-52" />
                  <Skeleton className="h-2.5 w-20" />
                </div>
                <Skeleton className="h-3.5 w-20 shrink-0" />
              </li>
            ))}
          </ol>
        ) : productos.length ? (
          <ol className="flex flex-col gap-3">
            {productos.map((producto, indice) => (
              <li key={producto.descripcion} className="flex items-center gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-secondary_alt text-xs font-semibold text-secondary tabular-nums ring-1 ring-secondary ring-inset">
                  {indice + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-primary">
                    {producto.descripcion}
                  </p>
                  <p className="text-xs text-tertiary tabular-nums">
                    {numero.format(producto.cantidad)} und.
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-primary tabular-nums">
                  {soles(producto.totalPEN)}
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="py-6 text-center text-sm text-tertiary">
            {error ? 'No se pudo cargar el ranking.' : 'Sin ventas registradas este mes.'}
          </p>
        )}

        <Link
          to="/reportes"
          className="mt-auto inline-flex items-center gap-1 self-start rounded text-sm font-semibold text-brand-secondary outline-focus-ring hover:text-brand-secondary_hover focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Ver reporte completo
          <Icon name="chevron-right" className="size-4" />
        </Link>
      </div>
    </Tarjeta>
  )
}

function SeguimientoSunat({ resumen }: { resumen: PanelResumen | null }) {
  const formato = (valor: number) => numero.format(valor)

  return (
    <Tarjeta titulo="Seguimiento SUNAT" descripcion="Pendientes de CDR y actividad del mes">
      <GraficoDona
        titulo="Seguimiento SUNAT"
        segmentos={[
          {
            etiqueta: 'Aceptados',
            valor: Math.max(
              0,
              (resumen?.comprobantesMes ?? 0) - (resumen?.comprobantesPendientes ?? 0),
            ),
            formato,
          },
          {
            etiqueta: 'Esperando CDR',
            valor: resumen?.comprobantesPendientes ?? 0,
            formato,
          },
          {
            etiqueta: 'Clientes activos',
            valor: resumen?.clientesActivos ?? 0,
            formato,
          },
        ]}
      />

      <Link
        to="/comprobantes"
        className="mt-4 inline-flex items-center gap-1 self-start rounded text-sm font-semibold text-brand-secondary outline-focus-ring hover:text-brand-secondary_hover focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        Ver comprobantes
        <Icon name="chevron-right" className="size-4" />
      </Link>
    </Tarjeta>
  )
}

/** Bloques complementarios del panel, todos con datos reales ya disponibles en la API. */
export function PanelInsights({ resumen }: { resumen: PanelResumen | null }) {
  return (
    <>
      <section className="px-4 lg:px-8">
        <div className="grid gap-5 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-6">
          <DistribucionMes resumen={resumen} />
          <VentasPorHora resumen={resumen} />
        </div>
      </section>

      <section className="px-4 lg:px-8">
        <div className="grid gap-5 md:grid-cols-2 lg:gap-6">
          <TopProductos />
          <SeguimientoSunat resumen={resumen} />
        </div>
      </section>
    </>
  )
}

/** Silueta de los bloques complementarios para usar dentro de `PanelSkeleton`. */
export function PanelInsightsSkeleton() {
  return (
    <>
      <section className="px-4 lg:px-8" aria-hidden="true">
        <div className="grid gap-5 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-6">
          {[0, 1].map((tarjeta) => (
            <div
              key={tarjeta}
              className="flex min-w-0 flex-col gap-0.5 rounded-xl bg-secondary shadow-xs ring-1 ring-secondary ring-inset"
            >
              <div className="flex flex-col gap-1 px-5 pt-3 pb-2">
                <Skeleton className="h-3.5 w-40" />
                <Skeleton className="h-2.5 w-52 max-w-full" />
              </div>
              <div className="flex flex-1 flex-col gap-4 rounded-xl bg-primary p-5 ring-1 ring-secondary ring-inset">
                {tarjeta === 0 ? (
                  <GraficoRadialSkeleton />
                ) : (
                  <>
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-22 w-full" />
                    <div className="flex justify-between">
                      {[0, 1, 2].map((etiqueta) => (
                        <Skeleton key={etiqueta} className="h-2.5 w-10" />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 lg:px-8" aria-hidden="true">
        <div className="grid gap-5 md:grid-cols-2 lg:gap-6">
          {[0, 1].map((tarjeta) => (
            <div
              key={tarjeta}
              className="flex min-w-0 flex-col gap-0.5 rounded-xl bg-secondary shadow-xs ring-1 ring-secondary ring-inset"
            >
              <div className="flex flex-col gap-1 px-5 pt-3 pb-2">
                <Skeleton className="h-3.5 w-40" />
                <Skeleton className="h-2.5 w-52 max-w-full" />
              </div>
              <div className="flex flex-1 flex-col gap-3 rounded-xl bg-primary p-5 ring-1 ring-secondary ring-inset">
                {tarjeta === 0 ? (
                  <>
                    {[0, 1, 2, 3, 4].map((fila) => (
                      <div key={fila} className="flex items-center gap-3">
                        <Skeleton className="size-7 shrink-0 rounded-lg" />
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <Skeleton className="h-3.5 w-full max-w-52" />
                          <Skeleton className="h-2.5 w-20" />
                        </div>
                        <Skeleton className="h-3.5 w-20 shrink-0" />
                      </div>
                    ))}
                    <Skeleton className="h-3.5 w-36 self-start" />
                  </>
                ) : (
                  <>
                    <GraficoDonaSkeleton />
                    <Skeleton className="h-3.5 w-36 self-start" />
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
