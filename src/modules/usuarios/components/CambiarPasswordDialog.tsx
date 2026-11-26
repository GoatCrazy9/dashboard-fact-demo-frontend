import { useEffect, useState, type FormEvent } from 'react'
import { Alert } from '@/shared/ui/Alert'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { Icon } from '@/shared/ui/icons'
import { TextField } from '@/shared/ui/TextField'
import type { UsuarioGestion } from '../types'
import { usuariosService } from '../service/usuariosService'

interface CambiarPasswordDialogProps {
  open: boolean
  usuario: UsuarioGestion | null
  onClose: () => void
  onCambiado: (nombre: string) => void
}

export function CambiarPasswordDialog({
  open,
  usuario,
  onClose,
  onCambiado,
}: CambiarPasswordDialogProps) {
  const [password, setPassword] = useState('')
  const [repetir, setRepetir] = useState('')
  const [visible, setVisible] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return

    setPassword('')
    setRepetir('')
    setVisible(false)
    setError(null)

    const alEscape = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') onClose()
    }
    const desbordamiento = document.body.style.overflow
    document.addEventListener('keydown', alEscape)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', alEscape)
      document.body.style.overflow = desbordamiento
    }
  }, [open, usuario?.id, onClose])

  if (!open || !usuario) return null

  const longitudValida = password.length >= 8
  const coinciden = password.length > 0 && password === repetir

  const ojo = (
    <button
      type="button"
      onClick={() => setVisible((actual) => !actual)}
      aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
      className="cursor-pointer rounded p-1 text-tertiary transition hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      <Icon name={visible ? 'eye-off' : 'eye'} className="size-4" />
    </button>
  )

  async function handleSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (password !== repetir) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setGuardando(true)
    try {
      await usuariosService.cambiarPassword(usuario!.id, { password })
      onCambiado(usuario!.nombre)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cambiar la contraseña.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 backdrop-blur-[2px] sm:items-center sm:p-4"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget && !guardando) onClose()
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-cambiar-password"
        className="flex max-h-[94dvh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-primary shadow-2xl ring-1 ring-tertiary ring-inset sm:rounded-2xl"
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-secondary px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-start gap-3">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-primary text-brand-secondary ring-1 ring-brand ring-inset">
              <Icon name="lock" className="size-5" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 id="titulo-cambiar-password" className="text-display-xs font-semibold text-primary">
                  Cambiar contraseña
                </h2>
                <Badge tone="brand">Seguridad</Badge>
              </div>
              <p className="mt-1 truncate text-sm text-tertiary">
                {usuario.nombre} · @{usuario.usuario}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-tertiary transition hover:bg-primary_hover hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            <Icon name="close" className="size-5" />
          </button>
        </header>

        <form onSubmit={(evento) => void handleSubmit(evento)} noValidate className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
            {error && (
              <div className="mb-5">
                <Alert tone="error" title="Revisa la contraseña">
                  {error}
                </Alert>
              </div>
            )}

            <div className="flex flex-col gap-4">
              <TextField
                label="Nueva contraseña"
                requiredMark
                type={visible ? 'text' : 'password'}
                value={password}
                onChange={setPassword}
                placeholder="Mínimo 8 caracteres"
                maxLength={128}
                inputClassName="text-md"
                hint={`${password.length} caracteres · ${longitudValida ? 'longitud válida' : 'mínimo 8'}`}
                endAdornment={ojo}
                autoFocus
              />
              <TextField
                label="Repetir contraseña"
                requiredMark
                type={visible ? 'text' : 'password'}
                value={repetir}
                onChange={setRepetir}
                placeholder="Vuelve a escribirla"
                maxLength={128}
                inputClassName="text-md"
                hint={repetir.length > 0 ? (coinciden ? 'Coinciden.' : 'No coinciden todavía.') : 'Vuelve a escribir la misma contraseña.'}
                endAdornment={ojo}
              />
              {password.length > 0 && (
                <p className="flex items-center gap-1.5 text-xs text-tertiary">
                  <Icon
                    name={coinciden ? 'check' : 'warning'}
                    className={coinciden ? 'size-3.5 text-fg-success-primary' : 'size-3.5 text-fg-warning-primary'}
                  />
                  {coinciden ? 'Las contraseñas coinciden.' : 'Revisa la longitud y la repetición antes de guardar.'}
                </p>
              )}
              <div className="rounded-xl bg-secondary p-3.5 ring-1 ring-tertiary ring-inset">
                <p className="text-sm text-secondary">
                  La nueva contraseña se guarda cifrada y se usará en el próximo inicio de sesión.
                </p>
              </div>
            </div>
          </div>

          <footer className="shrink-0 border-t border-secondary bg-primary px-5 py-4 sm:px-6">
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                isDisabled={guardando}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                isLoading={guardando}
                startIcon={<Icon name="check" className="size-4" />}
                className="w-full sm:w-auto"
              >
                Cambiar contraseña
              </Button>
            </div>
          </footer>
        </form>
      </section>
    </div>
  )
}
