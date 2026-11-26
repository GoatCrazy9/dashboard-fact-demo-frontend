import { Badge } from '@/shared/ui/Badge'
import type { EstadoDocumentoVenta, TipoDocumentoVenta } from '@/shared/types'

export const ETIQUETAS_DOCUMENTO: Record<TipoDocumentoVenta, string> = {
  COTIZACION: 'Proforma',
  PEDIDO: 'Pedido',
}

export const ETIQUETAS_ESTADO: Record<EstadoDocumentoVenta, string> = {
  PENDIENTE: 'Pendiente',
  APROBADO: 'Aprobado',
  RECHAZADO: 'Rechazado',
  CONVERTIDO: 'Convertido',
}

const TONOS: Record<EstadoDocumentoVenta, 'warning' | 'success' | 'error' | 'brand'> = {
  PENDIENTE: 'warning',
  APROBADO: 'success',
  RECHAZADO: 'error',
  CONVERTIDO: 'brand',
}

export function EstadoDocumentoBadge({ estado }: { estado: EstadoDocumentoVenta }) {
  return <Badge tone={TONOS[estado]}>{ETIQUETAS_ESTADO[estado]}</Badge>
}
