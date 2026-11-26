import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAsyncData } from '@/shared/hooks/useAsyncData'
import { descargarBlob } from '@/shared/utils/descargar'
import { numeroALetras } from '@/shared/utils/numeroALetras'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { Icon } from '@/shared/ui/icons'
import { PageHeader } from '@/shared/ui/PageHeader'
import { ComprobanteDetalleSkeleton } from '@/shared/ui/PaginasSkeleton'
import { configuracionService } from '@/modules/configuracion/service/configuracionService'
import { comprobantesService } from '../service/comprobantesService'
import { AccionesComprobante } from '../components/AccionesComprobante'
import { ETIQUETAS_TIPO } from '../components/comprobanteUi'

const numero = (valor: number) =>
  new Intl.NumberFormat('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor)

const fechaTicket = (iso: string) =>
  new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'America/Lima',
  }).format(new Date(iso))

const horaTicket = (iso: string) =>
  new Intl.DateTimeFormat('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'America/Lima',
  }).format(new Date(iso))

export function ComprobanteDetallePage() {
  const { id } = useParams()
  const [descargando, setDescargando] = useState<'pdf' | 'xml' | 'zip' | 'cdr' | null>(null)
  const [errorDescarga, setErrorDescarga] = useState<string | null>(null)
  const { data, error, loading, reload } = useAsyncData(
    () =>
      id
        ? Promise.all([
            comprobantesService.obtener(id),
            configuracionService.obtener(),
            comprobantesService.qr(id),
          ])
        : Promise.reject(new Error('Falta el identificador del comprobante.')),
    [id],
  )

  async function descargar(tipo: 'pdf' | 'xml' | 'zip' | 'cdr') {
    if (!id) return
    setDescargando(tipo)
    setErrorDescarga(null)
    try {
      const archivo =
        tipo === 'pdf'
          ? await comprobantesService.descargarPdf(id)
          : await comprobantesService.descargarArchivo(id, tipo)
      descargarBlob(archivo.blob, archivo.filename)
    } catch (err) {
      setErrorDescarga(err instanceof Error ? err.message : `No se pudo descargar el ${tipo}.`)
    } finally {
      setDescargando(null)
    }
  }

  if (loading) return <ComprobanteDetalleSkeleton />

  if (error || !data) {
    return (
      <div className="w-full px-4 lg:px-8">
        <PageHeader title="Comprobante" />
        <Alert tone="error" title="No se pudo cargar el comprobante">
          {error?.message ?? 'No hay datos para mostrar.'}
        </Alert>
        <div className="mt-4">
          <Link to="/comprobantes" className="text-sm font-medium text-tertiary hover:text-primary">
            Volver al listado
          </Link>
        </div>
      </div>
    )
  }

  const [comprobante, configuracion, qr] = data
  const { empresa } = configuracion
  const fechaISO = comprobante.creadoEn || comprobante.fecha
  const tipo = ETIQUETAS_TIPO[comprobante.tipo].toUpperCase()
  const simbolo = comprobante.moneda === 'USD' ? 'US$' : 'S/'
  const monedaTexto = comprobante.moneda === 'USD' ? 'DÓLARES' : 'SOLES'

  return (
    <div className="w-full px-4 lg:px-8">
      <div className="no-print">
        <PageHeader
          title="Vista previa POS 80"
          description="Ticket térmico de 80 mm con el QR de DEMO. Descarga el PDF generado en el servidor o usa Imprimir desde el navegador."
          actions={
            <>
              <Link
                to="/comprobantes"
                className="text-sm font-medium text-tertiary hover:text-primary"
              >
                Volver al listado
              </Link>
              <Button
                size="sm"
                variant="outline"
                onClick={() => void descargar('pdf')}
                isLoading={descargando === 'pdf'}
                isDisabled={descargando !== null}
                startIcon={<Icon name="download" />}
              >
                Descargar PDF
              </Button>
              {(['xml', 'zip', 'cdr'] as const).map((tipo) =>
                comprobante.archivos[tipo] ? (
                  <Button
                    key={tipo}
                    size="sm"
                    variant="outline"
                    onClick={() => void descargar(tipo)}
                    isLoading={descargando === tipo}
                    isDisabled={descargando !== null}
                    startIcon={<Icon name="file-text" />}
                  >
                    {tipo.toUpperCase()}
                  </Button>
                ) : null,
              )}
              <Button size="sm" onClick={() => window.print()} startIcon={<Icon name="file-text" />}>
                Imprimir ticket
              </Button>
            </>
          }
        />
        <AccionesComprobante comprobante={comprobante} onActualizado={reload} />
        {errorDescarga && (
          <div className="mt-3">
            <Alert tone="error" title="No se pudo descargar el archivo">
              {errorDescarga}
            </Alert>
          </div>
        )}
      </div>

      <div
        className="print-area mx-auto bg-white px-[3mm] py-[4mm] text-[#111] shadow-xs ring-1 ring-tertiary"
        style={{
          width: '80mm',
          maxWidth: '100%',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
          fontSize: '10px',
          lineHeight: 1.3,
        }}
      >
        <div className="text-center font-bold uppercase">DEMO COMERCIAL</div>
        <div className="text-center">De: Representante demo</div>
        <div className="text-center font-semibold">FABRICANTE DE MUEBLES DE DORMITORIO</div>
        <div className="text-center">RUC: {empresa.ruc}</div>
        <div className="mt-1 text-center">Venta de Colchones, Juego de Dormitorio, Camarote</div>
        <div className="text-center">Tarimas, Comodas y Veladores, Cabezeras Tapizadas</div>
        <div className="text-center">Modelos Exclusivos</div>
        <div className="mt-1 text-center">{empresa.direccion}</div>
        <div className="text-center">Cel.: 955 779 178</div>

        <div className="my-2 border-t border-dashed border-[#111]" />
        <div className="text-center font-bold">{tipo} ELECTRÓNICA</div>
        <div className="text-center font-semibold">
          {comprobante.serie} - {String(comprobante.numero).padStart(8, '0')}
        </div>
        <div className="text-center">{fechaTicket(comprobante.fecha)}</div>
        <div className="my-2 border-t border-dashed border-[#111]" />

        <div>CLIENTE: {comprobante.cliente}</div>
        <div>RUC/DNI: {comprobante.clienteDocumento}</div>
        {comprobante.clienteTelefono && <div>Teléfono: {comprobante.clienteTelefono}</div>}
        <div>CONDICIÓN DE PAGO: CONTADO</div>
        <div>MONEDA: {monedaTexto}</div>
        {comprobante.moneda === 'USD' && (
          <div>TIPO DE CAMBIO: {numero(comprobante.tipoCambio)}</div>
        )}
        {comprobante.documentoAfectado && (
          <div>DOC. AFECTADO: {comprobante.documentoAfectado}</div>
        )}
        {comprobante.motivoNota && <div>MOTIVO: {comprobante.motivoNota}</div>}
        {comprobante.estado === 'ANULADO' && <div className="font-bold">ANULADO</div>}
        <div className="my-2 border-t border-dashed border-[#111]" />

        <div className="grid grid-cols-[28px_28px_1fr_50px_58px] font-semibold">
          <span>CAN</span>
          <span>U.M</span>
          <span>DESCRIPCION</span>
          <span className="text-right">P.UNIT</span>
          <span className="text-right">IMPORTE</span>
        </div>
        {comprobante.items.map((item) => (
          <div key={item.id} className="mt-1">
            <div className="grid grid-cols-[28px_28px_1fr_50px_58px]">
              <span>{numero(item.cantidad)}</span>
              <span />
              <span />
              <span className="text-right">{numero(item.precioUnitario)}</span>
              <span className="text-right">{numero(item.total)}</span>
            </div>
            <div className="break-words pl-[56px]">{item.descripcion}</div>
            <div className="pl-[28px]">UNIDAD</div>
          </div>
        ))}

        <div className="my-2 border-t border-dashed border-[#111]" />
        <div className="ml-auto w-[190px] space-y-0.5">
          <div className="flex justify-between">
            <span>Op/Grav.</span>
            <span>{numero(comprobante.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>I.G.V</span>
            <span>
              {simbolo} {numero(comprobante.igv)}
            </span>
          </div>
          <div className="flex justify-between font-bold">
            <span>Importe Total</span>
            <span>
              {simbolo} {numero(comprobante.total)}
            </span>
          </div>
          {comprobante.detraccionCodigo !== '000' && (
            <div className="border-t border-dashed border-[#111] pt-0.5 text-[9px]">
              DETRACCIÓN {comprobante.detraccionCodigo} ({comprobante.detraccionTasa}%): {simbolo}{' '}
              {numero(comprobante.detraccionMonto)}
            </div>
          )}
        </div>

        <div className="mt-2">
          SON: {numeroALetras(comprobante.total)} {monedaTexto}
        </div>
        <div>
          ({comprobante.moneda}) - Forma de Pago: CONTADO · Efectivo={simbolo}
          {numero(comprobante.total)} · Cambio={simbolo}
          {numero(0)}
        </div>
        <div className="my-2 border-t border-dashed border-[#111]" />

        <div className="text-center">
          TODO CAMBIO O DEVOLUCION DEL PRODUCTO DEBE SER DENTRO DE LOS 3 DIAS CALENDARIOS CON SU
          RESPECTIVO COMPROBANTE SIEMPRE Y CUANDO EL PRODUCTO NO HAYA SIDO UTILIZADO Y CON EMPAQUES
          ORIGINALES, NO HAY DEVOLUCION DE DINERO
        </div>
        <div className="mt-2 text-center font-semibold">GRACIAS POR SU PREFERENCIA, VUELVA PRONTO</div>
        <div className="mt-2 text-center">
          Autorizado mediante SOL para la Emisión de Comprobantes Electrónicos desde los Sistemas
          del Contribuyente (SEE-DSC)
        </div>
        <div className="mt-1 text-center">
          Puede consultar este comprobante en:
          <br />
          http://www.sunat.gob.pe/ol-ti-itconsvalicpe/ConsValiCpe.htm
        </div>
        <div className="mt-2 flex justify-between">
          <span>Usuario: VENTAS</span>
          <span>Hora: {horaTicket(fechaISO)}</span>
        </div>
        {qr?.dataUrl && (
          <div className="mt-3 flex flex-col items-center gap-1 text-center">
            <img
              src={qr.dataUrl}
              alt="QR del comprobante DEMO"
              className="h-[110px] w-[110px] object-contain"
            />
            <span className="text-[8px] leading-tight">
              QR DEMO · {comprobante.serie}-{String(comprobante.numero).padStart(8, '0')}
              <br />
              Sin envío a SUNAT
            </span>
          </div>
        )}
        <div className="mt-2 text-center">Sistema DEMO RP</div>
      </div>
    </div>
  )
}
