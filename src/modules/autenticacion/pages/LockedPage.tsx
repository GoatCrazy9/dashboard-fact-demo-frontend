import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Logo } from '@/shared/ui/Logo'
import { Icon } from '@/shared/ui/icons'
import {
  getLockState,
  LOCKOUT_DURATION_MS,
  MAX_FAILED_ATTEMPTS,
} from '../service/authService'

function formatoCountdown(totalSegundos: number): string {
  const minutos = Math.floor(totalSegundos / 60)
  const segundos = totalSegundos % 60
  return `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`
}

export function LockedPage() {
  const [ahora, setAhora] = useState(() => Date.now())

  useEffect(() => {
    const temporizador = window.setInterval(() => setAhora(Date.now()), 1000)
    return () => window.clearInterval(temporizador)
  }, [])

  const estado = getLockState()
  const restanteMs = estado.lockedUntil ? Math.max(0, estado.lockedUntil - ahora) : 0
  const restanteSegundos = Math.ceil(restanteMs / 1000)

  if (!estado.lockedUntil || restanteMs === 0) {
    return <Navigate to="/login" replace />
  }

  const progreso = Math.round((restanteMs / LOCKOUT_DURATION_MS) * 100)

  return (
    <div className="relative z-1 flex min-h-dvh flex-col items-center justify-center bg-secondary px-5 py-12">
      <div className="mb-8">
        <Logo size="lg" />
      </div>

      <div className="w-full max-w-lg rounded-2xl bg-primary shadow-xs ring-1 ring-tertiary ring-inset">
        <div className="flex flex-col items-center px-6 py-8 text-center sm:px-8">
          <div className="flex size-14 items-center justify-center rounded-full bg-error-secondary">
            <Icon name="lock" className="size-7 text-fg-error-primary" />
          </div>
          <h1 className="mt-5 text-2xl font-semibold text-primary sm:text-display-sm">
            Acceso bloqueado temporalmente
          </h1>
          <p className="mt-3 max-w-md text-sm text-tertiary">
            Detectamos {MAX_FAILED_ATTEMPTS} intentos fallidos consecutivos. Por seguridad, la cuenta
            queda bloqueada unos minutos antes de volver a permitir el ingreso.
          </p>
          {estado.usuario && (
            <p className="mt-4 rounded-full bg-tertiary px-3 py-1.5 text-sm text-secondary">
              {estado.usuario}
            </p>
          )}
        </div>

        <div className="border-t border-tertiary px-6 py-6 sm:px-8">
          <div className="rounded-xl bg-secondary p-5 text-center">
            <p className="text-xs font-medium tracking-[0.14em] text-quaternary uppercase">
              Tiempo restante
            </p>
            <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-primary sm:text-display-sm">
              {formatoCountdown(restanteSegundos)}
            </p>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-tertiary">
              <div
                className="h-full rounded-full bg-brand-solid transition-[width] duration-1000 ease-linear"
                style={{ width: `${progreso}%` }}
              />
            </div>
            <p className="mt-3 text-xs text-tertiary">
              El bloqueo se libera solo, no hace falta volver a cargar la página.
            </p>
          </div>

          <div className="mt-6 flex justify-center">
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-solid px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-brand-solid_hover"
            >
              <Icon name="arrow-left" className="size-5" />
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
