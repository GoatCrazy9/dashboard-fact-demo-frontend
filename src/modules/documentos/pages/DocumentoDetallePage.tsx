import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAsyncData } from '@/shared/hooks/useAsyncData'
import { fechaISO } from '@/shared/utils/fechas'
import { fechaCorta, numeroComprobante } from '@/shared/utils/format'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { Campo, inputClass } from '@/shared/ui/FormSection'
import { Icon } from '@/shared/ui/icons'
import { PageHeader } from '@/shared/ui/PageHeader'
import { DocumentoDetalleSkeleton } from '@/shared/ui/PaginasSkeleton'
import { Select } from '@/shared/ui/Select'
import { configuracionService } from '@/modules/configuracion/service/configuracionService'
import type { DocumentoVenta, EstadoDocumentoVenta } from '@/shared/types'
import { EstadoDocumentoBadge, ETIQUETAS_DOCUMENTO } from '../components/documentoUi'
import { TicketDocumento } from '../components/TicketDocumento'
import { documentosService } from '../service/documentosService'

export function DocumentoDetallePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, error, loading, reload } = useAsyncData(
    () =>
      id
        ? Promise.all([documentosService.obtener(id), configuracionService.obtener()])
        : Promise.reject(new Error('Falta el identificador del documento.')),
    [id],
  )
  const [accion, setAccion] = useState<string | null>(null)
  const [errorAccion, setErrorAccion] = useState<string | null>(null)
  const [tipoConversion, setTipoConversion] = useState<'FACTURA' | 'BOLETA'>('BOLETA')
  const [fechaConversion, setFechaConversion] = useState('')

  const documento = data?.[0]
  const empresa = data?.[1]?.empresa

  useEffect(() => {
    if (!documento) return
    setTipoConversion(documento.clienteTipoDocumento === 'RUC' ? 'FACTURA' : 'BOLETA')
    setFechaConversion(fechaISO(documento.fecha))
  }, [documento?.id])

  async function ejecutar(
    clave: string,
    operacion: () => Promise<unknown>,
    alTerminar?: (resultado: unknown) => void,
  ) {
    setAccion(clave)
    setErrorAccion(null)
    try {
      const resultado = await operacion()
      alTerminar?.(resultado)
      reload()
    } catch (err) {
      setErrorAccion(err instanceof Error ? err.message : 'No se pudo completar la acción.')
    } finally {
      setAccion(null)
    }
  }

  const cambiarEstado = (estado: EstadoDocumentoVenta) =>
    ejecutar(estado, () => documentosService.cambiarEstado(documento!.id, estado))

  if (loading) return <DocumentoDetalleSkeleton />

  if (error || !documento || !empresa) {
    return (
      <div className="px-4 lg:px-8">
        <PageHeader title="Documento" />
        <Alert tone="error" title="No se pudo cargar el documento">
          {error?.message ?? 'No hay datos para mostrar.'}
        </Alert>
        <div className="mt-4">
          <Link to="/documentos" className="text-sm font-medium text-tertiary hover:text-primary">
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
          title={`${ETIQUETAS_DOCUMENTO[documento.tipo]} ${numeroComprobante(documento.serie, documento.numero)}`}
          description="Ticket POS 80 listo para imprimir o guardar como PDF. Las acciones no envían nada a SUNAT."
          actions={
            <>
              <Button
                size="sm"
                variant="ghost"
                onPress={() => navigate('/documentos')}
                startIcon={<Icon name="arrow-left" className="size-4" />}
              >
                Volver al listado
              </Button>
              <Button size="sm" onClick={() => window.print()} startIcon={<Icon name="file-text" className="size-4" />}>
                Imprimir / guardar PDF
              </Button>
            </>
          }
        />

        <Card className="mb-4">
          <CardContent documentante={documento} />
        </Card>

        {errorAccion && (
          <div className="mb-4">
            <Alert tone="error">{errorAccion}</Alert>
          </div>
        )}

        <Card>
          <div className="flex flex-wrap items-center gap-2 border-b border-tertiary p-4">
            <h2 className="me-auto text-base font-semibold text-primary">Acciones</h2>
            {documento.estado === 'PENDIENTE' && (
              <>
                <Button
                  size="sm"
                  onClick={() => void cambiarEstado('APROBADO')}
                  isLoading={accion === 'APROBADO'}
                  startIcon={<Icon name="check" className="size-4" />}
                >
                  Aprobar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void cambiarEstado('RECHAZADO')}
                  isDisabled={accion !== null}
                >
                  Rechazar
                </Button>
              </>
            )}
            {documento.estado === 'APROBADO' && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void cambiarEstado('PENDIENTE')}
                  isDisabled={accion !== null}
                >
                  Volver a pendiente
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => void cambiarEstado('RECHAZADO')}
                  isDisabled={accion !== null}
                >
                  Rechazar
                </Button>
              </>
            )}
            {documento.estado === 'RECHAZADO' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => void cambiarEstado('PENDIENTE')}
                isDisabled={accion !== null}
              >
                Volver a pendiente
              </Button>
            )}
            {documento.comprobante && (
              <Button
                size="sm"
                variant="outline"
                onPress={() => navigate(`/comprobantes/${documento.comprobante!.id}`)}
                startIcon={<Icon name="receipt" className="size-4" />}
              >
                Ver comprobante{' '}
                {numeroComprobante(documento.comprobante.serie, documento.comprobante.numero)}
              </Button>
            )}
          </div>

          {documento.estado === 'APROBADO' &&
            !documento.comprobante &&
            documento.items.every((item) => item.productoId) && (
            <form
              className="grid gap-3 p-4 sm:grid-cols-3 sm:items-end"
              onSubmit={(evento) => {
                evento.preventDefault()
                void ejecutar(
                  'convertir',
                  () =>
                    documentosService.convertir(documento.id, {
                      tipo: tipoConversion,
                      fecha: fechaConversion,
                      observacion: documento.observacion ?? undefined,
                    }),
                  (resultado) => {
                    const convertido = resultado as { comprobante: { id: string } }
                    navigate(`/comprobantes/${convertido.comprobante.id}`)
                  },
                )
              }}
            >
              <Campo etiqueta="Convertir a">
                <Select
                  ariaLabel="Convertir a"
                  value={tipoConversion}
                  onChange={(valor) => setTipoConversion(valor as 'FACTURA' | 'BOLETA')}
                  options={[
                    { value: 'BOLETA', label: 'Boleta' },
                    {
                      value: 'FACTURA',
                      label: 'Factura',
                      disabled: documento.clienteTipoDocumento !== 'RUC',
                    },
                  ]}
                />
              </Campo>
              <Campo etiqueta="Fecha de emisión">
                <input
                  type="date"
                  value={fechaConversion}
                  min={fechaISO(documento.fecha)}
                  onChange={(evento) => setFechaConversion(evento.target.value)}
                  className={inputClass}
                  required
                />
              </Campo>
              <Button
                type="submit"
                className="h-10"
                isLoading={accion === 'convertir'}
                startIcon={<Icon name="refresh" className="size-4" />}
              >
                Convertir a comprobante
              </Button>
            </form>
            )}
          {documento.estado === 'APROBADO' &&
            !documento.comprobante &&
            documento.items.some((item) => !item.productoId) && (
              <div className="border-t border-tertiary p-4">
                <Alert tone="info" title="No se puede convertir">
                  Este documento tiene líneas escritas a mano sin producto de catálogo. Se puede
                  imprimir y entregar, pero no convertir a boleta o factura.
                </Alert>
              </div>
            )}
        </Card>
      </div>

      <div className="mx-auto w-full max-w-[80mm] pb-6">
        <TicketDocumento
          tipo={documento.tipo}
          empresa={{
            razonSocial: empresa.razonSocial,
            ruc: empresa.ruc,
            direccion: empresa.direccion,
          }}
          cliente={{
            razonSocial: documento.cliente,
            numeroDocumento: documento.clienteDocumento,
            direccion: documento.clienteDireccion,
          }}
          fecha={documento.fecha}
          fechaVencimiento={documento.fechaVencimiento}
          fechaEntrega={documento.fechaEntrega}
          solicitadoPor={documento.solicitadoPor}
          observacion={documento.observacion}
          items={documento.items.map((item) => ({
            codigo: '',
            descripcion: item.descripcion,
            unidad: '',
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario,
            total: item.total,
          }))}
          subtotal={documento.subtotal}
          igv={documento.igv}
          total={documento.total}
          numero={numeroComprobante(documento.serie, documento.numero)}
          guardado
        />
      </div>
    </>
  )
}

function CardContent({ documentante }: { documentante: DocumentoVenta }) {
  return (
    <div className="flex flex-wrap items-center gap-3 p-4 text-sm">
      <span className="text-tertiary">Estado actual:</span>
      <EstadoDocumentoBadge estado={documentante.estado} />
      <span className="text-tertiary">
        {fechaCorta(`${documentante.fecha}`)} · {documentante.items.length} productos
      </span>
    </div>
  )
}
