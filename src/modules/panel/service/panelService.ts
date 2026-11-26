import { apiFetch } from '@/shared/services/apiClient'
import type { PanelResumen } from '@/shared/types'

export const panelService = {
  resumen: () => apiFetch<PanelResumen>('/panel/resumen'),
}
