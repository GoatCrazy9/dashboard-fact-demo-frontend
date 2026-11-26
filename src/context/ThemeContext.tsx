/* oxlint-disable react/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { flushSync } from 'react-dom'

export type Theme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'theme'

export interface PuntoRevelado {
  x: number
  y: number
}

interface ThemeContextValue {
  theme: Theme
  /** Si se pasa el origen del clic, el cambio se revela con un círculo. */
  toggleTheme: (origen?: PuntoRevelado) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function readStoredTheme(): Theme {
  const stored = localStorage.getItem(THEME_STORAGE_KEY)
  if (stored === 'dark' || stored === 'light') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * Untitled UI conmuta el modo oscuro con `.dark-mode`. `.dark` se mantiene porque hay
 * componentes que todavía usan la variante anterior y no se han migrado.
 */
function applyThemeClass(theme: Theme) {
  const root = document.documentElement
  root.classList.toggle('dark-mode', theme === 'dark')
  root.classList.toggle('dark', theme === 'dark')
  root.setAttribute('data-color-scheme', theme)
}

function guardarTema(theme: Theme) {
  applyThemeClass(theme)
  localStorage.setItem(THEME_STORAGE_KEY, theme)
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // El script de index.html ya aplicó la clase antes de pintar; aquí solo se refleja en el estado.
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.classList.contains('dark-mode') ||
    document.documentElement.classList.contains('dark')
      ? 'dark'
      : 'light',
  )

  useEffect(() => {
    guardarTema(theme)
  }, [theme])

  const toggleTheme = useCallback(
    (origen?: PuntoRevelado) => {
      const siguiente: Theme = theme === 'light' ? 'dark' : 'light'
      const vista = document as unknown as {
        startViewTransition?: (callback: () => void) => unknown
      }
      const sinAnimacion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

      if (!origen || !vista.startViewTransition || sinAnimacion) {
        guardarTema(siguiente)
        setTheme(siguiente)
        return
      }

      // Radio suficiente para cubrir el viewport desde el botón pulsado.
      const raiz = document.documentElement
      raiz.style.setProperty('--reveal-x', `${origen.x}px`)
      raiz.style.setProperty('--reveal-y', `${origen.y}px`)
      raiz.style.setProperty(
        '--reveal-radius',
        `${Math.hypot(
          Math.max(origen.x, window.innerWidth - origen.x),
          Math.max(origen.y, window.innerHeight - origen.y),
        )}px`,
      )

      vista.startViewTransition(() => {
        // La instantánea nueva debe tomarse con el tema ya aplicado.
        guardarTema(siguiente)
        flushSync(() => setTheme(siguiente))
      })
    },
    [theme],
  )

  const value = useMemo<ThemeContextValue>(() => ({ theme, toggleTheme }), [theme, toggleTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme debe usarse dentro de <ThemeProvider>')
  return context
}

export { readStoredTheme }
