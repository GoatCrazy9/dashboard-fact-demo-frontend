import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAsyncData } from '@/shared/hooks/useAsyncData'
import { cn } from '@/shared/utils/cn'
import { fechaISO } from '@/shared/utils/fechas'
import { fechaCorta, numeroComprobante } from '@/shared/utils/format'
import {
  descargarTabla,
  type FormatoExport,
} from '@/shared/services/exportacionesService'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { TablePagination } from '@/shared/ui/DataTable'
import { Icon } from '@/shared/ui/icons'
import { Select } from '@/shared/ui/Select'
import { ComprobantesSkeleton } from '@/shared/ui/ListadoSkeleton'
import { comprobantesService } from '../service/comprobantesService'
import { EstadoBadge, ETIQUETAS_TIPO } from '../components/comprobanteUi'
import type { ComprobanteResumen, EstadoComprobante } from '@/shared/types'

type Pestana = 'TODOS' | 'FACTURA' | 'BOLETA' | 'NOTA'
type EstadoFiltro = 'TODOS' | EstadoComprobante
type MonedaFiltro = 'TODAS' | 'PEN' | 'USD'
type ClaveOrden = 'comprobante' | 'cliente' | 'total' | 'fecha' | 'estado'

interface Orden {
  clave: ClaveOrden
  direccion: 'asc' | 'desc'
}

const PESTANAS: { clave: Pestana; etiqueta: string }[] = [
  { clave: 'TODOS', etiqueta: 'Todos' },
  { clave: 'FACTURA', etiqueta: 'Facturas' },
  { clave: 'BOLETA', etiqueta: 'Boletas' },
  { clave: 'NOTA', etiqueta: 'Notas' },
]

const ESTADOS: EstadoComprobante[] = [
  'BORRADOR',
  'EMITIDO',
  'ACEPTADO',
  'RECHAZADO',
  'ANULADO',
]

const dinero = (valor: number, moneda: string) =>
  new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: moneda === 'USD' ? 'USD' : 'PEN',
  }).format(valor)

function coincidePestana(row: ComprobanteResumen, pestana: Pestana) {
  if (pestana === 'TODOS') return true
  if (pestana === 'NOTA') return row.tipo === 'NOTA_CREDITO' || row.tipo === 'NOTA_DEBITO'
  return row.tipo === pestana
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

function valorOrden(row: ComprobanteResumen, clave: ClaveOrden): string | number {
  switch (clave) {
    case 'total':
      return row.total
    case 'fecha':
      return row.fecha
    case 'comprobante':
      return `${row.serie}-${String(row.numero).padStart(8, '0')}`
    case 'cliente':
      return row.cliente
    case 'estado':
      return row.estado
  }
}

export function ComprobantesPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const consulta = params.get('q') ?? ''
  const { data, error, loading } = useAsyncData(comprobantesService.listar, [])

  const [busqueda, setBusqueda] = useState(consulta)
  const [pestana, setPestana] = useState<Pestana>('TODOS')
  const [estado, setEstado] = useState<EstadoFiltro>('TODOS')
  const [moneda, setMoneda] = useState<MonedaFiltro>('TODAS')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [orden, setOrden] = useState<Orden>({ clave: 'fecha', direccion: 'desc' })
  const [pagina, setPagina] = useState(0)
  const [tamano, setTamano] = useState(10)
  const [fechasAbierto, setFechasAbierto] = useState(false)
  const [filtrosAbierto, setFiltrosAbierto] = useState(false)
  const [exportando, setExportando] = useState<FormatoExport | null>(null)
  const [errorExportar, setErrorExportar] = useState<string | null>(null)
  const fechasRef = useRef<HTMLDivElement>(null)
  const filtrosRef = useRef<HTMLDivElement>(null)

  useEffect(() => setBusqueda(consulta), [consulta])

  useEffect(() => {
    setPagina(0)
  }, [busqueda, pestana, estado, moneda, desde, hasta])

  useEffect(() => {
    if (!fechasAbierto && !filtrosAbierto) return

    function handlePointer(event: MouseEvent) {
      const objetivo = event.target as Node
      if (fechasAbierto && !fechasRef.current?.contains(objetivo)) setFechasAbierto(false)
      if (filtrosAbierto && !filtrosRef.current?.contains(objetivo)) setFiltrosAbierto(false)
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      setFechasAbierto(false)
      setFiltrosAbierto(false)
    }

    document.addEventListener('mousedown', handlePointer)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointer)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [fechasAbierto, filtrosAbierto])

  const filas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    return (data ?? [])
      .filter((row) => {
        if (!coincidePestana(row, pestana)) return false
        if (estado !== 'TODOS' && row.estado !== estado) return false
        if (moneda !== 'TODAS' && row.moneda !== moneda) return false

        const fecha = fechaISO(row.fecha)
        if (desde && fecha < desde) return false
        if (hasta && fecha > hasta) return false

        return (
          !texto ||
          row.cliente.toLowerCase().includes(texto) ||
          row.clienteDocumento.toLowerCase().includes(texto) ||
          numeroComprobante(row.serie, row.numero).toLowerCase().includes(texto)
        )
      })
      .sort((a, b) => {
        const izquierda = valorOrden(a, orden.clave)
        const derecha = valorOrden(b, orden.clave)
        const comparacion =
          typeof izquierda === 'number' && typeof derecha === 'number'
            ? izquierda - derecha
            : String(izquierda).localeCompare(String(derecha), 'es', {
                numeric: true,
                sensitivity: 'base',
              })
        return orden.direccion === 'asc' ? comparacion : -comparacion
      })
  }, [data, busqueda, pestana, estado, moneda, desde, hasta, orden])

  const paginas = Math.ceil(filas.length / tamano)
  const paginaActual = Math.min(pagina, Math.max(0, paginas - 1))
  const visibles = filas.slice(paginaActual * tamano, (paginaActual + 1) * tamano)
  const hayFiltros = Boolean(busqueda.trim() || estado !== 'TODOS' || moneda !== 'TODAS' || desde || hasta)
  const pestanaActual = PESTANAS.find((opcion) => opcion.clave === pestana)?.etiqueta ?? 'Todos'
  const rangoTexto = desde || hasta ? `${desde || '…'} – ${hasta || '…'}` : 'Todas las fechas'

  function limpiarFiltros() {
    setBusqueda('')
    setPestana('TODOS')
    setEstado('TODOS')
    setMoneda('TODAS')
    setDesde('')
    setHasta('')
    setPagina(0)
  }

  function alternarOrden(clave: ClaveOrden) {
    setOrden((actual) =>
      actual.clave === clave
        ? { clave, direccion: actual.direccion === 'asc' ? 'desc' : 'asc' }
        : { clave, direccion: clave === 'fecha' ? 'desc' : 'asc' },
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
          titulo: 'Comprobantes',
          nombreArchivo: 'comprobantes',
          columnas: [
            { titulo: 'Fecha', ancho: 70 },
            { titulo: 'Comprobante', ancho: 105 },
            { titulo: 'Cliente', ancho: 185 },
            { titulo: 'Documento', ancho: 95 },
            { titulo: 'Tipo', ancho: 100 },
            { titulo: 'Moneda', ancho: 60 },
            { titulo: 'Subtotal', ancho: 85, alineacion: 'derecha' },
            { titulo: 'IGV', ancho: 75, alineacion: 'derecha' },
            { titulo: 'Total', ancho: 90, alineacion: 'derecha' },
            { titulo: 'Estado', ancho: 85 },
          ],
          filas: filas.map((row) => [
            fechaISO(row.fecha),
            numeroComprobante(row.serie, row.numero),
            row.cliente,
            row.clienteDocumento,
            ETIQUETAS_TIPO[row.tipo] ?? row.tipo,
            row.moneda,
            Number(row.subtotal.toFixed(2)),
            Number(row.igv.toFixed(2)),
            Number(row.total.toFixed(2)),
            row.estado,
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

  if (loading) return <ComprobantesSkeleton />

  return (
    <div className="flex flex-col">
      <div className="mb-8 flex w-full flex-col gap-5 px-4 lg:px-8">
        {(error || errorExportar) && (
          <Alert tone="error" title={errorExportar ? 'No se pudo exportar' : 'No se pudo cargar la lista'}>
            {errorExportar ?? error?.message}
          </Alert>
        )}

        <div className="relative flex flex-col gap-5 bg-primary">
          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="flex flex-1 flex-col gap-0.5">
              <p className="text-xl font-semibold text-primary">Comprobantes</p>
              <p className="text-md text-tertiary">
                Facturas, boletas y notas electrónicas registradas en SICAP.
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
                  onPress={() => navigate('/ventas')}
                  startIcon={<Icon name="plus" className="size-4" />}
                >
                  Nuevo comprobante
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex w-full flex-col" data-orientation="horizontal">
          <div
            role="tablist"
            aria-label="Filtrar comprobantes por tipo"
            className="group relative flex flex-wrap gap-x-3 gap-y-2 before:pointer-events-none before:absolute before:inset-x-0 before:bottom-0 before:h-px before:bg-border-secondary"
            data-orientation="horizontal"
          >
            {PESTANAS.map((opcion) => {
              const activo = pestana === opcion.clave
              const cantidad = (data ?? []).filter((row) => coincidePestana(row, opcion.clave)).length
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
          <label className="group flex h-max w-full min-w-0 flex-1 flex-col items-start justify-start gap-1.5 sm:max-w-70">
            <div className="group/input relative flex w-full flex-row place-content-center place-items-center rounded-lg bg-primary shadow-xs ring-1 ring-primary ring-inset transition-shadow duration-100 ease-linear focus-within:ring-2 focus-within:ring-brand">
              <Icon
                name="search"
                className="pointer-events-none absolute left-3 size-4 text-fg-quaternary stroke-[2.25px]"
              />
              <input
                type="search"
                value={busqueda}
                onChange={(event) => setBusqueda(event.target.value)}
                placeholder="Buscar por comprobante o cliente"
                aria-label="Buscar comprobantes"
                className="m-0 w-full bg-transparent px-3 py-2 pr-3 pl-9 text-base text-primary outline-hidden placeholder:text-placeholder sm:text-sm"
              />
            </div>
          </label>

          <div className="ml-auto flex shrink-0 items-center gap-3">
            <div ref={fechasRef} className="relative">
              <Button
                size="sm"
                variant="outline"
                aria-label="Seleccionar fechas"
                aria-expanded={fechasAbierto}
                onPress={() => {
                  setFiltrosAbierto(false)
                  setFechasAbierto((abierto) => !abierto)
                }}
                startIcon={<Icon name="calendar" className="size-4" />}
              >
                <span className={cn('tabular-nums', !desde && !hasta && 'text-placeholder')}>
                  {rangoTexto}
                </span>
              </Button>

              {fechasAbierto && (
                <div className="absolute end-0 top-full z-20 mt-2 flex w-[min(20rem,calc(100vw-2rem))] flex-col gap-3 rounded-xl bg-primary p-3 shadow-xl ring-1 ring-tertiary ring-inset">
                  <div className="flex flex-col gap-1.5 sm:flex-row">
                    <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs font-medium text-tertiary">
                      Desde
                      <input
                        type="date"
                        value={desde}
                        max={hasta || undefined}
                        onChange={(event) => setDesde(event.target.value)}
                        className="w-full rounded-lg bg-primary px-3 py-2 text-base text-primary shadow-xs ring-1 ring-primary ring-inset outline-hidden focus:ring-2 focus:ring-brand"
                      />
                    </label>
                    <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs font-medium text-tertiary">
                      Hasta
                      <input
                        type="date"
                        value={hasta}
                        min={desde || undefined}
                        onChange={(event) => setHasta(event.target.value)}
                        className="w-full rounded-lg bg-primary px-3 py-2 text-base text-primary shadow-xs ring-1 ring-primary ring-inset outline-hidden focus:ring-2 focus:ring-brand"
                      />
                    </label>
                  </div>
                  <Button size="sm" onPress={() => setFechasAbierto(false)}>
                    Aplicar fechas
                  </Button>
                </div>
              )}
            </div>

            <div ref={filtrosRef} className="relative">
              <Button
                size="sm"
                variant="outline"
                aria-label="Más filtros"
                aria-expanded={filtrosAbierto}
                onPress={() => {
                  setFechasAbierto(false)
                  setFiltrosAbierto((abierto) => !abierto)
                }}
                startIcon={<Icon name="filter" className="size-4" />}
                endIcon={<Icon name="chevron-down" className="size-4" />}
              >
                Filtros
              </Button>

              {filtrosAbierto && (
                <div className="absolute end-0 top-full z-20 mt-2 flex w-[min(20rem,calc(100vw-2rem))] flex-col gap-3 rounded-xl bg-primary p-3 shadow-xl ring-1 ring-tertiary ring-inset">
                  <label className="flex flex-col gap-1 text-xs font-medium text-tertiary">
                    Estado SUNAT
                    <Select
                      ariaLabel="Estado SUNAT"
                      value={estado}
                      onChange={(seleccion) => setEstado(seleccion as EstadoFiltro)}
                      options={[
                        { value: 'TODOS', label: 'Todos los estados' },
                        ...ESTADOS.map((valor) => ({ value: valor, label: valor })),
                      ]}
                      className="h-9"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs font-medium text-tertiary">
                    Moneda
                    <Select
                      ariaLabel="Moneda"
                      value={moneda}
                      onChange={(seleccion) => setMoneda(seleccion as MonedaFiltro)}
                      options={[
                        { value: 'TODAS', label: 'Todas las monedas' },
                        { value: 'PEN', label: 'PEN' },
                        { value: 'USD', label: 'USD' },
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
                {filas.length} de {data?.length ?? 0} comprobantes · ordenados por fecha reciente
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
          <div className="relative flex-col items-start gap-4 border-b border-secondary bg-primary px-4 py-5 md:flex-row md:px-6 hidden pb-5 lg:flex">
            <div className="flex flex-1 flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <h2 className="text-md font-semibold text-primary">{pestanaActual}</h2>
                <span className="size-max flex items-center gap-1 rounded-md py-0.5 px-1.5 text-xs font-medium bg-primary text-secondary ring-1 ring-primary shadow-xs ring-inset">
                  {filas.length} comprobantes
                </span>
              </div>
            </div>
          </div>

          <div className="hidden lg:block">
            <table className="w-full overflow-x-hidden" aria-label="Comprobantes">
              <thead className="relative h-11 bg-secondary [&>tr>th]:after:pointer-events-none [&>tr>th]:after:absolute [&>tr>th]:after:inset-x-0 [&>tr>th]:after:bottom-0 [&>tr>th]:after:h-px [&>tr>th]:after:bg-border-secondary [&>tr>th]:focus-visible:after:bg-transparent">
                <tr>
                  <th scope="col" className="relative w-full p-0 px-6 py-2 nth-2:pl-3">
                    <div className="flex items-center">
                      {encabezadoOrden('comprobante', 'Comprobante')}
                    </div>
                  </th>
                  <th scope="col" className="relative p-0 px-6 py-2 nth-2:pl-3">
                    <div className="flex items-center">{encabezadoOrden('total', 'Importe')}</div>
                  </th>
                  <th scope="col" className="relative p-0 px-6 py-2 nth-2:pl-3">
                    <div className="flex items-center">{encabezadoOrden('fecha', 'Fecha')}</div>
                  </th>
                  <th scope="col" className="relative p-0 px-6 py-2 nth-2:pl-3">
                    <div className="flex items-center">{encabezadoOrden('estado', 'Estado SUNAT')}</div>
                  </th>
                  <th scope="col" className="relative p-0 px-6 py-2 nth-2:pl-3">
                    <div className="flex items-center">{encabezadoOrden('cliente', 'Cliente')}</div>
                  </th>
                  <th scope="col" className="relative p-0 px-6 py-2 nth-2:pl-3">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading && !data ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-tertiary">
                      Cargando comprobantes…
                    </td>
                  </tr>
                ) : visibles.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <p className="text-sm font-medium text-primary">Sin resultados</p>
                      <p className="mt-1 text-sm text-tertiary">
                        Ajusta los filtros o emite un comprobante nuevo.
                      </p>
                    </td>
                  </tr>
                ) : (
                  visibles.map((row) => (
                    <tr
                      key={row.id}
                      className="relative h-18 outline-focus-ring transition-colors after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-px after:w-full after:bg-border-secondary hover:bg-secondary focus-visible:outline-2 focus-visible:-outline-offset-2 last:after:hidden"
                    >
                      <td className="relative px-6 py-4 nth-2:pl-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium whitespace-nowrap text-primary">
                            {ETIQUETAS_TIPO[row.tipo]} {numeroComprobante(row.serie, row.numero)}
                          </p>
                          <p className="text-sm whitespace-nowrap text-tertiary">
                            {row.clienteDocumento}
                          </p>
                          {row.documentoAfectado && (
                            <p className="text-xs whitespace-nowrap text-tertiary">
                              Afecta a {row.documentoAfectado}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="relative px-6 py-4 text-sm text-tertiary tabular-nums nth-2:pl-3">
                        {dinero(row.total, row.moneda)}
                      </td>
                      <td className="relative px-6 py-4 text-sm text-tertiary whitespace-nowrap nth-2:pl-3">
                        {fechaCorta(row.fecha)}
                      </td>
                      <td className="relative px-6 py-4 nth-2:pl-3">
                        <div className="flex flex-col items-start gap-1">
                          <EstadoBadge estado={row.estado} />
                          {row.sunatCodigo && (
                            <span className="text-xs text-tertiary">Código {row.sunatCodigo}</span>
                          )}
                        </div>
                      </td>
                      <td className="relative px-6 py-4 nth-2:pl-3">
                        <div className="group flex items-center gap-3 outline-hidden">
                          <span className="relative inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-tertiary text-xs font-semibold text-quaternary ring-1 ring-secondary ring-inset">
                            {iniciales(row.cliente)}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-primary">{row.cliente}</p>
                            <p className="text-sm text-tertiary">{row.moneda}</p>
                          </div>
                        </div>
                      </td>
                      <td className="relative py-4 px-4 nth-2:pl-3">
                        <div className="flex justify-end gap-0.5">
                          <Button
                            size="xs"
                            variant="ghost"
                            aria-label={`Ver detalle de ${numeroComprobante(row.serie, row.numero)}`}
                            onPress={() => navigate(`/comprobantes/${row.id}`)}
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
              <p className="py-8 text-center text-sm text-tertiary">Cargando comprobantes…</p>
            ) : visibles.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm font-medium text-primary">Sin resultados</p>
                <p className="mt-1 text-sm text-tertiary">Ajusta los filtros o emite uno nuevo.</p>
              </div>
            ) : (
              visibles.map((row) => (
                <div
                  key={row.id}
                  className="flex flex-col gap-3 rounded-xl bg-primary p-4 shadow-xs ring-1 ring-secondary ring-inset"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-primary">
                        {ETIQUETAS_TIPO[row.tipo]} {numeroComprobante(row.serie, row.numero)}
                      </p>
                      <p className="truncate text-sm text-tertiary">{row.cliente}</p>
                    </div>
                    <EstadoBadge estado={row.estado} />
                  </div>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div>
                      <dt className="text-xs text-tertiary">Importe</dt>
                      <dd className="font-medium text-primary tabular-nums">
                        {dinero(row.total, row.moneda)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-tertiary">Fecha</dt>
                      <dd className="text-primary">{fechaCorta(row.fecha)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-tertiary">Documento</dt>
                      <dd className="text-primary">{row.clienteDocumento}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-tertiary">Estado SUNAT</dt>
                      <dd className="text-primary">{row.sunatCodigo ?? '—'}</dd>
                    </div>
                  </dl>
                  <Button
                    size="sm"
                    variant="outline"
                    fullWidth
                    onPress={() => navigate(`/comprobantes/${row.id}`)}
                    startIcon={<Icon name="eye" className="size-4" />}
                  >
                    Ver detalle
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
    </div>
  )
}
