import { Badge } from '@/shared/ui/Badge'
import type { EstadoGuia, EstadoGuiaSunat, ModalidadGuia, MotivoGuia } from '@/shared/types'

export const ETIQUETAS_MOTIVO: Record<MotivoGuia, string> = {
  VENTA: 'Venta',
  TRASLADO: 'Traslado',
  DEVOLUCION: 'Devolución',
  OTRO: 'Otro',
}

export const ETIQUETAS_MODALIDAD: Record<ModalidadGuia, string> = {
  PUBLICO: 'Público',
  PRIVADO: 'Privado',
}

const ESTADO_SUNAT: Record<
  EstadoGuiaSunat | 'SIN_ENVIO',
  { etiqueta: string; tono: 'success' | 'error' | 'warning' | 'gray' }
> = {
  ACEPTADO: { etiqueta: 'Aceptado por SUNAT', tono: 'success' },
  PENDIENTE: { etiqueta: 'En proceso en SUNAT', tono: 'warning' },
  RECHAZADO: { etiqueta: 'Rechazado por SUNAT', tono: 'error' },
  ERROR_ENVIO: { etiqueta: 'Error de envío', tono: 'error' },
  SIN_ENVIO: { etiqueta: 'Sin envío', tono: 'gray' },
}

export function EstadoGuiaBadge({ estado }: { estado: EstadoGuia }) {
  return (
    <Badge tone={estado === 'EMITIDA' ? 'success' : 'error'}>
      {estado === 'EMITIDA' ? 'Emitida' : 'Anulada'}
    </Badge>
  )
}

export function EstadoGuiaSunatBadge({ estado }: { estado: EstadoGuiaSunat | null }) {
  const dato = ESTADO_SUNAT[estado ?? 'SIN_ENVIO']
  return <Badge tone={dato.tono}>{dato.etiqueta}</Badge>
}
