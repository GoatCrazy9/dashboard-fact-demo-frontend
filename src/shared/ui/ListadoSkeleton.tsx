import type { ReactNode } from 'react'
import { cn } from '@/shared/utils/cn'
import { Skeleton, TopProgressBar } from '@/shared/ui/Skeleton'

interface ColumnaSkeleton {
  cabecera: string
  celda: ReactNode
  ancho?: string
  alineacion?: 'right'
}

interface EstructuraListadoProps {
  etiqueta: string
  titulo: string
  botones: { ancho: string; principal?: boolean }[]
  pestanas: string[]
  filtros: string[]
  columnas: ColumnaSkeleton[]
  tarjeta: ReactNode
}

/** Silueta común de cabecera, pestañas, filtros, tabla y paginación. */
function EstructuraListado({
  etiqueta,
  titulo,
  botones,
  pestanas,
  filtros,
  columnas,
  tarjeta,
}: EstructuraListadoProps) {
  return (
    <div role="status" aria-label={etiqueta} className="flex flex-col">
      <TopProgressBar />
      <span className="sr-only">Cargando {titulo}…</span>

      <div className="mb-8 flex w-full flex-col gap-5 px-4 lg:px-8">
        <div className="relative flex flex-col gap-5 bg-primary">
          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="flex flex-1 flex-col gap-1">
              <Skeleton className="h-6 w-40 max-w-full" />
              <Skeleton className="h-4 w-80 max-w-full" />
            </div>
            <div className="flex flex-wrap items-start gap-3">
              {botones.map((boton, indice) => (
                <Skeleton
                  key={indice}
                  className={cn(
                    'h-9 rounded-lg',
                    boton.ancho,
                    boton.principal && 'bg-brand-solid/25',
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="relative flex gap-3 border-b border-border-secondary pb-2.5">
          {pestanas.map((ancho, indice) => (
            <Skeleton key={indice} className={cn('h-4', ancho)} />
          ))}
        </div>
      </div>

      <div className="flex w-full flex-col gap-6 px-4 lg:px-8">
        <div className="flex flex-wrap gap-3">
          <Skeleton className="h-10 w-full max-w-80 rounded-lg sm:h-9 sm:flex-1" />
          <div className="ml-auto flex shrink-0 flex-wrap gap-3">
            {filtros.map((ancho, indice) => (
              <Skeleton key={indice} className={cn('h-9 rounded-lg', ancho)} />
            ))}
          </div>
        </div>

        <div className="bg-primary shadow-xs ring-1 ring-secondary -mx-4 rounded-none ring-inset lg:mx-0 lg:rounded-xl">
          <div className="hidden flex-col items-start gap-4 border-b border-secondary bg-primary px-4 py-5 pb-5 md:flex-row md:px-6 lg:flex">
            <div className="flex flex-1 flex-col gap-1">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-56 max-w-full" />
            </div>
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
                        columna.ancho,
                        columna.alineacion === 'right' && 'text-right',
                      )}
                    >
                      <div
                        className={cn(
                          'flex',
                          columna.alineacion === 'right' && 'justify-end',
                        )}
                      >
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
              <div key={indice}>{tarjeta}</div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-secondary px-4 py-3 md:px-6 md:pt-3 md:pb-4">
            <Skeleton className="h-3 w-40 max-w-full" />
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  )
}

function AvatarSkeleton() {
  return <Skeleton className="size-8 shrink-0 rounded-full" />
}

function AccionSkeleton({ dobles = false }: { dobles?: boolean }) {
  return (
    <div className="flex justify-end gap-0.5">
      {Array.from({ length: dobles ? 2 : 1 }).map((_, indice) => (
        <Skeleton key={indice} className="size-7 rounded-lg" />
      ))}
    </div>
  )
}

export function ComprobantesSkeleton() {
  return (
    <EstructuraListado
      etiqueta="Cargando comprobantes"
      titulo="comprobantes"
      botones={[{ ancho: 'w-24' }, { ancho: 'w-40', principal: true }]}
      pestanas={['w-14', 'w-20', 'w-16', 'w-12']}
      filtros={['w-36', 'w-24']}
      columnas={[
        {
          cabecera: 'w-24',
          ancho: 'w-full',
          celda: (
            <div className="min-w-0">
              <Skeleton className="h-3.5 w-40" />
              <Skeleton className="mt-1.5 h-3 w-24" />
            </div>
          ),
        },
        { cabecera: 'w-16', celda: <Skeleton className="ms-auto h-3.5 w-20" />, alineacion: 'right' },
        { cabecera: 'w-12', celda: <Skeleton className="h-3.5 w-16" /> },
        {
          cabecera: 'w-24',
          celda: (
            <div className="flex flex-col items-start gap-1">
              <Skeleton className="h-5 w-24 rounded-md" />
              <Skeleton className="h-3 w-16" />
            </div>
          ),
        },
        {
          cabecera: 'w-20',
          celda: (
            <div className="flex items-center gap-3">
              <AvatarSkeleton />
              <Skeleton className="h-3.5 w-32" />
            </div>
          ),
        },
        { cabecera: 'w-8', celda: <AccionSkeleton /> },
      ]}
      tarjeta={
        <div className="flex flex-col gap-3 rounded-xl bg-primary p-4 shadow-xs ring-1 ring-secondary ring-inset">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1.5">
              <Skeleton className="h-3.5 w-40 max-w-full" />
              <Skeleton className="h-3 w-28" />
            </div>
            <Skeleton className="h-5 w-20 rounded-md" />
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            {['w-16', 'w-12', 'w-16', 'w-14'].map((ancho, indice) => (
              <div key={indice} className="space-y-1">
                <Skeleton className={cn('h-2.5', ancho)} />
                <Skeleton className="h-3.5 w-24 max-w-full" />
              </div>
            ))}
          </div>
          <Skeleton className="h-9 w-full rounded-lg" />
        </div>
      }
    />
  )
}

export function ClientesSkeleton() {
  return (
    <EstructuraListado
      etiqueta="Cargando clientes"
      titulo="clientes"
      botones={[{ ancho: 'w-28' }, { ancho: 'w-28', principal: true }]}
      pestanas={['w-14', 'w-12', 'w-12', 'w-12']}
      filtros={['w-24']}
      columnas={[
        {
          cabecera: 'w-20',
          ancho: 'w-full',
          celda: (
            <div className="flex items-center gap-3">
              <AvatarSkeleton />
              <div className="min-w-0 space-y-1.5">
                <Skeleton className="h-3.5 w-36" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ),
        },
        { cabecera: 'w-20', celda: <Skeleton className="h-5 w-16 rounded-md" /> },
        {
          cabecera: 'w-20',
          celda: (
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          ),
        },
        { cabecera: 'w-20', celda: <Skeleton className="h-3.5 w-40 max-w-64" /> },
        { cabecera: 'w-8', celda: <AccionSkeleton /> },
      ]}
      tarjeta={
        <div className="flex flex-col gap-3 rounded-xl bg-primary p-4 shadow-xs ring-1 ring-secondary ring-inset">
          <div className="flex items-center gap-3">
            <AvatarSkeleton />
            <div className="min-w-0 space-y-1.5">
              <Skeleton className="h-3.5 w-40 max-w-full" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
            {[0, 1, 2].map((indice) => (
              <div key={indice} className={cn('space-y-1', indice === 2 && 'sm:col-span-2')}>
                <Skeleton className="h-2.5 w-16" />
                <Skeleton className="h-3.5 w-40 max-w-full" />
              </div>
            ))}
          </div>
          <Skeleton className="h-9 w-full rounded-lg" />
        </div>
      }
    />
  )
}

export function UsuariosSkeleton() {
  return (
    <EstructuraListado
      etiqueta="Cargando usuarios y accesos"
      titulo="usuarios y accesos"
      botones={[]}
      pestanas={[]}
      filtros={[]}
      columnas={[
        {
          cabecera: 'w-20',
          ancho: 'w-full',
          celda: (
            <div className="flex items-center gap-3">
              <AvatarSkeleton />
              <div className="min-w-0 space-y-1.5">
                <Skeleton className="h-3.5 w-36" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ),
        },
        { cabecera: 'w-16', celda: <Skeleton className="h-5 w-20 rounded-md" /> },
        { cabecera: 'w-20', celda: <Skeleton className="h-5 w-24 rounded-md" /> },
        { cabecera: 'w-16', celda: <Skeleton className="h-5 w-16 rounded-md" /> },
        { cabecera: 'w-8', celda: <AccionSkeleton dobles /> },
      ]}
      tarjeta={
        <div className="flex flex-col gap-3 rounded-xl bg-primary p-4 shadow-xs ring-1 ring-secondary ring-inset">
          <div className="flex items-center gap-3">
            <AvatarSkeleton />
            <div className="min-w-0 space-y-1.5">
              <Skeleton className="h-3.5 w-40 max-w-full" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-5 w-20 rounded-md" />
            <Skeleton className="h-5 w-24 rounded-md" />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Skeleton className="h-9 flex-1 rounded-lg" />
            <Skeleton className="h-9 flex-1 rounded-lg" />
          </div>
        </div>
      }
    />
  )
}

export function ProductosSkeleton({ esAdmin = false }: { esAdmin?: boolean }) {
  const columnas: ColumnaSkeleton[] = [
    {
      cabecera: 'w-20',
      ancho: 'w-full',
      celda: (
        <div className="flex items-center gap-3">
          <AvatarSkeleton />
          <div className="min-w-0 space-y-1.5">
            <Skeleton className="h-3.5 w-36" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ),
    },
    { cabecera: 'w-16', celda: <Skeleton className="ms-auto h-3.5 w-20" />, alineacion: 'right' },
    { cabecera: 'w-12', celda: <Skeleton className="h-5 w-16 rounded-md" /> },
    { cabecera: 'w-12', celda: <Skeleton className="ms-auto h-3.5 w-10" />, alineacion: 'right' },
    { cabecera: 'w-14', celda: <Skeleton className="h-3.5 w-16" /> },
  ]
  if (esAdmin) columnas.push({ cabecera: 'w-8', celda: <AccionSkeleton dobles /> })

  return (
    <EstructuraListado
      etiqueta="Cargando productos"
      titulo="productos"
      botones={[{ ancho: 'w-28' }, { ancho: 'w-32', principal: true }]}
      pestanas={['w-14', 'w-20', 'w-24']}
      filtros={['w-24']}
      columnas={columnas}
      tarjeta={
        <div className="flex flex-col gap-3 rounded-xl bg-primary p-4 shadow-xs ring-1 ring-secondary ring-inset">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <AvatarSkeleton />
              <div className="min-w-0 space-y-1.5">
                <Skeleton className="h-3.5 w-40 max-w-full" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-5 w-16 rounded-md" />
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
            {[0, 1, 2].map((indice) => (
              <div key={indice} className="space-y-1">
                <Skeleton className="h-2.5 w-14" />
                <Skeleton className="h-3.5 w-20 max-w-full" />
              </div>
            ))}
          </div>
          {esAdmin && (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Skeleton className="h-9 w-full rounded-lg" />
              <Skeleton className="h-9 w-full rounded-lg" />
            </div>
          )}
        </div>
      }
    />
  )
}

export function DocumentosSkeleton() {
  return (
    <EstructuraListado
      etiqueta="Cargando proformas y pedidos"
      titulo="proformas y pedidos"
      botones={[{ ancho: 'w-52', principal: true }]}
      pestanas={['w-14', 'w-24', 'w-20']}
      filtros={['w-24']}
      columnas={[
        {
          cabecera: 'w-24',
          ancho: 'w-full',
          celda: (
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
          ),
        },
        {
          cabecera: 'w-20',
          celda: (
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          ),
        },
        { cabecera: 'w-24', celda: <Skeleton className="h-3.5 w-20" /> },
        {
          cabecera: 'w-16',
          celda: <Skeleton className="ms-auto h-3.5 w-20" />,
          alineacion: 'right',
        },
        { cabecera: 'w-16', celda: <Skeleton className="h-5 w-24 rounded-md" /> },
        {
          cabecera: 'w-8',
          celda: (
            <div className="flex justify-end gap-1">
              <Skeleton className="size-7 rounded-lg" />
              <Skeleton className="h-7 w-16 rounded-lg" />
              <Skeleton className="h-7 w-20 rounded-lg" />
            </div>
          ),
        },
      ]}
      tarjeta={
        <div className="flex flex-col gap-3 rounded-xl bg-primary p-4 shadow-xs ring-1 ring-secondary ring-inset">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1.5">
              <Skeleton className="h-3.5 w-40 max-w-full" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-5 w-20 rounded-md" />
          </div>
          <div className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Skeleton className="h-2.5 w-16" />
              <Skeleton className="h-3.5 w-40 max-w-full" />
              <Skeleton className="h-3 w-24" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-2.5 w-20" />
              <Skeleton className="h-3.5 w-24" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Skeleton className="h-2.5 w-12" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Skeleton className="h-9 flex-1 rounded-lg" />
            <Skeleton className="h-9 flex-1 rounded-lg" />
            <Skeleton className="h-9 w-full rounded-lg sm:w-32" />
          </div>
        </div>
      }
    />
  )
}

export function NuevoDocumentoSkeleton() {
  return (
    <div role="status" aria-label="Cargando nuevo documento" className="flex flex-col">
      <TopProgressBar />
      <span className="sr-only">Cargando nuevo documento…</span>

      <div className="mb-8 w-full px-4 pt-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-6 w-56 max-w-full" />
            <Skeleton className="h-4 w-80 max-w-full" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-7 w-24 rounded-full" />
            <Skeleton className="h-9 w-36 rounded-lg" />
          </div>
        </div>
      </div>

      <div className="grid w-full grid-cols-1 gap-6 px-4 lg:grid-cols-12 lg:px-8">
        <div className="min-w-0 space-y-6 lg:col-span-8">
          {[0, 1, 2].map((seccion) => (
            <div
              key={seccion}
              className="overflow-hidden rounded-xl bg-primary shadow-xs ring-1 ring-secondary ring-inset"
            >
              <div className="flex items-center gap-3 border-b border-secondary px-4 py-4 lg:px-6">
                <Skeleton className="size-9 shrink-0 rounded-full" />
                <div className="min-w-0 space-y-1.5">
                  <Skeleton className="h-4 w-40 max-w-full" />
                  <Skeleton className="h-3 w-64 max-w-full" />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:p-6">
                {[0, 1, 2, 3].map((campo) => (
                  <div key={campo} className="space-y-1.5">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-10 w-full rounded-lg" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="min-w-0 lg:col-span-4">
          <div className="overflow-hidden rounded-xl bg-primary shadow-xs ring-1 ring-secondary ring-inset">
            <div className="border-b border-secondary px-4 py-4 lg:px-6">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="mt-1.5 h-3 w-40" />
            </div>
            <div className="space-y-3 p-4 lg:p-6">
              <Skeleton className="h-28 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function NuevaGuiaSkeleton() {
  return (
    <div role="status" aria-label="Cargando nueva guía de remisión" className="flex flex-col">
      <TopProgressBar />
      <span className="sr-only">Cargando nueva guía de remisión…</span>

      <div className="mb-8 w-full px-4 pt-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-6 w-60 max-w-full" />
            <Skeleton className="h-4 w-96 max-w-full" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-7 w-28 rounded-full" />
            <Skeleton className="h-9 w-36 rounded-lg" />
          </div>
        </div>
      </div>

      <div className="grid w-full grid-cols-1 gap-6 px-4 lg:grid-cols-12 lg:px-8">
        <div className="min-w-0 space-y-6 lg:col-span-8">
          {[0, 1, 2].map((seccion) => (
            <div
              key={seccion}
              className="overflow-hidden rounded-2xl bg-primary shadow-xs ring-1 ring-tertiary ring-inset"
            >
              <div className="flex items-center gap-3 border-b border-secondary px-4 py-4 lg:px-6">
                <Skeleton className="size-9 shrink-0 rounded-full" />
                <div className="min-w-0 space-y-1.5">
                  <Skeleton className="h-4 w-44 max-w-full" />
                  <Skeleton className="h-3 w-64 max-w-full" />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:p-6">
                {[0, 1, 2, 3].map((campo) => (
                  <div key={campo} className="space-y-1.5">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-10 w-full rounded-lg" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="min-w-0 lg:col-span-4">
          <div className="overflow-hidden rounded-2xl bg-primary shadow-xs ring-1 ring-tertiary ring-inset">
            <div className="flex items-center justify-between gap-3 border-b border-secondary px-4 py-4 lg:px-6">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
            <div className="space-y-3 p-4 lg:p-6">
              <Skeleton className="h-28 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-14 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function GuiasSkeleton() {
  return (
    <EstructuraListado
      etiqueta="Cargando guías de remisión"
      titulo="guías de remisión"
      botones={[{ ancho: 'w-24', principal: true }]}
      pestanas={['w-14', 'w-20', 'w-20']}
      filtros={['w-24']}
      columnas={[
        {
          cabecera: 'w-24',
          ancho: 'w-full',
          celda: (
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-36" />
              <Skeleton className="h-3 w-24" />
            </div>
          ),
        },
        {
          cabecera: 'w-20',
          celda: (
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          ),
        },
        { cabecera: 'w-20', celda: <Skeleton className="h-3.5 w-24" /> },
        {
          cabecera: 'w-20',
          celda: (
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-3 w-24" />
            </div>
          ),
        },
        { cabecera: 'w-16', celda: <Skeleton className="h-5 w-20 rounded-md" /> },
        { cabecera: 'w-8', celda: <AccionSkeleton /> },
      ]}
      tarjeta={
        <div className="flex flex-col gap-3 rounded-xl bg-primary p-4 shadow-xs ring-1 ring-secondary ring-inset">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1.5">
              <Skeleton className="h-3.5 w-36 max-w-full" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-5 w-20 rounded-md" />
          </div>
          <div className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
            {[0, 1, 2, 3].map((indice) => (
              <div key={indice} className="space-y-1.5">
                <Skeleton className="h-2.5 w-16" />
                <Skeleton className="h-3.5 w-32 max-w-full" />
                {indice === 0 && <Skeleton className="h-3 w-24" />}
              </div>
            ))}
          </div>
          <Skeleton className="h-9 w-full rounded-lg" />
        </div>
      }
    />
  )
}

export function ResumenesSkeleton() {
  return (
    <EstructuraListado
      etiqueta="Cargando resúmenes y bajas"
      titulo="resúmenes y bajas"
      botones={[{ ancho: 'w-36', principal: true }]}
      pestanas={['w-28', 'w-44']}
      filtros={['w-28']}
      columnas={[
        {
          cabecera: 'w-24',
          ancho: 'w-full',
          celda: (
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-36" />
              <Skeleton className="h-3 w-24" />
            </div>
          ),
        },
        { cabecera: 'w-16', celda: <Skeleton className="h-3.5 w-28" /> },
        {
          cabecera: 'w-16',
          celda: <Skeleton className="ms-auto h-3.5 w-10" />,
          alineacion: 'right',
        },
        {
          cabecera: 'w-12',
          celda: <Skeleton className="ms-auto h-3.5 w-20" />,
          alineacion: 'right',
        },
        { cabecera: 'w-16', celda: <Skeleton className="h-5 w-24 rounded-md" /> },
        { cabecera: 'w-8', celda: <AccionSkeleton /> },
      ]}
      tarjeta={
        <div className="flex flex-col gap-3 rounded-xl bg-primary p-4 shadow-xs ring-1 ring-secondary ring-inset">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1.5">
              <Skeleton className="h-3.5 w-36 max-w-full" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-5 w-24 rounded-md" />
          </div>
          <div className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-3">
            {[0, 1, 2].map((indice) => (
              <div key={indice} className="space-y-1.5">
                <Skeleton className="h-2.5 w-16" />
                <Skeleton className="h-3.5 w-24 max-w-full" />
              </div>
            ))}
          </div>
          <Skeleton className="h-9 w-full rounded-lg" />
        </div>
      }
    />
  )
}
