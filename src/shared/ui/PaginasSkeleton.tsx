import type { ReactNode } from 'react'
import { cn } from '@/shared/utils/cn'
import { Skeleton, TopProgressBar } from '@/shared/ui/Skeleton'

/** Cabecera equivalente a `PageHeader` con sus acciones. */
function CabeceraSkeleton({ botones }: { botones: string[] }) {
  return (
    <div className="mb-8 flex w-full flex-col gap-5 px-4 lg:px-8">
      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Skeleton className="h-6 w-64 max-w-full" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <div className="flex flex-wrap items-start gap-3">
          {botones.map((ancho, indice) => (
            <Skeleton key={indice} className={cn('h-9 rounded-lg', ancho)} />
          ))}
        </div>
      </div>
    </div>
  )
}

function TarjetaSkeleton({
  titulo,
  filas,
  className,
}: {
  titulo: string
  filas: number
  className?: string
}) {
  return (
    <div className={cn('rounded-xl bg-primary shadow-xs ring-1 ring-secondary ring-inset', className)}>
      <div className="border-b border-tertiary px-4 py-4 lg:px-6">
        <Skeleton className="h-4 w-40 max-w-full" />
      </div>
      <div className="space-y-3 p-4 lg:p-6">
        {Array.from({ length: filas }).map((_, indice) => (
          <div key={indice} className="flex items-center justify-between gap-4">
            <Skeleton className={cn('h-3', indice % 2 === 0 ? 'w-24' : 'w-32')} />
            <Skeleton className={cn('h-3.5', indice % 2 === 0 ? 'w-40 max-w-[60%]' : 'w-20')} />
          </div>
        ))}
      </div>
      <span className="sr-only">Cargando {titulo}…</span>
    </div>
  )
}

function TablaSkeleton({ columnas, filas = 4 }: { columnas: number; filas?: number }) {
  return (
    <div className="overflow-hidden rounded-xl bg-primary shadow-xs ring-1 ring-secondary ring-inset">
      <div className="hidden border-b border-tertiary lg:block">
        <div className="flex gap-6 px-6 py-3">
          {Array.from({ length: columnas }).map((_, indice) => (
            <Skeleton key={indice} className={cn('h-3', indice === 0 ? 'w-40' : 'w-20')} />
          ))}
        </div>
      </div>
      {Array.from({ length: filas }).map((_, fila) => (
        <div
          key={fila}
          className="flex flex-col gap-2 border-b border-tertiary px-4 py-4 last:border-0 lg:flex-row lg:items-center lg:gap-6 lg:px-6"
        >
          {Array.from({ length: columnas }).map((_, columna) => (
            <Skeleton
              key={columna}
              className={cn('h-3.5', columna === 0 ? 'w-48 max-w-full' : 'w-20 shrink-0')}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

function Envoltorio({
  etiqueta,
  children,
}: {
  etiqueta: string
  children: ReactNode
}) {
  return (
    <div role="status" aria-label={etiqueta} className="flex w-full flex-col">
      <TopProgressBar />
      <span className="sr-only">{etiqueta}…</span>
      {children}
    </div>
  )
}

export function ComprobanteDetalleSkeleton() {
  return (
    <Envoltorio etiqueta="Cargando comprobante">
      <CabeceraSkeleton botones={['w-24', 'w-32', 'w-16', 'w-16', 'w-16', 'w-28']} />
      <div className="flex w-full flex-col gap-4 px-4 lg:px-8">
        <Skeleton className="h-20 w-full rounded-xl" />
        <div className="w-[80mm] max-w-full rounded-lg bg-primary p-4 shadow-xs ring-1 ring-tertiary">
          <div className="flex flex-col items-center gap-2">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-2.5 w-56 max-w-full" />
            <Skeleton className="h-2.5 w-48 max-w-full" />
          </div>
          <div className="my-3 h-px w-full bg-tertiary" />
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, indice) => (
              <Skeleton key={indice} className={cn('h-2.5', indice % 2 ? 'w-4/5' : 'w-full')} />
            ))}
          </div>
          <div className="my-3 h-px w-full bg-tertiary" />
          <div className="ms-auto w-32 space-y-2">
            {Array.from({ length: 3 }).map((_, indice) => (
              <div key={indice} className="flex justify-between gap-2">
                <Skeleton className="h-2.5 w-12" />
                <Skeleton className="h-2.5 w-14" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Envoltorio>
  )
}

export function GuiaDetalleSkeleton() {
  return (
    <Envoltorio etiqueta="Cargando guía de remisión">
      <CabeceraSkeleton botones={['w-24', 'w-28']} />
      <div className="flex w-full flex-col gap-4 px-4 lg:px-8">
        <div className="rounded-xl bg-primary p-4 shadow-xs ring-1 ring-secondary ring-inset lg:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-tertiary pb-4">
            <Skeleton className="h-4 w-48" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-28 rounded-md" />
              <Skeleton className="h-5 w-20 rounded-md" />
            </div>
          </div>
          <div className="flex flex-wrap gap-3 pt-4">
            <Skeleton className="h-9 w-32 rounded-lg" />
            <Skeleton className="h-9 w-36 rounded-lg" />
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <TarjetaSkeleton titulo="datos de la guía" filas={5} />
          <TarjetaSkeleton titulo="transportista" filas={4} />
        </div>
        <TablaSkeleton columnas={4} filas={3} />
      </div>
    </Envoltorio>
  )
}

export function DocumentoDetalleSkeleton() {
  return (
    <Envoltorio etiqueta="Cargando documento">
      <CabeceraSkeleton botones={['w-24', 'w-28', 'w-24']} />
      <div className="flex w-full flex-col gap-4 px-4 lg:px-8">
        <TarjetaSkeleton titulo="estado del documento" filas={3} />
        <div className="grid gap-4 lg:grid-cols-2">
          <TarjetaSkeleton titulo="cliente" filas={4} />
          <TarjetaSkeleton titulo="detalle" filas={4} />
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    </Envoltorio>
  )
}

export function ConfiguracionSkeleton() {
  return (
    <Envoltorio etiqueta="Cargando configuración SUNAT">
      <CabeceraSkeleton botones={['w-24']} />
      <div className="flex w-full flex-col gap-4 px-4 lg:px-8">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, indice) => (
            <div
              key={indice}
              className="rounded-xl bg-primary p-4 shadow-xs ring-1 ring-secondary ring-inset"
            >
              <Skeleton className="h-3 w-24 max-w-full" />
              <Skeleton className="mt-3 h-5 w-32 max-w-full rounded-md" />
              <Skeleton className="mt-3 h-2.5 w-40 max-w-full" />
            </div>
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          <TarjetaSkeleton titulo="emisor" filas={4} />
          <TarjetaSkeleton titulo="emisión directa" filas={5} />
          <TarjetaSkeleton titulo="guías de remisión" filas={5} />
          <TarjetaSkeleton titulo="resúmenes y bajas" filas={3} />
          <TarjetaSkeleton titulo="integraciones" filas={2} />
        </div>
        <div className="rounded-xl bg-primary shadow-xs ring-1 ring-secondary ring-inset">
          <div className="border-b border-tertiary px-4 py-4 lg:px-6">
            <Skeleton className="h-4 w-40 max-w-full" />
          </div>
          <TablaSkeleton columnas={3} filas={4} />
        </div>
        <div className="rounded-xl bg-primary p-4 shadow-xs ring-1 ring-secondary ring-inset lg:p-6">
          <Skeleton className="h-4 w-56 max-w-full" />
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {Array.from({ length: 6 }).map((_, indice) => (
              <Skeleton key={indice} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </Envoltorio>
  )
}

/** Silueta del formulario de venta: dos columnas de edición y resumen lateral. */
export function VentasSkeleton() {
  return (
    <Envoltorio etiqueta="Cargando nueva venta">
      <CabeceraSkeleton botones={['w-32', 'w-28']} />
      <div className="grid w-full grid-cols-1 gap-6 px-4 lg:grid-cols-12 lg:px-8">
        <div className="min-w-0 space-y-4 lg:col-span-7">
          <TarjetaSkeleton titulo="datos del cliente" filas={5} />
          <TarjetaSkeleton titulo="detalle de la venta" filas={4} />
          <TarjetaSkeleton titulo="condiciones" filas={4} />
        </div>
        <div className="min-w-0 space-y-4 lg:col-span-5">
          <TarjetaSkeleton titulo="resumen" filas={4} />
        </div>
      </div>
    </Envoltorio>
  )
}

export function NuevoComprobanteSkeleton() {
  return (
    <Envoltorio etiqueta="Cargando nuevo comprobante">
      <CabeceraSkeleton botones={['w-32']} />
      <div className="grid w-full gap-4 px-4 lg:grid-cols-3 lg:px-8">
        <div className="min-w-0 space-y-4 lg:col-span-2">
          <TarjetaSkeleton titulo="datos del comprobante" filas={3} />
          <TarjetaSkeleton titulo="detalle" filas={2} />
        </div>
        <div className="min-w-0">
          <TarjetaSkeleton titulo="resumen" filas={4} />
        </div>
      </div>
    </Envoltorio>
  )
}

/** Dentro del modal de historial: tarjetas de movimientos, sin barra de página. */
export function MovimientosSkeleton() {
  return (
    <div role="status" aria-label="Cargando movimientos de stock" className="space-y-2">
      <span className="sr-only">Cargando movimientos de stock…</span>
      {Array.from({ length: 4 }).map((_, indice) => (
        <div
          key={indice}
          className="rounded-xl bg-secondary p-3 ring-1 ring-tertiary ring-inset"
        >
          <div className="flex items-center justify-between gap-2">
            <Skeleton className="h-5 w-24 rounded-md" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="mt-2 h-3.5 w-40 max-w-full" />
        </div>
      ))}
    </div>
  )
}

export function AuditoriaSkeleton() {
  return (
    <Envoltorio etiqueta="Cargando auditoría">
      <CabeceraSkeleton botones={['w-24', 'w-28']} />
      <div className="flex w-full flex-col gap-4 px-4 lg:px-8">
        <div className="rounded-xl bg-primary p-4 shadow-xs ring-1 ring-secondary ring-inset lg:p-6">
          <Skeleton className="h-4 w-32" />
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, indice) => (
              <div key={indice} className="space-y-2">
                <Skeleton className="h-2.5 w-20" />
                <Skeleton className="h-9 w-full" />
              </div>
            ))}
          </div>
        </div>
        <TablaSkeleton columnas={5} filas={6} />
      </div>
    </Envoltorio>
  )
}

export function ResultadosBusquedaSkeleton() {
  return (
    <div role="status" aria-label="Cargando resultados de búsqueda" className="p-2">
      <span className="sr-only">Cargando resultados de búsqueda…</span>
      {Array.from({ length: 4 }).map((_, indice) => (
        <div key={indice} className="flex items-center gap-3 rounded-lg px-3 py-2.5">
          <Skeleton className="size-9 shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3.5 w-40 max-w-full" />
            <Skeleton className="h-2.5 w-24" />
          </div>
        </div>
      ))}
    </div>
  )
}
