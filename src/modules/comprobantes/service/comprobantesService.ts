import { apiDownload, apiFetch } from '@/shared/services/apiClient'
import type { CdrInfo, ComprobanteDetalle, ComprobanteResumen } from '@/shared/types'

export interface NuevoComprobanteItem {
  productoId: string
  cantidad: number
  precioUnitario?: number
}

export interface NuevoComprobante {
  tipo: 'FACTURA' | 'BOLETA' | 'NOTA_CREDITO' | 'NOTA_DEBITO'
  clienteId: string
  fecha: string
  items: NuevoComprobanteItem[]
  observacion?: string
  comprobanteAfectadoId?: string
  motivoNota?: string
}

export const comprobantesService = {
  listar: () => apiFetch<ComprobanteResumen[]>('/comprobantes'),
  obtener: (id: string) => apiFetch<ComprobanteDetalle>(`/comprobantes/${id}`),
  crear: (payload: NuevoComprobante) =>
    apiFetch<ComprobanteResumen>('/comprobantes', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  anular: (id: string, motivo: string) =>
    apiFetch<ComprobanteResumen>(`/comprobantes/${id}/anular`, {
      method: 'POST',
      body: JSON.stringify({ motivo }),
    }),
  consultarCdr: (id: string) => apiFetch<CdrInfo>(`/comprobantes/${id}/cdr`),
  reenviar: (id: string) =>
    apiFetch<ComprobanteResumen>(`/comprobantes/${id}/reenviar`, { method: 'POST' }),
  qr: (id: string) => apiFetch<{ dataUrl: string }>(`/comprobantes/${id}/qr`),
  descargarPdf: (id: string) => apiDownload(`/comprobantes/${id}/pdf`),
  descargarArchivo: (id: string, tipo: 'xml' | 'zip' | 'cdr') =>
    apiDownload(`/comprobantes/${id}/archivo/${tipo}`),
}
