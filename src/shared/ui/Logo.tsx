import { cn } from '@/shared/utils/cn'

interface LogoProps {
  compact?: boolean
  size?: 'sm' | 'md' | 'lg'
  /** Texto claro para fondos oscuros, igual que el login de dojo. */
  inverted?: boolean
  className?: string
}

export function Logo({ compact = false, size = 'md', inverted = false, className }: LogoProps) {
  const esGrande = size === 'lg'
  const altura = esGrande ? 'h-10' : size === 'sm' ? 'h-6' : 'h-8'
  const titulo = esGrande ? 'text-lg' : size === 'sm' ? 'text-sm' : 'text-base'
  const subtitulo = esGrande ? 'text-xs' : size === 'sm' ? 'text-[10px]' : 'text-[11px]'

  // El SVG es negro: en tema oscuro (o sobre fondo oscuro) se invierte para que
  // siga siendo legible. En modo compacto es la única identidad visible.
  const marca = (
    <img
      src="/favicon.svg"
      alt={compact ? 'Mueblería José' : ''}
      className={cn(
        'w-auto shrink-0 object-contain',
        altura,
        inverted ? 'invert' : 'dark:invert',
      )}
    />
  )

  if (esGrande) {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        {marca}
        {!compact && <span className="leading-tight">
          <span
            className={cn(
              'block font-semibold',
              titulo,
              inverted ? 'text-primary_on-brand' : 'text-primary',
            )}
          >
            Mueblería José
          </span>
          <span
            className={cn(
              'block font-medium tracking-[0.18em] uppercase',
              subtitulo,
              inverted ? 'text-quaternary_on-brand' : 'text-quaternary',
            )}
          >
            Facturación electrónica
          </span>
        </span>}
      </div>
    )
  }

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      {marca}
      {!compact && (
        <div className="min-w-0 leading-tight">
          <p className={cn('truncate font-semibold', titulo, inverted ? 'text-white' : 'text-primary')}>
            Mueblería José
          </p>
          <p
            className={cn(
              'truncate font-medium tracking-[0.08em] uppercase',
              subtitulo,
              inverted ? 'text-white/70' : 'text-tertiary',
            )}
          >
            Facturación electrónica
          </p>
        </div>
      )}
    </div>
  )
}
