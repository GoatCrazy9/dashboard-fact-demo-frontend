import { apiFetch } from '@/shared/services/apiClient'
import type { ConfiguracionSunat } from '@/shared/types'

export const configuracionService = {
  obtener: () => apiFetch<ConfiguracionSunat>('/configuracion'),
}
