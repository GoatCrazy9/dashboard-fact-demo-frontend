import { apiFetch } from '@/shared/services/apiClient'
import type { Detraccion } from '@/shared/types'

export const detraccionesService = {
  listar: () => apiFetch<Detraccion[]>('/detracciones'),
}
