import { apiFetch } from '@/shared/services/apiClient'

/**
 * Consulta de documentos de identidad reutilizando el proveedor configurado en el
 * backend (`URL_RENIEC` / `TOKEN_CONSULTA_RENIEC`). El token nunca llega al navegador.
 * Contrato: GET /api/reniec/{dni|cee|ruc}/{numero}
 */
export type TipoDocumentoConsulta = 'dni' | 'cee' | 'ruc'

export interface DatosAutocompletado {
  tipoDocumento: 'DNI' | 'CEE' | 'RUC'
  numeroDocumento: string
  nombre: string | null
  direccion: string | null
  distrito: string | null
  provincia: string | null
  departamento: string | null
  ubigeo: string | null
}

type RespuestaBackend = {
  proveedor: string
  tipo_documento: string
  numero_documento: string | null
  nombres?: string | null
  apellido_paterno?: string | null
  apellido_materno?: string | null
  nombre_completo?: string | null
  razon_social?: string | null
  direccion?: string | null
  direccion_completa?: string | null
  distrito?: string | null
  provincia?: string | null
  departamento?: string | null
  ubigeo_reniec?: string | null
  ubigeo_sunat?: string | null
}

const PESOS_RUC = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]

/** Validación local para no gastar consultas con documentos mal formados. */
export function validarDocumento(tipo: TipoDocumentoConsulta, numero: string): string | null {
  const valor = tipo === 'cee' ? numero.trim().toUpperCase() : numero.trim()
  if (!valor) return 'Ingresa el número de documento.'
  if (tipo === 'dni' && !/^\d{8}$/.test(valor)) return 'El DNI tiene 8 dígitos.'
  if (tipo === 'cee' && !/^[A-Z0-9]{8,12}$/.test(valor))
    return 'El carné de extranjería tiene entre 8 y 12 letras o números.'
  if (tipo === 'ruc') {
    if (!/^(10|15|16|17|20)\d{9}$/.test(valor)) return 'El RUC tiene 11 dígitos.'
    const suma = PESOS_RUC.reduce((total, peso, i) => total + peso * Number(valor[i]), 0)
    if ((11 - (suma % 11)) % 10 !== Number(valor[10])) return 'El RUC ingresado no es válido.'
  }
  return null
}

const texto = (valor: string | null | undefined) => (valor?.trim() ? valor.trim() : null)

export async function consultarDocumento(
  tipo: TipoDocumentoConsulta,
  numero: string,
): Promise<DatosAutocompletado> {
  const valor = tipo === 'cee' ? numero.trim().toUpperCase() : numero.trim()
  const respuesta = await apiFetch<RespuestaBackend>(`/reniec/${tipo}/${encodeURIComponent(valor)}`)

  const nombre =
    tipo === 'ruc'
      ? texto(respuesta.razon_social)
      : (texto(respuesta.nombre_completo) ??
        [respuesta.nombres, respuesta.apellido_paterno, respuesta.apellido_materno]
          .map(texto)
          .filter(Boolean)
          .join(' ')) || null

  return {
    tipoDocumento: tipo.toUpperCase() as DatosAutocompletado['tipoDocumento'],
    numeroDocumento: texto(respuesta.numero_documento) ?? valor,
    nombre,
    direccion: texto(respuesta.direccion_completa) ?? texto(respuesta.direccion),
    distrito: texto(respuesta.distrito),
    provincia: texto(respuesta.provincia),
    departamento: texto(respuesta.departamento),
    ubigeo: texto(respuesta.ubigeo_reniec) ?? texto(respuesta.ubigeo_sunat),
  }
}
