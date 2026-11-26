import { apiDownload, apiFetch } from '@/shared/services/apiClient'
import type { RangoVentas, ReporteVentas } from '@/shared/types'

const consulta = (rango: RangoVentas) =>
  `desde=${encodeURIComponent(rango.desde)}&hasta=${encodeURIComponent(rango.hasta)}`

export const reportesService = {
  ventas: (rango: RangoVentas) =>
    apiFetch<ReporteVentas>(`/reportes/ventas?${consulta(rango)}`),
  descargarExcel: (rango: RangoVentas) =>
    apiDownload(`/reportes/ventas/excel?${consulta(rango)}`),
  descargarPdf: (rango: RangoVentas) =>
    apiDownload(`/reportes/ventas/pdf?${consulta(rango)}`),
}
