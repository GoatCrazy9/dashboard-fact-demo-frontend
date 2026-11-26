import { cn } from '@/shared/utils/cn'

/** Chip de selección (toggle). Usado en formularios y filtros: chips de días, duración y sedes. */
export function Chip({
  etiqueta,
  activo,
  onToggle,
  size = 'md',
}: {
  etiqueta: string
  activo: boolean
  onToggle: () => void
  /** 'sm' reduce el chip para barras de filtros densas. */
  size?: 'sm' | 'md'
}) {
  return (
    <button
      type="button"
      aria-pressed={activo}
      onClick={onToggle}
      className={cn(
        'cursor-pointer rounded-full border transition-colors',
        size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-sm',
        activo
          ? 'border-brand-solid bg-brand-solid text-white shadow-xs-skeuomorphic'
          : 'border-tertiary bg-primary text-secondary hover:border-brand',
      )}
    >
      {etiqueta}
    </button>
  )
}