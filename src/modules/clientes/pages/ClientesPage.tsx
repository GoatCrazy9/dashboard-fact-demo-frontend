import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAsyncData } from '@/shared/hooks/useAsyncData'
import {
  descargarTabla,
  type FormatoExport,
} from '@/shared/services/exportacionesService'
import { cn } from '@/shared/utils/cn'
import { descargarBlob } from '@/shared/utils/descargar'
import { hoyEnLima } from '@/shared/utils/fechas'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { TablePagination } from '@/shared/ui/DataTable'
import { Icon } from '@/shared/ui/icons'
import { Select } from '@/shared/ui/Select'
import { ClientesSkeleton } from '@/shared/ui/ListadoSkeleton'
import { clientesService } from '../service/clientesService'
import { DetalleClienteDialog } from '../components/DetalleClienteDialog'
import type { Cliente } from '@/shared/types'

type Pestana = 'TODOS' | 'RUC' | 'DNI' | 'CE'
type Presencia = 'TODOS' | 'CON' | 'SIN'
type ClaveOrden = 'razonSocial' | 'tipoDocumento' | 'contacto' | 'direccion'

interface Orden {
  clave: ClaveOrden
  direccion: 'asc' | 'desc'
}

const PESTANAS: { clave: Pestana; etiqueta: string }[] = [
  { clave: 'TODOS', etiqueta: 'Todos' },
  { clave: 'RUC', etiqueta: 'RUC' },
  { clave: 'DNI', etiqueta: 'DNI' },
  { clave: 'CE', etiqueta: 'CE' },
]

function coincidePestana(cliente: Cliente, pestana: Pestana) {
  return pestana === 'TODOS' || cliente.tipoDocumento === pestana
}

function cumplePresencia(valor: string | null | undefined, filtro: Presencia) {
  if (filtro === 'CON') return Boolean(valor?.trim())
  if (filtro === 'SIN') return !valor?.trim()
  return true
}

function iniciales(nombre: string) {
  return (
    nombre
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((parte) => parte[0]?.toUpperCase() ?? '')
      .join('') || '—'
  )
}

function valorOrden(cliente: Cliente, clave: ClaveOrden): string {
  switch (clave) {
    case 'razonSocial':
      return cliente.razonSocial
    case 'tipoDocumento':
      return `${cliente.tipoDocumento} ${cliente.numeroDocumento}`
    case 'contacto':
      return cliente.telefono ?? cliente.email ?? ''
    case 'direccion':
      return cliente.direccion ?? ''
  }
}

export function ClientesPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const consulta = params.get('q') ?? ''
  const { data, error, loading } = useAsyncData(clientesService.listar, [])

  const [busqueda, setBusqueda] = useState(consulta)
  const [pestana, setPestana] = useState<Pestana>('TODOS')
  const [direccion, setDireccion] = useState<Presencia>('TODOS')
  const [telefono, setTelefono] = useState<Presencia>('TODOS')
  const [email, setEmail] = useState<Presencia>('TODOS')
  const [orden, setOrden] = useState<Orden>({ clave: 'razonSocial', direccion: 'asc' })
  const [pagina, setPagina] = useState(0)
  const [tamano, setTamano] = useState(10)
  const [filtrosAbierto, setFiltrosAbierto] = useState(false)
  const [seleccionado, setSeleccionado] = useState<Cliente | null>(null)
  const [exportando, setExportando] = useState<FormatoExport | null>(null)
  const [errorExportar, setErrorExportar] = useState<string | null>(null)
  const filtrosRef = useRef<HTMLDivElement>(null)

  useEffect(() => setBusqueda(consulta), [consulta])

  useEffect(() => {
    setPagina(0)
  }, [busqueda, pestana, direccion, telefono, email])

  useEffect(() => {
    if (!filtrosAbierto) return

    function handlePointer(event: MouseEvent) {
      if (!filtrosRef.current?.contains(event.target as Node)) setFiltrosAbierto(false)
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setFiltrosAbierto(false)
    }

    document.addEventListener('mousedown', handlePointer)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointer)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [filtrosAbierto])

  const filas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    return (data ?? [])
      .filter((cliente) => {
        if (!coincidePestana(cliente, pestana)) return false
        if (!cumplePresencia(cliente.direccion, direccion)) return false
        if (!cumplePresencia(cliente.telefono, telefono)) return false
        if (!cumplePresencia(cliente.email, email)) return false
        return (
          !texto ||
          cliente.razonSocial.toLowerCase().includes(texto) ||
          cliente.numeroDocumento.includes(texto)
        )
      })
      .sort((a, b) => {
        const comparacion = valorOrden(a, orden.clave).localeCompare(valorOrden(b, orden.clave), 'es', {
          numeric: true,
          sensitivity: 'base',
        })
        return orden.direccion === 'asc' ? comparacion : -comparacion
      })
  }, [data, busqueda, pestana, direccion, telefono, email, orden])

  const paginas = Math.ceil(filas.length / tamano)
  const paginaActual = Math.min(pagina, Math.max(0, paginas - 1))
  const visibles = filas.slice(paginaActual * tamano, (paginaActual + 1) * tamano)
  const hayFiltros = Boolean(
    busqueda.trim() || direccion !== 'TODOS' || telefono !== 'TODOS' || email !== 'TODOS',
  )
  const pestanaActual = PESTANAS.find((opcion) => opcion.clave === pestana)?.etiqueta ?? 'Todos'

  function limpiarFiltros() {
    setBusqueda('')
    setPestana('TODOS')
    setDireccion('TODOS')
    setTelefono('TODOS')
    setEmail('TODOS')
    setPagina(0)
  }

  function alternarOrden(clave: ClaveOrden) {
    setOrden((actual) =>
      actual.clave === clave
        ? { clave, direccion: actual.direccion === 'asc' ? 'desc' : 'asc' }
        : { clave, direccion: 'asc' },
    )
    setPagina(0)
  }

  function encabezadoOrden(clave: ClaveOrden, etiqueta: string) {
    const activo = orden.clave === clave
    return (
      <button
        type="button"
        onClick={() => alternarOrden(clave)}
        className="flex cursor-pointer items-center gap-1"
        aria-label={`Ordenar por ${etiqueta} ${activo && orden.direccion === 'asc' ? 'descendente' : 'ascendente'}`}
      >
        {etiqueta}
        <Icon
          name={activo ? (orden.direccion === 'asc' ? 'arrow-up' : 'arrow-down') : 'chevron-down'}
          className={cn('size-3 stroke-[3px]', activo ? 'text-fg-quaternary' : 'text-fg-quaternary/50')}
        />
      </button>
    )
  }

  async function exportar(formato: FormatoExport) {
    setExportando(formato)
    setErrorExportar(null)
    try {
      await descargarTabla(
        {
          titulo: 'Clientes',
          nombreArchivo: 'clientes',
          columnas: [
            { titulo: 'Razón social', ancho: 210 },
            { titulo: 'Tipo', ancho: 55 },
            { titulo: 'Número', ancho: 105 },
            { titulo: 'Dirección', ancho: 230 },
            { titulo: 'Ubigeo', ancho: 70 },
            { titulo: 'Teléfono', ancho: 95 },
            { titulo: 'Correo', ancho: 175 },
          ],
          filas: filas.map((cliente) => [
            cliente.razonSocial,
            cliente.tipoDocumento,
            cliente.numeroDocumento,
            cliente.direccion,
            cliente.ubigeo ?? null,
            cliente.telefono,
            cliente.email,
          ]),
        },
        formato,
      )
    } catch (err) {
      setErrorExportar(
        err instanceof Error ? err.message : `No se pudo generar el archivo ${formato.toUpperCase()}.`,
      )
    } finally {
      setExportando(null)
    }
  }

  function exportarCsv() {
    const cabecera = ['Razón social', 'Tipo', 'Número', 'Dirección', 'Ubigeo', 'Teléfono', 'Correo']
    const filasCsv = filas.map((cliente) => [
      cliente.razonSocial,
      cliente.tipoDocumento,
      cliente.numeroDocumento,
      cliente.direccion ?? '',
      cliente.ubigeo ?? '',
      cliente.telefono ?? '',
      cliente.email ?? '',
    ])
    const csv = [cabecera, ...filasCsv]
      .map((fila) => fila.map((valor) => `"${String(valor).replace(/"/g, '""')}"`).join(','))
      .join('\r\n')
    descargarBlob(
      new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }),
      `clientes-${hoyEnLima()}.csv`,
    )
  }

  if (loading) return <ClientesSkeleton />

  return (
    <div className="flex flex-col">
      <div className="mb-8 flex w-full flex-col gap-5 px-4 lg:px-8">
        {(error || errorExportar) && (
          <Alert tone="error" title={errorExportar ? 'No se pudo exportar' : 'No se pudo cargar el padrón'}>
            {errorExportar ?? error?.message}
          </Alert>
        )}

        <div className="relative flex flex-col gap-5 bg-primary">
          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="flex flex-1 flex-col gap-0.5">
              <p className="text-xl font-semibold text-primary">Clientes</p>
              <p className="text-md text-tertiary">
                Padrón de clientes registrado en DEMO. Usa “Ver detalles” para la ficha completa.
              </p>
            </div>
            <div className="flex flex-col gap-4 lg:flex-row">
              <div className="flex flex-wrap items-start gap-3">
                <Button
                  size="sm"
                  variant="outline"
                  onPress={() => void exportar('pdf')}
                  isLoading={exportando === 'pdf'}
                  isDisabled={exportando !== null}
                  startIcon={<Icon name="file-text" className="size-4" />}
                >
                  Exportar en PDF
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onPress={() => void exportar('excel')}
                  isLoading={exportando === 'excel'}
                  isDisabled={exportando !== null}
                  startIcon={<Icon name="download" className="size-4" />}
                >
                  Exportar en Excel
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onPress={exportarCsv}
                  isDisabled={exportando !== null}
                  startIcon={<Icon name="download" className="size-4" />}
                >
                  Exportar CSV
                </Button>
                <Button
                  size="sm"
                  onPress={() => navigate('/ventas')}
                  startIcon={<Icon name="plus" className="size-4" />}
                >
                  Nueva venta
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex w-full flex-col" data-orientation="horizontal">
          <div
            role="tablist"
            aria-label="Filtrar clientes por tipo de documento"
            className="group relative flex flex-wrap gap-x-3 gap-y-2 before:pointer-events-none before:absolute before:inset-x-0 before:bottom-0 before:h-px before:bg-border-secondary"
            data-orientation="horizontal"
          >
            {PESTANAS.map((opcion) => {
              const activo = pestana === opcion.clave
              const cantidad = (data ?? []).filter((cliente) => coincidePestana(cliente, opcion.clave)).length
              return (
                <button
                  key={opcion.clave}
                  type="button"
                  role="tab"
                  aria-selected={activo}
                  onClick={() => setPestana(opcion.clave)}
                  className={cn(
                    'z-10 flex h-max cursor-pointer items-center justify-center gap-1 px-0.5 pt-0 pb-2.5 text-sm font-semibold whitespace-nowrap rounded-none border-b-2 outline-focus-ring transition duration-100 ease-linear',
                    activo
                      ? 'border-fg-brand-primary_alt text-brand-secondary'
                      : 'border-transparent text-quaternary hover:text-secondary',
                  )}
                >
                  <span className="flex items-center gap-1.5 px-0.5">
                    {opcion.etiqueta}
                    <span className="text-xs font-medium text-tertiary tabular-nums">{cantidad}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="flex w-full flex-col gap-6 px-4 lg:px-8">
        <div className="flex flex-wrap gap-3">
          <label className="group flex h-max w-full min-w-0 flex-1 flex-col items-start justify-start gap-1.5 sm:max-w-80">
            <div className="group/input relative flex w-full flex-row place-content-center place-items-center rounded-lg bg-primary shadow-xs ring-1 ring-primary ring-inset transition-shadow duration-100 ease-linear focus-within:ring-2 focus-within:ring-brand">
              <Icon
                name="search"
                className="pointer-events-none absolute left-3 size-4 text-fg-quaternary stroke-[2.25px]"
              />
              <input
                type="search"
                value={busqueda}
                onChange={(event) => setBusqueda(event.target.value)}
                placeholder="Buscar por nombre o número de documento"
                aria-label="Buscar clientes"
                className="m-0 w-full bg-transparent px-3 py-2 pr-3 pl-9 text-base text-primary outline-hidden placeholder:text-placeholder sm:text-sm"
              />
            </div>
          </label>

          <div className="ml-auto flex shrink-0 items-center gap-3">
            <div ref={filtrosRef} className="relative">
              <Button
                size="sm"
                variant="outline"
                aria-label="Más filtros"
                aria-expanded={filtrosAbierto}
                onPress={() => setFiltrosAbierto((abierto) => !abierto)}
                startIcon={<Icon name="filter" className="size-4" />}
                endIcon={<Icon name="chevron-down" className="size-4" />}
              >
                Filtros
              </Button>

              {filtrosAbierto && (
                <div className="absolute end-0 top-full z-20 mt-2 flex w-[min(20rem,calc(100vw-2rem))] flex-col gap-3 rounded-xl bg-primary p-3 shadow-xl ring-1 ring-tertiary ring-inset">
                  {([
                    ['Dirección', direccion, setDireccion],
                    ['Teléfono', telefono, setTelefono],
                    ['Correo', email, setEmail],
                  ] as const).map(([etiqueta, valor, cambiar]) => (
                    <label key={etiqueta} className="flex flex-col gap-1 text-xs font-medium text-tertiary">
                      {etiqueta}
                      <Select
                        ariaLabel={etiqueta}
                        value={valor}
                        onChange={(seleccion) => cambiar(seleccion as Presencia)}
                        options={[
                          { value: 'TODOS', label: 'Todos' },
                          { value: 'CON', label: 'Con dato' },
                          { value: 'SIN', label: 'Sin dato' },
                        ]}
                        className="h-9"
                      />
                    </label>
                  ))}
                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                    <Button size="sm" variant="ghost" onPress={limpiarFiltros}>
                      Limpiar filtros
                    </Button>
                    <Button size="sm" onPress={() => setFiltrosAbierto(false)}>
                      Aplicar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5 border-b border-secondary border-none pb-0 lg:hidden">
          <div className="relative flex flex-col items-start gap-4 md:flex-row">
            <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 self-stretch">
              <h2 className="text-md font-semibold text-primary">{pestanaActual}</h2>
              <p className="text-sm text-tertiary">
                {filas.length} de {data?.length ?? 0} clientes · ordenados por nombre
              </p>
            </div>
            {hayFiltros && (
              <div className="absolute top-0 right-0 md:static">
                <Button size="sm" variant="ghost" onPress={limpiarFiltros}>
                  Limpiar
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="bg-primary shadow-xs ring-1 ring-secondary -mx-4 rounded-none ring-inset lg:mx-0 lg:rounded-xl">
          <div className="relative hidden flex-col items-start gap-4 border-b border-secondary bg-primary px-4 py-5 pb-5 md:flex-row md:px-6 lg:flex">
            <div className="flex flex-1 flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <h2 className="text-md font-semibold text-primary">{pestanaActual}</h2>
                <span className="size-max flex items-center gap-1 rounded-md py-0.5 px-1.5 text-xs font-medium bg-primary text-secondary ring-1 ring-primary shadow-xs ring-inset">
                  {filas.length} clientes
                </span>
              </div>
            </div>
          </div>

          <div className="hidden lg:block">
            <table className="w-full overflow-x-hidden" aria-label="Clientes">
              <thead className="relative h-11 bg-secondary [&>tr>th]:after:pointer-events-none [&>tr>th]:after:absolute [&>tr>th]:after:inset-x-0 [&>tr>th]:after:bottom-0 [&>tr>th]:after:h-px [&>tr>th]:after:bg-border-secondary [&>tr>th]:focus-visible:after:bg-transparent">
                <tr>
                  <th scope="col" className="relative w-full p-0 px-6 py-2 nth-2:pl-3">
                    <div className="flex items-center">{encabezadoOrden('razonSocial', 'Cliente')}</div>
                  </th>
                  <th scope="col" className="relative p-0 px-6 py-2 nth-2:pl-3">
                    <div className="flex items-center">{encabezadoOrden('tipoDocumento', 'Documento')}</div>
                  </th>
                  <th scope="col" className="relative p-0 px-6 py-2 nth-2:pl-3">
                    <div className="flex items-center">{encabezadoOrden('contacto', 'Contacto')}</div>
                  </th>
                  <th scope="col" className="relative p-0 px-6 py-2 nth-2:pl-3">
                    <div className="flex items-center">{encabezadoOrden('direccion', 'Dirección')}</div>
                  </th>
                  <th scope="col" className="relative p-0 px-6 py-2 nth-2:pl-3">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading && !data ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-tertiary">
                      Cargando clientes…
                    </td>
                  </tr>
                ) : visibles.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <p className="text-sm font-medium text-primary">Sin resultados</p>
                      <p className="mt-1 text-sm text-tertiary">Ajusta la búsqueda o los filtros.</p>
                    </td>
                  </tr>
                ) : (
                  visibles.map((row) => (
                    <tr
                      key={row.id}
                      className="relative h-18 outline-focus-ring transition-colors after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-px after:w-full after:bg-border-secondary hover:bg-secondary focus-visible:outline-2 focus-visible:-outline-offset-2 last:after:hidden"
                    >
                      <td className="relative px-6 py-4 nth-2:pl-3">
                        <div className="group flex items-center gap-3 outline-hidden">
                          <span className="relative inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-tertiary text-xs font-semibold text-quaternary ring-1 ring-secondary ring-inset">
                            {iniciales(row.razonSocial)}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-primary">{row.razonSocial}</p>
                            <p className="text-sm text-tertiary">{row.numeroDocumento}</p>
                          </div>
                        </div>
                      </td>
                      <td className="relative px-6 py-4 nth-2:pl-3">
                        <span className="size-max flex items-center whitespace-nowrap rounded-md py-0.5 px-1.5 text-xs font-medium bg-primary text-secondary ring-1 ring-primary shadow-xs ring-inset">
                          {row.tipoDocumento}
                        </span>
                      </td>
                      <td className="relative px-6 py-4 text-sm text-tertiary nth-2:pl-3">
                        <p>{row.telefono ?? '—'}</p>
                        <p className="truncate">{row.email ?? '—'}</p>
                      </td>
                      <td className="relative max-w-64 px-6 py-4 text-sm text-tertiary nth-2:pl-3">
                        <span className="block truncate" title={row.direccion ?? ''}>
                          {row.direccion ?? '—'}
                        </span>
                      </td>
                      <td className="relative py-4 px-4 nth-2:pl-3">
                        <div className="flex justify-end gap-0.5">
                          <Button
                            size="xs"
                            variant="ghost"
                            aria-label={`Ver detalles de ${row.razonSocial}`}
                            onPress={() => setSeleccionado(row)}
                            startIcon={<Icon name="eye" className="size-4" />}
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 p-4 lg:hidden">
            {loading && !data ? (
              <p className="py-8 text-center text-sm text-tertiary">Cargando clientes…</p>
            ) : visibles.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm font-medium text-primary">Sin resultados</p>
                <p className="mt-1 text-sm text-tertiary">Ajusta la búsqueda o los filtros.</p>
              </div>
            ) : (
              visibles.map((row) => (
                <div
                  key={row.id}
                  className="flex flex-col gap-3 rounded-xl bg-primary p-4 shadow-xs ring-1 ring-secondary ring-inset"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-tertiary text-xs font-semibold text-quaternary ring-1 ring-secondary ring-inset">
                        {iniciales(row.razonSocial)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-primary">{row.razonSocial}</p>
                        <p className="text-sm text-tertiary">
                          {row.tipoDocumento} {row.numeroDocumento}
                        </p>
                      </div>
                    </div>
                  </div>
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-xs text-tertiary">Teléfono</dt>
                      <dd className="text-primary">{row.telefono ?? '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-tertiary">Correo</dt>
                      <dd className="break-words text-primary">{row.email ?? '—'}</dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-xs text-tertiary">Dirección</dt>
                      <dd className="break-words text-primary">{row.direccion ?? '—'}</dd>
                    </div>
                  </dl>
                  <Button
                    size="sm"
                    variant="outline"
                    fullWidth
                    onPress={() => setSeleccionado(row)}
                    startIcon={<Icon name="eye" className="size-4" />}
                  >
                    Ver detalles
                  </Button>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-secondary px-4 py-3 md:px-6 md:pt-3 md:pb-4">
            <TablePagination
              total={filas.length}
              page={paginaActual}
              pageCount={paginas}
              pageSize={tamano}
              pageSizeOptions={[10, 20, 50]}
              onPageSizeChange={(cantidad) => {
                setTamano(cantidad)
                setPagina(0)
              }}
              onPageChange={setPagina}
            />
          </div>
        </div>
      </div>

      {seleccionado && (
        <DetalleClienteDialog cliente={seleccionado} onClose={() => setSeleccionado(null)} />
      )}
    </div>
  )
}
