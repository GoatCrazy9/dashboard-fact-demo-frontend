import type { ComprobanteResumen } from '@/shared/types'

const esNota = (comprobante: ComprobanteResumen) =>
  comprobante.tipo === 'NOTA_CREDITO' || comprobante.tipo === 'NOTA_DEBITO'

/** Misma regla del backend: boletas vigentes y notas que afectan a una boleta. */
export const esResumible = (comprobante: ComprobanteResumen): boolean =>
  (comprobante.estado === 'EMITIDO' || comprobante.estado === 'ACEPTADO') &&
  (comprobante.tipo === 'BOLETA' ||
    (esNota(comprobante) && Boolean(comprobante.documentoAfectado?.startsWith('B'))))

export const esBajable = (comprobante: ComprobanteResumen): boolean =>
  comprobante.estado === 'ANULADO'
