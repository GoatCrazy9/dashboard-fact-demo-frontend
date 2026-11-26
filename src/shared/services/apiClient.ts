import { clearStoredSession, getStoredToken } from './authStorage'

export class ApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

const RUTAS_PUBLICAS = [
  '/autenticacion/login',
  '/autenticacion/logout',
  '/autenticacion/demo-credentials',
]

function cabeceras(): HeadersInit {
  const token = getStoredToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function lanzarError(response: Response, path: string): Promise<never> {
  if (response.status === 401 && !RUTAS_PUBLICAS.includes(path)) {
    clearStoredSession()
  }

  let code = 'ERROR'
  let message = `La operación falló (${response.status})`
  try {
    const body = (await response.json()) as { error?: { code?: string; message?: string } }
    code = body.error?.code ?? code
    message = body.error?.message ?? message
  } catch {
    // Respuesta sin JSON (proxy caído, HTML de error): se conserva el mensaje base.
  }
  throw new ApiError(response.status, code, message)
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    headers: { ...cabeceras(), ...init?.headers },
  })

  if (!response.ok) await lanzarError(response, path)
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

/** Descarga binaria con el mismo token; el backend decide el nombre del archivo. */
export async function apiDownload(
  path: string,
  init?: RequestInit,
): Promise<{ blob: Blob; filename: string }> {
  const response = await fetch(`/api${path}`, {
    ...init,
    headers: { ...cabeceras(), ...init?.headers },
  })
  if (!response.ok) await lanzarError(response, path)

  const disposicion = response.headers.get('Content-Disposition') ?? ''
  const filename = disposicion.match(/filename="?([^";]+)"?/i)?.[1] ?? 'descarga.xlsx'
  return { blob: await response.blob(), filename }
}
