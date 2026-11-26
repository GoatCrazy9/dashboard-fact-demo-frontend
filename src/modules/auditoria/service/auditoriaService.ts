import { apiFetch } from '@/shared/services/apiClient'
import type { FiltrosAuditoria, RespuestaAuditoria } from '@/shared/types'

export const auditoriaService = {
  listar: (filtros: FiltrosAuditoria = {}) => {
    const consulta = new URLSearchParams()
    if (filtros.usuario) consulta.set('usuario', filtros.usuario)
    if (filtros.modulo) consulta.set('modulo', filtros.modulo)
    if (filtros.accion) consulta.set('accion', filtros.accion)
    if (filtros.resultado) consulta.set('resultado', filtros.resultado)
    if (filtros.desde) consulta.set('desde', filtros.desde)
    if (filtros.hasta) consulta.set('hasta', filtros.hasta)
    consulta.set('limite', String(filtros.limite ?? 20))
    consulta.set('offset', String(filtros.offset ?? 0))
    return apiFetch<RespuestaAuditoria>(`/auditoria?${consulta.toString()}`)
  },
}
