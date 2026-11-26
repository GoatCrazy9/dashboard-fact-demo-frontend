export interface FieldErrors {
  usuario?: string
  password?: string
}

export const USUARIO_MAX_LENGTH = 255

export function validateUsuario(value: string): string | undefined {
  const usuario = value.trim()
  if (!usuario) return 'Ingresa tu usuario.'
  if (usuario.length > USUARIO_MAX_LENGTH) return 'El usuario no puede superar los 255 caracteres.'
  return undefined
}

export function validatePassword(value: string): string | undefined {
  if (!value) return 'Ingresa tu contraseña.'
  if (value.length < 8) return 'La contraseña debe tener al menos 8 caracteres.'
  return undefined
}

export function validateLoginForm(values: { usuario: string; password: string }): FieldErrors {
  const errors: FieldErrors = {}
  const usuarioError = validateUsuario(values.usuario)
  const passwordError = validatePassword(values.password)
  if (usuarioError) errors.usuario = usuarioError
  if (passwordError) errors.password = passwordError
  return errors
}
