import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAsyncData } from '@/shared/hooks/useAsyncData'
import { descargarTabla, type FormatoExport } from '@/shared/services/exportacionesService'
import { cn } from '@/shared/utils/cn'
import { fechaISO } from '@/shared/utils/fechas'
import { fechaCorta, numeroComprobante, soles } from '@/shared/utils/format'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { TablePagination } from '@/shared/ui/DataTable'
import { Icon } from '@/shared/ui/icons'
import { Select } from '@/shared/ui/Select'
import { DocumentosSkeleton } from '@/shared/ui/ListadoSkeleton'
import type { DocumentoVenta, EstadoDocumentoVenta, TipoDocumentoVenta } from '@/shared/types'
import { EstadoDocumentoBadge, ETIQUETAS_DOCUMENTO } from '../components/documentoUi'
import { documentosService } from '../service/documentosService'

type Pestana = 'TODOS' | TipoDocumentoVenta
type FiltroEstado = 'TODOS' | EstadoDocumentoVenta
type ClaveOrden = 'documento' | 'cliente' | 'vencimiento' | 'total'

interface Orden {
  clave: ClaveOrden
  direccion: 'asc' | 'desc'
}

const PESTANAS: { clave: Pestana; etiqueta: string }[] = [
  { clave: 'TODOS', etiqueta: 'Todos' },
  { clave: 'COTIZACION', etiqueta: 'Proformas' },
  { clave: 'PEDIDO', etiqueta: 'Pedidos' },
]

const ESTADOS: EstadoDocumentoVenta[] = ['PENDIENTE', 'APROBADO', 'RECHAZADO', 'CONVERTIDO']

function coincidePestana(documento: DocumentoVenta, pestana: Pestana) {
  return pestana === 'TODOS' || documento.tipo === pestana
}

function valorOrden(documento: DocumentoVenta, clave: ClaveOrden): string | number {
  switch (clave) {
    case 'documento':
      return `${documento.serie}-${String(documento.numero).padStart(8, '0')}`
    case 'cliente':
      return documento.cliente
    case 'vencimiento':
      return documento.fechaVencimiento ?? ''
    case 'total':
      return documento.total
  }
}

export function DocumentosPage() {
  const navigate = useNavigate()
  const { data, error, loading, reload } = useAsyncData(documentosService.listar, [])
  const [busqueda, setBusqueda] = useState('')
  const [pestana, setPestana] = useState<Pestana>('TODOS')
  const [estado, setEstado] = useState<FiltroEstado>('TODOS')
  const [orden, setOrden] = useState<Orden>({ clave: 'documento', direccion: 'desc' })
  const [pagina, setPagina] = useState(0)
  const [tamano, setTamano] = useState(10)
  const [filtrosAbierto, setFiltrosAbierto] = useState(false)
  const [cambiando, setCambiando] = useState<string | null>(null)
  const [errorAccion, setErrorAccion] = useState<string | null>(null)
  const [exportando, setExportando] = useState<FormatoExport | null>(null)
  const [errorExportar, setErrorExportar] = useState<string | null>(null)
  const filtrosRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setPagina(0)
  }, [busqueda, pestana, estado])

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
      .filter((documento) => {
        if (!coincidePestana(documento, pestana)) return false
        if (estado !== 'TODOS' && documento.estado !== estado) return false
        return (
          !texto ||
          documento.cliente.toLowerCase().includes(texto) ||
          documento.clienteDocumento.includes(texto) ||
          numeroComprobante(documento.serie, documento.numero).toLowerCase().includes(texto)
        )
      })
      .sort((a, b) => {
        const izquierda = valorOrden(a, orden.clave)
        const derecha = valorOrden(b, orden.clave)
        const comparacion =
          typeof izquierda === 'number' && typeof derecha === 'number'
            ? izquierda - derecha
            : String(izquierda).localeCompare(String(derecha), 'es', { numeric: true })
        return orden.direccion === 'asc' ? comparacion : -comparacion
      })
  }, [data, busqueda, pestana, estado, orden])

  const paginas = Math.ceil(filas.length / tamano)
  const paginaActual = Math.min(pagina, Math.max(0, paginas - 1))
  const visibles = filas.slice(paginaActual * tamano, (paginaActual + 1) * tamano)
  const hayFiltros = Boolean(busqueda.trim() || pestana !== 'TODOS' || estado !== 'TODOS')
  const pestanaActual = PESTANAS.find((opcion) => opcion.clave === pestana)?.etiqueta ?? 'Todos'

  function limpiarFiltros() {
    setBusqueda('')
    setPestana('TODOS')
    setEstado('TODOS')
    setPagina(0)
    setFiltrosAbierto(false)
  }

  function alternarOrden(clave: ClaveOrden) {
    setOrden((actual) =>
      actual.clave === clave
        ? { clave, direccion: actual.direccion === 'asc' ? 'desc' : 'asc' }
        : { clave, direccion: clave === 'documento' ? 'desc' : 'asc' },
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
          titulo: pestanaActual,
          nombreArchivo:
            pestana === 'COTIZACION'
              ? 'proformas'
              : pestana === 'PEDIDO'
                ? 'pedidos'
                : 'proformas-y-pedidos',
          columnas: [
            { titulo: 'Documento', ancho: 105 },
            { titulo: 'Tipo', ancho: 90 },
            { titulo: 'Cliente', ancho: 190 },
            { titulo: 'Documento cliente', ancho: 105 },
            { titulo: 'Fecha', ancho: 75 },
            { titulo: 'Vencimiento', ancho: 80 },
            { titulo: 'Subtotal', ancho: 85, alineacion: 'derecha' },
            { titulo: 'IGV', ancho: 75, alineacion: 'derecha' },
            { titulo: 'Total', ancho: 90, alineacion: 'derecha' },
            { titulo: 'Estado', ancho: 90 },
            { titulo: 'Convertido a', ancho: 115 },
          ],
          filas: filas.map((row) => [
            numeroComprobante(row.serie, row.numero),
            ETIQUETAS_DOCUMENTO[row.tipo],
            row.cliente,
            row.clienteDocumento,
            fechaISO(row.fecha),
            row.fechaVencimiento ? fechaISO(row.fechaVencimiento) : null,
            Number(row.subtotal.toFixed(2)),
            Number(row.igv.toFixed(2)),
            Number(row.total.toFixed(2)),
            row.estado,
            row.comprobante ? numeroComprobante(row.comprobante.serie, row.comprobante.numero) : null,
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

  async function cambiar(id: string, nuevoEstado: EstadoDocumentoVenta) {
    setCambiando(id)
    setErrorAccion(null)
    try {
      await documentosService.cambiarEstado(id, nuevoEstado)
      reload()
    } catch (err) {
      setErrorAccion(err instanceof Error ? err.message : 'No se pudo cambiar el estado.')
    } finally {
      setCambiando(null)
    }
  }

  if (loading) return <DocumentosSkeleton />

  return (
    <div className="flex flex-col">
      <div className="mb-8 flex w-full flex-col gap-5 px-4 lg:px-8">
        {(error || errorAccion || errorExportar) && (
          <Alert
            tone="error"
            title={
              errorExportar ? 'No se pudo exportar' : errorAccion ?? 'No se pudo cargar la lista'
            }
          >
            {errorExportar ?? errorAccion ?? error?.message}
          </Alert>
        )}

        <div className="relative flex flex-col gap-5 bg-primary">
          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="flex flex-1 flex-col gap-0.5">
              <p className="text-xl font-semibold text-primary">Proformas y pedidos</p>
              <p className="text-md text-tertiary">
                Documentos de venta no tributarios. Aprueba una proforma y conviértela a boleta o
                factura cuando el cliente decida comprar.
              </p>
            </div>
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
                onPress={() => navigate('/documentos/nuevo')}
                startIcon={<Icon name="plus" className="size-4" />}
              >
                Nueva proforma o pedido
              </Button>
            </div>
          </div>
        </div>

        <div className="flex w-full flex-col" data-orientation="horizontal">
          <div
            role="tablist"
            aria-label="Filtrar documentos por tipo"
            className="group relative flex flex-wrap gap-x-3 gap-y-2 before:pointer-events-none before:absolute before:inset-x-0 before:bottom-0 before:h-px before:bg-border-secondary"
            data-orientation="horizontal"
          >
            {PESTANAS.map((opcion) => {
              const activo = pestana === opcion.clave
              const cantidad = (data ?? []).filter((documento) =>
                coincidePestana(documento, opcion.clave),
              ).length
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
                placeholder="Buscar por documento o cliente"
                aria-label="Buscar documentos"
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
                  <label className="flex flex-col gap-1 text-xs font-medium text-tertiary">
                    Estado
                    <Select
                      ariaLabel="Estado"
                      value={estado}
                      onChange={(valor) => setEstado(valor as FiltroEstado)}
                      placeholder="Todos los estados"
                      options={[
                        ...ESTADOS.map((valor) => ({ value: valor, label: valor })),
                      ]}
                      className="h-9"
                    />
                  </label>
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
                {filas.length} de {data?.length ?? 0} documentos · ordenados por fecha reciente
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
                  {filas.length} documentos
                </span>
              </div>
            </div>
          </div>

          <div className="hidden lg:block">
            <table className="w-full overflow-x-hidden" aria-label="Documentos">
              <thead className="relative h-11 bg-secondary [&>tr>th]:after:pointer-events-none [&>tr>th]:after:absolute [&>tr>th]:after:inset-x-0 [&>tr>th]:after:bottom-0 [&>tr>th]:after:h-px [&>tr>th]:after:bg-border-secondary [&>tr>th]:focus-visible:after:bg-transparent">
                <tr>
                  <th scope="col" className="relative w-full p-0 px-6 py-2 nth-2:pl-3">
                    <div className="flex items-center">{encabezadoOrden('documento', 'Documento')}</div>
                  </th>
                  <th scope="col" className="relative p-0 px-6 py-2 nth-2:pl-3">
                    <div className="flex items-center">{encabezadoOrden('cliente', 'Cliente')}</div>
                  </th>
                  <th scope="col" className="relative p-0 px-6 py-2 nth-2:pl-3">
                    <div className="flex items-center">{encabezadoOrden('vencimiento', 'Vencimiento')}</div>
                  </th>
                  <th scope="col" className="relative p-0 px-6 py-2 text-right nth-2:pl-3">
                    <div className="flex items-center justify-end">{encabezadoOrden('total', 'Total')}</div>
                  </th>
                  <th scope="col" className="relative p-0 px-6 py-2 nth-2:pl-3">Estado</th>
                  <th scope="col" className="relative p-0 px-6 py-2 nth-2:pl-3">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading && !data ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-tertiary">
                      Cargando documentos…
                    </td>
                  </tr>
                ) : visibles.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
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
                        <p className="text-sm font-medium text-primary">
                          {ETIQUETAS_DOCUMENTO[row.tipo]} {numeroComprobante(row.serie, row.numero)}
                        </p>
                        <p className="text-sm text-tertiary">{fechaCorta(`${row.fecha}`)}</p>
                        {row.comprobante && (
                          <p className="text-xs text-tertiary">
                            Convertido a{' '}
                            {numeroComprobante(row.comprobante.serie, row.comprobante.numero)}
                          </p>
                        )}
                      </td>
                      <td className="relative px-6 py-4 nth-2:pl-3">
                        <p className="truncate text-sm font-medium text-primary">{row.cliente}</p>
                        <p className="text-sm text-tertiary">{row.clienteDocumento}</p>
                      </td>
                      <td className="relative px-6 py-4 text-sm text-tertiary nth-2:pl-3">
                        {row.fechaVencimiento ? fechaCorta(`${row.fechaVencimiento}`) : '—'}
                      </td>
                      <td className="relative px-6 py-4 text-right text-sm font-semibold text-primary tabular-nums nth-2:pl-3">
                        {soles(row.total)}
                      </td>
                      <td className="relative px-6 py-4 nth-2:pl-3">
                        <EstadoDocumentoBadge estado={row.estado} />
                      </td>
                      <td className="relative py-4 px-4 nth-2:pl-3">
                        <div className="flex justify-end gap-0.5">
                          <Button
                            size="xs"
                            variant="ghost"
                            aria-label={`Ver detalles de ${row.cliente}`}
                            onPress={() => navigate(`/documentos/${row.id}`)}
                            startIcon={<Icon name="eye" className="size-4" />}
                          />
                          {row.estado === 'PENDIENTE' && (
                            <Button
                              size="xs"
                              variant="outline"
                              isLoading={cambiando === row.id}
                              onPress={() => void cambiar(row.id, 'APROBADO')}
                            >
                              Aprobar
                            </Button>
                          )}
                          {(row.estado === 'PENDIENTE' || row.estado === 'APROBADO') && (
                            <Button
                              size="xs"
                              variant="ghost"
                              isDisabled={cambiando === row.id}
                              onPress={() => void cambiar(row.id, 'RECHAZADO')}
                            >
                              Rechazar
                            </Button>
                          )}
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
              <p className="py-8 text-center text-sm text-tertiary">Cargando documentos…</p>
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
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-primary">
                        {ETIQUETAS_DOCUMENTO[row.tipo]} {numeroComprobante(row.serie, row.numero)}
                      </p>
                      <p className="text-sm text-tertiary">{fechaCorta(`${row.fecha}`)}</p>
                    </div>
                    <EstadoDocumentoBadge estado={row.estado} />
                  </div>
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-xs text-tertiary">Cliente</dt>
                      <dd className="truncate text-primary">{row.cliente}</dd>
                      <dd className="text-tertiary">{row.clienteDocumento}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-tertiary">Vencimiento</dt>
                      <dd className="text-primary">
                        {row.fechaVencimiento ? fechaCorta(`${row.fechaVencimiento}`) : '—'}
                      </dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-xs text-tertiary">Total</dt>
                      <dd className="text-base font-semibold text-primary tabular-nums">
                        {soles(row.total)}
                      </dd>
                    </div>
                    {row.comprobante && (
                      <div className="sm:col-span-2">
                        <dt className="text-xs text-tertiary">Convertido a</dt>
                        <dd className="text-primary">
                          {numeroComprobante(row.comprobante.serie, row.comprobante.numero)}
                        </dd>
                      </div>
                    )}
                  </dl>
                  <div className="flex flex-col-reverse gap-2 sm:flex-row">
                    {row.estado === 'PENDIENTE' && (
                      <Button
                        size="sm"
                        variant="outline"
                        isLoading={cambiando === row.id}
                        onPress={() => void cambiar(row.id, 'APROBADO')}
                      >
                        Aprobar
                      </Button>
                    )}
                    {(row.estado === 'PENDIENTE' || row.estado === 'APROBADO') && (
                      <Button
                        size="sm"
                        variant="ghost"
                        isDisabled={cambiando === row.id}
                        onPress={() => void cambiar(row.id, 'RECHAZADO')}
                      >
                        Rechazar
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      fullWidth
                      onPress={() => navigate(`/documentos/${row.id}`)}
                      startIcon={<Icon name="eye" className="size-4" />}
                    >
                      Ver detalles
                    </Button>
                  </div>
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
    </div>
  )
}
