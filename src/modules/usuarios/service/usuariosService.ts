import { apiFetch } from '@/shared/services/apiClient'
import type {
  ActualizarAccesoInput,
  CambiarPasswordInput,
  CrearUsuarioInput,
  UsuarioGestion,
} from '../types'

export const usuariosService = {
  listar: () => apiFetch<UsuarioGestion[]>('/usuarios'),

  crear: (datos: CrearUsuarioInput) =>
    apiFetch<UsuarioGestion>('/usuarios', {
      method: 'POST',
      body: JSON.stringify(datos),
    }),

  actualizarAcceso: (id: string, datos: ActualizarAccesoInput) =>
    apiFetch<UsuarioGestion>(`/usuarios/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(datos),
    }),

  cambiarPassword: (id: string, datos: CambiarPasswordInput) =>
    apiFetch<void>(`/usuarios/${encodeURIComponent(id)}/password`, {
      method: 'PATCH',
      body: JSON.stringify(datos),
    }),
}
