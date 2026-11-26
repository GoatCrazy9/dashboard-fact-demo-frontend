import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAsyncData } from '@/shared/hooks/useAsyncData'
import { cn } from '@/shared/utils/cn'
import { descargarBlob } from '@/shared/utils/descargar'
import { hoyEnLima } from '@/shared/utils/fechas'
import { fechaCorta, numeroComprobante, soles } from '@/shared/utils/format'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { TablePagination } from '@/shared/ui/DataTable'
import { Icon } from '@/shared/ui/icons'
import { GraficoArea, type PuntoVenta } from '@/modules/panel/components/GraficoArea'
import { EstadoBadge, ETIQUETAS_TIPO } from '@/modules/comprobantes/components/comprobanteUi'
import { ReportesSkeleton } from '../components/ReportesSkeleton'
import { reportesService } from '../service/reportesService'
import type { DetalleVentaReporte, ReporteVentas } from '@/shared/types'

type Pestana = 'RESUMEN' | 'DETALLE' | 'DIA' | 'PRODUCTO'

type FilaDia = ReporteVentas['porDia'][number]
type FilaProducto = ReporteVentas['porProducto'][number]

interface ColumnaTabla<T> {
  clave: string
  etiqueta: string
  render: (fila: T) => ReactNode
  valor?: (fila: T) => string | number
  ancho?: string
  alineacion?: 'right'
  ordenable?: boolean
  ocultaEnHeader?: boolean
}

const PESTANAS: { clave: Pestana; etiqueta: string }[] = [
  { clave: 'RESUMEN', etiqueta: 'Resumen' },
  { clave: 'DETALLE', etiqueta: 'Detalle' },
  { clave: 'DIA', etiqueta: 'Por día' },
  { clave: 'PRODUCTO', etiqueta: 'Por producto' },
]

const PLACEHOLDERS: Record<Pestana, string> = {
  RESUMEN: '',
  DETALLE: 'Buscar por comprobante o cliente',
  DIA: 'Buscar por fecha',
  PRODUCTO: 'Buscar por producto',
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

function desplazarDias(iso: string, dias: number) {
  const [anio, mes, dia] = iso.split('-').map(Number)
  return new Date(Date.UTC(anio, mes - 1, dia - dias)).toISOString().slice(0, 10)
}

function TablaUntitled<T>({
  titulo,
  etiqueta,
  filas,
  columnas,
  rowKey,
  renderTarjeta,
  cargando,
  vacioTitulo,
  vacioDescripcion,
}: {
  titulo: string
  etiqueta: string
  filas: T[]
  columnas: ColumnaTabla<T>[]
  rowKey: (fila: T) => string
  renderTarjeta: (fila: T) => ReactNode
  cargando?: boolean
  vacioTitulo: string
  vacioDescripcion: string
}) {
  const [orden, setOrden] = useState<{ clave: string; direccion: 'asc' | 'desc' }>({
    clave: columnas[0]?.clave ?? '',
    direccion: 'asc',
  })
  const [pagina, setPagina] = useState(0)
  const [tamano, setTamano] = useState(10)

  const ordenadas = useMemo(() => {
    const columna = columnas.find((item) => item.clave === orden.clave)
    if (!columna?.valor) return filas
    return [...filas].sort((a, b) => {
      const izquierda = columna.valor!(a)
      const derecha = columna.valor!(b)
      const comparacion =
        typeof izquierda === 'number' && typeof derecha === 'number'
          ? izquierda - derecha
          : String(izquierda).localeCompare(String(derecha), 'es', {
              numeric: true,
              sensitivity: 'base',
            })
      return orden.direccion === 'asc' ? comparacion : -comparacion
    })
  }, [filas, columnas, orden])

  useEffect(() => setPagina(0), [orden, tamano, filas])

  const paginas = Math.ceil(ordenadas.length / tamano)
  const paginaActual = Math.min(pagina, Math.max(0, paginas - 1))
  const visibles = ordenadas.slice(paginaActual * tamano, (paginaActual + 1) * tamano)

  function alternarOrden(clave: string) {
    setOrden((actual) =>
      actual.clave === clave
        ? { clave, direccion: actual.direccion === 'asc' ? 'desc' : 'asc' }
        : { clave, direccion: 'asc' },
    )
  }

  function encabezado(columna: ColumnaTabla<T>) {
    if (columna.ocultaEnHeader) return <span className="sr-only">{columna.etiqueta}</span>
    if (columna.ordenable === false || !columna.valor) {
      return <span>{columna.etiqueta}</span>
    }
    const activo = orden.clave === columna.clave
    return (
      <button
        type="button"
        onClick={() => alternarOrden(columna.clave)}
        className="flex cursor-pointer items-center gap-1"
        aria-label={`Ordenar por ${columna.etiqueta} ${activo && orden.direccion === 'asc' ? 'descendente' : 'ascendente'}`}
      >
        {columna.etiqueta}
        <Icon
          name={activo ? (orden.direccion === 'asc' ? 'arrow-up' : 'arrow-down') : 'chevron-down'}
          className={cn('size-3 stroke-[3px]', activo ? 'text-fg-quaternary' : 'text-fg-quaternary/50')}
        />
      </button>
    )
  }

  return (
    <div className="bg-primary shadow-xs ring-1 ring-secondary -mx-4 rounded-none ring-inset lg:mx-0 lg:rounded-xl">
      <div className="flex items-center gap-2 border-b border-secondary px-4 py-4 lg:px-6">
        <h2 className="text-md font-semibold text-primary">{titulo}</h2>
        <span className="size-max flex items-center gap-1 rounded-md py-0.5 px-1.5 text-xs font-medium bg-primary text-secondary ring-1 ring-primary shadow-xs ring-inset">
          {filas.length}
        </span>
      </div>

      <div className="hidden lg:block">
        <table className="w-full overflow-x-hidden" aria-label={etiqueta}>
          <thead className="relative h-11 bg-secondary [&>tr>th]:after:pointer-events-none [&>tr>th]:after:absolute [&>tr>th]:after:inset-x-0 [&>tr>th]:after:bottom-0 [&>tr>th]:after:h-px [&>tr>th]:after:bg-border-secondary [&>tr>th]:focus-visible:after:bg-transparent">
            <tr>
              {columnas.map((columna) => (
                <th
                  key={columna.clave}
                  scope="col"
                  className={cn(
                    'relative p-0 px-6 py-2 nth-2:pl-3',
                    columna.alineacion === 'right' && 'text-right',
                    columna.ancho,
                  )}
                >
                  <div className={cn('flex items-center', columna.alineacion === 'right' && 'justify-end')}>
                    {encabezado(columna)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cargando && filas.length === 0 ? (
              <tr>
                <td colSpan={columnas.length} className="px-6 py-12 text-center text-sm text-tertiary">
                  Cargando reporte…
                </td>
              </tr>
            ) : visibles.length === 0 ? (
              <tr>
                <td colSpan={columnas.length} className="px-6 py-12 text-center">
                  <p className="text-sm font-medium text-primary">{vacioTitulo}</p>
                  <p className="mt-1 text-sm text-tertiary">{vacioDescripcion}</p>
                </td>
              </tr>
            ) : (
              visibles.map((fila) => (
                <tr
                  key={rowKey(fila)}
                  className="relative h-18 outline-focus-ring transition-colors after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-px after:w-full after:bg-border-secondary hover:bg-secondary focus-visible:outline-2 focus-visible:-outline-offset-2 last:after:hidden"
                >
                  {columnas.map((columna) => (
                    <td
                      key={columna.clave}
                      className={cn(
                        'relative px-6 py-4 text-sm text-tertiary nth-2:pl-3',
                        columna.alineacion === 'right' && 'text-right tabular-nums',
                      )}
                    >
                      {columna.render(fila)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 p-4 lg:hidden">
        {cargando && filas.length === 0 ? (
          <p className="py-8 text-center text-sm text-tertiary">Cargando reporte…</p>
        ) : visibles.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm font-medium text-primary">{vacioTitulo}</p>
            <p className="mt-1 text-sm text-tertiary">{vacioDescripcion}</p>
          </div>
        ) : (
          visibles.map((fila) => renderTarjeta(fila))
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
  )
}

export function ReportesPage() {
  const navigate = useNavigate()
  const hoy = hoyEnLima()
  const [desde, setDesde] = useState(`${hoy.slice(0, 8)}01`)
  const [hasta, setHasta] = useState(hoy)
  const [borradorDesde, setBorradorDesde] = useState(desde)
  const [borradorHasta, setBorradorHasta] = useState(hasta)
  const [rangoAbierto, setRangoAbierto] = useState(false)
  const [pestana, setPestana] = useState<Pestana>('RESUMEN')
  const [busqueda, setBusqueda] = useState('')
  const [formatoExportando, setFormatoExportando] = useState<'excel' | 'pdf' | null>(null)
  const [errorExportar, setErrorExportar] = useState<string | null>(null)
  const rangoRef = useRef<HTMLDivElement>(null)

  const rangoInvalido = desde > hasta
  const borradorInvalido = borradorDesde > borradorHasta
  const { data, error, loading } = useAsyncData(
    () => (desde > hasta ? Promise.resolve(null) : reportesService.ventas({ desde, hasta })),
    [desde, hasta],
  )

  useEffect(() => {
    if (!rangoAbierto) return
    setBorradorDesde(desde)
    setBorradorHasta(hasta)

    function handlePointer(event: MouseEvent) {
      if (!rangoRef.current?.contains(event.target as Node)) setRangoAbierto(false)
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setRangoAbierto(false)
    }
    document.addEventListener('mousedown', handlePointer)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointer)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [rangoAbierto, desde, hasta])

  async function exportar(formato: 'excel' | 'pdf') {
    setFormatoExportando(formato)
    setErrorExportar(null)
    try {
      const archivo =
        formato === 'excel'
          ? await reportesService.descargarExcel({ desde, hasta })
          : await reportesService.descargarPdf({ desde, hasta })
      descargarBlob(archivo.blob, archivo.filename)
    } catch (err) {
      setErrorExportar(
        err instanceof Error
          ? err.message
          : `No se pudo generar el ${formato === 'pdf' ? 'PDF' : 'Excel'}.`,
      )
    } finally {
      setFormatoExportando(null)
    }
  }

  function aplicarRango(inicio: string, fin: string) {
    setDesde(inicio)
    setHasta(fin)
    setBorradorDesde(inicio)
    setBorradorHasta(fin)
    setRangoAbierto(false)
  }

  function cambiarPestana(siguiente: Pestana) {
    setPestana(siguiente)
    setBusqueda('')
  }

  const resumen = data?.resumen
  const puntosGrafico = useMemo<PuntoVenta[]>(
    () =>
      (data?.porDia ?? []).map((punto) => ({
        etiqueta: fechaCorta(punto.fecha),
        total: punto.totalPEN,
        cantidad: punto.comprobantes,
      })),
    [data],
  )

  const generado = data?.generadoEn
    ? new Intl.DateTimeFormat('es-PE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(data.generadoEn))
    : '—'

  const texto = busqueda.trim().toLowerCase()
  const detalleFilas = useMemo(
    () =>
      (data?.detalle ?? []).filter((fila) => {
        if (!texto) return true
        const numero = numeroComprobante(fila.serie, fila.numero).toLowerCase()
        return (
          numero.includes(texto) ||
          fila.cliente.toLowerCase().includes(texto) ||
          fila.clienteDocumento.toLowerCase().includes(texto)
        )
      }),
    [data, texto],
  )

  const diaFilas = useMemo(
    () =>
      (data?.porDia ?? []).filter(
        (fila) => !texto || fila.fecha.includes(texto) || fechaCorta(fila.fecha).toLowerCase().includes(texto),
      ),
    [data, texto],
  )

  const productoFilas = useMemo(
    () =>
      (data?.porProducto ?? []).filter((fila) =>
        !texto || fila.descripcion.toLowerCase().includes(texto),
      ),
    [data, texto],
  )

  const columnasDetalle: ColumnaTabla<DetalleVentaReporte>[] = [
    {
      clave: 'comprobante',
      etiqueta: 'Comprobante',
      ancho: 'w-full',
      valor: (fila) => `${fila.serie}-${String(fila.numero).padStart(8, '0')}`,
      render: (fila) => (
        <div className="min-w-0">
          <p className="font-medium whitespace-nowrap text-primary">
            {ETIQUETAS_TIPO[fila.tipo]} {numeroComprobante(fila.serie, fila.numero)}
          </p>
          <p className="text-xs whitespace-nowrap text-tertiary">{fechaCorta(fila.fecha)}</p>
          {fila.documentoAfectado && (
            <p className="text-xs whitespace-nowrap text-tertiary">
              Afecta a {fila.documentoAfectado}
            </p>
          )}
        </div>
      ),
    },
    {
      clave: 'cliente',
      etiqueta: 'Cliente',
      valor: (fila) => fila.cliente,
      render: (fila) => (
        <div className="flex items-center gap-3">
          <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-tertiary text-xs font-semibold text-quaternary ring-1 ring-secondary ring-inset">
            {iniciales(fila.cliente)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-primary">{fila.cliente}</p>
            <p className="text-xs text-tertiary">{fila.clienteDocumento}</p>
          </div>
        </div>
      ),
    },
    {
      clave: 'total',
      etiqueta: 'Total PEN',
      alineacion: 'right',
      valor: (fila) => fila.totalPEN,
      render: (fila) => (
        <span
          className={cn(
            'font-semibold whitespace-nowrap tabular-nums',
            fila.signo === -1 ? 'text-error-primary' : 'text-primary',
          )}
        >
          {fila.signo === -1 ? '−' : ''}
          {soles(fila.totalPEN)}
        </span>
      ),
    },
    {
      clave: 'estado',
      etiqueta: 'Estado',
      valor: (fila) => fila.estado,
      render: (fila) => <EstadoBadge estado={fila.estado} />,
    },
    {
      clave: 'acciones',
      etiqueta: 'Acciones',
      ordenable: false,
      ocultaEnHeader: true,
      render: (fila) => (
        <div className="flex justify-end">
          <Button
            size="xs"
            variant="ghost"
            aria-label={`Ver ticket de ${numeroComprobante(fila.serie, fila.numero)}`}
            onPress={() => navigate(`/comprobantes/${fila.id}`)}
            startIcon={<Icon name="eye" className="size-4" />}
          />
        </div>
      ),
    },
  ]

  const columnasDia: ColumnaTabla<FilaDia>[] = [
    {
      clave: 'fecha',
      etiqueta: 'Fecha',
      ancho: 'w-full',
      valor: (fila) => fila.fecha,
      render: (fila) => (
        <span className="font-medium whitespace-nowrap text-primary">{fechaCorta(fila.fecha)}</span>
      ),
    },
    {
      clave: 'comprobantes',
      etiqueta: 'Comprobantes',
      alineacion: 'right',
      valor: (fila) => fila.comprobantes,
      render: (fila) => <span className="tabular-nums">{fila.comprobantes}</span>,
    },
    {
      clave: 'total',
      etiqueta: 'Total PEN',
      alineacion: 'right',
      valor: (fila) => fila.totalPEN,
      render: (fila) => (
        <span className="font-semibold whitespace-nowrap text-primary tabular-nums">
          {soles(fila.totalPEN)}
        </span>
      ),
    },
  ]

  const columnasProducto: ColumnaTabla<FilaProducto>[] = [
    {
      clave: 'producto',
      etiqueta: 'Producto',
      ancho: 'w-full',
      valor: (fila) => fila.descripcion,
      render: (fila) => (
        <div className="flex items-center gap-3">
          <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-tertiary text-xs font-semibold text-quaternary ring-1 ring-secondary ring-inset">
            {iniciales(fila.descripcion)}
          </span>
          <span className="truncate font-medium text-primary">{fila.descripcion}</span>
        </div>
      ),
    },
    {
      clave: 'cantidad',
      etiqueta: 'Cantidad',
      alineacion: 'right',
      valor: (fila) => fila.cantidad,
      render: (fila) => <span className="tabular-nums">{fila.cantidad}</span>,
    },
    {
      clave: 'total',
      etiqueta: 'Total PEN',
      alineacion: 'right',
      valor: (fila) => fila.totalPEN,
      render: (fila) => (
        <span className="font-semibold whitespace-nowrap text-primary tabular-nums">
          {soles(fila.totalPEN)}
        </span>
      ),
    },
  ]

  const tarjetas = [
    {
      titulo: 'Ventas netas (PEN)',
      valor: soles(resumen?.totalPEN ?? 0),
      detalle: `${resumen?.comprobantes ?? 0} comprobantes · ${resumen?.anulados ?? 0} anulados`,
      icono: 'wallet',
      color: 'text-success-primary',
    },
    {
      titulo: 'IGV neto',
      valor: soles(resumen?.igv ?? 0),
      detalle: `Subtotal ${soles(resumen?.subtotal ?? 0)}`,
      icono: 'receipt',
      color: 'text-brand-secondary',
    },
    {
      titulo: 'Ticket promedio',
      valor: soles(resumen?.ticketPromedio ?? 0),
      detalle: 'Por comprobante considerado',
      icono: 'chart',
      color: 'text-warning-primary',
    },
    {
      titulo: 'Comprobantes',
      valor: String(resumen?.comprobantes ?? 0),
      detalle: `${resumen?.facturas ?? 0} facturas · ${resumen?.boletas ?? 0} boletas`,
      icono: 'clipboard',
      color: 'text-quaternary',
    },
  ] as const

  if (loading) return <ReportesSkeleton pestana={pestana} />

  return (
    <div className="flex flex-col">
      <div className="mb-8 flex w-full flex-col gap-5 px-4 lg:px-8">
        {(error || errorExportar || rangoInvalido) && (
          <Alert
            tone="error"
            title={
              errorExportar
                ? 'No se pudo exportar'
                : rangoInvalido
                  ? 'Rango de fechas inválido'
                  : 'No se pudo cargar el reporte'
            }
          >
            {errorExportar ??
              (rangoInvalido
                ? 'La fecha inicial no puede ser mayor que la final.'
                : error?.message)}
          </Alert>
        )}

        <div className="relative flex flex-col gap-5 bg-primary">
          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="flex flex-1 flex-col gap-0.5">
              <p className="text-xl font-semibold text-primary">Reporte de ventas</p>
              <p className="text-md text-tertiary">
                Ventas emitidas y aceptadas en el rango elegido. Generado {generado}.
              </p>
            </div>
            <div className="flex flex-wrap items-start gap-3">
              <Button
                size="sm"
                onPress={() => void exportar('excel')}
                isLoading={formatoExportando === 'excel'}
                isDisabled={rangoInvalido || formatoExportando !== null}
                startIcon={<Icon name="download" className="size-4" />}
              >
                Exportar Excel
              </Button>
              <Button
                size="sm"
                variant="outline"
                onPress={() => void exportar('pdf')}
                isLoading={formatoExportando === 'pdf'}
                isDisabled={rangoInvalido || formatoExportando !== null}
                startIcon={<Icon name="file-text" className="size-4" />}
              >
                Exportar PDF
              </Button>
            </div>
          </div>
        </div>

        <div className="flex w-full flex-col" data-orientation="horizontal">
          <div
            role="tablist"
            aria-label="Secciones del reporte"
            className="group relative flex flex-wrap gap-3 before:pointer-events-none before:absolute before:inset-x-0 before:bottom-0 before:h-px before:bg-border-secondary"
            data-orientation="horizontal"
          >
            {PESTANAS.map((opcion) => {
              const activo = pestana === opcion.clave
              const cantidad =
                opcion.clave === 'DETALLE'
                  ? data?.detalle.length
                  : opcion.clave === 'DIA'
                    ? data?.porDia.length
                    : opcion.clave === 'PRODUCTO'
                      ? data?.porProducto.length
                      : undefined
              return (
                <button
                  key={opcion.clave}
                  type="button"
                  role="tab"
                  aria-selected={activo}
                  onClick={() => cambiarPestana(opcion.clave)}
                  className={cn(
                    'z-10 flex h-max cursor-pointer items-center justify-center gap-1 px-0.5 pt-0 pb-2.5 text-sm font-semibold whitespace-nowrap rounded-none border-b-2 outline-focus-ring transition duration-100 ease-linear',
                    activo
                      ? 'border-fg-brand-primary_alt text-brand-secondary'
                      : 'border-transparent text-quaternary hover:text-secondary',
                  )}
                >
                  <span className="flex items-center gap-1.5 px-0.5">
                    {opcion.etiqueta}
                    {cantidad !== undefined && (
                      <span className="text-xs font-medium text-tertiary tabular-nums">
                        {cantidad}
                      </span>
                    )}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="flex w-full flex-col gap-6 px-4 lg:px-8">
        <div className="flex flex-wrap gap-3">
          {pestana !== 'RESUMEN' && (
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
                  placeholder={PLACEHOLDERS[pestana]}
                  aria-label="Buscar en el reporte"
                  className="m-0 w-full bg-transparent px-3 py-2 pr-3 pl-9 text-base text-primary outline-hidden placeholder:text-placeholder sm:text-sm"
                />
              </div>
            </label>
          )}

          <div className={cn('relative', pestana === 'RESUMEN' && 'ml-auto')}>
            <Button
              size="sm"
              variant="outline"
              aria-label="Seleccionar rango de fechas"
              aria-expanded={rangoAbierto}
              onPress={() => setRangoAbierto((abierto) => !abierto)}
              startIcon={<Icon name="calendar" className="size-4" />}
            >
              <span className="tabular-nums">{desde} – {hasta}</span>
            </Button>

            {rangoAbierto && (
              <div
                ref={rangoRef}
                className="absolute end-0 top-full z-20 mt-2 flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-3 rounded-xl bg-primary p-3 shadow-xl ring-1 ring-tertiary ring-inset"
              >
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="xs"
                    variant="outline"
                    onPress={() => aplicarRango(`${hoy.slice(0, 8)}01`, hoy)}
                  >
                    Este mes
                  </Button>
                  <Button
                    size="xs"
                    variant="outline"
                    onPress={() => aplicarRango(desplazarDias(hoy, 29), hoy)}
                  >
                    30 días
                  </Button>
                  <Button
                    size="xs"
                    variant="outline"
                    onPress={() => aplicarRango(desplazarDias(hoy, 89), hoy)}
                  >
                    90 días
                  </Button>
                </div>
                <div className="flex flex-col gap-1.5 sm:flex-row">
                  <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs font-medium text-tertiary">
                    Desde
                    <input
                      type="date"
                      value={borradorDesde}
                      max={borradorHasta || undefined}
                      onChange={(event) => setBorradorDesde(event.target.value)}
                      className="w-full rounded-lg bg-primary px-3 py-2 text-base text-primary shadow-xs ring-1 ring-primary ring-inset outline-hidden focus:ring-2 focus:ring-brand"
                    />
                  </label>
                  <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs font-medium text-tertiary">
                    Hasta
                    <input
                      type="date"
                      value={borradorHasta}
                      min={borradorDesde || undefined}
                      onChange={(event) => setBorradorHasta(event.target.value)}
                      className="w-full rounded-lg bg-primary px-3 py-2 text-base text-primary shadow-xs ring-1 ring-primary ring-inset outline-hidden focus:ring-2 focus:ring-brand"
                    />
                  </label>
                </div>
                {borradorInvalido && (
                  <p className="text-xs text-error-primary">
                    La fecha inicial no puede ser mayor que la final.
                  </p>
                )}
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                  <Button
                    size="sm"
                    variant="ghost"
                    onPress={() => {
                      setBorradorDesde(desde)
                      setBorradorHasta(hasta)
                      setRangoAbierto(false)
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    isDisabled={borradorInvalido}
                    onPress={() => aplicarRango(borradorDesde, borradorHasta)}
                  >
                    Aplicar rango
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {pestana === 'RESUMEN' && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {tarjetas.map((tarjeta) => (
                <article
                  key={tarjeta.titulo}
                  className="flex flex-col gap-4 rounded-xl bg-primary p-5 shadow-xs ring-1 ring-secondary ring-inset"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-tertiary">{tarjeta.titulo}</p>
                    <span
                      className={cn(
                        'inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-tertiary',
                        tarjeta.color,
                      )}
                    >
                      <Icon name={tarjeta.icono} className="size-4" />
                    </span>
                  </div>
                  <p className="text-display-xs font-semibold text-primary tabular-nums">
                    {tarjeta.valor}
                  </p>
                  <p className="text-sm text-tertiary">{tarjeta.detalle}</p>
                </article>
              ))}
            </div>

            <div className="bg-primary shadow-xs ring-1 ring-secondary -mx-4 rounded-none ring-inset lg:mx-0 lg:rounded-xl">
              <div className="flex flex-col gap-1 border-b border-secondary px-4 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-6">
                <div>
                  <h2 className="text-md font-semibold text-primary">Evolución diaria</h2>
                  <p className="text-sm text-tertiary">Total neto en PEN por fecha.</p>
                </div>
                <span className="text-sm text-tertiary tabular-nums">
                  {puntosGrafico.length} días con ventas
                </span>
              </div>
              <div className="px-4 py-5 lg:px-6">
                <GraficoArea
                  puntos={puntosGrafico}
                  altura={180}
                  rejilla
                  className="text-brand-solid"
                />
                <div className="mt-3 flex justify-between gap-3 text-xs text-tertiary tabular-nums">
                  <span>{puntosGrafico[0]?.etiqueta ?? '—'}</span>
                  <span>{puntosGrafico[puntosGrafico.length - 1]?.etiqueta ?? '—'}</span>
                </div>
              </div>
            </div>

            <div className="bg-primary shadow-xs ring-1 ring-secondary -mx-4 rounded-none ring-inset lg:mx-0 lg:rounded-xl">
              <div className="border-b border-secondary px-4 py-4 lg:px-6">
                <h2 className="text-md font-semibold text-primary">Por tipo de comprobante</h2>
                <p className="text-sm text-tertiary">Incluye las notas que afectan el neto.</p>
              </div>
              <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4 lg:p-6">
                {(data?.porTipo ?? []).map((fila) => (
                  <div
                    key={fila.tipo}
                    className="min-w-0 rounded-lg bg-secondary p-3 ring-1 ring-tertiary ring-inset"
                  >
                    <p className="truncate text-xs text-tertiary">{ETIQUETAS_TIPO[fila.tipo]}</p>
                    <p className="mt-1 text-sm font-semibold text-primary tabular-nums">
                      {soles(fila.totalPEN)}
                    </p>
                    <p className="text-xs text-tertiary">{fila.comprobantes} comprobantes</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {pestana === 'DETALLE' && (
          <TablaUntitled
            key="detalle"
            titulo="Detalle de ventas"
            etiqueta="Detalle del reporte de ventas"
            filas={detalleFilas}
            columnas={columnasDetalle}
            rowKey={(fila) => fila.id}
            cargando={loading}
            vacioTitulo="Sin ventas en el rango"
            vacioDescripcion="Prueba con otras fechas o registra un comprobante."
            renderTarjeta={(fila) => (
              <div className="flex flex-col gap-3 rounded-xl bg-primary p-4 shadow-xs ring-1 ring-secondary ring-inset">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-primary">
                      {ETIQUETAS_TIPO[fila.tipo]} {numeroComprobante(fila.serie, fila.numero)}
                    </p>
                    <p className="truncate text-sm text-tertiary">{fila.cliente}</p>
                    <p className="text-xs text-tertiary">{fechaCorta(fila.fecha)}</p>
                  </div>
                  <EstadoBadge estado={fila.estado} />
                </div>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div>
                    <dt className="text-xs text-tertiary">Total PEN</dt>
                    <dd
                      className={cn(
                        'font-medium tabular-nums',
                        fila.signo === -1 ? 'text-error-primary' : 'text-primary',
                      )}
                    >
                      {fila.signo === -1 ? '−' : ''}
                      {soles(fila.totalPEN)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-tertiary">Documento</dt>
                    <dd className="text-primary">{fila.clienteDocumento}</dd>
                  </div>
                </dl>
                <Button
                  size="sm"
                  variant="outline"
                  fullWidth
                  onPress={() => navigate(`/comprobantes/${fila.id}`)}
                  startIcon={<Icon name="eye" className="size-4" />}
                >
                  Ver ticket
                </Button>
              </div>
            )}
          />
        )}

        {pestana === 'DIA' && (
          <TablaUntitled
            key="dia"
            titulo="Ventas por día"
            etiqueta="Ventas del reporte agrupadas por día"
            filas={diaFilas}
            columnas={columnasDia}
            rowKey={(fila) => fila.fecha}
            cargando={loading}
            vacioTitulo="Sin días con ventas"
            vacioDescripcion="Prueba con otro rango de fechas."
            renderTarjeta={(fila) => (
              <div className="flex flex-col gap-3 rounded-xl bg-primary p-4 shadow-xs ring-1 ring-secondary ring-inset">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-primary">{fechaCorta(fila.fecha)}</p>
                  <span className="text-xs text-tertiary tabular-nums">
                    {fila.comprobantes} comprobantes
                  </span>
                </div>
                <p className="text-lg font-semibold text-primary tabular-nums">
                  {soles(fila.totalPEN)}
                </p>
              </div>
            )}
          />
        )}

        {pestana === 'PRODUCTO' && (
          <TablaUntitled
            key="producto"
            titulo="Ventas por producto"
            etiqueta="Ventas del reporte agrupadas por producto"
            filas={productoFilas}
            columnas={columnasProducto}
            rowKey={(fila) => fila.descripcion}
            cargando={loading}
            vacioTitulo="Sin productos en el rango"
            vacioDescripcion="Prueba con otro rango de fechas."
            renderTarjeta={(fila) => (
              <div className="flex flex-col gap-3 rounded-xl bg-primary p-4 shadow-xs ring-1 ring-secondary ring-inset">
                <div className="flex items-start gap-3">
                  <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-tertiary text-xs font-semibold text-quaternary ring-1 ring-secondary ring-inset">
                    {iniciales(fila.descripcion)}
                  </span>
                  <p className="min-w-0 break-words text-sm font-semibold text-primary">
                    {fila.descripcion}
                  </p>
                </div>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div>
                    <dt className="text-xs text-tertiary">Cantidad</dt>
                    <dd className="text-primary tabular-nums">{fila.cantidad}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-tertiary">Total PEN</dt>
                    <dd className="font-medium text-primary tabular-nums">
                      {soles(fila.totalPEN)}
                    </dd>
                  </div>
                </dl>
              </div>
            )}
          />
        )}
      </div>
    </div>
  )
}
