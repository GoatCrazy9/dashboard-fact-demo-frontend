import { useEffect, useState } from 'react'
import { useAsyncData } from '@/shared/hooks/useAsyncData'
import { Alert } from '@/shared/ui/Alert'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { Card, CardBody } from '@/shared/ui/Card'
import { DataTable, TablePagination, type Column } from '@/shared/ui/DataTable'
import { Campo, inputClass } from '@/shared/ui/FormSection'
import { Icon } from '@/shared/ui/icons'
import { PageHeader } from '@/shared/ui/PageHeader'
import { AuditoriaSkeleton } from '@/shared/ui/PaginasSkeleton'
import { Select } from '@/shared/ui/Select'
import type { RegistroAuditoria } from '@/shared/types'
import {
  ACCIONES_AUDITORIA,
  MODULOS_AUDITORIA,
  formatearDetalle,
  formatearFechaHora,
  tonoAccion,
  tonoResultado,
} from '../auditoriaUtils'
import { auditoriaService } from '../service/auditoriaService'

function Subtitulo({ children }: { children: string }) {
  return (
    <p className="mb-3 text-xs font-semibold tracking-wide text-quaternary uppercase">
      {children}
    </p>
  )
}

const columnas = (verDetalle: (fila: RegistroAuditoria) => void): Column<RegistroAuditoria>[] => [
  {
    key: 'fecha',
    header: 'Fecha',
    render: (fila) => (
      <span className="whitespace-nowrap tabular-nums">{formatearFechaHora(fila.creadoEn)}</span>
    ),
    sortValue: (fila) => fila.creadoEn,
  },
  {
    key: 'usuario',
    header: 'Usuario',
    render: (fila) => (
      <div>
        <p className="font-medium text-primary">{fila.usuario}</p>
        {fila.nombre && fila.nombre !== fila.usuario && (
          <p className="text-xs text-tertiary">{fila.nombre}</p>
        )}
      </div>
    ),
    sortValue: (fila) => fila.usuario,
  },
  {
    key: 'modulo',
    header: 'Módulo',
    render: (fila) => <span className="text-secondary">{fila.modulo}</span>,
    sortValue: (fila) => fila.modulo,
  },
  {
    key: 'accion',
    header: 'Acción',
    render: (fila) => (
      <Badge tone={tonoAccion(fila.accion)} className="px-2 text-[11px]">
        {fila.accion}
      </Badge>
    ),
    sortValue: (fila) => fila.accion,
  },
  {
    key: 'entidad',
    header: 'Entidad',
    render: (fila) => (
      <div>
        <p className="text-secondary">{fila.entidad}</p>
        {fila.entidadId && <p className="max-w-48 truncate text-xs text-tertiary">{fila.entidadId}</p>}
      </div>
    ),
    sortValue: (fila) => fila.entidad,
  },
  {
    key: 'resultado',
    header: 'Resultado',
    render: (fila) => (
      <Badge tone={tonoResultado(fila.estado)} className="px-2 text-[11px] tabular-nums">
        {fila.estado} {fila.estado >= 200 && fila.estado < 400 ? 'OK' : 'Error'}
      </Badge>
    ),
    sortValue: (fila) => fila.estado,
  },
  {
    key: 'ruta',
    header: 'Operación',
    hideOnMobileCards: true,
    render: (fila) => (
      <div className="max-w-64">
        <p className="truncate font-mono text-xs text-secondary" title={`${fila.metodo} ${fila.ruta}`}>
          {fila.metodo} {fila.ruta}
        </p>
        {fila.direccionIp && <p className="text-xs text-tertiary">IP {fila.direccionIp}</p>}
      </div>
    ),
  },
  {
    key: 'detalle',
    header: 'Detalle',
    isActions: true,
    render: (fila) => (
      <Button
        size="xs"
        variant="outline"
        aria-label={`Ver detalle de ${fila.accion} de ${fila.usuario}`}
        onPress={() => verDetalle(fila)}
        startIcon={<Icon name="eye" className="size-4" />}
      >
        Ver detalle
      </Button>
    ),
  },
]

export function AuditoriaPage() {
  const [usuario, setUsuario] = useState('')
  const [modulo, setModulo] = useState('')
  const [accion, setAccion] = useState('')
  const [resultado, setResultado] = useState<'' | 'OK' | 'ERROR'>('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [pagina, setPagina] = useState(0)
  const [porPagina, setPorPagina] = useState(20)
  const [seleccionado, setSeleccionado] = useState<RegistroAuditoria | null>(null)
  const [copiado, setCopiado] = useState(false)

  useEffect(() => {
    if (!seleccionado) return
    const desbordamiento = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const alEscape = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') setSeleccionado(null)
    }
    document.addEventListener('keydown', alEscape)
    return () => {
      document.body.style.overflow = desbordamiento
      document.removeEventListener('keydown', alEscape)
    }
  }, [seleccionado])

  const { data, error, loading, reload } = useAsyncData(
    () =>
      auditoriaService.listar({
        usuario: usuario || undefined,
        modulo: modulo || undefined,
        accion: accion || undefined,
        resultado: resultado || undefined,
        desde: desde || undefined,
        hasta: hasta || undefined,
        limite: porPagina,
        offset: pagina * porPagina,
      }),
    [usuario, modulo, accion, resultado, desde, hasta, pagina, porPagina],
  )

  const hayFiltros = Boolean(usuario || modulo || accion || resultado || desde || hasta)
  const filtrosActivos = [usuario, modulo, accion, resultado, desde, hasta].filter(Boolean).length
  const limpiar = () => {
    setUsuario('')
    setModulo('')
    setAccion('')
    setResultado('')
    setDesde('')
    setHasta('')
    setPagina(0)
  }

  const abrirDetalle = (fila: RegistroAuditoria) => {
    setCopiado(false)
    setSeleccionado(fila)
  }

  const copiarDetalle = async (texto: string) => {
    try {
      await navigator.clipboard.writeText(texto)
      setCopiado(true)
    } catch {
      setCopiado(false)
    }
  }

  const detalleTexto = seleccionado
    ? (formatearDetalle(seleccionado.detalle) ?? 'Sin datos adicionales.')
    : ''

  if (loading) return <AuditoriaSkeleton />

  return (
    <div className="flex w-full flex-col">
      <div className="w-full px-4 pt-6 lg:px-8">
        <PageHeader
          title="Auditoría"
          description="Bitácora de operaciones registradas automáticamente. Solo lectura para administradores y maestros."
          actions={
            <>
              <Badge tone="gray" className="px-3 py-1">
                <Icon name="shield" className="size-3.5" />
                Solo lectura
              </Badge>
              <Button
                variant="outline"
                onPress={reload}
                startIcon={<Icon name="refresh" className="size-4" />}
              >
                Actualizar
              </Button>
            </>
          }
        />
      </div>

      <div className="w-full space-y-6 px-4 lg:px-8">
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-secondary px-4 py-4 lg:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-tertiary text-brand-secondary">
                <Icon name="filter" className="size-4" />
              </span>
              <div className="min-w-0">
                <h2 className="text-md font-semibold text-primary">Filtrar bitácora</h2>
                <p className="text-sm text-tertiary">
                  Busca por usuario, módulo, acción, resultado o período.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {hayFiltros && <Badge tone="brand">{filtrosActivos} activos</Badge>}
              {hayFiltros && (
                <Button size="sm" variant="ghost" onPress={limpiar}>
                  Limpiar filtros
                </Button>
              )}
            </div>
          </div>

          <CardBody className="space-y-5">
            <section>
              <Subtitulo>Búsqueda</Subtitulo>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Campo etiqueta="Usuario">
                  <input
                    type="search"
                    value={usuario}
                    onChange={(evento) => {
                      setUsuario(evento.target.value)
                      setPagina(0)
                    }}
                    placeholder="Buscar usuario…"
                    className={inputClass}
                  />
                </Campo>

                <Campo etiqueta="Módulo">
                  <Select
                    ariaLabel="Módulo"
                    value={modulo}
                    onChange={(valor) => {
                      setModulo(valor)
                      setPagina(0)
                    }}
                    placeholder="Todos los módulos"
                    options={MODULOS_AUDITORIA.map((valor) => ({ value: valor, label: valor }))}
                  />
                </Campo>

                <Campo etiqueta="Acción">
                  <Select
                    ariaLabel="Acción"
                    value={accion}
                    onChange={(valor) => {
                      setAccion(valor)
                      setPagina(0)
                    }}
                    placeholder="Todas las acciones"
                    options={ACCIONES_AUDITORIA.map((valor) => ({ value: valor, label: valor }))}
                  />
                </Campo>

                <Campo etiqueta="Resultado">
                  <Select
                    ariaLabel="Resultado"
                    value={resultado}
                    onChange={(valor) => {
                      setResultado(valor as '' | 'OK' | 'ERROR')
                      setPagina(0)
                    }}
                    placeholder="Todos"
                    options={[
                      { value: 'OK', label: 'Correcto (2xx/3xx)' },
                      { value: 'ERROR', label: 'Con error (4xx/5xx)' },
                    ]}
                  />
                </Campo>
              </div>
            </section>

            <section className="border-t border-secondary pt-5">
              <Subtitulo>Período</Subtitulo>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Campo etiqueta="Desde">
                  <input
                    type="date"
                    value={desde}
                    onChange={(evento) => {
                      setDesde(evento.target.value)
                      setPagina(0)
                    }}
                    className={inputClass}
                  />
                </Campo>

                <Campo etiqueta="Hasta">
                  <input
                    type="date"
                    value={hasta}
                    onChange={(evento) => {
                      setHasta(evento.target.value)
                      setPagina(0)
                    }}
                    className={inputClass}
                  />
                </Campo>

                <p className="self-end text-xs text-tertiary">
                  Las fechas se interpretan en hora de Lima.
                </p>
              </div>
            </section>

            {error && (
              <Alert tone="error" title="No se pudo consultar la auditoría">
                {error.message}
              </Alert>
            )}
          </CardBody>
        </Card>

        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-secondary px-4 py-4 lg:px-6">
            <div className="min-w-0">
              <h2 className="text-md font-semibold text-primary">Registros</h2>
              <p className="text-sm text-tertiary">
                {data
                  ? `${data.pagination.total} registro${data.pagination.total === 1 ? '' : 's'}`
                  : 'Cargando…'}
              </p>
            </div>
            <Badge tone="gray">Más recientes primero</Badge>
          </div>

          <CardBody className="space-y-4 p-3 sm:p-4">
            {!error && (
              <>
                <DataTable
                  columns={columnas(abrirDetalle)}
                  rows={data?.data ?? []}
                  rowKey={(fila) => fila.id}
                  emptyTitle={hayFiltros ? 'Sin resultados' : 'Todavía no hay registros'}
                  emptyDescription={
                    hayFiltros
                      ? 'Ninguna operación coincide con los filtros.'
                      : 'Las operaciones aparecerán aquí cuando se registren.'
                  }
                  loading={loading}
                  mobileLayout="cards"
                  rowStyle="striped"
                  density="compact"
                />
                {data && data.pagination.total > 0 && (
                  <TablePagination
                    total={data.pagination.total}
                    page={pagina}
                    pageCount={Math.ceil(data.pagination.total / porPagina)}
                    pageSize={porPagina}
                    onPageSizeChange={(valor) => {
                      setPorPagina(valor)
                      setPagina(0)
                    }}
                    onPageChange={setPagina}
                    compact
                  />
                )}
              </>
            )}
          </CardBody>
        </Card>
      </div>

      {seleccionado && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-2 sm:items-center sm:p-4"
          onMouseDown={(evento) => {
            if (evento.target === evento.currentTarget) setSeleccionado(null)
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Detalle de auditoría"
            className="flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-primary text-primary shadow-xl ring-1 ring-tertiary"
          >
            <header className="flex items-start justify-between gap-3 border-b border-secondary px-4 py-4 sm:px-6">
              <div className="flex min-w-0 items-start gap-3">
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-primary text-brand-secondary">
                  <Icon name="shield" className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold tracking-wide text-tertiary uppercase">
                    Detalle de auditoría
                  </p>
                  <h2 className="mt-1 text-lg font-semibold break-words">
                    {seleccionado.accion} · {seleccionado.modulo}
                  </h2>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge tone={tonoAccion(seleccionado.accion)}>{seleccionado.accion}</Badge>
                    <Badge tone={tonoResultado(seleccionado.estado)}>
                      {seleccionado.estado}{' '}
                      {seleccionado.estado >= 200 && seleccionado.estado < 400 ? 'OK' : 'Error'}
                    </Badge>
                  </div>
                </div>
              </div>
              <Button
                size="xs"
                variant="ghost"
                aria-label="Cerrar detalle"
                onPress={() => setSeleccionado(null)}
                startIcon={<Icon name="close" className="size-4" />}
              />
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
              <section>
                <Subtitulo>Registro</Subtitulo>
                <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-medium text-tertiary">Fecha</dt>
                    <dd className="mt-0.5 tabular-nums">
                      {formatearFechaHora(seleccionado.creadoEn)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-tertiary">Usuario</dt>
                    <dd className="mt-0.5 break-words">{seleccionado.usuario}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-tertiary">Entidad</dt>
                    <dd className="mt-0.5 break-words">
                      {seleccionado.entidad}
                      {seleccionado.entidadId && (
                        <span className="block text-xs text-tertiary">
                          {seleccionado.entidadId}
                        </span>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-tertiary">Dirección IP</dt>
                    <dd className="mt-0.5 break-words">{seleccionado.direccionIp ?? '—'}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-xs font-medium text-tertiary">Operación</dt>
                    <dd className="mt-0.5 break-all font-mono text-xs">
                      {seleccionado.metodo} {seleccionado.ruta}
                    </dd>
                  </div>
                </dl>
              </section>

              <section className="mt-6 border-t border-secondary pt-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <Subtitulo>Datos registrados</Subtitulo>
                    <p className="-mt-2 text-xs text-tertiary">
                      Contenido JSON guardado por el sistema.
                    </p>
                  </div>
                  <Button
                    size="xs"
                    variant="outline"
                    onPress={() => void copiarDetalle(detalleTexto)}
                    startIcon={
                      <Icon name={copiado ? 'check' : 'clipboard'} className="size-4" />
                    }
                  >
                    {copiado ? 'Copiado' : 'Copiar'}
                  </Button>
                </div>
                <pre className="max-h-72 overflow-auto rounded-xl bg-secondary p-4 text-xs leading-relaxed whitespace-pre-wrap break-words text-secondary ring-1 ring-tertiary">
                  {detalleTexto}
                </pre>
              </section>
            </div>

            <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-secondary px-4 py-4 sm:px-6">
              <p className="min-w-0 truncate text-xs text-tertiary">ID {seleccionado.id}</p>
              <Button size="sm" variant="outline" onPress={() => setSeleccionado(null)}>
                Cerrar
              </Button>
            </footer>
          </section>
        </div>
      )}
    </div>
  )
}
