import { ApiError, apiFetch } from '@/shared/services/apiClient'
import {
  clearStoredSession,
  getStoredSession,
  saveStoredSession,
} from '@/shared/services/authStorage'
import type {
  AuthUser,
  DemoCredential,
  LoginCredentials,
  LockState,
  Session,
} from '../types'

/** 5 intentos fallidos consecutivos bloquean la cuenta, igual que en demo. */
export const MAX_FAILED_ATTEMPTS = 5
export const LOCKOUT_DURATION_MS = 5 * 60 * 1000
export const ATTEMPT_WINDOW_MS = 15 * 60 * 1000

const STORAGE_KEYS = {
  attempts: 'demo.login.attempts',
  lock: 'demo.login.lock',
  rememberedUser: 'demo.remembered-user',
} as const

export const AUTH_MESSAGES = {
  invalidCredentials: 'Usuario o contraseña inválidos',
  accountLocked: 'Cuenta bloqueada temporalmente por intentos fallidos',
  accountInactive: 'Tu cuenta está inactiva. Contacta al administrador.',
  unexpected: 'No se pudo completar el ingreso. Inténtalo nuevamente.',
}

export class AuthError extends Error {
  readonly code: string
  readonly lockedUntil: number | null

  constructor(code: string, message: string, lockedUntil: number | null = null) {
    super(message)
    this.name = 'AuthError'
    this.code = code
    this.lockedUntil = lockedUntil
  }
}

interface AttemptRecord {
  fails: number
  lastFailureAt: number
  lockedUntil: number | null
}

interface LockRecord {
  usuario: string
  lockedUntil: number
}

interface BackendLoginResponse {
  user: AuthUser
  token: string
  expiresAt: number
}

function normalizeUsuario(usuario: string): string {
  return usuario.trim().toLowerCase()
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Sin storage disponible.
  }
}

function remove(key: string): void {
  try {
    window.localStorage.removeItem(key)
  } catch {
    // Sin storage disponible.
  }
}

function readAttempts(): Record<string, AttemptRecord> {
  return readJson<Record<string, AttemptRecord>>(STORAGE_KEYS.attempts, {})
}

function freshAttempt(): AttemptRecord {
  return { fails: 0, lastFailureAt: 0, lockedUntil: null }
}

export function getLockState(): LockState {
  const lock = readJson<LockRecord | null>(STORAGE_KEYS.lock, null)
  if (!lock || lock.lockedUntil <= Date.now()) {
    if (lock) remove(STORAGE_KEYS.lock)
    return { usuario: null, lockedUntil: null, remainingAttempts: MAX_FAILED_ATTEMPTS }
  }
  return { usuario: lock.usuario, lockedUntil: lock.lockedUntil, remainingAttempts: 0 }
}

/** Intentos que le quedan al usuario indicado antes del bloqueo temporal. */
export function getRemainingAttempts(usuario: string): number {
  const normalized = normalizeUsuario(usuario)
  const lock = getLockState()
  if (lock.lockedUntil && lock.usuario === normalized) return 0
  const attempt = readAttempts()[normalized] ?? freshAttempt()
  if (attempt.lastFailureAt + ATTEMPT_WINDOW_MS < Date.now() && !attempt.lockedUntil) {
    return MAX_FAILED_ATTEMPTS
  }
  return Math.max(0, MAX_FAILED_ATTEMPTS - attempt.fails)
}

export function getRememberedUser(): string {
  try {
    return window.localStorage.getItem(STORAGE_KEYS.rememberedUser) ?? ''
  } catch {
    return ''
  }
}

export function rememberUser(usuario: string): void {
  try {
    window.localStorage.setItem(STORAGE_KEYS.rememberedUser, normalizeUsuario(usuario))
  } catch {
    // Sin storage disponible.
  }
}

export function forgetRememberedUser(): void {
  remove(STORAGE_KEYS.rememberedUser)
}

export function getSession(): Session | null {
  return getStoredSession<Session>()
}

/** Credenciales públicas del demo local, servidas desde el entorno del backend. */
export async function fetchDemoCredentials(): Promise<DemoCredential[]> {
  const datos = await apiFetch<{ credentials: DemoCredential[] }>(
    '/autenticacion/demo-credentials',
  )
  return Array.isArray(datos.credentials) ? datos.credentials : []
}

/** Verifica la sesión guardada contra el backend; si no sirve, la descarta. */
export async function verificarSesion(): Promise<AuthUser | null> {
  try {
    const respuesta = await apiFetch<{ user: AuthUser }>('/autenticacion/me')
    return respuesta.user
  } catch {
    clearStoredSession()
    return null
  }
}

function esRespuestaLogin(datos: unknown): datos is BackendLoginResponse {
  if (!datos || typeof datos !== 'object') return false
  const respuesta = datos as Record<string, unknown>
  if (typeof respuesta.token !== 'string' || typeof respuesta.expiresAt !== 'number') return false
  const user = respuesta.user as Record<string, unknown> | undefined
  return Boolean(
    user &&
      typeof user.id === 'string' &&
      typeof user.nombre === 'string' &&
      typeof user.usuario === 'string' &&
      typeof user.rol === 'string',
  )
}

function activarBloqueo(usuario: string, lockedUntil = Date.now() + LOCKOUT_DURATION_MS): never {
  writeJson(STORAGE_KEYS.lock, { usuario, lockedUntil } satisfies LockRecord)
  throw new AuthError('ACCOUNT_LOCKED', AUTH_MESSAGES.accountLocked, lockedUntil)
}

export async function login({ usuario, password }: LoginCredentials): Promise<Session> {
  const normalized = normalizeUsuario(usuario)
  const intentos = readAttempts()
  const intento = intentos[normalized] ?? freshAttempt()
  const ahora = Date.now()

  const lock = getLockState()
  if (lock.lockedUntil && lock.usuario === normalized) {
    activarBloqueo(normalized, lock.lockedUntil)
  }

  if (intento.lockedUntil && intento.lockedUntil <= ahora) {
    delete intentos[normalized]
    writeJson(STORAGE_KEYS.attempts, intentos)
  } else if (intento.lastFailureAt + ATTEMPT_WINDOW_MS < ahora) {
    intento.fails = 0
    intento.lockedUntil = null
  }

  let respuesta: BackendLoginResponse
  try {
    const datos = await apiFetch<BackendLoginResponse>('/autenticacion/login', {
      method: 'POST',
      body: JSON.stringify({ usuario: normalized, password }),
    })
    if (!esRespuestaLogin(datos)) throw new Error('Respuesta de login inválida')
    respuesta = datos
  } catch (error) {
    if (error instanceof AuthError) throw error

    if (error instanceof ApiError) {
      if (error.code === 'ACCOUNT_LOCKED' || error.status === 423) {
        activarBloqueo(normalized)
      }
      if (error.code === 'ACCOUNT_INACTIVE') {
        throw new AuthError('ACCOUNT_INACTIVE', error.message)
      }
      if (error.status === 400 || error.status === 401) {
        intento.fails += 1
        intento.lastFailureAt = Date.now()
        if (intento.fails >= MAX_FAILED_ATTEMPTS) {
          intentos[normalized] = { ...intento, fails: 0, lockedUntil: Date.now() + LOCKOUT_DURATION_MS }
          writeJson(STORAGE_KEYS.attempts, intentos)
          activarBloqueo(normalized)
        }
        intentos[normalized] = intento
        writeJson(STORAGE_KEYS.attempts, intentos)
        throw new AuthError('INVALID_CREDENTIALS', AUTH_MESSAGES.invalidCredentials)
      }
      throw new AuthError('NETWORK_ERROR', error.message)
    }

    throw new AuthError('NETWORK_ERROR', AUTH_MESSAGES.unexpected)
  }

  delete intentos[normalized]
  writeJson(STORAGE_KEYS.attempts, intentos)
  remove(STORAGE_KEYS.lock)

  const session: Session = {
    user: {
      id: respuesta.user.id,
      nombre: respuesta.user.nombre,
      usuario: respuesta.user.usuario,
      rol: respuesta.user.rol,
      puedeFacturar: respuesta.user.puedeFacturar,
    },
    token: respuesta.token,
    expiresAt: respuesta.expiresAt,
  }
  saveStoredSession(session)
  return session
}

export function logout(): void {
  void apiFetch('/autenticacion/logout', { method: 'POST' }).catch(() => {
    // El token es stateless; borrarlo en el cliente basta aunque falle la petición.
  })
  clearStoredSession()
}
