import { apiDownload, apiFetch } from '@/shared/services/apiClient'
import type { ResumenSunat, TipoResumenSunat } from '@/shared/types'

export interface CrearResumenDiarioInput {
  fecha: string
  observacion?: string
}

export interface CrearBajaInput {
  fecha: string
  comprobanteIds: string[]
  observacion?: string
}

export type ArchivoResumen = 'xml' | 'zip' | 'cdr'

export const resumenesService = {
  configuracion: () => apiFetch<{ envioReal: boolean; modo: 'local' | 'beta' | 'produccion' }>('/resumenes/config'),

  listar: (tipo?: TipoResumenSunat) =>
    apiFetch<ResumenSunat[]>(`/resumenes${tipo ? `?tipo=${tipo}` : ''}`),

  obtener: (id: string) => apiFetch<ResumenSunat>(`/resumenes/${id}`),

  crearDiario: (datos: CrearResumenDiarioInput) =>
    apiFetch<ResumenSunat>('/resumenes/diario', {
      method: 'POST',
      body: JSON.stringify(datos),
    }),

  crearBaja: (datos: CrearBajaInput) =>
    apiFetch<ResumenSunat>('/resumenes/bajas', {
      method: 'POST',
      body: JSON.stringify(datos),
    }),

  reenviar: (id: string) =>
    apiFetch<ResumenSunat>(`/resumenes/${id}/reenviar`, { method: 'POST' }),

  consultarEstado: (id: string) =>
    apiFetch<ResumenSunat>(`/resumenes/${id}/estado`, { method: 'POST' }),

  descargarArchivo: (id: string, tipo: ArchivoResumen) =>
    apiDownload(`/resumenes/${id}/archivo/${tipo}`),
}
