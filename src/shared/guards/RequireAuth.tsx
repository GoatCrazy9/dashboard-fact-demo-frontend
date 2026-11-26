import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

/** Protege el dashboard; conserva la ruta solicitada para volver tras el login. */
export function RequireAuth() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />
  }

  return <Outlet />
}
