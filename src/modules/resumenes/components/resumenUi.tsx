import { Badge } from '@/shared/ui/Badge'
import { Skeleton, TopProgressBar } from '@/shared/ui/Skeleton'
import type { EstadoResumenSunat, TipoResumenSunat } from '@/shared/types'

export const ETIQUETAS_TIPO: Record<TipoResumenSunat, string> = {
  RESUMEN_DIARIO: 'Resumen diario',
  COMUNICACION_BAJA: 'Comunicación de baja',
}

export const ETIQUETAS_ESTADO: Record<EstadoResumenSunat, string> = {
  GENERADO: 'Generado',
  PENDIENTE: 'En proceso en SUNAT',
  ACEPTADO: 'Aceptado',
  RECHAZADO: 'Rechazado',
}

const TONOS: Record<EstadoResumenSunat, 'warning' | 'success' | 'error' | 'gray'> = {
  GENERADO: 'gray',
  PENDIENTE: 'warning',
  ACEPTADO: 'success',
  RECHAZADO: 'error',
}

/** Los códigos LOCAL-* identifican registros creados sin credenciales del proveedor directo. */
export function esRegistroLocal(codigo: string | null): boolean {
  return Boolean(codigo?.startsWith('LOCAL-'))
}

export function EstadoResumenBadge({
  estado,
  codigo,
  sinCdr = false,
}: {
  estado: EstadoResumenSunat
  codigo?: string | null
  sinCdr?: boolean
}) {
  const esErrorEnvio = estado === 'RECHAZADO' && codigo === 'ERROR_ENVIO'
  const etiqueta = sinCdr
    ? 'Sin constancia'
    : estado === 'ACEPTADO' && esRegistroLocal(codigo ?? null)
      ? 'Aceptado (local)'
      : ETIQUETAS_ESTADO[estado]
  return <Badge tone={sinCdr || esErrorEnvio ? 'warning' : TONOS[estado]}>{etiqueta}</Badge>
}

/** Silueta del formulario de alta: cabecera, aviso, dos secciones y resumen lateral. */
export function ResumenFormSkeleton() {
  return (
    <div role="status" aria-label="Cargando formulario de resumen" className="flex flex-col">
      <TopProgressBar />
      <span className="sr-only">Cargando formulario de resumen…</span>
      <div className="mb-8 w-full px-4 lg:px-8">
        <div className="space-y-2">
          <Skeleton className="h-6 w-64 max-w-full" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
      </div>
      <div className="flex w-full flex-col gap-6 px-4 lg:px-8">
        <Skeleton className="h-16 w-full rounded-xl" />
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="min-w-0 space-y-4 lg:col-span-2">
            {[0, 1].map((seccion) => (
              <div key={seccion} className="rounded-xl bg-primary shadow-xs ring-1 ring-secondary ring-inset">
                <div className="flex items-center gap-3 border-b border-secondary p-4 lg:px-6">
                  <Skeleton className="size-9 rounded-lg" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-64 max-w-full" />
                  </div>
                </div>
                <div className="grid gap-4 p-4 sm:grid-cols-2 lg:p-6">
                  <Skeleton className="h-10 w-full rounded-lg" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                  <Skeleton className="h-24 w-full rounded-lg sm:col-span-2" />
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-xl bg-primary shadow-xs ring-1 ring-secondary ring-inset">
            <div className="border-b border-secondary p-4 lg:px-6">
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="space-y-4 p-4 lg:p-6">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Silueta del detalle: cabecera, tarjeta de estado y tabla de comprobantes. */
export function ResumenDetalleSkeleton() {
  return (
    <div role="status" aria-label="Cargando detalle del resumen" className="flex flex-col">
      <TopProgressBar />
      <span className="sr-only">Cargando detalle del resumen…</span>
      <div className="mb-8 w-full px-4 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-72 max-w-full" />
            <Skeleton className="h-4 w-96 max-w-full" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-9 w-28 rounded-lg" />
            <Skeleton className="h-9 w-36 rounded-lg" />
          </div>
        </div>
      </div>
      <div className="flex w-full flex-col gap-4 px-4 lg:px-8">
        <div className="rounded-xl bg-primary shadow-xs ring-1 ring-secondary ring-inset">
          <div className="flex items-center justify-between gap-3 border-b border-secondary p-4 lg:px-6">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-5 w-24 rounded-md" />
          </div>
          <div className="space-y-2 p-4 lg:p-6">
            <Skeleton className="h-3 w-64 max-w-full" />
            <Skeleton className="h-3 w-80 max-w-full" />
          </div>
        </div>
        <div className="rounded-xl bg-primary p-4 shadow-xs ring-1 ring-secondary ring-inset sm:p-8">
          <Skeleton className="h-5 w-48" />
          <div className="mt-6 space-y-3">
            {Array.from({ length: 5 }).map((_, indice) => (
              <Skeleton key={indice} className="h-8 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
