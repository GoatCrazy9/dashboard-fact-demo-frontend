import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ImpresionA4, imprimirA4 } from '@/shared/components/ImpresionA4'
import { useAsyncData } from '@/shared/hooks/useAsyncData'
import { descargarBlob } from '@/shared/utils/descargar'
import { fechaCorta, soles } from '@/shared/utils/format'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { Icon } from '@/shared/ui/icons'
import { configuracionService } from '@/modules/configuracion/service/configuracionService'
import type { ResumenSunat } from '@/shared/types'
import {
  EstadoResumenBadge,
  esRegistroLocal,
  ETIQUETAS_TIPO,
  ResumenDetalleSkeleton,
} from '../components/resumenUi'
import {
  resumenesService,
  type ArchivoResumen,
} from '../service/resumenesService'

const ARCHIVOS: { tipo: ArchivoResumen; etiqueta: string; clave: keyof ResumenSunat }[] = [
  { tipo: 'xml', etiqueta: 'XML', clave: 'archivoXmlKey' },
  { tipo: 'zip', etiqueta: 'ZIP', clave: 'archivoZipKey' },
  { tipo: 'cdr', etiqueta: 'CDR', clave: 'archivoCdrKey' },
]

export function ResumenDetallePage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { data, error, loading, reload } = useAsyncData(
    () =>
      id
        ? Promise.all([
            resumenesService.obtener(id),
            configuracionService.obtener(),
            resumenesService.configuracion(),
          ])
        : Promise.reject(new Error('Falta el identificador del resumen.')),
    [id],
  )
  const [accion, setAccion] = useState<'reenviar' | 'estado' | null>(null)
  const [errorAccion, setErrorAccion] = useState<string | null>(null)

  const resumen = data?.[0]
  const empresa = data?.[1]?.empresa
  const envioReal = data?.[2]?.envioReal ?? false

  async function ejecutar(tipo: 'reenviar' | 'estado') {
    if (!resumen) return
    setAccion(tipo)
    setErrorAccion(null)
    try {
      if (tipo === 'estado') await resumenesService.consultarEstado(resumen.id)
      else await resumenesService.reenviar(resumen.id)
      reload()
    } catch (err) {
      setErrorAccion(err instanceof Error ? err.message : 'No se pudo actualizar el resumen.')
    } finally {
      setAccion(null)
    }
  }

  async function descargar(tipo: ArchivoResumen) {
    if (!resumen) return
    setErrorAccion(null)
    try {
      const archivo = await resumenesService.descargarArchivo(resumen.id, tipo)
      descargarBlob(archivo.blob, archivo.filename)
    } catch (err) {
      setErrorAccion(err instanceof Error ? err.message : 'No se pudo descargar el archivo.')
    }
  }

  if (loading) return <ResumenDetalleSkeleton />

  if (error || !resumen || !empresa) {
    return (
      <div className="flex w-full flex-col gap-4 px-4 lg:px-8">
        <Alert tone="error" title="No se pudo cargar el resumen">
          {error?.message ?? 'No hay datos para mostrar.'}
        </Alert>
        <Button
          variant="outline"
          onPress={() => navigate('/resumenes')}
          startIcon={<Icon name="arrow-left" className="size-4" />}
        >
          Volver al listado
        </Button>
      </div>
    )
  }

  const subtotal = resumen.items.reduce((suma, item) => suma + item.subtotal, 0)
  const igv = resumen.items.reduce((suma, item) => suma + item.igv, 0)
  const total = resumen.items.reduce((suma, item) => suma + item.total, 0)
  const esBaja = resumen.tipo === 'COMUNICACION_BAJA'
  const esLocal = esRegistroLocal(resumen.codigoRespuesta)
  // Un timeout al consultar el CDR no invalida el ticket: se puede reintentar
  // mientras no exista constancia archivada, aunque el estado diga RECHAZADO.
  const puedeConsultar =
    envioReal && Boolean(resumen.sunatTicket) && !resumen.archivoCdrKey
  const archivos = ARCHIVOS.filter((archivo) => Boolean(resumen[archivo.clave]))

  return (
    <div className="flex flex-col">
      <div className="no-print mb-8 flex w-full flex-col gap-5 px-4 lg:px-8">
        {errorAccion && <Alert tone="error">{errorAccion}</Alert>}

        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="text-xl font-semibold text-primary">
              {ETIQUETAS_TIPO[resumen.tipo]} {resumen.numeroCompleto}
            </p>
            <p className="text-md text-tertiary">
              {envioReal
                ? `Registro enviado a SUNAT en modo ${data?.[2]?.modo === 'produccion' ? 'producción' : 'beta'}.`
                : 'Constancia local. No se realizó ningún envío a SUNAT.'}
            </p>
          </div>
          <div className="flex flex-wrap items-start gap-3">
            <Button
              variant="outline"
              onPress={() => navigate('/resumenes')}
              startIcon={<Icon name="arrow-left" className="size-4" />}
            >
              Volver al listado
            </Button>
            {puedeConsultar && (
              <Button
                variant="outline"
                onPress={() => void ejecutar('estado')}
                isLoading={accion === 'estado'}
                startIcon={<Icon name="clock" className="size-4" />}
              >
                Actualizar estado
              </Button>
            )}
            {/* Con ticket vigente, "Actualizar estado" consulta ese mismo ticket:
                reenviar crearía un envío duplicado. Si SUNAT lo invalida, limpia
                el ticket y aparece este botón para enviar uno nuevo. */}
            {!puedeConsultar && (
              <Button
                variant="outline"
                onPress={() => void ejecutar('reenviar')}
                isLoading={accion === 'reenviar'}
                startIcon={<Icon name="refresh" className="size-4" />}
              >
                {envioReal ? 'Reenviar a SUNAT' : 'Reenviar (local)'}
              </Button>
            )}
            <Button onPress={imprimirA4} startIcon={<Icon name="file-text" className="size-4" />}>
              Imprimir / guardar PDF
            </Button>
          </div>
        </div>

        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-secondary px-4 py-4 lg:px-6">
            <div className="min-w-0">
              <h2 className="text-md font-semibold text-primary">Estado del registro</h2>
              <p className="text-sm text-tertiary">
                {resumen.items.length} comprobantes · {resumen.reenvios} reenvíos
              </p>
            </div>
            <EstadoResumenBadge
              estado={resumen.estado}
              codigo={resumen.codigoRespuesta}
              sinCdr={puedeConsultar}
            />
          </div>
          <div className="space-y-3 p-4 text-sm lg:p-6">
            <p className="text-secondary">
              <span className="font-medium">Código:</span>{' '}
              <span className="font-mono text-xs break-all">{resumen.codigoRespuesta ?? '—'}</span>
            </p>
            <p className="text-secondary">{resumen.mensajeRespuesta ?? 'Sin mensaje registrado.'}</p>
            {resumen.sunatTicket && (
              <p className="text-secondary">
                <span className="font-medium">Ticket SUNAT:</span>{' '}
                <span className="font-mono text-xs break-all">{resumen.sunatTicket}</span>
              </p>
            )}
            {resumen.observacion && (
              <p className="text-secondary">
                <span className="font-medium">Observación:</span> {resumen.observacion}
              </p>
            )}
            {archivos.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {archivos.map((archivo) => (
                  <Button
                    key={archivo.tipo}
                    size="sm"
                    variant="outline"
                    onPress={() => void descargar(archivo.tipo)}
                    startIcon={<Icon name="download" className="size-4" />}
                  >
                    {archivo.etiqueta}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="w-full px-4 pb-4 lg:px-8">
        <ImpresionA4 className="mx-auto max-w-3xl bg-white p-6 text-[#111] shadow-xs ring-1 ring-tertiary sm:p-8">
          <header className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-[#111] pb-4">
            <div className="min-w-0">
              <p className="text-lg font-bold uppercase">{empresa.razonSocial}</p>
              <p className="text-xs">RUC {empresa.ruc}</p>
              <p className="text-xs">{empresa.direccion}</p>
            </div>
            <div className="text-end">
              <p className="text-lg font-bold uppercase">
                {esBaja ? 'Comunicación de baja' : 'Resumen diario'}
              </p>
              <p className="font-mono text-sm">{resumen.numeroCompleto}</p>
            </div>
          </header>

          <section className="my-5 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <p className="text-[11px] uppercase text-[#555]">Fecha de referencia</p>
              <p>{fechaCorta(`${resumen.fecha}`)}</p>
            </div>
            <div className="sm:text-end">
              <p className="text-[11px] uppercase text-[#555]">Resultado registrado</p>
              <p>{resumen.codigoRespuesta ?? '—'}</p>
              <p className="text-xs">
                {envioReal
                  ? resumen.estado === 'ACEPTADO'
                    ? 'Constancia recibida de SUNAT'
                    : 'Pendiente de constancia de SUNAT'
                  : 'Registro local sin envío a SUNAT'}
              </p>
            </div>
          </section>

          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-y border-[#111]">
                <th className="py-2 text-start">Comprobante</th>
                <th className="py-2 text-start">Cliente</th>
                <th className="py-2 text-end">Total</th>
              </tr>
            </thead>
            <tbody>
              {resumen.items.map((item) => (
                <tr key={item.id} className="border-b border-[#ddd] align-top">
                  <td className="py-2">
                    <span className="font-medium">{item.numeroCompleto}</span>
                    <span className="block text-xs">{item.tipoDocumento}</span>
                    {item.motivoBaja && (
                      <span className="block text-xs">Motivo: {item.motivoBaja}</span>
                    )}
                  </td>
                  <td className="py-2 break-words">{item.clienteDocumento}</td>
                  <td className="py-2 text-end tabular-nums">{soles(item.total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2} className="pt-3 text-end">Subtotal</td>
                <td className="pt-3 text-end tabular-nums">{soles(subtotal)}</td>
              </tr>
              <tr>
                <td colSpan={2} className="text-end">I.G.V.</td>
                <td className="text-end tabular-nums">{soles(igv)}</td>
              </tr>
              <tr className="text-base font-bold">
                <td colSpan={2} className="pt-2 text-end">Total</td>
                <td className="pt-2 text-end tabular-nums">{soles(total)}</td>
              </tr>
            </tfoot>
          </table>

          {resumen.observacion && (
            <p className="mt-6 whitespace-pre-wrap text-xs">
              <span className="font-semibold">Observación:</span> {resumen.observacion}
            </p>
          )}

          {resumen.sunatTicket && (
            <p className="mt-4 font-mono text-xs break-all">
              <span className="font-semibold">Ticket:</span> {resumen.sunatTicket}
            </p>
          )}

          <p className="mt-6 text-xs">
            <span className="font-semibold">Nota:</span>{' '}
            {envioReal
              ? esLocal
                ? 'Documento de control interno; su constancia local no reemplaza al CDR de SUNAT.'
                : 'Resumen y constancia registrados por la aplicación.'
              : 'Documento generado por la aplicación para control interno. No constituye constancia de recepción de SUNAT.'}
          </p>

          <footer className="mt-10 flex justify-between gap-6 text-xs">
            <p className="border-t border-[#111] pt-2 text-center">Generado por</p>
            <p className="border-t border-[#111] pt-2 text-center">Revisado por</p>
          </footer>
        </ImpresionA4>
      </div>
    </div>
  )
}
