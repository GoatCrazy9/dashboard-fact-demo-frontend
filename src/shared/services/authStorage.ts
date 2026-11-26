/** Almacenamiento de sesión compartido por el cliente API y el módulo de autenticación. */
export const SESSION_STORAGE_KEY = 'sicap.session'
export const SESSION_CHANGED_EVENT = 'sicap:session-changed'

export interface StoredSession {
  token: string
  expiresAt: number
}

function read<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export function getStoredSession<T extends StoredSession = StoredSession>(): T | null {
  const session = read<T>(SESSION_STORAGE_KEY)
  if (!session || !session.token || !session.expiresAt) return null
  if (session.expiresAt <= Date.now()) {
    clearStoredSession()
    return null
  }
  return session
}

export function saveStoredSession(session: StoredSession): void {
  try {
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
  } catch {
    // Sin storage disponible: la sesión solo dura en memoria.
  }
  window.dispatchEvent(new Event(SESSION_CHANGED_EVENT))
}

export function clearStoredSession(): void {
  try {
    window.localStorage.removeItem(SESSION_STORAGE_KEY)
  } catch {
    // Sin storage disponible.
  }
  window.dispatchEvent(new Event(SESSION_CHANGED_EVENT))
}

export function getStoredToken(): string | null {
  return getStoredSession()?.token ?? null
}
