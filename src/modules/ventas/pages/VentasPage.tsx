import { useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAsyncData } from '@/shared/hooks/useAsyncData'
import { cn } from '@/shared/utils/cn'
import { hoyEnLima } from '@/shared/utils/fechas'
import { Alert } from '@/shared/ui/Alert'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { Campo, inputClass } from '@/shared/ui/FormSection'
import { Icon } from '@/shared/ui/icons'
import { PageHeader } from '@/shared/ui/PageHeader'
import { VentasSkeleton } from '@/shared/ui/PaginasSkeleton'
import { Select, type SelectOption } from '@/shared/ui/Select'
import { configuracionService } from '@/modules/configuracion/service/configuracionService'
import { detraccionesService } from '@/modules/detracciones/service/detraccionesService'
import { productosService } from '@/modules/productos/service/productosService'
import {
  consultarDocumento,
  validarDocumento,
  type TipoDocumentoConsulta,
} from '@/shared/integrations/reniec/reniec'
import { BoletaPreview } from '../components/BoletaPreview'
import { ventasService } from '../service/ventasService'
import { validarVenta, type Fila, type Formulario } from '../validacion'
import type { Detraccion, Producto } from '@/shared/types'

const redondear = (n: number) => Math.round(n * 100) / 100

function Subtitulo({ children }: { children: ReactNode }) {
  return <p className="mb-3 text-xs font-semibold tracking-wide text-quaternary uppercase">{children}</p>
}

/** Sección numerada: guía el flujo sin depender de iconos decorativos. */
function Seccion({
  numero,
  titulo,
  descripcion,
  acciones,
  children,
}: {
  numero: string
  titulo: string
  descripcion: string
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

function FilaResumen({
  etiqueta,
  valor,
  destacado,
}: {
  etiqueta: string
  valor: string
  destacado?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <dt className="text-tertiary">{etiqueta}</dt>
      <dd className={cn('font-medium text-secondary tabular-nums', destacado && 'text-primary')}>
        {valor}
      </dd>
    </div>
  )
}

const filaVacia = (): Fila => ({
  id: crypto.randomUUID(),
  productoId: '',
  codigo: '',
  descripcion: '',
  unidad: 'UND',
  cantidad: 1,
  precioUnitario: 0,
  igv: 18,
})

const formularioInicial: Formulario = {
  tipoComprobante: 'BOLETA',
  tipoDocumento: 'dni',
  numeroDocumento: '',
  nombreCliente: '',
  telefono: '',
  correo: '',
  direccionCliente: '',
  distrito: '',
  provincia: '',
  departamento: '',
  ubigeo: '',
  tipoCotizacion: 'COTIZACION',
  numeroGuia: '',
  ordenCompra: '',
  solicitadoPor: '',
  fechaEntrega: '',
  formaPago: 'EFECTIVO',
  fechaPago: '',
  condicionesPago: 'CONTADO',
  moneda: 'PEN',
  tipoCambio: 1,
  detraccionCodigo: '000',
}

const OPCIONES_TIPO_DOCUMENTO: SelectOption[] = [
  { value: 'dni', label: 'DNI' },
  { value: 'ruc', label: 'RUC' },
  { value: 'cee', label: 'CEE' },
]

const OPCIONES_TIPO_COTIZACION: SelectOption[] = [
  { value: 'COTIZACION', label: 'Cotización' },
  { value: 'PEDIDO', label: 'Pedido' },
  { value: 'VENTA', label: 'Venta directa' },
]

const OPCIONES_FORMA_PAGO: SelectOption[] = [
  { value: 'EFECTIVO', label: 'Efectivo' },
  { value: 'TARJETA', label: 'Tarjeta' },
  { value: 'TRANSFERENCIA', label: 'Transferencia' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'CREDITO', label: 'Crédito' },
  { value: 'OTRO', label: 'Otro' },
]

const OPCIONES_CONDICIONES_PAGO: SelectOption[] = [
  { value: 'CONTADO', label: 'Contado' },
  { value: 'CREDITO', label: 'Crédito' },
  { value: 'CONTADO_PARCIAL', label: 'Contado parcial' },
]

const OPCIONES_MONEDA: SelectOption[] = [
  { value: 'PEN', label: 'Soles (PEN)' },
  { value: 'USD', label: 'Dólares (USD)' },
]

export function VentasPage() {
  const navigate = useNavigate()
  const { data, error, loading } = useAsyncData(() =>
    Promise.all([
      configuracionService.obtener(),
      productosService.listar(),
      detraccionesService.listar(),
    ]),
  )
  const empresa = data?.[0].empresa
  const productos: Producto[] = data?.[1] ?? []
  const detracciones: Detraccion[] = data?.[2] ?? []

  const [form, setForm] = useState<Formulario>(formularioInicial)
  const [filas, setFilas] = useState<Fila[]>([filaVacia()])
  const [consultando, setConsultando] = useState(false)
  const [emitiendo, setEmitiendo] = useState(false)
  const [aviso, setAviso] = useState<{ tono: 'success' | 'error'; texto: string } | null>(null)
  const [vistaPrevia, setVistaPrevia] = useState(false)
  const [mostrarErrores, setMostrarErrores] = useState(false)

  const actualizar = <K extends keyof Formulario>(clave: K, valor: Formulario[K]) =>
    setForm((actual) => ({ ...actual, [clave]: valor }))

  const errores = useMemo(() => validarVenta(form, filas), [form, filas])
  const errorDe = (clave: string) => (mostrarErrores ? errores[clave] : undefined)
  const claseConError = (clave: string, base = inputClass) =>
    cn(base, errorDe(clave) && 'ring-1 ring-error')

  const totales = useMemo(
    () =>
      filas.reduce(
        (acc, fila) => {
          const bruto = fila.cantidad * fila.precioUnitario
          if (!bruto || bruto < 0) return acc
          const tasa = Math.max(fila.igv, 0) / 100
          const base = bruto / (1 + tasa)
          acc.subtotal += base
          acc.igv += bruto - base
          acc.total += bruto
          return acc
        },
        { subtotal: 0, igv: 0, total: 0 },
      ),
    [filas],
  )

  const detraccionSeleccionada = detracciones.find(
    (detraccion) => detraccion.codigo === form.detraccionCodigo,
  )
  const montoDetraccion = redondear(
    (totales.total * (detraccionSeleccionada?.tasa ?? 0)) / 100,
  )

  async function consultarReniec() {
    setMostrarErrores(true)
    const tipoDocumento = form.tipoComprobante === 'FACTURA' ? 'ruc' : form.tipoDocumento
    const errorFormato = validarDocumento(tipoDocumento, form.numeroDocumento)
    if (errorFormato) {
      setAviso({ tono: 'error', texto: errorFormato })
      return
    }
    setConsultando(true)
    setAviso(null)
    try {
      const datos = await consultarDocumento(tipoDocumento, form.numeroDocumento)
      setForm((actual) => ({
        ...actual,
        nombreCliente: datos.nombre ?? actual.nombreCliente,
        direccionCliente: datos.direccion ?? actual.direccionCliente,
        distrito: datos.distrito ?? actual.distrito,
        provincia: datos.provincia ?? actual.provincia,
        departamento: datos.departamento ?? actual.departamento,
        ubigeo: datos.ubigeo ?? actual.ubigeo,
      }))
      setAviso({
        tono: 'success',
        texto: `Datos de ${datos.tipoDocumento} autocompletados desde el proveedor configurado.`,
      })
    } catch (fallo) {
      setAviso({ tono: 'error', texto: (fallo as Error).message })
    } finally {
      setConsultando(false)
    }
  }

  async function emitirComprobante() {
    setMostrarErrores(true)
    const listaErrores = Object.values(errores)
    if (listaErrores.length > 0) {
      setAviso({
        tono: 'error',
        texto:
          listaErrores.length === 1
            ? listaErrores[0]
            : `Corrige ${listaErrores.length} campos: ${listaErrores.slice(0, 3).join('; ')}${listaErrores.length > 3 ? '…' : ''}`,
      })
      return
    }

    const items = filas.map((fila) => ({
      codigo: fila.codigo.trim(),
      descripcion: fila.descripcion.trim(),
      unidad: fila.unidad.trim(),
      precioUnitario: fila.precioUnitario,
      igv: fila.igv,
      cantidad: fila.cantidad,
    }))

    setEmitiendo(true)
    setAviso(null)
    try {
      const creada = await ventasService.emitir({
        tipo: form.tipoComprobante,
        cliente: {
          tipoDocumento:
            form.tipoComprobante === 'FACTURA'
              ? 'RUC'
              : form.tipoDocumento === 'cee'
                ? 'CE'
                : (form.tipoDocumento.toUpperCase() as 'DNI' | 'RUC'),
          numeroDocumento: form.numeroDocumento.trim(),
          razonSocial: form.nombreCliente.trim(),
          direccion: form.direccionCliente.trim() || null,
          email: form.correo.trim() || null,
          telefono: form.telefono.trim() || null,
        },
        fecha: hoyEnLima(),
        detraccionCodigo: form.detraccionCodigo,
        detalle: {
          tipoCotizacion: form.tipoCotizacion,
          numeroGuia: form.numeroGuia.trim() || undefined,
          ordenCompra: form.ordenCompra.trim() || undefined,
          solicitadoPor: form.solicitadoPor.trim() || undefined,
          fechaEntrega: form.fechaEntrega.trim() || undefined,
          formaPago: form.formaPago,
          fechaPago: form.fechaPago.trim() || undefined,
          condicionesPago: form.condicionesPago.trim() || undefined,
          moneda: form.moneda,
          tipoCambio: form.tipoCambio,
        },
        items,
      })
      setMostrarErrores(false)
      navigate(`/comprobantes/${creada.id}`)
    } catch (fallo) {
      setAviso({ tono: 'error', texto: (fallo as Error).message })
    } finally {
      setEmitiendo(false)
    }
  }

  function agregarProducto(productoId: string) {
    if (!productoId) return
    const producto = productos.find((p) => p.id === productoId)
    if (!producto) return
    setFilas((actual) => [
      ...actual,
      {
        ...filaVacia(),
        productoId,
        codigo: producto.codigo,
        descripcion: producto.descripcion,
        unidad: producto.unidad,
        precioUnitario: producto.precioUnitario,
        igv: producto.afectoIgv ? 18 : 0,
      },
    ])
  }

  const actualizarFila = (id: string, cambio: Partial<Fila>) =>
    setFilas((actual) => actual.map((f) => (f.id === id ? { ...f, ...cambio } : f)))

  const quitarFila = (id: string) =>
    setFilas((actual) => (actual.length === 1 ? actual : actual.filter((f) => f.id !== id)))

  function cambiarTipoComprobante(tipo: 'BOLETA' | 'FACTURA') {
    setForm((actual) => ({
      ...actual,
      tipoComprobante: tipo,
      tipoDocumento: tipo === 'FACTURA' ? 'ruc' : actual.tipoDocumento,
    }))
  }

  if (loading) return <VentasSkeleton />

  return (
    <div className="flex flex-col">
      <div className="no-print flex w-full flex-col gap-5 px-4 lg:px-8">
        {error && (
          <Alert tone="error" title="No se pudo cargar la configuración">
            {error.message}
          </Alert>
        )}

        {aviso && <Alert tone={aviso.tono}>{aviso.texto}</Alert>}

        <PageHeader
          title="Nueva venta"
          description={
            <>
              {empresa?.razonSocial ?? 'MUEBLERIA JOSE'} · RUC {empresa?.ruc ?? '—'} ·{' '}
              {empresa?.direccion ?? 'Cargando dirección del local…'}
            </>
          }
          actions={
            <>
              <Badge tone="brand" className="px-3 py-1">
                {form.tipoComprobante === 'BOLETA' ? 'Boleta B001' : 'Factura F001'} · {form.moneda}
              </Badge>
              <Button
                variant="outline"
                onPress={() => navigate('/comprobantes')}
                startIcon={<Icon name="arrow-left" className="size-4" />}
              >
                Volver al listado
              </Button>
            </>
          }
        />
      </div>

      <div className="no-print grid w-full grid-cols-1 gap-6 px-4 lg:grid-cols-12 lg:px-8">
        <div className="min-w-0 lg:col-span-7">
          <Seccion
            numero="01"
            titulo="Datos del cliente"
            descripcion="Datos que aparecerán en el comprobante."
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Campo
                etiqueta="Documento del cliente"
                className="sm:col-span-2"
                error={errorDe('numeroDocumento')}
                pista={form.tipoComprobante === 'FACTURA' ? 'Las facturas usan RUC.' : undefined}
              >
                <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
                  <Select
                    ariaLabel="Tipo de documento"
                    value={form.tipoDocumento}
                    onChange={(valor) =>
                      actualizar('tipoDocumento', valor as TipoDocumentoConsulta)
                    }
                    options={OPCIONES_TIPO_DOCUMENTO}
                    isDisabled={form.tipoComprobante === 'FACTURA'}
                    wrapperClassName="sm:w-28"
                  />
                  <input
                    value={form.numeroDocumento}
                    onChange={(e) => actualizar('numeroDocumento', e.target.value)}
                    placeholder="Número de documento"
                    className={claseConError('numeroDocumento', cn(inputClass, 'flex-1'))}
                    aria-invalid={Boolean(errorDe('numeroDocumento'))}
                  />
                  <Button
                    variant="outline"
                    className="shrink-0"
                    onPress={() => void consultarReniec()}
                    isLoading={consultando}
                    startIcon={<Icon name="search" className="size-4" />}
                  >
                    Consultar RENIEC
                  </Button>
                </div>
              </Campo>

              <Campo
                etiqueta="Nombre del cliente"
                className="sm:col-span-2"
                error={errorDe('nombreCliente')}
              >
                <input
                  value={form.nombreCliente}
                  onChange={(e) => actualizar('nombreCliente', e.target.value)}
                  className={claseConError('nombreCliente')}
                  aria-invalid={Boolean(errorDe('nombreCliente'))}
                />
              </Campo>

              <Campo etiqueta="Teléfono" error={errorDe('telefono')}>
                <input
                  type="tel"
                  value={form.telefono}
                  onChange={(e) => actualizar('telefono', e.target.value)}
                  className={claseConError('telefono')}
                  aria-invalid={Boolean(errorDe('telefono'))}
                />
              </Campo>

              <Campo etiqueta="Correo electrónico" error={errorDe('correo')}>
                <input
                  type="email"
                  value={form.correo}
                  onChange={(e) => actualizar('correo', e.target.value)}
                  className={claseConError('correo')}
                  aria-invalid={Boolean(errorDe('correo'))}
                />
              </Campo>

              <Campo
                etiqueta="Dirección"
                className="sm:col-span-2"
                error={errorDe('direccionCliente')}
              >
                <input
                  value={form.direccionCliente}
                  onChange={(e) => actualizar('direccionCliente', e.target.value)}
                  className={claseConError('direccionCliente')}
                  aria-invalid={Boolean(errorDe('direccionCliente'))}
                />
              </Campo>

              <Campo etiqueta="Distrito" error={errorDe('distrito')}>
                <input
                  value={form.distrito}
                  onChange={(e) => actualizar('distrito', e.target.value)}
                  className={claseConError('distrito')}
                  aria-invalid={Boolean(errorDe('distrito'))}
                />
              </Campo>

              <Campo etiqueta="Provincia" error={errorDe('provincia')}>
                <input
                  value={form.provincia}
                  onChange={(e) => actualizar('provincia', e.target.value)}
                  className={claseConError('provincia')}
                  aria-invalid={Boolean(errorDe('provincia'))}
                />
              </Campo>

              <Campo etiqueta="Departamento" error={errorDe('departamento')}>
                <input
                  value={form.departamento}
                  onChange={(e) => actualizar('departamento', e.target.value)}
                  className={claseConError('departamento')}
                  aria-invalid={Boolean(errorDe('departamento'))}
                />
              </Campo>

              <Campo etiqueta="Ubigeo" error={errorDe('ubigeo')}>
                <input
                  value={form.ubigeo}
                  onChange={(e) => actualizar('ubigeo', e.target.value)}
                  placeholder="6 dígitos"
                  className={claseConError('ubigeo')}
                  aria-invalid={Boolean(errorDe('ubigeo'))}
                />
              </Campo>
            </div>
          </Seccion>
        </div>

        <div className="min-w-0 lg:col-span-5">
          <Seccion
            numero="02"
            titulo="Datos de la venta"
            descripcion="Comprobante, referencias y forma de pago."
          >
            <div className="flex flex-col gap-6">
              <div>
                <Subtitulo>Comprobante</Subtitulo>
                <div className="grid grid-cols-2 gap-2">
                  {(['BOLETA', 'FACTURA'] as const).map((tipo) => {
                    const activo = form.tipoComprobante === tipo
                    return (
                      <button
                        key={tipo}
                        type="button"
                        aria-pressed={activo}
                        onClick={() => cambiarTipoComprobante(tipo)}
                        className={cn(
                          'flex cursor-pointer flex-col items-start gap-1 rounded-xl p-3 text-left ring-1 ring-inset outline-focus-ring transition-colors',
                          activo
                            ? 'bg-brand-primary ring-brand'
                            : 'bg-primary ring-primary hover:bg-secondary',
                        )}
                      >
                        <span className="flex w-full items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-primary">
                            {tipo === 'BOLETA' ? 'Boleta' : 'Factura'}
                          </span>
                          {activo && <Icon name="check" className="size-4 text-brand-secondary" />}
                        </span>
                        <span className="text-xs text-tertiary">
                          {tipo === 'BOLETA' ? 'B001 · DNI o CEE' : 'F001 · RUC'}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <Subtitulo>Referencias</Subtitulo>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Campo etiqueta="Tipo" error={errorDe('tipoCotizacion')}>
                    <Select
                      ariaLabel="Tipo de cotización"
                      value={form.tipoCotizacion}
                      onChange={(valor) => actualizar('tipoCotizacion', valor)}
                      options={OPCIONES_TIPO_COTIZACION}
                    />
                  </Campo>
                  <Campo etiqueta="Nro. de guía" error={errorDe('numeroGuia')}>
                    <input
                      value={form.numeroGuia}
                      onChange={(e) => actualizar('numeroGuia', e.target.value)}
                      className={claseConError('numeroGuia')}
                      aria-invalid={Boolean(errorDe('numeroGuia'))}
                    />
                  </Campo>
                  <Campo etiqueta="Orden de compra" error={errorDe('ordenCompra')}>
                    <input
                      value={form.ordenCompra}
                      onChange={(e) => actualizar('ordenCompra', e.target.value)}
                      className={claseConError('ordenCompra')}
                      aria-invalid={Boolean(errorDe('ordenCompra'))}
                    />
                  </Campo>
                  <Campo etiqueta="Solicitado por" error={errorDe('solicitadoPor')}>
                    <input
                      value={form.solicitadoPor}
                      onChange={(e) => actualizar('solicitadoPor', e.target.value)}
                      className={claseConError('solicitadoPor')}
                      aria-invalid={Boolean(errorDe('solicitadoPor'))}
                    />
                  </Campo>
                  <Campo
                    etiqueta="Fecha de entrega"
                    className="sm:col-span-2"
                    error={errorDe('fechaEntrega')}
                  >
                    <input
                      type="date"
                      value={form.fechaEntrega}
                      onChange={(e) => actualizar('fechaEntrega', e.target.value)}
                      className={claseConError('fechaEntrega')}
                      aria-invalid={Boolean(errorDe('fechaEntrega'))}
                    />
                  </Campo>
                </div>
              </div>

              <div>
                <Subtitulo>Pago y moneda</Subtitulo>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Campo etiqueta="Forma de pago" error={errorDe('formaPago')}>
                    <Select
                      ariaLabel="Forma de pago"
                      value={form.formaPago}
                      onChange={(valor) => actualizar('formaPago', valor)}
                      options={OPCIONES_FORMA_PAGO}
                    />
                  </Campo>
                  <Campo etiqueta="Condiciones" error={errorDe('condicionesPago')}>
                    <Select
                      ariaLabel="Condiciones de pago"
                      value={form.condicionesPago}
                      onChange={(valor) => actualizar('condicionesPago', valor)}
                      options={OPCIONES_CONDICIONES_PAGO}
                    />
                  </Campo>
                  <Campo etiqueta="Moneda" error={errorDe('moneda')}>
                    <Select
                      ariaLabel="Moneda"
                      value={form.moneda}
                      onChange={(valor) => {
                        const moneda = valor as 'PEN' | 'USD'
                        setForm((actual) => ({
                          ...actual,
                          moneda,
                          tipoCambio: moneda === 'USD' ? 3.75 : 1,
                        }))
                      }}
                      options={OPCIONES_MONEDA}
                    />
                  </Campo>
                  <Campo
                    etiqueta="Tipo de cambio"
                    error={errorDe('tipoCambio')}
                    pista={form.moneda === 'PEN' ? 'Fijo en 1 para soles.' : undefined}
                  >
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={form.tipoCambio}
                      onChange={(e) => actualizar('tipoCambio', Number(e.target.value))}
                      disabled={form.moneda === 'PEN'}
                      className={claseConError('tipoCambio')}
                      aria-invalid={Boolean(errorDe('tipoCambio'))}
                    />
                  </Campo>
                  <Campo
                    etiqueta="Fecha de pago"
                    error={errorDe('fechaPago')}
                    pista="Requerida si la forma de pago es crédito."
                  >
                    <input
                      type="date"
                      value={form.fechaPago}
                      onChange={(e) => actualizar('fechaPago', e.target.value)}
                      className={claseConError('fechaPago')}
                      aria-invalid={Boolean(errorDe('fechaPago'))}
                    />
                  </Campo>
                  <Campo etiqueta="Detracción" error={errorDe('detraccionCodigo')}>
                    <Select
                      ariaLabel="Detracción"
                      value={form.detraccionCodigo}
                      onChange={(valor) => actualizar('detraccionCodigo', valor)}
                      options={[
                        { value: '000', label: '000 — No aplica' },
                        ...detracciones
                          .filter((detraccion) => detraccion.codigo !== '000')
                          .map((detraccion) => ({
                            value: detraccion.codigo,
                            label: `${detraccion.codigo} — ${detraccion.nombre} (${detraccion.tasa}%)`,
                          })),
                      ]}
                      isDisabled={loading}
                    />
                  </Campo>
                </div>
              </div>
            </div>
          </Seccion>
        </div>

        <div className="min-w-0 lg:col-span-8">
          <Seccion
            numero="03"
            titulo="Detalle de la venta"
            descripcion="Productos o servicios incluidos en el comprobante."
            acciones={
              <Button
                variant="outline"
                onPress={() => setFilas((actual) => [...actual, filaVacia()])}
                startIcon={<Icon name="plus" className="size-4" />}
              >
                Agregar línea
              </Button>
            }
          >
            <div className="flex flex-col gap-6">
              <Campo etiqueta="Agregar producto del catálogo">
                <Select
                  ariaLabel="Agregar producto del catálogo"
                  value=""
                  onChange={agregarProducto}
                  options={productos.map((producto) => ({
                    value: producto.id,
                    label: `${producto.codigo} — ${producto.descripcion}`,
                  }))}
                  placeholder={loading ? 'Cargando productos…' : 'Seleccionar producto…'}
                  isDisabled={loading}
                />
              </Campo>

              {errorDe('items') && (
                <p role="alert" className="text-sm font-medium text-error-primary">
                  {errorDe('items')}
                </p>
              )}

              <div className="flex flex-col gap-4">
                {filas.map((fila, indice) => (
                  <div
                    key={fila.id}
                    className="rounded-xl bg-secondary p-4 ring-1 ring-tertiary ring-inset"
                  >
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-primary text-xs font-semibold text-brand-secondary ring-1 ring-brand ring-inset">
                          {indice + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-primary">
                            {fila.descripcion.trim() || `Ítem ${indice + 1}`}
                          </p>
                          <p className="truncate text-xs text-tertiary">
                            {fila.codigo.trim() || 'Sin código'} · {fila.unidad}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-sm font-semibold text-primary tabular-nums">
                          {redondear(fila.cantidad * fila.precioUnitario).toFixed(2)}
                        </span>
                        <Button
                          variant="ghost"
                          onPress={() => quitarFila(fila.id)}
                          isDisabled={filas.length === 1}
                          aria-label={`Quitar ítem ${indice + 1}`}
                          startIcon={<Icon name="trash" className="size-4" />}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7">
                      <Campo etiqueta="Código" error={errorDe(`item.${fila.id}.codigo`)}>
                        <input
                          aria-label="Código"
                          value={fila.codigo}
                          onChange={(e) => actualizarFila(fila.id, { codigo: e.target.value })}
                          className={claseConError(`item.${fila.id}.codigo`)}
                          aria-invalid={Boolean(errorDe(`item.${fila.id}.codigo`))}
                        />
                      </Campo>
                      <Campo
                        etiqueta="Descripción"
                        className="col-span-2 sm:col-span-2 2xl:col-span-2"
                        error={errorDe(`item.${fila.id}.descripcion`)}
                      >
                        <input
                          aria-label="Descripción"
                          value={fila.descripcion}
                          onChange={(e) => actualizarFila(fila.id, { descripcion: e.target.value })}
                          className={claseConError(`item.${fila.id}.descripcion`)}
                          aria-invalid={Boolean(errorDe(`item.${fila.id}.descripcion`))}
                        />
                      </Campo>
                      <Campo etiqueta="Unidad" error={errorDe(`item.${fila.id}.unidad`)}>
                        <input
                          aria-label="Unidad de medida"
                          value={fila.unidad}
                          onChange={(e) => actualizarFila(fila.id, { unidad: e.target.value })}
                          className={claseConError(`item.${fila.id}.unidad`)}
                          aria-invalid={Boolean(errorDe(`item.${fila.id}.unidad`))}
                        />
                      </Campo>
                      <Campo etiqueta="Cantidad" error={errorDe(`item.${fila.id}.cantidad`)}>
                        <input
                          aria-label="Cantidad"
                          type="number"
                          min={0}
                          step="0.01"
                          value={fila.cantidad}
                          onChange={(e) =>
                            actualizarFila(fila.id, { cantidad: Number(e.target.value) })
                          }
                          className={claseConError(`item.${fila.id}.cantidad`)}
                          aria-invalid={Boolean(errorDe(`item.${fila.id}.cantidad`))}
                        />
                      </Campo>
                      <Campo
                        etiqueta="Precio unitario"
                        error={errorDe(`item.${fila.id}.precioUnitario`)}
                      >
                        <input
                          aria-label="Precio unitario"
                          type="number"
                          min={0}
                          step="0.01"
                          value={fila.precioUnitario}
                          onChange={(e) =>
                            actualizarFila(fila.id, { precioUnitario: Number(e.target.value) })
                          }
                          className={claseConError(`item.${fila.id}.precioUnitario`)}
                          aria-invalid={Boolean(errorDe(`item.${fila.id}.precioUnitario`))}
                        />
                      </Campo>
                      <Campo
                        etiqueta="IGV %"
                        error={errorDe(`item.${fila.id}.igv`)}
                        pista={fila.igv === 0 ? 'Exonerado' : undefined}
                      >
                        <input
                          aria-label="IGV porcentaje"
                          type="number"
                          min={0}
                          max={100}
                          step="1"
                          value={fila.igv}
                          onChange={(e) => actualizarFila(fila.id, { igv: Number(e.target.value) })}
                          className={claseConError(`item.${fila.id}.igv`)}
                          aria-invalid={Boolean(errorDe(`item.${fila.id}.igv`))}
                        />
                      </Campo>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Seccion>
        </div>

        <div className="min-w-0 lg:col-span-4">
          <Card className="h-max lg:sticky lg:top-20">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-secondary px-4 py-4 lg:px-6">
              <div className="min-w-0">
                <h2 className="text-md font-semibold text-primary">Resumen de la venta</h2>
                <p className="text-sm text-tertiary">Revisa el importe antes de emitir.</p>
              </div>
              <Badge tone="gray" className="px-3 py-1">
                {form.moneda} · {form.tipoComprobante === 'BOLETA' ? 'B001' : 'F001'}
              </Badge>
            </div>
            <div className="flex flex-col gap-5 p-4 lg:p-6">
              <dl className="flex flex-col gap-3">
                <FilaResumen
                  etiqueta="Subtotal"
                  valor={redondear(totales.subtotal).toFixed(2)}
                />
                <FilaResumen etiqueta="IGV" valor={redondear(totales.igv).toFixed(2)} />
                {detraccionSeleccionada && detraccionSeleccionada.codigo !== '000' && (
                  <FilaResumen
                    etiqueta={`Detracción ${detraccionSeleccionada.codigo} (${detraccionSeleccionada.tasa}%)`}
                    valor={montoDetraccion.toFixed(2)}
                  />
                )}
                <FilaResumen etiqueta={`Ítems (${filas.length})`} valor={filas.length.toString()} />
              </dl>

              <div className="rounded-xl bg-brand-primary p-4 ring-1 ring-brand ring-inset">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-primary">Importe total</p>
                    <p className="text-xs text-tertiary">Incluye IGV</p>
                  </div>
                  <Badge tone="brand">{form.moneda}</Badge>
                </div>
                <p className="mt-3 text-3xl leading-tight font-semibold text-primary tabular-nums">
                  {redondear(totales.total).toFixed(2)}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  fullWidth
                  onPress={() => void emitirComprobante()}
                  isLoading={emitiendo}
                  startIcon={<Icon name="send" className="size-4" />}
                >
                  {form.tipoComprobante === 'FACTURA' ? 'Emitir factura' : 'Emitir boleta'}
                </Button>
                <Button
                  fullWidth
                  variant="outline"
                  onPress={() => setVistaPrevia(true)}
                  startIcon={<Icon name="eye" className="size-4" />}
                >
                  Vista previa
                </Button>
              </div>

              <p className="text-xs text-tertiary">
                La emisión usa el proveedor configurado en el servidor; la vista previa no envía
                nada.
              </p>
            </div>
          </Card>
        </div>
      </div>

      {vistaPrevia && (
        <div
          className="overlay-vista-previa fixed inset-0 z-50 overflow-y-auto bg-black/60 p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Vista previa del comprobante"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setVistaPrevia(false)
          }}
        >
          <div className="mx-auto flex w-full max-w-[80mm] flex-col gap-3">
            <div className="no-print flex flex-wrap items-center justify-between gap-2 rounded-lg bg-primary p-2 shadow-lg ring-1 ring-tertiary ring-inset">
              <span className="px-2 text-xs font-medium text-tertiary">
                Vista previa · no envía a SUNAT
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onPress={() => window.print()}
                  startIcon={<Icon name="file-text" className="size-3.5" />}
                >
                  Imprimir
                </Button>
                <Button
                  variant="ghost"
                  onPress={() => setVistaPrevia(false)}
                  aria-label="Cerrar vista previa"
                  startIcon={<Icon name="close" className="size-3.5" />}
                />
              </div>
            </div>
            <BoletaPreview
              tipo={form.tipoComprobante}
              empresa={{
                ruc: empresa?.ruc ?? '',
                razonSocial: empresa?.razonSocial ?? 'MUEBLERIA JOSE',
                direccion: empresa?.direccion ?? '',
                distrito: empresa?.distrito ?? '',
              }}
              cliente={{
                nombre: form.nombreCliente,
                numeroDocumento: form.numeroDocumento,
                direccion: form.direccionCliente,
                telefono: form.telefono,
              }}
              tipoDocumento={
                form.tipoComprobante === 'FACTURA'
                  ? 'RUC'
                  : form.tipoDocumento === 'cee'
                    ? 'CE'
                    : form.tipoDocumento.toUpperCase()
              }
              fecha={hoyEnLima()}
              formaPago={form.formaPago}
              condicionesPago={form.condicionesPago}
              moneda={form.moneda}
              tipoCambio={form.tipoCambio}
              items={filas
                .filter((f) => f.cantidad > 0 && f.precioUnitario > 0)
                .map((f) => ({
                  codigo: f.codigo,
                  descripcion: f.descripcion,
                  unidad: f.unidad,
                  cantidad: f.cantidad,
                  precioUnitario: f.precioUnitario,
                  total: f.cantidad * f.precioUnitario,
                }))}
              subtotal={redondear(totales.subtotal)}
              igv={redondear(totales.igv)}
              total={redondear(totales.total)}
              detraccion={
                detraccionSeleccionada && detraccionSeleccionada.codigo !== '000'
                  ? { ...detraccionSeleccionada, monto: montoDetraccion }
                  : null
              }
            />
          </div>
        </div>
      )}
    </div>
  )
}
