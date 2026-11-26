export function Spinner({ className = 'size-5' }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" aria-hidden="true">
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="3"
        fill="none"
        opacity="0.25"
      />
      <path
        d="M21 12a9 9 0 00-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}

export function FullPageSpinner({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div className="relative z-1 flex min-h-dvh flex-col items-center justify-center gap-3 bg-secondary">
      <Spinner className="size-8 text-brand-solid" />
      <p className="text-sm text-tertiary">{label}</p>
    </div>
  )
}