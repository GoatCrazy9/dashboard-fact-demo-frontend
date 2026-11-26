import { useEffect, useId, useState } from 'react'
import type { FormEvent } from 'react'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { Icon } from '@/shared/ui/icons'
import { TextField } from '@/shared/ui/TextField'
import { MAX_FAILED_ATTEMPTS } from '../service/authService'
import type { FieldErrors } from '../utils/validators'
import {
  validateLoginForm,
  validatePassword,
  validateUsuario,
} from '../utils/validators'
import { RememberUser } from './RememberUser'

interface LoginFormProps {
  usuario: string
  password: string
  remember: boolean
  submitting: boolean
  serverError: string | null
  remainingAttempts: number
  onUsuarioChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onRememberChange: (checked: boolean) => void
  onSubmit: () => void
}

export function LoginForm({
  usuario,
  password,
  remember,
  submitting,
  serverError,
  remainingAttempts,
  onUsuarioChange,
  onPasswordChange,
  onRememberChange,
  onSubmit,
}: LoginFormProps) {
  const formId = useId()
  const [errors, setErrors] = useState<FieldErrors>({})
  const [touched, setTouched] = useState({ usuario: false, password: false })
  const [showPassword, setShowPassword] = useState(false)
  const [mostrarAyuda, setMostrarAyuda] = useState(false)

  useEffect(() => {
    setErrors({})
  }, [usuario, password])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors = validateLoginForm({ usuario, password })
    setErrors(nextErrors)
    setTouched({ usuario: true, password: true })

    if (nextErrors.usuario || nextErrors.password) {
      document
        .getElementById(nextErrors.usuario ? `${formId}-usuario` : `${formId}-password`)
        ?.focus()
      return
    }

    onSubmit()
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex w-full flex-col gap-4">
      {serverError && <Alert tone="error">{serverError}</Alert>}

      <div className="flex flex-col gap-4">
        <TextField
          id={`${formId}-usuario`}
          label="Usuario"
          requiredMark
          type="text"
          name="username"
          autoComplete="username"
          placeholder="Ingresa tu usuario"
          value={usuario}
          isDisabled={submitting}
          inputClassName="text-md"
          error={touched.usuario ? errors.usuario : undefined}
          onChange={(value) => {
            onUsuarioChange(value)
            if (errors.usuario) setErrors((actuales) => ({ ...actuales, usuario: undefined }))
          }}
          onBlur={() => {
            setTouched((actuales) => ({ ...actuales, usuario: true }))
            setErrors((actuales) => ({ ...actuales, usuario: validateUsuario(usuario) }))
          }}
        />

        <TextField
          id={`${formId}-password`}
          label="Contraseña"
          requiredMark
          type={showPassword ? 'text' : 'password'}
          name="password"
          autoComplete="current-password"
          placeholder="••••••••••••"
          value={password}
          isDisabled={submitting}
          inputClassName="text-md"
          error={touched.password ? errors.password : undefined}
          endAdornment={
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              className="flex cursor-pointer items-center justify-center text-fg-quaternary transition duration-100 ease-linear hover:text-fg-quaternary_hover"
            >
              <Icon name={showPassword ? 'eye-off' : 'eye'} className="size-4" />
            </button>
          }
          onChange={(value) => {
            onPasswordChange(value)
            if (errors.password) setErrors((actuales) => ({ ...actuales, password: undefined }))
          }}
          onBlur={() => {
            setTouched((actuales) => ({ ...actuales, password: true }))
            setErrors((actuales) => ({ ...actuales, password: validatePassword(password) }))
          }}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <RememberUser
          checked={remember}
          onChange={onRememberChange}
          disabled={submitting}
          label="Recordarme 30 días"
          showHint={false}
        />
        <button
          type="button"
          onClick={() => setMostrarAyuda((visible) => !visible)}
          className="cursor-pointer rounded text-sm font-semibold text-brand-secondary hover:text-brand-secondary_hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          ¿Olvidaste tu contraseña?
        </button>
      </div>

      {mostrarAyuda && (
        <p className="text-sm text-tertiary">
          Pide al administrador o al maestro que restablezca tu contraseña.
        </p>
      )}

      {remainingAttempts < MAX_FAILED_ATTEMPTS && (
        <p className="text-sm text-tertiary">
          Te quedan{' '}
          <span className="font-semibold text-primary">{remainingAttempts}</span>{' '}
          {remainingAttempts === 1 ? 'intento' : 'intentos'} antes del bloqueo temporal.
        </p>
      )}

      <Button type="submit" loading={submitting} fullWidth size="md" className="text-md">
        {submitting ? 'Verificando credenciales…' : 'Iniciar sesión'}
      </Button>
    </form>
  )
}
