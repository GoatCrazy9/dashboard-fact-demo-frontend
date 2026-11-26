import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { LineasProducto, type LineaProducto } from '@/shared/components/LineasProducto'
import { useAsyncData } from '@/shared/hooks/useAsyncData'
import { cn } from '@/shared/utils/cn'
import { calcularTotales } from '@/shared/utils/calcularTotales'
import { hoyEnLima } from '@/shared/utils/fechas'
import { soles } from '@/shared/utils/format'
import { configuracionService } from '@/modules/configuracion/service/configuracionService'
import {
  consultarDocumento,
  validarDocumento,
  type TipoDocumentoConsulta,
} from '@/shared/integrations/reniec/reniec'
import { Alert } from '@/shared/ui/Alert'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { Campo, inputClass } from '@/shared/ui/FormSection'
import { ETIQUETAS_DOCUMENTO } from '@/modules/documentos/components/documentoUi'
import { Icon, type IconName } from '@/shared/ui/icons'
import { NuevoDocumentoSkeleton } from '@/shared/ui/ListadoSkeleton'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Select } from '@/shared/ui/Select'
import { clientesService } from '@/modules/clientes/service/clientesService'
import { productosService } from '@/modules/productos/service/productosService'
import type { Producto, TipoDocumentoVenta } from '@/shared/types'
import { documentosService } from '../service/documentosService'
import {
  VistaPreviaDocumento,
  type ItemVistaPrevia,
} from '../components/VistaPreviaDocumento'

type ClienteNuevo = {
  tipoDocumento: 'DNI' | 'RUC' | 'CE'
  numeroDocumento: string
  razonSocial: string
  direccion: string
  ubigeo: string
}

const clienteVacio: ClienteNuevo = {
  tipoDocumento: 'DNI',
  numeroDocumento: '',
  razonSocial: '',
  direccion: '',
  ubigeo: '',
}

function Subtitulo({ children }: { children: ReactNode }) {
  return (
    <p className="mb-3 text-xs font-semibold tracking-wide text-quaternary uppercase">
      {children}
    </p>
  )
}

/** Sección numerada con icono: guía el flujo de izquierda a derecha. */
function Seccion({
  numero,
  titulo,
  descripcion,
  icono,
  acciones,
  children,
}: {
  numero: string
  titulo: string
  descripcion: string
  icono: IconName
  acciones?: ReactNode
  children: ReactNode
}) {
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-secondary px-4 py-4 lg:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-primary text-sm font-semibold text-brand-secondary ring-1 ring-brand ring-inset">
            {numero}
          </span>
          <span className="hidden size-9 shrink-0 items-center justify-center rounded-lg bg-tertiary text-brand-secondary sm:inline-flex">
            <Icon name={icono} className="size-4" />
          </span>
          <div className="min-w-0">
            <h2 className="text-md font-semibold text-primary">{titulo}</h2>
            <p className="text-sm text-tertiary">{descripcion}</p>
          </div>
        </div>
        {acciones}
      </div>
      <div className="p-4 lg:p-6">{children}</div>
    </Card>
  )
}

/** Las líneas de texto no son productos: se materializan solo para calcular. */
function productosDeTexto(lineas: LineaProducto[]): Producto[] {
  return lineas.flatMap((linea) =>
    linea.texto === undefined
      ? []
      : [
          {
            id: `texto:${linea.id}`,
            codigo: '',
            descripcion: linea.texto.trim(),
            unidad: '',
            precioUnitario: linea.importe ?? 0,
            afectoIgv: true,
            stock: 0,
          },
        ],
  )
}

export function NuevoDocumentoPage() {
  const navigate = useNavigate()
  const { data: productos, error, loading } = useAsyncData(productosService.listar, [])
  const { data: configuracion } = useAsyncData(configuracionService.obtener, [])

  const [tipo, setTipo] = useState<TipoDocumentoVenta>('COTIZACION')
  const [nuevoCliente, setNuevoCliente] = useState<ClienteNuevo>(clienteVacio)
  const [fecha, setFecha] = useState(hoyEnLima)
  const [fechaVencimiento, setFechaVencimiento] = useState('')
  const [fechaEntrega, setFechaEntrega] = useState('')
  const [solicitadoPor, setSolicitadoPor] = useState('')
  const [observacion, setObservacion] = useState('')
  const [lineas, setLineas] = useState<LineaProducto[]>([
    { id: crypto.randomUUID(), productoId: '', cantidad: 1 },
  ])
  const [guardando, setGuardando] = useState(false)
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null)
  const [vistaPrevia, setVistaPrevia] = useState(false)
  const [consultando, setConsultando] = useState(false)
  const [avisoReniec, setAvisoReniec] = useState<{
    tono: 'success' | 'error'
    texto: string
  } | null>(null)

  const catalogo = useMemo(
    () => [...(productos ?? []), ...productosDeTexto(lineas)],
    [productos, lineas],
  )
  const lineasCalculo = useMemo(
    () =>
      lineas.map((linea) =>
        linea.texto === undefined
          ? linea
          : { id: linea.id, productoId: `texto:${linea.id}`, cantidad: 1 },
      ),
    [lineas],
  )
  const totales = useMemo(
    () => calcularTotales(lineasCalculo, catalogo),
    [lineasCalculo, catalogo],
  )
  const items = useMemo(
    () =>
      lineas.filter((linea) =>
        linea.texto === undefined
          ? Boolean(linea.productoId) && linea.cantidad > 0
          : Boolean(linea.texto.trim()),
      ),
    [lineas],
  )
  const itemsVista = useMemo<ItemVistaPrevia[]>(
    () =>
      items.map((linea) => {
        const esTexto = linea.texto !== undefined
        const id = esTexto ? `texto:${linea.id}` : linea.productoId
        const producto = catalogo.find((item) => item.id === id)
        const precioUnitario = producto?.precioUnitario ?? 0
        return {
          codigo: esTexto ? '' : (producto?.codigo ?? ''),
          descripcion: producto?.descripcion ?? 'Producto sin descripción',
          unidad: esTexto ? '' : (producto?.unidad ?? 'NIU'),
          cantidad: esTexto ? 1 : linea.cantidad,
          precioUnitario,
          total: Math.round(precioUnitario * 100 * (esTexto ? 1 : linea.cantidad)) / 100,
        }
      }),
    [items, catalogo, lineas],
  )

  async function consultarReniec() {
    const tipoDocumento: TipoDocumentoConsulta =
      nuevoCliente.tipoDocumento === 'CE'
        ? 'cee'
        : (nuevoCliente.tipoDocumento.toLowerCase() as 'dni' | 'ruc')

    const errorFormato = validarDocumento(tipoDocumento, nuevoCliente.numeroDocumento)
    if (errorFormato) {
      setAvisoReniec({ tono: 'error', texto: errorFormato })
      return
    }

    setConsultando(true)
    setAvisoReniec(null)
    try {
      const datos = await consultarDocumento(tipoDocumento, nuevoCliente.numeroDocumento)
      setNuevoCliente((actual) => ({
        ...actual,
        tipoDocumento: datos.tipoDocumento === 'CEE' ? 'CE' : datos.tipoDocumento,
        numeroDocumento: datos.numeroDocumento,
        razonSocial: datos.nombre ?? actual.razonSocial,
        direccion: datos.direccion ?? (datos.distrito ? datos.distrito : actual.direccion),
        ubigeo: datos.ubigeo ?? actual.ubigeo,
      }))
      setAvisoReniec({
        tono: 'success',
        texto: `Datos de ${datos.tipoDocumento} autocompletados desde el proveedor configurado.`,
      })
    } catch (fallo) {
      setAvisoReniec({ tono: 'error', texto: (fallo as Error).message })
    } finally {
      setConsultando(false)
    }
  }

  function validarDatos(): string | null {
    if (nuevoCliente.numeroDocumento.trim().length < 6) {
      return 'Ingresa un RUC/DNI válido (al menos 6 caracteres).'
    }
    if (nuevoCliente.razonSocial.trim().length < 2) {
      return 'Ingresa la razón social o el nombre del cliente.'
    }
    if (items.length === 0) {
      return 'Agrega un producto del catálogo o escribe un texto.'
    }
    for (const linea of items.filter((item) => item.texto !== undefined)) {
      if (linea.importe === undefined || linea.importe < 0) {
        return 'Ingresa un importe válido para cada línea escrita a mano.'
      }
    }
    if (fechaVencimiento && fechaVencimiento < fecha) {
      return 'La fecha de vencimiento no puede ser anterior a la emisión.'
    }
    if (fechaEntrega && fechaEntrega < fecha) {
      return 'La fecha de entrega no puede ser anterior a la emisión.'
    }
    return null
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    setErrorEnvio(null)

    const problema = validarDatos()
    if (problema) {
      setErrorEnvio(problema)
      return
    }

    setGuardando(true)
    try {
      const cliente = await clientesService.crear({
        tipoDocumento: nuevoCliente.tipoDocumento,
        numeroDocumento: nuevoCliente.numeroDocumento.trim(),
        razonSocial: nuevoCliente.razonSocial.trim(),
        direccion: nuevoCliente.direccion.trim() || null,
        email: null,
        telefono: null,
        ubigeo: nuevoCliente.ubigeo.trim() || null,
      })

      const creado = await documentosService.crear({
        tipo,
        clienteId: cliente.id,
        fecha,
        fechaVencimiento,
        fechaEntrega,
        solicitadoPor,
        observacion,
        items: items.map((linea) =>
          linea.texto === undefined
            ? { productoId: linea.productoId, cantidad: linea.cantidad }
            : {
                descripcion: linea.texto.trim(),
                cantidad: 1,
                precioUnitario: linea.importe ?? 0,
              },
        ),
      })
      navigate(`/documentos/${creado.id}`)
    } catch (err) {
      setErrorEnvio(err instanceof Error ? err.message : 'No se pudo guardar el documento.')
    } finally {
      setGuardando(false)
    }
  }

  function abrirVistaPrevia() {
    const problema = validarDatos()
    if (problema) {
      setErrorEnvio(problema)
      return
    }
    setErrorEnvio(null)
    setVistaPrevia(true)
  }

  if (loading) return <NuevoDocumentoSkeleton />

  const empresa = configuracion?.empresa

  return (
    <div className="flex flex-col">
      <div className="no-print w-full px-4 pt-6 lg:px-8">
        {error && (
          <div className="mb-6">
            <Alert tone="error" title="No se pudieron cargar los productos">
              {error.message}
            </Alert>
          </div>
        )}

        <PageHeader
          title="Nueva proforma o pedido"
          description={
            <>
              {empresa?.razonSocial ?? 'MUEBLERIA JOSE'} · RUC {empresa?.ruc ?? '—'} ·{' '}
              {empresa?.direccion ?? 'Cargando dirección del local…'}
            </>
          }
          actions={
            <>
              <Badge tone={tipo === 'PEDIDO' ? 'success' : 'brand'} className="px-3 py-1">
                <Icon name={tipo === 'PEDIDO' ? 'clipboard' : 'file-text'} className="size-3.5" />
                {ETIQUETAS_DOCUMENTO[tipo]}
              </Badge>
              <Button
                variant="outline"
                onPress={() => navigate('/documentos')}
                startIcon={<Icon name="arrow-left" className="size-4" />}
              >
                Volver al listado
              </Button>
            </>
          }
        />
      </div>

      <form
        onSubmit={enviar}
        className="grid w-full grid-cols-1 gap-6 px-4 lg:grid-cols-12 lg:px-8"
      >
        <div className="min-w-0 space-y-6 lg:col-span-8">
          <Seccion
            numero="01"
            titulo="Tipo y vigencia"
            descripcion="Define si es proforma o pedido y sus fechas."
            icono="calendar"
          >
            <div className="min-w-0">
              <p className="mb-2 text-sm font-medium text-secondary">Tipo de documento</p>
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-secondary p-1 ring-1 ring-primary ring-inset sm:max-w-80">
                {(
                  [
                    ['COTIZACION', 'Proforma', 'file-text', 'Sin compromiso de pago'],
                    ['PEDIDO', 'Pedido', 'clipboard', 'Encargo aceptado'],
                  ] as const
                ).map(([valor, etiqueta, icono, detalle]) => {
                  const activo = tipo === valor
                  return (
                    <button
                      key={valor}
                      type="button"
                      aria-pressed={activo}
                      onClick={() => setTipo(valor)}
                      className={cn(
                        'flex min-w-0 cursor-pointer flex-col items-start gap-1 rounded-lg px-3 py-2.5 text-left outline-focus-ring transition-colors',
                        activo
                          ? 'bg-primary text-primary shadow-xs ring-1 ring-brand ring-inset'
                          : 'text-tertiary hover:bg-primary/60 hover:text-primary',
                      )}
                    >
                      <span className="flex items-center gap-1.5 text-sm font-semibold">
                        <Icon name={icono} className="size-4 shrink-0" />
                        {etiqueta}
                      </span>
                      <span className="hidden text-xs text-tertiary sm:block">{detalle}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Campo etiqueta="Fecha de emisión" pista="Fecha de Lima">
                <input
                  type="date"
                  value={fecha}
                  onChange={(evento) => setFecha(evento.target.value)}
                  className={inputClass}
                  required
                />
              </Campo>
              <Campo etiqueta="Fecha de vencimiento">
                <input
                  type="date"
                  value={fechaVencimiento}
                  min={fecha}
                  onChange={(evento) => setFechaVencimiento(evento.target.value)}
                  className={inputClass}
                />
              </Campo>
              <Campo etiqueta="Fecha de entrega">
                <input
                  type="date"
                  value={fechaEntrega}
                  min={fecha}
                  onChange={(evento) => setFechaEntrega(evento.target.value)}
                  className={inputClass}
                />
              </Campo>
              <Campo etiqueta="Solicitado por">
                <input
                  type="text"
                  value={solicitadoPor}
                  maxLength={100}
                  onChange={(evento) => setSolicitadoPor(evento.target.value)}
                  className={inputClass}
                  placeholder="Nombre de quien solicita el documento"
                />
              </Campo>
            </div>
          </Seccion>

          <Seccion
            numero="02"
            titulo="Cliente"
            descripcion="Los datos se guardan con el documento."
            icono="user"
          >
            <Subtitulo>Identificación</Subtitulo>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Campo etiqueta="Tipo de documento">
                <Select
                  ariaLabel="Tipo de documento"
                  value={nuevoCliente.tipoDocumento}
                  onChange={(valor) =>
                    setNuevoCliente({
                      ...nuevoCliente,
                      tipoDocumento: valor as ClienteNuevo['tipoDocumento'],
                    })
                  }
                  options={[
                    { value: 'DNI', label: 'DNI' },
                    { value: 'RUC', label: 'RUC' },
                    { value: 'CE', label: 'CE' },
                  ]}
                />
              </Campo>
              <Campo etiqueta="Número de documento">
                <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    value={nuevoCliente.numeroDocumento}
                    onChange={(evento) =>
                      setNuevoCliente({ ...nuevoCliente, numeroDocumento: evento.target.value })
                    }
                    className={cn(inputClass, 'sm:flex-1')}
                    placeholder="RUC o DNI"
                    maxLength={20}
                    required
                  />
                  <Button
                    type="button"
                    onClick={() => void consultarReniec()}
                    isLoading={consultando}
                    variant="outline"
                    className="shrink-0"
                    startIcon={<Icon name="search" className="size-4" />}
                  >
                    Consultar
                  </Button>
                </div>
              </Campo>
              <Campo etiqueta="Razón social / nombre" className="sm:col-span-2">
                <input
                  type="text"
                  value={nuevoCliente.razonSocial}
                  onChange={(evento) =>
                    setNuevoCliente({ ...nuevoCliente, razonSocial: evento.target.value })
                  }
                  className={inputClass}
                  placeholder="Nombre del cliente"
                  maxLength={200}
                  required
                />
              </Campo>
            </div>

            <div className="mt-6 border-t border-secondary pt-6">
              <Subtitulo>Ubicación</Subtitulo>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Campo etiqueta="Dirección" className="sm:col-span-2">
                  <input
                    type="text"
                    value={nuevoCliente.direccion}
                    onChange={(evento) =>
                      setNuevoCliente({ ...nuevoCliente, direccion: evento.target.value })
                    }
                    className={inputClass}
                    placeholder="Calle, número y referencia"
                    maxLength={300}
                  />
                </Campo>
                <Campo etiqueta="Ubigeo" pista="Lo completa la consulta cuando está disponible.">
                  <input
                    type="text"
                    value={nuevoCliente.ubigeo}
                    onChange={(evento) =>
                      setNuevoCliente({ ...nuevoCliente, ubigeo: evento.target.value })
                    }
                    className={inputClass}
                    placeholder="Ej. 150101"
                    maxLength={6}
                  />
                </Campo>
              </div>
            </div>

            {avisoReniec && (
              <div className="mt-5">
                <Alert tone={avisoReniec.tono}>{avisoReniec.texto}</Alert>
              </div>
            )}
          </Seccion>

          <Seccion
            numero="03"
            titulo="Detalle de la venta"
            descripcion="Productos del catálogo o texto libre con importe."
            icono="package"
          >
            <Subtitulo>Líneas del documento</Subtitulo>
            <LineasProducto
              lineas={lineas}
              productos={productos ?? []}
              onChange={setLineas}
              mostrarImporte
              permitirTextoLibre
            />

            <div className="mt-6 border-t border-secondary pt-6">
              <Subtitulo>Observación</Subtitulo>
              <Campo etiqueta="Detalles o condiciones" className="max-w-2xl">
                <textarea
                  value={observacion}
                  maxLength={500}
                  rows={3}
                  onChange={(evento) => setObservacion(evento.target.value)}
                  className={cn(inputClass, 'h-auto py-2')}
                  placeholder="Ej. entrega en obra, vigencia de la proforma, garantía…"
                />
              </Campo>
            </div>
          </Seccion>
        </div>

        <div className="min-w-0 lg:col-span-4">
          <Card className="overflow-hidden lg:sticky lg:top-20">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-secondary px-4 py-4 lg:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-primary text-brand-secondary">
                  <Icon name="chart" className="size-4" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-md font-semibold text-primary">Resumen</h2>
                  <p className="text-sm text-tertiary">
                    {items.length} {items.length === 1 ? 'línea' : 'líneas'} ·{' '}
                    {ETIQUETAS_DOCUMENTO[tipo]}
                  </p>
                </div>
              </div>
              <Badge tone={tipo === 'PEDIDO' ? 'success' : 'brand'}>S/ · IGV incluido</Badge>
            </div>

            <div className="p-4 lg:p-6">
              <div className="rounded-xl bg-secondary p-4 ring-1 ring-tertiary ring-inset">
                <div className="grid grid-cols-2 gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-tertiary">Subtotal</p>
                    <p className="mt-0.5 text-sm font-medium text-secondary tabular-nums">
                      {soles(totales.subtotal)}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-tertiary">IGV (18%)</p>
                    <p className="mt-0.5 text-sm font-medium text-secondary tabular-nums">
                      {soles(totales.igv)}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-end justify-between gap-3 border-t border-tertiary pt-4">
                  <div>
                    <p className="text-xs font-medium text-tertiary uppercase">Total a cobrar</p>
                    <p className="mt-1 text-xs text-tertiary">Precios con IGV</p>
                  </div>
                  <p className="text-2xl font-semibold text-primary tabular-nums">
                    {soles(totales.total)}
                  </p>
                </div>
              </div>

              {errorEnvio && (
                <div className="mt-5">
                  <Alert tone="error" title="Revisa el documento">
                    {errorEnvio}
                  </Alert>
                </div>
              )}

              <div className="mt-5 flex flex-col gap-2">
                <Button
                  type="submit"
                  fullWidth
                  isLoading={guardando}
                  isDisabled={guardando}
                  startIcon={<Icon name="send" className="size-4" />}
                >
                  Guardar {tipo === 'PEDIDO' ? 'pedido' : 'proforma'}
                </Button>
                <Button
                  type="button"
                  fullWidth
                  variant="outline"
                  onClick={abrirVistaPrevia}
                  isDisabled={guardando}
                  startIcon={<Icon name="eye" className="size-4" />}
                >
                  Vista previa
                </Button>
              </div>

              <div className="mt-5 flex gap-2 rounded-lg bg-tertiary/50 p-3 text-xs text-tertiary">
                <Icon name="warning" className="mt-0.5 size-4 shrink-0 text-fg-warning-primary" />
                <p>
                  El cliente se crea al guardar. Las líneas a mano no entran al catálogo y ese
                  documento no se convierte en comprobante. La vista previa no guarda nada.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </form>

      {vistaPrevia && (
        <VistaPreviaDocumento
          tipo={tipo}
          empresa={{
            razonSocial: empresa?.razonSocial ?? 'MUEBLERIA JOSE',
            ruc: empresa?.ruc ?? '',
            direccion: empresa?.direccion ?? '',
          }}
          cliente={{
            razonSocial: nuevoCliente.razonSocial,
            numeroDocumento: nuevoCliente.numeroDocumento,
            direccion: nuevoCliente.direccion,
          }}
          fecha={fecha}
          fechaVencimiento={fechaVencimiento}
          fechaEntrega={fechaEntrega}
          solicitadoPor={solicitadoPor}
          observacion={observacion}
          items={itemsVista}
          subtotal={totales.subtotal}
          igv={totales.igv}
          total={totales.total}
          onClose={() => setVistaPrevia(false)}
        />
      )}
    </div>
  )
}
