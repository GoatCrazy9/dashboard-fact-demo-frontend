import { descargarBlob } from '@/shared/utils/descargar'
import { apiDownload } from './apiClient'

export type FormatoExport = 'pdf' | 'excel'

export interface ColumnaExport {
  titulo: string
  /** Ancho relativo en la tabla; el PDF lo escala al ancho de la página. */
  ancho: number
  alineacion?: 'izquierda' | 'derecha'
}

export interface TablaExport {
  titulo: string
  nombreArchivo: string
  columnas: ColumnaExport[]
  filas: (string | number | null)[][]
}

/** Genera el archivo en el backend y descarga exactamente las filas visibles en la tabla. */
export async function descargarTabla(tabla: TablaExport, formato: FormatoExport) {
  const archivo = await apiDownload('/exportaciones', {
    method: 'POST',
    body: JSON.stringify({ formato, ...tabla }),
  })
  descargarBlob(archivo.blob, archivo.filename)
}
