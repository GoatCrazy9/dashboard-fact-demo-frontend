export type Role = 'ADMIN' | 'MAESTRO' | 'VENDEDOR' | (string & {})

export interface AuthUser {
  id: string
  nombre: string
  usuario: string
  rol: Role
  puedeFacturar?: boolean
}

export interface Session {
  user: AuthUser
  token: string
  expiresAt: number
}

export interface LoginCredentials {
  usuario: string
  password: string
}

export interface DemoCredential {
  username: string
  password: string
  role: Role
  label: string
}

export type AuthErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'ACCOUNT_LOCKED'
  | 'ACCOUNT_INACTIVE'
  | 'NETWORK_ERROR'

export interface LockState {
  usuario: string | null
  lockedUntil: number | null
  remainingAttempts: number
}
