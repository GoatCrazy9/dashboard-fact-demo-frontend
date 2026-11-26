import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useAsyncData } from '@/shared/hooks/useAsyncData'
import { fechaCorta, numeroComprobante, soles } from '@/shared/utils/format'
import { cn } from '@/shared/utils/cn'
import { Alert } from '@/shared/ui/Alert'
import { AvatarPerfil } from '@/shared/ui/AvatarPerfil'
import { Button } from '@/shared/ui/Button'
import { TablePagination } from '@/shared/ui/DataTable'
import { Icon } from '@/shared/ui/icons'
import { EstadoBadge, ETIQUETAS_TIPO } from '@/modules/comprobantes/components/comprobanteUi'
import type { ComprobanteResumen, TipoComprobante } from '@/shared/types'
import { GraficoArea, type PuntoVenta } from '../components/GraficoArea'
import { MetricCard, type Tendencia } from '../components/MetricCard'
import { PanelInsights } from '../components/PanelInsights'
import { RelojEnVivo } from '../components/RelojEnVivo'
import { PanelSkeleton } from '../components/PanelSkeleton'
import { panelService } from '../service/panelService'

type Periodo = 'personalizado' | '12meses' | '30dias' | '7dias' | '24horas'
type FiltroTipo = 'TODOS' | Extract<TipoComprobante, 'FACTURA' | 'BOLETA'>

const PERIODOS: { clave: Periodo; etiqueta: string; corta: string }[] = [
  { clave: 'personalizado', etiqueta: 'Personalizado', corta: 'Rango' },
  { clave: '12meses', etiqueta: '12 meses', corta: '12m' },
  { clave: '30dias', etiqueta: '30 días', corta: '30d' },
  { clave: '7dias', etiqueta: '7 días', corta: '7d' },
  { clave: '24horas', etiqueta: '24 horas', corta: '24h' },
]

const FILTROS_TIPO: { clave: FiltroTipo; etiqueta: string }[] = [
  { clave: 'TODOS', etiqueta: 'Todos' },
  { clave: 'FACTURA', etiqueta: 'Facturas' },
  { clave: 'BOLETA', etiqueta: 'Boletas' },
]

type ClaveOrdenUltimos = 'comprobante' | 'cliente' | 'total' | 'fecha' | 'estado'

interface OrdenUltimos {
  clave: ClaveOrdenUltimos
  direccion: 'asc' | 'desc'
}

const dinero = (valor: number, moneda: string) =>
  new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: moneda === 'USD' ? 'USD' : 'PEN',
  }).format(valor)

function valorOrdenUltimos(row: ComprobanteResumen, clave: ClaveOrdenUltimos): string | number {
  switch (clave) {
    case 'comprobante':
      return `${row.serie}-${String(row.numero).padStart(8, '0')}`
    case 'cliente':
      return row.cliente
    case 'total':
      return row.total
    case 'fecha':
      return row.fecha
    case 'estado':
      return row.estado
  }
}

function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).slice(0, 2)
  return partes.map((parte) => parte[0]?.toUpperCase() ?? '').join('') || 'MJ'
}

function suma(valores: number[]): number {
  return valores.reduce((total, valor) => total + valor, 0)
}

function calcularTendencia(actual: number[], anterior: number[]): Tendencia | null {
  if (!actual.length || !anterior.length) return null
  const totalActual = suma(actual)
  const totalAnterior = suma(anterior)
  if (totalAnterior <= 0) return null
  const delta = ((totalActual - totalAnterior) / totalAnterior) * 100
  if (!Number.isFinite(delta)) return null
  return { positiva: delta >= 0, valor: Math.abs(delta) }
}

function tickets(puntos: PuntoVenta[]): number[] {
  return puntos.map((punto) => (punto.cantidad ? punto.total / punto.cantidad : 0))
}

function puntoDia(punto: { fecha: string; total: number; cantidad: number }): PuntoVenta {
  return { etiqueta: fechaCorta(punto.fecha), total: punto.total, cantidad: punto.cantidad }
}

function puntoHora(punto: { hora: string; total: number; cantidad: number }): PuntoVenta {
  return { etiqueta: punto.hora, total: punto.total, cantidad: punto.cantidad }
}

function EtiquetaTendencia({ tendencia }: { tendencia: Tendencia }) {
  return (
    <span
      className={cn(
        'flex items-center gap-0.5 text-sm font-medium',
        tendencia.positiva ? 'text-success-primary' : 'text-error-primary',
      )}
    >
      <Icon
        name={tendencia.positiva ? 'arrow-up' : 'arrow-down'}
        className="size-4 stroke-[3px]"
      />
      {tendencia.valor.toFixed(1)}%
    </span>
  )
}

export function PanelPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data, error, loading } = useAsyncData(panelService.resumen, [])
  const [periodo, setPeriodo] = useState<Periodo>('30dias')
  const [busqueda, setBusqueda] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>('TODOS')
  const [ordenUltimos, setOrdenUltimos] = useState<OrdenUltimos>({
    clave: 'fecha',
    direccion: 'desc',
  })
  const [paginaUltimos, setPaginaUltimos] = useState(0)
  const [tamanoUltimos, setTamanoUltimos] = useState(5)
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [rangoAbierto, setRangoAbierto] = useState(false)
  const rangoRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!data) return
    const dias = data.ventasPorDia
    setDesde((actual) => actual || dias[0]?.fecha || '')
    setHasta((actual) => actual || dias[dias.length - 1]?.fecha || '')
  }, [data])

  useEffect(() => {
    setPaginaUltimos(0)
  }, [busqueda, filtroTipo, ordenUltimos])

  useEffect(() => {
    if (!rangoAbierto) return
    function handleClickOutside(event: MouseEvent) {
      if (!rangoRef.current?.contains(event.target as Node)) setRangoAbierto(false)
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setRangoAbierto(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [rangoAbierto])

  const serie = useMemo<PuntoVenta[]>(() => {
    if (!data) return []
    switch (periodo) {
      case '12meses':
        return data.ventasPorMes.map((punto) => ({
          etiqueta: punto.mes,
          total: punto.total,
          cantidad: punto.cantidad,
        }))
      case '30dias':
        return data.ventasPorDia.map(puntoDia)
      case '7dias':
        return data.ventasPorDia.slice(-7).map(puntoDia)
      case '24horas':
        return data.ventasPorHora.map(puntoHora)
      case 'personalizado': {
        const inicio = desde || data.ventasPorDia[0]?.fecha
        const fin = hasta || data.ventasPorDia[data.ventasPorDia.length - 1]?.fecha
        return data.ventasPorDia
          .filter((punto) => (!inicio || punto.fecha >= inicio) && (!fin || punto.fecha <= fin))
          .map(puntoDia)
      }
    }
  }, [data, periodo, desde, hasta])

  const serieAnterior = useMemo<PuntoVenta[]>(() => {
    if (!data || periodo !== '7dias') return []
    return data.ventasPorDia.slice(-14, -7).map(puntoDia)
  }, [data, periodo])

  const { puntosActuales, puntosAnteriores } = useMemo(() => {
    const mitad = Math.floor(serie.length / 2)
    const usaSemanaAnterior = periodo === '7dias' && serieAnterior.length > 0
    return {
      puntosActuales: usaSemanaAnterior ? serie : serie.slice(mitad),
      puntosAnteriores: serieAnterior.length
        ? serieAnterior
        : serie.length >= 4
          ? serie.slice(0, mitad)
          : [],
    }
  }, [serie, serieAnterior, periodo])

  const totalPeriodo = suma(serie.map((punto) => punto.total))
  const comprobantesPeriodo = suma(serie.map((punto) => punto.cantidad))
  const ticketPeriodo = comprobantesPeriodo
    ? Math.round((totalPeriodo / comprobantesPeriodo) * 100) / 100
    : 0

  const conTendencia = periodo !== 'personalizado'
  const tendenciaVentas = conTendencia
    ? calcularTendencia(
        puntosActuales.map((punto) => punto.total),
        puntosAnteriores.map((punto) => punto.total),
      )
    : null
  const tendenciaComprobantes = conTendencia
    ? calcularTendencia(
        puntosActuales.map((punto) => punto.cantidad),
        puntosAnteriores.map((punto) => punto.cantidad),
      )
    : null
  const tendenciaTicket = conTendencia
    ? calcularTendencia(tickets(puntosActuales), tickets(puntosAnteriores))
    : null

  const rangoTexto = serie.length
    ? `${serie[0].etiqueta} – ${serie[serie.length - 1].etiqueta}`
    : '—'
  const cargando = loading && !data

  const tarjetas = [
    {
      titulo: 'Ventas',
      valor: soles(totalPeriodo),
      detalle: 'Total facturado en el período',
      puntos: serie,
      tendencia: tendenciaVentas,
      acciones: [
        { etiqueta: 'Ir a ventas', onAction: () => navigate('/ventas') },
        { etiqueta: 'Ver comprobantes', onAction: () => navigate('/comprobantes') },
      ],
    },
    {
      titulo: 'Comprobantes',
      valor: String(comprobantesPeriodo),
      detalle: 'Emitidos y aceptados por SUNAT',
      puntos: serie.map((punto) => ({ ...punto, total: punto.cantidad })),
      tendencia: tendenciaComprobantes,
      acciones: [
        { etiqueta: 'Ver comprobantes', onAction: () => navigate('/comprobantes') },
        { etiqueta: 'Ver reportes', onAction: () => navigate('/reportes') },
      ],
    },
    {
      titulo: 'Ticket promedio',
      valor: soles(ticketPeriodo),
      detalle: 'Promedio por comprobante',
      puntos: serie.map((punto, indice) => ({
        ...punto,
        total: tickets(serie)[indice] ?? 0,
      })),
      tendencia: tendenciaTicket,
      acciones: [{ etiqueta: 'Ver reportes', onAction: () => navigate('/reportes') }],
    },
  ]

  const ultimosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    return (data?.ultimos ?? [])
      .filter((fila) => {
        const tipoOk = filtroTipo === 'TODOS' || fila.tipo === filtroTipo
        const textoOk =
          !texto ||
          numeroComprobante(fila.serie, fila.numero).toLowerCase().includes(texto) ||
          fila.cliente.toLowerCase().includes(texto) ||
          fila.clienteDocumento.toLowerCase().includes(texto)
        return tipoOk && textoOk
      })
      .sort((a, b) => {
        const izquierda = valorOrdenUltimos(a, ordenUltimos.clave)
        const derecha = valorOrdenUltimos(b, ordenUltimos.clave)
        const comparacion =
          typeof izquierda === 'number' && typeof derecha === 'number'
            ? izquierda - derecha
            : String(izquierda).localeCompare(String(derecha), 'es', { numeric: true })
        return ordenUltimos.direccion === 'asc' ? comparacion : -comparacion
      })
  }, [data, filtroTipo, busqueda, ordenUltimos])

  const paginasUltimos = Math.ceil(ultimosFiltrados.length / tamanoUltimos)
  const paginaActualUltimos = Math.min(paginaUltimos, Math.max(0, paginasUltimos - 1))
  const visiblesUltimos = ultimosFiltrados.slice(
    paginaActualUltimos * tamanoUltimos,
    (paginaActualUltimos + 1) * tamanoUltimos,
  )

  function alternarOrdenUltimos(clave: ClaveOrdenUltimos) {
    setOrdenUltimos((actual) =>
      actual.clave === clave
        ? { clave, direccion: actual.direccion === 'asc' ? 'desc' : 'asc' }
        : { clave, direccion: clave === 'fecha' ? 'desc' : 'asc' },
    )
  }

  function encabezadoOrdenUltimos(clave: ClaveOrdenUltimos, etiqueta: string) {
    const activo = ordenUltimos.clave === clave
    return (
      <button
        type="button"
        onClick={() => alternarOrdenUltimos(clave)}
        className="flex cursor-pointer items-center gap-1"
        aria-label={`Ordenar por ${etiqueta} ${
          activo && ordenUltimos.direccion === 'asc' ? 'descendente' : 'ascendente'
        }`}
      >
        {etiqueta}
        <Icon
          name={activo ? (ordenUltimos.direccion === 'asc' ? 'arrow-up' : 'arrow-down') : 'chevron-down'}
          className={cn('size-3 stroke-[3px]', activo ? 'text-fg-quaternary' : 'text-fg-quaternary/50')}
        />
      </button>
    )
  }

  const filtrosTipoTabs = (
    <div
      role="tablist"
      aria-label="Filtrar comprobantes"
      className="flex flex-wrap gap-0.5 rounded-lg bg-secondary_alt p-0.5 ring-1 ring-inset ring-secondary"
    >
      {FILTROS_TIPO.map((opcion) => {
        const activo = filtroTipo === opcion.clave
        return (
          <button
            key={opcion.clave}
            type="button"
            role="tab"
            aria-selected={activo}
            onClick={() => setFiltroTipo(opcion.clave)}
            className={cn(
              'z-10 flex h-max cursor-pointer items-center justify-center rounded-lg px-2.5 py-2 text-sm font-semibold whitespace-nowrap outline-focus-ring transition duration-100 ease-linear focus-visible:outline-2 focus-visible:outline-offset-2',
              activo
                ? 'bg-primary_alt text-secondary shadow-xs ring-1 ring-primary ring-inset'
                : 'text-quaternary hover:text-secondary',
            )}
          >
            {opcion.etiqueta}
          </button>
        )
      })}
    </div>
  )

  const pasoMovil = Math.max(1, Math.ceil(serie.length / 6))
  const pasoEscritorio = Math.max(1, Math.ceil(serie.length / 12))

  if (cargando) {
    return <PanelSkeleton />
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-5 px-4 lg:px-8">
        {error && (
          <Alert tone="error" title="No se pudo cargar el panel">
            {error.message}. Verifica que la API esté corriendo en el puerto 3001.
          </Alert>
        )}

        <div className="relative flex flex-col gap-4 bg-primary">
          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="flex flex-1 items-center gap-3">
              <AvatarPerfil
                nombre={user?.usuario ?? user?.nombre ?? 'Mueblería José'}
                etiqueta={`Perfil de ${user?.nombre ?? 'Mueblería José'}`}
                tamano={56}
                enLinea
                className="rounded-full ring-1 ring-secondary_alt"
              />
              <div className="min-w-0">
                <h1 className="truncate text-xl font-semibold text-primary">
                  Bienvenido de nuevo, {user?.nombre?.split(' ')[0] ?? 'Jose'}
                </h1>
                <p className="text-md text-balance text-tertiary">
                  {fechaCorta(new Date().toISOString())}
                  <span aria-hidden="true"> · </span>
                  <RelojEnVivo />
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="group flex h-max w-full flex-col gap-1.5 sm:w-70">
                <div className="group/input relative flex h-12 w-full items-center rounded-lg bg-primary shadow-xs ring-1 ring-primary ring-inset transition-shadow focus-within:ring-2 focus-within:ring-brand sm:h-10">
                  <Icon
                    name="search"
                    className="pointer-events-none absolute start-3 size-4 text-fg-quaternary"
                  />
                  <input
                    type="search"
                    value={busqueda}
                    onChange={(event) => setBusqueda(event.target.value)}
                    placeholder="Buscar comprobante o cliente"
                    aria-label="Buscar comprobante o cliente en el panel"
                    className="m-0 h-full w-full bg-transparent px-3 ps-9 text-base outline-hidden placeholder:text-placeholder sm:text-sm"
                  />
                </div>
              </label>

              <Link
                to="/ventas"
                aria-label="Emitir comprobante"
                className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-lg bg-brand-solid px-3 text-sm font-semibold text-white shadow-xs-skeuomorphic ring-1 ring-primary ring-inset transition-colors hover:bg-brand-solid_hover sm:h-10"
              >
                <Icon name="plus" className="size-4" />
                <span className="hidden sm:inline">Emitir comprobante</span>
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap items-start justify-between gap-3">
            <div
              role="tablist"
              aria-label="Período del panel"
              className="flex flex-wrap gap-0.5 rounded-lg bg-secondary_alt p-0.5 ring-1 ring-inset ring-secondary"
            >
              {PERIODOS.map((opcion) => {
                const activo = periodo === opcion.clave
                return (
                  <button
                    key={opcion.clave}
                    type="button"
                    role="tab"
                    aria-selected={activo}
                    onClick={() => setPeriodo(opcion.clave)}
                    className={cn(
                      'z-10 flex h-max cursor-pointer items-center justify-center rounded-lg px-2.5 py-2 text-sm font-semibold whitespace-nowrap outline-focus-ring transition duration-100 ease-linear focus-visible:outline-2 focus-visible:outline-offset-2',
                      activo
                        ? 'bg-primary_alt text-secondary shadow-xs ring-1 ring-primary ring-inset'
                        : 'text-quaternary hover:text-secondary',
                    )}
                  >
                    <span className="hidden sm:inline">{opcion.etiqueta}</span>
                    <span className="sm:hidden">{opcion.corta}</span>
                  </button>
                )
              })}
            </div>

            <div ref={rangoRef} className="relative flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setRangoAbierto((abierto) => !abierto)}
                aria-expanded={rangoAbierto}
                className="group relative inline-flex h-max cursor-pointer items-center justify-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-secondary shadow-xs-skeuomorphic ring-1 ring-primary ring-inset transition-colors hover:bg-primary_hover hover:text-secondary_hover"
              >
                <Icon name="calendar" className="size-5 shrink-0 text-fg-quaternary" />
                <span className="tabular-nums">{cargando ? 'Cargando…' : rangoTexto}</span>
              </button>

              {rangoAbierto && (
                <div className="absolute end-0 top-full z-20 mt-2 flex w-[min(20rem,calc(100vw-2rem))] flex-col gap-3 rounded-xl bg-primary p-3 shadow-xl ring-1 ring-tertiary ring-inset">
                  <div className="flex flex-col gap-1.5 sm:flex-row">
                    <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs font-medium text-tertiary">
                      Desde
                      <input
                        type="date"
                        value={desde}
                        min={data?.ventasPorDia[0]?.fecha}
                        max={hasta || undefined}
                        onChange={(event) => {
                          setDesde(event.target.value)
                          setPeriodo('personalizado')
                        }}
                        className="w-full rounded-lg bg-primary px-3 py-2 text-base text-primary shadow-xs ring-1 ring-primary ring-inset outline-hidden focus:ring-2 focus:ring-brand"
                      />
                    </label>
                    <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs font-medium text-tertiary">
                      Hasta
                      <input
                        type="date"
                        value={hasta}
                        min={desde || undefined}
                        max={data?.ventasPorDia[data.ventasPorDia.length - 1]?.fecha}
                        onChange={(event) => {
                          setHasta(event.target.value)
                          setPeriodo('personalizado')
                        }}
                        className="w-full rounded-lg bg-primary px-3 py-2 text-base text-primary shadow-xs ring-1 ring-primary ring-inset outline-hidden focus:ring-2 focus:ring-brand"
                      />
                    </label>
                  </div>
                  <p className="text-xs text-tertiary">El rango usa los últimos 30 días registrados.</p>
                  <button
                    type="button"
                    onClick={() => setRangoAbierto(false)}
                    className="rounded-lg bg-brand-solid px-3 py-2 text-sm font-semibold text-white hover:bg-brand-solid_hover"
                  >
                    Aplicar rango
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-8 px-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3 lg:gap-8 lg:px-8">
        {tarjetas.map((tarjeta) => (
          <MetricCard
            key={tarjeta.titulo}
            titulo={tarjeta.titulo}
            valor={cargando ? '—' : tarjeta.valor}
            puntos={cargando ? [] : tarjeta.puntos}
            tendencia={tarjeta.tendencia}
            comparacion="vs período anterior"
            detalle={tarjeta.detalle}
            acciones={tarjeta.acciones}
            ariaLabel={`Evolución de ${tarjeta.titulo.toLowerCase()}`}
          />
        ))}
      </section>

      <section className="px-4 lg:px-8">
        <div className="flex flex-col gap-0.5 rounded-xl bg-secondary shadow-xs ring-1 ring-secondary ring-inset">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-3 pb-2">
            <p className="text-sm font-semibold text-primary">Ventas</p>
            <p className="text-xs text-tertiary">Evolución del período seleccionado</p>
          </div>
          <div className="flex flex-col gap-5 rounded-xl bg-primary p-5 ring-1 ring-secondary ring-inset">
            <div className="flex flex-col items-start gap-4 lg:flex-row">
              <div className="flex flex-1 flex-col gap-3">
                <p className="text-display-sm font-semibold text-primary tabular-nums">
                  {cargando ? '—' : soles(totalPeriodo)}
                </p>
                <div className="flex flex-wrap gap-2">
                  {tendenciaVentas && <EtiquetaTendencia tendencia={tendenciaVentas} />}
                  <p className="text-sm font-medium text-tertiary">vs período anterior</p>
                </div>
              </div>
            </div>
            <div className="flex h-54 flex-col gap-1.5 lg:h-60">
              <GraficoArea
                puntos={cargando ? [] : serie}
                altura={192}
                rejilla
                className="text-fg-success-secondary"
              />
              <ul className="mt-auto flex justify-between px-2 text-xs text-tertiary">
                {serie.map((punto, indice) => {
                  const visibleMovil = indice % pasoMovil === 0 || indice === serie.length - 1
                  const visibleEscritorio =
                    indice % pasoEscritorio === 0 || indice === serie.length - 1
                  const clase = visibleMovil
                    ? visibleEscritorio
                      ? ''
                      : 'max-md:hidden'
                    : visibleEscritorio
                      ? 'hidden md:block'
                      : 'hidden'
                  return (
                    <li key={`${punto.etiqueta}-${indice}`} className={clase}>
                      {punto.etiqueta}
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <PanelInsights resumen={data} />

      <section className="px-4 lg:px-8">
        <div className="bg-primary shadow-xs ring-1 ring-secondary -mx-4 rounded-none ring-inset lg:mx-0 lg:rounded-xl">
          <div className="relative hidden flex-col items-start gap-4 border-b border-secondary bg-primary px-4 py-5 pb-5 md:flex-row md:px-6 lg:flex">
            <div className="flex flex-1 flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <h2 className="text-md font-semibold text-primary">Últimos comprobantes</h2>
                <span className="size-max flex items-center gap-1 rounded-md py-0.5 px-1.5 text-xs font-medium bg-primary text-secondary ring-1 ring-primary shadow-xs ring-inset">
                  {ultimosFiltrados.length} comprobantes
                </span>
              </div>
            </div>
            {filtrosTipoTabs}
          </div>

          <div className="hidden lg:block">
            <table className="w-full overflow-x-hidden" aria-label="Últimos comprobantes">
              <thead className="relative h-11 bg-secondary [&>tr>th]:after:pointer-events-none [&>tr>th]:after:absolute [&>tr>th]:after:inset-x-0 [&>tr>th]:after:bottom-0 [&>tr>th]:after:h-px [&>tr>th]:after:bg-border-secondary [&>tr>th]:focus-visible:after:bg-transparent">
                <tr>
                  <th scope="col" className="relative w-full p-0 px-6 py-2 nth-2:pl-3">
                    <div className="flex items-center">
                      {encabezadoOrdenUltimos('comprobante', 'Comprobante')}
                    </div>
                  </th>
                  <th scope="col" className="relative p-0 px-6 py-2 nth-2:pl-3">
                    <div className="flex items-center">{encabezadoOrdenUltimos('total', 'Importe')}</div>
                  </th>
                  <th scope="col" className="relative p-0 px-6 py-2 nth-2:pl-3">
                    <div className="flex items-center">{encabezadoOrdenUltimos('fecha', 'Fecha')}</div>
                  </th>
                  <th scope="col" className="relative p-0 px-6 py-2 nth-2:pl-3">
                    <div className="flex items-center">
                      {encabezadoOrdenUltimos('estado', 'Estado SUNAT')}
                    </div>
                  </th>
                  <th scope="col" className="relative p-0 px-6 py-2 nth-2:pl-3">
                    <div className="flex items-center">{encabezadoOrdenUltimos('cliente', 'Cliente')}</div>
                  </th>
                  <th scope="col" className="relative p-0 px-6 py-2 nth-2:pl-3">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visiblesUltimos.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <p className="text-sm font-medium text-primary">
                        {busqueda || filtroTipo !== 'TODOS' ? 'Sin coincidencias' : 'Sin comprobantes'}
                      </p>
                      <p className="mt-1 text-sm text-tertiary">
                        Ajusta los filtros o emite un comprobante nuevo.
                      </p>
                    </td>
                  </tr>
                ) : (
                  visiblesUltimos.map((row) => (
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
                      <td className="relative px-6 py-4 text-sm text-tertiary tabular-nums whitespace-nowrap nth-2:pl-3">
                        <span className="font-medium text-primary">
                          {dinero(row.total, row.moneda)}
                        </span>
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
            <div className="flex flex-col items-start gap-3">
              <div className="flex items-center gap-2">
                <h2 className="text-md font-semibold text-primary">Últimos comprobantes</h2>
                <span className="size-max flex items-center gap-1 rounded-md py-0.5 px-1.5 text-xs font-medium bg-primary text-secondary ring-1 ring-primary shadow-xs ring-inset">
                  {ultimosFiltrados.length} comprobantes
                </span>
              </div>
              {filtrosTipoTabs}
            </div>

            {visiblesUltimos.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm font-medium text-primary">
                  {busqueda || filtroTipo !== 'TODOS' ? 'Sin coincidencias' : 'Sin comprobantes'}
                </p>
                <p className="mt-1 text-sm text-tertiary">
                  Ajusta los filtros o emite uno nuevo.
                </p>
              </div>
            ) : (
              visiblesUltimos.map((row) => (
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
              total={ultimosFiltrados.length}
              page={paginaActualUltimos}
              pageCount={paginasUltimos}
              pageSize={tamanoUltimos}
              pageSizeOptions={[5, 10, 20]}
              onPageSizeChange={(cantidad) => {
                setTamanoUltimos(cantidad)
                setPaginaUltimos(0)
              }}
              onPageChange={setPaginaUltimos}
            />
          </div>
        </div>
      </section>
    </div>
  )
}
