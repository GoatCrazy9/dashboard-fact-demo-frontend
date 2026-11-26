import { apiFetch } from '@/shared/services/apiClient'
import type { MovimientoStock, Producto } from '@/shared/types'
import type { AjustarStockInput, CrearProductoInput } from '../types'

export const productosService = {
  listar: () => apiFetch<Producto[]>('/productos'),

  crear: (datos: CrearProductoInput) =>
    apiFetch<Producto>('/productos', {
      method: 'POST',
      body: JSON.stringify(datos),
    }),

  ajustarStock: (id: string, datos: AjustarStockInput) =>
    apiFetch<{ producto: Producto; movimiento: MovimientoStock }>(`/productos/${id}/ajustar`, {
      method: 'POST',
      body: JSON.stringify(datos),
    }),

  listarMovimientos: (id: string) => apiFetch<MovimientoStock[]>(`/productos/${id}/movimientos`),
}
