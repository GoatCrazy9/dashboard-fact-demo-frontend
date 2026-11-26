import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/shared/ui/Button'
import { Icon } from '@/shared/ui/icons'

export function AccesoDenegadoPage() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center py-10 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-error-secondary">
        <Icon name="lock" className="size-7 text-fg-error-primary" />
      </div>
      <h1 className="mt-5 text-display-xs font-semibold text-primary">Sin acceso a facturación</h1>
      <p className="mt-2 text-sm text-tertiary">
        Tu cuenta está activa, pero aún no tiene permiso para entrar al sistema de facturación.
        Pide al maestro que te lo habilite desde el panel de usuarios.
      </p>
      <Button
        className="mt-6"
        variant="outline"
        onClick={() => {
          logout()
          navigate('/login', { replace: true })
        }}
      >
        <Icon name="logout" className="size-5" />
        Cerrar sesión
      </Button>
    </div>
  )
}
