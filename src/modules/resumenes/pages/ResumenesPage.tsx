import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAsyncData } from '@/shared/hooks/useAsyncData'
import { descargarTabla, type FormatoExport } from '@/shared/services/exportacionesService'
import { cn } from '@/shared/utils/cn'
import { fechaISO } from '@/shared/utils/fechas'
import { fechaCorta, soles } from '@/shared/utils/format'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { Icon } from '@/shared/ui/icons'
import { ResumenesSkeleton } from '@/shared/ui/ListadoSkeleton'
import { Select } from '@/shared/ui/Select'
import { TablePagination } from '@/shared/ui/DataTable'
import type { EstadoResumenSunat, ResumenSunat, TipoResumenSunat } from '@/shared/types'
import { EstadoResumenBadge, ETIQUETAS_ESTADO, ETIQUETAS_TIPO } from '../components/resumenUi'
import { resumenesService } from '../service/resumenesService'

type Pestana = TipoResumenSunat
type ClaveOrden = 'documento' | 'fecha' | 'total' | 'estado'

interface Orden {
  clave: ClaveOrden
  direccion: 'asc' | 'desc'
}

const PESTANAS: { clave: Pestana; etiqueta: string }[] = [
  { clave: 'RESUMEN_DIARIO', etiqueta: 'Resumen diario' },
  { clave: 'COMUNICACION_BAJA', etiqueta: 'Comunicaciones de baja' },
]

const ESTADOS: EstadoResumenSunat[] = ['GENERADO', 'PENDIENTE', 'ACEPTADO', 'RECHAZADO']

const totalResumen = (resumen: ResumenSunat) =>
  resumen.items.reduce((suma, item) => suma + item.total, 0)

function valorOrden(resumen: ResumenSunat, clave: ClaveOrden): string {
  switch (clave) {
    case 'documento':
      return resumen.numeroCompleto
    case 'fecha':
      return `${resumen.fecha}`
    case 'total':
      return String(totalResumen(resumen))
    case 'estado':
      return ETIQUETAS_ESTADO[resumen.estado]
  }
}

export function ResumenesPage() {
  const navigate = useNavigate()
  const { data, error, loading, reload } = useAsyncData(resumenesService.listar, [])
  const { data: configuracion, loading: cargandoConfig } = useAsyncData(
    resumenesService.configuracion,
    [],
  )
  const [busqueda, setBusqueda] = useState('')
  const [pestana, setPestana] = useState<Pestana>('RESUMEN_DIARIO')
  const [estado, setEstado] = useState<EstadoResumenSunat | 'TODOS'>('TODOS')
  const [orden, setOrden] = useState<Orden>({ clave: 'fecha', direccion: 'desc' })
  const [pagina, setPagina] = useState(0)
  const [tamano, setTamano] = useState(10)
  const [filtrosAbierto, setFiltrosAbierto] = useState(false)
  const [accionId, setAccionId] = useState<string | null>(null)
  const [errorAccion, setErrorAccion] = useState<string | null>(null)
  const [exportando, setExportando] = useState<FormatoExport | null>(null)
  const [errorExportar, setErrorExportar] = useState<string | null>(null)
  const filtrosRef = useRef<HTMLDivElement>(null)

  const envioReal = configuracion?.envioReal ?? false

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
      .filter((resumen) => {
        if (resumen.tipo !== pestana) return false
        if (estado !== 'TODOS' && resumen.estado !== estado) return false
        return (
          !texto ||
          resumen.numeroCompleto.toLowerCase().includes(texto) ||
          (resumen.codigoRespuesta ?? '').toLowerCase().includes(texto) ||
          (resumen.observacion ?? '').toLowerCase().includes(texto) ||
          resumen.items.some((item) => item.numeroCompleto.toLowerCase().includes(texto))
        )
      })
      .sort((a, b) => {
        const comparacion = valorOrden(a, orden.clave).localeCompare(valorOrden(b, orden.clave), 'es', {
          numeric: true,
        })
        return orden.direccion === 'asc' ? comparacion : -comparacion
      })
  }, [data, busqueda, pestana, estado, orden])

  const paginas = Math.ceil(filas.length / tamano)
  const paginaActual = Math.min(pagina, Math.max(0, paginas - 1))
  const visibles = filas.slice(paginaActual * tamano, (paginaActual + 1) * tamano)
  const hayFiltros = Boolean(busqueda.trim() || estado !== 'TODOS')
  const pestanaActual = PESTANAS.find((opcion) => opcion.clave === pestana)?.etiqueta ?? 'Resumen diario'

  function limpiarFiltros() {
    setBusqueda('')
    setEstado('TODOS')
    setPagina(0)
    setFiltrosAbierto(false)
  }

  function alternarOrden(clave: ClaveOrden) {
    setOrden((actual) =>
      actual.clave === clave
        ? { clave, direccion: actual.direccion === 'asc' ? 'desc' : 'asc' }
        : { clave, direccion: clave === 'fecha' ? 'desc' : 'asc' },
    )
    setPagina(0)
  }

  function encabezadoOrden(clave: ClaveOrden, etiqueta: string, derecha = false) {
    const activo = orden.clave === clave
    return (
      <button
        type="button"
        onClick={() => alternarOrden(clave)}
        aria-label={`Ordenar por ${etiqueta} ${
          activo && orden.direccion === 'asc' ? 'descendente' : 'ascendente'
        }`}
        className={cn('flex cursor-pointer items-center gap-1', derecha && 'ms-auto')}
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
      const totales = filas.reduce(
        (acumulado, resumen) => ({
          subtotal: acumulado.subtotal + resumen.items.reduce((suma, item) => suma + item.subtotal, 0),
          igv: acumulado.igv + resumen.items.reduce((suma, item) => suma + item.igv, 0),
          total: acumulado.total + totalResumen(resumen),
        }),
        { subtotal: 0, igv: 0, total: 0 },
      )
      await descargarTabla(
        {
          titulo: pestanaActual,
          nombreArchivo: pestana === 'COMUNICACION_BAJA' ? 'bajas' : 'resumenes',
          columnas: [
            { titulo: 'Resumen', ancho: 120 },
            { titulo: 'Fecha', ancho: 75 },
            { titulo: 'Tipo', ancho: 135 },
            { titulo: 'Estado', ancho: 100 },
            { titulo: 'Ítems', ancho: 55, alineacion: 'derecha' },
            { titulo: 'Subtotal', ancho: 85, alineacion: 'derecha' },
            { titulo: 'IGV', ancho: 75, alineacion: 'derecha' },
            { titulo: 'Total', ancho: 90, alineacion: 'derecha' },
            { titulo: 'Código SUNAT', ancho: 115 },
            { titulo: 'Ticket', ancho: 105 },
            { titulo: 'Observación', ancho: 200 },
          ],
          filas: [
            ...filas.map((row) => [
              row.numeroCompleto,
              fechaISO(row.fecha),
              ETIQUETAS_TIPO[row.tipo],
              ETIQUETAS_ESTADO[row.estado],
              row.items.length,
              Number(
                row.items.reduce((suma, item) => suma + item.subtotal, 0).toFixed(2),
              ),
              Number(row.items.reduce((suma, item) => suma + item.igv, 0).toFixed(2)),
              Number(totalResumen(row).toFixed(2)),
              row.codigoRespuesta,
              row.sunatTicket,
              row.observacion,
            ]),
            ...(filas.length
              ? [
                  [
                    'TOTAL',
                    null,
                    null,
                    null,
                    filas.reduce((suma, row) => suma + row.items.length, 0),
                    Number(totales.subtotal.toFixed(2)),
                    Number(totales.igv.toFixed(2)),
                    Number(totales.total.toFixed(2)),
                    null,
                    null,
                    null,
                  ],
                ]
              : []),
          ],
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

  async function ejecutarAccion(resumen: ResumenSunat) {
    setAccionId(resumen.id)
    setErrorAccion(null)
    try {
      if (envioReal && resumen.sunatTicket && !resumen.archivoCdrKey) {
        await resumenesService.consultarEstado(resumen.id)
      } else {
        await resumenesService.reenviar(resumen.id)
      }
      reload()
    } catch (err) {
      setErrorAccion(err instanceof Error ? err.message : 'No se pudo actualizar el resumen.')
    } finally {
      setAccionId(null)
    }
  }

  if (loading || cargandoConfig) return <ResumenesSkeleton />

  return (
    <div className="flex flex-col">
      <div className="mb-8 flex w-full flex-col gap-5 px-4 lg:px-8">
        {(error || errorExportar) && (
          <Alert tone="error" title={errorExportar ? 'No se pudo exportar' : 'No se pudieron cargar los resúmenes'}>
            {errorExportar ?? error?.message}
          </Alert>
        )}
        {errorAccion && <Alert tone="error">{errorAccion}</Alert>}

        <div className="relative flex flex-col gap-5 bg-primary">
          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="flex flex-1 flex-col gap-0.5">
              <p className="text-xl font-semibold text-primary">Resúmenes y bajas</p>
              <p className="text-md text-tertiary">
                {envioReal
                  ? `Resumen diario y comunicaciones de baja enviados a SUNAT en modo ${configuracion?.modo === 'produccion' ? 'producción' : 'beta'}.`
                  : 'Resumen diario y comunicaciones de baja registrados localmente, sin envío a SUNAT.'}
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
                onPress={() => navigate('/resumenes/nuevo')}
                startIcon={<Icon name="plus" className="size-4" />}
              >
                Nuevo resumen
              </Button>
            </div>
          </div>
        </div>

        <div className="flex w-full flex-col" data-orientation="horizontal">
          <div
            role="tablist"
            aria-label="Filtrar resúmenes por tipo"
            className="group relative flex flex-wrap gap-x-3 gap-y-2 border-b border-border-secondary pb-2.5"
            data-orientation="horizontal"
          >
            {PESTANAS.map((opcion) => {
              const activo = pestana === opcion.clave
              const cantidad = (data ?? []).filter(
                (resumen) => resumen.tipo === opcion.clave,
              ).length
              return (
                <button
                  key={opcion.clave}
                  type="button"
                  role="tab"
                  aria-selected={activo}
                  onClick={() => setPestana(opcion.clave)}
                  className={cn(
                    'z-10 flex h-max shrink-0 cursor-pointer items-center justify-center gap-1 rounded-none border-b-2 px-0.5 pt-0 pb-2.5 text-sm font-semibold whitespace-nowrap outline-focus-ring transition duration-100 ease-linear',
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
                placeholder="Buscar por resumen o comprobante"
                aria-label="Buscar resúmenes y bajas"
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
                      ariaLabel="Estado del resumen"
                      value={estado}
                      onChange={(valor) => setEstado(valor as EstadoResumenSunat | 'TODOS')}
                      placeholder="Todos los estados"
                      options={[
                        { value: 'TODOS', label: 'Todos los estados' },
                        ...ESTADOS.map((valor) => ({ value: valor, label: ETIQUETAS_ESTADO[valor] })),
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

        <div className="flex flex-col gap-5 border-none pb-0 lg:hidden">
          <div className="relative flex flex-col items-start gap-4 md:flex-row">
            <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 self-stretch">
              <h2 className="text-md font-semibold text-primary">{pestanaActual}</h2>
              <p className="text-sm text-tertiary">
                {filas.length} de {data?.length ?? 0} registros
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
                <span className="size-max flex items-center gap-1 rounded-md bg-primary px-1.5 py-0.5 text-xs font-medium text-secondary shadow-xs ring-1 ring-primary ring-inset">
                  {filas.length} registros
                </span>
              </div>
            </div>
          </div>

          <div className="hidden lg:block">
            <table className="w-full overflow-x-hidden" aria-label="Resúmenes y comunicaciones de baja">
              <thead className="relative h-11 bg-secondary [&>tr>th]:after:pointer-events-none [&>tr>th]:after:absolute [&>tr>th]:after:inset-x-0 [&>tr>th]:after:bottom-0 [&>tr>th]:after:h-px [&>tr>th]:after:bg-border-secondary [&>tr>th]:focus-visible:after:bg-transparent">
                <tr>
                  <th scope="col" className="relative w-full p-0 px-6 py-2 nth-2:pl-3">
                    <div className="flex items-center">{encabezadoOrden('documento', 'Documento')}</div>
                  </th>
                  <th scope="col" className="relative p-0 px-6 py-2 nth-2:pl-3">
                    <div className="flex items-center">{encabezadoOrden('fecha', 'Fecha')}</div>
                  </th>
                  <th scope="col" className="relative p-0 px-6 py-2 text-right nth-2:pl-3">
                    <div className="flex justify-end">
                      <span className="text-sm font-medium text-quaternary">Comprobantes</span>
                    </div>
                  </th>
                  <th scope="col" className="relative p-0 px-6 py-2 text-right nth-2:pl-3">
                    <div className="flex justify-end">{encabezadoOrden('total', 'Total', true)}</div>
                  </th>
                  <th scope="col" className="relative p-0 px-6 py-2 nth-2:pl-3">
                    <div className="flex items-center">{encabezadoOrden('estado', 'Estado')}</div>
                  </th>
                  <th scope="col" className="relative p-0 px-4 py-2 nth-2:pl-3">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibles.length === 0 ? (
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
                        <p className="text-sm font-medium text-primary">{row.numeroCompleto}</p>
                        <p className="text-sm text-tertiary">{ETIQUETAS_TIPO[row.tipo]}</p>
                      </td>
                      <td className="relative px-6 py-4 text-sm text-tertiary nth-2:pl-3">
                        {fechaCorta(`${row.fecha}`)}
                      </td>
                      <td className="relative px-6 py-4 text-right text-sm text-secondary tabular-nums nth-2:pl-3">
                        {row.items.length}
                      </td>
                      <td className="relative px-6 py-4 text-right text-sm font-semibold text-primary tabular-nums nth-2:pl-3">
                        {soles(totalResumen(row))}
                      </td>
                      <td className="relative px-6 py-4 nth-2:pl-3">
                        <EstadoResumenBadge
                          estado={row.estado}
                          codigo={row.codigoRespuesta}
                          sinCdr={Boolean(envioReal && row.sunatTicket && !row.archivoCdrKey)}
                        />
                      </td>
                      <td className="relative py-4 px-4 nth-2:pl-3">
                        <div className="flex justify-end gap-0.5">
                          <Button
                            size="xs"
                            variant="ghost"
                            aria-label={`Ver detalles de ${row.numeroCompleto}`}
                            onPress={() => navigate(`/resumenes/${row.id}`)}
                            startIcon={<Icon name="eye" className="size-4" />}
                          />
                          <Button
                            size="xs"
                            variant="ghost"
                            aria-label={
                              envioReal && row.sunatTicket && !row.archivoCdrKey
                                ? `Actualizar estado de ${row.numeroCompleto}`
                                : `Reenviar ${row.numeroCompleto}`
                            }
                            isLoading={accionId === row.id}
                            onPress={() => void ejecutarAccion(row)}
                            startIcon={<Icon name="refresh" className="size-4" />}
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
            {visibles.length === 0 ? (
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
                      <p className="truncate text-sm font-semibold text-primary">{row.numeroCompleto}</p>
                      <p className="text-sm text-tertiary">{fechaCorta(`${row.fecha}`)}</p>
                    </div>
                    <EstadoResumenBadge
                      estado={row.estado}
                      codigo={row.codigoRespuesta}
                      sinCdr={Boolean(envioReal && row.sunatTicket && !row.archivoCdrKey)}
                    />
                  </div>
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
                    <div>
                      <dt className="text-xs text-tertiary">Tipo</dt>
                      <dd className="text-primary">{ETIQUETAS_TIPO[row.tipo]}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-tertiary">Comprobantes</dt>
                      <dd className="text-primary tabular-nums">{row.items.length}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-tertiary">Total</dt>
                      <dd className="font-medium text-primary tabular-nums">{soles(totalResumen(row))}</dd>
                    </div>
                  </dl>
                  <div className="flex flex-col-reverse gap-2 sm:flex-row">
                    <Button
                      size="sm"
                      variant="outline"
                      fullWidth
                      onPress={() => void ejecutarAccion(row)}
                      isLoading={accionId === row.id}
                      startIcon={<Icon name="refresh" className="size-4" />}
                    >
                      {envioReal && row.sunatTicket && !row.archivoCdrKey
                        ? 'Actualizar estado'
                        : 'Reenviar'}
                    </Button>
                    <Button
                      size="sm"
                      fullWidth
                      onPress={() => navigate(`/resumenes/${row.id}`)}
                      startIcon={<Icon name="eye" className="size-4" />}
                    >
                      Ver detalle
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
