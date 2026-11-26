import type { DemoCredential } from '../types'

interface DemoCredentialsProps {
  credentials: DemoCredential[]
  loading: boolean
  onSelect: (credential: DemoCredential) => void
}

/** Cuadro público del demo local: muestra las credenciales y rellena el formulario. */
export function DemoCredentials({ credentials, loading, onSelect }: DemoCredentialsProps) {
  if (loading) {
    return (
      <div role="status" className="rounded-xl border border-secondary bg-primary p-4">
        <span className="sr-only">Cargando credenciales de prueba…</span>
        <div className="flex animate-pulse flex-col gap-2">
          <div className="h-4 w-36 rounded bg-secondary" />
          <div className="h-3 w-48 rounded bg-secondary" />
          <div className="mt-2 h-14 rounded-lg bg-secondary" />
          <div className="h-14 rounded-lg bg-secondary" />
        </div>
      </div>
    )
  }

  if (credentials.length === 0) return null

  return (
    <section
      aria-labelledby="demo-credentials-title"
      className="rounded-xl border border-secondary bg-primary p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 id="demo-credentials-title" className="text-sm font-semibold text-primary">
            Accesos de prueba
          </h2>
          <p className="text-sm text-tertiary">Haz clic en uno para llenar el formulario.</p>
        </div>
        <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-secondary">
          Demo
        </span>
      </div>

      <ul className="mt-3 flex flex-col gap-2">
        {credentials.map((credential) => (
          <li key={credential.username}>
            <button
              type="button"
              onClick={() => onSelect(credential)}
              aria-label={`Usar credencial de ${credential.label}`}
              className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg border border-secondary bg-primary px-3 py-2.5 text-left transition duration-100 ease-linear hover:bg-primary_hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="text-sm font-semibold text-primary">{credential.label}</span>
                <span className="break-all font-mono text-xs text-tertiary">
                  {credential.username} · {credential.password}
                </span>
              </span>
              <span className="shrink-0 rounded-md bg-brand-solid px-2.5 py-1 text-xs font-semibold text-white">
                Usar
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
