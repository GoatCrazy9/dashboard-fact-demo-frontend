import type { TipoDocumentoVenta } from '@/shared/types'
import { ETIQUETAS_DOCUMENTO } from './documentoUi'

export interface ItemTicket {
  codigo: string
  descripcion: string
  unidad: string
  cantidad: number
  precioUnitario: number
  total: number
}

interface TicketDocumentoProps {
  tipo: TipoDocumentoVenta
  empresa: { razonSocial: string; ruc: string; direccion: string }
  cliente: { razonSocial: string; numeroDocumento: string; direccion: string | null }
  fecha: string | null | undefined
  fechaVencimiento?: string | null
  fechaEntrega?: string | null
  solicitadoPor?: string | null
  observacion?: string | null
  items: ItemTicket[]
  subtotal: number
  igv: number
  total: number
  /** Número asignado por el backend. Si falta, se muestra como vista previa sin numerar. */
  numero?: string
  /** Cambia el pie del ticket cuando el documento ya está guardado. */
  guardado?: boolean
}

const numero = (valor: number) =>
  new Intl.NumberFormat('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor)

/** Fecha de calendario: el backend guarda medianoche UTC, sin desplazar el día. */
const fechaTicket = (valor: string | null | undefined) => {
  if (!valor) return '——/——/——'
  const dia = String(valor).slice(0, 10)
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'America/Lima',
  }).format(new Date(`${dia}T12:00:00`))
}

/** Ticket POS 80 compartido por la vista previa y el detalle guardado. */
export function TicketDocumento({
  tipo,
  empresa,
  cliente,
  fecha,
  fechaVencimiento,
  fechaEntrega,
  solicitadoPor,
  observacion,
  items,
  subtotal,
  igv,
  total,
  numero: numeroDocumento,
  guardado = false,
}: TicketDocumentoProps) {
  return (
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
      <div className="text-center font-bold uppercase">{empresa.razonSocial || 'DEMO COMERCIAL SAC'}</div>
      <div className="text-center">RUC: {empresa.ruc || '—'}</div>
      <div className="mt-1 text-center break-words">{empresa.direccion || '—'}</div>

      <div className="my-2 border-t border-dashed border-[#111]" />
      <div className="text-center font-bold uppercase">{ETIQUETAS_DOCUMENTO[tipo]}</div>
      {numeroDocumento ? (
        <div className="text-center font-semibold">{numeroDocumento}</div>
      ) : (
        <div className="text-center">SIN NUMERAR · VISTA PREVIA</div>
      )}
      <div className="text-center">{fechaTicket(fecha)}</div>
      {fechaVencimiento && <div className="text-center">VENCE: {fechaTicket(fechaVencimiento)}</div>}
      {fechaEntrega && <div className="text-center">ENTREGA: {fechaTicket(fechaEntrega)}</div>}
      <div className="my-2 border-t border-dashed border-[#111]" />

      <div className="break-words">CLIENTE: {cliente.razonSocial || '—'}</div>
      <div>RUC/DNI: {cliente.numeroDocumento || '—'}</div>
      {cliente.direccion && <div className="break-words">DIRECCIÓN: {cliente.direccion}</div>}
      {solicitadoPor && <div className="break-words">SOLICITADO POR: {solicitadoPor}</div>}
      <div className="my-2 border-t border-dashed border-[#111]" />

      <div className="grid grid-cols-[28px_28px_1fr_50px_58px] font-semibold">
        <span>CAN</span>
        <span>U.M</span>
        <span>COD.</span>
        <span className="text-right">P.UNIT</span>
        <span className="text-right">IMPORTE</span>
      </div>
      {items.length === 0 && <div className="mt-1 text-center">Sin ítems</div>}
      {items.map((item, indice) => (
        <div key={`${item.codigo}-${indice}`} className="mt-1">
          <div className="grid grid-cols-[28px_28px_1fr_50px_58px]">
            <span>{numero(item.cantidad)}</span>
            <span>{item.unidad.slice(0, 4)}</span>
            <span className="break-words">{item.codigo}</span>
            <span className="text-right">{numero(item.precioUnitario)}</span>
            <span className="text-right">{numero(item.total)}</span>
          </div>
          <div className="break-words pl-[56px]">{item.descripcion}</div>
        </div>
      ))}

      <div className="my-2 border-t border-dashed border-[#111]" />
      <div className="ml-auto w-[190px] space-y-0.5">
        <div className="flex justify-between">
          <span>Op/Grav.</span>
          <span>{numero(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>I.G.V</span>
          <span>{numero(igv)}</span>
        </div>
        <div className="flex justify-between font-bold">
          <span>Total</span>
          <span>S/ {numero(total)}</span>
        </div>
      </div>

      {observacion && (
        <div className="mt-2 break-words">
          <span className="font-semibold">OBS.:</span> {observacion}
        </div>
      )}

      <div className="my-2 border-t border-dashed border-[#111]" />
      <div className="text-center">
        {guardado
          ? 'DOCUMENTO GUARDADO · NO SE ENVÍA A SUNAT'
          : 'DOCUMENTO NO TRIBUTARIO · NO SE ENVÍA A SUNAT · NO GUARDADO'}
      </div>
      <div className="mt-2 text-center">Sistema DEMO RP</div>
    </div>
  )
}
