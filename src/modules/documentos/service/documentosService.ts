import { apiFetch } from '@/shared/services/apiClient'
import type {
  ComprobanteDetalle,
  DocumentoVenta,
  EstadoDocumentoVenta,
  TipoDocumentoVenta,
} from '@/shared/types'

export interface CrearDocumentoInput {
  tipo: TipoDocumentoVenta
  clienteId: string
  fecha: string
  fechaVencimiento?: string
  fechaEntrega?: string
  solicitadoPor?: string
  observacion?: string
  items: {
    productoId?: string
    descripcion?: string
    cantidad: number
    precioUnitario?: number
  }[]
}

export interface ConvertirDocumentoInput {
  tipo: 'FACTURA' | 'BOLETA'
  fecha?: string
  observacion?: string
}

export const documentosService = {
  listar: (tipo?: TipoDocumentoVenta) =>
    apiFetch<DocumentoVenta[]>(`/documentos${tipo ? `?tipo=${tipo}` : ''}`),

  obtener: (id: string) => apiFetch<DocumentoVenta>(`/documentos/${id}`),

  crear: (datos: CrearDocumentoInput) =>
    apiFetch<DocumentoVenta>('/documentos', {
      method: 'POST',
      body: JSON.stringify(datos),
    }),

  cambiarEstado: (id: string, estado: EstadoDocumentoVenta) =>
    apiFetch<DocumentoVenta>(`/documentos/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ estado }),
    }),

  convertir: (id: string, datos: ConvertirDocumentoInput) =>
    apiFetch<{ documento: DocumentoVenta; comprobante: ComprobanteDetalle }>(
      `/documentos/${id}/convertir`,
      {
        method: 'POST',
        body: JSON.stringify(datos),
      },
    ),
}
