import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import type { Role } from '@/modules/autenticacion/types'

/** Permite la ruta solo a los roles indicados. */
export function RequireRole({ roles, redirectTo = '/' }: { roles: Role[]; redirectTo?: string }) {
  const { user } = useAuth()

  if (!user || !roles.includes(user.rol)) {
    return <Navigate to={redirectTo} replace />
  }

  return <Outlet />
}
