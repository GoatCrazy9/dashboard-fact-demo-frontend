/* oxlint-disable react/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  getSession,
  login as loginRequest,
  logout as logoutRequest,
  verificarSesion,
} from '@/modules/autenticacion/service/authService'
import { SESSION_CHANGED_EVENT } from '@/shared/services/authStorage'
import type { AuthUser, LoginCredentials, Session } from '@/modules/autenticacion/types'

type AuthStatus = 'authenticated' | 'unauthenticated'

interface AuthContextValue {
  user: AuthUser | null
  status: AuthStatus
  session: Session | null
  login: (credentials: LoginCredentials) => Promise<Session>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => getSession())

  useEffect(() => {
    function sincronizarSesion() {
      setSession(getSession())
    }

    window.addEventListener(SESSION_CHANGED_EVENT, sincronizarSesion)

    const guardada = getSession()
    if (guardada) {
      void verificarSesion().then((user) => {
        if (user) setSession({ ...guardada, user })
      })
    }

    return () => window.removeEventListener(SESSION_CHANGED_EVENT, sincronizarSesion)
  }, [])

  const login = useCallback(async (credentials: LoginCredentials) => {
    const nuevaSesion = await loginRequest(credentials)
    setSession(nuevaSesion)
    return nuevaSesion
  }, [])

  const logout = useCallback(() => {
    logoutRequest()
    setSession(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      status: session ? 'authenticated' : 'unauthenticated',
      session,
      login,
      logout,
    }),
    [session, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return context
}
