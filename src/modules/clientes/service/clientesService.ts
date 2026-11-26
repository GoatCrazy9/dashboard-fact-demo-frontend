import { apiFetch } from '@/shared/services/apiClient'
import type { Cliente } from '@/shared/types'

export type CrearClienteInput = Omit<Cliente, 'id'>

export const clientesService = {
  listar: (q = '') => apiFetch<Cliente[]>(`/clientes${q ? `?q=${encodeURIComponent(q)}` : ''}`),

  crear: (datos: CrearClienteInput) =>
    apiFetch<Cliente>('/clientes', {
      method: 'POST',
      body: JSON.stringify(datos),
    }),
}
