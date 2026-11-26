import { apiFetch } from '@/shared/services/apiClient'
import type { GuiaRemision, ModalidadGuia, MotivoGuia } from '@/shared/types'

export interface CrearGuiaInput {
  fechaEmision: string
  fechaTraslado: string
  clienteId: string
  motivo: MotivoGuia
  modalidad: ModalidadGuia
  pesoKg: number
  direccionPartida: string
  direccionLlegada: string
  ubigeoPartida?: string
  ubigeoLlegada?: string
  placa?: string
  conductor?: string
  conductorDocumento?: string
  conductorLicencia?: string
  transportistaRuc?: string
  transportistaRazonSocial?: string
  transportistaRegistroMtc?: string
  notas?: string
  comprobanteId?: string
  items: { productoId: string; cantidad: number }[]
}

export const guiasService = {
  listar: () => apiFetch<GuiaRemision[]>('/guias'),

  obtener: (id: string) => apiFetch<GuiaRemision>(`/guias/${id}`),

  crear: (datos: CrearGuiaInput) =>
    apiFetch<GuiaRemision>('/guias', {
      method: 'POST',
      body: JSON.stringify(datos),
    }),

  anular: (id: string, motivo: string) =>
    apiFetch<GuiaRemision>(`/guias/${id}/anular`, {
      method: 'POST',
      body: JSON.stringify({ motivo }),
    }),

  reenviar: (id: string) =>
    apiFetch<GuiaRemision>(`/guias/${id}/reenviar`, { method: 'POST' }),

  actualizarEstado: (id: string) =>
    apiFetch<GuiaRemision>(`/guias/${id}/actualizar-estado`, { method: 'POST' }),
}
