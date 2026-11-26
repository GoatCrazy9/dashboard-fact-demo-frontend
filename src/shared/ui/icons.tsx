import type { LucideIcon, LucideProps } from 'lucide-react'
import { ICONOS } from '@/shared/config/iconos'

export type IconName = keyof typeof ICONOS

export type IconProps = Omit<LucideProps, 'ref'> &
  ({ name: IconName; icon?: never } | { icon: LucideIcon; name?: never })

/** Iconos de lucide-react: por nombre corto (`compartido/configuracion/iconos.ts`) o importados directamente. */
export function Icon({ name, icon, className = 'size-6', ...rest }: IconProps) {
  const Componente = icon ?? ICONOS[name as IconName]
  return <Componente aria-hidden="true" className={className} {...rest} />
}
