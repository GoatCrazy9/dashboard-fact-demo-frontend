import { useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { LineasProducto, type LineaProducto } from '@/shared/components/LineasProducto'
import { useAsyncData } from '@/shared/hooks/useAsyncData'
import { hoyEnLima } from '@/shared/utils/fechas'
import { numeroComprobante } from '@/shared/utils/format'
import { Alert } from '@/shared/ui/Alert'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { Campo, inputClass } from '@/shared/ui/FormSection'
import { Icon, type IconName } from '@/shared/ui/icons'
import { NuevaGuiaSkeleton } from '@/shared/ui/ListadoSkeleton'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Select } from '@/shared/ui/Select'
import { clientesService } from '@/modules/clientes/service/clientesService'
import { comprobantesService } from '@/modules/comprobantes/service/comprobantesService'
import { productosService } from '@/modules/productos/service/productosService'
import type { ModalidadGuia, MotivoGuia } from '@/shared/types'
import { ETIQUETAS_MODALIDAD, ETIQUETAS_MOTIVO } from '../components/guiaUi'
import { guiasService } from '../service/guiasService'

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
  children,
}: {
  numero: string
  titulo: string
  descripcion: string
  icono: IconName
  children: ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-2xl bg-primary shadow-xs ring-1 ring-tertiary ring-inset">
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
      </div>
      <div className="p-4 lg:p-6">{children}</div>
    </section>
  )
}

export function NuevaGuiaPage() {
  const navigate = useNavigate()
  const { data, error, loading } = useAsyncData(
    () =>
      Promise.all([
        clientesService.listar(),
        productosService.listar(),
        comprobantesService.listar(),
      ]),
    [],
  )
  const [clientes, productos, comprobantes] = data ?? [[], [], []]

  const [fechaEmision, setFechaEmision] = useState(hoyEnLima)
  const [fechaTraslado, setFechaTraslado] = useState(hoyEnLima)
  const [clienteId, setClienteId] = useState('')
  const [motivo, setMotivo] = useState<MotivoGuia>('VENTA')
  const [modalidad, setModalidad] = useState<ModalidadGuia>('PRIVADO')
  const [pesoKg, setPesoKg] = useState('')
  const [direccionPartida, setDireccionPartida] = useState('')
  const [direccionLlegada, setDireccionLlegada] = useState('')
  const [ubigeoPartida, setUbigeoPartida] = useState('')
  const [ubigeoLlegada, setUbigeoLlegada] = useState('')
  const [placa, setPlaca] = useState('')
  const [conductor, setConductor] = useState('')
  const [conductorDocumento, setConductorDocumento] = useState('')
  const [conductorLicencia, setConductorLicencia] = useState('')
  const [transportistaRuc, setTransportistaRuc] = useState('')
  const [transportistaRazonSocial, setTransportistaRazonSocial] = useState('')
  const [transportistaRegistroMtc, setTransportistaRegistroMtc] = useState('')
  const [comprobanteId, setComprobanteId] = useState('')
  const [notas, setNotas] = useState('')
  const [lineas, setLineas] = useState<LineaProducto[]>([
    { id: crypto.randomUUID(), productoId: '', cantidad: 1 },
  ])
  const [guardando, setGuardando] = useState(false)
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null)

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    setErrorEnvio(null)

    if (!clienteId) return setErrorEnvio('Selecciona un cliente.')
    if (fechaTraslado < fechaEmision) {
      return setErrorEnvio('La fecha de traslado no puede ser anterior a la emisión.')
    }
    const items = lineas.filter((linea) => linea.productoId && linea.cantidad > 0)
    if (items.length === 0) return setErrorEnvio('Agrega al menos un producto.')
    if (modalidad === 'PUBLICO' && (!placa.trim() || !conductor.trim())) {
      return setErrorEnvio('El traslado público exige placa y conductor.')
    }
    if (
      modalidad === 'PUBLICO' &&
      (!conductorDocumento.trim() || !conductorLicencia.trim())
    ) {
      return setErrorEnvio('El traslado público exige documento y licencia del conductor.')
    }
    if (
      transportistaRuc.trim() &&
      (!transportistaRazonSocial.trim() || !transportistaRegistroMtc.trim())
    ) {
      return setErrorEnvio('Si indicas transportista, falta su razón social o registro MTC.')
    }
    if (!pesoKg || Number(pesoKg) <= 0) {
      return setErrorEnvio('El peso bruto es obligatorio para el envío a SUNAT.')
    }

    setGuardando(true)
    try {
      const creada = await guiasService.crear({
        fechaEmision,
        fechaTraslado,
        clienteId,
        motivo,
        modalidad,
        pesoKg: Number(pesoKg),
        direccionPartida,
        direccionLlegada,
        ubigeoPartida,
        ubigeoLlegada,
        placa,
        conductor,
        conductorDocumento,
        conductorLicencia,
        transportistaRuc,
        transportistaRazonSocial,
        transportistaRegistroMtc,
        comprobanteId: comprobanteId || undefined,
        notas,
        items: items.map((linea) => ({
          productoId: linea.productoId,
          cantidad: linea.cantidad,
        })),
      })
      navigate(`/guias/${creada.id}`)
    } catch (err) {
      setErrorEnvio(err instanceof Error ? err.message : 'No se pudo guardar la guía.')
    } finally {
      setGuardando(false)
    }
  }

  if (loading) return <NuevaGuiaSkeleton />

  const lineasValidas = lineas.filter((linea) => linea.productoId)
  const unidades = lineasValidas.reduce((suma, linea) => suma + linea.cantidad, 0)

  return (
    <div className="flex flex-col">
      <div className="no-print w-full px-4 pt-6 lg:px-8">
        {error && (
          <div className="mb-6">
            <Alert tone="error" title="No se pudieron cargar los datos del formulario">
              {error.message}
            </Alert>
          </div>
        )}

        <PageHeader
          title="Nueva guía de remisión"
          description="Serie T001 · correlativo reservado en el servidor y emisión enviada a SUNAT por API REST."
          actions={
            <>
              <Badge tone="brand" className="px-3 py-1">
                <Icon name="check" className="size-3.5" />
                Envío a SUNAT
              </Badge>
              <Button
                variant="outline"
                onPress={() => navigate('/guias')}
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
            titulo="Datos del traslado"
            descripcion="Documento, cliente y motivo del traslado."
            icono="calendar"
          >
            <Subtitulo>Vigencia y destinatario</Subtitulo>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Campo etiqueta="Fecha de emisión" pista="Fecha de Lima">
                <input
                  type="date"
                  value={fechaEmision}
                  onChange={(evento) => setFechaEmision(evento.target.value)}
                  className={inputClass}
                  required
                />
              </Campo>
              <Campo etiqueta="Fecha de traslado">
                <input
                  type="date"
                  value={fechaTraslado}
                  min={fechaEmision}
                  onChange={(evento) => setFechaTraslado(evento.target.value)}
                  className={inputClass}
                  required
                />
              </Campo>
              <Campo etiqueta="Cliente" className="sm:col-span-2">
                <Select
                  ariaLabel="Cliente"
                  value={clienteId}
                  onChange={setClienteId}
                  placeholder="Seleccionar cliente…"
                  options={clientes.map((cliente) => ({
                    value: cliente.id,
                    label: `${cliente.numeroDocumento} — ${cliente.razonSocial}`,
                  }))}
                  isRequired
                />
              </Campo>
            </div>

            <div className="mt-6 border-t border-secondary pt-6">
              <Subtitulo>Clasificación</Subtitulo>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Campo etiqueta="Motivo">
                  <Select
                    ariaLabel="Motivo"
                    value={motivo}
                    onChange={(valor) => setMotivo(valor as MotivoGuia)}
                    options={(Object.keys(ETIQUETAS_MOTIVO) as MotivoGuia[]).map((valor) => ({
                      value: valor,
                      label: ETIQUETAS_MOTIVO[valor],
                    }))}
                  />
                </Campo>
                <Campo etiqueta="Modalidad">
                  <Select
                    ariaLabel="Modalidad"
                    value={modalidad}
                    onChange={(valor) => setModalidad(valor as ModalidadGuia)}
                    options={(Object.keys(ETIQUETAS_MODALIDAD) as ModalidadGuia[]).map((valor) => ({
                      value: valor,
                      label: ETIQUETAS_MODALIDAD[valor],
                    }))}
                  />
                </Campo>
                <Campo etiqueta="Peso bruto (kg)" pista="Obligatorio, hasta 3 decimales.">
                  <input
                    type="number"
                    min={0.001}
                    step={0.001}
                    value={pesoKg}
                    onChange={(evento) => setPesoKg(evento.target.value)}
                    className={inputClass}
                    required
                  />
                </Campo>
                <Campo etiqueta="Comprobante asociado" pista="Opcional">
                  <Select
                    ariaLabel="Comprobante asociado"
                    value={comprobanteId}
                    onChange={setComprobanteId}
                    placeholder="Ninguno"
                    options={comprobantes.map((comprobante) => ({
                      value: comprobante.id,
                      label: `${comprobante.tipo} ${numeroComprobante(comprobante.serie, comprobante.numero)} — ${comprobante.cliente}`,
                    }))}
                  />
                </Campo>
              </div>
            </div>
          </Seccion>

          <Seccion
            numero="02"
            titulo="Ruta y transporte"
            descripcion="Direcciones de partida y llegada."
            icono="truck"
          >
            <Subtitulo>Origen y destino</Subtitulo>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Campo etiqueta="Dirección de partida" className="sm:col-span-2">
                <input
                  type="text"
                  value={direccionPartida}
                  onChange={(evento) => setDireccionPartida(evento.target.value)}
                  className={inputClass}
                  required
                  minLength={5}
                  maxLength={300}
                  placeholder="Calle, número y referencia de origen"
                />
              </Campo>
              <Campo etiqueta="Ubigeo de partida" pista="6 dígitos">
                <input
                  type="text"
                  value={ubigeoPartida}
                  onChange={(evento) => setUbigeoPartida(evento.target.value)}
                  className={inputClass}
                  inputMode="numeric"
                  pattern="\d{6}"
                  title="6 dígitos"
                  placeholder="150101"
                />
              </Campo>
              <Campo etiqueta="Dirección de llegada" className="sm:col-span-2">
                <input
                  type="text"
                  value={direccionLlegada}
                  onChange={(evento) => setDireccionLlegada(evento.target.value)}
                  className={inputClass}
                  required
                  minLength={5}
                  maxLength={300}
                  placeholder="Calle, número y referencia de destino"
                />
              </Campo>
              <Campo etiqueta="Ubigeo de llegada" pista="6 dígitos">
                <input
                  type="text"
                  value={ubigeoLlegada}
                  onChange={(evento) => setUbigeoLlegada(evento.target.value)}
                  className={inputClass}
                  inputMode="numeric"
                  pattern="\d{6}"
                  title="6 dígitos"
                  placeholder="150101"
                />
              </Campo>
            </div>

            <div className="mt-6 border-t border-secondary pt-6">
              <Subtitulo>Transporte</Subtitulo>
              {modalidad === 'PUBLICO' ? (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Campo etiqueta="Placa" pista="Obligatoria en traslado público">
                      <input
                        type="text"
                        value={placa}
                        onChange={(evento) => setPlaca(evento.target.value)}
                        className={inputClass}
                        required
                        maxLength={20}
                        placeholder="ABC-123"
                      />
                    </Campo>
                    <Campo etiqueta="Conductor" pista="Obligatorio en traslado público">
                      <input
                        type="text"
                        value={conductor}
                        onChange={(evento) => setConductor(evento.target.value)}
                        className={inputClass}
                        required
                        maxLength={100}
                        placeholder="Nombre y apellidos"
                      />
                    </Campo>
                    <Campo etiqueta="Documento del conductor" pista="DNI o similar">
                      <input
                        type="text"
                        value={conductorDocumento}
                        onChange={(evento) => setConductorDocumento(evento.target.value)}
                        className={inputClass}
                        required
                        maxLength={20}
                        placeholder="12345678"
                      />
                    </Campo>
                    <Campo etiqueta="Licencia de conducir">
                      <input
                        type="text"
                        value={conductorLicencia}
                        onChange={(evento) => setConductorLicencia(evento.target.value)}
                        className={inputClass}
                        required
                        maxLength={20}
                        placeholder="Q12345678"
                      />
                    </Campo>
                  </div>
                  <div className="border-t border-secondary pt-5">
                    <p className="mb-3 text-sm font-medium text-secondary">
                      Transportista externo <span className="text-tertiary">(opcional)</span>
                    </p>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Campo etiqueta="RUC del transportista">
                        <input
                          type="text"
                          value={transportistaRuc}
                          onChange={(evento) => setTransportistaRuc(evento.target.value)}
                          className={inputClass}
                          inputMode="numeric"
                          maxLength={11}
                          placeholder="20123456789"
                        />
                      </Campo>
                      <Campo etiqueta="Razón social">
                        <input
                          type="text"
                          value={transportistaRazonSocial}
                          onChange={(evento) => setTransportistaRazonSocial(evento.target.value)}
                          className={inputClass}
                          maxLength={150}
                          placeholder="Transportista S.A.C."
                        />
                      </Campo>
                      <Campo etiqueta="Registro MTC" className="sm:col-span-2">
                        <input
                          type="text"
                          value={transportistaRegistroMtc}
                          onChange={(evento) => setTransportistaRegistroMtc(evento.target.value)}
                          className={inputClass}
                          maxLength={20}
                          placeholder="Número de registro"
                        />
                      </Campo>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2 rounded-lg bg-tertiary/50 p-3 text-xs text-tertiary">
                  <Icon name="check" className="mt-0.5 size-4 shrink-0 text-success-primary" />
                  <p>Traslado privado: no se requiere placa ni conductor.</p>
                </div>
              )}
            </div>

            <div className="mt-6 border-t border-secondary pt-6">
              <Campo etiqueta="Referencias del traslado" className="max-w-2xl">
                <textarea
                  value={notas}
                  onChange={(evento) => setNotas(evento.target.value)}
                  className={`${inputClass} h-auto py-2`}
                  rows={3}
                  maxLength={500}
                  placeholder="Ej. pedido del cliente, entrega en obra, persona que recibe…"
                />
              </Campo>
            </div>
          </Seccion>

          <Seccion
            numero="03"
            titulo="Productos trasladados"
            descripcion="Mercadería del catálogo que sale del local."
            icono="package"
          >
            <Subtitulo>Mercadería</Subtitulo>
            <LineasProducto lineas={lineas} productos={productos} onChange={setLineas} />
          </Seccion>
        </div>

        <div className="min-w-0 lg:col-span-4">
          <section className="overflow-hidden rounded-2xl bg-primary shadow-xs ring-1 ring-tertiary ring-inset lg:sticky lg:top-20">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-secondary px-4 py-4 lg:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-primary text-brand-secondary">
                  <Icon name="package" className="size-4" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-md font-semibold text-primary">Resumen</h2>
                  <p className="text-sm text-tertiary">
                    Serie T001 · {lineasValidas.length}{' '}
                    {lineasValidas.length === 1 ? 'producto' : 'productos'}
                  </p>
                </div>
              </div>
              <Badge tone="brand">API REST SUNAT</Badge>
            </div>

            <div className="p-4 lg:p-6">
              <div className="rounded-xl bg-secondary p-4 ring-1 ring-tertiary ring-inset">
                <div className="grid grid-cols-2 gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-tertiary">Productos</p>
                    <p className="mt-0.5 text-sm font-medium text-secondary tabular-nums">
                      {lineasValidas.length}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-tertiary">Unidades</p>
                    <p className="mt-0.5 text-sm font-medium text-secondary tabular-nums">
                      {unidades}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-end justify-between gap-3 border-t border-tertiary pt-4">
                  <div>
                    <p className="text-xs font-medium text-tertiary uppercase">Peso bruto</p>
                    <p className="mt-1 text-xs text-tertiary">Requerido por SUNAT</p>
                  </div>
                  <p className="text-2xl font-semibold text-primary tabular-nums">
                    {pesoKg === '' ? '—' : `${pesoKg} kg`}
                  </p>
                </div>
              </div>

              {errorEnvio && (
                <div className="mt-5">
                  <Alert tone="error" title="Revisa la guía">
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
                  startIcon={<Icon name="truck" className="size-4" />}
                >
                  Emitir y enviar a SUNAT
                </Button>
              </div>

              <div className="mt-5 flex gap-2 rounded-lg bg-tertiary/50 p-3 text-xs text-tertiary">
                <Icon name="warning" className="mt-0.5 size-4 shrink-0 text-fg-warning-primary" />
                <p>
                  La guía se envía a SUNAT antes de considerarse emitida. Si SUNAT rechaza o
                  no responde, verás el motivo y podrás reenviarla desde el detalle.
                  No descuenta stock.
                </p>
              </div>
            </div>
          </section>
        </div>
      </form>
    </div>
  )
}
