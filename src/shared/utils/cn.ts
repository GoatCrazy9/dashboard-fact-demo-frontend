import { clsx } from 'clsx'
import type { ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// `text-display-*` no forma parte de la escala por defecto de tailwind-merge, así que sin
// esta extensión dos Utilities de display distintas no se anulan entre sí.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ['display-xs', 'display-sm', 'display-md', 'display-lg', 'display-xl', 'display-2xl'],
    },
  },
})

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/** Alias con el nombre que usa la librería de Untitled UI. */
export const cx = cn

/** Ordena las clases dentro de objetos de estilo. No altera el resultado. */
export function sortCx<T extends Record<string, unknown>>(classes: T): T {
  return classes
}