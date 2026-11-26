import { useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { ThemeToggleButton } from '@/shared/components/common/ThemeToggleButton'
import { Logo } from '@/shared/ui/Logo'
import { LoginForm } from '../components/LoginForm'
import {
  AuthError,
  AUTH_MESSAGES,
  forgetRememberedUser,
  getRemainingAttempts,
  getRememberedUser,
  MAX_FAILED_ATTEMPTS,
  rememberUser,
} from '../service/authService'
import type { LoginCredentials } from '../types'

/** Panel derecho: vista previa neutra del panel de la demo. */
const MOCKUP_SRC = '/login-mockup.svg'

export function LoginPage() {
  const { user, status, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const destino = (location.state as { from?: string } | null)?.from ?? '/'
  const mockupSrc = MOCKUP_SRC

  const [usuario, setUsuario] = useState(() => getRememberedUser())
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(() => getRememberedUser() !== '')
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [remainingAttempts, setRemainingAttempts] = useState(MAX_FAILED_ATTEMPTS)
  const [mockupError, setMockupError] = useState(false)

  useEffect(() => {
    setMockupError(false)
  }, [mockupSrc])

  if (status === 'authenticated' && user) {
    return <Navigate to={user.rol === 'MAESTRO' ? '/maestro' : destino} replace />
  }

  async function handleSubmit(credentials: LoginCredentials) {
    setSubmitting(true)
    setServerError(null)

    try {
      const sesion = await login(credentials)
      if (remember) rememberUser(credentials.usuario)
      else forgetRememberedUser()
      navigate(sesion.user.rol === 'MAESTRO' ? '/maestro' : destino, { replace: true })
    } catch (error) {
      if (error instanceof AuthError) {
        setServerError(error.message)
        setRemainingAttempts(getRemainingAttempts(credentials.usuario))
        if (error.code === 'ACCOUNT_LOCKED') {
          navigate('/bloqueado', { replace: true })
          return
        }
        setPassword('')
      } else {
        setServerError(AUTH_MESSAGES.unexpected)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="grid min-h-dvh grid-cols-1 bg-primary lg:grid-cols-[minmax(0,640px)_minmax(0,1fr)]">
      <div className="relative flex min-w-0 flex-col bg-primary">
        <div className="absolute start-4 top-4 z-20">
          <ThemeToggleButton />
        </div>

        <main className="relative z-10 flex w-full flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6 md:px-8 md:py-20">
          <div className="flex w-full max-w-90 flex-col gap-8">
            <div className="flex flex-col gap-4 md:gap-8">
              <div className="hidden h-12 items-center md:flex">
                <Logo size="lg" />
              </div>

              <div className="flex md:hidden">
                <Logo compact size="lg" />
              </div>

              <div className="flex flex-col gap-2 md:gap-3">
                <h1 className="text-xl font-semibold text-primary md:text-display-xs">
                  Inicia sesión
                </h1>
                <p className="text-md text-tertiary">
                  Bienvenido de nuevo. Ingresa tus datos para continuar.
                </p>
              </div>
            </div>

            <LoginForm
              usuario={usuario}
              password={password}
              remember={remember}
              submitting={submitting}
              serverError={serverError}
              remainingAttempts={remainingAttempts}
              onUsuarioChange={setUsuario}
              onPasswordChange={setPassword}
              onRememberChange={setRemember}
              onSubmit={() => void handleSubmit({ usuario, password })}
            />

            <p className="text-center text-sm text-tertiary">
              ¿No tienes una cuenta? Solicita acceso al administrador.
            </p>
          </div>
        </main>

        <footer className="hidden p-8 pt-11 lg:block">
          <p className="text-sm text-tertiary">© {new Date().getFullYear()} Demo Facturación</p>
        </footer>
      </div>

      <div className="relative hidden min-w-0 items-center justify-center overflow-hidden bg-tertiary p-3 lg:flex xl:p-4">
        <div className="w-full max-w-[68rem] rounded-[9px] bg-primary p-[1px] shadow-lg ring-[1px] ring-secondary_alt md:rounded-[27px] md:p-[3.5px] md:ring-[1.68px]">
          <div className="rounded-[8px] bg-primary p-0.5 shadow-modern-mockup-inner-md md:rounded-[24px] md:p-1 md:shadow-modern-mockup-inner-lg">
            <div className="relative overflow-hidden rounded-[7px] bg-secondary ring-[1px] ring-secondary_alt md:rounded-[20px] md:ring-[1.68px]">
              {mockupError ? (
                <div className="grid min-h-[26rem] place-items-center bg-secondary text-center">
                  <div className="flex flex-col gap-2 px-6">
                    <p className="text-md font-semibold text-secondary">Vista previa del panel</p>
                    <p className="text-sm text-tertiary">
                      Pega tu imagen en <code>public{mockupSrc}</code>.
                    </p>
                  </div>
                </div>
              ) : (
                <img
                  src={mockupSrc}
                  alt="Vista previa del panel de Demo Facturación"
                  onError={() => setMockupError(true)}
                  className="block h-auto w-full object-contain"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
