import { apiFetch } from '@/shared/services/apiClient'
import type { ComprobanteResumen } from '@/shared/types'

export interface DetalleVenta {
  tipoCotizacion?: string
  numeroGuia?: string
  ordenCompra?: string
  solicitadoPor?: string
  fechaEntrega?: string
  formaPago?: string
  fechaPago?: string
  condicionesPago?: string
  moneda?: string
  tipoCambio?: number
}

export interface EmisionVenta {
  tipo: 'BOLETA' | 'FACTURA'
  cliente: {
    tipoDocumento: 'DNI' | 'RUC' | 'CE'
    numeroDocumento: string
    razonSocial: string
    direccion: string | null
    email: string | null
    telefono: string | null
  }
  fecha: string
  detraccionCodigo?: string
  detalle?: DetalleVenta
  items: {
    codigo: string
    descripcion: string
    unidad: string
    precioUnitario: number
    igv: number
    cantidad: number
  }[]
}

export const ventasService = {
  emitir: (datos: EmisionVenta) =>
    apiFetch<ComprobanteResumen>('/ventas/emitir', {
      method: 'POST',
      body: JSON.stringify(datos),
    }),
}
