import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ImpresionA4, imprimirA4 } from '@/shared/components/ImpresionA4'
import { useAsyncData } from '@/shared/hooks/useAsyncData'
import { fechaCorta, numeroComprobante } from '@/shared/utils/format'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { Card, CardHeader } from '@/shared/ui/Card'
import { inputClass } from '@/shared/ui/FormSection'
import { Icon } from '@/shared/ui/icons'
import { PageHeader } from '@/shared/ui/PageHeader'
import { GuiaDetalleSkeleton } from '@/shared/ui/PaginasSkeleton'
import { configuracionService } from '@/modules/configuracion/service/configuracionService'
import {
  EstadoGuiaBadge,
  EstadoGuiaSunatBadge,
  ETIQUETAS_MOTIVO,
  ETIQUETAS_MODALIDAD,
} from '../components/guiaUi'
import { guiasService } from '../service/guiasService'

export function GuiaDetallePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, error, loading, reload } = useAsyncData(
    () =>
      id
        ? Promise.all([guiasService.obtener(id), configuracionService.obtener()])
        : Promise.reject(new Error('Falta el identificador de la guía.')),
    [id],
  )
  const [motivo, setMotivo] = useState('')
  const [anulando, setAnulando] = useState(false)
  const [reenviando, setReenviando] = useState(false)
  const [actualizando, setActualizando] = useState(false)
  const [errorAccion, setErrorAccion] = useState<string | null>(null)

  const guia = data?.[0]
  const empresa = data?.[1]?.empresa

  async function anular() {
    if (!guia) return
    setAnulando(true)
    setErrorAccion(null)
    try {
      await guiasService.anular(guia.id, motivo)
      setMotivo('')
      reload()
    } catch (err) {
      setErrorAccion(err instanceof Error ? err.message : 'No se pudo anular la guía.')
    } finally {
      setAnulando(false)
    }
  }

  async function reenviar() {
    if (!guia) return
    setReenviando(true)
    setErrorAccion(null)
    try {
      await guiasService.reenviar(guia.id)
      reload()
    } catch (err) {
      setErrorAccion(err instanceof Error ? err.message : 'No se pudo reenviar la guía.')
    } finally {
      setReenviando(false)
    }
  }

  async function actualizarEstado() {
    if (!guia) return
    setActualizando(true)
    setErrorAccion(null)
    try {
      await guiasService.actualizarEstado(guia.id)
      reload()
    } catch (err) {
      setErrorAccion(err instanceof Error ? err.message : 'No se pudo consultar el estado en SUNAT.')
    } finally {
      setActualizando(false)
    }
  }

  if (loading) return <GuiaDetalleSkeleton />

  if (error || !guia || !empresa) {
    return (
      <div className="px-4 lg:px-8">
        <PageHeader title="Guía de remisión" />
        <Alert tone="error" title="No se pudo cargar la guía">
          {error?.message ?? 'No hay datos para mostrar.'}
        </Alert>
        <div className="mt-4">
          <Link to="/guias" className="text-sm font-medium text-tertiary hover:text-primary">
            Volver al listado
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="no-print px-4 lg:px-8">
        <PageHeader
          title={`Guía ${numeroComprobante(guia.serie, guia.numero)}`}
          description="Guía electrónica enviada a SUNAT por la API REST. Usa Imprimir para guardarla como PDF."
          actions={
            <>
              <Button
                size="sm"
                variant="ghost"
                onPress={() => navigate('/guias')}
                startIcon={<Icon name="arrow-left" className="size-4" />}
              >
                Volver al listado
              </Button>
              <Button size="sm" onClick={imprimirA4} startIcon={<Icon name="file-text" className="size-4" />}>
                Imprimir / guardar PDF
              </Button>
            </>
          }
        />

        <Card className="mb-4">
          <CardHeader
            title="Estado de la guía"
            description={`${ETIQUETAS_MOTIVO[guia.motivo]} · ${ETIQUETAS_MODALIDAD[guia.modalidad]}`}
            density="compact"
            actions={
              <div className="flex flex-wrap items-center gap-2">
                <EstadoGuiaSunatBadge estado={guia.estadoSunat} />
                <EstadoGuiaBadge estado={guia.estado} />
              </div>
            }
          />
          <div className="flex flex-wrap items-center gap-3 border-t border-tertiary p-4">
            {(guia.estadoSunat === 'ERROR_ENVIO' || guia.estadoSunat === 'RECHAZADO') &&
              guia.estado !== 'ANULADA' && (
                <Button
                  size="sm"
                  variant="outline"
                  isLoading={reenviando}
                  onPress={() => void reenviar()}
                  startIcon={<Icon name="refresh" className="size-4" />}
                >
                  Reenviar a SUNAT
                </Button>
              )}
            {guia.estadoSunat === 'PENDIENTE' && guia.sunatTicket && (
              <Button
                size="sm"
                variant="outline"
                isLoading={actualizando}
                onPress={() => void actualizarEstado()}
                startIcon={<Icon name="refresh" className="size-4" />}
              >
                Actualizar estado
              </Button>
            )}
            {guia.comprobante && (
              <Button
                size="sm"
                variant="outline"
                onPress={() => navigate(`/comprobantes/${guia.comprobante!.id}`)}
                startIcon={<Icon name="receipt" className="size-4" />}
              >
                Comprobante {numeroComprobante(guia.comprobante.serie, guia.comprobante.numero)}
              </Button>
            )}
            {guia.estado === 'EMITIDA' && (
              <form
                className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center"
                onSubmit={(evento) => {
                  evento.preventDefault()
                  void anular()
                }}
              >
                <input
                  type="text"
                  value={motivo}
                  onChange={(evento) => setMotivo(evento.target.value)}
                  placeholder="Motivo de la anulación"
                  minLength={5}
                  maxLength={500}
                  required
                  className={inputClass}
                />
                <Button type="submit" variant="danger" isLoading={anulando}>
                  Anular guía
                </Button>
              </form>
            )}
          </div>
          {errorAccion && (
            <div className="px-4 pb-4">
              <Alert tone="error">{errorAccion}</Alert>
            </div>
          )}
          {(guia.sunatCodigo || guia.sunatMensaje || guia.enviadoEn) && (
            <div className="border-t border-tertiary px-4 py-3 text-xs text-tertiary">
              {guia.sunatCodigo && <p>Código SUNAT: {guia.sunatCodigo}</p>}
              {guia.sunatTicket && <p className="break-all">Ticket SUNAT: {guia.sunatTicket}</p>}
              {guia.sunatMensaje && <p className="break-words">{guia.sunatMensaje}</p>}
              {guia.enviadoEn && (
                <p>
                  Último envío:{' '}
                  {new Date(guia.enviadoEn).toLocaleString('es-PE', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })}
                  {' · '}
                  {guia.tieneCdr ? 'Constancia CDR archivada' : 'Sin constancia CDR'}
                </p>
              )}
            </div>
          )}
          {guia.estado === 'ANULADA' && guia.motivoAnulacion && (
            <div className="px-4 pb-4">
              <Alert tone="warning" title="Guía anulada">
                {guia.motivoAnulacion}
              </Alert>
            </div>
          )}
        </Card>
      </div>

      <ImpresionA4 className="mx-auto max-w-3xl bg-white p-6 text-[#111] shadow-xs ring-1 ring-tertiary sm:p-8">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-[#111] pb-4">
          <div className="min-w-0">
            <p className="text-lg font-bold uppercase">{empresa.razonSocial}</p>
            <p className="text-xs">RUC {empresa.ruc}</p>
            <p className="text-xs">{empresa.direccion}</p>
          </div>
          <div className="text-end">
            <p className="text-xl font-bold">GUÍA DE REMISIÓN</p>
            <p className="font-mono text-sm">{numeroComprobante(guia.serie, guia.numero)}</p>
            {guia.estado === 'ANULADA' && (
              <p className="mt-1 text-sm font-bold">ANULADA</p>
            )}
            {guia.estadoSunat === 'ACEPTADO' && (
              <p className="mt-1 text-xs">Aceptada por SUNAT · Código {guia.sunatCodigo}</p>
            )}
          </div>
        </header>

        <section className="my-5 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <p className="text-[11px] uppercase text-[#555]">Destinatario</p>
            <p className="font-semibold">{guia.cliente}</p>
            <p className="text-xs">{guia.clienteDocumento}</p>
            <p className="text-xs">{guia.direccionLlegada}</p>
          </div>
          <div className="sm:text-end">
            <p className="text-[11px] uppercase text-[#555]">Fechas</p>
            <p>Emisión: {fechaCorta(`${guia.fechaEmision}`)}</p>
            <p>Traslado: {fechaCorta(`${guia.fechaTraslado}`)}</p>
            <p className="text-xs">Motivo: {ETIQUETAS_MOTIVO[guia.motivo]}</p>
            <p className="text-xs">Modalidad: {ETIQUETAS_MODALIDAD[guia.modalidad]}</p>
          </div>
        </section>

        <section className="mb-5 grid gap-3 border-y border-[#ddd] py-3 text-xs sm:grid-cols-2">
          <p><span className="font-semibold">Partida:</span> {guia.direccionPartida} {guia.ubigeoPartida ?? ''}</p>
          <p><span className="font-semibold">Llegada:</span> {guia.direccionLlegada} {guia.ubigeoLlegada ?? ''}</p>
          {guia.pesoKg !== null && <p><span className="font-semibold">Peso:</span> {guia.pesoKg} kg</p>}
          {guia.placa && <p><span className="font-semibold">Placa:</span> {guia.placa}</p>}
          {guia.conductor && <p><span className="font-semibold">Conductor:</span> {guia.conductor}</p>}
          {guia.conductorDocumento && (
            <p><span className="font-semibold">Doc. conductor:</span> {guia.conductorDocumento}</p>
          )}
          {guia.conductorLicencia && (
            <p><span className="font-semibold">Licencia:</span> {guia.conductorLicencia}</p>
          )}
          {guia.transportistaRazonSocial && (
            <p><span className="font-semibold">Transportista:</span> {guia.transportistaRazonSocial}</p>
          )}
          {guia.comprobante && (
            <p>
              <span className="font-semibold">Comprobante:</span>{' '}
              {numeroComprobante(guia.comprobante.serie, guia.comprobante.numero)}
            </p>
          )}
        </section>

        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-y border-[#111]">
              <th className="py-2 text-start">Descripción</th>
              <th className="py-2 text-end">Cantidad</th>
            </tr>
          </thead>
          <tbody>
            {guia.items.map((item) => (
              <tr key={item.id} className="border-b border-[#ddd]">
                <td className="py-2 break-words">{item.descripcion}</td>
                <td className="py-2 text-end tabular-nums">{item.cantidad}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {guia.notas && (
          <p className="mt-6 whitespace-pre-wrap text-xs">
            <span className="font-semibold">Notas:</span> {guia.notas}
          </p>
        )}
        {guia.motivoAnulacion && (
          <p className="mt-3 text-xs">
            <span className="font-semibold">Motivo de anulación:</span> {guia.motivoAnulacion}
          </p>
        )}

        <footer className="mt-10 flex justify-between gap-6 text-xs">
          <p className="border-t border-[#111] pt-2 text-center">Recibido por</p>
          <p className="border-t border-[#111] pt-2 text-center">Transportista</p>
        </footer>
      </ImpresionA4>
    </>
  )
}
