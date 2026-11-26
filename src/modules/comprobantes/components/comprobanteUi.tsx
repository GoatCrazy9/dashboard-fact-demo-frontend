import { Badge } from '@/shared/ui/Badge'
import type { EstadoComprobante, TipoComprobante } from '@/shared/types'

const TONOS: Record<EstadoComprobante, 'gray' | 'success' | 'error' | 'warning'> = {
  BORRADOR: 'gray',
  EMITIDO: 'warning',
  ACEPTADO: 'success',
  RECHAZADO: 'error',
  ANULADO: 'gray',
}

export function EstadoBadge({ estado }: { estado: EstadoComprobante }) {
  return <Badge tone={TONOS[estado]}>{estado}</Badge>
}

export const ETIQUETAS_TIPO: Record<TipoComprobante, string> = {
  FACTURA: 'Factura',
  BOLETA: 'Boleta',
  NOTA_CREDITO: 'Nota de crédito',
  NOTA_DEBITO: 'Nota de débito',
  GUIA_REMISION: 'Guía de remisión',
}
