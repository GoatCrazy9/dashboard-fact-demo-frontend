import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

/** Espejo del middleware `accesoFacturacion`: maestro y vendedores sin permiso no entran. */
export function RequireFacturacion() {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to="/login" replace />
  }
  if (user.rol === 'MAESTRO') {
    return <Navigate to="/maestro" replace />
  }
  if (user.rol !== 'ADMIN' && user.puedeFacturar === false) {
    return <Navigate to="/sin-acceso" replace />
  }

  return <Outlet />
}
