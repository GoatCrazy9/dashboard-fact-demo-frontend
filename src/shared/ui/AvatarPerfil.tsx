import AvatarBoring from 'boring-avatars'
import { cn } from '@/shared/utils/cn'

/** Paleta azul institucional, en el mismo orden que la identidad de la app. */
const COLORES = ['#bfdbfe', '#60a5fa', '#3b82f6', '#1d4ed8', '#1e3a8a']

interface AvatarPerfilProps {
  /** Semilla estable: normalmente el usuario de la sesión. */
  nombre: string
  /** Diámetro en píxeles. */
  tamano?: number
  /** Punto verde de "en línea", igual que el avatar anterior del panel. */
  enLinea?: boolean
  /** Nombre real para el lector de pantalla. */
  etiqueta?: string
  className?: string
}

/**
 * Avatar de perfil generado por boring-avatars (boringavatars.com).
 * Se dibuja en local como SVG: no llama a ninguna API externa ni expone datos.
 */
export function AvatarPerfil({
  nombre,
  tamano = 40,
  enLinea = false,
  etiqueta,
  className,
}: AvatarPerfilProps) {
  const semilla = nombre.trim() || 'Mueblería José'
  return (
    <span className={cn('relative inline-flex shrink-0', className)}>
      <AvatarBoring
        name={semilla}
        size={tamano}
        variant="beam"
        colors={COLORES}
        role="img"
        aria-label={etiqueta ?? `Avatar de ${semilla}`}
      />
      {enLinea && (
        <span
          aria-hidden="true"
          className="absolute right-0 bottom-0 size-2.5 rounded-full bg-fg-success-secondary ring-2 ring-primary"
        />
      )}
    </span>
  )
}
